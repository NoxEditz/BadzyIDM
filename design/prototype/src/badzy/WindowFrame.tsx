import { useEffect, type ReactNode } from "react";
import { Minus, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/badzy-logo.png.asset.json";
import { useApp, useNative, useStage } from "./context";

function WinButton({
  danger,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      className={cn(
        "flex h-[18px] w-[18px] items-center justify-center rounded-full text-muted/70 transition-all duration-150",
        danger ? "hover:bg-error hover:text-on-accent" : "hover:bg-raised hover:text-ink",
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Frameless native-app window chrome: 22px radius, 1px red-tinted border,
 * 3px red→pink gradient line on the very top edge, custom title strip with
 * logo + title and round min / max / close buttons.
 */
export function WindowFrame({
  width,
  height,
  title,
  children,
  className,
  onClose,
  onMinimize,
  onMaximize,
}: {
  width: number;
  height: number;
  title?: string;
  children: ReactNode;
  className?: string;
  /** Overrides the default close behaviour (dismiss popup / preview toast). */
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}) {
  const { reportSize, close } = useStage();
  const { toast } = useApp();
  const nat = useNative();
  const { inPopup } = useStage();
  const fill = nat.native && !inPopup;
  useEffect(() => {
    reportSize(width, height);
  }, [width, height, reportSize]);

  const handleClose =
    onClose ??
    close ??
    (() => toast({ title: `${title ?? "Window"} closed`, message: "Reference screen — it stays visible here.", tone: "muted" }));
  const handleMin = fill
    ? (onMinimize ?? (() => nat.send("minimize")))
    : onMinimize ??
    (() => {
      close?.();
      toast({ title: "Minimized to tray", message: `${title ?? "Badzy"} keeps running in the background.`, tone: "muted" });
    });
  const handleMax = fill
    ? (onMaximize ?? (() => nat.send("maximize")))
    : onMaximize ?? (() => toast({ title: "Fixed-size window", message: "This window uses a fixed size by design.", tone: "muted" }));

  return (
    <div
      style={fill ? { width: "100%", height: "100%" } : { width, height }}
      className={cn(
        "relative flex flex-col overflow-hidden border border-edge bg-window",
        fill ? (nat.maximized ? "rounded-none" : "rounded-window") : "rounded-window shadow-window",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[3px] bg-linear-90 from-accent to-accent-2" />
      <header
        onMouseDown={(e) => {
          if (fill && e.button === 0 && !(e.target as HTMLElement).closest("button")) nat.send("drag");
        }}
        onDoubleClick={(e) => {
          if (fill && !(e.target as HTMLElement).closest("button")) nat.send("maximize");
        }}
        className="relative z-20 flex h-9 shrink-0 select-none items-center gap-2 border-b border-edge/70 bg-panel/70 px-3"
      >
        <img src={logo.url} alt="Badzy" className="h-[18px] w-[18px] shrink-0 animate-pulse-glow" draggable={false} />
        {title && (
          <span className="truncate text-12 font-semibold text-ink">
            {title}
            {title && <span className="text-muted/50"> — Badzy</span>}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <WinButton aria-label="Minimize" onClick={handleMin}>
            <Minus className="h-2.5 w-2.5" strokeWidth={2.5} />
          </WinButton>
          <WinButton aria-label="Maximize" onClick={handleMax}>
            <Square className="h-2 w-2" strokeWidth={2.5} />
          </WinButton>
          <WinButton danger aria-label="Close" onClick={handleClose}>
            <X className="h-2.5 w-2.5" strokeWidth={2.5} />
          </WinButton>
        </div>
      </header>
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-wordmark leading-none text-accent", className)}>
      Badzy
    </span>
  );
}
