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
                "queue": if v.queue.is_some() { "Queue" } else { "Main" },
            })
        })
        .collect();
    serde_json::to_string(&rows).unwrap_or_else(|_| "[]".into())
}

/// Commands from the UI: {"cmd": "...", "arg": ...}
pub fn command(mgr: &Arc<Manager>, cmd: &str, arg: &Value) {
    let ids = || -> Vec<u64> { arg["ids"].as_array().map(|a| a.iter().filter_map(Value::as_u64).collect()).unwrap_or_default() };
    match cmd {
        "resume" => ids().into_iter().for_each(|i| mgr.start(i)),
        "pause" => ids().into_iter().for_each(|i| mgr.pause(i)),
        "resumeAll" => mgr.start_all(),
        "pauseAll" => mgr.pause_all(),
        "remove" => {
            let file = arg["file"].as_bool().unwrap_or(false);
            ids().into_iter().for_each(|i| mgr.remove(i, file));
        }
        "add" => {
            if let Some(url) = arg["url"].as_str().filter(|u| !u.trim().is_empty()) {
                mgr.add(NewDownload {
                    url: url.trim().to_string(),
                    file_name: arg["name"].as_str().filter(|n| !n.is_empty()).map(str::to_string),
                    save_dir: arg["dir"].as_str().filter(|d| !d.is_empty()).map(Into::into),
                    start: arg["start"].as_bool().unwrap_or(true),
                    ..Default::default()
                });
            }
        }
        _ => {}
    }
}
