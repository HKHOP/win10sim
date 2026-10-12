"""Parses one MDL2 glyph into subpaths and reports their bounding boxes.

Run:  py probe_glyph.py E977
"""

import re
import sys
import xml.etree.ElementTree as ET

NS = "{http://www.w3.org/2000/svg}"
FONT = "assets/win10-shell-icons/SegoeMDL2Assets.svg"


def subpaths(cp):
    root = ET.parse(FONT).getroot()
    d = None
    for g in root.iter(NS + "glyph"):
        u = g.get("unicode")
        if u and d is None and ((len(u) == 1 and ord(u) == cp) or u.lower() == hex(cp)[2:].rjust(4, "0")):
            d = g.get("d")
            break
    if d is None:
        return []
    toks = re.findall(r"[A-Za-z]|-?\d*\.?\d+", d)
    i = 0
    cx = cy = 0.0
    cmd = None
    boxes = []
    cur = []

    def n():
        nonlocal i
        v = float(toks[i]); i += 1; return v

    while i < len(toks):
        if toks[i].isalpha():
            cmd = toks[i]; i += 1
            if cmd in "Zz":
                if cur: boxes.append(cur)
                cur = []
                continue
        if cmd is None:
            break
        c = cmd.lower()
        if c == "m":
            x, y = n(), n(); cur = [(x, y)]; cmd = "l"
        elif c == "l":
            x, y = n(), n(); cur.append((x, y)); cx, cy = x, y
        elif c == "h":
            cx += n(); cur.append((cx, cy))
        elif c == "v":
            cy += n(); cur.append((cx, cy))
        elif c in ("q", "t"):
            if c == "q":
                n(); n()
            x, y = n(), n(); cur.append((x, y)); cx, cy = x, y
        else:
            i += 1
    if cur:
        boxes.append(cur)
    return boxes


for arg in sys.argv[1:]:
    cp = int(arg, 16)
    print("U+%04X" % cp)
    for j, b in enumerate(subpaths(cp)):
        xs = [p[0] for p in b]; ys = [p[1] for p in b]
        print("  subpath %d: x %6.0f..%-6.0f  y %6.0f..%-6.0f  w=%4.0f h=%4.0f"
              % (j, min(xs), max(xs), min(ys), max(ys), max(xs) - min(xs), max(ys) - min(ys)))
