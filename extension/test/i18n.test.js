// Every text the popup and the settings page ask for exists in English and Arabic.
// node extension/test/i18n.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const dir = path.join(__dirname, "..");
const window = {};
new Function("window", "document", "chrome", "navigator", fs.readFileSync(path.join(dir, "i18n.js"), "utf8"))(window, {}, {}, { language: "en" });
const { en, ar } = window.BadzyI18n.dictionaries;
assert.deepStrictEqual(Object.keys(ar).sort(), Object.keys(en).sort(), "Arabic and English have the same keys");
for (const [k, v] of Object.entries(ar)) assert(v && v.trim(), "Arabic text for " + k);
// {placeholders} are the same in both languages
for (const k of Object.keys(en)) {
  const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  assert.strictEqual(ph(ar[k]), ph(en[k]), "placeholders of " + k);
}
const used = new Set();
for (const f of ["popup.html", "options.html", "options.js", "popup.js"]) {
  const text = fs.readFileSync(path.join(dir, f), "utf8");
  for (const m of text.matchAll(/data-i18n(?:-html|-ph|-title)?="(\w+)"/g)) used.add(m[1]);
  for (const m of text.matchAll(/\bt\("(\w+)"/g)) used.add(m[1]);
}
for (const m of fs.readFileSync(path.join(dir, "options.js"), "utf8").matchAll(/(?:mLink|mMedia|mVideo|mAll|mSelected|mPlaylist)/g)) used.add(m[0]);
for (const k of used) assert(k in en, "missing text: " + k);
console.log(`i18n: ${Object.keys(en).length} texts in English and Arabic, ${used.size} used`);
