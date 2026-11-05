import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { WindowFrame } from "../WindowFrame";
import { Button, Checkbox } from "../ui";
import { useWindowClose, type ToastInput } from "../context";

/** Standard dialog footer bar. */
export function Footer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center gap-2 border-t border-edge bg-panel/60 px-4 py-3", className)}>
      {children}
    </div>
  );
}

/** Small round icon badge used at the top of confirm / status dialogs. */
export function DialogIcon({
  tone = "accent",
  children,
  className,
}: {
  tone?: "accent" | "success" | "warning" | "error";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    accent: "bg-accent/15 text-accent",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    error: "bg-error/15 text-error",
  } as const;
  return (
    <motion.span
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 340, damping: 20 }}
      className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full [&_svg]:h-6 [&_svg]:w-6", tones[tone], className)}
    >
      {children}
    </motion.span>
  );
}

/** Generic confirmation window (delete, remove, redownload, cancel setup…). */
export function ConfirmDialog({
  title,
  heading,
  message,
  icon,
  tone = "warning",
  confirmLabel,
  danger,
  option,
  detail,
  onConfirm,
  doneToast,
}: {
  title: string;
  heading: string;
  message: ReactNode;
  icon?: ReactNode;
  tone?: "accent" | "success" | "warning" | "error";
  confirmLabel: string;
  danger?: boolean;
  option?: string;
  detail?: ReactNode;
  onConfirm?: (optionChecked: boolean) => void;
  doneToast?: ToastInput | string;
}) {
  const close = useWindowClose();
  const [opt, setOpt] = useState(false);
  return (
    <WindowFrame width={460} height={detail ? 330 : 268} title={title}>
      <div className="flex min-h-0 flex-1 gap-4 p-5">
        <DialogIcon tone={tone}>{icon ?? <TriangleAlert />}</DialogIcon>
        <div className="min-w-0 flex-1">
          <div className="text-18 font-bold tracking-tight text-ink">{heading}</div>
          <div className="mt-1 text-13 text-muted">{message}</div>
          {detail && <div className="mt-3">{detail}</div>}
          {option && <Checkbox checked={opt} onChange={setOpt} label={option} className="mt-3" />}
        </div>
      </div>
      <Footer>
        <Button variant="ghost" className="ml-auto" onClick={() => close()}>
          Cancel
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          onClick={() => {
            onConfirm?.(opt);
            close(doneToast);
          }}
        >
          {confirmLabel}
        </Button>
      </Footer>
    </WindowFrame>
  );
}

/** A labelled key/value row used in detail views. */
export function KV({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-12">
      <span className="shrink-0 text-muted">{k}</span>
      <span className={cn("truncate text-ink", mono && "font-mono text-11")}>{v}</span>
    </div>
  );
}
