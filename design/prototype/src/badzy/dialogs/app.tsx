import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  BadgeCheck,
  CalendarClock,
  Chrome,
  CircleAlert,
  Clock,
  Compass,
  Filter,
  Globe,
  HardDrive,
  Link2,
  ListPlus,
  Power,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Usb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WindowFrame, Wordmark } from "../WindowFrame";
import { MarbleArt } from "../MarbleArt";
import { FileTypeTile, type FileKind } from "../icons";
import { Badge, Button, Checkbox, Dropdown, NumberStepper, ProgressBar, Radio, RingProgress, Switch, TextField } from "../ui";
import { useApp, useWindowClose } from "../context";
import { DialogIcon, Footer, KV } from "./common";
import logo from "@/assets/badzy-logo.png.asset.json";

/* --------------------------------- exit / close ------------------------------- */

export function ExitDialog({ running = 5 }: { running?: number }) {
  const close = useWindowClose();
  const [choice, setChoice] = useState<"tray" | "exit">("tray");
  const [remember, setRemember] = useState(false);
  return (
    <WindowFrame width={480} height={340} title="Close Badzy">
      <div className="flex min-h-0 flex-1 gap-4 p-5">
        <img src={logo.url} alt="" className="h-12 w-12 shrink-0 animate-pulse-glow" />
        <div className="min-w-0 flex-1">
          <div className="text-18 font-bold tracking-tight text-ink">Close Badzy?</div>
          <div className="mt-1 text-13 text-muted">
            {running} downloads are still running. Keep Badzy in the tray so they can finish.
          </div>
          <div className="mt-4 flex flex-col gap-2.5">
            <Radio checked={choice === "tray"} onChange={() => setChoice("tray")} label="Minimize to the tray and keep downloading" />
            <Radio checked={choice === "exit"} onChange={() => setChoice("exit")} label="Exit and pause all downloads" />
          </div>
          <Checkbox checked={remember} onChange={setRemember} label="Remember my choice" className="mt-4" />
        </div>
      </div>
      <Footer>
        <Button variant="ghost" className="ml-auto" onClick={() => close()}>Cancel</Button>
        <Button
          variant={choice === "exit" ? "danger" : "primary"}
          onClick={() =>
            close(
              choice === "tray"
                ? { title: "Badzy is in the tray", message: `${running} downloads keep running in the background.`, tone: "accent" }
                : { title: "Badzy would exit now", message: "All downloads paused · preview stays open.", tone: "warning" },
            )
          }
        >
          {choice === "tray" ? "Minimize to tray" : <><Power className="h-4 w-4" /> Exit</>}
        </Button>
      </Footer>
    </WindowFrame>
  );
}

/* ----------------------------- browser extension ----------------------------- */

const browsers = [
  { name: "Google Chrome", icon: Chrome, state: "installed" as const, store: "Chrome Web Store" },
  { name: "Microsoft Edge", icon: Compass, state: "installed" as const, store: "Edge Add-ons" },
  { name: "Firefox", icon: Globe, state: "available" as const, store: "Firefox Add-ons" },
  { name: "Opera", icon: Globe, state: "available" as const, store: "Opera add-ons" },
];

export function ExtensionInstallDialog() {
  const close = useWindowClose();
  const { toast } = useApp();
  const [installing, setInstalling] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  return (
    <WindowFrame width={640} height={460} title="Add Badzy to my browser">
      <div className="flex min-h-0 flex-1">
        <div className="relative w-52 shrink-0 overflow-hidden">
          <MarbleArt className="absolute inset-0" veil={0.6} />
          <div className="absolute inset-0 flex flex-col justify-end p-4">
            <Wordmark className="text-26" />
            <div className="mt-1 text-12 text-muted">Catch every download, video and playlist straight from your browser.</div>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
          <div className="label-caps">Your browsers</div>
          {browsers.map((b) => {
            const installed = b.state === "installed" || done.includes(b.name);
            return (
              <div key={b.name} className="flex items-center gap-3 rounded-card border border-edge bg-panel p-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-ctl bg-raised text-ink">
                  <b.icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-13 font-semibold text-ink">{b.name}</div>
                  <div className="text-11 text-muted">{b.store}</div>
                </div>
                {installed ? (
                  <Badge tone="success"><BadgeCheck className="h-3 w-3" /> Connected</Badge>
                ) : installing === b.name ? (
                  <Badge tone="accent"><RefreshCw className="h-3 w-3 animate-spin" /> Opening store…</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setInstalling(b.name);
                      setTimeout(() => {
                        setInstalling(null);
                        setDone((d) => [...d, b.name]);
                        toast({ title: `Badzy added to ${b.name}`, message: "Downloads will now open in Badzy.", tone: "success" });
                      }, 1400);
                    }}
                  >
                    Add
                  </Button>
                )}
              </div>
            );
          })}
          <div className="mt-1 flex items-start gap-2 rounded-ctl border border-edge bg-raised/60 p-2.5 text-12 text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            The extension only reads links you choose to download. Nothing else leaves your browser.
          </div>
        </div>
      </div>
      <Footer>
        <Button variant="ghost">Copy install link</Button>
        <Button variant="primary" className="ml-auto" onClick={() => close()}>Done</Button>
      </Footer>
    </WindowFrame>
  );
}

/* -------------------------------- error details ------------------------------- */

const log: [string, string][] = [
  ["19:41:02", "Connecting to cdn.example.com (443)…"],
  ["19:41:02", "Server: nginx/1.25 · resumable"],
  ["19:41:03", "Segment 4/8 · 212 MB received"],
  ["19:49:17", "HTTP 403 Forbidden — link expired"],
  ["19:49:17", "Retry 1/3 in 30 s"],
  ["19:49:48", "HTTP 403 Forbidden — giving up"],
];

export function ErrorDetailsDialog({ name = "wallpaper_pack_4k.7z", kind = "archive" as FileKind }) {
  const close = useWindowClose();
  const { open } = useApp();
  return (
    <WindowFrame width={600} height={480} title="Download failed">
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <DialogIcon tone="error"><CircleAlert /></DialogIcon>
          <div className="min-w-0 flex-1">
            <div className="text-18 font-bold tracking-tight text-ink">The link has expired</div>
            <div className="mt-0.5 text-13 text-muted">The server refused the download (HTTP 403). Refresh the address from the page you got it from, then resume.</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-card border border-edge bg-raised p-2.5">
          <FileTypeTile kind={kind} size={34} iconSize={16} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-13 font-semibold text-ink">{name}</div>
            <ProgressBar value={34} height="h-[3px]" className="mt-1" />
          </div>
          <span className="text-12 text-muted">212 of 620 MB</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-card border border-edge bg-panel p-2.5 font-mono text-11">
          {log.map(([t, l], i) => (
            <div key={i} className={cn("flex gap-3 py-0.5", l.includes("403") ? "text-error" : "text-muted")}>
              <span className="text-muted/60">{t}</span>
              {l}
            </div>
          ))}
        </div>
      </div>
      <Footer>
        <Button variant="ghost" onClick={() => close({ title: "Log copied", tone: "success" })}>Copy log</Button>
        <Button variant="secondary" className="ml-auto" onClick={() => open(<RefreshAddressDialog />)}>
          <Link2 className="h-4 w-4" /> Refresh address
        </Button>
        <Button variant="primary" onClick={() => close({ title: "Retrying download", message: name, tone: "accent" })}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </Footer>
    </WindowFrame>
  );
}

/* ------------------------------ refresh address ------------------------------ */

export function RefreshAddressDialog() {
  const close = useWindowClose();
  const [waiting, setWaiting] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setWaiting(false), 2600);
    return () => clearTimeout(t);
  }, []);
  return (
    <WindowFrame width={540} height={380} title="Refresh download address">
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <div className="text-13 text-muted">
          Open the page where you got this file and click the download link again — Badzy will catch the new address automatically. Or paste it below.
        </div>
        <KV k="Old address" v="https://cdn.example.com/dl/wallpaper_pack_4k.7z?token=8f2…" mono />
        <motion.div
          key={String(waiting)}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center gap-2.5 rounded-ctl border p-2.5 text-12",
            waiting ? "border-accent/30 bg-accent/8 text-accent" : "border-success/30 bg-success/10 text-success",
          )}
        >
          {waiting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
          {waiting ? "Waiting for the link from your browser…" : "New address caught from Chrome — same file size, ready to resume."}
        </motion.div>
        <TextField label="New address" icon={<Link2 className="h-3.5 w-3.5" />} value={waiting ? "" : "https://cdn.example.com/dl/wallpaper_pack_4k.7z?token=c41…"} placeholder="https://…" readOnly />
      </div>
      <Footer>
        <Button variant="ghost" className="ml-auto" onClick={() => close()}>Cancel</Button>
        <Button variant="primary" disabled={waiting} onClick={() => close({ title: "Address refreshed", message: "Download resumed from 34%.", tone: "success" })}>
          Use new address
        </Button>
      </Footer>
    </WindowFrame>
  );
}

/* ----------------------------------- update ----------------------------------- */

export function UpdateDialog() {
  const close = useWindowClose();
  const [p, setP] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setP((x) => Math.min(100, x + 3 + Math.random() * 6)), 160);
    return () => clearInterval(t);
  }, []);
  const done = p >= 100;
  return (
    <WindowFrame width={480} height={400} title="Updating Badzy">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        {done ? (
          <DialogIcon tone="success" className="h-16 w-16 [&_svg]:h-8 [&_svg]:w-8"><Rocket /></DialogIcon>
        ) : (
          <RingProgress value={p} size={96} stroke={8} />
        )}
        <div className="text-18 font-bold text-ink">{done ? "Update ready" : "Downloading Badzy 3.2.0"}</div>
        <div className="max-w-xs text-13 text-muted">
          {done ? "Restart Badzy to finish. Running downloads resume automatically." : `${((p / 100) * 24).toFixed(1)} of 24 MB · using Badzy's own engine`}
        </div>
        <div className="mt-1 flex flex-wrap justify-center gap-1.5">
          <Badge tone="accent"><Sparkles className="h-3 w-3" /> Marble identity</Badge>
          <Badge tone="success">Engine 9.2</Badge>
          <Badge tone="muted">Smarter scheduler</Badge>
        </div>
      </div>
      <Footer>
        <Button variant="ghost" className="ml-auto" onClick={() => close(done ? { title: "Update will install on next start", tone: "muted" } : undefined)}>
          {done ? "Later" : "Hide"}
        </Button>
        <Button variant="primary" disabled={!done} onClick={() => close({ title: "Restarting Badzy…", message: "Preview — version 3.2.0 installed.", tone: "success" })}>
          <RefreshCw className="h-4 w-4" /> Restart now
        </Button>
      </Footer>
    </WindowFrame>
  );
}

/* --------------------------------- disk usage --------------------------------- */

const drives = [
  { name: "C:\\ Windows", used: 41, total: "2 TB", free: "1.2 TB free", icon: HardDrive },
  { name: "D:\\ Data", used: 58, total: "1 TB", free: "412 GB free", icon: HardDrive },
  { name: "E:\\ Games", used: 90, total: "1 TB", free: "96 GB free", icon: HardDrive },
  { name: "F:\\ USB drive", used: 12, total: "32 GB", free: "28 GB free", icon: Usb },
];

export function DiskUsageDialog() {
  const close = useWindowClose();
  return (
    <WindowFrame width={520} height={440} title="Disk usage">
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-4">
        {drives.map((d, i) => (
          <motion.div key={d.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-card border border-edge bg-panel p-3">
            <div className="flex items-center gap-2">
              <d.icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
              <span className="text-13 font-semibold text-ink">{d.name}</span>
              {d.used >= 85 && <Badge tone="warning" className="ml-1">Almost full</Badge>}
              <span className="ml-auto text-12 text-muted">{d.free} of {d.total}</span>
            </div>
            <ProgressBar value={d.used} height="h-2" className="mt-2" />
          </motion.div>
        ))}
        <div className="rounded-card border border-edge bg-raised/60 p-3 text-12 text-muted">
          <div className="label-caps mb-1">Downloads by Badzy</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>Video <span className="text-ink">96 GB</span></span>
            <span>Programs <span className="text-ink">31 GB</span></span>
            <span>Compressed <span className="text-ink">58 GB</span></span>
            <span>Music <span className="text-ink">12 GB</span></span>
          </div>
        </div>
      </div>
      <Footer>
        <Button variant="secondary" onClick={() => close({ title: "Cleanup suggestions", message: "3 finished downloads older than 90 days · 21 GB", tone: "accent" })}>Free up space…</Button>
        <Button variant="primary" className="ml-auto" onClick={() => close()}>Close</Button>
      </Footer>
    </WindowFrame>
  );
}

/* ------------------------------- file type rule ------------------------------- */

export function FileTypeRuleDialog() {
  const close = useWindowClose();
  const [ext, setExt] = useState("epub mobi azw3");
  return (
    <WindowFrame width={520} height={410} title="Add file type rule">
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <TextField label="Extensions (space separated)" value={ext} onChange={(e) => setExt(e.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          {ext.split(/\s+/).filter(Boolean).map((e) => (
            <Badge key={e} tone="accent">.{e}</Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Dropdown label="Category" value="Documents" onChange={() => {}} options={["Documents", "Video", "Music", "Programs", "Compressed", "Images", "New category…"]} />
          <Dropdown label="When detected" value="Ask" onChange={() => {}} options={["Auto download", "Ask", "Ignore"]} />
        </div>
        <TextField label="Save to" value={"D:\\Docs\\Books"} readOnly />
        <Checkbox checked onChange={() => {}} label="Catch these files from the browser" />
      </div>
      <Footer>
        <Button variant="ghost" className="ml-auto" onClick={() => close()}>Cancel</Button>
        <Button variant="primary" onClick={() => close({ title: "Rule added", message: ext.split(/\s+/).map((e) => `.${e}`).join(" "), tone: "success" })}>Add rule</Button>
      </Footer>
    </WindowFrame>
  );
}

/* ------------------------------- schedule rule -------------------------------- */

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ScheduleRuleDialog() {
  const close = useWindowClose();
  const [sel, setSel] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [hour, setHour] = useState(2);
  const [min, setMin] = useState(0);
  const [action, setAction] = useState("Start queue");
  return (
    <WindowFrame width={560} height={470} title="New schedule rule">
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <TextField label="Rule name" defaultValue="Night downloads" />
        <div className="grid grid-cols-2 gap-3">
          <Dropdown label="Action" value={action} onChange={setAction} options={["Start queue", "Stop queue", "Stop all downloads", "Turn limiter on", "Turn limiter off", "Shut down PC"]} />
          <Dropdown label="Queue" value="Night queue" onChange={() => {}} options={["Main queue", "Night queue", "Work queue"]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberStepper label="Hour" value={hour} onChange={setHour} min={0} max={23} />
          <NumberStepper label="Minute" value={min} onChange={setMin} min={0} max={59} />
        </div>
        <div>
          <div className="label-caps mb-1.5">Repeat on</div>
          <div className="flex gap-1.5">
            {days.map((d) => (
              <button
                key={d}
                onClick={() => setSel((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d]))}
                className={cn(
                  "h-8 flex-1 rounded-full border text-12 font-medium transition-all focus-ring",
                  sel.includes(d) ? "border-accent bg-accent/15 text-accent" : "border-edge bg-panel text-muted hover:text-ink",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-ctl border border-edge bg-raised/60 p-2.5 text-12 text-muted">
          <Clock className="h-4 w-4 text-accent" />
          Next run: <span className="text-ink">tonight at {String(hour).padStart(2, "0")}:{String(min).padStart(2, "0")}</span>
        </div>
      </div>
      <Footer>
        <Button variant="ghost" className="ml-auto" onClick={() => close()}>Cancel</Button>
        <Button variant="primary" onClick={() => close({ title: "Schedule rule added", message: `${action} · ${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")} · ${sel.length} days`, tone: "success", icon: <CalendarClock className="h-4 w-4" /> })}>
          Add rule
        </Button>
      </Footer>
    </WindowFrame>
  );
}

/* ---------------------------------- add queue --------------------------------- */

export function AddQueueDialog() {
  const close = useWindowClose();
  const [name, setName] = useState("Weekend queue");
  const [parallel, setParallel] = useState(3);
  return (
    <WindowFrame width={480} height={380} title="Add queue">
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <TextField label="Queue name" value={name} onChange={(e) => setName(e.target.value)} />
        <NumberStepper label="Downloads at the same time" value={parallel} onChange={setParallel} min={1} max={16} />
        <div className="flex items-center justify-between rounded-ctl border border-edge bg-raised/60 px-3 py-2">
          <span className="text-13 text-ink">Start this queue when Badzy opens</span>
          <Switch on={false} onToggle={() => {}} />
        </div>
        <div className="flex items-center justify-between rounded-ctl border border-edge bg-raised/60 px-3 py-2">
          <span className="text-13 text-ink">Shut down PC when the queue finishes</span>
          <Switch on={false} onToggle={() => {}} />
        </div>
      </div>
      <Footer>
        <Button variant="ghost" className="ml-auto" onClick={() => close()}>Cancel</Button>
        <Button variant="primary" onClick={() => close({ title: "Queue created", message: `${name} · ${parallel} at a time`, tone: "success", icon: <ListPlus className="h-4 w-4" /> })}>
          Create queue
        </Button>
      </Footer>
    </WindowFrame>
  );
}

/* --------------------------------- grabber rule -------------------------------- */

export function GrabberRuleDialog() {
  const close = useWindowClose();
  const [type, setType] = useState("Extension is");
  return (
    <WindowFrame width={500} height={360} title="Add grabber filter">
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-13 text-muted"><Filter className="h-4 w-4 text-accent" /> Only grab files that match</div>
        <div className="grid grid-cols-2 gap-3">
          <Dropdown label="Condition" value={type} onChange={setType} options={["Extension is", "Name contains", "Size at least", "Size at most", "URL contains"]} />
          <TextField label="Value" defaultValue="mp4, webm" />
        </div>
        <Checkbox checked onChange={() => {}} label="Exclude matches instead" />
        <Checkbox checked={false} onChange={() => {}} label="Apply to every future scan" />
      </div>
      <Footer>
        <Button variant="ghost" className="ml-auto" onClick={() => close()}>Cancel</Button>
        <Button variant="primary" onClick={() => close({ title: "Filter added", message: `${type} mp4, webm`, tone: "success" })}>Add filter</Button>
      </Footer>
    </WindowFrame>
  );
}

/* -------------------------------- site exception ------------------------------- */

export function SiteExceptionDialog() {
  const close = useWindowClose();
  const [site, setSite] = useState("docs.google.com");
  return (
    <WindowFrame width={480} height={340} title="Add site exception">
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <TextField label="Website" icon={<Globe className="h-3.5 w-3.5" />} value={site} onChange={(e) => setSite(e.target.value)} />
        <div className="label-caps">On this site</div>
        <div className="flex flex-col gap-2">
          <Radio checked onChange={() => {}} label="Never take over downloads" />
          <Radio checked={false} onChange={() => {}} label="Only take over videos and playlists" />
        </div>
      </div>
      <Footer>
        <Button variant="ghost" className="ml-auto" onClick={() => close()}>Cancel</Button>
        <Button variant="primary" onClick={() => close({ title: "Exception added", message: site, tone: "success" })}>Add</Button>
      </Footer>
    </WindowFrame>
  );
}

/* ------------------------------ download started ------------------------------ */

export function startedToast(name: string) {
  return { title: "Download started", message: name, tone: "accent" as const, icon: <ArrowDownToLine className="h-4 w-4" /> };
}
