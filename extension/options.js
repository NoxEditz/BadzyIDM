const MENU_DEFAULTS = { link: true, media: true, video: true, all: true, selected: true, playlist: true };
const MENU_LABELS = { link: "mLink", media: "mMedia", video: "mVideo", all: "mAll", selected: "mSelected", playlist: "mPlaylist" };
const DEFAULTS = {
  port: 9614, intercept: true, minSizeKB: 0, bubbleSize: "normal", bubbleScale: null, bubbleStyle: "blue",
  blockedSites: [], extraExts: [], badge: true, menus: MENU_DEFAULTS, lang: null, enabled: true,
};
// what "Export settings" saves (the on / off switch is not a preference)
const EXPORTED = ["port", "intercept", "minSizeKB", "bubbleScale", "bubbleStyle", "blockedSites", "extraExts", "badge", "menus", "lang"];
const OLD_SIZES = { small: 85, normal: 100, large: 125 };
const t = (key, vars) => BadzyI18n.t(key, vars);
const $ = (id) => document.getElementById(id);
let saveTimer;

function saved(message, error = false) {
  const el = $("saved");
  el.textContent = message == null ? t("saved") : message;
  el.classList.toggle("error", error);
  clearTimeout(saveTimer);
  if (!error) saveTimer = setTimeout(() => { el.textContent = ""; }, 1800);
}

/** "iso, .APK;torrent" -> ["iso", "apk", "torrent"] */
function parseExts(text) {
  const out = [];
  for (const part of String(text).split(/[\s,;]+/)) {
    const e = part.replace(/^[*.]+/, "").toLowerCase();
    if (/^[a-z0-9_+-]{1,12}$/.test(e) && !out.includes(e)) out.push(e);
  }
  return out;
}

/** One site per line: "https://www.Example.com/page" -> "example.com" */
function parseSites(text) {
  const out = [];
  for (const line of String(text).split(/[\n,;]+/)) {
    const h = line.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").split(/[/?#]/)[0].replace(/^www\./, "");
    if (/^[a-z0-9*]([a-z0-9*.-]*[a-z0-9*])?$/.test(h) && !out.includes(h)) out.push(h);
  }
  return out;
}

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (result) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(result);
    });
  });
}

async function load() {
  const opts = Object.assign({}, DEFAULTS, await chrome.storage.local.get(DEFAULTS));
  opts.menus = Object.assign({}, MENU_DEFAULTS, opts.menus);
  return opts;
}

function fill(opts) {
  $("intercept").checked = opts.intercept !== false;
  $("minSize").value = Math.max(0, Number(opts.minSizeKB) || 0);
  $("extraExts").value = (opts.extraExts || []).join(", ");
  $("badge").checked = opts.badge !== false;
  $("blocked").value = (opts.blockedSites || []).join("\n");
  $("port").value = Number(opts.port) || DEFAULTS.port;
  const pct = opts.bubbleScale != null ? Math.round(Number(opts.bubbleScale) * 100) : OLD_SIZES[opts.bubbleSize] || 100;
  $("bubbleScale").value = String(Math.min(200, Math.max(50, pct)));
  $("bubbleScaleText").textContent = `${$("bubbleScale").value}%`;
  $("look").value = opts.bubbleStyle || "blue";
  $("lang").value = BadzyI18n.lang;
  for (const key of Object.keys(MENU_DEFAULTS)) {
    const box = document.querySelector(`#menuList input[data-menu="${key}"]`);
    if (box) box.checked = opts.menus[key] !== false;
  }
}

function buildMenuList() {
  const list = $("menuList");
  list.replaceChildren();
  for (const key of Object.keys(MENU_DEFAULTS)) {
    const row = document.createElement("div");
    row.className = "setting";
    const copy = document.createElement("div");
    copy.className = "setting-copy";
    const label = document.createElement("label");
    label.htmlFor = `menu-${key}`;
    label.dataset.i18n = MENU_LABELS[key];
    copy.append(label);
    const sw = document.createElement("label");
    sw.className = "switch";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = `menu-${key}`;
    input.dataset.menu = key;
    const knob = document.createElement("span");
    knob.className = "knob";
    sw.append(input, knob);
    row.append(copy, sw);
    list.append(row);
  }
  BadzyI18n.apply();
}

async function init() {
  await BadzyI18n.init();
  buildMenuList();
  let opts = await load();
  fill(opts);

  $("lang").addEventListener("change", async () => {
    await BadzyI18n.set($("lang").value);
    checkConnection();
    saved();
  });
  $("intercept").addEventListener("change", async () => {
    await chrome.storage.local.set({ intercept: $("intercept").checked });
    saved();
  });
  $("badge").addEventListener("change", async () => {
    await chrome.storage.local.set({ badge: $("badge").checked });
    saved();
  });
  $("minSize").addEventListener("change", async () => {
    const value = Number($("minSize").value);
    if (!Number.isFinite(value) || value < 0 || value > 104857600) {
      saved(t("badSize"), true);
      $("minSize").value = Math.max(0, Number((await load()).minSizeKB) || 0);
      return;
    }
    await chrome.storage.local.set({ minSizeKB: Math.floor(value) });
    saved();
  });
  $("extraExts").addEventListener("change", async () => {
    const list = parseExts($("extraExts").value);
    $("extraExts").value = list.join(", ");
    await chrome.storage.local.set({ extraExts: list });
    saved();
  });
  $("blocked").addEventListener("change", async () => {
    const list = parseSites($("blocked").value);
    $("blocked").value = list.join("\n");
    await chrome.storage.local.set({ blockedSites: list });
    saved();
  });
  $("menuList").addEventListener("change", async (event) => {
    const box = event.target.closest("input[data-menu]");
    if (!box) return;
    const menus = Object.assign({}, MENU_DEFAULTS, (await load()).menus, { [box.dataset.menu]: box.checked });
    await chrome.storage.local.set({ menus });
    saved();
  });
  $("port").addEventListener("change", async () => {
    const value = Number($("port").value);
    if (!Number.isInteger(value) || value < 1024 || value > 65535) {
      saved(t("badPort"), true);
      $("port").value = Number((await load()).port) || DEFAULTS.port;
      return;
    }
    await chrome.storage.local.set({ port: value });
    saved(t("portSaved"));
    checkConnection();
  });
  $("bubbleScale").addEventListener("input", () => {
    $("bubbleScaleText").textContent = `${$("bubbleScale").value}%`;
    chrome.storage.local.set({ bubbleScale: Number($("bubbleScale").value) / 100 });
  });
  $("bubbleScale").addEventListener("change", () => saved());
  $("look").addEventListener("change", async () => {
    await chrome.storage.local.set({ bubbleStyle: $("look").value });
    saved();
  });

  $("test").addEventListener("click", async () => {
    const out = $("testResult");
    out.className = "test-result";
    out.textContent = t("testing");
    try {
      const r = await sendMessage({ type: "swiftget-info" });
      out.className = `test-result ${r && r.ok ? "ok" : "bad"}`;
      out.textContent = r && r.ok ? t("testOk", { v: r.version || "" }) : t("testFail");
    } catch {
      out.className = "test-result bad";
      out.textContent = t("testFail");
    }
  });

  $("keysButton").addEventListener("click", async () => {
    const isFirefox = typeof browser !== "undefined" && /firefox/i.test(navigator.userAgent);
    try {
      await chrome.tabs.create({ url: isFirefox ? "about:addons" : "chrome://extensions/shortcuts" });
    } catch {
      saved(t("keysManual"), true);
    }
  });

  // backup
  $("export").addEventListener("click", async () => {
    const now = await load();
    const data = { badzy: "extension-settings", version: 1 };
    for (const k of EXPORTED) data[k] = now[k];
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "badzy-extension-settings.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });
  $("import").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", async () => {
    const file = $("importFile").files[0];
    $("importFile").value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || data.badzy !== "extension-settings") throw new Error("not ours");
      const next = {};
      if (Number.isInteger(data.port) && data.port >= 1024 && data.port <= 65535) next.port = data.port;
      if (typeof data.intercept === "boolean") next.intercept = data.intercept;
      if (Number.isFinite(data.minSizeKB) && data.minSizeKB >= 0 && data.minSizeKB <= 104857600) next.minSizeKB = Math.floor(data.minSizeKB);
      if (Number.isFinite(data.bubbleScale) && data.bubbleScale >= 0.5 && data.bubbleScale <= 2) next.bubbleScale = data.bubbleScale;
      if (["blue", "dark", "light", "green", "icon"].includes(data.bubbleStyle)) next.bubbleStyle = data.bubbleStyle;
      if (Array.isArray(data.blockedSites)) next.blockedSites = parseSites(data.blockedSites.join("\n"));
      if (Array.isArray(data.extraExts)) next.extraExts = parseExts(data.extraExts.join(","));
      if (typeof data.badge === "boolean") next.badge = data.badge;
      if (data.menus && typeof data.menus === "object") {
        next.menus = Object.assign({}, MENU_DEFAULTS);
        for (const k of Object.keys(MENU_DEFAULTS)) if (typeof data.menus[k] === "boolean") next.menus[k] = data.menus[k];
      }
      if (data.lang === "ar" || data.lang === "en") next.lang = data.lang;
      await chrome.storage.local.set(next);
      if (next.lang) await BadzyI18n.set(next.lang);
      fill(await load());
      saved(t("imported"));
    } catch {
      saved(t("importBad"), true);
    }
  });
  $("reset").addEventListener("click", async () => {
    if (!confirm(t("resetAsk"))) return;
    await chrome.storage.local.remove(EXPORTED.filter((k) => k !== "lang"));
    fill(await load());
    saved(t("resetDone"));
  });

  checkConnection();
}

async function checkConnection() {
  const status = $("status");
  const text = $("statusText");
  status.classList.remove("on");
  text.textContent = t("checking");
  try {
    const response = await sendMessage({ type: "swiftget-status" });
    const online = !!(response && response.ok);
    status.classList.toggle("on", online);
    text.textContent = t(online ? "connected" : "appOff");
  } catch {
    status.classList.remove("on");
    text.textContent = t("unavailable");
  }
}

init().catch((error) => saved(error.message || "Could not load settings.", true));
