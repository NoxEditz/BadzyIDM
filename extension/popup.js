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

async function init() {
  document.getElementById("settings").addEventListener("click", () => chrome.runtime.openOptionsPage());

  const enabled = document.getElementById("enabled");
  const onText = document.getElementById("onText");
  const onHint = document.getElementById("onHint");
  const showEnabled = (value) => {
    enabled.checked = value;
    document.body.classList.toggle("off", !value);
    onText.textContent = value ? "Badzy is on" : "Badzy is paused";
    onHint.textContent = value ? "Browser downloads and video links go to the app" : "The browser handles downloads normally";
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
      setHint("Paste a valid http(s) URL or a magnet link with a BTIH/BTMH hash.", "error");
      input.focus();
      return;
    }
    addButton.disabled = true;
    addButton.textContent = "Adding…";
    setHint("Sending to Badzy…");
    try {
      const result = await sendMessage({ type: "swiftget-quick-add", url });
      if (!result || !result.ok) throw new Error(result && result.error || "Badzy did not accept the link.");
      setHint(isMagnet(url) ? "Magnet sent to Badzy ✓ · review files in the Torrent window" : "Download sent to Badzy ✓", "success");
      input.value = "";
      document.getElementById("appCallout").classList.remove("show");
      const status = document.getElementById("status");
      status.classList.add("on");
      document.getElementById("statusText").textContent = "Connected";
    } catch (error) {
      setHint(error.message || "Could not reach Badzy. Is the desktop app running?", "error");
    } finally {
      addButton.disabled = !enabled.checked;
      addButton.textContent = "Add ↗";
    }
  });

  try {
    const res = await sendMessage({ type: "swiftget-status" });
    const status = document.getElementById("status");
    status.classList.remove("checking");
    status.classList.toggle("on", !!(res && res.ok));
    document.getElementById("statusText").textContent = res && res.ok ? "Connected" : "App not running";
    if (!res || !res.ok) {
      const callout = document.getElementById("appCallout");
      callout.textContent = "Badzy desktop isn’t running. Start it, then try your download again.";
      callout.classList.add("show");
    }
  } catch {
    const status = document.getElementById("status");
    status.classList.remove("checking");
    document.getElementById("statusText").textContent = "Unavailable";
    const callout = document.getElementById("appCallout");
    callout.textContent = "Can’t reach the desktop app. Start Badzy or check the extension port in Settings.";
    callout.classList.add("show");
  }

  let tab;
  try { [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); } catch { return; }
  if (!tab) return;
  try {
    const items = await sendMessage({ type: "swiftget-get-media", tabId: tab.id });
    const box = document.getElementById("media");
    const count = document.getElementById("mediaCount");
    if (!Array.isArray(items) || !items.length) {
      count.textContent = "Nothing found";
      const empty = document.querySelector("#media .empty");
      if (empty) empty.innerHTML = '<span class="empty-icon" aria-hidden="true">◉</span>No media detected on this page.<br>Try starting playback or opening a media page.';
      return;
    }
    box.replaceChildren();
    let total = items.length;
    count.textContent = `${total} found`;
    const title = (tab.title || "video").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").slice(0, 120);
    if (/youtube\.com/i.test(tab.url || "") && /[?&]list=/.test(tab.url || "")) {
      const row = document.createElement("div"); row.className = "media";
      const info = document.createElement("div"); info.textContent = "All videos in this playlist";
      const btn = document.createElement("button"); btn.className = "all"; btn.textContent = "Download all";
      btn.dataset.unavailable = "false"; btn.disabled = !enabled.checked;
      btn.addEventListener("click", async () => {
        btn.disabled = true; btn.textContent = "Opening…";
        try {
          const result = await sendMessage({ type: "swiftget-playlist", url: tab.url });
          btn.textContent = result && result.ok ? "Opened ✓" : "Failed";
          if (!result || !result.ok) btn.disabled = false;
        } catch { btn.textContent = "App offline"; btn.disabled = false; }
      });
      row.append(info, btn); box.appendChild(row); total++;
    }
    for (const media of items) {
      const row = document.createElement("div"); row.className = "media";
      const info = document.createElement("div"); info.textContent = media.label || "Media";
      const small = document.createElement("small"); small.textContent = media.sub || ""; info.appendChild(small);
      const btn = document.createElement("button"); btn.textContent = "Download";
      btn.dataset.unavailable = String(!!media.disabled); btn.disabled = !!media.disabled || !enabled.checked;
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        const oldText = btn.textContent; btn.textContent = media.resolve ? "Finding…" : "Sending…";
        try {
          let choices = [media];
          if (media.resolve) {
            const resolved = await sendMessage({ type: "swiftget-resolve-video", resolve: media.resolve });
            if (!resolved || resolved.error || !Array.isArray(resolved.items)) throw new Error(resolved && resolved.error || "Could not find video quality.");
            choices = resolved.items;
          }
          if (choices.length === 1) {
            const choice = choices[0];
            const res = await sendMessage({ type: "swiftget-download", item: choice, title: tab.title, referrer: tab.url, fileName: `${title}.${choice.ext || "mp4"}` });
            if (!res || !res.ok) throw new Error(res && res.error || "Could not send download.");
            btn.textContent = "Sent ✓";
          } else {
            // Keep the popup simple: use the best quality by default, while
            // showing the options returned by the app in the next rows.
            const label = document.createElement("small");
            label.textContent = `${choices.length} qualities available below`;
            info.appendChild(label);
            row.replaceWith(...choices.map((choice) => {
              const option = document.createElement("div"); option.className = "media";
              const name = document.createElement("div"); name.textContent = choice.label || choice.quality || "Media";
              const send = document.createElement("button"); send.textContent = "Download";
              send.dataset.unavailable = "false"; send.disabled = !enabled.checked;
              send.addEventListener("click", async () => {
                send.disabled = true; send.textContent = "Sending…";
                try {
                  const result = await sendMessage({ type: "swiftget-download", item: choice, title: tab.title, referrer: tab.url, fileName: `${title}.${choice.ext || "mp4"}` });
                  if (!result || !result.ok) throw new Error(result && result.error || "Could not send download.");
                  send.textContent = "Sent ✓";
                } catch { send.textContent = "Retry"; send.disabled = false; }
              });
              option.append(name, send); return option;
            }));
          }
        } catch (error) {
          btn.textContent = "Retry"; btn.disabled = false;
          const small = info.querySelector("small"); if (small) small.textContent = error.message || "Could not send download.";
        }
      });
      row.append(info, btn); box.appendChild(row);
    }
    count.textContent = `${total} found`;
  } catch {
    document.getElementById("mediaCount").textContent = "Media scan unavailable";
  }
}

init().catch((error) => {
  console.error("Badzy popup:", error);
  setHint("The popup hit an error. Reopen it or reload the extension.", "error");
});
