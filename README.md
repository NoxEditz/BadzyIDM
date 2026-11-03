<div align="center">

# Badzy 2.0.0

**A fast, native Windows download manager with a proper browser sidekick.**

Dark red UI · resumable multi-connection downloads · video capture · playlists · torrent / magnet support · Chromium + Firefox extension

</div>

---

Badzy is a Rust desktop download manager with a Slint UI. It can split supported HTTP downloads across multiple connections, resume interrupted transfers, collect links from pages, resolve supported video streams through `yt-dlp`, and download torrents through a locally managed `aria2c` process.

Badzy is based on **Ezoo Download** by Ahmed Ezzat. Read `THIRD-PARTY-NOTICES.txt` before redistributing it.

## Redesign status (branch `redesign`)

This section tracks the v2 rework. It is updated with every commit so it always says what is really finished.

| Phase | What | State |
|---|---|---|
| 1 | Repo layout (`scripts/`, `docs/`, `assets/`), CI builds Badzy's own LGPL ffmpeg (cached, with a checksum-verified prebuilt fallback), bundles yt-dlp + aria2c with SHA-256 checks, silent install/uninstall test of the setup, release notes from the changelog, auto-update points at `NoxEditz/BadzyIDM` | Done, **not yet run on GitHub Actions** |
| 2 | One logo: `scripts/make_branding.py` builds `icon.ico` (16-256 px), app and tray icons from `assets/branding/badzy-mark.png`; one AppUserModelID; window/taskbar icons loaded from the exe at the exact system size | Done, needs a look on Windows |
| 3 | Speed: each connection writes to disk in 1 MiB batches outside the segment lock instead of per network packet. Resume stays exact (only bytes on disk are counted). | Done, 60 engine tests pass |
| Fix | **HTTP 429 / 503** ("server answered HTTP 429"): treated as "slow down". Honours `Retry-After`, halves the connection count once per burst, waits and continues by itself, no manual Continue needed | Done, unit tested |
| Fix | **`.badzy-<id>.sgpart` leftovers**: temp files are hidden in Explorer, and at startup orphans (no unfinished download owns them, older than 1 h, download/temp folders only) are deleted | Done, unit tested |
| 4 | New main window from the mockup: top bar (logo, wordmark, search, update bell, settings), left navigation with the sidebar art and tagline, category tiles, action toolbar, rounded file table with animated shimmering progress, right panel (categories and queues, active downloads, disk space), slide-in menu, dark theme colours of the design kit, marble/slash backgrounds, intro fade-in | Compiles with `cargo check`. **Never seen on screen** (no screenshot tool): spacing and art placement need a first look on Windows |
| Art | Design kit imported: wordmark, tagline, backgrounds cleaned (`scripts/clean_assets.py`), file-type cards redrawn as vectors (`scripts/make_cards.py`). **The original orbit logo stays the app icon**; the kit's arrow logo is not used | Done |
| 4b | Restyle dialogs (`dialogs.slint`), empty states, per-download progress window | Not started |
| 5 | Custom installer design, new README | Not started |
| Ext | Extension 2.0.0 (sign it again for Firefox): palette aligned with the app, icons from the new master, `update_url` fixed, its tests pass | Done |

**How it was checked.** `cargo test -p swiftget-engine` (67 tests, including 32-connection, pause/resume and outage downloads) and `cargo check -p swiftget` (compiles the whole Slint UI) on Linux. The Windows-only code (taskbar identity, icons, hidden files) and the CI workflow could not be run in the authoring environment, so the first Actions run is the real test.

**Known limits right now:** the new UI has not been screenshotted, so spacing and animation need a visual pass; the installer is still the old design.

## Quickest Windows build

### Option A — build everything with one double-click

1. Extract this repository to a normal folder, such as `C:\dev\badzy`.
2. Double-click **`BUILD.bat`**.
3. Approve the Windows package-manager prompts if asked. The script checks/installs the MSVC C++ build tools, Rust, and Inno Setup, then builds and packages Badzy.
4. When it finishes, open `dist\Badzy-Setup.exe`.

The first build needs an internet connection to fetch Rust crates and optional companion tools. The full MSVC toolchain is a large download. Later builds are quicker because Cargo and the tool downloads are cached.

### Option B — fastest route when Rust is already installed

Open PowerShell in the repository folder:

```powershell
cargo build --release
```

The executable is created at `target\release\Badzy.exe`. This compiles the desktop program only; it does **not** create the installer or bundle all helper tools. Use `BUILD.bat` when you need the complete installer.

Required for a manual native build on Windows:

- Windows 10/11, x64
- Rust stable with the `stable-x86_64-pc-windows-msvc` toolchain
- Visual Studio 2022 C++ Build Tools with the Windows SDK and MSVC toolchain
- Internet access for crates on the first build

If Cargo reports that the linker or `link.exe` is missing, install the MSVC C++ build tools and reopen the terminal. For a fresh environment, **Option A is the easy path**.

## What's improved in 1.1.0

- **New extension popup:** cohesive black/red styling, hierarchy, responsive hover/focus states, reduced-motion support, clearer app connection state, and more readable media results.
- **Quick Add:** paste an `http://` / `https://` address or a supported `magnet:?xt=urn:btih:…` / `btmh` link right in the extension popup. Magnet links are forwarded to the app's existing torrent engine.
- **Safer extension input handling:** validates URL schemes in the background worker as well as in the popup; invalid schemes such as `file:` are rejected before reaching the desktop app.
- **Redesigned extension settings:** clearer capture, size threshold, local port, and video-button controls with bounds validation and live app-connection feedback.
- **Desktop polish:** stronger dark-red contrast, rounded toolbar controls, smoother focus/hover transitions, and no hover border layout jump.
- **Regression coverage:** browser simulation now tests direct-link quick add, magnet quick add, and rejection of unsupported URL schemes. The CI build runs the browser tests before compiling Rust.
- **Version consistency:** Cargo and both browser manifests now use `1.1.0`.

This release improves workflows, feedback, and the visual layer. It does not promise a universal increase in raw network throughput: real speed still depends on the server, connection limits, disk, and the number of connections that server permits.

## Run tests before you build

Install Node.js 20 or later, then run:

```powershell
node --check extension/background.js
node --check extension/popup.js
node --check extension/options.js
node extension/test/yt-core.test.js
node extension/test/background.sim.js
```

The first test checks video-stream parsing/quality selection. The second runs the browser service worker against a simulated Chrome API and local Badzy endpoint, including the quick-add tests.

Rust tests can be run with:

```powershell
cargo test --workspace
```

The torrent end-to-end tests use `aria2c` if it is installed; tests that require a missing `aria2c` executable skip the real-transfer portion. For the complete native compiler check, also run `cargo build --release`.

## Install the browser extension for development

### Chrome, Edge, and other Chromium browsers

1. Build or run Badzy once so the local API is available.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select the repository's `extension` folder.
5. Pin Badzy in the browser toolbar for quick URL/magnet entry and media controls.

After editing extension files, press the extension's **Reload** button on the browser extensions page, then reopen the popup.

### Firefox (temporary development install)

The source's `extension\manifest.firefox.json` is the Firefox manifest. Create a development copy without changing the Chromium version:

```powershell
New-Item -ItemType Directory -Force extension-firefox | Out-Null
Copy-Item extension\* extension-firefox -Recurse -Force
Copy-Item extension-firefox\manifest.firefox.json extension-firefox\manifest.json -Force
Remove-Item extension-firefox\manifest.firefox.json -Force
```

Open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on…**, and select `extension-firefox\manifest.json`. Temporary add-ons can disappear when Firefox restarts. For distribution, use a Mozilla-signed XPI; `build-windows.ps1` and CI support signing when the required Mozilla API secrets are configured.

## Using Badzy

- **Direct download:** click **Add URL** in the desktop toolbar, or paste a normal web address in the extension's **Add a download** field.
- **Video / audio:** use a supported page's floating download control, the extension popup, or its right-click menu. Video qualities and site compatibility depend on `yt-dlp` and the source site.
- **Playlist:** use the desktop **Playlist** tool or the extension's playlist action on supported YouTube pages.
- **Torrent:** open **Torrent** in the desktop toolbar to paste a magnet link or choose a local `.torrent` file. A magnet link can also be sent from the extension's Quick Add field or by clicking a magnet link while the extension is enabled. Torrent transfers use the bundled `aria2c` helper; by default, seeding after completion is disabled unless configured in Options.
- **Pause / resume:** supported HTTP jobs preserve segment state; resuming still depends on the server continuing to provide the same resource and supporting range requests.
- **Speed controls:** set the connection count for supported downloads, use the speed limiter when needed, and adjust queue concurrency in the app's settings. More connections are not always faster and some hosts throttle or reject them.

The extension talks to the desktop app through a loopback-only API on `127.0.0.1` (default port `9614`). It requires the `X-SwiftGet` header and only permits known browser-extension origins; CORS preflights are rejected. Do not expose that API on a public interface.

## Build outputs

After `BUILD.bat` finishes:

| Path | Purpose |
|---|---|
| `dist\Badzy-Setup.exe` | Windows installer |
| `dist\version.json` | release metadata used by the signed auto-updater |
| `target\release\Badzy.exe` | compiled desktop program |
| `build-cache\stage\extension` | packaged Chromium extension |
| `build-cache\stage\extension-firefox` | packaged Firefox extension |
| `build-cache\` | cached `yt-dlp`, `aria2c`, ffmpeg, and build downloads |

`dist` is cleaned of older loose helper binaries by the packaging script. The staged extension folders are build intermediates; for everyday use, install the extension from the repository or unpacked build copy.

## Project layout

```text
crates/engine/       Download engine: HTTP segmentation, resume, queues, HLS, torrents
crates/app/          Rust desktop app, local extension API, system integration
crates/app/ui/       Slint windows, widgets, themes, dialogs, progress animation
crates/app/lang/     Desktop UI translations
extension/           Chromium extension + Firefox source manifest + tests
installer/           Inno Setup configuration and wizard artwork
tools/ffmpeg/        ffmpeg build helper
build-windows.ps1    one-click dependency, build, and packaging script
BUILD.bat            Windows double-click entry point
```

## Make it yours before publishing

1. **Repository URL:** replace `YOUR_GITHUB_USERNAME/badzy` in `crates/engine/src/selfupdate.rs` and the Firefox `update_url` in `extension/manifest.firefox.json` with your actual GitHub owner/repository.
2. **Version:** update `[workspace.package].version` in `Cargo.toml` and the `version` field in both extension manifests together. Check `installer/badzy.iss` if you change installer naming or upgrade behavior.
3. **Colors:** edit the `Theme` arrays in `crates/app/ui/common.slint`. Mode `1` is the dark red theme; mode `5` is pure black.
4. **Extension look:** edit `extension/popup.html` and `extension/options.html`; popup behavior is in `extension/popup.js`, settings behavior is in `extension/options.js`, and browser integration is in `extension/background.js` / `extension/content.js`.
5. **Icons:** replace `crates/app/icon.ico`, `crates/app/ui/icon.png`, `crates/app/ui/icon-window.png`, `crates/app/ui/tray32.rgba`, and the PNGs in `extension/icons`.
6. **Installer art:** edit `installer/badzy.iss` and the wizard bitmaps beside it.
7. **Auto-update signing:** for releases, configure the update signing key/secrets described in `.github/workflows/build.yml`; don't publish a binary/update manifest that can't verify against the public key in the source.

## Known practical limits

- The app targets Windows; the native build and packaged installer are Windows-first.
- Some sites change their video delivery frequently. Update `yt-dlp` and retest when media extraction fails.
- A web URL ending in `.torrent` is currently treated as a direct web download by Quick Add. To add a `.torrent` file as a torrent, download it and open it with the desktop **Torrent** button. Magnet links can be submitted directly.
- A clean full installer build downloads dependencies, so it is not an offline one-click build. `cargo build --release` is the fastest compile-only command once dependencies are cached.
- The full Rust compiler build/test suite could not be run in this Linux authoring environment because the Rust toolchain is not installed. JavaScript syntax checks and both extension test suites pass; run the Windows build command above to verify the Slint/Rust changes on the target platform.

## License

Badzy is distributed under the MIT license as declared by the workspace. Third-party component notices and relevant licenses are collected in `THIRD-PARTY-NOTICES.txt`.
