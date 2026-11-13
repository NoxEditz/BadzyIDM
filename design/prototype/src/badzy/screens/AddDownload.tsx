import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownToLine, FolderSearch, Link2, Lock, TriangleAlert, User } from "lucide-react";
import { WindowFrame } from "../WindowFrame";
import { FileTypeTile } from "../icons";
import { Button, Checkbox, Dropdown, Field, NumberStepper, Segmented, Switch, TextField } from "../ui";
import type { FileKind } from "../icons";
import { useApp, useWindowClose } from "../context";
import { FolderPicker } from "../dialogs/files";
import { ProgressWindow } from "./Dialogs";

const strings = {
  en: {
    url: "URL", check: "Check", statusOk: "OK — Interstellar.2014.1080p.BluRay.x264.mkv",
    statusHint: "Enter a URL and press Check to inspect the file.",
    warn: "The server may require authorization. Badzy will try anonymously first.",
    fileCard: "2.18 GB · MKV · resumable", category: "Category", saveAs: "Save As", browse: "Browse",
    remember: "Remember this path", desc: "Description", connections: "Connections (1–32)",
    queue: "Queue", auth: "Authorization required", login: "Login", password: "Password",
    cancel: "Cancel", later: "Download Later", start: "Start Download", browser: "Download with the browser",
    added: "Added to queue", dir: "ltr",
  },
  ar: {
    url: "عنوان الرابط", check: "تحقق", statusOk: "تم — Interstellar.2014.1080p.BluRay.x264.mkv",
    statusHint: "أدخل الرابط واضغط «تحقق» لفحص الملف.",
    warn: "قد يتطلب الخادم تفويضًا. سيحاول Badzy مجهولًا أولًا.",
    fileCard: "2.18 جيجابايت · MKV · قابل للاستكمال", category: "الفئة", saveAs: "حفظ باسم", browse: "استعراض",
    remember: "تذكّر هذا المسار", desc: "الوصف", connections: "الاتصالات (1–32)",
    queue: "قائمة الانتظار", auth: "يتطلب تفويضًا", login: "اسم المستخدم", password: "كلمة المرور",
    cancel: "إلغاء", later: "التحميل لاحقًا", start: "ابدأ التحميل", browser: "التحميل بالمتصفح",
    added: "أُضيف إلى قائمة الانتظار", dir: "rtl",
  },
};

export default function AddDownload({ initialLang = "en" }: { initialLang?: "en" | "ar" }) {
  const [lang, setLang] = useState<"en" | "ar">(initialLang);
  return (
    <div dir={strings[lang].dir} className="flex flex-col items-center gap-3">
      <Segmented
        options={[
          { value: "en", label: "English" },
          { value: "ar", label: "العربية" },
        ]}
        value={lang}
        onChange={setLang}
      />
      <AddDownloadWindow lang={lang} />
    </div>
  );
}

const toasts = {
  en: { later: "Added to Main queue", laterMsg: "Starts when the queue runs.", browser: "Handed back to the browser", cancel: "Download cancelled", folder: "Folder selected" },
  ar: { later: "أُضيف إلى قائمة الانتظار", laterMsg: "يبدأ عند تشغيل الطابور.", browser: "أُعيد إلى المتصفح", cancel: "أُلغي التحميل", folder: "تم اختيار المجلد" },
};

export function AddDownloadWindow({ lang = "en", initialUrl }: { lang?: "en" | "ar"; initialUrl?: string }) {
  const close = useWindowClose();
  const { open } = useApp();
  const [url, setUrl] = useState(initialUrl ?? "https://cdn.example.com/interstellar-1080p.mkv");
  const [checked, setChecked] = useState(true);
  const [checking, setChecking] = useState(false);
  const [category, setCategory] = useState("Video");
  const [saveAs, setSaveAs] = useState("D:\\Movies\\Interstellar.2014.1080p.mkv");
  const [remember, setRemember] = useState(true);
  const [desc, setDesc] = useState("Sci-fi classic, 1080p BluRay remux.");
  const [conn, setConn] = useState(8);
  const [queue, setQueue] = useState("Main queue");
  const [auth, setAuth] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const t = strings[lang];
  const tt = toasts[lang];
  const fileName = saveAs.split("\\").pop() ?? saveAs;

  return (
    <div dir={t.dir}>
      <WindowFrame width={700} height={560} title={lang === "en" ? "Add download" : "إضافة تحميل"}>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          {/* URL + check */}
          <div className="flex items-end gap-2">
            <TextField
              className="flex-1"
              label={t.url}
              icon={<Link2 className="h-3.5 w-3.5" />}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
            <Button
              variant="secondary"
              disabled={checking}
              onClick={() => {
                setChecked(false);
                setChecking(true);
                setTimeout(() => {
                  setChecking(false);
                  setChecked(true);
                }, 1100);
              }}
            >
              {checking ? "…" : t.check}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-12">
            {checking ? (
              <span className="flex items-center gap-1.5 text-accent">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> {lang === "en" ? "Checking the server…" : "جارٍ فحص الخادم…"}
              </span>
            ) : checked ? (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> {t.statusOk}
              </motion.span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-muted/50" /> {t.statusHint}
              </span>
            )}
          </div>
          {/* warning banner */}
          <div className="flex items-start gap-2.5 rounded-ctl border border-warning/30 bg-warning/10 p-2.5 text-12 text-warning">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {t.warn}
          </div>
          {/* file card */}
          <div className="flex items-center gap-3 rounded-card border border-edge bg-raised p-2.5">
            <FileTypeTile kind={"video" as FileKind} size={44} iconSize={20} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-13 font-semibold text-ink">Interstellar.2014.1080p.BluRay.x264.mkv</div>
              <div className="text-11 text-muted">{t.fileCard}</div>
            </div>
          </div>
          {/* grid */}
          <div className="grid grid-cols-2 gap-3">
            <Dropdown label={t.category} value={category} onChange={setCategory} options={["Video", "Programs", "Music", "Documents", "Compressed", "Images"]} />
            <NumberStepper label={t.connections} value={conn} onChange={setConn} min={1} max={32} />
          </div>
          <div className="flex items-end gap-2">
            <TextField className="flex-1" label={t.saveAs} value={saveAs} onChange={(e) => setSaveAs(e.target.value)} />
            <Button
              variant="secondary"
              onClick={() =>
                open(
                  <FolderPicker
                    initial={saveAs.slice(0, saveAs.lastIndexOf("\\")) || "D:\\Movies"}
                    onPick={(p) => setSaveAs(`${p}\\${fileName}`)}
                  />,
                )
              }
            >
              <FolderSearch className="h-3.5 w-3.5" /> {t.browse}
            </Button>
          </div>
          <Checkbox checked={remember} onChange={setRemember} label={t.remember} />
          <TextField label={t.desc} value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div className="grid grid-cols-2 items-end gap-3">
            <Dropdown label={t.queue} value={queue} onChange={setQueue} options={["Main queue", "Night queue", "Work queue", "No queue"]} />
            <Field label={t.auth}>
              <Switch on={auth} onToggle={setAuth} />
            </Field>
          </div>
          {auth && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="grid grid-cols-2 gap-3 overflow-hidden rounded-ctl border border-edge bg-raised/50 p-3"
            >
              <TextField label={t.login} icon={<User className="h-3.5 w-3.5" />} value={login} onChange={(e) => setLogin(e.target.value)} placeholder="user@mail.com" />
              <TextField label={t.password} icon={<Lock className="h-3.5 w-3.5" />} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </motion.div>
          )}
        </div>
        {/* footer */}
        <div className="flex shrink-0 items-center gap-2 border-t border-edge bg-panel/60 px-4 py-3">
          <Button variant="ghost" onClick={() => close()}>{t.cancel}</Button>
          <div className="ms-auto flex items-center gap-2">
            <Button variant="secondary" onClick={() => close({ title: tt.later, message: `${fileName} · ${queue}`, tone: "muted" })}>{t.later}</Button>
            <Button variant="secondary" onClick={() => close({ title: tt.browser, message: fileName, tone: "muted" })}>{t.browser}</Button>
            <Button
              variant="primary"
              onClick={() => {
                close();
                open(<ProgressWindow name={fileName} />);
              }}
            >
              <motion.span
                className="flex items-center gap-2"
                initial={{ scale: 0.9 }}
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
              >
                <ArrowDownToLine className="h-4 w-4" /> {t.start}
              </motion.span>
            </Button>
          </div>
        </div>
      </WindowFrame>
    </div>
  );
}
