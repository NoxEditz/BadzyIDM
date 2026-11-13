const t = (key, vars) => BadzyI18n.t(key, vars);

const fmtSize = (n) => {
  if (!n) return "";
  const u = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${u[i]}`;
};

function setHint(text, kind = "") {
  const hint = document.getElementById("quickHint");
  hint.textContent = text;
  hint.className = `hint${kind ? ` ${kind}` : ""}`;
}

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) reject(new Error(lastError.message));
      else resolve(response);
    });
  });
}

function isMagnet(value) {
  return /^magnet:\?/i.test(value) && /(?:\?|&)xt=urn:bt(?:ih|mh):/i.test(value) && !/\s/.test(value);
}

function isWebUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && !!url.hostname;
  } catch { return false; }
}

/** Hostname of a normal web page (null for chrome:// pages, the new-tab page...). */
function siteOf(url) {
  try {
    const u = new URL(url);
    return /^https?:$/.test(u.protocol) && u.hostname ? u.hostname.replace(/^www\./, "") : null;
  } catch {
    return null;
  }
}

async function init() {
  await BadzyI18n.init();
  document.getElementById("settings").addEventListener("click", () => chrome.runtime.openOptionsPage());
  try {
    document.getElementById("version").textContent = `Badzy v${chrome.runtime.getManifest().version}`;
  } catch { /* no manifest in a test page */ }
  // the language button: the other language's name
  const langButton = document.getElementById("lang");
  const showLang = () => { langButton.textContent = BadzyI18n.lang === "ar" ? "EN" : "ع"; };
  showLang();
  langButton.addEventListener("click", async () => {
    await BadzyI18n.set(BadzyI18n.lang === "ar" ? "en" : "ar");
    location.reload(); // every text of the popup in the new language
  });

  const enabled = document.getElementById("enabled");
  const onText = document.getElementById("onText");
  const onHint = document.getElementById("onHint");
  const showEnabled = (value) => {
    enabled.checked = value;
    document.body.classList.toggle("off", !value);
    onText.textContent = t(value ? "on" : "paused");
    onHint.textContent = t(value ? "onHint" : "pausedHint");
    document.getElementById("quickUrl").disabled = !value;
    document.getElementById("quickAddButton").disabled = !value;
    document.getElementById("scale").disabled = !value;
    document.getElementById("look").disabled = !value;
    document.querySelectorAll("#media button").forEach((button) => {
      button.disabled = !value || button.dataset.unavailable === "true";
    });
  };
  try {
    const opts = await chrome.storage.local.get({ enabled: true });
    showEnabled(opts.enabled !== false);
  } catch { showEnabled(true); }
  enabled.addEventListener("change", () => {
    chrome.storage.local.set({ enabled: enabled.checked });
    showEnabled(enabled.checked);
  });

  const look = document.getElementById("look");
  const initialLook = await chrome.storage.local.get({ bubbleStyle: "blue" });
  look.value = initialLook.bubbleStyle || "blue";
  look.addEventListener("change", () => chrome.storage.local.set({ bubbleStyle: look.value }));

  const scale = document.getElementById("scale");
  const scaleText = document.getElementById("scaleText");
  const OLD = { small: 85, normal: 100, large: 125 };
  const initialScale = await chrome.storage.local.get({ bubbleScale: null, bubbleSize: "normal" });
  const pct = initialScale.bubbleScale != null ? Math.round(initialScale.bubbleScale * 100) : OLD[initialScale.bubbleSize] || 100;
  scale.value = String(pct);
  scaleText.textContent = `${pct}%`;
  scale.addEventListener("input", () => {
    scaleText.textContent = `${scale.value}%`;
    chrome.storage.local.set({ bubbleScale: Number(scale.value) / 100 });
  });

  // Direct add is an explicit user action. Magnet links go through the same
  // local API as page-clicked torrents; no remote service or account is used.
  const form = document.getElementById("quickAddForm");
  const input = document.getElementById("quickUrl");
  const addButton = document.getElementById("quickAddButton");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const url = input.value.trim();
    if (!isMagnet(url) && !isWebUrl(url)) {
      setHint(t("quickBad"), "error");
      input.focus();
      return;
    }
    addButton.disabled = true;
    addButton.textContent = t("quickAdding");
    setHint(t("quickSending"));
    try {
      const result = await sendMessage({ type: "swiftget-quick-add", url });
      if (!result || !result.ok) throw new Error(result && result.error || t("quickRefused"));
      setHint(t(isMagnet(url) ? "quickSentMagnet" : "quickSent"), "success");
      input.value = "";
      document.getElementById("appCallout").classList.remove("show");
      const status = document.getElementById("status");
      status.classList.add("on");
      document.getElementById("statusText").textContent = t("connected");
    } catch (error) {
      setHint(error.message || t("quickOffline"), "error");
    } finally {
      addButton.disabled = !enabled.checked;
      addButton.textContent = t("quickAdd");
    }
  });

  try {
    const res = await sendMessage({ type: "swiftget-status" });
    const status = document.getElementById("status");
    status.classList.remove("checking");
    status.classList.toggle("on", !!(res && res.ok));
    document.getElementById("statusText").textContent = t(res && res.ok ? "connected" : "appOff");
    if (!res || !res.ok) {
      const callout = document.getElementById("appCallout");
      callout.textContent = t("calloutOff");
      callout.classList.add("show");
    }
  } catch {
    const status = document.getElementById("status");
    status.classList.remove("checking");
    document.getElementById("statusText").textContent = t("unavailable");
    const callout = document.getElementById("appCallout");
    callout.textContent = t("calloutUnreach");
    callout.classList.add("show");
  }

  let tab;
  try { [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); } catch { return; }
  if (!tab) return;

  // "Badzy on this site": off adds the site to the list of sites to leave alone
  const site = siteOf(tab.url);
  if (site) {
    const row = document.getElementById("siteRow");
    const box = document.getElementById("siteOn");
    const stored = await chrome.storage.local.get({ blockedSites: [] });
    let blocked = Array.isArray(stored.blockedSites) ? stored.blockedSites : [];
    const isBlocked = () => blocked.some((s) => site === s || site.endsWith("." + s));
    const showSite = () => {
      box.checked = !isBlocked();
      document.getElementById("siteText").textContent = t(box.checked ? "siteOn" : "siteOff", { site });
      document.getElementById("siteHint").textContent = t(box.checked ? "siteOnHint" : "siteOffHint");
    };
    row.hidden = false;
    showSite();
    box.addEventListener("change", async () => {
      blocked = blocked.filter((s) => !(site === s || site.endsWith("." + s)));
      if (!box.checked) blocked.push(site);
      await chrome.storage.local.set({ blockedSites: blocked });
      showSite();
    });
  }

  try {
    const items = await sendMessage({ type: "swiftget-get-media", tabId: tab.id });
    const box = document.getElementById("media");
    const count = document.getElementById("mediaCount");
    if (!Array.isArray(items) || !items.length) {
      count.textContent = t("nothing");
      const empty = document.querySelector("#media .empty");
      if (empty) empty.innerHTML = '<span class="empty-icon" aria-hidden="true">◉</span>' + t("emptyNone");
      return;
    }
    box.replaceChildren();
    let total = items.length;
    count.textContent = t("found", { n: total });
    const title = (tab.title || "video").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").slice(0, 120);
    if (/youtube\.com/i.test(tab.url || "") && /[?&]list=/.test(tab.url || "")) {
      const row = document.createElement("div"); row.className = "media";
      const info = document.createElement("div"); info.textContent = t("playlistAll");
      const btn = document.createElement("button"); btn.className = "all"; btn.textContent = t("downloadAll");
      btn.dataset.unavailable = "false"; btn.disabled = !enabled.checked;
      btn.addEventListener("click", async () => {
        btn.disabled = true; btn.textContent = t("opening");
        try {
          const result = await sendMessage({ type: "swiftget-playlist", url: tab.url });
          btn.textContent = t(result && result.ok ? "opened" : "failed");
          if (!result || !result.ok) btn.disabled = false;
        } catch { btn.textContent = t("appOffline"); btn.disabled = false; }
      });
      row.append(info, btn); box.appendChild(row); total++;
    }
    for (const media of items) {
      const row = document.createElement("div"); row.className = "media";
      const info = document.createElement("div"); info.textContent = media.label || t("media");
      const small = document.createElement("small"); small.textContent = media.sub || ""; info.appendChild(small);
      const btn = document.createElement("button"); btn.textContent = t("download");
      btn.dataset.unavailable = String(!!media.disabled); btn.disabled = !!media.disabled || !enabled.checked;
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        const oldText = btn.textContent; btn.textContent = media.resolve ? t("finding") : t("sending");
        try {
          let choices = [media];
          if (media.resolve) {
            const resolved = await sendMessage({ type: "swiftget-resolve-video", resolve: media.resolve });
            if (!resolved || resolved.error || !Array.isArray(resolved.items)) throw new Error(resolved && resolved.error || t("noQuality"));
            choices = resolved.items;
          }
          if (choices.length === 1) {
            const choice = choices[0];
            const res = await sendMessage({ type: "swiftget-download", item: choice, title: tab.title, referrer: tab.url, fileName: `${title}.${choice.ext || "mp4"}` });
            if (!res || !res.ok) throw new Error(res && res.error || t("noSend"));
            btn.textContent = t("sent");
          } else {
            // Keep the popup simple: use the best quality by default, while
            // showing the options returned by the app in the next rows.
            const label = document.createElement("small");
            label.textContent = t("qualities", { n: choices.length });
            info.appendChild(label);
            row.replaceWith(...choices.map((choice) => {
              const option = document.createElement("div"); option.className = "media";
              const name = document.createElement("div"); name.textContent = choice.label || choice.quality || t("media");
              const send = document.createElement("button"); send.textContent = t("download");
              send.dataset.unavailable = "false"; send.disabled = !enabled.checked;
              send.addEventListener("click", async () => {
                send.disabled = true; send.textContent = t("sending");
                try {
                  const result = await sendMessage({ type: "swiftget-download", item: choice, title: tab.title, referrer: tab.url, fileName: `${title}.${choice.ext || "mp4"}` });
                  if (!result || !result.ok) throw new Error(result && result.error || t("noSend"));
                  send.textContent = t("sent");
                } catch { send.textContent = t("retry"); send.disabled = false; }
              });
              option.append(name, send); return option;
            }));
          }
        } catch (error) {
          btn.textContent = t("retry"); btn.disabled = false;
          const small = info.querySelector("small"); if (small) small.textContent = error.message || t("noSend");
        }
      });
      row.append(info, btn); box.appendChild(row);
    }
    count.textContent = t("found", { n: total });
  } catch {
    document.getElementById("mediaCount").textContent = t("scanFail");
  }
}

init().catch((error) => {
  console.error("Badzy popup:", error);
  setHint(t("popupError"), "error");
});
