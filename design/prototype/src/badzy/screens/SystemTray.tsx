import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  FolderOpen,
  Gauge,
  Link2,
  Pause,
  Play,
  Power,
  Settings,
  X,
} from "lucide-react";
import { WindowFrame } from "../WindowFrame";
import { ToastCard } from "../ui";
import { Section } from "./Dialogs";
import logo from "@/assets/badzy-logo.png.asset.json";
import type { LucideIcon } from "lucide-react";

const trayItems: (
  | { label: string; icon: LucideIcon; checked?: boolean; divider?: false }
  | { divider: true }
)[] = [
  { label: "Open Badzy", icon: FolderOpen },
  { label: "Add URL…", icon: Link2 },
  { divider: true },
  { label: "Start queue", icon: Play },
  { label: "Stop all", icon: Pause },
  { divider: true },
  { label: "Speed limiter — 4 MB/s", icon: Gauge, checked: true },
  { label: "Settings…", icon: Settings },
  { divider: true },
  { label: "Exit", icon: Power },
];

function DesktopScene() {
  const [menuOpen, setMenuOpen] = useState(true);
  const [toastOpen, setToastOpen] = useState(true);
  return (
    <WindowFrame width={900} height={560} title="Tray & notifications">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* faux desktop wallpaper */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(700px 420px at 30% 20%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 70%), linear-gradient(180deg, var(--stage), var(--window))",
          }}
        />
        <div className="absolute left-6 top-6 max-w-64">
          <div className="label-caps mb-1">Desktop</div>
          <div className="text-13 text-muted">Right-click the Badzy tray icon (bottom-right) to open its menu. When a download finishes, a toast appears here.</div>
        </div>
        {/* toast */}
        <AnimatePresence>
          {toastOpen && (
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} className="absolute bottom-14 right-4">
              <ToastCard
                title="Download complete"
                message="Interstellar.2014.1080p.BluRay.x264.mkv — 2.18 GB"
                icon={<CheckCircle2 className="h-4 w-4" />}
                onClose={() => setToastOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {/* taskbar */}
        <div className="absolute inset-x-0 bottom-0 flex h-11 items-center justify-end gap-3 border-t border-edge bg-panel/80 px-4 backdrop-blur-sm">
          <div className="relative">
            <button
              onClick={() => setMenuOpen((m) => !m)}
              className="flex items-center gap-2 rounded-ctl px-2 py-1 transition-colors hover:bg-accent/12"
              aria-label="Badzy tray"
            >
              <img src={logo.url} alt="" className="h-5 w-5 animate-pulse-glow" />
              <ChevronRight className="h-3 w-3 text-muted" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="absolute bottom-[calc(100%+8px)] right-0 z-20 w-60 overflow-hidden rounded-ctl border border-edge bg-panel py-1 shadow-pop"
                >
                  {trayItems.map((it, i) =>
                    it.divider ? (
                      <div key={i} className="mx-2 my-1 border-t border-edge/70" />
                    ) : (
                      <button
                        key={it.label}
                        className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-13 text-ink transition-colors hover:bg-accent/12"
                      >
                        <it.icon className="h-4 w-4 text-muted" strokeWidth={1.75} />
                        <span className="flex-1">{it.label}</span>
                        {"checked" in it && it.checked && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                      </button>
                    ),
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}

export default function SystemTray() {
  return (
    <div className="flex flex-col items-center gap-6 pb-8">
      <Section label="System tray menu + download finished toast" node={<DesktopScene />} />
    </div>
  );
}
