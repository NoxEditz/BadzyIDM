import type { FileKind } from "./icons";

export type DownloadStatus = "running" | "paused" | "failed" | "finished" | "queued";

export interface DownloadRow {
  id: number;
  name: string;
  kind: FileKind;
  size: string;
  progress: number;
  status: DownloadStatus;
  speed: string;
  eta: string;
  lastTry: string;
  added: string;
  saveTo: string;
  queue: string;
}

export const downloads: DownloadRow[] = [
  { id: 1, name: "Interstellar.2014.1080p.BluRay.x264.mkv", kind: "video", size: "2.18 GB", progress: 62, status: "running", speed: "8.4 MB/s", eta: "3 min 12 s", lastTry: "Just now", added: "2 min ago", saveTo: "D:\\Movies", queue: "Main" },
  { id: 2, name: "Blender-4.5.2-LTS-windows-x64.exe", kind: "program", size: "389 MB", progress: 41, status: "running", speed: "3.1 MB/s", eta: "1 min 44 s", lastTry: "Just now", added: "6 min ago", saveTo: "C:\\Programs", queue: "Main" },
  { id: 3, name: "ubuntu-24.04.3-desktop-amd64.iso", kind: "disc", size: "5.90 GB", progress: 78, status: "running", speed: "2.2 MB/s", eta: "6 min 03 s", lastTry: "Just now", added: "31 min ago", saveTo: "D:\\ISO", queue: "Main" },
  { id: 4, name: "Deep_Work-Audiobook-Ch2.mp3", kind: "audio", size: "540 MB", progress: 96, status: "running", speed: "1.8 MB/s", eta: "14 s", lastTry: "Just now", added: "1 h ago", saveTo: "D:\\Music", queue: "Night" },
  { id: 5, name: "big-buck-bunny-1080p.torrent", kind: "torrent", size: "1.40 GB", progress: 55, status: "running", speed: "612 KB/s", eta: "12 min", lastTry: "Just now", added: "2 h ago", saveTo: "D:\\Torrents", queue: "Main" },
  { id: 6, name: "Aurora_S2_OST_FLAC.rar", kind: "archive", size: "1.20 GB", progress: 0, status: "paused", speed: "—", eta: "—", lastTry: "4 min ago", added: "3 h ago", saveTo: "D:\\Music", queue: "Night" },
  { id: 7, name: "Cyberpunk-2077-Update-2.31.zip", kind: "archive", size: "14.8 GB", progress: 23, status: "paused", speed: "—", eta: "—", lastTry: "18 min ago", added: "5 h ago", saveTo: "E:\\Games", queue: "Main" },
  { id: 8, name: "Portfolio_Broll_4k.mov", kind: "video", size: "8.30 GB", progress: 12, status: "paused", speed: "—", eta: "—", lastTry: "1 h ago", added: "Yesterday", saveTo: "D:\\Work", queue: "Work" },
  { id: 9, name: "wallpaper_pack_4k.7z", kind: "archive", size: "620 MB", progress: 34, status: "failed", speed: "—", eta: "—", lastTry: "9 min ago", added: "Yesterday", saveTo: "D:\\Images", queue: "Main" },
  { id: 10, name: "Q4-Marketing-Deck.pptx", kind: "slides", size: "84 MB", progress: 100, status: "finished", speed: "—", eta: "—", lastTry: "10:24", added: "2 h ago", saveTo: "D:\\Work", queue: "Work" },
  { id: 11, name: "invoice_2026_11.pdf", kind: "pdf", size: "2.1 MB", progress: 100, status: "finished", speed: "—", eta: "—", lastTry: "09:41", added: "3 h ago", saveTo: "D:\\Docs", queue: "Work" },
  { id: 12, name: "spring-boot-notes.docx", kind: "doc", size: "18 MB", progress: 100, status: "finished", speed: "—", eta: "—", lastTry: "Yesterday", added: "2 days ago", saveTo: "D:\\Docs", queue: "Work" },
  { id: 13, name: "sunset_beach_4k.jpg", kind: "image", size: "12 MB", progress: 100, status: "finished", speed: "—", eta: "—", lastTry: "Yesterday", added: "3 days ago", saveTo: "D:\\Images", queue: "Main" },
  { id: 14, name: "dataset_v3.csv", kind: "sheet", size: "210 MB", progress: 0, status: "queued", speed: "—", eta: "—", lastTry: "—", added: "5 min ago", saveTo: "D:\\Work", queue: "Work" },
];

export const categories: { key: string; label: string; count: number; kind: FileKind }[] = [
  { key: "all", label: "All", count: 137, kind: "general" },
  { key: "compressed", label: "Compressed", count: 18, kind: "archive" },
  { key: "documents", label: "Documents", count: 24, kind: "doc" },
  { key: "music", label: "Music", count: 31, kind: "audio" },
  { key: "programs", label: "Programs", count: 12, kind: "program" },
  { key: "video", label: "Video", count: 41, kind: "video" },
  { key: "images", label: "Images", count: 11, kind: "image" },
];

export const queues = [
  { name: "Main queue", count: 6, active: true },
  { name: "Night queue", count: 3, active: false },
  { name: "Work queue", count: 2, active: true },
];

export const torrentFiles = [
  { name: "movie.1080p.mkv", size: "1.28 GB", selected: true, priority: "Normal" },
  { name: "sample.mkv", size: "84 MB", selected: true, priority: "Normal" },
  { name: "subtitles.eng.srt", size: "196 KB", selected: true, priority: "Normal" },
  { name: "cover.jpg", size: "2.4 MB", selected: false, priority: "Skip" },
  { name: "extras/trailer.mkv", size: "212 MB", selected: false, priority: "Skip" },
];

export const playlistItems = [
  { title: "S01E01 — The Signal", duration: "42:18", size: "1.1 GB", selected: true },
  { title: "S01E02 — Drift", duration: "38:52", size: "980 MB", selected: true },
  { title: "S01E03 — Undertow", duration: "44:05", size: "1.2 GB", selected: false },
  { title: "S01E04 — Nightfall", duration: "41:37", size: "1.0 GB", selected: false },
  { title: "Bonus — Making of", duration: "22:10", size: "520 MB", selected: false },
];

export const grabberResults = [
  { file: "hero-banner.png", type: "image", size: "840 KB" },
  { file: "gallery-01.jpg", type: "image", size: "1.2 MB" },
  { file: "gallery-02.jpg", type: "image", size: "1.1 MB" },
  { file: "promo-teaser.mp4", type: "video", size: "48 MB" },
  { file: "brochure.pdf", type: "pdf", size: "3.4 MB" },
];

export const scheduledTasks = [
  { name: "Night queue — start", when: "Daily at 02:00", action: "Start queue: Night", on: true },
  { name: "Night queue — stop", when: "Daily at 07:00", action: "Stop all downloads", on: true },
  { name: "Weekly backup sync", when: "Sun at 21:30", action: "Download list: backup", on: false },
  { name: "Speed limit — evening", when: "Daily at 19:00", action: "Limiter on (2 MB/s)", on: true },
];

export const fmtBytes = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb} MB`);
