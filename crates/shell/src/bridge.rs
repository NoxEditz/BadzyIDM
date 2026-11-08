//! Engine <-> web UI bridge: download list as JSON for the UI, and UI commands for the engine.
use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use std::sync::Arc;
use swiftget_engine::manager::Manager;
use swiftget_engine::model::{DownloadKind, DownloadView, NewDownload, Status};

fn human_size(b: u64) -> String {
    const U: [&str; 5] = ["B", "KB", "MB", "GB", "TB"];
    let mut v = b as f64;
    let mut i = 0;
    while v >= 1024.0 && i < 4 {
        v /= 1024.0;
        i += 1;
    }
    if i == 0 { format!("{b} B") } else if v >= 100.0 { format!("{v:.0} {}", U[i]) } else { format!("{v:.2} {}", U[i]) }
}

fn human_eta(s: u64) -> String {
    match s {
        0..=59 => format!("{s} s"),
        60..=3599 => format!("{} min {:02} s", s / 60, s % 60),
        _ => format!("{} h {:02} min", s / 3600, (s % 3600) / 60),
    }
}

fn ago(t: DateTime<Utc>) -> String {
    let s = (Utc::now() - t).num_seconds().max(0);
    match s {
        0..=29 => "Just now".into(),
        30..=3599 => format!("{} min ago", (s / 60).max(1)),
        3600..=86399 => format!("{} h ago", s / 3600),
        _ => format!("{} days ago", s / 86400),
    }
}

fn kind_of(v: &DownloadView) -> &'static str {
    if v.kind == DownloadKind::Torrent {
        return "torrent";
    }
    let ext = v.file_name.rsplit('.').next().unwrap_or("").to_ascii_lowercase();
    match ext.as_str() {
        "mp4" | "mkv" | "avi" | "mov" | "webm" | "m3u8" | "flv" | "wmv" | "ts" => "video",
        "mp3" | "flac" | "wav" | "aac" | "ogg" | "m4a" | "opus" => "audio",
        "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" | "xz" => "archive",
        "exe" | "msi" | "apk" | "dmg" | "msix" => "program",
        "jpg" | "jpeg" | "png" | "gif" | "webp" | "bmp" | "svg" | "avif" => "image",
        "pdf" => "pdf",
        "doc" | "docx" | "txt" | "rtf" | "odt" => "doc",
        "xls" | "xlsx" | "csv" | "ods" => "sheet",
        "ppt" | "pptx" | "odp" => "slides",
        "iso" | "img" => "disc",
        _ => "general",
    }
}

pub fn rows_json(mgr: &Manager) -> String {
    let rows: Vec<Value> = mgr
        .snapshot()
        .iter()
        // a finished download whose file is gone from the disk is not shown
        .filter(|v| v.status != Status::Completed || v.save_path.exists())
        .map(|v| {
            let status = match v.status {
                Status::Completed => "finished",
                Status::Failed => "failed",
                Status::Paused => "paused",
                Status::Queued => "queued",
                _ => "running",
            };
            let running = v.status.is_running();
            json!({
                "id": v.id,
                "name": v.file_name,
                "kind": kind_of(v),
                "size": v.total_size.map(human_size).unwrap_or_else(|| "—".into()),
                "progress": (v.progress() * 100.0).clamp(0.0, 100.0),
                "status": status,
                "speed": if running && v.speed > 0.0 { format!("{}/s", human_size(v.speed as u64)) } else { "—".into() },
                "eta": match v.eta_secs { Some(s) if running => human_eta(s), _ => "—".into() },
                "lastTry": v.last_try.map(ago).unwrap_or_else(|| "—".into()),
                "added": ago(v.added_at),
                "saveTo": v.save_path.parent().map(|p| p.display().to_string()).unwrap_or_default(),
                "url": v.url,
                "path": v.save_path.display().to_string(),
                "error": v.error,
                "queue": if v.queue.is_some() { "Queue" } else { "Main" },
            })
        })
        .collect();
    serde_json::to_string(&rows).unwrap_or_else(|_| "[]".into())
}

/// Commands from the UI: {"cmd": "...", "arg": ...}
/// Returns the id of a download that was just added (the caller may open its progress window).
pub fn command(mgr: &Arc<Manager>, cmd: &str, arg: &Value) -> Option<u64> {
    let ids = || -> Vec<u64> { arg["ids"].as_array().map(|a| a.iter().filter_map(Value::as_u64).collect()).unwrap_or_default() };
    match cmd {
        "resume" => ids().into_iter().for_each(|i| mgr.start(i)),
        "pause" => ids().into_iter().for_each(|i| mgr.pause(i)),
        "settings" => {
            // merge the changed fields into the current settings and save
            if let (Ok(mut cur), Some(patch)) = (serde_json::to_value(mgr.settings()), arg.as_object()) {
                if let Some(o) = cur.as_object_mut() {
                    for (k, v) in patch {
                        o.insert(k.clone(), v.clone());
                    }
                }
                if let Ok(s) = serde_json::from_value::<swiftget_engine::Settings>(cur) {
                    let _ = mgr.set_settings(s);
                }
            }
        }
        "autostart" => {
            crate::autostart::set(arg["on"].as_bool().unwrap_or(false));
        }
        "resumeAll" => mgr.start_all(),
        "startQueue" => mgr.start_queue(swiftget_engine::config::MAIN_QUEUE),
        "stopQueue" => mgr.stop_queue(swiftget_engine::config::MAIN_QUEUE),
        "removeFinished" => mgr.remove_completed(),
        "redownload" => ids().into_iter().for_each(|i| mgr.restart(i)),
        "openFile" => {
            if let Some(v) = arg["id"].as_u64().and_then(|i| mgr.get(i)) {
                let _ = open::that(&v.save_path);
            }
        }
        "openFolder" => {
            if let Some(v) = arg["id"].as_u64().and_then(|i| mgr.get(i)) {
                #[cfg(windows)]
                {
                    use std::os::windows::process::CommandExt;
                    let target = if v.save_path.exists() { v.save_path.clone() } else { v.save_path.parent().map(Into::into).unwrap_or_default() };
                    let arg = if v.save_path.exists() { format!("/select,\"{}\"", target.display()) } else { format!("\"{}\"", target.display()) };
                    let _ = std::process::Command::new("explorer").raw_arg(arg).spawn();
                }
                #[cfg(not(windows))]
                if let Some(dir) = v.save_path.parent() {
                    let _ = open::that(dir);
                }
            }
        }
        "move" => {
            if let (Some(id), Some(dir), Some(name)) = (arg["id"].as_u64(), arg["dir"].as_str(), arg["name"].as_str()) {
                let _ = mgr.change_target(id, std::path::Path::new(dir), name);
            }
        }
        "pauseAll" => mgr.pause_all(),
        "remove" => {
            let file = arg["file"].as_bool().unwrap_or(false);
            ids().into_iter().for_each(|i| mgr.remove(i, file));
        }
        "add" => {
            if let Some(url) = arg["url"].as_str().filter(|u| !u.trim().is_empty()) {
                let mut headers = headers_from(&arg["extra"]);
                if let (Some(l), Some(p)) = (arg["login"].as_str().filter(|l| !l.is_empty()), arg["password"].as_str()) {
                    headers.auth = Some((l.to_string(), p.to_string()));
                }
                let extra = &arg["extra"];
                let id = mgr.add(NewDownload {
                    url: url.trim().to_string(),
                    file_name: arg["name"].as_str().filter(|n| !n.is_empty()).map(str::to_string),
                    save_dir: arg["dir"].as_str().filter(|d| !d.is_empty()).map(Into::into),
                    start: arg["start"].as_bool().unwrap_or(true),
                    connections: arg["connections"].as_u64().map(|c| c.clamp(1, 32) as u32),
                    description: arg["desc"].as_str().filter(|d| !d.is_empty()).map(str::to_string),
                    headers,
                    audio_url: extra["audioUrl"].as_str().map(str::to_string),
                    source_page: extra["sourcePage"].as_str().map(str::to_string),
                    source_key: extra["sourceKey"].as_str().map(str::to_string),
                    ..Default::default()
                });
                return Some(id);
            }
        }
        _ => {}
    }
    None
}

/// What to do with something sent by the browser extension.
pub enum FromBrowser {
    Nothing,
    /// show the "Download File Info" window with this data (the extension's request)
    Confirm(Value),
    /// added at once: id of the new download
    Added(u64),
}

pub fn from_browser(mgr: &Arc<Manager>, ev: crate::api::ApiEvent) -> FromBrowser {
    use std::sync::Mutex;
    use std::time::{Duration, Instant};
    static LAST: Mutex<Option<(String, Instant)>> = Mutex::new(None);
    match ev {
        crate::api::ApiEvent::Add(req) => {
            // an older add-in could send the same download over and over
            {
                let mut l = LAST.lock().unwrap();
                let now = Instant::now();
                if l.as_ref().is_some_and(|(u, at)| *u == req.url && now.duration_since(*at) < Duration::from_secs(10)) {
                    return FromBrowser::Nothing;
                }
                *l = Some((req.url.clone(), now));
            }
            if mgr.find_url(&req.url).is_some() {
                return FromBrowser::Nothing;
            }
            if mgr.settings().show_start_dialog {
                return FromBrowser::Confirm(json!({
                    "url": req.url,
                    "referrer": req.referrer,
                    "cookies": req.cookies,
                    "userAgent": req.user_agent,
                    "fileName": req.file_name,
                    "headers": req.headers,
                    "audioUrl": req.audio_url,
                    "sourcePage": req.source_page,
                    "sourceKey": req.source_key,
                }));
            }
            let extra = json!({
                "url": req.url, "referrer": req.referrer, "cookies": req.cookies, "userAgent": req.user_agent,
                "headers": req.headers, "audioUrl": req.audio_url, "sourcePage": req.source_page, "sourceKey": req.source_key,
            });
            let id = mgr.add(NewDownload {
                url: req.url,
                file_name: req.file_name,
                headers: headers_from(&extra),
                audio_url: req.audio_url,
                source_page: req.source_page,
                source_key: req.source_key,
                start: true,
                ..Default::default()
            });
            FromBrowser::Added(id)
        }
        // the Grabber and playlist windows come with the next steps
        crate::api::ApiEvent::Playlist(url) => {
            mgr.add(NewDownload { url, start: true, ..Default::default() });
            FromBrowser::Nothing
        }
        crate::api::ApiEvent::Links(_) | crate::api::ApiEvent::Show => FromBrowser::Nothing,
    }
}

/// "Check" in the Add window: ask the server what the file is. The answer goes back as JS.
pub async fn probe_js(mgr: Arc<Manager>, url: String, extra: Value) -> String {
    let headers = headers_from(&extra);
    let v = match mgr.probe(url.trim(), &headers).await {
        Ok(p) => {
            let name = p.file_name.clone();
            let category = mgr.settings().category_of(&name, &url);
            json!({
                "ok": true,
                "name": name,
                "size": p.total_size.map(human_size).unwrap_or_else(|| "unknown size".into()),
                "resumable": p.resumable,
                "webPage": p.is_web_page(),
                "category": category,
                "dir": mgr.settings().dir_for(&category).display().to_string(),
                "kind": kind_of_name(&name),
            })
        }
        Err(e) => json!({ "ok": false, "error": crate::err_text(&format!("{e:#}")) }),
    };
    format!("window.__badzy&&window.__badzy.probe&&window.__badzy.probe({v})")
}

fn kind_of_name(name: &str) -> &'static str {
    let ext = name.rsplit('.').next().unwrap_or("").to_ascii_lowercase();
    match ext.as_str() {
        "mp4" | "mkv" | "avi" | "mov" | "webm" | "m3u8" | "flv" | "wmv" | "ts" => "video",
        "mp3" | "flac" | "wav" | "aac" | "ogg" | "m4a" | "opus" => "audio",
        "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" | "xz" => "archive",
        "exe" | "msi" | "apk" | "dmg" | "msix" => "program",
        "jpg" | "jpeg" | "png" | "gif" | "webp" | "bmp" | "svg" | "avif" => "image",
        "pdf" => "pdf",
        "doc" | "docx" | "txt" | "rtf" | "odt" => "doc",
        "xls" | "xlsx" | "csv" | "ods" => "sheet",
        "ppt" | "pptx" | "odp" => "slides",
        "iso" | "img" => "disc",
        "torrent" => "torrent",
        _ => "general",
    }
}

/// The settings the UI shows (a JSON object with the engine's own field names).
pub fn settings_js(mgr: &Manager) -> String {
    let mut v = serde_json::to_value(mgr.settings()).unwrap_or_default();
    if let Some(o) = v.as_object_mut() {
        o.insert("autostart".into(), json!(crate::autostart::is_enabled()));
        o.insert("version".into(), json!(env!("CARGO_PKG_VERSION")));
    }
    format!("window.__badzy&&window.__badzy.settings&&window.__badzy.settings({v})")
}

/// Headers the browser extension sent along with a download.
pub fn headers_from(extra: &Value) -> swiftget_engine::RequestHeaders {
    let mut h = swiftget_engine::RequestHeaders {
        referer: extra["referrer"].as_str().map(str::to_string),
        cookies: extra["cookies"].as_str().map(str::to_string),
        user_agent: extra["userAgent"].as_str().map(str::to_string),
        ..Default::default()
    };
    if let Some(list) = extra["headers"].as_array() {
        let pairs: Vec<(String, String)> = list
            .iter()
            .filter_map(|p| Some((p.get(0)?.as_str()?.to_string(), p.get(1)?.as_str()?.to_string())))
            .collect();
        swiftget_engine::ytdlp::apply_headers(&mut h, &pairs);
    }
    h
}

/// Text for the tray icon: what Badzy is doing now.
pub fn status_text(mgr: &Manager) -> String {
    let (mut n, mut speed) = (0, 0.0);
    for v in mgr.snapshot() {
        if v.status.is_running() {
            n += 1;
            speed += v.speed;
        }
    }
    if n == 0 {
        "Badzy — nothing downloading".into()
    } else {
        format!("Badzy — {n} downloading · {}/s", human_size(speed as u64))
    }
}

/// Appends a line to %LOCALAPPDATA%\\Badzy\\shell.log (what the app did; for bug reports).
pub fn log(line: &str) {
    if let Some(dir) = std::env::var_os("LOCALAPPDATA") {
        let dir = std::path::PathBuf::from(dir).join("Badzy");
        let _ = std::fs::create_dir_all(&dir);
        if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(dir.join("shell.log")) {
            use std::io::Write;
            let _ = writeln!(f, "{} {line}", chrono::Local::now().format("%F %T"));
        }
    }
}

/// Logs every change of state of every download, and returns the texts of new failures.
pub fn watch(mgr: &Manager, seen: &mut std::collections::HashMap<u64, (Status, Option<String>)>) -> Vec<(String, String)> {
    let mut failures = Vec::new();
    for v in mgr.snapshot() {
        let now = (v.status, v.error.clone());
        if seen.get(&v.id) != Some(&now) {
            log(&format!("download {} \"{}\": {:?} error={:?} url={}", v.id, v.file_name, v.status, v.error, v.url));
            if v.status == Status::Failed {
                failures.push((v.file_name.clone(), crate::err_text(v.error.as_deref().unwrap_or("the download failed"))));
            }
            seen.insert(v.id, now);
        }
    }
    failures
}
