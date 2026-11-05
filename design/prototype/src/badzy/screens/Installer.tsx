import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, CheckCircle2, HardDrive, MonitorCog, Rocket } from "lucide-react";
import { WindowFrame, Wordmark } from "../WindowFrame";
import { MarbleArt } from "../MarbleArt";
import { Button, Checkbox, RingProgress, TextField } from "../ui";
import { cn } from "@/lib/utils";

const steps = ["Welcome", "Options", "Install", "Done"] as const;
type Step = (typeof steps)[number];

export default function Installer() {
  const [step, setStep] = useState<Step>("Welcome");
  const [progress, setProgress] = useState(0);
  const [launch, setLaunch] = useState(true);

  useEffect(() => {
    if (step !== "Install") return;
    setProgress(0);
    const t = setInterval(() => {
      setProgress((p) => {
        const n = p + 2 + Math.random() * 4;
        if (n >= 100) {
          clearInterval(t);
          setTimeout(() => setStep("Done"), 400);
          return 100;
        }
        return n;
      });
    }, 120);
    return () => clearInterval(t);
  }, [step]);

  return (
    <WindowFrame width={820} height={500} title="Badzy setup">
      <div className="flex min-h-0 flex-1">
        {/* brand column */}
        <div className="relative hidden w-64 shrink-0 sm:block">
          <MarbleArt className="absolute inset-0" veil={0.55} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <motion.img
              src="/favicon.png"
              alt=""
              className="h-20 w-20 animate-pulse-glow"
              draggable={false}
            />
            <Wordmark className="text-26" />
            <div className="text-12 text-muted">Better. Faster. Yours.</div>
            <div className="mt-2 text-11 text-muted">Setup 3.2.0 · 24 MB</div>
          </div>
        </div>
        {/* content column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* step indicator */}
          <div className="flex items-center gap-2 border-b border-edge/70 px-5 py-3">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border text-11 font-semibold transition-colors",
                    steps.indexOf(step) > i
                      ? "border-accent bg-accent text-on-accent"
                      : steps.indexOf(step) === i
                        ? "border-accent text-accent"
                        : "border-edge text-muted",
                  )}
                >
                  {steps.indexOf(step) > i ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className={cn("text-12 font-medium", steps.indexOf(step) === i ? "text-ink" : "text-muted")}>{s}</span>
                {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-edge" />}
              </div>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {step === "Welcome" && (
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
                <h1 className="text-26 font-bold tracking-tight text-ink">Welcome to Badzy</h1>
                <p className="mt-2 max-w-md text-13 text-muted">
                  The download manager with a native feel — multi-connection speed, queues, scheduler, torrents and playlists in one dark, fast app.
                </p>
                <div className="mt-5 max-w-md">
                  <TextField label="Install location" value={"C:\\Program Files\\Badzy"} readOnly />
                </div>
                <Checkbox checked onChange={() => {}} label="I accept the license agreement" className="mt-4" />
              </motion.div>
            )}
            {step === "Options" && (
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
                <h1 className="text-26 font-bold tracking-tight text-ink">Setup options</h1>
                <div className="mt-4 flex max-w-md flex-col gap-3">
                  <Checkbox checked onChange={() => {}} label="Desktop shortcut" />
                  <Checkbox checked onChange={() => {}} label="Add “Download with Badzy” to the right-click menu" />
                  <Checkbox checked onChange={() => {}} label="Start Badzy when Windows starts (minimized to tray)" />
                  <Checkbox checked={false} onChange={() => {}} label="Open the browser extension install page" />
                  <div className="flex items-center gap-2 rounded-card border border-edge bg-raised p-3 text-12 text-muted">
                    <HardDrive className="h-4 w-4 text-accent" /> 214 MB required · 1.2 TB free on C:\
                  </div>
                </div>
              </motion.div>
            )}
            {step === "Install" && (
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="flex flex-col items-center justify-center py-6">
                <RingProgress value={progress} size={120} stroke={9} />
                <div className="mt-4 text-14 font-semibold text-ink">Installing Badzy…</div>
                <div className="mt-1 text-12 text-muted">{Math.round(progress)}% · extracting core engine</div>
              </motion.div>
            )}
            {step === "Done" && (
              <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className="flex flex-col items-center py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
                  <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} />
                </div>
                <h1 className="mt-4 text-26 font-bold tracking-tight text-ink">Badzy is installed</h1>
                <p className="mt-1 max-w-sm text-13 text-muted">Ready in 0:14. The tray icon and first-run tour are waiting for you.</p>
                <Checkbox checked={launch} onChange={setLaunch} label="Launch Badzy now" className="mt-4" />
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-edge bg-panel/60 px-5 py-3">
            <Button variant="ghost" onClick={() => setStep(step === "Done" ? "Options" : step === "Install" ? "Options" : step === "Options" ? "Welcome" : "Welcome")}>
              {step === "Welcome" ? "Cancel" : "Back"}
            </Button>
            <div className="ml-auto flex gap-2">
              {step === "Welcome" && <Button variant="primary" onClick={() => setStep("Options")}>Next</Button>}
              {step === "Options" && <Button variant="primary" onClick={() => setStep("Install")}><Rocket className="h-4 w-4" /> Install</Button>}
              {step === "Install" && <Button variant="secondary" disabled>Installing…</Button>}
              {step === "Done" && <Button variant="primary" onClick={() => setStep("Welcome")}><MonitorCog className="h-4 w-4" /> Finish</Button>}
            </div>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}
