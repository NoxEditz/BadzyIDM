import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Copy,
  FileCheck2,
  FileDown,
  FileUp,
  Folder,
  FolderOpen,
  FolderPlus,
  HardDrive,
  Hash,
  MonitorPlay,
  Music2,
  Image as ImageIcon,
  Clapperboard,
  Upload,
  Usb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WindowFrame } from "../WindowFrame";
import { FileTypeTile, type FileKind } from "../icons";
import { Badge, Button, Checkbox, Dropdown, ProgressBar, Radio, Segmented, Switch, TextField } from "../ui";
import { useApp, useWindowClose } from "../context";
import { Footer } from "./common";

/* ------------------------------- folder picker ------------------------------- */

const tree: { name: string; icon: typeof HardDrive; sub: string; children: string[] }[] = [
  { name: "C:\\", icon: HardDrive, sub: "Windows · 1.2 TB free", children: ["Program Files", "Programs", "Users"] },
  { name: "D:\\", icon: HardDrive, sub: "Data · 412 GB free", children: ["Badzy Downloads", "Movies", "Music", "ISO", "Torrents", "Docs", "Images", "Work"] },
  { name: "E:\\", icon: HardDrive, sub: "Games · 96 GB free", children: ["Games", "Backups"] },
  { name: "F:\\", icon: Usb, sub: "USB drive · 28 GB free", children: ["Transfer"] },
];

export function FolderPicker({
  initial = "D:\\Movies",
  mode = "folder",
  onPick,
}: {
  initial?: string;
  mode?: "folder" | "file";
  onPick?: (path: string) => void;
}) {
  const close = useWindowClose();
  const [drive, setDrive] = useState(initial.slice(0, 3));
  const [folder, setFolder] = useState(initial.slice(3) || "");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("New folder");
  const [extra, setExtra] = useState<string[]>([]);
  const current = tree.find((t) => t.name === drive) ?? tree[1]!;
  const path = `${drive}${folder}`;
  const files = mode === "file" ? ["big-buck-bunny.torrent", "ubuntu-24.04.torrent", "aurora-s1.torrent"] : [];

  return (
    <WindowFrame width={640} height={460} title={mode === "file" ? "Open .torrent file" : "Choose folder"}>
      <div className="flex items-center gap-1.5 border-b border-edge/70 px-4 py-2 text-12">
        <HardDrive className="h-3.5 w-3.5 text-muted" />
        <button className="text-muted hover:text-ink" onClick={() => setFolder("")}>{drive}</button>
        {folder && (
          <>
            <ChevronRight className="h-3 w-3 text-muted" />
            <span className="font-semibold text-ink">{folder}</span>
          </>
        )}
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setCreating(true)}>
          <FolderPlus className="h-3.5 w-3.5" /> New folder
        </Button>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-48 shrink-0 overflow-y-auto border-r border-edge/70 bg-panel/50 p-2">
          <div className="label-caps px-1.5 pb-1.5">This PC</div>
          {tree.map((t) => (
            <button
              key={t.name}
              onClick={() => {
                setDrive(t.name);
                setFolder("");
              }}
              className={cn(
                "mb-0.5 flex w-full items-center gap-2 rounded-ctl px-2 py-1.5 text-left transition-colors",
                drive === t.name ? "bg-accent/12 text-accent" : "text-muted hover:bg-raised hover:text-ink",
              )}
            >
              <t.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span className="min-w-0">
                <span className="block text-12 font-semibold">{t.name}</span>
                <span className="block truncate text-11 text-muted">{t.sub}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {creating && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-1 flex items-center gap-2 rounded-ctl border border-accent/50 bg-accent/8 px-2 py-1.5">
              <Folder className="h-4 w-4 text-accent" />
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setExtra((x) => [...x, newName]);
                    setFolder(newName);
                    setCreating(false);
                  }
                }}
                className="flex-1 bg-transparent text-13 text-ink focus:outline-none"
              />
              <Button size="sm" variant="primary" onClick={() => { setExtra((x) => [...x, newName]); setFolder(newName); setCreating(false); }}>Create</Button>
            </motion.div>
          )}
          {[...current.children, ...extra].map((c, i) => (
            <motion.button
              key={c}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => setFolder(c)}
              onDoubleClick={() => { onPick?.(`${drive}${c}`); close(); }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-ctl px-2 py-1.5 text-left text-13 transition-colors",
                folder === c ? "bg-accent/12 text-ink" : "text-ink hover:bg-raised",
              )}
            >
              {folder === c ? <FolderOpen className="h-4 w-4 text-accent" /> : <Folder className="h-4 w-4 text-muted" />}
              <span className="flex-1">{c}</span>
              <span className="text-11 text-muted">{(i * 7 + 3) % 40} items</span>
            </motion.button>
          ))}
          {files.map((f) => (
            <button key={f} onClick={() => setFolder(f)} className={cn("flex w-full items-center gap-2.5 rounded-ctl px-2 py-1.5 text-left text-13", folder === f ? "bg-accent/12" : "hover:bg-raised")}>
              <FileTypeTile kind="torrent" size={20} iconSize={11} />
              <span className="flex-1 text-ink">{f}</span>
              <span className="text-11 text-muted">42 KB</span>
            </button>
          ))}
        </div>
      </div>
      <Footer>
        <TextField className="flex-1" value={path} readOnly />
        <Button variant="ghost" onClick={() => close()}>Cancel</Button>
        <Button
          variant="primary"
          onClick={() => {
            onPick?.(path);
            close({ title: mode === "file" ? "File selected" : "Folder selected", message: path, tone: "success" });
          }}
        >
          {mode === "file" ? "Open" : "Select folder"}
        </Button>
      </Footer>
    </WindowFrame>
  );
}

/* --------------------------------- open with --------------------------------- */

const apps = [
  { name: "VLC media player", sub: "Recommended for MKV", icon: Clapperboard },
  { name: "Media Player", sub: "Windows", icon: MonitorPlay },
  { name: "MPC-HC", sub: "Lightweight player", icon: Clapperboard },
  { name: "Photos", sub: "Windows", icon: ImageIcon },
  { name: "Groove Music", sub: "Windows", icon: Music2 },
];

export function OpenWithDialog({ file = "Interstellar.2014.1080p.BluRay.x264.mkv", kind = "video" as FileKind }) {
  const close = useWindowClose();
  const [pick, setPick] = useState(0);
  const [always, setAlways] = useState(false);
  return (
    <WindowFrame width={460} height={470} title="Open with">
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-3 rounded-card border border-edge bg-raised p-2.5">
          <FileTypeTile kind={kind} size={36} iconSize={17} />
          <div className="min-w-0">
            <div className="truncate text-13 font-semibold text-ink">{file}</div>
            <div className="text-11 text-muted">How do you want to open this file?</div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-card border border-edge p-1">
          {apps.map((a, i) => (
            <button
              key={a.name}
              onClick={() => setPick(i)}
              onDoubleClick={() => close({ title: `Opening in ${a.name}`, message: file, tone: "accent" })}
              className={cn(
                "flex w-full items-center gap-3 rounded-ctl px-2.5 py-2 text-left transition-colors",
                pick === i ? "bg-accent/12" : "hover:bg-raised",
              )}
            >
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-ctl border", pick === i ? "border-accent/50 bg-accent/15 text-accent" : "border-edge bg-panel text-muted")}>
                <a.icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-13 font-medium text-ink">{a.name}</span>
                <span className="block text-11 text-muted">{a.sub}</span>
              </span>
              {i === 0 && <Badge tone="accent">Best match</Badge>}
            </button>
          ))}
          <button className="flex w-full items-center gap-3 rounded-ctl px-2.5 py-2 text-left text-13 text-muted transition-colors hover:bg-raised hover:text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-ctl border border-dashed border-edge"><FolderOpen className="h-4 w-4" /></span>
            Choose another app on this PC…
          </button>
        </div>
        <Checkbox checked={always} onChange={setAlways} label="Always use this app for .mkv files" />
      </div>
      <Footer>
        <Button variant="ghost" className="ml-auto" onClick={() => close()}>Cancel</Button>
        <Button variant="primary" onClick={() => close({ title: `Opening in ${apps[pick]!.name}`, message: file, tone: "accent" })}>Open</Button>
      </Footer>
    </WindowFrame>
  );
}

/* -------------------------------- move / rename ------------------------------- */

export function MoveRenameDialog({
  name = "Interstellar.2014.1080p.BluRay.x264.mkv",
  folder = "D:\\Movies",
  kind = "video" as FileKind,
}) {
  const close = useWindowClose();
  const { open } = useApp();
  const [n, setN] = useState(name);
  const [f, setF] = useState(folder);
  const [moveNow, setMoveNow] = useState(true);
  return (
    <WindowFrame width={540} height={400} title="Move / Rename">
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <FileTypeTile kind={kind} size={40} iconSize={18} />
          <div className="min-w-0 text-12 text-muted">
            Current location
            <div className="truncate text-13 text-ink">{folder}\{name}</div>
          </div>
        </div>
        <TextField label="File name" value={n} onChange={(e) => setN(e.target.value)} />
        <div className="flex items-end gap-2">
          <TextField className="flex-1" label="Folder" value={f} onChange={(e) => setF(e.target.value)} />
          <Button variant="secondary" onClick={() => open(<FolderPicker initial={f} onPick={setF} />)}>
            <FolderOpen className="h-3.5 w-3.5" /> Browse
          </Button>
        </div>
        <div className="flex items-center justify-between rounded-ctl border border-edge bg-raised/60 px-3 py-2">
          <span className="text-13 text-ink">Move the file on disk now</span>
          <Switch on={moveNow} onToggle={setMoveNow} />
        </div>
        <div className="truncate text-11 text-muted">New path: <span className="text-ink">{f}\{n}</span></div>
      </div>
      <Footer>
        <Button variant="ghost" className="ml-auto" onClick={() => close()}>Cancel</Button>
        <Button variant="primary" onClick={() => close({ title: moveNow ? "File moved" : "Download renamed", message: `${f}\\${n}`, tone: "success" })}>
          Apply
        </Button>
      </Footer>
    </WindowFrame>
  );
}

/* --------------------------------- export list -------------------------------- */

export function ExportListDialog() {
  const close = useWindowClose();
  const { open } = useApp();
  const [fmt, setFmt] = useState<"txt" | "csv" | "json" | "badzy">("badzy");
  const [scope, setScope] = useState<"all" | "selected" | "unfinished">("all");
  const [path, setPath] = useState("D:\\Badzy Downloads");
  return (
    <WindowFrame width={540} height={450} title="Export download list">
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div>
          <div className="label-caps mb-1.5">Format</div>
          <Segmented
            value={fmt}
            onChange={setFmt}
            options={[
              { value: "badzy", label: "Badzy (.bdz)" },
              { value: "txt", label: "Links (.txt)" },
              { value: "csv", label: "Table (.csv)" },
              { value: "json", label: "JSON" },
            ]}
          />
        </div>
        <div>
          <div className="label-caps mb-1.5">Which downloads</div>
          <div className="flex flex-col gap-2">
            <Radio checked={scope === "all"} onChange={() => setScope("all")} label="All downloads (14)" />
            <Radio checked={scope === "selected"} onChange={() => setScope("selected")} label="Selected only (1)" />
            <Radio checked={scope === "unfinished"} onChange={() => setScope("unfinished")} label="Unfinished only (9)" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Checkbox checked onChange={() => {}} label="Include folders and categories" />
          <Checkbox checked={fmt === "badzy"} onChange={() => {}} label="Include login details (encrypted)" />
        </div>
        <div className="flex items-end gap-2">
          <TextField className="flex-1" label="Save to" value={`${path}\\badzy-list.${fmt === "badzy" ? "bdz" : fmt}`} readOnly />
          <Button variant="secondary" onClick={() => open(<FolderPicker initial={path} onPick={setPath} />)}>Browse</Button>
        </div>
      </div>
      <Footer>
        <Button variant="ghost" className="ml-auto" onClick={() => close()}>Cancel</Button>
        <Button variant="primary" onClick={() => close({ title: "List exported", message: `${scope === "all" ? 14 : scope === "selected" ? 1 : 9} downloads saved as .${fmt === "badzy" ? "bdz" : fmt}`, tone: "success" })}>
          <FileDown className="h-4 w-4" /> Export
        </Button>
      </Footer>
    </WindowFrame>
  );
}

/* --------------------------------- import list -------------------------------- */

const importRows = [
  { name: "lecture-01.mp4", kind: "video" as FileKind, size: "640 MB" },
  { name: "lecture-02.mp4", kind: "video" as FileKind, size: "612 MB" },
  { name: "slides-week1.pdf", kind: "pdf" as FileKind, size: "8 MB" },
  { name: "dataset-sample.zip", kind: "archive" as FileKind, size: "92 MB" },
];

export function ImportListDialog() {
  const close = useWindowClose();
  const [loaded, setLoaded] = useState(false);
  const [queue, setQueue] = useState("Main queue");
  return (
    <WindowFrame width={600} height={480} title="Import download list">
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        {!loaded ? (
          <button
            onClick={() => setLoaded(true)}
            className="group flex flex-1 flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-edge bg-panel/50 transition-colors hover:border-accent/60 hover:bg-accent/5"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/12 text-accent transition-transform group-hover:scale-105">
              <Upload className="h-6 w-6" />
            </span>
            <span className="text-14 font-semibold text-ink">Drop a list here or click to browse</span>
            <span className="text-12 text-muted">.bdz, .txt, .csv, .json or IDM export (.ef2)</span>
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-ctl border border-success/30 bg-success/10 px-3 py-2 text-12 text-success">
              <FileCheck2 className="h-4 w-4" /> course-week1.bdz · 4 downloads found
              <button className="ml-auto text-muted hover:text-ink" onClick={() => setLoaded(false)}>Change</button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-card border border-edge">
              {importRows.map((r, i) => (
                <motion.div key={r.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 border-b border-edge/40 px-3 py-2 last:border-0">
                  <Checkbox checked onChange={() => {}} />
                  <FileTypeTile kind={r.kind} size={26} iconSize={13} />
                  <span className="flex-1 truncate text-13 text-ink">{r.name}</span>
                  <span className="text-12 text-muted">{r.size}</span>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Dropdown label="Add to queue" value={queue} onChange={setQueue} options={["Main queue", "Night queue", "Work queue", "No queue"]} />
              <Dropdown label="When imported" value="Add paused" onChange={() => {}} options={["Add paused", "Start immediately"]} />
            </div>
          </>
        )}
      </div>
      <Footer>
        <Button variant="ghost" className="ml-auto" onClick={() => close()}>Cancel</Button>
        <Button variant="primary" disabled={!loaded} onClick={() => close({ title: "4 downloads imported", message: `Added to ${queue}`, tone: "success" })}>
          <FileUp className="h-4 w-4" /> Import
        </Button>
      </Footer>
    </WindowFrame>
  );
}

/* ---------------------------------- hashes ----------------------------------- */

const hashes = [
  ["MD5", "9f86d081884c7d659a2feaa0c55ad015"],
  ["SHA-1", "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3"],
  ["SHA-256", "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae"],
] as const;

export function HashesDialog() {
  const close = useWindowClose();
  const { toast } = useApp();
  const [p, setP] = useState(0);
  const [compare, setCompare] = useState("");
  useEffect(() => {
    const t = setInterval(() => setP((x) => (x >= 100 ? 100 : x + 7)), 90);
    return () => clearInterval(t);
  }, []);
  const done = p >= 100;
  const match = compare.trim().length > 0 && hashes.some(([, h]) => h.startsWith(compare.trim().toLowerCase()));
  return (
    <WindowFrame width={560} height={420} title="File hashes">
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-12 text-muted">
          <Hash className="h-4 w-4 text-accent" /> Interstellar.2014.1080p.mkv · 2.18 GB
          <span className="ml-auto font-semibold text-ink">{done ? "Done" : `${Math.min(p, 100)}%`}</span>
        </div>
        <ProgressBar value={p} running={!done} height="h-1.5" />
        <div className="rounded-card border border-edge bg-panel p-2">
          {hashes.map(([k, h]) => (
            <div key={k} className="flex items-center gap-2 border-b border-edge/40 py-1.5 last:border-0">
              <span className="w-16 shrink-0 text-12 font-semibold text-ink">{k}</span>
              <span className={cn("min-w-0 flex-1 truncate font-mono text-11", done ? "text-muted" : "text-muted/40")}>{done ? h : "calculating…"}</span>
              <Button variant="ghost" size="sm" className="px-2" disabled={!done} onClick={() => toast({ title: `${k} copied`, tone: "success" })}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <TextField label="Compare with a hash from the website" placeholder="Paste a hash…" value={compare} onChange={(e) => setCompare(e.target.value)} />
        {compare && (
          <Badge tone={match ? "success" : "error"} className="self-start">
            {match ? "Match — the file is intact" : "No match — the file may be damaged"}
          </Badge>
        )}
      </div>
      <Footer>
        <Button variant="primary" className="ml-auto" onClick={() => close()}>Close</Button>
      </Footer>
    </WindowFrame>
  );
}
