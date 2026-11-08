import { useEffect, useState } from "react";
import { ExternalLink, FolderOpen, Pause, Play, X } from "lucide-react";
import { WindowFrame } from "../WindowFrame";
import { RingProgress } from "../ui";
import { Button } from "../ui";
import { useNative, useWindowClose } from "../context";
import type { DownloadRow } from "../data";

/** Real progress window of one download (its own app window, like the "Download File Info" popup). */
export default function NativeProgress({ id }: { id: number }) {
  const nat = useNative();
  const close = useWindowClose();
  const [row, setRow] = useState<DownloadRow | null>(null);
  useEffect(() => {
    const b = ((window as unknown as { __badzy?: Record<string, unknown> }).__badzy ??= {});
    b["rows"] = (list: DownloadRow[]) => setRow(list.find((r) => r.id === id) ?? null);
    return () => {
      delete b["rows"];
    };
  }, [id]);
  const done = row?.status === "finished";
  const failed = row?.status === "failed";
  const paused = row?.status === "paused" || row?.status === "queued";
  const title = !row ? "Download" : done ? "Finished" : failed ? "Failed" : paused ? "Paused" : "Downloading";
  return (
    <WindowFrame width={460} height={520} title={`${title}${row ? ` — ${row.name}` : ""}`}>
      <div className="flex min-h-0 flex-1 flex-col items-center gap-4 overflow-y-auto p-5">
        <RingProgress value={row?.progress ?? 0} size={120} stroke={9} className={paused ? "opacity-50" : ""} />
        <div className="w-full truncate text-center text-14 font-semibold text-ink">{row?.name ?? "…"}</div>
        <div className="grid w-full grid-cols-2 gap-2">
          <div className="rounded-ctl border border-edge bg-raised p-2 text-center">
            <div className="label-caps">Speed</div>
            <div className="text-14 font-bold text-accent">{done ? "—" : (row?.speed ?? "—")}</div>
          </div>
          <div className="rounded-ctl border border-edge bg-raised p-2 text-center">
            <div className="label-caps">Time left</div>
            <div className="text-14 font-bold text-ink">{done ? "Done" : paused ? "Paused" : (row?.eta ?? "—")}</div>
          </div>
        </div>
        <div className="w-full text-12 text-muted">
          <div className="flex justify-between py-1"><span>Size</span><span className="text-ink">{row?.size ?? "—"}</span></div>
          <div className="flex justify-between gap-4 py-1"><span className="shrink-0">Saved to</span><span className="truncate text-ink">{row?.path ?? row?.saveTo ?? "—"}</span></div>
          <div className="flex justify-between py-1"><span>Progress</span><span className="text-ink">{(row?.progress ?? 0).toFixed(1)}%</span></div>
          {failed && row?.error && <div className="py-1 text-error">{row.error}</div>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-edge bg-panel/60 px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => close()}>{done ? "Close" : "Hide"}</Button>
        <div className="ml-auto flex gap-2">
          {done ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => nat.send("openFolder", { id })}><FolderOpen className="h-3.5 w-3.5" /> Open folder</Button>
              <Button variant="primary" size="sm" onClick={() => { nat.send("openFile", { id }); close(); }}><ExternalLink className="h-3.5 w-3.5" /> Open</Button>
            </>
          ) : (
            <>
              <Button variant="danger" size="sm" onClick={() => { nat.send("remove", { ids: [id], file: true }); close(); }}><X className="h-3.5 w-3.5" /> Cancel</Button>
              {paused || failed ? (
                <Button variant="primary" size="sm" onClick={() => nat.send("resume", { ids: [id] })}><Play className="h-3.5 w-3.5" /> Resume</Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => nat.send("pause", { ids: [id] })}><Pause className="h-3.5 w-3.5" /> Pause</Button>
              )}
            </>
          )}
        </div>
      </div>
    </WindowFrame>
  );
}
