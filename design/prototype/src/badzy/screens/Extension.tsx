import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  Blocks,
  Download,
  ExternalLink,
  Globe,
  Monitor,
  Settings2,
} from "lucide-react";
import { WindowFrame, Wordmark } from "../WindowFrame";
import { FileTypeTile } from "../icons";
import { Badge, Button, Dropdown, Switch } from "../ui";
import { Section } from "./Dialogs";
import { cn } from "@/lib/utils";

function Field({ label, sub, control }: { label: string; sub?: string; control?: React.ReactNode }) {
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

const detected = [
  { name: "hero-trailer-4k.mp4", kind: "video" as const, size: "482 MB", kind2: "Video" },
  { name: "aurora-ost-flac.zip", kind: "archive" as const, size: "1.20 GB", kind2: "Music" },
  { name: "blueprint-plans.pdf", kind: "pdf" as const, size: "12 MB", kind2: "Documents" },
  { name: "team-photo.jpg", kind: "image" as const, size: "8.4 MB", kind2: "Images" },
];

function PopupWindow() {
  const [on, setOn] = useState(true);
  return (
    <WindowFrame width={360} height={430} title="Badzy extension">
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <div className="flex items-center gap-2">
          <Wordmark className="text-16" />
          <Badge tone="accent" className="ml-1">on this site</Badge>
          <div className="ml-auto"><Switch on={on} onToggle={setOn} /></div>
        </div>
        <div className="label-caps">Detected downloads · 4</div>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-card border border-edge">
          {detected.map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2.5 border-b border-edge/40 px-2.5 py-2.5 last:border-0"
            >
              <FileTypeTile kind={f.kind} size={32} iconSize={15} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-12 font-medium text-ink">{f.name}</div>
                <div className="text-11 text-muted">{f.kind2} · {f.size}</div>
              </div>
              <Button variant="primary" size="sm" className="px-2.5">
                <ArrowDownToLine className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          ))}
        </div>
        <Button variant="secondary">
          <ExternalLink className="h-4 w-4" /> Open Badzy
        </Button>
      </div>
    </WindowFrame>
  );
}

function OptionsWindow() {
  return (
    <WindowFrame width={900} height={640} title="Badzy extension — options">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-lg">
          <div className="mb-4 flex items-center gap-2.5">
            <Globe className="h-5 w-5 text-accent" strokeWidth={1.75} />
            <span className="text-18 font-bold text-ink">Extension settings</span>
            <Badge tone="success" className="ml-auto">Connected to Badzy 3.2.0</Badge>
          </div>
          <div className="rounded-card border border-edge bg-panel px-3 py-1.5">
            <Field label="Take over browser downloads" sub="Open new downloads in Badzy instead" control={<Switch on onToggle={() => {}} />} />
            <Field label="Show the popup when downloads are detected" control={<Switch on onToggle={() => {}} />} />
            <Field label="Detect videos and playlists" control={<Switch on onToggle={() => {}} />} />
            <Field label="Minimum size to intercept" control={<Dropdown className="w-32" value="1 MB" onChange={() => {}} options={["Always", "1 MB", "10 MB", "100 MB"]} />} />
            <Field label="Default category" control={<Dropdown className="w-32" value="Auto" onChange={() => {}} options={["Auto", "Video", "Programs", "Documents"]} />} />
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" size="sm">Add site exception…</Button>
            <Button variant="primary" size="sm" className="ml-auto">Save</Button>
          </div>
          <div className="mt-4 rounded-card border border-edge bg-raised/60 p-3 text-12 text-muted">
            <div className="label-caps mb-1.5">Keyboard shortcut</div>
            <span className="text-ink">Ctrl + Shift + B</span> — open the Badzy popup on any page.
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}

export default function Extension() {
  return (
    <div className="flex flex-col items-center gap-6 pb-8">
      <Section label="Browser popup — 360px" node={<PopupWindow />} />
      <Section label="Extension options page" node={<OptionsWindow />} />
    </div>
  );
}
