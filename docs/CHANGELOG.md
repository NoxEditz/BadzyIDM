# Changelog

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
