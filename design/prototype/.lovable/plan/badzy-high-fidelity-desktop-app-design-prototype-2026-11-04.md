# Badzy — high-fidelity desktop app design prototype

Build the full "Badzy" download-manager design prototype in this TanStack Start app: React 19 + Tailwind v4 + framer-motion, fake data only, no backend. Every screen is a route; a global "screen index" overlay lets you jump between them. Use the uploaded logo everywhere (title bars, sidebar, installer, tray, empty states, favicon) — never redraw it.

## Brand & tokens (src/styles.css)

- Surfaces: window `#08090f`, panel `#121218`, raised `#1a1a22`, border `#2a0f1b`, accent `#f20b36`, accent-2 `#ff4d6a`, text `#f4eff7`, muted `#a19aaa`, success `#00d676`, warning `#e08a00`, error `#ff8a5c`. All as CSS custom properties mapped in `@theme inline` (oklch-converted), Tailwind utilities like `bg-panel`, `text-accent`.
- Theme system: `data-theme` attribute on the stage root swaps 8 alternative accent themes (blue, violet, green, orange, teal, pink, mono, light) plus full light mode — token swaps only, no component changes. A theme picker in Settings › Appearance and in the screen index.
- Type: Outfit (UI) + Kaushan Script ("Badzy" wordmark only), loaded via `<link>` in `src/routes/__root.tsx` head (never @import in CSS). Scale 11/12/13/14/18/26/46, weights 500–800, tight tracking headings, uppercase 10px wide-tracked labels.
- Radii: windows 22px, cards 16px, controls 10–12px, chips fully round. 1px red-tinted borders everywhere.
- Motion: 150–350ms ease-out; hover lift 1.03–1.05, press 0.95; slide+fade screen transitions; animated hamburger→X; shimmer progress bars; pulsing logo glow; row stagger-in; springy switch knobs; count-up numbers. Respect `prefers-reduced-motion`.

## Foundation components (src/components/badzy/)

- `WindowFrame` — frameless native window: 22px radius, 1px border, 3px red→pink gradient top line, title strip with logo + title + round min/max/close buttons, fixed pixel size prop.
- `Stage` — dark backdrop that centers each window at its exact size (auto-scales down to fit the browser viewport), hosts the screen-index overlay.
- Marble brand art: pure SVG/CSS animated red liquid-marble/lava-vein texture (slow drift), used in sidebar, empty states, installer, about — always darkened with a gradient veil.
- Controls (each with default/hover/pressed/focus/disabled): primary button (red gradient + glow), secondary, ghost, icon button, text field, dropdown popup, number stepper (1–32), switch, checkbox, radio, tabs, slider, segmented control, progress bar (shimmer), ring progress, tooltip, context menu, toast, badge, chip, custom scrollbar.
- File-type tiles: rounded squares tinted per type (video, audio, archive, program, image, pdf, doc, sheet, slides, torrent, disc, general) with crisp inline SVG line icons. Base line icons from lucide-react (24px grid, 1.75 stroke, round caps) plus custom ones — no emoji, no bitmaps.

## Logo & favicon

- Upload `icon128.png` via lovable-assets to `src/assets/badzy-logo.png.asset.json`; reference the pointer URL in the title bar, sidebar, installer, tray, empty states, about.
- Favicon: real resized file at `public/favicon.png` (64x64, padded), referenced from `__root.tsx` head; delete `public/favicon.ico`.

## Routes (each screen = route, all inside a shared stage layout)

1. `/` — Main window 1120×680 with width states 760 / 1000 / 1400 (toggle chips): title strip; top bar with animated hamburger → slide-in drawer (full command list), logo + wordmark, search pill, bell with red dot, settings; left nav (All Downloads, Unfinished, Finished, Scheduler, Grabber, Playlist, Torrent, Add Badzy to my browser, Options) collapsing to icons when narrow, marble art + "Better. Faster. Yours." at bottom; category tiles with counts; toolbar (Add URL, Add Batch, Resume, Stop, Stop All, Delete, Delete Done, Limiter, Start/Stop Queue); download table (running/paused/failed/finished/hover/selected rows, live progress, thin status line, extra columns hide when narrow, right-click context menu); right panel (categories + queues tree, Active downloads card, disk usage card) hidden when narrow; status bar; empty state variant; drawer menu with all listed commands.
2. `/add-download` — 700×560 dialog: URL + Check, status line, warning banner, file card, Category dropdown, Save As + Browse, remember-path checkbox, description, connections stepper, queue dropdown, authorization switch, Cancel / Download Later / Start Download / Download with the browser. Arabic RTL variant toggle.
3. `/dialogs` — Add batch (links list + numbered pattern), per-download progress window (ring, segment bar, tabs), download-complete dialog, properties dialog.
4. `/settings` — left tab list: General, Save to, Downloads, Connection, File types, Sounds, Appearance (9 theme swatches, font size, glass, background), Browser, Updates, Language, About — every tab filled.
5. `/tools` — Torrent/magnet dialog with file list, Playlist dialog (checkboxes + quality), Site grabber (rules + results), Scheduler, Queue editor, Speed limiter, Columns, Find, What's new, first-run welcome with browser-extension step.
6. `/system` — tray menu + "download finished" toast simulation.
7. `/extension` — 360px popup (detected downloads, Download buttons, on/off switch, Open Badzy) + options page, same tokens.
8. `/installer` — 820×500: Welcome, Options, Install with ring progress, Done — same chrome + marble art.
9. `/design-system` — color tokens, type scale, spacing, radii, shadows, every icon, every control in every state, motion specs, written token table.

Plus `/ar` — Arabic RTL main window + Add dialog with mirrored layout and real Arabic text.

## Screen index overlay

Collapsible left overlay (toggle button, lists all routes grouped) available on every screen; active screen highlighted.

## Fake data

One shared module with realistic download rows (mixed types/statuses/speeds), categories, queues, torrents, playlist items, grabber results — reused across screens.

## Order of work

1. Tokens + fonts + logo/favicon + Stage/WindowFrame/ThemeSwitch + screen index.
2. Marble art + core controls + icons.
3. Main window (all states) → Add dialog → dialogs → settings → tools → system → extension → installer → design system → RTL.
4. Framer-motion added for all animation (`bun add framer-motion`).

## Verification

- Playwright pass over every route: screenshot each window at its stated size, check console for errors, verify legibility and fixed sizes.
- Test that the screen-index overlay navigates between routes and that all routes render non-blank.
- Typecheck green; no build errors.
