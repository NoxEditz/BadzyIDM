import { useState } from "react";
import {
  Check,
  Download,
  FolderOpen,
  Gauge,
  Globe,
  Link2,
  Magnet,
  Pause,
  Play,
  Plus,
  Search,
  Settings,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { WindowFrame } from "../WindowFrame";
import { FileTypeTile, kindIcon, type FileKind } from "../icons";
import {
  Badge,
  Button,
  Checkbox,
  Chip,
  Dropdown,
  IconButton,
  NumberStepper,
  ProgressBar,
  Radio,
  RingProgress,
  Segmented,
  Slider,
  Switch,
  Tabs,
  TextField,
  Tip,
} from "../ui";
import { cn } from "@/lib/utils";

const colorTokens: { name: string; varName: string; hex: string }[] = [
  { name: "window", varName: "--color-window", hex: "#08090f" },
  { name: "panel", varName: "--color-panel", hex: "#121218" },
  { name: "raised", varName: "--color-raised", hex: "#1a1a22" },
  { name: "edge", varName: "--color-edge", hex: "#2a0f1b" },
  { name: "accent", varName: "--color-accent", hex: "#f20b36" },
  { name: "accent-2", varName: "--color-accent-2", hex: "#ff4d6a" },
  { name: "ink", varName: "--color-ink", hex: "#f4eff7" },
  { name: "muted", varName: "--color-muted", hex: "#a19aaa" },
  { name: "success", varName: "--color-success", hex: "#00d676" },
  { name: "warning", varName: "--color-warning", hex: "#e08a00" },
  { name: "error", varName: "--color-error", hex: "#ff8a5c" },
];

const typeColors: FileKind[] = ["video", "audio", "archive", "program", "image", "pdf", "doc", "sheet", "slides", "torrent", "disc", "general"];

const lineIcons = [Download, Link2, Search, Settings, Pause, Play, Plus, Trash2, Gauge, Globe, Magnet, FolderOpen, Check, TriangleAlert];

const typeScale = [
  { cls: "text-46", label: "46px · hero / wordmark", weight: "font-extrabold" },
  { cls: "text-26", label: "26px · window titles", weight: "font-bold" },
  { cls: "text-18", label: "18px · section heads", weight: "font-bold" },
  { cls: "text-14", label: "14px · emphasis", weight: "font-semibold" },
  { cls: "text-13", label: "13px · body", weight: "font-medium" },
  { cls: "text-12", label: "12px · secondary", weight: "font-medium" },
  { cls: "text-11", label: "11px · meta", weight: "font-medium" },
];

const motionSpecs: { name: string; spec: string }[] = [
  { name: "Micro (hover, press)", spec: "150ms · ease-out · scale 1.03–1.05 hover / 0.95 press" },
  { name: "Standard (popovers, rows)", spec: "150–260ms · ease-out · fade + 8–12px slide" },
  { name: "Screens (page transition)", spec: "260ms · ease-out · slide 28px + fade" },
  { name: "Overlays (drawer, index)", spec: "260–300ms · ease-out · slide with dimmed backdrop" },
  { name: "Ambient (logo glow, marble)", spec: "2.6s pulse / 46s drift · ease-in-out · infinite" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="label-caps mb-3">{title}</div>
      {children}
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-card border border-edge bg-panel p-4", className)}>{children}</div>;
}

export default function DesignSystem() {
  const [tab, setTab] = useState("Status");
  const [on, setOn] = useState(true);
  const [radio, setRadio] = useState("b");
  const [check, setCheck] = useState(true);
  const [slider, setSlider] = useState(62);

  return (
    <WindowFrame width={1100} height={700} title="Design system">
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <Section title="Color tokens — dark (default)">
          <div className="grid grid-cols-6 gap-2">
            {colorTokens.map((c) => (
              <div key={c.name} className="overflow-hidden rounded-card border border-edge">
                <div className="h-12" style={{ background: `var(${c.varName})` }} />
                <div className="bg-panel px-2 py-1.5">
                  <div className="text-11 font-semibold text-ink">{c.name}</div>
                  <div className="text-10 text-muted">{c.hex}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-6 gap-2">
            {typeColors.map((k) => (
              <div key={k} className="flex items-center gap-2 rounded-card border border-edge bg-panel px-2 py-1.5">
                <FileTypeTile kind={k} size={22} iconSize={12} />
                <span className="text-11 text-ink">{k}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography — Outfit UI, Kaushan Script wordmark">
          <Card>
            {typeScale.map((t) => (
              <div key={t.cls} className="flex items-baseline gap-4 border-b border-edge/40 py-2 last:border-0">
                <span className={cn("text-ink", t.cls, t.weight, t.cls === "text-46" && "leading-none")}>Badzy downloads</span>
                <span className="ml-auto text-11 text-muted">{t.label}</span>
              </div>
            ))}
            <div className="mt-3 flex items-center gap-4">
              <span className="font-wordmark text-26 text-accent">Badzy</span>
              <span className="text-11 text-muted">wordmark — Kaushan Script, brand only</span>
            </div>
            <div className="mt-2"><span className="label-caps">uppercase 10px label · wide tracking</span></div>
          </Card>
        </Section>

        <Section title="Spacing, radii & shadows">
          <Card className="flex flex-wrap items-end gap-3">
            {[4, 8, 12, 16, 24, 32].map((s) => (
              <div key={s} className="text-center">
                <div className="bg-accent/30" style={{ width: s * 3, height: 8 }} />
                <div className="mt-1 text-10 text-muted">{s}</div>
              </div>
            ))}
            <div className="mx-4 h-10 w-px bg-edge" />
            {[10, 12, 16, 22].map((r) => (
              <div key={r} className="text-center">
                <div className="h-10 w-10 border border-accent/50 bg-raised" style={{ borderRadius: r }} />
                <div className="mt-1 text-10 text-muted">{r}px</div>
              </div>
            ))}
            <div className="mx-4 h-10 w-px bg-edge" />
            <div className="rounded-card bg-panel shadow-raised p-3 text-11 text-muted">raised</div>
            <div className="rounded-card bg-panel shadow-glow p-3 text-11 text-muted">glow</div>
            <div className="rounded-card bg-panel shadow-window p-3 text-11 text-muted">window</div>
            <div className="rounded-card bg-panel shadow-pop p-3 text-11 text-muted">pop</div>
          </Card>
        </Section>

        <Section title="Icons — 24px grid · 1.75 stroke · round caps">
          <Card className="flex flex-wrap gap-2">
            {lineIcons.map((I, i) => (
              <div key={i} className="flex h-10 w-10 items-center justify-center rounded-ctl border border-edge text-muted">
                <I className="h-5 w-5" strokeWidth={1.75} />
              </div>
            ))}
          </Card>
          <div className="mt-2 flex flex-wrap gap-2">
            {typeColors.map((k) => (
              <FileTypeTile key={k} kind={k} size={40} iconSize={18} />
            ))}
          </div>
        </Section>

        <Section title="Controls — every state">
          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary"><Plus className="h-4 w-4" /> Primary</Button>
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="secondary" disabled>Disabled</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger"><Trash2 className="h-4 w-4" /> Danger</Button>
              <Tip label="Icon button"><IconButton><Search className="h-4 w-4" /></IconButton></Tip>
              <IconButton active><Gauge className="h-4 w-4" /></IconButton>
              <IconButton disabled><Trash2 className="h-4 w-4" /></IconButton>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <TextField className="w-52" placeholder="Default" />
              <TextField className="w-52" defaultValue="Focused" icon={<Link2 className="h-3.5 w-3.5" />} />
              <TextField className="w-52" defaultValue="Disabled" disabled />
              <Dropdown className="w-44" value="Dropdown" onChange={() => {}} options={["Option A", "Option B"]} />
              <NumberStepper className="w-36" value={8} onChange={() => {}} />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Switch on={on} onToggle={setOn} />
              <Switch on={false} onToggle={() => {}} />
              <Checkbox checked={check} onChange={setCheck} label="Checkbox" />
              <Checkbox checked={false} onChange={() => {}} label="Unchecked" />
              <Radio checked={radio === "a"} onChange={() => setRadio("a")} label="Radio A" />
              <Radio checked={radio === "b"} onChange={() => setRadio("b")} label="Radio B" />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Tabs tabs={["Status", "Speed limit", "Options"]} value={tab} onChange={setTab} />
              <Segmented options={[{ value: "s", label: "Small" }, { value: "m", label: "Medium" }]} value="m" onChange={() => {}} />
              <Chip active>Chip active</Chip>
              <Chip>Chip</Chip>
              <Badge tone="accent">accent</Badge>
              <Badge tone="success">success</Badge>
              <Badge tone="warning">warning</Badge>
              <Badge tone="error">error</Badge>
              <Badge tone="muted">muted</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="w-64">
                <ProgressBar value={slider} running />
                <div className="mt-2"><Slider value={slider} onChange={setSlider} /></div>
              </div>
              <RingProgress value={slider} />
              <ProgressBar value={40} />
              <ProgressBar value={0} />
              <ProgressBar value={100} />
            </div>
          </Card>
        </Section>

        <Section title="Motion specs">
          <Card>
            {motionSpecs.map((m) => (
              <div key={m.name} className="flex justify-between gap-4 border-b border-edge/40 py-2 text-12 last:border-0">
                <span className="text-ink">{m.name}</span>
                <span className="text-muted">{m.spec}</span>
              </div>
            ))}
          </Card>
        </Section>

        <Section title="Token list">
          <pre className="overflow-x-auto rounded-card border border-edge bg-window p-4 text-11 leading-relaxed text-muted">{`window      #08090f   panel     #121218   raised    #1a1a22
edge        #2a0f1b   accent    #f20b36   accent-2  #ff4d6a
ink         #f4eff7   muted     #a19aaa   success   #00d676
warning     #e08a00   error     #ff8a5c

type        Outfit (UI) · Kaushan Script (wordmark only)
scale       11 / 12 / 13 / 14 / 18 / 26 / 46 · weights 500–800
radius      window 22 · card 16 · control 10–12 · chip full
spacing     4 / 8 / 12 / 16 / 24 / 32
shadow      raised · glow · window · pop
durations   150 · 200 · 260 · 300ms · ease-out`}</pre>
        </Section>
      </div>
    </WindowFrame>
  );
}
