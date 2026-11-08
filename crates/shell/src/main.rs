//! Badzy desktop shell: frameless, transparent windows that host the web UI
//! (design/prototype/native) in WebView2: the main window plus small popup windows
//! (download confirmation, download progress). The extension keeps working while only
//! the tray icon is left.
#![cfg_attr(windows, windows_subsystem = "windows")]

#[cfg(not(windows))]
fn main() {
    eprintln!("Badzy runs on Windows only.");
}

#[cfg(windows)]
fn main() {
    win::run();
}

#[cfg_attr(not(windows), allow(dead_code))]
mod api;
#[cfg_attr(not(windows), allow(dead_code))]
mod autostart;
#[cfg_attr(not(windows), allow(dead_code))]
mod bridge;
#[cfg(windows)]
mod tray;

#[cfg(windows)]
mod win {
    use crate::bridge::{self, FromBrowser};
    use crate::tray::TrayAct;
    use include_dir::{include_dir, Dir};
    use std::borrow::Cow;
    use std::collections::HashMap;
    use swiftget_engine::manager::{default_data_dir, Manager};
    use tao::dpi::{LogicalSize, PhysicalPosition, PhysicalSize};
    use tao::event::{Event, WindowEvent};
    use tao::event_loop::{ControlFlow, EventLoopBuilder, EventLoopProxy, EventLoopWindowTarget};
    use tao::platform::windows::WindowExtWindows;
    use tao::window::{ResizeDirection, Window, WindowBuilder, WindowId};
    use wry::{http::Response, WebContext, WebView, WebViewBuilder};

    static UI: Dir<'static> = include_dir!("$CARGO_MANIFEST_DIR/../../design/prototype/native/dist");

    enum Act {
        Drag,
        Resize(ResizeDirection),
        Minimize,
        ToggleMaximize,
        /// the X of a window: the main window goes to the tray, popups close
        Close,
        Ready,
        Cmd(String, serde_json::Value),
    }

    enum Msg {
        Win(WindowId, Act),
        Rows(String),
        /// JavaScript for the main window
        JsMain(String),
        Api(crate::api::ApiEvent),
        Tray(TrayAct),
        Popup(String, (f64, f64)),
        Status(String),
        Finished(u64),
    }

    struct Win {
        window: Window,
        webview: WebView,
        main: bool,
        hash: String,
        /// maximized by us (the work area of the screen); the old place is kept here
        maximized: bool,
        restore: Option<(PhysicalPosition<i32>, PhysicalSize<u32>)>,
    }

    /// The part of the screen the taskbar leaves free: (left, top, right, bottom).
    fn work_area(window: &Window) -> Option<(i32, i32, i32, i32)> {
        use windows_sys::Win32::Graphics::Gdi::{GetMonitorInfoW, MonitorFromWindow, MONITORINFO, MONITOR_DEFAULTTONEAREST};
        unsafe {
            let mon = MonitorFromWindow(window.hwnd() as _, MONITOR_DEFAULTTONEAREST);
            let mut mi: MONITORINFO = std::mem::zeroed();
            mi.cbSize = std::mem::size_of::<MONITORINFO>() as u32;
            if GetMonitorInfoW(mon, &mut mi) == 0 {
                return None;
            }
            Some((mi.rcWork.left, mi.rcWork.top, mi.rcWork.right, mi.rcWork.bottom))
        }
    }

    fn place(window: &Window, x: i32, y: i32, w: i32, h: i32) {
        use windows_sys::Win32::UI::WindowsAndMessaging::{SetWindowPos, SWP_NOACTIVATE, SWP_NOZORDER};
        unsafe {
            SetWindowPos(window.hwnd() as _, std::ptr::null_mut(), x, y, w, h, SWP_NOZORDER | SWP_NOACTIVATE);
        }
    }

    /// Maximize / restore without the invisible frame overhang of a native maximize.
    fn toggle_maximize(w: &mut Win) {
        if w.maximized {
            w.maximized = false;
            if let Some((p, s)) = w.restore.take() {
                place(&w.window, p.x, p.y, s.width as i32, s.height as i32);
            }
        } else if let Some((l, t, r, b)) = work_area(&w.window) {
            w.restore = w.window.outer_position().ok().map(|p| (p, w.window.outer_size()));
            w.maximized = true;
            place(&w.window, l, t, r - l, b - t);
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

    /// Rounded window outline (22 px like the design). Done with a window region so no
    /// square or white corner is ever visible, also on Windows 10.
    fn round_region(window: &Window, maximized: bool) {
        use windows_sys::Win32::Graphics::Gdi::{CreateRoundRectRgn, SetWindowRgn};
        let hwnd = window.hwnd() as _;
        unsafe {
            if maximized {
                SetWindowRgn(hwnd, std::ptr::null_mut(), 1);
                return;
            }
            let size = window.outer_size();
            let r = (22.0 * window.scale_factor()) as i32;
            let rgn = CreateRoundRectRgn(0, 0, size.width as i32 + 1, size.height as i32 + 1, r * 2, r * 2);
            SetWindowRgn(hwnd, rgn, 1);
        }
    }

    fn parse_dir(d: &str) -> Option<ResizeDirection> {
        Some(match d {
            "n" => ResizeDirection::North,
            "s" => ResizeDirection::South,
            "e" => ResizeDirection::East,
            "w" => ResizeDirection::West,
            "ne" => ResizeDirection::NorthEast,
            "nw" => ResizeDirection::NorthWest,
            "se" => ResizeDirection::SouthEast,
            "sw" => ResizeDirection::SouthWest,
            _ => return None,
        })
    }

    /// One window with the web UI inside. `hash` tells the UI what to show ("" = main window).
    fn make_window(
        target: &EventLoopWindowTarget<Msg>,
        proxy: &EventLoopProxy<Msg>,
        ctx: &mut WebContext,
        hash: &str,
        size: (f64, f64),
        min: (f64, f64),
        visible: bool,
    ) -> Option<Win> {
        let main = hash.is_empty();
        let window = WindowBuilder::new()
            .with_title("Badzy")
            .with_decorations(false)
            .with_transparent(false)
            .with_minimizable(true)
            .with_maximizable(main)
            .with_resizable(main)
            .with_always_on_top(!main)
            .with_visible(visible)
            .with_inner_size(LogicalSize::new(size.0, size.1))
            .with_min_inner_size(LogicalSize::new(min.0, min.1))
            .build(target)
            .ok()?;
        if !main {
            if let Some(m) = window.current_monitor().or_else(|| window.primary_monitor()) {
                let (ms, mp, ws) = (m.size(), m.position(), window.outer_size());
                window.set_outer_position(PhysicalPosition::new(
                    mp.x + (ms.width as i32 - ws.width as i32) / 2,
                    mp.y + (ms.height as i32 - ws.height as i32) / 2,
                ));
            }
        }
        let wid = window.id();
        let p = proxy.clone();
        let url = format!("http://badzy.localhost/index.html{}", if hash.is_empty() { String::new() } else { format!("#{hash}") });
        let webview = WebViewBuilder::new_with_web_context(ctx)
            .with_transparent(false)
            .with_background_color((8, 9, 15, 255))
            .with_custom_protocol("badzy".into(), |_id, req| serve(req.uri().path()))
            .with_ipc_handler(move |req| {
                let v: serde_json::Value = match serde_json::from_str(req.body()) {
                    Ok(v) => v,
                    Err(e) => {
                        log(&format!("bad ipc message: {e}"));
                        return;
                    }
                };
                let cmd = v["cmd"].as_str().unwrap_or("");
                let act = match cmd {
                    "drag" => Act::Drag,
                    "minimize" => Act::Minimize,
                    "maximize" => Act::ToggleMaximize,
                    "close" | "closeWindow" => Act::Close,
                    "ready" => Act::Ready,
                    "resize" => match parse_dir(v["arg"].as_str().unwrap_or("")) {
                        Some(d) => Act::Resize(d),
                        None => return,
                    },
                    other => Act::Cmd(other.to_string(), v["arg"].clone()),
                };
                let _ = p.send_event(Msg::Win(wid, act));
            })
            .with_url(url)
            .build(&window)
            .ok()?;
        round_region(&window, false);
        Some(Win { window, webview, main, hash: hash.to_string(), maximized: false, restore: None })
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
        let background = std::env::args().any(|a| a == "--background");

        let event_loop = EventLoopBuilder::<Msg>::with_user_event().build();
        let proxy = event_loop.create_proxy();

        // the browser extension talks to Badzy through this local server
        if let Some(server) = server {
            let (p, cfg_mgr) = (proxy.clone(), mgr.clone());
            crate::api::serve(
                server,
                move || crate::api::config_json(&cfg_mgr.settings()),
                move |ev| {
                    let _ = p.send_event(Msg::Api(ev));
                },
            );
        }
        // the download list goes to every open window twice a second
        {
            let (p, m) = (proxy.clone(), mgr.clone());
            std::thread::spawn(move || {
                let mut last = String::new();
                loop {
                    if p.send_event(Msg::Rows(bridge::rows_json(&m))).is_err() {
                        break;
                    }
                    let status = bridge::status_text(&m);
                    if status != last {
                        let _ = p.send_event(Msg::Status(status.clone()));
                        last = status;
                    }
                    for id in m.take_completed() {
                        let _ = p.send_event(Msg::Finished(id));
                    }
                    std::thread::sleep(std::time::Duration::from_millis(500));
                }
            });
        }
        let tray = {
            let p = proxy.clone();
            crate::tray::start(move |a| {
                let _ = p.send_event(Msg::Tray(a));
            })
        };
        let has_tray = tray.is_some();

        let data = std::env::var_os("LOCALAPPDATA").map(|p| std::path::PathBuf::from(p).join("Badzy").join("webview"));
        let mut ctx = WebContext::new(data);
        let mut wins: HashMap<WindowId, Win> = HashMap::new();
        let mut main_id: Option<WindowId> = None;
        let pump = proxy.clone();

        event_loop.run(move |event, target, flow| {
            let _keep = (&rt, &tray);
            *flow = ControlFlow::Wait;
            let state_js = |w: &Win| format!("window.__badzy&&window.__badzy.state&&window.__badzy.state({{maximized:{}}})", w.maximized);
            match event {
                Event::NewEvents(tao::event::StartCause::Init) => {
                    if let Some(w) = make_window(target, &pump, &mut ctx, "", (1120.0, 700.0), (760.0, 520.0), !background) {
                        main_id = Some(w.window.id());
                        wins.insert(w.window.id(), w);
                    }
                }
                Event::UserEvent(m) => match m {
                    Msg::Rows(j) => {
                        let js = format!("window.__badzy&&window.__badzy.rows&&window.__badzy.rows({j})");
                        for w in wins.values() {
                            let _ = w.webview.evaluate_script(&js);
                        }
                    }
                    Msg::JsMain(js) => {
                        if let Some(w) = main_id.and_then(|i| wins.get(&i)) {
                            let _ = w.webview.evaluate_script(&js);
                        }
                    }
                    Msg::Popup(hash, size) => {
                        // one progress window per download
                        if hash.starts_with("progress/") {
                            if let Some(w) = wins.values().find(|w| w.hash == hash) {
                                w.window.set_focus();
                                return;
                            }
                        }
                        if let Some(w) = make_window(target, &pump, &mut ctx, &hash, size, size, true) {
                            if hash.starts_with("finished/") {
                                // a small notice in the corner of the screen, above the taskbar
                                if let Some((_, _, r, b)) = work_area(&w.window) {
                                    let s = w.window.outer_size();
                                    place(&w.window, r - s.width as i32 - 16, b - s.height as i32 - 16, s.width as i32, s.height as i32);
                                }
                            } else {
                                w.window.set_focus();
                            }
                            wins.insert(w.window.id(), w);
                        }
                    }
                    Msg::Status(text) => {
                        if let Some(t) = &tray {
                            let _ = t.set_tooltip(Some(text));
                        }
                    }
                    Msg::Finished(id) => {
                        let open = wins.values().any(|w| w.hash == format!("progress/{id}"));
                        let ok = mgr.get(id).is_some_and(|v| v.save_path.exists());
                        if !open && ok && mgr.settings().show_complete_dialog {
                            let _ = pump.send_event(Msg::Popup(format!("finished/{id}"), (390.0, 156.0)));
                        }
                    }
                    Msg::Tray(a) => {
                        let show_main = |wins: &HashMap<WindowId, Win>| {
                            if let Some(w) = main_id.and_then(|i| wins.get(&i)) {
                                w.window.set_visible(true);
                                w.window.set_minimized(false);
                                w.window.set_focus();
                            }
                        };
                        match a {
                            TrayAct::Show => show_main(&wins),
                            TrayAct::Add => {
                                show_main(&wins);
                                let _ = pump.send_event(Msg::JsMain("window.__badzy&&window.__badzy.openAdd&&window.__badzy.openAdd()".into()));
                            }
                            TrayAct::Options => {
                                show_main(&wins);
                                let _ = pump.send_event(Msg::JsMain("window.__badzy&&window.__badzy.openSettings&&window.__badzy.openSettings()".into()));
                            }
                            TrayAct::ResumeAll => mgr.start_all(),
                            TrayAct::StopAll => mgr.pause_all(),
                            TrayAct::Exit => {
                                mgr.shutdown();
                                *flow = ControlFlow::Exit;
                            }
                        }
                    }
                    Msg::Api(ev) => match ev {
                        crate::api::ApiEvent::Show => {
                            if let Some(w) = main_id.and_then(|i| wins.get(&i)) {
                                w.window.set_visible(true);
                                w.window.set_minimized(false);
                                w.window.set_focus();
                            }
                        }
                        other => match bridge::from_browser(&mgr, other) {
                            FromBrowser::Confirm(data) => {
                                let hash = format!("add/{}", urlencode(&data.to_string()));
                                let _ = pump.send_event(Msg::Popup(hash, (700.0, 620.0)));
                            }
                            FromBrowser::Added(id) => {
                                let _ = pump.send_event(Msg::Popup(format!("progress/{id}"), (460.0, 520.0)));
                            }
                            FromBrowser::Nothing => {}
                        },
                    },
                    Msg::Win(id, act) => {
                        let Some(w) = wins.get_mut(&id) else { return };
                        match act {
                            Act::Drag => {
                                let _ = w.window.drag_window();
                            }
                            Act::Resize(d) => {
                                let _ = w.window.drag_resize_window(d);
                            }
                            Act::Minimize => unsafe {
                                windows_sys::Win32::UI::WindowsAndMessaging::ShowWindow(
                                    w.window.hwnd() as _,
                                    windows_sys::Win32::UI::WindowsAndMessaging::SW_MINIMIZE,
                                );
                            },
                            Act::ToggleMaximize => {
                                if w.main {
                                    toggle_maximize(w);
                                    round_region(&w.window, w.maximized);
                                    let _ = w.webview.evaluate_script(&state_js(w));
                                }
                            }
                            Act::Ready => {
                                let _ = w.webview.evaluate_script(&state_js(w));
                            }
                            Act::Close => {
                                if w.main {
                                    if has_tray {
                                        w.window.set_visible(false);
                                    } else {
                                        mgr.shutdown();
                                        *flow = ControlFlow::Exit;
                                    }
                                } else {
                                    wins.remove(&id);
                                }
                            }
                            Act::Cmd(c, a) if c == "probe" => {
                                let (m, p, url) = (mgr.clone(), pump.clone(), a["url"].as_str().unwrap_or("").to_string());
                                let extra = a["extra"].clone();
                                rt.spawn(async move {
                                    let js = bridge::probe_js(m, url, extra).await;
                                    let _ = p.send_event(Msg::Win(id, Act::Cmd("js".into(), serde_json::Value::String(js))));
                                });
                            }
                            Act::Cmd(c, a) if c == "js" => {
                                if let Some(js) = a.as_str() {
                                    let _ = w.webview.evaluate_script(js);
                                }
                            }
                            Act::Cmd(c, a) if c == "pickFolder" => {
                                let (p, start) = (pump.clone(), a["initial"].as_str().unwrap_or("").to_string());
                                std::thread::spawn(move || {
                                    let mut d = rfd::FileDialog::new();
                                    if !start.is_empty() {
                                        d = d.set_directory(&start);
                                    }
                                    if let Some(dir) = d.pick_folder() {
                                        let s = serde_json::Value::String(dir.display().to_string());
                                        let js = format!("window.__badzy&&window.__badzy.folder&&window.__badzy.folder({s})");
                                        let _ = p.send_event(Msg::Win(id, Act::Cmd("js".into(), serde_json::Value::String(js))));
                                    }
                                });
                            }
                            Act::Cmd(c, a) => {
                                let added = bridge::command(&mgr, &c, &a);
                                if matches!(c.as_str(), "settings" | "autostart" | "getSettings") {
                                    let _ = w.webview.evaluate_script(&bridge::settings_js(&mgr));
                                }
                                if let Some(new_id) = added {
                                    if a["start"].as_bool().unwrap_or(true) {
                                        let _ = pump.send_event(Msg::Popup(format!("progress/{new_id}"), (460.0, 520.0)));
                                    }
                                }
                            }
                        }
                    }
                },
                Event::WindowEvent { window_id, event: WindowEvent::Resized(_), .. } => {
                    if let Some(w) = wins.get(&window_id) {
                        round_region(&w.window, w.maximized);
                        let _ = w.webview.evaluate_script(&state_js(w));
                    }
                }
                Event::WindowEvent { window_id, event: WindowEvent::CloseRequested, .. } => {
                    let _ = pump.send_event(Msg::Win(window_id, Act::Close));
                }
                _ => {}
            }
        });
    }

    /// Percent-encodes a string for the address of a popup window.
    fn urlencode(s: &str) -> String {
        let mut out = String::new();
        for b in s.bytes() {
            if b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_' | b'.' | b'~') {
                out.push(b as char);
            } else {
                out.push_str(&format!("%{b:02X}"));
            }
        }
        out
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
