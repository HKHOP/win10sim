"""Builds the PWA icons from the Windows logo already in assets/.

The shell already wears the real Windows logo (the boot splash and the Start
button both use it), so the app icon is that same logo rather than a new drawing:
Windows' own treatment is the mark in white on the accent blue, which is also the
highest-contrast reading of a logo this colour can have.

The mark's alpha channel is used as a silhouette mask and painted white, so the
shape is the logo's own - nothing here redraws it.

    py tools/build_app_icons.py

Outputs into assets/app/:
    icon-192.png          any-purpose, Android/desktop launchers
    icon-512.png          any-purpose
    icon-maskable-512.png maskable: the same art inside the safe circle
    apple-touch-icon.png  iOS ignores the manifest and wants this by name
"""

import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "assets", "windows-logo.png")
OUT = os.path.join(ROOT, "assets", "app")

# The Windows accent blue, as the shell itself paints it (css/base.css).
ACCENT = (0, 120, 215, 255)
# How much of the square the mark fills. A markable icon must keep its content
# inside the inner 80% circle, and a square of side s only fits that circle when
# s <= 0.57 of the canvas, so this is comfortably inside it.
FILL = 0.52
# The maskable icon is cut by a rounder mask than the any-purpose one, so it is
# drawn a little smaller.
MASKABLE_FILL = 0.46


def mark_mask():
    """The logo's own shape: its alpha channel, cropped to the mark."""
    logo = Image.open(SOURCE).convert("RGBA")
    return logo.getchannel("A").crop(logo.getbbox())


def build(mask, size, fill, name):
    canvas = Image.new("RGBA", (size, size), ACCENT)
    side = int(size * fill)
    # A thumbnail keeps the aspect ratio; the mark is square to within a pixel,
    # and scaling it to `side` on both axes keeps it undistorted either way.
    mark = mask.resize((side, side), Image.LANCZOS)
    white = Image.new("RGBA", (side, side), (255, 255, 255, 255))
    canvas.paste(white, ((size - side) // 2, (size - side) // 2), mark)
    path = os.path.join(OUT, name)
    canvas.save(path, "PNG", optimize=True)
    print("%-24s %d bytes" % (name, os.path.getsize(path)))


def main():
    os.makedirs(OUT, exist_ok=True)
    mask = mark_mask()
    print("logo mark: %dx%d" % mask.size)
    build(mask, 192, FILL, "icon-192.png")
    build(mask, 512, FILL, "icon-512.png")
    build(mask, 512, MASKABLE_FILL, "icon-maskable-512.png")
    build(mask, 180, FILL, "apple-touch-icon.png")


if __name__ == "__main__":
    main()