import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { StageContext, type ToastInput, type ToastTone } from "./context";

/* ------------------------------- popup stack -------------------------------- */

export type PopupEntry = { id: number; node: ReactNode };

function PopupItem({
  entry,
  depth,
  stageScale,
  onClose,
}: {
  entry: PopupEntry;
  depth: number;
  stageScale: number;
  onClose: () => void;
}) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [vp, setVp] = useState({ w: 1280, h: 800 });

  useEffect(() => {
    const fit = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const scale = size
    ? Math.max(0.35, Math.min(stageScale, (vp.w - 48) / size.w, (vp.h - 48) / size.h))
    : stageScale;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 70 + depth * 2 }}>
      <motion.button
        aria-label="Close window"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        className={cn("absolute inset-0 backdrop-blur-[2px]", depth === 0 ? "bg-scrim" : "bg-scrim/60")}
      />
      <motion.div
        initial={{ opacity: 0, scale: scale * 0.94, y: 14 }}
        animate={{ opacity: 1, scale, y: 0 }}
        exit={{ opacity: 0, scale: scale * 0.96, y: 8 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative"
      >
        <StageContext.Provider
          value={{
            reportSize: (w, h) => setSize((p) => (p && p.w === w && p.h === h ? p : { w, h })),
            close: onClose,
            inPopup: true,
          }}
        >
          {entry.node}
        </StageContext.Provider>
      </motion.div>
    </div>
  );
}

export function PopupLayer({
  popups,
  stageScale,
  onClose,
}: {
  popups: PopupEntry[];
  stageScale: number;
  onClose: (id: number) => void;
}) {
  return (
    <AnimatePresence>
      {popups.map((p, i) => (
        <PopupItem key={p.id} entry={p} depth={i} stageScale={stageScale} onClose={() => onClose(p.id)} />
      ))}
    </AnimatePresence>
  );
}

/* ---------------------------------- toasts ---------------------------------- */

export type ToastEntry = ToastInput & { id: number };

const toneStyle: Record<ToastTone, { wrap: string; icon: ReactNode }> = {
  success: { wrap: "bg-success/15 text-success", icon: <CheckCircle2 className="h-4 w-4" /> },
  accent: { wrap: "bg-accent/15 text-accent", icon: <Info className="h-4 w-4" /> },
  warning: { wrap: "bg-warning/15 text-warning", icon: <TriangleAlert className="h-4 w-4" /> },
  error: { wrap: "bg-error/15 text-error", icon: <CircleAlert className="h-4 w-4" /> },
  muted: { wrap: "bg-raised text-muted", icon: <Info className="h-4 w-4" /> },
};

export function ToastStack({ toasts, onDismiss }: { toasts: ToastEntry[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-80 flex-col-reverse gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const tone = toneStyle[t.tone ?? "accent"];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="pointer-events-auto relative overflow-hidden rounded-card border border-edge bg-panel p-3 shadow-pop"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-linear-90 from-accent to-accent-2" />
              <div className="flex items-start gap-2.5">
                <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", tone.wrap)}>
                  {t.icon ?? tone.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-13 font-semibold text-ink">{t.title}</div>
                  {t.message && <div className="mt-0.5 text-12 text-muted">{t.message}</div>}
                </div>
                <button
                  onClick={() => onDismiss(t.id)}
                  className="rounded-full p-0.5 text-muted transition-colors hover:text-ink focus-ring"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3.6, ease: "linear" }}
                className="absolute bottom-0 left-0 h-[2px] bg-accent/50"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
