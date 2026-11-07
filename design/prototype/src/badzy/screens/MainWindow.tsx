import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownToLine,
  Bell,
  CalendarClock,
  CircleAlert,
  Columns3,
  CheckCheck,
  CircleCheck,
  CircleDashed,
  Download,
  FileDown,
  FolderOpen,
  Gauge,
  Globe,
  HardDrive,
  Import,
  Layers,
  Link2,
  ListPlus,
  ListVideo,
  Magnet,
  MonitorPlay,
  Move,
  Pause,
  Pencil,
  Play,
  Plus,
  Puzzle,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  Settings2,
  Share2,
  Square,
  SquareArrowOutUpRight,
  SquareStack,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WindowFrame, Wordmark } from "../WindowFrame";
import { useNative } from "../context";
import { MarbleArt } from "../MarbleArt";
import { FileTypeTile } from "../icons";
import { categories, queues, downloads as seedRows, type DownloadRow } from "../data";
import {
  Badge,
  Button,
  Chip,
  CountUp,
  IconButton,
  ProgressBar,
  Segmented,
  Switch,
  Tip,
  useContextMenu,
  type MenuItem,
} from "../ui";
import { useApp } from "../context";
import { ConfirmDialog } from "../dialogs/common";
import { ExportListDialog, ImportListDialog, MoveRenameDialog, OpenWithDialog } from "../dialogs/files";
import {
  DiskUsageDialog,
  ErrorDetailsDialog,
  ExitDialog,
  ExtensionInstallDialog,
  RefreshAddressDialog,
  UpdateDialog,
  startedToast,
} from "../dialogs/app";
import { AddDownloadWindow } from "./AddDownload";
import { AddBatchWindow, CompleteDialog, ProgressWindow, PropertiesDialog } from "./Dialogs";
import {
  ColumnsDialog,
  FindDialog,
  GrabberDialog,
  PlaylistDialog,
  QueueEditorDialog,
  SchedulerDialog,
  SpeedLimiterDialog,
  TorrentDialog,
  WhatsNewDialog,
} from "./Tools";
import Settings from "./Settings";
import type { FileKind } from "../icons";

const WIDTHS = [
  { value: "760", label: "760" },
  { value: "1000", label: "1000" },
  { value: "1120", label: "1120" },
  { value: "1400", label: "1400" },
] as const;

const navItems = [
  { label: "All Downloads", icon: Download, count: 137 },
  { label: "Unfinished", icon: CircleDashed, count: 7 },
  { label: "Finished", icon: CircleCheck, count: 130 },
  { label: "Scheduler", icon: CalendarClock },
  { label: "Grabber", icon: Globe },
  { label: "Playlist", icon: ListVideo },
  { label: "Torrent", icon: Magnet },
  { label: "Add Badzy to my browser", icon: Puzzle },
  { label: "Options", icon: Settings2 },
];

const drawerGroups: { title: string; items: { label: string; icon: typeof Play; shortcut?: string }[] }[] = [
  {
    title: "New download",
    items: [
      { label: "Add URL…", icon: Link2 },
      { label: "Add batch download…", icon: ListPlus },
      { label: "Add batch from clipboard", icon: Import },
      { label: "Grabber…", icon: Globe },
      { label: "Playlist…", icon: ListVideo },
      { label: "Torrent / magnet…", icon: Magnet },
    ],
  },
  {
    title: "Control",
    items: [
      { label: "Download now", icon: Play, shortcut: "Space" },
      { label: "Stop", icon: Pause, shortcut: "S" },
      { label: "Stop all", icon: Square, shortcut: "⌥S" },
    ],
  },
  {
    title: "Item",
    items: [
      { label: "Open", icon: SquareArrowOutUpRight },
      { label: "Open with…", icon: MonitorPlay },
      { label: "Play while downloading", icon: MonitorPlay },
      { label: "Move / Rename…", icon: Move },
      { label: "Copy address", icon: Share2, shortcut: "⌘C" },
      { label: "Redownload", icon: RefreshCw },
      { label: "Refresh address", icon: RefreshCw },
    ],
  },
  {
    title: "List",
    items: [
      { label: "Open folder", icon: FolderOpen },
      { label: "Export list…", icon: FileDown },
      { label: "Import list…", icon: Import },
      { label: "Remove", icon: Trash2 },
      { label: "Select all", icon: SquareStack, shortcut: "⌘A" },
      { label: "Columns…", icon: Layers },
      { label: "Find…", icon: Search, shortcut: "⌘F" },
    ],
  },
];

const categoryKinds: Record<string, FileKind[] | null> = {
  all: null,
  compressed: ["archive"],
  documents: ["doc", "pdf", "sheet", "slides"],
  music: ["audio"],
  programs: ["program", "disc"],
  video: ["video", "torrent"],
  images: ["image"],
};

const notifications = [
  { id: "update", title: "New version available", sub: "Badzy 3.2.0 · 24 MB", tone: "accent" as const },
  { id: "failed", title: "wallpaper_pack_4k.7z failed", sub: "HTTP 403 · link expired · 9 min ago", tone: "error" as const },
  { id: "done", title: "Q4-Marketing-Deck.pptx finished", sub: "84 MB · D:\\Work · 2 h ago", tone: "success" as const },
];

const statusTone: Record<DownloadRow["status"], { label: string; className: string }> = {
  running: { label: "Downloading", className: "text-accent" },
  paused: { label: "Paused", className: "text-muted" },
  failed: { label: "Failed", className: "text-error" },
  finished: { label: "Done", className: "text-success" },
  queued: { label: "Queued", className: "text-warning" },
};

function statusCell(row: DownloadRow) {
  const tone = statusTone[row.status];
  return (
    <div className="w-full">
      <div className={cn("text-12 font-medium", tone.className)}>{tone.label}</div>
      {row.status !== "finished" && row.progress > 0 && (
        <ProgressBar value={row.progress} running={row.status === "running"} height="h-[3px]" className="mt-1" />
      )}
      {row.status === "finished" && (
        <ProgressBar value={100} height="h-[3px]" className="mt-1 opacity-40" />
      )}
    </div>
  );
}

export default function MainWindow() {
  const [width, setWidth] = useState<"760" | "1000" | "1120" | "1400">("1120");
  const [empty, setEmpty] = useState(false);
  const nat0 = useNative();
  const [rows, setRows] = useState<DownloadRow[]>(nat0.native ? [] : seedRows);
  useEffect(() => {
    if (!nat0.native) return;
    const b = ((window as unknown as { __badzy?: Record<string, unknown> }).__badzy ??= {});
    b['rows'] = (list: DownloadRow[]) => setRows(list);
    return () => {
      delete b['rows'];
    };
  }, [nat0.native]);
  const [selected, setSelected] = useState<number>(1);
  const [drawer, setDrawer] = useState(false);
  const [bell, setBell] = useState(false);
  const [limiter, setLimiter] = useState(true);
  const [search, setSearch] = useState("");
  const [navIdx, setNavIdx] = useState(0);
  const [cat, setCat] = useState("all");
  const [unread, setUnread] = useState(true);
  const [queueState, setQueueState] = useState(queues.map((q) => ({ ...q })));
  const { open, toast } = useApp();

  const sel = rows.find((r) => r.id === selected) ?? rows[0];
  const setStatus = (ids: number[], status: DownloadRow["status"]) =>
    setRows((rs) =>
      rs.map((r) =>
        ids.includes(r.id) && r.status !== "finished"
          ? { ...r, status, speed: status === "running" ? "1.2 MB/s" : "—", eta: status === "running" ? "calculating…" : "—", lastTry: "Just now" }
          : r,
      ),
    );

  const a = {
    addUrl: () => open(<AddDownloadWindow />),
    addBatch: (clip = false) => open(<AddBatchWindow fromClipboard={clip} />),
    grabber: () => open(<GrabberDialog />),
    playlist: () => open(<PlaylistDialog />),
    torrent: () => open(<TorrentDialog />),
    scheduler: () => open(<SchedulerDialog />),
    extension: () => open(<ExtensionInstallDialog />),
    settings: () => open(<Settings />),
    limiter: () => open(<SpeedLimiterDialog />),
    queues: () => open(<QueueEditorDialog />),
    columns: () => open(<ColumnsDialog />),
    find: () => open(<FindDialog />),
    exportList: () => open(<ExportListDialog />),
    importList: () => open(<ImportListDialog />),
    disk: () => open(<DiskUsageDialog />),
    resume: () => {
      if (!sel) return;
      if (sel.status === "finished") return toast({ title: "Already finished", message: sel.name, tone: "muted" });
      if (nat.native) nat.send("resume", { ids: [sel.id] });
      else setStatus([sel.id], "running");
      toast(startedToast(sel.name));
    },
    stop: () => {
      if (!sel) return;
      if (sel.status !== "running") return toast({ title: "Not downloading", message: sel.name, tone: "muted" });
      if (nat.native) nat.send("pause", { ids: [sel.id] });
      else setStatus([sel.id], "paused");
      toast({ title: "Download paused", message: sel.name, tone: "muted", icon: <Pause className="h-4 w-4" /> });
    },
    stopAll: () => {
      const ids = rows.filter((r) => r.status === "running" || r.status === "queued").map((r) => r.id);
      if (nat.native) nat.send("pauseAll");
      else setStatus(ids, "paused");
      setQueueState((qs) => qs.map((q) => ({ ...q, active: false })));
      toast({ title: "All downloads stopped", message: `${ids.length} downloads paused`, tone: "muted", icon: <Square className="h-4 w-4" /> });
    },
    remove: () =>
      sel &&
      open(
        <ConfirmDialog
          title="Delete download"
          heading="Delete this download?"
          message={<><span className="text-ink">{sel.name}</span> will be removed from the list.</>}
          icon={<Trash2 />}
          tone="error"
          danger
          option="Also delete the file from disk"
          confirmLabel="Delete"
          onConfirm={(fromDisk) => {
            if (nat.native) nat.send("remove", { ids: [sel.id], file: !!fromDisk });
            else setRows((rs) => rs.filter((r) => r.id !== sel.id));
            toast({ title: fromDisk ? "Download and file deleted" : "Removed from list", message: sel.name, tone: "muted", icon: <Trash2 className="h-4 w-4" /> });
          }}
        />,
      ),
    removeFinished: () => {
      const done = rows.filter((r) => r.status === "finished");
      open(
        <ConfirmDialog
          title="Delete finished"
          heading={`Clear ${done.length} finished downloads?`}
          message="They are removed from the list. Files stay on your disk unless you tick the box."
          icon={<CheckCheck />}
          tone="warning"
          option="Also delete the files from disk"
          confirmLabel={`Clear ${done.length}`}
          onConfirm={(fromDisk) => {
            if (nat.native) nat.send("remove", { ids: done.map((r) => r.id), file: !!fromDisk });
            else setRows((rs) => rs.filter((r) => r.status !== "finished"));
            toast({ title: `${done.length} finished downloads cleared`, tone: "success" });
          }}
        />,
      );
    },
    redownload: () =>
      sel &&
      open(
        <ConfirmDialog
          title="Redownload"
          heading="Download this file again?"
          message={<>The existing copy of <span className="text-ink">{sel.name}</span> will be replaced.</>}
          icon={<RefreshCw />}
          tone="accent"
          confirmLabel="Redownload"
          onConfirm={() => {
            if (nat.native) nat.send("redownload", { ids: [sel.id] });
            else setRows((rs) => rs.map((r) => (r.id === sel.id ? { ...r, status: "running", progress: 0, speed: "1.0 MB/s", eta: "calculating…" } : r)));
            toast(startedToast(sel.name));
          }}
        />,
      ),
    openFolder: () => sel && (nat.native && nat.send("openFolder", { id: sel.id }), true) && toast({ title: "Opening folder", message: sel.saveTo, tone: "accent", icon: <FolderOpen className="h-4 w-4" /> }),
    openFile: () =>
      sel &&
      (sel.status === "finished"
        ? (nat.native && nat.send("openFile", { id: sel.id }), toast({ title: "Opening file", message: sel.name, tone: "accent", icon: <SquareArrowOutUpRight className="h-4 w-4" /> }))
        : toast({ title: "File isn't finished yet", message: `${sel.progress.toFixed(0)}% downloaded — try “Play while downloading”.`, tone: "warning" })),
    openWith: () => sel && open(<OpenWithDialog file={sel.name} kind={sel.kind} />),
    play: () =>
      sel &&
      (sel.kind === "video" || sel.kind === "audio"
        ? toast({ title: "Playing while downloading", message: `${sel.name} · opening in VLC`, tone: "accent", icon: <MonitorPlay className="h-4 w-4" /> })
        : toast({ title: "Preview not available", message: "Only video and audio can play while downloading.", tone: "warning" })),
    move: () => sel && open(<MoveRenameDialog id={sel.id} name={sel.name} folder={sel.path ? sel.path.slice(0, Math.max(sel.path.lastIndexOf("\\"), sel.path.lastIndexOf("/"))) : sel.saveTo} kind={sel.kind} />),
    copy: () => sel && (nat.native && sel.url && void navigator.clipboard?.writeText(sel.url), true) && toast({ title: "Address copied", message: nat.native ? (sel.url ?? "") : `https://cdn.example.com/${sel.name}`, tone: "success", icon: <Share2 className="h-4 w-4" /> }),
    refresh: () => open(<RefreshAddressDialog />),
    properties: () => sel && open(<PropertiesDialog name={sel.name} />),
    details: (r: DownloadRow) => {
      setSelected(r.id);
      if (r.status === "finished") open(<CompleteDialog name={r.name} />);
      else if (r.status === "failed") open(<ErrorDetailsDialog name={r.name} kind={r.kind} />);
      else open(<ProgressWindow name={r.name} />);
    },
    selectAll: () => toast({ title: `${visible.length} downloads selected`, tone: "muted", icon: <SquareStack className="h-4 w-4" /> }),
    startQueue: () => {
      const ids = rows.filter((r) => r.queue === "Main" && (r.status === "paused" || r.status === "queued")).map((r) => r.id);
      if (nat.native) nat.send("startQueue");
      else setStatus(ids, "running");
      setQueueState((qs) => qs.map((q) => (q.name === "Main queue" ? { ...q, active: true } : q)));
      toast({ title: "Main queue started", message: `${ids.length} downloads resumed`, tone: "accent", icon: <Play className="h-4 w-4" /> });
    },
    stopQueue: () => {
      const ids = rows.filter((r) => r.queue === "Main" && r.status === "running").map((r) => r.id);
      if (nat.native) nat.send("stopQueue");
      else setStatus(ids, "paused");
      setQueueState((qs) => qs.map((q) => (q.name === "Main queue" ? { ...q, active: false } : q)));
      toast({ title: "Main queue stopped", message: `${ids.length} downloads paused`, tone: "muted", icon: <Square className="h-4 w-4" /> });
    },
  };

  const contextItems: MenuItem[] = [
    { label: "Open", icon: <SquareArrowOutUpRight />, onSelect: a.openFile },
    { label: "Open with…", icon: <MonitorPlay />, onSelect: a.openWith },
    { label: "Open folder", icon: <FolderOpen />, onSelect: a.openFolder },
    { divider: true },
    { label: "Download now", icon: <Play />, onSelect: a.resume, disabled: sel?.status === "running" || sel?.status === "finished" },
    { label: "Stop", icon: <Pause />, onSelect: a.stop, disabled: sel?.status !== "running" },
    { label: "Redownload", icon: <RefreshCw />, onSelect: a.redownload },
    { label: "Refresh address", icon: <RefreshCw />, onSelect: a.refresh },
    { divider: true },
    { label: "Copy address", icon: <Share2 />, shortcut: "⌘C", onSelect: a.copy },
    { label: "Move / Rename…", icon: <Move />, onSelect: a.move },
    { label: "Properties", icon: <Settings2 />, onSelect: a.properties },
    { divider: true },
    { label: "Remove from list", icon: <Trash2 />, danger: true, onSelect: a.remove },
  ];
  const menu = useContextMenu(contextItems);

  const drawerActions: Record<string, () => void> = {
    "Add URL…": a.addUrl,
    "Add batch download…": () => a.addBatch(),
    "Add batch from clipboard": () => a.addBatch(true),
    "Grabber…": a.grabber,
    "Playlist…": a.playlist,
    "Torrent / magnet…": a.torrent,
    "Download now": a.resume,
    Stop: a.stop,
    "Stop all": a.stopAll,
    Open: a.openFile,
    "Open with…": a.openWith,
    "Play while downloading": a.play,
    "Move / Rename…": a.move,
    "Copy address": a.copy,
    Redownload: a.redownload,
    "Refresh address": a.refresh,
    "Open folder": a.openFolder,
    "Export list…": a.exportList,
    "Import list…": a.importList,
    Remove: a.remove,
    "Select all": a.selectAll,
    "Columns…": a.columns,
    "Find…": a.find,
  };

  const navAction = (i: number) => {
    const label = navItems[i]!.label;
    if (i <= 2) return setNavIdx(i);
    ({
      Scheduler: a.scheduler,
      Grabber: a.grabber,
      Playlist: a.playlist,
      Torrent: a.torrent,
      "Add Badzy to my browser": a.extension,
      Options: a.settings,
    })[label as "Scheduler"]?.();
  };

  const nat = useNative();
  const w = nat.native ? nat.vw : Number(width);
  const narrow = w <= 1000;
  const extraNarrow = w <= 760;
  const catCount = (key: string, fake: number) => {
    if (!nat.native) return fake;
    const k = categoryKinds[key];
    return k ? rows.filter((r) => k.includes(r.kind)).length : rows.length;
  };
  const navCount = (label: string, fake?: number) => {
    if (!nat.native) return fake;
    if (label === "All Downloads") return rows.length;
    if (label === "Unfinished") return rows.filter((r) => r.status !== "finished").length;
    if (label === "Finished") return rows.filter((r) => r.status === "finished").length;
    return fake;
  };
  const showPanel = w > 1180;
  const cw = w - (narrow ? 56 : 208) - (showPanel ? 256 : 0);

  /* live rows */
  useEffect(() => {
    if (nat.native) return;
    const t = setInterval(() => {
      setRows((rs) =>
        rs.map((r) => {
          if (r.status !== "running") return r;
          const p = r.progress + Math.random() * 0.8;
          const speed = `${(parseFloat(r.speed) + (Math.random() - 0.5) * 0.6).toFixed(1)} ${r.speed.includes("GB") ? "GB" : r.speed.split(" ")[1]}`;
          return p >= 100
            ? { ...r, progress: 100, status: "finished" as const, speed: "—", eta: "—" }
            : { ...r, progress: p, speed };
        }),
      );
    }, 1400);
    return () => clearInterval(t);
  }, []);

  const kinds = categoryKinds[cat];
  const visible = rows.filter(
    (r) =>
      (!search || r.name.toLowerCase().includes(search.toLowerCase())) &&
      (navIdx !== 1 || r.status !== "finished") &&
      (navIdx !== 2 || r.status === "finished") &&
      (!kinds || kinds.includes(r.kind)),
  );
  const running = rows.filter((r) => r.status === "running");

  return (
    <div className={cn("flex flex-col items-center gap-3", nat.native && "h-full")}>
      {/* screen controls (outside the window) */}
      <div className={cn("items-center gap-2", nat.native ? "hidden" : "flex")}>
        <span className="label-caps">Window width</span>
        <Segmented options={WIDTHS.map((x) => ({ value: x.value, label: x.label }))} value={width} onChange={setWidth} />
        <Chip active={empty} onClick={() => setEmpty((e) => !e)}>
          Empty state
        </Chip>
      </div>

      <WindowFrame
        width={w}
        height={nat.native ? nat.vh : 680}
        title={navIdx === 1 ? "Unfinished" : navIdx === 2 ? "Finished" : "All downloads"}
        onClose={() => open(<ExitDialog running={running.length} />)}
        onMinimize={nat.native ? () => nat.send("minimize") : () => toast({ title: "Minimized to tray", message: `${running.length} downloads keep running.`, tone: "muted" })}
        onMaximize={nat.native ? () => nat.send("maximize") : () => setWidth((x) => (x === "1400" ? "1120" : "1400"))}
      >
        {/* top bar */}
        <div className="relative z-10 flex h-12 shrink-0 items-center gap-3 border-b border-edge/70 px-3">
          <button
            onClick={() => setDrawer((d) => !d)}
            aria-label="Menu"
            className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-ctl text-muted transition-colors hover:bg-accent/10 hover:text-ink"
          >
            <span className={cn("h-[2px] w-[18px] rounded-full bg-current transition-all duration-200", drawer && "translate-y-[3.5px] rotate-45")} />
            <span className={cn("h-[2px] w-[18px] rounded-full bg-current transition-all duration-200", drawer && "-translate-y-[3.5px] -rotate-45")} />
          </button>
          <img src="/favicon.png" alt="" className="h-6 w-6 animate-pulse-glow" draggable={false} />
          <Wordmark className="text-18" />
          <div className="relative ml-4 w-full max-w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search downloads…"
              className="h-8 w-full rounded-full border border-edge bg-panel pl-8 pr-3 text-12 text-ink placeholder:text-muted/60 transition-all duration-200 focus:border-accent/70 focus-ring"
            />
          </div>
          <div className="relative ml-auto flex items-center gap-1">
            <Tip label="New version available — 3.2.0">
              <IconButton onClick={() => setBell((b) => !b)} active={bell} className="relative" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {unread && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent shadow-glow" />}
              </IconButton>
            </Tip>
            <Tip label="Settings">
              <IconButton aria-label="Settings" onClick={a.settings}>
                <SettingsIcon className="h-4 w-4" />
              </IconButton>
            </Tip>
          </div>
          <AnimatePresence>
            {bell && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="absolute right-2 top-[calc(100%+8px)] z-40 w-80 overflow-hidden rounded-card border border-edge bg-panel shadow-pop"
              >
                <div className="flex items-center border-b border-edge/70 px-3.5 py-2.5">
                  <span className="text-13 font-semibold text-ink">Notifications</span>
                  {unread && <Badge tone="accent" className="ml-2">3 new</Badge>}
                  <button onClick={() => setUnread(false)} className="ml-auto text-11 text-muted transition-colors hover:text-accent">
                    Mark all read
                  </button>
                </div>
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-2.5 border-b border-edge/50 px-3.5 py-3 last:border-0">
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        n.tone === "accent" ? "bg-accent/15 text-accent" : n.tone === "error" ? "bg-error/15 text-error" : "bg-success/15 text-success",
                      )}
                    >
                      {n.tone === "accent" ? <ArrowDownToLine className="h-4 w-4" /> : n.tone === "error" ? <CircleAlert className="h-4 w-4" /> : <CircleCheck className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-13 font-semibold text-ink">{n.title}</div>
                      <div className="text-11 text-muted">{n.sub}</div>
                      <div className="mt-2 flex gap-1.5">
                        {n.id === "update" && (
                          <>
                            <Button size="sm" variant="primary" onClick={() => { setBell(false); open(<UpdateDialog />); }}>Update now</Button>
                            <Button size="sm" variant="ghost" onClick={() => { setBell(false); open(<WhatsNewDialog />); }}>What's new</Button>
                          </>
                        )}
                        {n.id === "failed" && (
                          <Button size="sm" variant="secondary" onClick={() => { setBell(false); open(<ErrorDetailsDialog />); }}>View details</Button>
                        )}
                        {n.id === "done" && (
                          <Button size="sm" variant="secondary" onClick={() => { setBell(false); toast({ title: "Opening folder", message: "D:\\Work", tone: "accent" }); }}>Open folder</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* body */}
        <div className="flex min-h-0 flex-1">
          {/* left nav */}
          <nav className={cn("flex shrink-0 flex-col border-r border-edge/70 bg-panel/50", narrow ? "w-14" : "w-52")}>
            <div className="flex-1 overflow-y-auto p-2">
              {navItems.map((it, i) => (
                <motion.button
                  key={it.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25, ease: "easeOut" }}
                  title={narrow ? it.label : undefined}
                  onClick={() => navAction(i)}
                  className={cn(
                    "group mb-0.5 flex w-full items-center gap-2.5 rounded-ctl px-2.5 py-2 text-left transition-colors",
                    i === navIdx ? "bg-accent/12 text-accent" : "text-muted hover:bg-raised hover:text-ink",
                    narrow && "justify-center px-0",
                  )}
                >
                  <it.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {!narrow && (
                    <>
                      <span className={cn("flex-1 truncate text-13 font-medium", i === navIdx && "font-semibold")}>{it.label}</span>
                      {navCount(it.label, it.count) != null && <span className="text-11 text-muted">{navCount(it.label, it.count)}</span>}
                    </>
                  )}
                </motion.button>
              ))}
            </div>
            {!narrow && (
              <div className="relative mx-2 mb-2 h-28 shrink-0 overflow-hidden rounded-card">
                <MarbleArt className="absolute inset-0" veil={0.55} />
                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <Wordmark className="text-16" />
                  <div className="text-11 text-muted">Better. Faster. Yours.</div>
                </div>
              </div>
            )}
          </nav>

          {/* center */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* category tiles */}
            <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-edge/70 px-3 py-2.5">
              {categories.map((c, i) => (
                <motion.button
                  key={c.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25, ease: "easeOut" }}
                  onClick={() => setCat(c.key)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-card border px-3 py-2 text-left transition-all duration-150 hover:scale-[1.03]",
                    cat === c.key ? "border-accent/60 bg-accent/10" : "border-edge bg-panel hover:border-accent/40",
                  )}
                >
                  <FileTypeTile kind={c.kind} size={26} iconSize={13} />
                  <span>
                    <span className={cn("block text-12 font-semibold", cat === c.key ? "text-accent" : "text-ink")}>{c.label}</span>
                    <span className="block text-11 text-muted">{catCount(c.key, c.count)}</span>
                  </span>
                </motion.button>
              ))}
            </div>

            {/* toolbar */}
            <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-edge/70 px-3 py-2">
              <Button variant="primary" size="sm" onClick={a.addUrl}>
                <Plus className="h-3.5 w-3.5" /> Add URL
              </Button>
              <Button variant="secondary" size="sm" onClick={() => a.addBatch()}>
                <ListPlus className="h-3.5 w-3.5" /> Add Batch
              </Button>
              <span className="mx-1 h-5 w-px bg-edge" />
              <Tip label="Resume"><Button variant="ghost" size="sm" className="px-2" aria-label="Resume" onClick={a.resume}><Play className="h-3.5 w-3.5" /></Button></Tip>
              <Tip label="Stop"><Button variant="ghost" size="sm" className="px-2" aria-label="Stop" onClick={a.stop}><Pause className="h-3.5 w-3.5" /></Button></Tip>
              <Tip label="Stop all"><Button variant="ghost" size="sm" className="px-2" aria-label="Stop all" onClick={a.stopAll}><Square className="h-3.5 w-3.5" /></Button></Tip>
              <Tip label="Delete"><Button variant="ghost" size="sm" className="px-2" aria-label="Delete" onClick={a.remove}><Trash2 className="h-3.5 w-3.5" /></Button></Tip>
              <Tip label="Delete finished"><Button variant="ghost" size="sm" className="px-2" aria-label="Delete finished" onClick={a.removeFinished}><CheckCheck className="h-3.5 w-3.5" /></Button></Tip>
              <span className="mx-1 h-5 w-px bg-edge" />
              <Chip active={limiter} onClick={a.limiter} onContextMenu={(e) => { e.preventDefault(); setLimiter((l) => !l); }}>
                <Gauge className="h-3 w-3" /> Limiter {limiter ? "on" : "off"}
              </Chip>
              <Switch on={limiter} onToggle={(v) => { setLimiter(v); toast({ title: v ? "Speed limiter on" : "Speed limiter off", message: v ? "4 MB/s" : "Full speed", tone: "accent", icon: <Gauge className="h-4 w-4" /> }); }} label="Limiter" />
              <span className="mx-1 h-5 w-px bg-edge" />
              <Button variant="secondary" size="sm" onClick={a.startQueue}><Play className="h-3.5 w-3.5" /> Start Queue</Button>
              <Button variant="secondary" size="sm" onClick={a.stopQueue}><Square className="h-3.5 w-3.5" /> Stop Queue</Button>
            </div>

            {/* table / empty state */}
            {empty ? (
              <div className="flex min-h-0 flex-1 items-center justify-center p-6">
                <div className="relative flex h-full w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-card">
                  <MarbleArt className="absolute inset-0" veil={0.72} />
                  <div className="relative flex flex-col items-center text-center">
                    <img src="/favicon.png" alt="" className="h-16 w-16 animate-pulse-glow" />
                    <div className="mt-3 text-18 font-bold text-ink">Nothing downloading yet</div>
                    <div className="mt-1 text-13 text-muted">Better. Faster. Yours.</div>
                    <Button variant="primary" className="mt-5" onClick={a.addUrl}>
                      <Plus className="h-4 w-4" /> Add your first download
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                {/* header */}
                <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-edge/70 bg-panel/80 px-3 py-1.5 backdrop-blur-sm">
                  <span className="label-caps flex-1">Name</span>
                  {cw >= 700 && <span className="label-caps w-8 text-center">Q</span>}
                  <span className="label-caps w-20 text-right">Size</span>
                  <span className="label-caps w-36">Status</span>
                  {cw >= 790 && <span className="label-caps w-20 text-right">ETA</span>}
                  <span className="label-caps w-24 text-right">Speed</span>
                  {cw >= 900 && <span className="label-caps w-24 text-right">Last try</span>}
                  {cw >= 1010 && <span className="label-caps w-24 text-right">Added</span>}
                  {cw >= 1130 && <span className="label-caps w-32">Save to</span>}
                  <Tip label="Columns" side="bottom">
                    <button onClick={a.columns} className="-my-1 flex h-6 w-6 items-center justify-center rounded-full text-muted transition-colors hover:bg-accent/12 hover:text-ink" aria-label="Columns">
                      <Columns3 className="h-3.5 w-3.5" />
                    </button>
                  </Tip>
                </div>
                {/* rows */}
                {visible.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-16 text-center">
                    <Search className="h-6 w-6 text-muted" />
                    <div className="text-13 font-semibold text-ink">No downloads here</div>
                    <div className="text-12 text-muted">Try another category or clear the search.</div>
                    <Button size="sm" variant="secondary" className="mt-1" onClick={() => { setCat("all"); setNavIdx(0); setSearch(""); }}>Show all downloads</Button>
                  </div>
                )}
                {visible.map((r, i) => (
                  <motion.button
                    key={r.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.3), duration: 0.25, ease: "easeOut" }}
                    onClick={() => setSelected(r.id)}
                    onDoubleClick={() => a.details(r)}
                    onContextMenu={(e) => {
                      setSelected(r.id);
                      menu.onContextMenu(e);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 border-b border-edge/40 px-3 py-2 text-left transition-colors",
                      selected === r.id ? "bg-accent/10" : "hover:bg-raised/70",
                    )}
                  >
                    <FileTypeTile kind={r.kind} size={34} iconSize={16} />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-13 font-medium", r.status === "finished" ? "text-muted" : "text-ink")}>
                        {r.name}
                      </span>
                      <span className="block text-11 text-muted">{r.queue} queue</span>
                    </span>
                    {cw >= 700 && <span className="w-8 text-center text-11 text-muted">{r.id}</span>}
                    <span className="w-20 text-right text-12 text-muted">{r.size}</span>
                    <span className="w-36">{statusCell(r)}</span>
                    {cw >= 790 && <span className="w-20 text-right text-12 text-muted">{r.eta}</span>}
                    <span className={cn("w-24 text-right text-12", r.status === "running" ? "font-semibold text-accent" : "text-muted")}>
                      {r.speed}
                    </span>
                    {cw >= 900 && <span className="w-24 text-right text-12 text-muted">{r.lastTry}</span>}
                    {cw >= 1010 && <span className="w-24 text-right text-12 text-muted">{r.added}</span>}
                    {cw >= 1130 && <span className="w-32 truncate text-12 text-muted">{r.saveTo}</span>}
                    <span className="w-6" />
                  </motion.button>
                ))}
              </div>
            )}

            {/* status bar */}
            <div className="flex h-8 shrink-0 items-center gap-4 border-t border-edge/70 bg-panel/60 px-3 text-11 text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <CountUp to={running.length} className="font-semibold text-ink" /> running
              </span>
              <span>{rows.filter((r) => r.status === "paused").length} paused</span>
              <span>{rows.filter((r) => r.status === "failed").length} failed</span>
              <span>{rows.length} items</span>
              <span className="ml-auto" />
              <button onClick={a.disk} className="flex items-center gap-1.5 transition-colors hover:text-ink">
                <HardDrive className="h-3 w-3" /> D:\\ 412 GB free
              </button>
              <button onClick={a.limiter} className="flex items-center gap-1.5 transition-colors hover:text-accent">
                <Gauge className="h-3 w-3" /> {limiter ? "Limiter 4 MB/s" : "Unlimited"}
              </button>
            </div>
          </div>

          {/* right panel */}
          {showPanel && (
            <aside className="flex w-64 shrink-0 flex-col gap-2.5 overflow-y-auto border-l border-edge/70 bg-panel/40 p-2.5">
              {/* tree */}
              <div className="rounded-card border border-edge bg-panel p-2">
                <div className="label-caps px-1 pb-1.5">Categories</div>
                {categories.slice(1).map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCat(cat === c.key ? "all" : c.key)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-ctl px-1.5 py-1 text-left text-12 transition-colors hover:bg-raised hover:text-ink",
                      cat === c.key ? "bg-accent/10 text-ink" : "text-muted",
                    )}
                  >
                    <FileTypeTile kind={c.kind} size={20} iconSize={11} />
                    <span className="flex-1">{c.label}</span>
                    <span className="text-11">{catCount(c.key, c.count)}</span>
                  </button>
                ))}
                <div className="flex items-center px-1 pb-1.5 pt-2.5">
                  <span className="label-caps flex-1">Queues</span>
                  <button onClick={a.queues} className="text-11 text-muted transition-colors hover:text-accent">Edit</button>
                </div>
                {queueState.map((q) => (
                  <button key={q.name} onClick={a.queues} className="flex w-full items-center gap-2 rounded-ctl px-1.5 py-1 text-left text-12 text-muted transition-colors hover:bg-raised hover:text-ink">
                    <span className={cn("h-1.5 w-1.5 rounded-full", q.active ? "bg-success" : "bg-muted/40")} />
                    <span className="flex-1">{q.name}</span>
                    <span className="text-11">{nat.native ? "" : q.count}</span>
                  </button>
                ))}
              </div>
              {/* active downloads */}
              <div className="rounded-card border border-edge bg-panel p-2.5">
                <div className="label-caps pb-2">Active downloads</div>
                <div className="flex flex-col gap-2.5">
                  {running.length === 0 && <div className="py-2 text-12 text-muted">Nothing downloading right now.</div>}
                {running.slice(0, 3).map((r) => (
                    <div key={r.id}>
                      <div className="flex items-center gap-2">
                        <button onClick={() => a.details(r)} className="min-w-0 flex-1 truncate text-left text-12 text-ink transition-colors hover:text-accent">{r.name}</button>
                        <IconButton
                          className="h-6 w-6"
                          aria-label="Pause"
                          onClick={() => {
                            if (nat.native) nat.send("pause", { ids: [r.id] });
                            else setStatus([r.id], "paused");
                            toast({ title: "Download paused", message: r.name, tone: "muted", icon: <Pause className="h-4 w-4" /> });
                          }}
                        >
                          <Pause className="h-3 w-3" />
                        </IconButton>
                      </div>
                      <ProgressBar value={r.progress} running height="h-[3px]" className="mt-1" />
                      <div className="mt-1 flex justify-between text-11 text-muted">
                        <span>{r.progress.toFixed(0)}% · {r.size}</span>
                        <span className="text-accent">{r.speed}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* disk usage */}
              <button onClick={a.disk} className="rounded-card border border-edge bg-panel p-2.5 text-left transition-colors hover:border-accent/40">
                <div className="label-caps pb-2">Disk usage — D:\</div>
                <ProgressBar value={58} height="h-2" />
                <div className="mt-1.5 text-11 text-muted">
                  <CountUp to={58} suffix="%" className="font-semibold text-ink" /> used · 588 GB of 1 TB
                </div>
              </button>
            </aside>
          )}
        </div>

        {/* drawer */}
        <AnimatePresence>
          {drawer && (
            <>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawer(false)}
                className="absolute inset-0 z-30 bg-scrim"
                aria-label="Close menu"
              />
              <motion.div
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ duration: 0.26, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 z-40 flex w-60 flex-col overflow-y-auto border-r border-edge bg-panel shadow-pop"
              >
                <div className="flex items-center gap-2 border-b border-edge px-3 py-3">
                  <Wordmark className="text-16" />
                  <span className="text-11 text-muted">menu</span>
                </div>
                {drawerGroups.map((g) => (
                  <div key={g.title} className="border-b border-edge/60 px-2 py-2 last:border-0">
                    <div className="label-caps px-1.5 pb-1.5">{g.title}</div>
                    {g.items.map((it) => (
                      <button
                        key={it.label}
                        onClick={() => {
                          setDrawer(false);
                          drawerActions[it.label]?.();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-ctl px-2 py-1.5 text-left text-13 text-ink transition-colors hover:bg-accent/12"
                      >
                        <it.icon className="h-4 w-4 text-muted" strokeWidth={1.75} />
                        <span className="flex-1">{it.label}</span>
                        {it.shortcut && <span className="text-11 text-muted">{it.shortcut}</span>}
                      </button>
                    ))}
                  </div>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </WindowFrame>
      {menu.element}
    </div>
  );
}
