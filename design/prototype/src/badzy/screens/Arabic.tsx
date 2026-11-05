import { useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  CircleCheck,
  CircleDashed,
  Download,
  Gauge,
  Globe,
  ListVideo,
  Magnet,
  Pause,
  Play,
  Plus,
  Puzzle,
  Search,
  Settings,
  Settings2,
  Square,
  Trash2,
  ListPlus,
} from "lucide-react";
import { WindowFrame, Wordmark } from "../WindowFrame";
import { MarbleArt } from "../MarbleArt";
import { FileTypeTile } from "../icons";
import { categories as cats, downloads as seedRows, type DownloadRow } from "../data";
import { Badge, Button, Chip, IconButton, ProgressBar, Segmented } from "../ui";
import AddDownload from "./AddDownload";
import { cn } from "@/lib/utils";
import { Section } from "./Dialogs";

const ar = {
  nav: [
    { label: "كل التحميلات", icon: Download },
    { label: "غير المكتملة", icon: CircleDashed },
    { label: "المكتملة", icon: CircleCheck },
    { label: "المجدول", icon: CalendarClock },
    { label: "الملتقط", icon: Globe },
    { label: "قائمة التشغيل", icon: ListVideo },
    { label: "التورنت", icon: Magnet },
    { label: "أضف Badzy إلى متصفحي", icon: Puzzle },
    { label: "الخيارات", icon: Settings2 },
  ],
  categories: ["الكل", "مضغوط", "مستندات", "موسيقى", "برامج", "فيديو", "صور"],
  cols: ["الاسم", "ق", "الحجم", "الحالة", "متبقٍ", "السرعة", "آخر محاولة", "أُضيف", "حفظ إلى"],
  status: { running: "جارٍ التحميل", paused: "متوقف مؤقتًا", failed: "فشل", finished: "مكتمل", queued: "في الطابور" },
  panel: { cats: "الفئات", queues: "الطوابير", active: "التحميلات النشطة", disk: "استخدام القرص" },
  bar: { running: "قيد التشغيل", paused: "متوقف", failed: "فشل", items: "عناصر", free: "مساحة حرة", limiter: "محدد السرعة" },
  tagline: "أفضل. أسرع. لك.",
};

function statusCellAr(row: DownloadRow) {
  const tone: Record<DownloadRow["status"], string> = {
    running: "text-accent",
    paused: "text-muted",
    failed: "text-error",
    finished: "text-success",
    queued: "text-warning",
  };
  return (
    <div className="w-full">
      <div className={cn("text-12 font-medium", tone[row.status])}>{ar.status[row.status]}</div>
      {row.status !== "finished" && row.progress > 0 && (
        <ProgressBar value={row.progress} running={row.status === "running"} height="h-[3px]" className="mt-1" />
      )}
    </div>
  );
}

function ArMainWindow() {
  return (
    <WindowFrame width={1120} height={680} title="كل التحميلات">
      <div dir="rtl" className="flex min-h-0 flex-1 flex-col">
        {/* top bar */}
        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-edge/70 px-3">
          <img src="/favicon.png" alt="" className="h-6 w-6 animate-pulse-glow" />
          <Wordmark className="text-18" />
          <div className="relative w-full max-w-64">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              placeholder="ابحث في التحميلات…"
              className="h-8 w-full rounded-full border border-edge bg-panel px-8 pl-3 text-12 text-ink placeholder:text-muted/60 focus:border-accent/70 focus-ring"
            />
          </div>
          <IconButton className="ml-auto relative" aria-label="التنبيهات">
            <Settings className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="flex min-h-0 flex-1">
          {/* right nav (mirrored) */}
          <nav className="flex w-52 shrink-0 flex-col border-l border-edge/70 bg-panel/50 p-2">
            <div className="flex-1 overflow-y-auto">
              {ar.nav.map((it, i) => (
                <motion.button
                  key={it.label}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "mb-0.5 flex w-full items-center gap-2.5 rounded-ctl px-2.5 py-2 text-right text-13 transition-colors",
                    i === 0 ? "bg-accent/12 font-semibold text-accent" : "text-muted hover:bg-raised hover:text-ink",
                  )}
                >
                  <it.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span className="flex-1 truncate">{it.label}</span>
                </motion.button>
              ))}
            </div>
            <div className="relative mx-2 mb-2 h-28 shrink-0 overflow-hidden rounded-card">
              <MarbleArt className="absolute inset-0" veil={0.55} />
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <Wordmark className="text-16" />
                <div className="text-11 text-muted">{ar.tagline}</div>
              </div>
            </div>
          </nav>
          {/* center */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-edge/70 px-3 py-2.5">
              {ar.categories.map((c, i) => (
                <button
                  key={c}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-card border px-3 py-2",
                    i === 0 ? "border-accent/60 bg-accent/10" : "border-edge bg-panel",
                  )}
                >
                  <FileTypeTile kind={cats[i]!.kind} size={26} iconSize={13} />
                  <span>
                    <span className={cn("block text-12 font-semibold", i === 0 ? "text-accent" : "text-ink")}>{c}</span>
                    <span className="block text-11 text-muted">{cats[i]!.count}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-edge/70 px-3 py-2">
              <Button variant="primary" size="sm"><Plus className="h-3.5 w-3.5" /> إضافة رابط</Button>
              <Button variant="secondary" size="sm"><ListPlus className="h-3.5 w-3.5" /> إضافة دفعة</Button>
              <span className="mx-1 h-5 w-px bg-edge" />
              <Button variant="ghost" size="sm" className="px-2"><Play className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" className="px-2"><Pause className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" className="px-2"><Square className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" className="px-2"><Trash2 className="h-3.5 w-3.5" /></Button>
              <span className="mx-1 h-5 w-px bg-edge" />
              <Chip><Gauge className="h-3 w-3" /> المحدد</Chip>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 border-b border-edge/70 bg-panel/80 px-3 py-1.5">
                <span className="label-caps flex-1">{ar.cols[0]}</span>
                <span className="label-caps w-8 text-center">{ar.cols[1]}</span>
                <span className="label-caps w-20 text-right">{ar.cols[2]}</span>
                <span className="label-caps w-36">{ar.cols[3]}</span>
                <span className="label-caps w-20 text-right">{ar.cols[4]}</span>
                <span className="label-caps w-24 text-right">{ar.cols[5]}</span>
                <span className="label-caps w-24 text-right">{ar.cols[6]}</span>
                <span className="label-caps w-24 text-right">{ar.cols[7]}</span>
              </div>
              {seedRows.map((r) => (
                <div key={r.id} className="flex items-center gap-2 border-b border-edge/40 px-3 py-2 transition-colors hover:bg-raised/70">
                  <FileTypeTile kind={r.kind} size={34} iconSize={16} />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-13 font-medium", r.status === "finished" ? "text-muted" : "text-ink")}>{r.name}</span>
                  </span>
                  <span className="w-8 text-center text-11 text-muted">{r.id}</span>
                  <span className="w-20 text-right text-12 text-muted">{r.size}</span>
                  <span className="w-36">{statusCellAr(r)}</span>
                  <span className="w-20 text-right text-12 text-muted">{r.eta}</span>
                  <span className={cn("w-24 text-right text-12", r.status === "running" ? "font-semibold text-accent" : "text-muted")}>{r.speed}</span>
                  <span className="w-24 text-right text-12 text-muted">{r.lastTry}</span>
                  <span className="w-24 text-right text-12 text-muted">{r.added}</span>
                </div>
              ))}
            </div>
            <div className="flex h-8 shrink-0 items-center gap-4 border-t border-edge/70 bg-panel/60 px-3 text-11 text-muted">
              <span>{seedRows.filter((r) => r.status === "running").length} {ar.bar.running}</span>
              <span>{seedRows.filter((r) => r.status === "paused").length} {ar.bar.paused}</span>
              <span>{seedRows.length} {ar.bar.items}</span>
              <span className="mr-auto flex items-center gap-1.5"><Gauge className="h-3 w-3" /> {ar.bar.limiter} 4 MB/s</span>
            </div>
          </div>
          {/* left panel (mirrored) */}
          <aside className="flex w-64 shrink-0 flex-col gap-2.5 overflow-y-auto border-r border-edge/70 bg-panel/40 p-2.5">
            <div className="rounded-card border border-edge bg-panel p-2">
              <div className="label-caps px-1 pb-1.5">{ar.panel.cats}</div>
              {cats.slice(1).map((c, i) => (
                <div key={c.key} className="flex items-center gap-2 rounded-ctl px-1.5 py-1 text-12 text-muted">
                  <FileTypeTile kind={c.kind} size={20} iconSize={11} />
                  <span className="flex-1">{ar.categories[i + 1]}</span>
                  <span className="text-11">{c.count}</span>
                </div>
              ))}
              <div className="label-caps px-1 pb-1.5 pt-2.5">{ar.panel.queues}</div>
              {["الرئيسي", "الليلي", "العمل"].map((q) => (
                <div key={q} className="flex items-center gap-2 rounded-ctl px-1.5 py-1 text-12 text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  <span className="flex-1">{q}</span>
                </div>
              ))}
            </div>
            <div className="rounded-card border border-edge bg-panel p-2.5">
              <div className="label-caps pb-2">{ar.panel.active}</div>
              {seedRows.filter((r) => r.status === "running").slice(0, 2).map((r) => (
                <div key={r.id} className="mb-2 last:mb-0">
                  <div className="truncate text-12 text-ink">{r.name}</div>
                  <ProgressBar value={r.progress} running height="h-[3px]" className="mt-1" />
                  <div className="mt-1 flex justify-between text-11 text-muted">
                    <span>{r.progress.toFixed(0)}% · {r.size}</span>
                    <span className="text-accent">{r.speed}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-card border border-edge bg-panel p-2.5">
              <div className="label-caps pb-2">{ar.panel.disk}</div>
              <ProgressBar value={58} height="h-2" />
              <div className="mt-1.5 text-11 text-muted">58% مستخدم · 588 جيجابايت من 1 تيرابايت</div>
            </div>
          </aside>
        </div>
      </div>
      <Badge tone="accent" className="absolute bottom-3 left-3">RTL · معكوس</Badge>
    </WindowFrame>
  );
}

function ArAddDialog() {
  return <AddDownload initialLang="ar" />;
}

export default function Arabic() {
  const [view, setView] = useState<"main" | "add">("main");
  return (
    <div className="flex flex-col items-center gap-3">
      <Segmented
        options={[
          { value: "main", label: "النافذة الرئيسية" },
          { value: "add", label: "إضافة تحميل" },
        ]}
        value={view}
        onChange={setView}
      />
      {view === "main" ? <Section label="" node={<ArMainWindow />} /> : <Section label="" node={<ArAddDialog />} />}
    </div>
  );
}
