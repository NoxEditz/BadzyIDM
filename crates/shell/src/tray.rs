//! Notification-area icon: Badzy keeps running (and the browser extension keeps working)
//! when the window is closed.
use std::time::Duration;
use tray_icon::menu::{Menu, MenuEvent, MenuId, MenuItem, PredefinedMenuItem};
use tray_icon::{Icon, MouseButton, TrayIcon, TrayIconBuilder, TrayIconEvent};

#[derive(Clone, Copy, Debug)]
pub enum TrayAct {
    Show,
    Add,
    ResumeAll,
    StopAll,
    Options,
    Exit,
}

/// Builds the icon (on the thread that runs the window loop) and forwards its clicks to `on`.
pub fn start(on: impl Fn(TrayAct) + Send + 'static) -> Option<TrayIcon> {
    let menu = Menu::new();
    let show = MenuItem::new("Open Badzy", true, None);
    let add = MenuItem::new("Add new download…", true, None);
    let resume = MenuItem::new("Resume all downloads", true, None);
    let stop = MenuItem::new("Stop all downloads", true, None);
    let options = MenuItem::new("Options…", true, None);
    let exit = MenuItem::new("Exit", true, None);
    menu.append(&show).ok()?;
    menu.append(&PredefinedMenuItem::separator()).ok()?;
    menu.append(&add).ok()?;
    menu.append(&resume).ok()?;
    menu.append(&stop).ok()?;
    menu.append(&PredefinedMenuItem::separator()).ok()?;
    menu.append(&options).ok()?;
    menu.append(&exit).ok()?;
    let icon = Icon::from_rgba(include_bytes!("../tray32.rgba").to_vec(), 32, 32).ok()?;
    let tray = TrayIconBuilder::new()
        .with_tooltip("Badzy")
        .with_icon(icon)
        .with_menu(Box::new(menu))
        .with_menu_on_left_click(false)
        .build()
        .ok()?;
    let ids: Vec<(MenuId, TrayAct)> = vec![
        (show.id().clone(), TrayAct::Show),
        (add.id().clone(), TrayAct::Add),
        (resume.id().clone(), TrayAct::ResumeAll),
        (stop.id().clone(), TrayAct::StopAll),
        (options.id().clone(), TrayAct::Options),
        (exit.id().clone(), TrayAct::Exit),
    ];
    std::thread::spawn(move || loop {
        while let Ok(ev) = TrayIconEvent::receiver().try_recv() {
            if let TrayIconEvent::DoubleClick { button: MouseButton::Left, .. } = ev {
                on(TrayAct::Show);
            }
        }
        while let Ok(ev) = MenuEvent::receiver().try_recv() {
            if let Some((_, act)) = ids.iter().find(|(id, _)| *id == ev.id) {
                on(*act);
            }
        }
        std::thread::sleep(Duration::from_millis(80));
    });
    Some(tray)
}
