#!/usr/bin/env python3
"""Draws the six file-type illustrations of the app as clean SVG (a dark
folder with a glowing red orbit ring and a glyph). Vector: sharp at any size.

    python scripts/make_cards.py        -> crates/app/ui/art/card-<kind>.svg
"""
from pathlib import Path
OUT = Path(__file__).resolve().parent.parent / "crates/app/ui/art"

RED, RED2, DARK1, DARK2 = "#f20b36", "#ff4d6a", "#1d1d27", "#0a0a10"

GLYPHS = {
    # a zipper running down the middle with its pull
    "zip": f'''<g fill="{RED}"><rect x="251" y="206" width="10" height="150" rx="3" opacity=".35"/>
      {''.join(f'<rect x="{240 if i%2 else 262}" y="{212+i*14}" width="12" height="8" rx="2"/>' for i in range(10))}
      <rect x="241" y="330" width="30" height="40" rx="8" fill="none" stroke="{RED2}" stroke-width="5"/></g>''',
    "video": f'<path d="M232 218 L232 338 L330 278 Z" fill="{RED}" stroke="{RED2}" stroke-width="6" stroke-linejoin="round"/>',
    "audio": f'''<g fill="{RED}" stroke="{RED2}" stroke-width="4" stroke-linejoin="round">
      <ellipse cx="228" cy="334" rx="26" ry="20" transform="rotate(-18 228 334)"/>
      <ellipse cx="312" cy="318" rx="26" ry="20" transform="rotate(-18 312 318)"/>
      <path d="M246 332 V222 L330 200 V312" fill="none" stroke-width="12" stroke-linecap="round"/>
      <path d="M246 222 L330 200 V236 L246 258 Z"/></g>''',
    "document": f'''<g fill="none" stroke="{RED}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">
      <path d="M218 204 H282 L318 240 V352 H218 Z"/><path d="M282 204 V240 H318"/>
      <path d="M240 280 H296 M240 305 H296 M240 330 H274" stroke-width="7"/></g>''',
    "image": f'''<g fill="none" stroke="{RED}" stroke-width="8" stroke-linejoin="round">
      <rect x="208" y="212" width="120" height="138" rx="12"/>
      <circle cx="298" cy="248" r="11" fill="{RED}" stroke="none"/>
      <path d="M208 330 L250 276 L282 314 L300 294 L328 330" fill="{RED}" stroke="{RED2}" stroke-width="4"/></g>''',
    "program": f'''<g fill="{RED}">
      {''.join(f'<rect x="258" y="206" width="20" height="30" rx="5" transform="rotate({a} 268 284)"/>' for a in range(0, 360, 45))}
      <circle cx="268" cy="284" r="52"/><circle cx="268" cy="284" r="22" fill="{DARK2}"/></g>''',
}

def card(kind: str) -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs>
  <linearGradient id="face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{DARK1}"/><stop offset="1" stop-color="{DARK2}"/></linearGradient>
  <linearGradient id="back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15151d"/><stop offset="1" stop-color="#07070b"/></linearGradient>
  <linearGradient id="ring" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{RED}" stop-opacity=".15"/><stop offset=".5" stop-color="{RED2}"/><stop offset="1" stop-color="{RED}" stop-opacity=".9"/></linearGradient>
  <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
</defs>
<!-- red light behind the folder -->
<ellipse cx="256" cy="300" rx="170" ry="130" fill="{RED}" opacity=".22" filter="url(#soft)"/>
<!-- orbit ring: the back half first -->
<g transform="rotate(-16 256 300)" fill="none" stroke="url(#ring)" stroke-width="5" filter="url(#glow)">
  <path d="M40 300 A216 78 0 0 1 472 300"/></g>
<!-- the folder -->
<path d="M120 142 Q120 122 140 122 H220 Q234 122 242 134 L252 148 H372 Q392 148 392 168 V360 Q392 380 372 380 H140 Q120 380 120 360 Z" fill="url(#back)" stroke="{RED}" stroke-opacity=".55" stroke-width="2.5"/>
<rect x="104" y="172" width="304" height="228" rx="22" fill="url(#face)" stroke="{RED}" stroke-width="3" filter="url(#glow)"/>
<rect x="110" y="178" width="292" height="216" rx="17" fill="none" stroke="#ffffff" stroke-opacity=".07" stroke-width="2"/>
<!-- the front half of the ring crosses over the folder -->
<g transform="rotate(-16 256 300)" fill="none" stroke="url(#ring)" stroke-width="6" filter="url(#glow)">
  <path d="M40 300 A216 78 0 0 0 472 300"/></g>
<g filter="url(#glow)" transform="translate(-12 4)">{GLYPHS[kind]}</g>
</svg>
'''

for kind in GLYPHS:
    (OUT / f"card-{kind}.svg").write_text(card(kind), encoding="utf-8")
print("cards written:", ", ".join(GLYPHS))
