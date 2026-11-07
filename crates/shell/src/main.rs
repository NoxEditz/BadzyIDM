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

#[cfg(windows)]
mod win {
    use include_dir::{include_dir, Dir};
    use std::borrow::Cow;
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

    pub fn run() {
        let event_loop = EventLoopBuilder::<Msg>::with_user_event().build();
        let proxy = event_loop.create_proxy();
        let window = WindowBuilder::new()
            .with_title("Badzy")
            .with_decorations(false)
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
                let v: serde_json::Value = serde_json::from_str(req.body()).unwrap_or_default();
                let msg = match v["cmd"].as_str().unwrap_or("") {
                    "drag" => Msg::Drag,
                    "minimize" => Msg::Minimize,
                    "maximize" => Msg::ToggleMaximize,
                    "close" => Msg::Close,
                    "ready" => Msg::Ready,
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

        let push_state = |wv: &wry::WebView, maximized: bool| {
            let _ = wv.evaluate_script(&format!(
                "window.__badzy&&window.__badzy.state({{maximized:{maximized}}})"
            ));
        };

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
                    Msg::Minimize => window.set_minimized(true),
                    Msg::ToggleMaximize => window.set_maximized(!window.is_maximized()),
                    Msg::Close => *flow = ControlFlow::Exit,
                    Msg::Ready => push_state(&webview, window.is_maximized()),
                },
                Event::WindowEvent { event: WindowEvent::Resized(_), .. } => {
                    push_state(&webview, window.is_maximized());
                }
                Event::WindowEvent { event: WindowEvent::CloseRequested, .. } => *flow = ControlFlow::Exit,
                _ => {}
            }
        });
    }
}
