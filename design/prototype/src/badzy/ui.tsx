import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  animate,
  AnimatePresence,
  motion,
} from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronDown, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Semi-controlled value: follows the prop, but also updates locally so
 * reference screens with no-op handlers still feel interactive.
 */
function useLocal<T>(value: T, onChange?: (v: T) => void) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return [
    v,
    (n: T) => {
      setV(n);
      onChange?.(n);
    },
  ] as const;
}

/* ---------------------------------- buttons --------------------------------- */

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 rounded-ctl font-semibold focus-ring transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-linear-135 from-accent to-accent-2 text-on-accent shadow-glow hover:scale-[1.04] active:scale-[0.95]",
        secondary:
          "border border-edge bg-raised text-ink hover:border-accent/60 hover:scale-[1.03] active:scale-[0.95]",
        ghost:
          "text-muted hover:bg-accent/10 hover:text-ink active:scale-[0.95]",
        danger:
          "border border-error/30 bg-error/12 text-error hover:bg-error/22 active:scale-[0.95]",
      },
      size: {
        sm: "h-7 px-3 text-12",
        md: "h-9 px-4 text-13",
        lg: "h-11 px-5 text-14",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children?: ReactNode;
}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

export function IconButton({
  className,
  active,
  danger,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; danger?: boolean }) {
  return (
    <button
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-all duration-150 ease-out hover:bg-accent/12 hover:text-ink active:scale-90 focus-ring disabled:pointer-events-none disabled:opacity-40",
        active && "bg-accent/15 text-accent",
        danger && "hover:bg-error/15 hover:text-error",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* --------------------------------- tooltip ---------------------------------- */

export function Tip({
  label,
  side = "top",
  children,
}: {
  label: string;
  side?: "top" | "bottom";
  children: ReactNode;
}) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-edge bg-raised px-2 py-1 text-11 text-ink opacity-0 shadow-pop transition-opacity delay-300 duration-150 group-hover/tip:opacity-100",
          side === "top" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]",
        )}
      >
        {label}
      </span>
    </span>
  );
}

/* -------------------------------- text field -------------------------------- */

export function TextField({
  label,
  hint,
  icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className={cn("w-full", className)}>
      {label && <div className="label-caps mb-1.5">{label}</div>}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </div>
        )}
        <input
          className={cn(
            "h-9 w-full rounded-ctl border border-edge bg-panel px-3 text-13 text-ink placeholder:text-muted/60 transition-colors hover:border-accent/40 focus:border-accent/70 focus-ring disabled:opacity-40",
            icon && "pl-9",
          )}
          {...props}
        />
      </div>
      {hint && <div className="mt-1 text-11 text-muted">{hint}</div>}
    </div>
  );
}

/* --------------------------------- dropdown --------------------------------- */

export function Dropdown({
  label,
  value,
  options,
  onChange,
  className,
  disabled,
}: {
  label?: string;
  value: string | null;
  options: string[];
  onChange: (v: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useLocal(value, (v) => v != null && onChange(v));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {label && <div className="label-caps mb-1.5">{label}</div>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between rounded-ctl border border-edge bg-panel px-3 text-13 text-ink transition-colors hover:border-accent/50 focus-ring disabled:opacity-40"
      >
        <span className={cn("truncate", !current && "text-muted/60")}>{current ?? "Select…"}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform duration-150", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-40 max-h-56 overflow-y-auto rounded-ctl border border-edge bg-panel py-1 shadow-pop"
          >
            {options.map((o) => (
              <button
                key={o}
                onClick={() => {
                  setCurrent(o);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-1.5 text-13 text-ink transition-colors hover:bg-accent/12"
              >
                {o}
                {current === o && <Check className="h-3.5 w-3.5 text-accent" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------------- stepper ---------------------------------- */

export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 32,
  label,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
}) {
  const btn =
    "flex h-7 w-7 items-center justify-center rounded-full text-muted transition-all hover:bg-accent/12 hover:text-ink active:scale-90 disabled:pointer-events-none disabled:opacity-30 focus-ring";
  return (
    <div className={cn("w-full", className)}>
      {label && <div className="label-caps mb-1.5">{label}</div>}
      <div className="flex h-9 items-center justify-between rounded-ctl border border-edge bg-panel px-1.5">
        <button type="button" className={btn} disabled={value <= min} onClick={() => onChange(value - 1)}>
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="text-13 font-semibold text-ink">{value}</span>
        <button type="button" className={btn} disabled={value >= max} onClick={() => onChange(value + 1)}>
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------- switch ---------------------------------- */

export function Switch({
  on,
  onToggle,
  label,
  className,
}: {
  on: boolean;
  onToggle: (v: boolean) => void;
  label?: string;
  className?: string;
}) {
  const [v, set] = useLocal(on, onToggle);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={v}
      onClick={() => set(!v)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-200 focus-ring",
        v ? "border-accent bg-accent shadow-glow" : "border-edge bg-raised",
        className,
      )}
    >
      <motion.span
        animate={{ x: v ? 18 : 0 }}
        transition={{ type: "spring", stiffness: 600, damping: 32 }}
        className={cn(
          "absolute left-0.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full",
          v ? "bg-on-accent" : "bg-muted",
        )}
      />
      {label && <span className="sr-only">{label}</span>}
    </button>
  );
}

/* --------------------------------- checkbox --------------------------------- */

export function Checkbox({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  className?: string;
}) {
  const [v, set] = useLocal(checked, onChange);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={v}
      onClick={() => set(!v)}
      className={cn("group flex items-center gap-2 text-left focus-ring", className)}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-all duration-150",
          v ? "border-accent bg-accent" : "border-edge bg-panel group-hover:border-accent/50",
        )}
      >
        <motion.span initial={false} animate={{ scale: v ? 1 : 0 }} transition={{ duration: 0.12 }}>
          <Check className="h-3 w-3 text-on-accent" strokeWidth={3} />
        </motion.span>
      </span>
      {label && <span className="text-13 text-ink">{label}</span>}
    </button>
  );
}

export function Radio({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onChange}
      className="group flex items-center gap-2 text-left focus-ring"
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-150",
          checked ? "border-accent" : "border-edge group-hover:border-accent/50",
        )}
      >
        <motion.span
          initial={false}
          animate={{ scale: checked ? 1 : 0 }}
          transition={{ duration: 0.12 }}
          className="h-2 w-2 rounded-full bg-accent"
        />
      </span>
      {label && <span className="text-13 text-ink">{label}</span>}
    </button>
  );
}

/* -------------------------------- segmented --------------------------------- */

export function Segmented<T extends string>({
  options,
  value: initial,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  const id = useId();
  const [value, set] = useLocal(initial, onChange);
  return (
    <div className={cn("inline-flex rounded-full border border-edge bg-panel p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => set(o.value)}
          className={cn(
            "relative rounded-full px-3 py-1 text-12 font-medium transition-colors duration-150 focus-ring",
            value === o.value ? "text-on-accent" : "text-muted hover:text-ink",
          )}
        >
          {value === o.value && (
            <motion.span
              layoutId={id}
              transition={{ type: "spring", stiffness: 520, damping: 36 }}
              className="absolute inset-0 rounded-full bg-linear-135 from-accent to-accent-2 shadow-glow"
            />
          )}
          <span className="relative z-10 whitespace-nowrap">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ----------------------------------- tabs ----------------------------------- */

export function Tabs({
  tabs,
  value: initial,
  onChange,
  className,
}: {
  tabs: string[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const id = useId();
  const [value, set] = useLocal(initial, onChange);
  return (
    <div className={cn("flex items-center gap-1 border-b border-edge", className)}>
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => set(t)}
          className={cn(
            "relative px-3 py-2 text-13 font-medium transition-colors duration-150 focus-ring",
            value === t ? "text-ink" : "text-muted hover:text-ink",
          )}
        >
          {t}
          {value === t && (
            <motion.span
              layoutId={id}
              transition={{ type: "spring", stiffness: 520, damping: 36 }}
              className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-linear-90 from-accent to-accent-2"
            />
          )}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- progress --------------------------------- */

export function ProgressBar({
  value,
  running,
  height = "h-1.5",
  className,
}: {
  value: number;
  running?: boolean;
  height?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-full bg-raised", height, className)}>
      <motion.div
        className="h-full rounded-full bg-linear-90 from-accent to-accent-2"
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
      {running && (
        <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(100deg,transparent_35%,rgb(255_255_255/0.3)_50%,transparent_65%)] bg-[length:220%_100%]" />
      )}
    </div>
  );
}

export function RingProgress({
  value,
  size = 56,
  stroke = 5,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("relative inline-flex", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={`rg-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-raised)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#rg-${id})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeDasharray={c}
          animate={{ strokeDashoffset: c * (1 - Math.min(100, Math.max(0, value)) / 100) }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-12 font-bold text-ink">{Math.round(value)}</span>
      </div>
    </div>
  );
}

/* --------------------------------- count up --------------------------------- */

export function CountUp({
  to,
  decimals = 0,
  suffix = "",
  className,
}: {
  to: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const ctrl = animate(0, to, { duration: 0.9, ease: "easeOut", onUpdate: (x) => setV(x) });
    return () => ctrl.stop();
  }, [to]);
  return (
    <span className={className}>
      {v.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ------------------------------- badge & chip -------------------------------- */

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-11 font-medium",
  {
    variants: {
      tone: {
        accent: "border-accent/40 bg-accent/12 text-accent",
        muted: "border-edge bg-raised text-muted",
        success: "border-success/40 bg-success/12 text-success",
        warning: "border-warning/40 bg-warning/12 text-warning",
        error: "border-error/40 bg-error/12 text-error",
      },
    },
    defaultVariants: { tone: "muted" },
  },
);

export function Badge({
  tone,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export function Chip({
  active,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-11 font-medium transition-all duration-150 focus-ring",
        active
          ? "border-accent bg-accent/15 text-accent"
          : "border-edge bg-panel text-muted hover:border-accent/40 hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------------------------------- slider ---------------------------------- */

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  const [v, set] = useLocal(value, onChange);
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={v}
      onChange={(e) => set(Number(e.target.value))}
      className={cn("h-1.5 w-full cursor-pointer accent-accent", className)}
    />
  );
}

/* ------------------------------- context menu ------------------------------- */

export type MenuItem = {
  label?: string;
  icon?: ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  onSelect?: () => void;
};

export function useContextMenu(items: MenuItem[]) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const close = () => setPos(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", close);
    };
  }, []);
  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPos({ x: e.clientX, y: e.clientY });
  };
  const element = (
    <AnimatePresence>
      {pos && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.13, ease: "easeOut" }}
          className="fixed z-[60] min-w-56 overflow-hidden rounded-ctl border border-edge bg-panel py-1 shadow-pop"
          style={{ left: Math.min(pos.x, window.innerWidth - 240), top: Math.min(pos.y, window.innerHeight - 380) }}
          onMouseLeave={() => setPos(null)}
        >
          {items.map((it, i) =>
            it.divider ? (
              <div key={i} className="mx-2 my-1 border-t border-edge/70" />
            ) : (
              <button
                key={i}
                disabled={it.disabled}
                onClick={() => {
                  setPos(null);
                  it.onSelect?.();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-13 transition-colors",
                  it.danger ? "text-error hover:bg-error/12" : "text-ink hover:bg-accent/12",
                  it.disabled && "pointer-events-none opacity-35",
                )}
              >
                <span className="text-muted [&_svg]:h-4 [&_svg]:w-4">{it.icon}</span>
                <span className="flex-1">{it.label}</span>
                {it.shortcut && <span className="text-11 text-muted">{it.shortcut}</span>}
              </button>
            ),
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
  return { onContextMenu, close: () => setPos(null), element };
}

/* ---------------------------------- toast ----------------------------------- */

export function ToastCard({
  title,
  message,
  icon,
  onClose,
  onOpenFolder,
  className,
}: {
  title: string;
  message: string;
  icon?: ReactNode;
  onClose?: () => void;
  onOpenFolder?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("relative w-80 overflow-hidden rounded-card border border-edge bg-panel p-3.5 shadow-pop", className)}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">{icon}</div>}
        <div className="min-w-0 flex-1">
          <div className="text-13 font-semibold text-ink">{title}</div>
          <div className="mt-0.5 truncate text-12 text-muted">{message}</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted transition-colors hover:text-ink focus-ring">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="primary" className="flex-1" onClick={onOpenFolder}>Open folder</Button>
        <Button size="sm" variant="ghost" className="flex-1" onClick={onClose}>Dismiss</Button>
      </div>
      <ProgressBar value={100} height="h-0.5" className="mt-3" />
    </motion.div>
  );
}

/* --------------------------------- section ---------------------------------- */

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-9 items-center justify-between gap-6", className)}>
      <span className="text-13 text-ink">{label}</span>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}
