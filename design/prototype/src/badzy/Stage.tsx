import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LayoutGrid, X } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/badzy-logo.png.asset.json";
import { Wordmark } from "./WindowFrame";
import { AppContext, StageContext, type AppCtx, type ToastInput } from "./context";
import { PopupLayer, ToastStack, type PopupEntry, type ToastEntry } from "./popup";

export { useStage } from "./context";

/* ---------------------------------- themes ---------------------------------- */

export const themes: { key: string; label: string; colors: [string, string] }[] = [
  { key: "red", label: "Badzy Red", colors: ["#f20b36", "#ff4d6a"] },
  { key: "blue", label: "Electric Blue", colors: ["#2f7bff", "#7fb0ff"] },
  { key: "violet", label: "Violet Pulse", colors: ["#8b5cf6", "#b79bff"] },
  { key: "green", label: "Emerald Rush", colors: ["#10c97a", "#5ee6a8"] },
  { key: "orange", label: "Solar Flare", colors: ["#ff7a1a", "#ffb066"] },
  { key: "teal", label: "Deep Teal", colors: ["#14b8a6", "#5eead4"] },
  { key: "pink", label: "Hyper Pink", colors: ["#ff2d78", "#ff8fb8"] },
  { key: "mono", label: "Mono Steel", colors: ["#d7dae3", "#8f96a8"] },
  { key: "light", label: "Daylight", colors: ["#f20b36", "#e8e9ef"] },
];

/* ------------------------------- screen index ------------------------------- */

const screens: { group: string; items: { to: string; label: string; note: string }[] }[] = [
  {
    group: "Windows",
    items: [
      { to: "/", label: "Main window", note: "1120 × 680 · responsive states" },
      { to: "/add-download", label: "Add download", note: "700 × 560" },
      { to: "/settings", label: "Settings", note: "900 × 620 · 11 tabs" },
      { to: "/installer", label: "Installer", note: "820 × 500 · 4 steps" },
    ],
  },
  {
    group: "Dialogs",
    items: [
      { to: "/dialogs", label: "Dialog suite", note: "Batch · progress · complete · properties" },
      { to: "/tools", label: "Tool dialogs", note: "Torrent · playlist · grabber · scheduler…" },
    ],
  },
  {
    group: "System & web",
    items: [
      { to: "/system", label: "Tray & toast", note: "Tray menu + finished toast" },
      { to: "/extension", label: "Browser extension", note: "Popup 360px + options page" },
    ],
  },
  {
    group: "Reference",
    items: [
      { to: "/design-system", label: "Design system", note: "Tokens · icons · controls · motion" },
      { to: "/ar", label: "Arabic (RTL)", note: "Mirrored main window + add dialog" },
    ],
  },
];

function ScreenIndex({
  theme,
  onTheme,
  onClose,
}: {
  theme: string;
  onTheme: (t: string) => void;
  onClose: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-edge bg-panel shadow-pop"
    >
      <div className="flex items-center gap-2.5 border-b border-edge px-4 py-3.5">
        <img src={logo.url} alt="" className="h-7 w-7 animate-pulse-glow" />
        <Wordmark className="text-18" />
        <button
          onClick={onClose}
          className="ml-auto rounded-full p-1.5 text-muted transition-colors hover:bg-raised hover:text-ink"
          aria-label="Close screen index"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {screens.map((g) => (
          <div key={g.group} className="mb-4">
            <div className="label-caps px-2 pb-1.5">{g.group}</div>
            {g.items.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                onClick={onClose}
                className={cn(
                  "relative mb-0.5 flex items-center rounded-ctl px-2 py-2 transition-colors",
                  pathname === it.to ? "bg-accent/12" : "hover:bg-raised",
                )}
              >
                {pathname === it.to && (
                  <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-linear-180 from-accent to-accent-2" />
                )}
                <span className="pl-2">
                  <span className={cn("block text-13 font-semibold", pathname === it.to ? "text-accent" : "text-ink")}>
                    {it.label}
                  </span>
                  <span className="block text-11 text-muted">{it.note}</span>
                </span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-edge p-4">
        <div className="label-caps mb-2">Accent theme</div>
        <div className="flex flex-wrap gap-1.5">
          {themes.map((t) => (
            <button
              key={t.key}
              title={t.label}
              onClick={() => onTheme(t.key)}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                theme === t.key ? "border-ink" : "border-transparent",
              )}
              style={{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }}
            />
          ))}
        </div>
      </div>
    </motion.aside>
  );
}

/* ----------------------------------- stage ---------------------------------- */

export function Stage({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState("red");
  const [indexOpen, setIndexOpen] = useState(false);
  const [winSize, setWinSize] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(1);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const t = localStorage.getItem("badzy-theme");
    if (t && themes.some((x) => x.key === t)) setTheme(t);
  }, []);
  useEffect(() => {
    localStorage.setItem("badzy-theme", theme);
  }, [theme]);

  useLayoutEffect(() => {
    const fit = () => {
      if (!winSize) return setScale(1);
      setScale(
        Math.max(
          0.35,
          Math.min(1, (window.innerWidth - 72) / winSize.w, (window.innerHeight - 120) / winSize.h),
        ),
      );
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [winSize]);

  const reportSize = useCallback(
    (w: number, h: number) => setWinSize((p) => (p && p.w === w && p.h === h ? p : { w, h })),
    [],
  );

  /* popup stack + toasts */
  const [popups, setPopups] = useState<PopupEntry[]>([]);
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(1);

  const closePopup = useCallback((id: number) => setPopups((ps) => ps.filter((p) => p.id !== id)), []);
  const dismissToast = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);

  const app: AppCtx = useMemo(
    () => ({
      open: (node) => setPopups((ps) => [...ps, { id: nextId.current++, node }]),
      closeTop: () => setPopups((ps) => ps.slice(0, -1)),
      toast: (t: ToastInput | string) => {
        const id = nextId.current++;
        const entry: ToastEntry = typeof t === "string" ? { id, title: t } : { id, ...t };
        setToasts((ts) => [...ts.slice(-3), entry]);
        setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3600);
      },
      theme,
      setTheme,
    }),
    [theme],
  );

  /* Esc closes the top popup; navigating closes them all */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopups((ps) => ps.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => setPopups([]), [pathname]);

  return (
    <AppContext.Provider value={app}>
    <div data-theme={theme} className="relative min-h-screen bg-stage">
      {/* ambient backdrop */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(900px 520px at 50% 18%, color-mix(in oklab, var(--accent) 9%, transparent), transparent 70%)",
        }}
      />
      <button
        onClick={() => setIndexOpen((o) => !o)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-panel text-ink shadow-pop transition-all duration-150 hover:scale-105 hover:border-accent/60"
        aria-label="Toggle screen index"
      >
        <LayoutGrid className="h-4.5 w-4.5 text-accent" strokeWidth={1.75} />
      </button>
      {indexOpen && (
        <ScreenIndex theme={theme} onTheme={setTheme} onClose={() => setIndexOpen(false)} />
      )}
      {indexOpen && (
        <button
          className="fixed inset-0 z-40 bg-scrim backdrop-blur-[2px]"
          onClick={() => setIndexOpen(false)}
          aria-label="Close screen index"
        />
      )}
      <main className="flex min-h-screen items-center justify-center overflow-hidden p-9">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
          style={{
            scale,
            width: winSize?.w,
            transition: "scale 0.35s ease-out, opacity 0.26s ease-out, x 0.26s ease-out",
          }}
        >
          <StageContext.Provider value={{ reportSize }}>
            {children}
          </StageContext.Provider>
        </motion.div>
      </main>
      <PopupLayer popups={popups} stageScale={scale} onClose={closePopup} />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
    </AppContext.Provider>
  );
}
