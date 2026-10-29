const DEFAULTS = { port: 9614, intercept: true, minSizeKB: 0, bubbleSize: "normal", bubbleScale: null };
const OLD_SIZES = { small: 85, normal: 100, large: 125 };
let saveTimer;

function saved(message = "Settings saved ✓", error = false) {
  const el = document.getElementById("saved");
  el.textContent = message;
  el.classList.toggle("error", error);
  clearTimeout(saveTimer);
  if (!error) saveTimer = setTimeout(() => { el.textContent = ""; }, 1800);
}

async function init() {
  const opts = Object.assign({}, DEFAULTS, await chrome.storage.local.get(DEFAULTS));
  const intercept = document.getElementById("intercept");
  const minSize = document.getElementById("minSize");
  const port = document.getElementById("port");
  const scale = document.getElementById("bubbleScale");
  const scaleText = document.getElementById("bubbleScaleText");

  intercept.checked = opts.intercept !== false;
  minSize.value = Math.max(0, Number(opts.minSizeKB) || 0);
  port.value = Number(opts.port) || DEFAULTS.port;
  const pct = opts.bubbleScale != null ? Math.round(Number(opts.bubbleScale) * 100) : OLD_SIZES[opts.bubbleSize] || 100;
  scale.value = String(Math.min(200, Math.max(50, pct)));
  scaleText.textContent = `${scale.value}%`;

  intercept.addEventListener("change", async () => {
    await chrome.storage.local.set({ intercept: intercept.checked });
    saved();
  });
  minSize.addEventListener("change", async () => {
    const value = Number(minSize.value);
    if (!Number.isFinite(value) || value < 0 || value > 104857600) {
      saved("Enter a size between 0 and 104,857,600 KB.", true);
      minSize.value = Math.max(0, Number(opts.minSizeKB) || 0);
      return;
    }
    await chrome.storage.local.set({ minSizeKB: Math.floor(value) });
    saved();
  });
  port.addEventListener("change", async () => {
    const value = Number(port.value);
    if (!Number.isInteger(value) || value < 1024 || value > 65535) {
      saved("Port must be a whole number between 1024 and 65535.", true);
      port.value = Number(opts.port) || DEFAULTS.port;
      return;
    }
    await chrome.storage.local.set({ port: value });
    saved("Port saved ✓. Restart the desktop app if needed.");
    checkConnection();
  });
  scale.addEventListener("input", () => {
    scaleText.textContent = `${scale.value}%`;
    chrome.storage.local.set({ bubbleScale: Number(scale.value) / 100 });
  });
  scale.addEventListener("change", () => saved());
  checkConnection();
}

async function checkConnection() {
  const status = document.getElementById("status");
  const text = document.getElementById("statusText");
  status.classList.remove("on");
  text.textContent = "Checking desktop app…";
  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "swiftget-status" }, (result) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(result);
      });
    });
    const online = !!(response && response.ok);
    status.classList.toggle("on", online);
    text.textContent = online ? "Desktop app connected" : "Desktop app offline";
  } catch {
    status.classList.remove("on");
    text.textContent = "Desktop app unavailable";
  }
}

init().catch((error) => saved(error.message || "Could not load settings.", true));
