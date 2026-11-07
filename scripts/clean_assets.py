#!/usr/bin/env python3
"""Cleans the artwork of the design kit and writes what the app embeds.

    python scripts/clean_assets.py <kit folder>

The kit's PNGs were cut out of a flat image, so they have pale pink halos
around the shapes, hard rectangular edges and a stray duplicate. This
removes the halos (real artwork is deep red: little green/blue), fades the
edges of the big art into transparency and trims the duplicate.
Output: legacy/app/ui/art/*.png (small, embedded into the app).
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

KIT = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / "legacy/app/ui/art"
OUT.mkdir(parents=True, exist_ok=True)


def load(p):
    return Image.open(KIT / p).convert("RGBA")


def defringe(im, lo=70, hi=150):
    """Pale pixels (a lot of green/blue) are halo: fade them out. Then eat
    one pixel of the edge and soften it, so shapes get clean edges."""
    a = np.asarray(im).astype(np.float32)
    g = np.maximum(a[..., 1], a[..., 2])
    keep = 1.0 - np.clip((g - lo) / (hi - lo), 0, 1)
    alpha = a[..., 3] * keep
    # pixels that are only half transparent keep the colour of the artwork
    # (never white), so no pale fringe is left when the edge is smoothed
    a[..., 3] = alpha
    out = Image.fromarray(a.astype(np.uint8), "RGBA")
    al = out.getchannel("A").filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out.putalpha(al)
    return out


def keep_main(im, min_share=0.08):
    """Drops pieces that are cut off by the picture's edge (stray bits of a
    ring): only connected shapes of a decent size stay."""
    try:
        from scipy import ndimage
    except ImportError:
        return im
    a = np.asarray(im.getchannel("A"))
    labels, n = ndimage.label(a > 24, structure=np.ones((3, 3)))
    if n < 2:
        return im
    sizes = ndimage.sum(np.ones_like(a), labels, range(1, n + 1))
    keep = np.zeros(n + 1, bool)
    keep[1:] = sizes >= sizes.max() * min_share
    mask = ndimage.binary_dilation(keep[labels], iterations=3)
    out = im.copy()
    out.putalpha(Image.fromarray((a * mask).astype(np.uint8), "L"))
    return out


def crop_to_art(im, pad=4):
    box = im.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
    if not box:
        return im
    l, t, r, b = box
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def feather(im, edges, px):
    """Fade the given edges ('l','r','t','b') of a picture to transparent."""
    w, h = im.size
    m = np.ones((h, w), np.float32)
    ramp = np.linspace(0, 1, px, dtype=np.float32)
    if "l" in edges: m[:, :px] *= ramp[None, :]
    if "r" in edges: m[:, -px:] *= ramp[::-1][None, :]
    if "t" in edges: m[:px, :] *= ramp[:, None]
    if "b" in edges: m[-px:, :] *= ramp[::-1][:, None]
    a = np.asarray(im.getchannel("A")).astype(np.float32) * m
    out = im.copy()
    out.putalpha(Image.fromarray(a.astype(np.uint8), "L"))
    return out


def save(im, name, max_side=None):
    if max_side and max(im.size) > max_side:
        im.thumbnail((max_side, max_side), Image.LANCZOS)
    im.save(OUT / name, optimize=True)
    print(f"{name:28s} {im.size}")


# brand
save(crop_to_art(defringe(load("branding/badzy-wordmark.png"))), "wordmark.png", 700)
# the tagline file holds the real tagline on top and a broken copy below
tag = load("branding/tagline.png")
save(crop_to_art(defringe(tag.crop((0, 0, tag.width, 205)))), "tagline.png", 460)
# file cards are drawn as vectors now: scripts/make_cards.py
# big art: faded edges instead of hard rectangles
save(feather(load("backgrounds/sidebar-art.png"), "ltrb", 70), "sidebar-art.png", 520)
save(feather(defringe(load("backgrounds/window-bg-corner-tr.png"), 110, 190).crop((0, 0, 1200, 640)), "lb", 160), "corner-tr.png", 900)
save(feather(defringe(load("backgrounds/window-bg-corner-bl.png"), 110, 190), "rt", 120), "corner-bl.png", 900)
bg = Image.open(KIT / "backgrounds/window-bg.png").convert("RGB")
bg.thumbnail((1920, 1200), Image.LANCZOS)
bg.save(OUT / "window-bg.jpg", quality=86)
print("window-bg.jpg", bg.size)
