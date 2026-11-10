#!/usr/bin/env python3
"""Regenerates every Badzy icon from the single master mark.

    python scripts/make_branding.py

Master: assets/branding/badzy-mark.png (the red Badzy mark, transparent).
Writes:  crates/app/icon.ico            (16..256, the exe + installer icon)
         crates/app/ui/icon.png         (256, used inside the app)
         crates/app/ui/icon-window.png  (256, window icon fallback)
         crates/app/ui/tray32.rgba      (32x32 raw RGBA, tray icon)
The browser extension icons are NOT touched: the add-on is signed by Mozilla
and any change to its files would invalidate the signature.
"""
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
MASTER = ROOT / "assets/branding/badzy-mark.png"


def centered_mark(master: Image.Image, size: int, pad: float) -> Image.Image:
    """The mark cropped to its drawing, centred on a transparent square."""
    box = master.getchannel("A").getbbox()
    art = master.crop(box)
    inner = max(1, round(size * (1 - 2 * pad)))
    scale = inner / max(art.size)
    w, h = max(1, round(art.width * scale)), max(1, round(art.height * scale))
    # draw big and shrink in one step with LANCZOS; a light sharpen keeps
    # the thin orbit line crisp at taskbar sizes
    art = art.resize((w, h), Image.LANCZOS)
    if size <= 48:
        art = art.filter(ImageFilter.UnsharpMask(radius=0.6, percent=70, threshold=0))
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(art, ((size - w) // 2, (size - h) // 2), art)
    return out


def main() -> None:
    master = Image.open(MASTER).convert("RGBA")
    # small sizes get less empty border, so the mark stays big on the taskbar
    pads = {16: 0.02, 20: 0.02, 24: 0.03, 32: 0.03, 40: 0.04, 48: 0.04, 64: 0.05, 128: 0.06, 256: 0.06}
    frames = [centered_mark(master, s, p) for s, p in pads.items()]
    biggest = frames[-1]
    biggest.save(
        ROOT / "crates/app/icon.ico",
        format="ICO",
        sizes=[(s, s) for s in pads],
        append_images=frames[:-1],
    )
    centered_mark(master, 256, 0.06).save(ROOT / "crates/app/ui/icon.png")
    centered_mark(master, 256, 0.06).save(ROOT / "crates/app/ui/icon-window.png")
    (ROOT / "crates/app/ui/tray32.rgba").write_bytes(centered_mark(master, 32, 0.03).tobytes())
    print("icons written")


if __name__ == "__main__":
    main()
