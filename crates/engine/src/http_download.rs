//! Multi-connection download of a normal HTTP file.
//!
//! Every connection ("worker") asks the segment table for work, downloads its
//! byte range with an HTTP Range request and writes straight into the right
//! offset of the `.sgpart` file. When a worker finishes it steals half of the
//! biggest remaining segment, so all connections stay busy until the end.

use crate::fileio::{hide, make_sparse, write_at};
use crate::http::{http_status_of, is_network_error, reconnect_delay, request, ConnGuard, HttpStatus, NetDrop, Progress, Shared};
use crate::model::RequestHeaders;
use crate::segments::{self, Segment};
use anyhow::{anyhow, bail};
use reqwest::header::RANGE;
use reqwest::StatusCode;
use std::fs::{File, OpenOptions};
use std::path::PathBuf;
use std::sync::atomic::{AtomicU32, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::task::JoinSet;
use tokio_util::sync::CancellationToken;

/// How long we wait for the next chunk before treating the connection as dead.
const STALL_TIMEOUT: Duration = Duration::from_secs(30);

#[derive(Clone)]
pub struct HttpJob {
    pub url: String,
    pub headers: RequestHeaders,
    pub user_agent: String,
    pub total_size: Option<u64>,
    pub resumable: bool,
    pub part_path: PathBuf,
    pub connections: u32,
    pub min_split: u64,
    pub retries: u32,
    /// Bytes from earlier stages of the same download (Dash: the video part
    /// when this job is the audio part), added to the progress counter.
    pub progress_base: u64,
    /// Ask for at most this many bytes per HTTP request. YouTube slows a
    /// connection down to playback speed when one request asks for too much,
    /// so for its servers we fetch each part in 10 MB requests.
    pub max_request: Option<u64>,
    /// this download's own speed limit (shared with its other parts)
    pub limiter: Arc<crate::limiter::SpeedLimiter>,
}

/// Request size limit for servers known to throttle big range requests.
pub fn max_request_for(url: &str) -> Option<u64> {
    let host = url::Url::parse(url).ok()?.host_str()?.to_ascii_lowercase();
    if host.ends_with("googlevideo.com") {
        Some(10 * 1024 * 1024)
    } else {
        None
    }
}

pub type SegTable = Arc<Mutex<Vec<Segment>>>;

#[derive(Debug)]
pub struct Cancelled;
impl std::fmt::Display for Cancelled {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("cancelled")
    }
}
impl std::error::Error for Cancelled {}

pub async fn run(
    shared: Arc<Shared>,
    job: HttpJob,
    segs: SegTable,
    progress: Arc<Progress>,
    cancel: CancellationToken,
) -> anyhow::Result<()> {
    if let Some(dir) = job.part_path.parent() {
        std::fs::create_dir_all(dir)?;
    }
    let segmented = job.resumable && job.total_size.is_some();
    let file = OpenOptions::new()
        .create(true)
        .read(true)
        .write(true)
        .truncate(false)
        .open(&job.part_path)?;
    hide(&job.part_path);

    {
        let mut table = segs.lock().unwrap();
        if segmented {
            let total = job.total_size.unwrap_or(0);
            let fresh = table.is_empty() || file.metadata()?.len() == 0 && segments::downloaded(&table) > 0;
            if fresh {
                *table = segments::plan(total, job.connections, job.min_split);
                file.set_len(0)?;
            }
            if file.metadata()?.len() != total {
                make_sparse(&file);
                file.set_len(total)?;
            }
        } else {
            // no ranges: always start over with one connection
            file.set_len(0)?;
            *table = vec![Segment::new(0, job.total_size.unwrap_or(u64::MAX))];
        }
        for s in table.iter_mut() {
            s.active = false;
        }
        progress
            .bytes
            .store(job.progress_base + segments::downloaded(&table), Ordering::Relaxed);
    }

    let file = Arc::new(file);
    let child = cancel.child_token();
    let workers = if segmented { job.connections.max(1) } else { 1 };
    let mut set = JoinSet::new();
    let gate = Arc::new(Gate::new(workers));
    for id in 0..workers {
        let ctx = Worker {
            id,
            gate: gate.clone(),
            shared: shared.clone(),
            job: job.clone(),
            segs: segs.clone(),
            progress: progress.clone(),
            file: file.clone(),
            cancel: child.clone(),
            segmented,
        };
        set.spawn(ctx.run());
    }

    let mut first_error: Option<anyhow::Error> = None;
    while let Some(res) = set.join_next().await {
        let res = res.map_err(|e| anyhow!("worker crashed: {e}")).and_then(|r| r);
        if let Err(e) = res {
            if first_error.is_none() && !cancel.is_cancelled() {
                first_error = Some(e);
            }
            child.cancel();
        }
    }
    file.sync_all().ok();

    if cancel.is_cancelled() {
        return Err(Cancelled.into());
    }
    if let Some(e) = first_error {
        return Err(e);
    }
    let table = segs.lock().unwrap();
    if segmented && !segments::all_finished(&table) {
        bail!("download ended before all parts were received");
    }
    Ok(())
}

/// A connection writes to disk when this much has arrived...
const FLUSH_BYTES: usize = 1 << 20;
/// ...or when its oldest unwritten byte is this old (so slow connections
/// still show their progress).
const FLUSH_EVERY: Duration = Duration::from_millis(200);

/// Bytes a connection has received but not written yet. The segment table
/// (`pos`) only ever counts bytes that are on disk, so a crash, a pause or a
/// cancel can lose at most one batch and resuming stays exact. Whatever is
/// held is also written when this is dropped (error, pause, cancel).
struct Pending<'a> {
    w: &'a Worker,
    idx: usize,
    req_end: u64,
    buf: Vec<u8>,
    since: std::time::Instant,
}

impl<'a> Pending<'a> {
    fn new(w: &'a Worker, idx: usize, req_end: u64) -> Self {
        Pending { w, idx, req_end, buf: Vec::with_capacity(FLUSH_BYTES + (64 << 10)), since: std::time::Instant::now() }
    }

    fn push(&mut self, data: &[u8]) {
        if self.buf.is_empty() {
            self.since = std::time::Instant::now();
        }
        self.buf.extend_from_slice(data);
    }

    /// Time to write: the batch is big, old, or completes the segment.
    fn due(&self) -> bool {
        if self.buf.len() >= FLUSH_BYTES || self.since.elapsed() >= FLUSH_EVERY {
            return true;
        }
        let t = self.w.segs.lock().unwrap();
        let s = &t[self.idx];
        s.pos + self.buf.len() as u64 >= s.end.min(self.req_end)
    }

    /// Writes what is held (never past the end of the segment: another
    /// connection may have taken the second half meanwhile). Returns true
    /// when this segment is complete as far as this request goes.
    fn flush(&mut self) -> anyhow::Result<bool> {
        let (pos, stop) = {
            let t = self.w.segs.lock().unwrap();
            let s = &t[self.idx];
            (s.pos, s.end.min(self.req_end))
        };
        let take = (self.buf.len() as u64).min(stop.saturating_sub(pos)) as usize;
        if take > 0 {
            write_at(&self.w.file, &self.buf[..take], pos)?;
            let counted = {
                let mut t = self.w.segs.lock().unwrap();
                let s = &mut t[self.idx];
                // `end` may have moved down while we wrote: count only what is ours
                s.pos = (pos + take as u64).min(s.end);
                s.pos.saturating_sub(pos)
            };
            self.w.progress.bytes.fetch_add(counted, Ordering::Relaxed);
            self.w.progress.online();
        }
        self.buf.clear();
        let t = self.w.segs.lock().unwrap();
        let s = &t[self.idx];
        Ok(s.pos >= s.end.min(self.req_end))
    }
}

impl Drop for Pending<'_> {
    fn drop(&mut self) {
        if !self.buf.is_empty() {
            let _ = self.flush();
        }
    }
}

/// What the server tolerates. A server that answers "too many requests"
/// (HTTP 429 / 503) is asked for fewer connections: the number allowed is
/// halved, everybody waits as long as the server says (Retry-After), and
/// the download goes on by itself. Nothing is shown as an error.
struct Gate {
    /// connections allowed now (a worker with a higher number retires)
    allowed: AtomicU32,
    /// the server's own wish (Retry-After, seconds), 0 = none given
    retry_after: AtomicU64,
    /// no further reduction until this moment (a burst of 429s counts once)
    hold_until: Mutex<Instant>,
    /// 429s in a row without any progress
    streak: AtomicU32,
}

impl Gate {
    fn new(n: u32) -> Self {
        Gate { allowed: AtomicU32::new(n.max(1)), retry_after: AtomicU64::new(0), hold_until: Mutex::new(Instant::now()), streak: AtomicU32::new(0) }
    }

    /// The server said "slow down". Returns how long this worker waits.
    fn throttled(&self) -> Duration {
        let streak = self.streak.fetch_add(1, Ordering::Relaxed) + 1;
        let said = self.retry_after.swap(0, Ordering::Relaxed);
        let wait = if said > 0 { said.min(120) } else { (2u64 << streak.min(5)).min(60) };
        let mut hold = self.hold_until.lock().unwrap();
        if Instant::now() >= *hold {
            let now = self.allowed.load(Ordering::Relaxed);
            self.allowed.store((now / 2).max(1), Ordering::Relaxed);
            *hold = Instant::now() + Duration::from_secs(wait);
        }
        Duration::from_secs(wait)
    }
}

/// Seconds from a Retry-After header ("120"; a date is ignored).
fn retry_after_secs(resp: &reqwest::Response) -> u64 {
    resp.headers().get(reqwest::header::RETRY_AFTER).and_then(|v| v.to_str().ok()).and_then(|v| v.trim().parse().ok()).unwrap_or(0)
}

struct Worker {
    id: u32,
    gate: Arc<Gate>,
    shared: Arc<Shared>,
    job: HttpJob,
    segs: SegTable,
    progress: Arc<Progress>,
    file: Arc<File>,
    cancel: CancellationToken,
    segmented: bool,
}

impl Worker {
    async fn run(self) -> anyhow::Result<()> {
        loop {
            // the server wants fewer connections: this one is no longer needed
            // (the others take over its work)
            if self.id >= self.gate.allowed.load(Ordering::Relaxed) {
                return Ok(());
            }
            let idx = {
                let mut table = self.segs.lock().unwrap();
                if self.segmented {
                    segments::claim_work(&mut table, self.job.min_split)
                } else {
                    let s = &mut table[0];
                    if s.active || s.is_finished() {
                        None
                    } else {
                        s.active = true;
                        Some(0)
                    }
                }
            };
            let Some(idx) = idx else { return Ok(()) };
            let result = self.download_segment(idx).await;
            {
                let mut table = self.segs.lock().unwrap();
                if let Some(s) = table.get_mut(idx) {
                    s.active = false;
                }
            }
            result?;
        }
    }

    /// Download one segment, retrying with back-off and continuing from where
    /// the previous attempt stopped.
    async fn download_segment(&self, idx: usize) -> anyhow::Result<()> {
        let mut attempt = 0u32;
        let mut net_tries = 0u32;
        loop {
            if self.cancel.is_cancelled() {
                return Err(Cancelled.into());
            }
            let before = self.segs.lock().unwrap()[idx].pos;
            let outcome = tokio::select! {
                r = self.fetch_once(idx) => r,
                _ = self.cancel.cancelled() => return Err(Cancelled.into()),
            };
            match outcome {
                Ok(()) => {
                    if self.segs.lock().unwrap()[idx].is_finished() {
                        return Ok(());
                    }
                    attempt = 0; // one request done, ask for the next piece
                    self.gate.streak.store(0, Ordering::Relaxed);
                }
                Err(e) => {
                    let after = self.segs.lock().unwrap()[idx].pos;
                    if after > before {
                        attempt = 0; // it was making progress, don't give up yet
                        net_tries = 0;
                    }
                    let network = is_network_error(&e);
                    let status = http_status_of(&e);
                    if matches!(status, Some(429 | 503)) {
                        // too many connections for this server: fewer, and wait
                        let wait = self.gate.throttled();
                        self.progress.waiting.store(true, Ordering::Relaxed);
                        if self.gate.streak.load(Ordering::Relaxed) > 40 {
                            return Err(e.context("the server keeps refusing: too many requests"));
                        }
                        tokio::select! {
                            _ = tokio::time::sleep(wait) => {},
                            _ = self.cancel.cancelled() => return Err(Cancelled.into()),
                        }
                        if self.id >= self.gate.allowed.load(Ordering::Relaxed) {
                            return Ok(()); // retire; the segment goes back to the others
                        }
                        continue;
                    }
                    if network {
                        // no internet / reset / stall: wait as long as it takes,
                        // the part keeps what it already has
                        net_tries += 1;
                        self.progress.waiting.store(true, Ordering::Relaxed);
                    } else {
                        attempt += 1;
                        // an expired or removed link won't come back by itself
                        let gone = matches!(status, Some(401 | 403 | 404 | 410));
                        let limit = if gone { self.job.retries.min(2) } else { self.job.retries };
                        if attempt > limit {
                            if gone {
                                return Err(e.context(
                                    "the link has expired or the file was removed - use \"Refresh download address\"",
                                ));
                            }
                            return Err(e);
                        }
                    }
                    if !self.segmented {
                        // can't resume without ranges: restart from zero
                        let mut table = self.segs.lock().unwrap();
                        let s = &mut table[idx];
                        self.progress.bytes.fetch_sub(s.done(), Ordering::Relaxed);
                        s.pos = s.start;
                        let _ = self.file.set_len(0);
                    }
                    let backoff = if network {
                        reconnect_delay(net_tries)
                    } else {
                        Duration::from_secs((1u64 << attempt.min(5)).min(30))
                    };
                    tokio::select! {
                        _ = tokio::time::sleep(backoff) => {},
                        // another part got through: the internet is back
                        _ = self.progress.back_online.notified() => {},
                        _ = self.cancel.cancelled() => return Err(Cancelled.into()),
                    }
                }
            }
        }
    }

    async fn fetch_once(&self, idx: usize) -> anyhow::Result<()> {
        let (pos, end) = {
            let table = self.segs.lock().unwrap();
            (table[idx].pos, table[idx].end)
        };
        if pos >= end {
            return Ok(());
        }
        // where this single request stops (the segment may need several)
        let req_end = match self.job.max_request {
            Some(limit) if self.segmented => end.min(pos + limit.max(1)),
            _ => end,
        };
        let mut rb = request(&self.shared.client(), &self.job.url, &self.job.headers, &self.job.user_agent);
        if self.segmented {
            rb = rb.header(RANGE, format!("bytes={}-{}", pos, req_end - 1));
        }
        let mut resp = rb.send().await?;
        let status = resp.status();
        if matches!(status.as_u16(), 429 | 503) {
            self.gate.retry_after.store(retry_after_secs(&resp), Ordering::Relaxed);
        }
        if self.segmented {
            if status != StatusCode::PARTIAL_CONTENT {
                if status.is_client_error() || status.is_server_error() {
                    return Err(HttpStatus(status.as_u16()).into());
                }
                bail!("server did not accept the byte range (HTTP {})", status.as_u16());
            }
        } else if !status.is_success() {
            return Err(HttpStatus(status.as_u16()).into());
        }
        let _guard = ConnGuard::new(&self.progress);

        // What arrives is collected here and written in big batches, outside
        // the lock: 32 connections no longer make a disk call for every
        // network packet (a packet is only ~16 KB).
        let mut pending = Pending::new(self, idx, req_end);
        loop {
            let chunk = match tokio::time::timeout(STALL_TIMEOUT, resp.chunk()).await {
                Ok(r) => r?,
                Err(_) => return Err(NetDrop("connection timed out").into()),
            };
            let Some(chunk) = chunk else { break };
            self.shared.limiter.acquire(chunk.len()).await;
            self.job.limiter.acquire(chunk.len()).await;
            pending.push(&chunk);
            if pending.due() && pending.flush()? {
                return Ok(()); // dropping `resp` closes the connection
            }
        }
        // the stream ended: write what is left
        pending.flush()?;

        // the server closed the stream
        let mut table = self.segs.lock().unwrap();
        let s = &mut table[idx];
        if !self.segmented && (self.job.total_size.is_none() || s.end == u64::MAX) {
            s.end = s.pos; // unknown size: end of stream means done
            return Ok(());
        }
        if s.pos >= s.end.min(req_end) {
            Ok(())
        } else {
            Err(NetDrop("connection closed early").into())
        }
    }
}

#[cfg(test)]
mod gate_tests {
    use super::*;

    #[test]
    fn too_many_requests_halves_the_connections_once_per_burst() {
        let g = Gate::new(32);
        g.retry_after.store(7, Ordering::Relaxed);
        assert_eq!(g.throttled(), Duration::from_secs(7)); // the server's own wish
        assert_eq!(g.allowed.load(Ordering::Relaxed), 16);
        // 31 other connections get the same answer at the same moment
        for _ in 0..31 {
            g.throttled();
        }
        assert_eq!(g.allowed.load(Ordering::Relaxed), 16);
    }

    #[test]
    fn never_below_one_connection() {
        let g = Gate::new(1);
        g.throttled();
        assert_eq!(g.allowed.load(Ordering::Relaxed), 1);
    }
}
