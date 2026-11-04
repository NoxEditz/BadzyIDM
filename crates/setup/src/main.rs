//! Badzy Setup - design preview. A real window with the final look and
//! animations; it installs nothing and writes nothing.
slint::include_modules!();

#[cfg(windows)]
fn hwnd_of(w: &slint::Window) -> Option<isize> {
    use raw_window_handle::{HasWindowHandle, RawWindowHandle};
    let handle = w.window_handle();
    match handle.window_handle().ok()?.as_raw() {
        RawWindowHandle::Win32(raw) => Some(raw.hwnd.get()),
        _ => None,
    }
}

/// Round corners that work on every Windows (10 and 11): the window's shape
/// is cut as a rounded rectangle.
#[cfg(windows)]
fn round_shape(w: &slint::Window, radius: i32) {
    use windows_sys::Win32::Graphics::Gdi::{CreateRoundRectRgn, SetWindowRgn};
    let Some(hwnd) = hwnd_of(w) else { return };
    let size = w.size();
    // SAFETY: plain GDI calls; Windows owns the region after SetWindowRgn.
    unsafe {
        let r = CreateRoundRectRgn(0, 0, size.width as i32 + 1, size.height as i32 + 1, radius * 2, radius * 2);
        SetWindowRgn(hwnd as _, r, 1);
    }
}

#[cfg(windows)]
fn center(w: &slint::Window) {
    use slint::winit_030::{winit, WinitWindowAccessor};
    w.with_winit_window(|win: &winit::window::Window| {
        if let Some(m) = win.current_monitor().or_else(|| win.primary_monitor()) {
            let (p, s, o) = (m.position(), m.size(), win.outer_size());
            let x = p.x + (s.width as i32 - o.width as i32).max(0) / 2;
            let y = p.y + (s.height as i32 - o.height as i32).max(0) / 2;
            win.set_outer_position(winit::dpi::PhysicalPosition::new(x, y));
        }
    });
}

fn main() -> Result<(), slint::PlatformError> {
    let ui = SetupWindow::new()?;
    {
        let w = ui.as_weak();
        ui.on_drag(move || {
            #[cfg(windows)]
            if let Some(u) = w.upgrade() {
                use slint::winit_030::{winit, WinitWindowAccessor};
                u.window().with_winit_window(|win: &winit::window::Window| {
                    let _ = win.drag_window();
                });
            }
            #[cfg(not(windows))]
            let _ = &w;
        });
    }
    {
        let w = ui.as_weak();
        ui.on_minimize(move || {
            if let Some(u) = w.upgrade() {
                u.window().set_minimized(true);
            }
        });
    }
    ui.on_quit(|| {
        let _ = slint::quit_event_loop();
    });
    {
        let w = ui.as_weak();
        ui.on_browse(move || {
            if let Some(dir) = rfd::FileDialog::new().set_title("Choose the install folder").pick_folder() {
                if let Some(u) = w.upgrade() {
                    u.set_path(dir.join("Badzy").display().to_string().into());
                }
            }
        });
    }
    ui.show()?;
    #[cfg(windows)]
    {
        let w = ui.as_weak();
        slint::Timer::single_shot(std::time::Duration::from_millis(40), move || {
            if let Some(u) = w.upgrade() {
                center(u.window());
                round_shape(u.window(), (22.0 * u.window().scale_factor()) as i32);
            }
        });
    }
    ui.run()
}
