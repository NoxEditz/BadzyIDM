import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clipboard,
  Link2,
  ListPlus,
  Pause,
  Play,
  Plus,
  Settings2,
  X,
} from "lucide-react";
import { WindowFrame } from "../WindowFrame";
import { useApp, useWindowClose } from "../context";
import { HashesDialog, OpenWithDialog } from "../dialogs/files";
import { FileTypeTile } from "../icons";
import { torrentFiles } from "../data";
import {
  Badge,
  Button,
  Checkbox,
  Dropdown,
  Field,
  NumberStepper,
  ProgressBar,
  RingProgress,
  Switch,
  Tabs,
  TextField,
  Tip,
} from "../ui";
import { cn } from "@/lib/utils";

/* ------------------------------- add batch ---------------------------------- */

export function AddBatchWindow({ fromClipboard = false }: { fromClipboard?: boolean }) {
  const close = useWindowClose();
  const [mode, setMode] = useState<"list" | "pattern">("list");
  const [text, setText] = useState(
    fromClipboard
      ? "https://files.example.com/course/lecture-01.mp4\nhttps://files.example.com/course/lecture-02.mp4\nhttps://files.example.com/course/lecture-03.mp4\nhttps://files.example.com/course/slides.pdf\nhttps://files.example.com/course/dataset.zip"
      : "https://site.com/ep/01.mp4\nhttps://site.com/ep/02.mp4\nhttps://site.com/ep/03.mp4",
  );
  const [preview, setPreview] = useState(false);
  const links = text.split("\n").filter((l) => l.trim().startsWith("http")).length;
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(24);
  return (
    <WindowFrame width={700} height={520} title="Add batch download">
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <Tabs tabs={["List of links", "Numbered pattern"]} value={mode === "list" ? "List of links" : "Numbered pattern"} onChange={(v) => setMode(v === "List of links" ? "list" : "pattern")} />
        {mode === "list" ? (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={9}
              className="min-h-0 flex-1 resize-none rounded-ctl border border-edge bg-panel p-3 font-mono text-12 text-ink focus:border-accent/70 focus-ring"
            />
            <div className="flex items-center gap-2 text-12 text-muted">
              <Clipboard className="h-3.5 w-3.5" /> {links} links detected · paste any list, one URL per line
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setText((t) => `${t}\nhttps://site.com/ep/04.mp4\nhttps://site.com/ep/05.mp4`)}
              >
                Paste from clipboard
              </Button>
            </div>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <TextField label="Pattern URL (use * where the number goes)" value="https://site.com/ep/*.mp4" readOnly />
            <div className="grid grid-cols-3 gap-3">
              <NumberStepper label="From" value={from} onChange={setFrom} min={0} max={9999} />
              <NumberStepper label="To" value={to} onChange={setTo} min={0} max={9999} />
              <Dropdown label="Padding" value="2 digits (01…)" onChange={() => {}} options={["No padding", "2 digits (01…)", "3 digits (001…)"]} />
            </div>
            <div className="flex-1 overflow-y-auto rounded-ctl border border-edge bg-panel p-2 font-mono text-12 text-muted">
              {(preview ? Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i) : [1, 2, 3, 4, 5]).map((n) => (
                <div key={n} className="truncate py-0.5">https://site.com/ep/{String(n).padStart(2, "0")}.mp4</div>
              ))}
              {!preview && <div className="py-0.5 text-accent">… {Math.max(0, to - from - 4)} more up to {String(to).padStart(2, "0")}</div>}
            </div>
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-edge bg-panel/60 px-4 py-3">
        <Button variant="ghost" onClick={() => close()}>Cancel</Button>
        <Button variant="ghost" className="ml-auto" onClick={() => { setMode("pattern"); setPreview((p) => !p); }}>
          {preview ? "Hide preview" : "Preview all"}
        </Button>
        <Button
          variant="primary"
          onClick={() => close({ title: `${mode === "list" ? links : to - from + 1} downloads added`, message: "Added to Main queue · starting now", tone: "success" })}
        >
          <ListPlus className="h-4 w-4" /> Add {mode === "list" ? links : to - from + 1} downloads
        </Button>
      </div>
    </WindowFrame>
  );
}

/* --------------------------- per-download progress -------------------------- */

export function ProgressWindow({ name = "Interstellar.2014.1080p.mkv" }: { name?: string }) {
  const close = useWindowClose();
  const [paused, setPaused] = useState(false);
  const [tab, setTab] = useState("Status");
  const [limit, setLimit] = useState(60);
  const segments = Array.from({ length: 16 }, (_, i) => (i < 9 ? "on" : i === 9 ? "half" : "off"));
  return (
    <WindowFrame width={460} height={520} title={`${paused ? "Paused" : "Downloading"} — ${name}`}>
      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto p-4">
        <RingProgress value={62} size={104} stroke={8} {...(paused ? { className: "opacity-50" } : {})} />
        <div className="grid w-full grid-cols-2 gap-2">
          <div className="rounded-ctl border border-edge bg-raised p-2 text-center">
            <div className="label-caps">Speed</div>
            <div className="text-14 font-bold text-accent">{paused ? "—" : "8.4 MB/s"}</div>
          </div>
          <div className="rounded-ctl border border-edge bg-raised p-2 text-center">
            <div className="label-caps">ETA</div>
            <div className="text-14 font-bold text-ink">{paused ? "Paused" : "3 min 12 s"}</div>
          </div>
        </div>
        <div className="w-full">
          <div className="label-caps mb-1.5">Segments · 9 of 16 active</div>
          <div className="flex h-3 gap-[3px]">
            {segments.map((s, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0.6 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "flex-1 rounded-[3px]",
                  s === "on" ? "bg-linear-180 from-accent to-accent-2" : s === "half" ? "bg-accent/40" : "bg-raised",
                )}
              />
            ))}
          </div>
        </div>
        <Tabs className="w-full" tabs={["Status", "Speed limit", "Options"]} value={tab} onChange={setTab} />
        {tab === "Status" && (
          <div className="w-full text-12 text-muted">
            <div className="flex justify-between py-1"><span>Saved to</span><span className="text-ink">D:\Movies</span></div>
            <div className="flex justify-between py-1"><span>Downloaded</span><span className="text-ink">1.35 GB of 2.18 GB</span></div>
            <div className="flex justify-between py-1"><span>Connections</span><span className="text-ink">9 / 16</span></div>
            <div className="flex justify-between py-1"><span>Queue</span><span className="text-ink">Main</span></div>
          </div>
        )}
        {tab === "Speed limit" && (
          <div className="w-full">
            <div className="mb-1 flex justify-between text-12"><span className="text-muted">Limit</span><span className="font-semibold text-ink">{limit === 100 ? "Unlimited" : `${limit * 128} KB/s`}</span></div>
            <ProgressBar value={limit} height="h-2" />
            <input type="range" min={5} max={100} value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="mt-3 w-full accent-accent" />
          </div>
        )}
        {tab === "Options" && (
          <div className="w-full">
            <Field label="Play while downloading"><Switch on={false} onToggle={() => {}} /></Field>
            <Field label="Open folder when done"><Switch on onToggle={() => {}} /></Field>
            <Field label="Shutdown PC when done"><Switch on={false} onToggle={() => {}} /></Field>
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-edge bg-panel/60 px-4 py-3">
        <Tip label="Keeps downloading in the background">
          <Button variant="ghost" size="sm" onClick={() => close({ title: "Hidden to tray", message: `${name} keeps downloading.`, tone: "muted" })}>Hide to tray</Button>
        </Tip>
        <div className="ml-auto flex gap-2">
          <Button variant="danger" size="sm" onClick={() => close({ title: "Download cancelled", message: name, tone: "warning" })}>
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setPaused((p) => !p)}>
            {paused ? <><Play className="h-3.5 w-3.5" /> Resume</> : <><Pause className="h-3.5 w-3.5" /> Pause</>}
          </Button>
        </div>
      </div>
    </WindowFrame>
  );
}

/* ---------------------------- complete + properties -------------------------- */

export function CompleteDialog({ name = "Interstellar.2014.1080p.BluRay.x264.mkv" }: { name?: string }) {
  const close = useWindowClose();
  const { open } = useApp();
  return (
    <WindowFrame width={420} height={280} title="Download complete">
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 20 }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success"
        >
          <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
        </motion.div>
        <div className="text-18 font-bold text-ink">Download complete</div>
        <div className="max-w-72 truncate text-13 text-muted">{name}</div>
        <Badge tone="success">Saved to D:\Movies · 2.18 GB · 4 min 26 s</Badge>
        <div className="mt-4 flex gap-2">
          <Button variant="primary" onClick={() => close({ title: "Opening folder", message: "D:\\Movies", tone: "accent" })}>Open folder</Button>
          <Button variant="secondary" onClick={() => open(<OpenWithDialog file={name} />)}>Open with…</Button>
          <Button variant="ghost" onClick={() => close()}>Close</Button>
        </div>
      </div>
    </WindowFrame>
  );
}

export function PropertiesDialog({ name = "Interstellar.2014.1080p.mkv" }: { name?: string }) {
  const close = useWindowClose();
  const { open } = useApp();
  const [tab, setTab] = useState("General");
  return (
    <WindowFrame width={560} height={520} title={`Properties — ${name}`}>
      <div className="flex min-h-0 flex-1 gap-3 overflow-y-auto p-4">
        <div className="flex w-40 shrink-0 flex-col items-center gap-2 rounded-card border border-edge bg-raised p-3">
          <FileTypeTile kind="video" size={64} iconSize={30} />
          <div className="text-center text-11 text-muted">MKV · Matroska video<br />2.18 GB · 1080p</div>
        </div>
        <div className="min-w-0 flex-1">
          <Tabs tabs={["General", "Statistics"]} value={tab} onChange={setTab} />
          {tab === "Statistics" && (
            <div className="pt-3">
              <div className="label-caps mb-1.5">Speed · last 5 minutes</div>
              <div className="flex h-24 items-end gap-[3px] rounded-ctl border border-edge bg-panel p-2">
                {[30, 42, 38, 55, 61, 48, 70, 82, 76, 64, 72, 88, 91, 79, 84, 95, 86, 78, 90, 84].map((h, i) => (
                  <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.02 }} className="flex-1 rounded-t-[3px] bg-linear-180 from-accent to-accent-2" />
                ))}
              </div>
              <div className="pt-2 text-12">
                {[
                  ["Average speed", "7.9 MB/s"],
                  ["Peak speed", "11.2 MB/s"],
                  ["Time active", "2 min 51 s"],
                  ["Reconnects", "1"],
                  ["Segments", "16 · 9 done"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-1">
                    <span className="text-muted">{k}</span>
                    <span className="text-ink">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "General" && <div className="pt-2 text-12">
            {[
              ["Address", "https://cdn.example.com/interstellar-1080p.mkv"],
              ["Saved to", "D:\\Movies\\Interstellar.2014.1080p.mkv"],
              ["Size", "2.18 GB (2,340,881,203 bytes)"],
              ["Category", "Video"],
              ["Queue", "Main"],
              ["Connections", "16 (max 32)"],
              ["Added", "Today at 19:41"],
              ["Started", "Today at 19:42"],
              ["Server", "nginx/1.25 · resumable"],
              ["Authorization", "Anonymous"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-1">
                <span className="shrink-0 text-muted">{k}</span>
                <span className="truncate text-ink">{v}</span>
              </div>
            ))}
          </div>}
        </div>
      </div>
      <div className="flex shrink-0 gap-2 border-t border-edge bg-panel/60 px-4 py-3">
        <Button variant="secondary" onClick={() => open(<HashesDialog />)}><Settings2 className="h-4 w-4" /> Check hashes</Button>
        <Button variant="ghost" className="ml-auto" onClick={() => close()}>Cancel</Button>
        <Button variant="primary" onClick={() => close({ title: "Properties saved", tone: "success" })}>Save</Button>
      </div>
    </WindowFrame>
  );
}

/* ---------------------------------- screen ---------------------------------- */

export default function Dialogs() {
  return (
    <div className="flex flex-col items-center gap-6 pb-8">
      <Section label="Add batch download — two modes" node={<AddBatchWindow />} />
      <Section label="Per-download progress window" node={<ProgressWindow />} />
      <Section label="Download complete" node={<CompleteDialog />} />
      <Section label="Properties" node={<PropertiesDialog />} />
    </div>
  );
}

export function Section({ label, node }: { label: string; node: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="label-caps">{label}</span>
      {node}
    </div>
  );
}
