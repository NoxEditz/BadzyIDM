# Badzy prototype roadmap

- [x] Migrate prototype from uploaded archive
- [ ] Popup system: every button opens a designed window/popup or shows a toast (no real tool logic)
  - [ ] Stage-level popup stack + toasts, window close/minimize wired
  - [ ] Main window: toolbar, nav, categories, right panel, status bar, drawer, context menu, bell, chrome
  - [ ] New dialogs: confirm, exit, folder picker, open with, move/rename, export, import, hashes, error details, refresh address, update, disk usage, extension install, file-type rule, schedule rule, add queue, grabber rule, site exception
  - [ ] Existing dialogs/tools/settings/tray/extension/installer/arabic buttons wired
  - [ ] Controls without handlers become interactive
  - [ ] Verify in browser
- [ ] Bring the new design into the Windows app (Rust + Slint) while keeping its real download engine — blocked: needs approach confirmed and GitHub connected
- [ ] Add a GitHub Actions build workflow based on the original build.yml — blocked: GitHub not connected
- [ ] Recommend a next step after the remix (answered in chat)
