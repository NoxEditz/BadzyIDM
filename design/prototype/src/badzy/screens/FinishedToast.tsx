import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, FolderOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui";
import { useNative, useStage } from "../context";
import type { DownloadRow } from "../data";

/** Small "download finished" notice in the corner of the screen (its own app window). */
export default function FinishedToast({ id }: { id: number }) {
  const nat = useNative();
  const { close } = useStage();
  const [row, setRow] = useState<DownloadRow | null>(null);
  useEffect(() => {
    const b = ((window as unknown as { __badzy?: Record<string, unknown> }).__badzy ??= {});
    b["rows"] = (list: DownloadRow[]) => setRow(list.find((r) => r.id === id) ?? null);
    const t = setTimeout(() => close?.(), 9000);
    return () => {
      delete b["rows"];
      clearTimeout(t);
    };
  }, [id, close]);
  return (
    <div className={cn("relative flex h-full w-full flex-col overflow-hidden border border-edge bg-window")}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-linear-90 from-accent to-accent-2" />
      <div className="flex items-start gap-3 px-4 pb-2 pt-4">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" />
        <div className="min-w-0 flex-1">
          <div className="text-12 font-semibold uppercase tracking-wide text-success">Download finished</div>
          <div className="truncate text-14 font-semibold text-ink">{row?.name ?? "…"}</div>
          <div className="text-12 text-muted">{row?.size ?? ""}</div>
        </div>
        <button onClick={() => close?.()} aria-label="Close" className="rounded-full p-1 text-muted hover:bg-raised hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-auto flex justify-end gap-2 px-4 pb-3">
        <Button variant="secondary" size="sm" onClick={() => { nat.send("openFolder", { id }); close?.(); }}>
          <FolderOpen className="h-3.5 w-3.5" /> Open folder
        </Button>
        <Button variant="primary" size="sm" onClick={() => { nat.send("openFile", { id }); close?.(); }}>
          <ExternalLink className="h-3.5 w-3.5" /> Open
        </Button>
      </div>
    </div>
  );
}
