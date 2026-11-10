#!/usr/bin/env python3
"""Draws the pictures of the installer (installer/wizard-*.bmp) from the
Badzy marble art and the orbit logo.   python scripts/make_installer_art.py"""
import os
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance

ROOT = os.path.join(os.path.dirname(__file__), "..")
UI = os.path.join(ROOT, "crates", "app", "ui", "art")
OUT = os.path.join(ROOT, "installer")
BG = (8, 9, 15)


def load(path):
    return Image.open(path).convert("RGBA")


def cover(im, w, h):
    s = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def fade(w, h, top, bottom):
    g = Image.new("L", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        g.putpixel((0, y), round(255 * (top + (bottom - top) * t)))
    return g.resize((w, h))


def large(w, h):
    base = Image.new("RGBA", (w, h), BG + (255,))
    art = cover(load(os.path.join(UI, "sidebar-art.png")), w, h)
    art = ImageEnhance.Brightness(art).enhance(0.95)
    base.alpha_composite(art)
    # dark veil: strong at the top (for the logo) and at the bottom (for the text)
    veil = Image.new("RGBA", (w, h), BG + (255,))
    top = fade(w, h, 0.92, 0.18)
    bot = fade(w, h, 0.0, 0.85)
    veil.putalpha(Image.eval(top, lambda v: v))
    base.alpha_composite(veil)
    v2 = Image.new("RGBA", (w, h), BG + (255,))
    v2.putalpha(Image.eval(bot, lambda v: v))
    base.alpha_composite(v2)
    # logo with a red glow
    mark = load(os.path.join(ROOT, "assets", "branding", "badzy-mark.png"))
    ms = round(w * 0.52)
    mark = mark.resize((ms, ms), Image.LANCZOS)
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gm = Image.new("RGBA", mark.size, (242, 11, 54, 0))
    gm.putalpha(mark.split()[3].filter(ImageFilter.GaussianBlur(ms * 0.12)))
    glow.paste(gm, ((w - ms) // 2, round(h * 0.10)), gm)
    base.alpha_composite(glow)
    base.alpha_composite(mark, ((w - ms) // 2, round(h * 0.10)))
    # wordmark + tagline
    wm = load(os.path.join(UI, "wordmark.png"))
    ww = round(w * 0.78)
    wm = wm.resize((ww, round(wm.height * ww / wm.width)), Image.LANCZOS)
    base.alpha_composite(wm, ((w - ww) // 2, round(h * 0.10) + ms + round(h * 0.02)))
    tg = load(os.path.join(UI, "tagline.png"))
    tw = round(w * 0.82)
    tg = tg.resize((tw, round(tg.height * tw / tg.width)), Image.LANCZOS)
    base.alpha_composite(tg, ((w - tw) // 2, h - tg.height - round(h * 0.04)))
    # a thin red line on the right edge, like the app's top line
    d = ImageDraw.Draw(base)
    d.rectangle((w - max(2, w // 80), 0, w, h), fill=(242, 11, 54, 255))
    return base.convert("RGB")


def small(s):
    base = Image.new("RGBA", (s, s), BG + (255,))
    art = cover(load(os.path.join(UI, "sidebar-art.png")), s, s)
    art.putalpha(70)
    base.alpha_composite(art)
    mark = load(os.path.join(ROOT, "assets", "branding", "badzy-mark.png"))
    ms = round(s * 0.78)
    mark = mark.resize((ms, ms), Image.LANCZOS)
    base.alpha_composite(mark, ((s - ms) // 2, (s - ms) // 2))
    return base.convert("RGB")


for name, w, h in (("100", 164, 314), ("150", 246, 472), ("200", 328, 628)):
    large(w, h).save(os.path.join(OUT, f"wizard-large-{name}.bmp"))
for name, s in (("55", 55), ("83", 83), ("110", 110)):
    small(s).save(os.path.join(OUT, f"wizard-small-{name}.bmp"))
if os.path.exists(os.path.join(OUT, "wizard-small.bmp")):
    os.remove(os.path.join(OUT, "wizard-small.bmp"))
print("installer art written")
