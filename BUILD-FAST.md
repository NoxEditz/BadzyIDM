# Badzy — build fast

## Full Windows installer (recommended)

1. Extract the source ZIP to a writable folder, e.g. `C:\dev\badzy`.
2. Double-click `BUILD.bat`.
3. Approve the installer prompts for MSVC Build Tools / Rust / Inno Setup if they appear.
4. When complete, run `dist\Badzy-Setup.exe`.

First build: internet required. It downloads the Rust toolchain/dependencies and helper tools; the first full install can take a while. Keep the terminal open and read the first red error if it fails.

## Compile only (if Rust + MSVC are already installed)

```powershell
cargo build --release
```

Output: `target\release\Badzy.exe`. This command does not make the installer or bundle helper executables.

## Test the extension

```powershell
node --check extension/background.js
node --check extension/popup.js
node --check extension/options.js
node extension/test/yt-core.test.js
node extension/test/background.sim.js
```

## Load Chrome / Edge extension

1. Start Badzy desktop.
2. Visit `chrome://extensions` or `edge://extensions`.
3. Enable **Developer mode** → **Load unpacked** → choose the repository's `extension` folder.
4. Pin Badzy in the browser toolbar.

## Important

- The native desktop build targets Windows x64.
- `manifest.firefox.json` is the Firefox-specific source manifest; the full build prepares a separate `extension-firefox` folder.
- Quick Add accepts normal HTTP(S) links and magnet links. For a `.torrent` file stored on disk, use the desktop app's **Torrent** button.
- See `README.md` for manual prerequisites, test details, outputs, architecture, and release signing setup.
