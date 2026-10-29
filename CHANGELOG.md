# Changelog

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
