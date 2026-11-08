import { StrictMode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "@fontsource/kaushan-script/400.css";
import "../src/styles.css";
import MainWindow from "../src/badzy/screens/MainWindow";
import NativeProgress from "../src/badzy/screens/NativeProgress";
import FinishedToast from "../src/badzy/screens/FinishedToast";
import { AddDownloadWindow } from "../src/badzy/screens/AddDownload";
import { AppContext, NativeContext, StageContext, type AppCtx, type ToastInput } from "../src/badzy/context";
import { PopupLayer, ToastStack, type PopupEntry, type ToastEntry } from "../src/badzy/popup";

type Ipc = { postMessage: (m: string) => void };
const ipc = (): Ipc | undefined => (window as unknown as { ipc?: Ipc }).ipc;
const send = (cmd: string, arg?: unknown) => ipc()?.postMessage(JSON.stringify({ cmd, arg }));

const EDGES: { dir: string; cls: string; cursor: string }[] = [
  { dir: "n", cls: "top-0 left-3 right-3 h-1", cursor: "ns-resize" },
  { dir: "s", cls: "bottom-0 left-3 right-3 h-1", cursor: "ns-resize" },
  { dir: "w", cls: "left-0 top-3 bottom-3 w-1", cursor: "ew-resize" },
  { dir: "e", cls: "right-0 top-3 bottom-3 w-1", cursor: "ew-resize" },
  { dir: "nw", cls: "top-0 left-0 h-3 w-3", cursor: "nwse-resize" },
  { dir: "ne", cls: "top-0 right-0 h-3 w-3", cursor: "nesw-resize" },
  { dir: "sw", cls: "bottom-0 left-0 h-3 w-3", cursor: "nesw-resize" },
  { dir: "se", cls: "bottom-0 right-0 h-3 w-3", cursor: "nwse-resize" },
];

/** What this window shows: the main window, or a popup chosen by the address (#add/<data>, #progress/<id>). */
function Content() {
  const h = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  if (h.startsWith("add/")) {
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(h.slice(4));
    } catch {
      /* empty */
    }
    return <AddDownloadWindow initialUrl={String(data["url"] ?? "")} extra={data} autoCheck />;
  }
  if (h.startsWith("finished/")) return <FinishedToast id={Number(h.slice(9))} />;
  if (h.startsWith("progress/")) return <NativeProgress id={Number(h.slice(9))} />;
  return <MainWindow />;
}

const IS_POPUP = window.location.hash.length > 1;

function NativeApp() {
  const [theme, setTheme] = useState(() => localStorage.getItem("badzy-theme") ?? "red");
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [maximized, setMaximized] = useState(false);
  const [popups, setPopups] = useState<PopupEntry[]>([]);
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(1);

  useEffect(() => localStorage.setItem("badzy-theme", theme), [theme]);
  useEffect(() => {
    const fit = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", fit);
    const w = window as unknown as { __badzy?: Record<string, unknown> };
    w.__badzy = Object.assign(w.__badzy ?? {}, {
      state: (s: { maximized?: boolean }) => setMaximized(!!s.maximized),
    });
    send("ready");
    return () => window.removeEventListener("resize", fit);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPopups((ps) => ps.slice(0, -1));
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
  const nat = useMemo(
    () => ({ native: true, vw: vp.w, vh: vp.h, maximized, send }),
    [vp.w, vp.h, maximized],
  );

  return (
    <AppContext.Provider value={app}>
      <NativeContext.Provider value={nat}>
        <div data-theme={theme} className="fixed inset-0">
          <StageContext.Provider value={IS_POPUP ? { reportSize: () => {}, close: () => send("closeWindow") } : { reportSize: () => {} }}>
            <Content />
          </StageContext.Provider>
          {!maximized && !IS_POPUP &&
            EDGES.map((e) => (
              <div
                key={e.dir}
                className={`fixed z-[200] ${e.cls}`}
                style={{ cursor: e.cursor }}
                onMouseDown={(ev) => ev.button === 0 && send("resize", e.dir)}
              />
            ))}
          <PopupLayer popups={popups} stageScale={1} onClose={closePopup} />
          <ToastStack toasts={toasts} onDismiss={dismissToast} />
        </div>
      </NativeContext.Provider>
    </AppContext.Provider>
  );
}

document.documentElement.style.background = "#08090f";
document.body.style.background = "#08090f";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NativeApp />
  </StrictMode>,
);
