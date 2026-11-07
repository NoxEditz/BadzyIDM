import { useState } from "react";
import { useSettings } from "../settingsStore";
import { useFolderPick } from "../dialogs/files";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Bell,
  Blocks,
  FileDown,
  FolderOpen,
  Globe,
  HardDrive,
  Info,
  Languages,
  MonitorCog,
  Music,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WindowFrame, Wordmark } from "../WindowFrame";
import { MarbleArt } from "../MarbleArt";
import { themes } from "../Stage";
import {
  Badge,
  Button,
  Checkbox,
  Dropdown,
  Field,
  NumberStepper,
  Segmented,
  Slider,
  Switch,
  TextField,
  Tip,
} from "../ui";
import { FileTypeTile, type FileKind } from "../icons";
import logo from "@/assets/badzy-logo.png.asset.json";
import { useApp, useWindowClose } from "../context";
import { FolderPicker } from "../dialogs/files";
import { FileTypeRuleDialog, UpdateDialog } from "../dialogs/app";
import { WhatsNewDialog } from "./Tools";

function BrowseButton({ initial, variant = "secondary" }: { initial: string; variant?: "secondary" | "ghost" }) {
  const { open } = useApp();
  return (
    <Button variant={variant} size="sm" onClick={() => open(<FolderPicker initial={initial} />)}>
      Browse…
    </Button>
  );
}

const TABS = [
  { key: "General", icon: MonitorCog },
  { key: "Save to", icon: FolderOpen },
  { key: "Downloads", icon: FileDown },
  { key: "Connection", icon: Globe },
  { key: "File types", icon: Blocks },
  { key: "Sounds", icon: Volume2 },
  { key: "Appearance", icon: SlidersHorizontal },
  { key: "Browser", icon: Globe },
  { key: "Updates", icon: RefreshCw },
  { key: "Language", icon: Languages },
  { key: "About", icon: Info },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

function Row({ label, sub, control }: { label: React.ReactNode; sub?: string | undefined; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-edge/40 py-2.5 last:border-0">
      <div className="min-w-0">
        <div className="text-13 text-ink">{label}</div>
        {sub && <div className="text-11 text-muted">{sub}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{control}</div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="label-caps mb-1">{title}</div>
      <div className="rounded-card border border-edge bg-panel px-3 py-1.5">{children}</div>
    </div>
  );
}

/* ---------------------------------- tabs ------------------------------------ */

function Unavailable() {
  return <div className="py-10 text-center text-13 text-muted">Loading settings…</div>;
}

function GeneralTab() {
  const { s, setAutostart, native } = useSettings();
  if (native && !s) return <Unavailable />;
  return (
    <>
      <Group title="Startup">
        <Row label="Start Badzy when Windows starts" control={<Switch on={native ? !!s?.autostart : true} onToggle={(v) => (native ? setAutostart(v) : undefined)} />} />
      </Group>
      <Group title="Program">
        <Row label="Version" control={<Badge tone="accent">{s?.version ?? "2.0.0"}</Badge>} />
      </Group>
    </>
  );
}

const CATS: [string, string, FileKind][] = [
  ["Video", "Video", "video"],
  ["Music", "Music", "audio"],
  ["Programs", "Programs", "program"],
  ["Documents", "Documents", "doc"],
  ["Compressed", "Compressed", "archive"],
  ["Images", "Images", "image"],
];

function SaveToTab() {
  const { s, set, native } = useSettings();
  const { pickFolder } = useFolderPick();
  if (native && !s) return <Unavailable />;
  const root = s?.download_dir ?? "D:\\Badzy Downloads";
  return (
    <>
      <Group title="Default folder">
        <Row label="Save new downloads to" control={
          <>
            <TextField className="w-64" value={root} readOnly />
            <Button variant="secondary" onClick={() => pickFolder(root, (p) => set({ download_dir: p }))}><FolderOpen className="h-3.5 w-3.5" /> Browse</Button>
          </>
        } />
      </Group>
      <Group title="Category folders (empty = inside the default folder)">
        {CATS.map(([name, key, kind]) => {
          const path = s?.category_dirs?.[key] ?? "";
          return (
            <Row key={name} label={
              <span className="flex items-center gap-2"><FileTypeTile kind={kind} size={20} iconSize={11} />{name}</span>
            } control={
              <>
                <TextField className="w-56" value={path} readOnly placeholder="default" />
                <Button variant="ghost" onClick={() => pickFolder(path || root, (p) => set({ category_dirs: { ...(s?.category_dirs ?? {}), [key]: p } }))}><FolderOpen className="h-3.5 w-3.5" /></Button>
              </>
            } />
          );
        })}
      </Group>
    </>
  );
}

function DownloadsTab() {
  const { s, set, native } = useSettings();
  if (native && !s) return <Unavailable />;
  return (
    <Group title="Limits">
      <Row label="Maximum simultaneous downloads" control={<NumberStepper className="w-40" value={s?.max_active ?? 4} onChange={(v) => set({ max_active: v })} min={1} max={32} />} />
      <Row label="Connections per download" control={<NumberStepper className="w-40" value={s?.connections ?? 8} onChange={(v) => set({ connections: v })} min={1} max={32} />} />
      <Row label="Retries on failure" control={<NumberStepper className="w-40" value={s?.retries ?? 3} onChange={(v) => set({ retries: v })} min={0} max={10} />} />
    </Group>
  );
}

function ConnectionTab() {
  const { s, set, native } = useSettings();
  if (native && !s) return <Unavailable />;
  const kb = s?.speed_limit_kb ?? 0;
  return (
    <Group title="Speed limits">
      <Row label="Download limit (KB/s)" sub={kb === 0 ? "0 = unlimited" : `${(kb / 1024).toFixed(1)} MB/s`} control={<NumberStepper className="w-40" value={kb} onChange={(v) => set({ speed_limit_kb: v, speed_limit_on: v > 0 })} min={0} max={1000000} />} />
      <Row label="Speed limiter active" control={<Switch on={!!s?.speed_limit_on} onToggle={(v) => set({ speed_limit_on: v })} />} />
      <Row label="Torrent upload limit (KB/s)" sub="0 = unlimited" control={<NumberStepper className="w-40" value={s?.torrent_upload_kb ?? 0} onChange={(v) => set({ torrent_upload_kb: v })} min={0} max={1000000} />} />
    </Group>
  );
}

function FileTypesTab() {
  const { open } = useApp();
  return (
    <Group title="Handled file types">
      {(["video", "audio", "archive", "program", "image", "pdf"] as FileKind[]).map((k, i) => (
        <Row key={k} label={
          <span className="flex items-center gap-2"><FileTypeTile kind={k} size={22} iconSize={12} />{k.charAt(0).toUpperCase() + k.slice(1)}</span>
        } sub={i % 2 === 0 ? "Opens picker on click" : undefined} control={
          <>
            <Checkbox checked={i !== 5} onChange={() => {}} label="Monitor" />
            <Dropdown className="w-32" value="Ask" onChange={() => {}} options={["Auto download", "Ask", "Ignore"]} />
          </>
        } />
      ))}
      <div className="pt-2">
        <Button variant="secondary" size="sm" onClick={() => open(<FileTypeRuleDialog />)}>Add file type rule…</Button>
      </div>
    </Group>
  );
}

function SoundsTab() {
  const { toast } = useApp();
  return (
    <>
      <Group title="Events">
        {["Download finished", "Download added", "Download failed", "Queue finished"].map((e, i) => (
          <Row key={e} label={e} control={
            <>
              <Dropdown className="w-44" value={i === 3 ? "None" : "Badzy Chime"} onChange={() => {}} options={["Badzy Chime", "Soft Bell", "Percussion", "None"]} />
              <Tip label="Play"><Button variant="ghost" size="sm" className="px-2" onClick={() => toast({ title: `Playing “${e}” sound`, message: i === 3 ? "None selected" : "Badzy Chime", tone: "accent", icon: <Music className="h-4 w-4" /> })}><Volume2 className="h-3.5 w-3.5" /></Button></Tip>
            </>
          } />
        ))}
      </Group>
      <Group title="Volume">
        <Row label="Master volume" sub="70%" control={<Slider className="w-56" value={70} onChange={() => {}} />} />
      </Group>
    </>
  );
}

function AppearanceTab() {
  const { theme, setTheme } = useApp();
  return (
    <>
      <Group title="Accent theme">
        <div className="flex flex-wrap gap-2 py-2">
          {themes.map((t) => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              title={t.label}
              className={cn(
                "h-9 w-9 rounded-full border-2 transition-transform hover:scale-110",
                theme === t.key ? "border-ink" : "border-transparent",
              )}
              style={{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }}
            />
          ))}
        </div>
      </Group>
      <Group title="Interface">
        <Row label="Font size" control={<Segmented options={[{ value: "s", label: "Small" }, { value: "m", label: "Medium" }, { value: "l", label: "Large" }]} value="m" onChange={() => {}} />} />
        <Row label="Glass effect on panels" control={<Switch on onToggle={() => {}} />} />
        <Row label="Background picture" control={
          <>
            <Dropdown className="w-40" value="Marble art" onChange={() => {}} options={["None", "Marble art", "Solid color"]} />
            <MarbleArt className="h-9 w-14 rounded-md border border-edge" veil={0.5} />
          </>
        } />
      </Group>
    </>
  );
}

function BrowserTab() {
  return (
    <>
      <Group title="Extension">
        <Row label="Badzy browser extension" control={<Badge tone="success"><BadgeCheck className="h-3 w-3" /> Installed 3.2.0</Badge>} />
        <Row label="Take over browser downloads" sub="Badzy intercepts new downloads instead of the browser" control={<Switch on onToggle={() => {}} />} />
        <Row label="Show popup when a download is detected" control={<Switch on onToggle={() => {}} />} />
      </Group>
      <Group title="Browsers">
        {["Google Chrome", "Microsoft Edge", "Firefox"].map((b, i) => (
          <Row key={b} label={b} control={
            <Badge tone={i < 2 ? "success" : "muted"}>{i < 2 ? "Connected" : "Not installed"}</Badge>
          } />
        ))}
      </Group>
    </>
  );
}

function UpdatesTab() {
  const { open } = useApp();
  const [state, setState] = useState<"idle" | "checking" | "found">("idle");
  return (
    <>
      <Group title="Updates">
        <Row label="Current version" control={<Badge tone="accent">3.1.4</Badge>} />
        <Row label="Latest available" control={<Badge tone="success">3.2.0</Badge>} />
        <Row label="Update channel" control={<Dropdown className="w-40" value="Stable" onChange={() => {}} options={["Stable", "Beta", "Nightly"]} />} />
        <Row label="Install updates automatically" control={<Switch on onToggle={() => {}} />} />
      </Group>
      <div className="flex gap-2">
        {state === "found" ? (
          <Button variant="primary" onClick={() => open(<UpdateDialog />)}><RefreshCw className="h-4 w-4" /> Install 3.2.0</Button>
        ) : (
          <Button
            variant="primary"
            disabled={state === "checking"}
            onClick={() => {
              setState("checking");
              setTimeout(() => setState("found"), 1200);
            }}
          >
            <RefreshCw className={cn("h-4 w-4", state === "checking" && "animate-spin")} /> {state === "checking" ? "Checking…" : "Check now"}
          </Button>
        )}
        <span className="self-center text-11 text-muted">
          {state === "found" ? "Badzy 3.2.0 is ready to download · 24 MB" : "Last checked: today at 06:12"}
        </span>
      </div>
    </>
  );
}

function LanguageTab() {
  return (
    <Group title="Language">
      <Row label="Interface language" control={<Dropdown className="w-56" value="English (US)" onChange={() => {}} options={["English (US)", "العربية", "Deutsch", "Español", "Français", "日本語", "Русский", "Türkçe"]} />} />
      <Row label="Right-to-left layout when using Arabic" control={<Switch on onToggle={() => {}} />} />
      <div className="py-2 text-11 text-muted">Translations refresh automatically. 24 community languages available.</div>
    </Group>
  );
}

function AboutTab() {
  const { open } = useApp();
  return (
    <div className="flex min-h-96 items-center justify-center gap-6">
      <div className="relative h-64 w-56 overflow-hidden rounded-card">
        <MarbleArt className="absolute inset-0" veil={0.6} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <img src={logo.url} alt="" className="h-16 w-16 animate-pulse-glow" />
          <Wordmark className="mt-2 text-26" />
          <div className="text-11 text-muted">Better. Faster. Yours.</div>
        </div>
      </div>
      <div className="w-64 text-12 text-muted">
        <div className="text-14 font-bold text-ink">Badzy 3.1.4 (build 8420)</div>
        <div className="mt-2">A premium download manager for Windows. Built with a native feel: dark glass panels, deep red energy, and zero clutter.</div>
        <div className="mt-3 flex flex-col gap-1.5">
          <span>Licensed to: <span className="text-ink">Studio Design Reference</span></span>
          <span>Engine: <span className="text-ink">Multi-connection 9.2</span></span>
          <span>© 2026 Badzy Software</span>
        </div>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => open(<WhatsNewDialog />)}>Open changelog</Button>
      </div>
    </div>
  );
}

/* --------------------------------- screen ----------------------------------- */

export default function Settings({ initialTab = "General" }: { initialTab?: TabKey }) {
  const [tab, setTab] = useState<TabKey>(initialTab);
  const close = useWindowClose();
  return (
    <WindowFrame width={900} height={620} title="Settings">
      <div className="flex min-h-0 flex-1">
        <nav className="w-48 shrink-0 overflow-y-auto border-r border-edge/70 bg-panel/50 p-2">
          {TABS.map((t, i) => (
            <motion.button
              key={t.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02, duration: 0.2 }}
              onClick={() => setTab(t.key)}
              className={cn(
                "mb-0.5 flex w-full items-center gap-2.5 rounded-ctl px-2.5 py-2 text-left text-13 transition-colors",
                tab === t.key ? "bg-accent/12 font-semibold text-accent" : "text-muted hover:bg-raised hover:text-ink",
              )}
            >
              <t.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {t.key}
            </motion.button>
          ))}
        </nav>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="min-w-0 flex-1 overflow-y-auto p-4"
        >
          {tab === "General" && <GeneralTab />}
          {tab === "Save to" && <SaveToTab />}
          {tab === "Downloads" && <DownloadsTab />}
          {tab === "Connection" && <ConnectionTab />}
          {tab === "File types" && <FileTypesTab />}
          {tab === "Sounds" && <SoundsTab />}
          {tab === "Appearance" && <AppearanceTab />}
          {tab === "Browser" && <BrowserTab />}
          {tab === "Updates" && <UpdatesTab />}
          {tab === "Language" && <LanguageTab />}
          {tab === "About" && <AboutTab />}
        </motion.div>
      </div>
      <div className="flex h-11 shrink-0 items-center justify-end gap-2 border-t border-edge bg-panel/60 px-4">
        <Button variant="ghost" onClick={() => close()}>Cancel</Button>
        <Button variant="primary" onClick={() => close({ title: "Settings saved", message: "Changes apply right away.", tone: "success" })}>Apply</Button>
      </div>
    </WindowFrame>
  );
}
