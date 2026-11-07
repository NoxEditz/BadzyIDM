//! Badzy desktop shell: a frameless, transparent window that hosts the web UI
//! (design/prototype/native) in WebView2. Rounded corners are drawn by the UI itself.
#![cfg_attr(windows, windows_subsystem = "windows")]

#[cfg(not(windows))]
fn main() {
    eprintln!("Badzy-Web runs on Windows only.");
}

#[cfg(windows)]
fn main() {
    win::run();
}

#[cfg_attr(not(windows), allow(dead_code))]
mod api;
#[cfg_attr(not(windows), allow(dead_code))]
mod bridge;

#[cfg(windows)]
mod win {
    use crate::bridge;
    use swiftget_engine::manager::{default_data_dir, Manager};
    use include_dir::{include_dir, Dir};
    use std::borrow::Cow;
    use tao::platform::windows::WindowExtWindows;
    use tao::{
        dpi::LogicalSize,
        event::{Event, WindowEvent},
        event_loop::{ControlFlow, EventLoopBuilder},
        window::{ResizeDirection, WindowBuilder},
    };
    use wry::{http::Response, WebContext, WebViewBuilder};

    static UI: Dir<'static> = include_dir!("$CARGO_MANIFEST_DIR/../../design/prototype/native/dist");

    enum Msg {
        Drag,
        Resize(ResizeDirection),
        Minimize,
        ToggleMaximize,
        Close,
        Ready,
        Rows(String),
        Cmd(String, serde_json::Value),
        Api(crate::api::ApiEvent),
        Js(String),
    }

    fn serve(path: &str) -> Response<Cow<'static, [u8]>> {
        let p = path.trim_start_matches('/');
        let p = if p.is_empty() { "index.html" } else { p };
        match UI.get_file(p) {
            Some(f) => Response::builder()
                .header("Content-Type", mime_guess::from_path(p).first_or_octet_stream().essence_str())
                .body(Cow::Borrowed(f.contents()))
                .unwrap(),
            None => Response::builder().status(404).body(Cow::Borrowed(&b"not found"[..])).unwrap(),
        }
    }

    fn log(line: &str) {
        if let Some(dir) = std::env::var_os("LOCALAPPDATA") {
            let dir = std::path::PathBuf::from(dir).join("Badzy");
            let _ = std::fs::create_dir_all(&dir);
            if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(dir.join("shell.log")) {
                use std::io::Write;
                let _ = writeln!(f, "{} {line}", chrono::Local::now().format("%F %T"));
            }
        }
    }

    pub fn run() {
        std::panic::set_hook(Box::new(|info| log(&format!("PANIC: {info}"))));
        // One copy only: the browser extension's port tells us whether Badzy already runs.
        let data_dir = default_data_dir();
        let port = swiftget_engine::Settings::load(&data_dir.join("settings.json")).browser_port;
        let mut first = crate::api::bind(port);
        if first.is_err() && std::env::args().any(|a| a == "--restarted") {
            for _ in 0..60 {
                std::thread::sleep(std::time::Duration::from_millis(250));
                first = crate::api::bind(port);
                if first.is_ok() {
                    break;
                }
            }
        }
        let server = match first {
            Ok(s) => Some(s),
            Err(_) => {
                if crate::api::notify_existing(port) {
                    return;
                }
                None
            }
        };
        let rt = tokio::runtime::Builder::new_multi_thread().worker_threads(4).enable_all().build().expect("runtime");
        let mgr = Manager::new(rt.handle().clone(), data_dir.clone()).expect("engine");
        let event_loop = EventLoopBuilder::<Msg>::with_user_event().build();
        let proxy = event_loop.create_proxy();
        let window = WindowBuilder::new()
            .with_title("Badzy")
            .with_decorations(false)
            .with_minimizable(true)
            .with_maximizable(true)
            .with_resizable(true)
            .with_transparent(true)
            .with_inner_size(LogicalSize::new(1120.0, 700.0))
            .with_min_inner_size(LogicalSize::new(760.0, 520.0))
            .build(&event_loop)
            .expect("window");

        let data = std::env::var_os("LOCALAPPDATA")
            .map(|p| std::path::PathBuf::from(p).join("Badzy").join("webview"));
        let mut ctx = WebContext::new(data);
        let webview = WebViewBuilder::new_with_web_context(&mut ctx)
            .with_transparent(true)
            .with_custom_protocol("badzy".into(), |_id, req| serve(req.uri().path()))
            .with_ipc_handler(move |req| {
                let v: serde_json::Value = match serde_json::from_str(req.body()) {
                    Ok(v) => v,
                    Err(e) => {
                        log(&format!("bad ipc message: {e}"));
                        return;
                    }
                };
                let msg = match v["cmd"].as_str().unwrap_or("") {
                    "drag" => Msg::Drag,
                    "minimize" => Msg::Minimize,
                    "maximize" => Msg::ToggleMaximize,
                    "close" => Msg::Close,
                    "ready" => Msg::Ready,
                    c @ ("resume" | "pause" | "resumeAll" | "pauseAll" | "remove" | "add" | "probe" | "pickFolder") => {
                        Msg::Cmd(c.to_string(), v["arg"].clone())
                    }
                    "resize" => Msg::Resize(match v["arg"].as_str().unwrap_or("") {
                        "n" => ResizeDirection::North,
                        "s" => ResizeDirection::South,
                        "e" => ResizeDirection::East,
                        "w" => ResizeDirection::West,
                        "ne" => ResizeDirection::NorthEast,
                        "nw" => ResizeDirection::NorthWest,
                        "se" => ResizeDirection::SouthEast,
                        _ => ResizeDirection::SouthWest,
                    }),
                    _ => return,
                };
                let _ = proxy.send_event(msg);
            })
            .with_url("http://badzy.localhost/index.html")
            .build(&window)
            .expect("webview");

        // the browser extension talks to Badzy through this local server
        if let Some(server) = server {
            let (proxy, cfg_mgr) = (event_loop.create_proxy(), mgr.clone());
            crate::api::serve(
                server,
                move || crate::api::config_json(&cfg_mgr.settings()),
                move |ev| {
                    let _ = proxy.send_event(Msg::Api(ev));
                },
            );
        }

        // push the download list to the UI twice a second
        {
            let (proxy, mgr) = (event_loop.create_proxy(), mgr.clone());
            std::thread::spawn(move || loop {
                if proxy.send_event(Msg::Rows(bridge::rows_json(&mgr))).is_err() {
                    break;
                }
                std::thread::sleep(std::time::Duration::from_millis(500));
            });
        }

        let push_state = |wv: &wry::WebView, maximized: bool| {
            let _ = wv.evaluate_script(&format!(
                "window.__badzy&&window.__badzy.state({{maximized:{maximized}}})"
            ));
        };

        let reply = event_loop.create_proxy();
        event_loop.run(move |event, _, flow| {
            *flow = ControlFlow::Wait;
            match event {
                Event::UserEvent(m) => match m {
                    Msg::Drag => {
                        let _ = window.drag_window();
                    }
                    Msg::Resize(d) => {
                        let _ = window.drag_resize_window(d);
                    }
                    Msg::Minimize => unsafe {
                        // straight to Windows: the most reliable way for a frameless window
                        windows_sys::Win32::UI::WindowsAndMessaging::ShowWindow(
                            window.hwnd() as _,
                            windows_sys::Win32::UI::WindowsAndMessaging::SW_MINIMIZE,
                        );
                    },
                    Msg::ToggleMaximize => window.set_maximized(!window.is_maximized()),
                    Msg::Close => {
                        mgr.shutdown();
                        *flow = ControlFlow::Exit
                    }
                    Msg::Ready => push_state(&webview, window.is_maximized()),
                    Msg::Rows(j) => {
                        let _ = webview.evaluate_script(&format!("window.__badzy&&window.__badzy.rows&&window.__badzy.rows({j})"));
                    }
                    Msg::Cmd(c, a) if c == "probe" => {
                        let (m, p, url) = (mgr.clone(), reply.clone(), a["url"].as_str().unwrap_or("").to_string());
                        rt.spawn(async move {
                            let js = bridge::probe_js(m, url).await;
                            let _ = p.send_event(Msg::Js(js));
                        });
                    }
                    Msg::Cmd(c, a) if c == "pickFolder" => {
                        let (p, start) = (reply.clone(), a["initial"].as_str().unwrap_or("").to_string());
                        std::thread::spawn(move || {
                            let mut d = rfd::FileDialog::new();
                            if !start.is_empty() {
                                d = d.set_directory(&start);
                            }
                            if let Some(dir) = d.pick_folder() {
                                let s = serde_json::Value::String(dir.display().to_string());
                                let _ = p.send_event(Msg::Js(format!("window.__badzy&&window.__badzy.folder&&window.__badzy.folder({s})")));
                            }
                        });
                    }
                    Msg::Cmd(c, a) => bridge::command(&mgr, &c, &a),
                    Msg::Js(js) => {
                        let _ = webview.evaluate_script(&js);
                    }
                    Msg::Api(ev) => match ev {
                        crate::api::ApiEvent::Show => {
                            window.set_visible(true);
                            window.set_minimized(false);
                            window.set_focus();
                        }
                        other => {
                            bridge::from_browser(&mgr, other);
                            window.set_visible(true);
                            window.set_focus();
                        }
                    },
                },
                Event::WindowEvent { event: WindowEvent::Resized(_), .. } => {
                    push_state(&webview, window.is_maximized());
                }
                Event::WindowEvent { event: WindowEvent::CloseRequested, .. } => {
                    mgr.shutdown();
                    *flow = ControlFlow::Exit
                }
                _ => {}
            }
        });
    }
}

/// Friendly texts for the errors people meet most.
pub(crate) fn err_text(e: &str) -> String {
    if e.contains("needs a login or an age check") {
        "This video needs a login or an age check. Open it once in the browser where you are signed in (with the Badzy extension), then try again.".into()
    } else if e.contains("BitLocker") || e.contains("-2144272384") {
        "The drive of the download folder is locked by BitLocker. Unlock it in Windows, or choose another folder.".into()
    } else if e.contains("is already registered") {
        "This torrent is already running. Wait a little, or exit Badzy and open it again.".into()
    } else if e.contains("the link has expired or the file was removed") {
        "The link has expired or the file was removed. Right-click the download and use \"Refresh download address\".".into()
    } else {
        e.to_string()
    }
}
