# Changelog

## v0.1 build — 2026-11-13

### Desktop app
- **Fixed:** torrents from websites. A link to a `.torrent` file (from the browser extension, Add URL or the clipboard) was handled as a normal download: Badzy showed the small file's details and downloaded only that file. Now the file is fetched and the torrent window opens with its file list, so the real torrent starts. An address that serves a torrent under another name is recognised by its content type.
- **Fixed:** the "Download File Info" window no longer starts the download by itself before you press Start (the option "Start downloading immediately while showing Download File Info" is now off by default and is switched off once for existing settings; you can turn it on again in Options).
- Progress window: no more white flash on every update (Windows no longer erases the window or repaints its frame when the title changes), "Show details" works again after "Hide details", and the taskbar progress is only updated when it changes.
- Frameless windows swallow the caption/frame draw messages, so clicking or dragging the title bar no longer shows the old white minimize / maximize / close boxes.
- A download hidden to the tray shows the Badzy logo with a progress bar (it was a blue "E").

### Browser extension 2.1.0
- Arabic and English (popup, settings and right-click menu), right-to-left layout in Arabic.
- Per-site switch in the popup and a list of sites to leave alone (no downloads taken, no video button).
- Extra file types to take on top of the app's list.
- Green tick / red "!" on the toolbar icon after a link is sent.
- Right-click menu: new "Download playlist / channel" entry; every entry can be switched off.
- Keyboard shortcuts: open Badzy, video panel, all links, pause / resume.
- Settings page rebuilt: connection test with the app version, export / import / reset of the settings.

### Docs
- README rewritten in Arabic with the features, install steps for the app and the extension, what the app connects to, and how to build.

## 2.0.0 — 2026-11-03

### Desktop app
- New design system: new colours for all nine themes, rounded cards, top bar with search, slide-in menu (replaces the native menu bar), animated progress with a moving light, intro animation, theme swatches.
- One Badzy logo everywhere: crisp 16-256 px icon for the exe, taskbar and tray; one taskbar identity so windows group under one button.
- Faster disk writes: each connection writes in 1 MiB batches.
- **Fixed:** "server answered HTTP 429" no longer needs a manual Continue. Badzy waits as the server asks (Retry-After), uses fewer connections and carries on by itself.
- **Fixed:** leftover `.badzy-<id>.sgpart` files. Temp files are hidden and orphans are removed at startup.

### Build
- CI builds Badzy's own ffmpeg (with a verified fallback) and bundles ffmpeg, yt-dlp and aria2c into the installer, then tests a silent install.
- Repo reorganised into `scripts/`, `docs/`, `assets/`.

### Browser extension 2.0.0
- Palette aligned with the app, new icons from the master logo, Firefox update URL points to this repository. The Firefox add-on must be signed again for this version.

## 1.1.0 — 2026-10-29

### Desktop UI
- Refined dark-red palette contrast and surface separation.
- Rounded toolbar controls, animated outline transitions, and icon hover feedback.
- Removed the toolbar outline's hover-time geometry change so neighboring controls do not shift.

### Browser extension
- Rebuilt popup styling with a dark/red design system, motion-aware transitions, clearer app status, and improved spacing/readability.
- Added Quick Add for HTTP(S) URLs and BTIH/BTMH magnet links.
- Added background-level URL scheme validation and errors for paused/offline integration.
- Redesigned settings and added validation for file-size threshold and local API port.

### Quality
- Added simulated background tests for direct URL, magnet, and invalid scheme Quick Add paths.
- Made CI run extension syntax checks and JS tests before the Rust release build.
- Synchronized workspace and extension versions to 1.1.0.

### Notes
- Quick Add treats `.torrent` web URLs as direct downloads. Download the `.torrent` file and open it using the desktop Torrent dialog to add it as a torrent.
- No universal raw-throughput claim is made: server policies, network quality, disk speed, and connection settings determine actual transfer speed.
