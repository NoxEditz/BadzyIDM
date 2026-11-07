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
pub fn command(mgr: &Arc<Manager>, cmd: &str, arg: &Value) {
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
                mgr.add(NewDownload {
                    url: url.trim().to_string(),
                    file_name: arg["name"].as_str().filter(|n| !n.is_empty()).map(str::to_string),
                    save_dir: arg["dir"].as_str().filter(|d| !d.is_empty()).map(Into::into),
                    start: arg["start"].as_bool().unwrap_or(true),
                    connections: arg["connections"].as_u64().map(|c| c.clamp(1, 32) as u32),
                    description: arg["desc"].as_str().filter(|d| !d.is_empty()).map(str::to_string),
                    headers: swiftget_engine::RequestHeaders {
                        auth: match (arg["login"].as_str(), arg["password"].as_str()) {
                            (Some(l), Some(p)) if !l.is_empty() => Some((l.to_string(), p.to_string())),
                            _ => None,
                        },
                        ..Default::default()
                    },
                    ..Default::default()
                });
            }
        }
        _ => {}
    }
}

/// Something sent by the browser extension (a download, links of a page, a playlist).
pub fn from_browser(mgr: &Arc<Manager>, ev: crate::api::ApiEvent) {
    use std::sync::Mutex;
    use std::time::{Duration, Instant};
    use swiftget_engine::RequestHeaders;
    static LAST: Mutex<Option<(String, Instant)>> = Mutex::new(None);
    match ev {
        crate::api::ApiEvent::Add(req) => {
            // an older add-in could send the same download over and over
            {
                let mut l = LAST.lock().unwrap();
                let now = Instant::now();
                if l.as_ref().is_some_and(|(u, at)| *u == req.url && now.duration_since(*at) < Duration::from_secs(10)) {
                    return;
                }
                *l = Some((req.url.clone(), now));
            }
            if mgr.find_url(&req.url).is_some() {
                return;
            }
            let mut headers = RequestHeaders {
                referer: req.referrer,
                cookies: req.cookies,
                user_agent: req.user_agent,
                extra: Vec::new(),
                auth: None,
            };
            if let Some(list) = &req.headers {
                swiftget_engine::ytdlp::apply_headers(&mut headers, list);
            }
            mgr.add(NewDownload {
                url: req.url,
                file_name: req.file_name,
                headers,
                audio_url: req.audio_url,
                source_page: req.source_page,
                source_key: req.source_key,
                start: true,
                ..Default::default()
            });
        }
        // the Grabber and playlist windows come with the next steps
        crate::api::ApiEvent::Playlist(url) => {
            mgr.add(NewDownload { url, start: true, ..Default::default() });
        }
        crate::api::ApiEvent::Links(_) | crate::api::ApiEvent::Show => {}
    }
}

/// "Check" in the Add window: ask the server what the file is. The answer goes back as JS.
pub async fn probe_js(mgr: Arc<Manager>, url: String) -> String {
    let headers = swiftget_engine::RequestHeaders::default();
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
