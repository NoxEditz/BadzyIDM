import { useCallback, useEffect, useState } from "react";
import { useNative } from "./context";

/** Settings of the engine (same field names as crates/engine config.rs), live from the app. */
export type EngineSettings = {
  download_dir: string;
  category_dirs: Record<string, string>;
  connections: number;
  max_active: number;
  retries: number;
  speed_limit_kb: number;
  speed_limit_on: boolean;
  torrent_upload_kb: number;
  autostart: boolean;
  version: string;
  [k: string]: unknown;
};

type Bag = Record<string, unknown>;
const bag = () => ((window as unknown as { __badzy?: Bag }).__badzy ??= {});

export function useSettings() {
  const nat = useNative();
  const [s, setS] = useState<EngineSettings | null>(null);
  useEffect(() => {
    if (!nat.native) return;
    const b = bag();
    b["settings"] = (v: EngineSettings) => setS(v);
    nat.send("getSettings");
    return () => {
      delete b["settings"];
    };
  }, [nat]);
  /** change fields: shown at once, saved by the app */
  const set = useCallback(
    (patch: Partial<EngineSettings>) => {
      setS((cur) => (cur ? { ...cur, ...patch } : cur));
      nat.send("settings", patch);
    },
    [nat],
  );
  const setAutostart = useCallback(
    (on: boolean) => {
      setS((cur) => (cur ? { ...cur, autostart: on } : cur));
      nat.send("autostart", { on });
    },
    [nat],
  );
  return { s, set, setAutostart, native: nat.native };
}
