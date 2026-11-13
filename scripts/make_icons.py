#!/usr/bin/env python3
"""Draws the vector icons of the app (crisp at every size, no bitmaps).

  python scripts/make_icons.py

Writes crates/app/ui/icons/*.svg (line icons, tinted by the theme at run time)
and crates/app/ui/types/*.svg (file-type tiles, each with its own colour).
"""
import os

ROOT = os.path.join(os.path.dirname(__file__), "..", "crates", "app", "ui")
LINE = ('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" '
        'stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">{}</svg>\n')

TOOLS = {
    "add": '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    "stop": '<rect x="6" y="6" width="12" height="12" rx="2.5"/>',
    "stopall": '<rect x="4" y="9" width="11" height="11" rx="2.5"/><path d="M8.5 5.5H17a2.5 2.5 0 0 1 2.5 2.5v8.5"/>',
    "deletedone": '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.9 12.5h9.2L17.5 7"/><path d="m9.6 13.4 1.8 1.8 3.2-3.5"/>',
    "limiter": '<path d="M4.6 17.5a8.5 8.5 0 1 1 14.8 0"/><path d="m12 14 3.6-4.6"/><circle cx="12" cy="14" r="1.2"/>',
    "startqueue": '<path d="M4 6h10M4 11h6M4 16h6"/><path d="M14.5 12.5v7.5l6-3.75z"/>',
    "stopqueue": '<path d="M4 6h10M4 11h6M4 16h6"/><rect x="14.5" y="13" width="6" height="6" rx="1.4"/>',
    "queue": '<path d="M4 7h16M4 12h16M4 17h10"/>',
    "unfinished": '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v7m-3.2-3.2L12 14.5l3.2-3.2"/>',
    "finished": '<circle cx="12" cy="12" r="9"/><path d="m8.2 12.4 2.6 2.6 5-5.4"/>',
    "refresh": '<path d="M20 11a8 8 0 0 0-14.4-4.2L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.4 4.2L20 15.5M20 20v-4.5h-4.5"/>',
    "folder-open": '<path d="M3.5 7.5a2 2 0 0 1 2-2H9l2 2.2h7.5a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    "edit": '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    "copy": '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',
    "sort-up": '<path d="m7 14 5-5 5 5"/>',
    "sort-down": '<path d="m7 10 5 5 5-5"/>',
    "open": '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
    "calendar": '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    "key": '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M16 7l2.5 2.5"/>',
    "user": '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.8-4 3.7-6 7.5-6s6.7 2 7.5 6"/>',
    "shield": '<path d="M12 3.5 5 6.2v5.3c0 4.4 2.9 7.6 7 9 4.1-1.4 7-4.6 7-9V6.2z"/>',
    "wifi": '<path d="M3.5 9.5a12 12 0 0 1 17 0M6.5 12.8a7.7 7.7 0 0 1 11 0M9.5 16a3.4 3.4 0 0 1 5 0"/><circle cx="12" cy="19" r=".6"/>',
    "alert": '<path d="M12 4 3 19.5h18z"/><path d="M12 10v4.5"/><circle cx="12" cy="17" r=".6"/>',
    "bulb": '<path d="M9 17.5h6M10 20.5h4M12 3.5a6 6 0 0 0-3.4 10.9c.6.5.9 1.1.9 1.9v.2h5v-.2c0-.8.3-1.4.9-1.9A6 6 0 0 0 12 3.5z"/>',
    "save": '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    "up": '<path d="m6 14.5 6-6 6 6"/>',
    "down": '<path d="m6 9.5 6 6 6-6"/>',
    "minus": '<path d="M6 12h12"/>',
}

# file-type tiles: (colour, glyph drawn on a 24x24 grid)
PAGE = '<path d="M8 5.5h5.5l3.5 3.5v9.5H8z"/><path d="M13.5 5.5V9H17"/>'
TYPES = {
    "general": ("#9aa4b2", PAGE),
    "video": ("#4c8dff", '<rect x="5.5" y="7" width="13" height="10" rx="2.2"/><path d="m10.5 9.8 3.6 2.2-3.6 2.2z"/>'),
    "audio": ("#b36bff", '<path d="M10 16.5V7.8l6-1.6v8.6"/><circle cx="8.3" cy="16.6" r="1.8"/><circle cx="14.3" cy="14.9" r="1.8"/>'),
    "archive": ("#ffb020", '<rect x="5.5" y="6" width="13" height="12.5" rx="2.2"/><path d="M12 6v3.2M12 11v1.6M12 14.2v1.2"/><rect x="10.4" y="15" width="3.2" height="3.5" rx=".9"/>'),
    "exe": ("#ff5a6e", '<rect x="5" y="6.5" width="14" height="11" rx="2.2"/><path d="M5 10.2h14M8 8.4h.01M10.2 8.4h.01"/>'),
    "apk": ("#3ddc84", '<path d="m12 5.2 6 3.1v7.4l-6 3.1-6-3.1V8.3z"/><path d="m6.3 8.5 5.7 3 5.7-3M12 11.5v6.9"/>'),
    "image": ("#1fd1a5", '<rect x="5" y="6" width="14" height="12" rx="2.2"/><circle cx="9.5" cy="10.2" r="1.3"/><path d="m5.5 16.5 4-4 3 3 2-2 4 3.3"/>'),
    "pdf": ("#ff4d4d", PAGE + '<path d="M10.2 14.6c1.2-.2 2.3-1.8 2.2-3-.1.6 1 2.5 2.4 2.7"/>'),
    "doc": ("#3b82f6", PAGE + '<path d="M10 12.5h4.5M10 15h4.5"/>'),
    "sheet": ("#22c55e", '<rect x="5.5" y="6" width="13" height="12.5" rx="2"/><path d="M5.5 10.6h13M5.5 14.6h13M10.4 6v12.5"/>'),
    "slides": ("#ff8a1f", '<rect x="5" y="6" width="14" height="9.5" rx="2"/><path d="M12 15.5V19M9 19h6M8.8 12.8v-2M11.5 12.8V9.6M14.2 12.8v-3.4"/>'),
    "text": ("#9aa4b2", PAGE + '<path d="M10 12h4M10 14.6h2.6"/>'),
    "disc": ("#8b95a5", '<circle cx="12" cy="12" r="6.6"/><circle cx="12" cy="12" r="1.9"/>'),
    "torrent": ("#ff4d6a", '<path d="M7 6v7.2a5 5 0 0 0 10 0V6"/><path d="M7 9.6h3.4M13.6 9.6H17"/>'),
}


def tile(color, glyph):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none">'
        f'<rect x="1.2" y="1.2" width="21.6" height="21.6" rx="6.2" fill="{color}" fill-opacity=".16" '
        f'stroke="{color}" stroke-opacity=".55" stroke-width="1"/>'
        f'<g stroke="{color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{glyph}</g></svg>\n'
    )


def main():
    icons = os.path.join(ROOT, "icons")
    types = os.path.join(ROOT, "types")
    os.makedirs(types, exist_ok=True)
    for name, body in TOOLS.items():
        path = os.path.join(icons, name + ".svg")
        # never overwrite the hand-picked kit icons
        if not os.path.exists(path) or name in ("up", "down"):
            open(path, "w").write(LINE.format(body))
    for name, (color, glyph) in TYPES.items():
        open(os.path.join(types, name + ".svg"), "w").write(tile(color, glyph))
    print("icons:", len(TOOLS), "types:", len(TYPES))


main()
