"""Renders the Settings app icon to the house shape, from the source in assets/.

The shell's other app icons are all tight, square 128px PNGs cut out of the real
Windows icon sets (see assets/win10-shell-icons/README-mdl2.md). This one comes
from a picture rather than from a DLL, and it arrives as a 1080x1012
palette-colour PNG - not square, and not the same size as anything else in the
folder. Dropped in as it stands it would be squashed by every surface that draws
an icon into a fixed box, and it would be the only icon in assets/shell/ that is
not a square RGBA thumbnail.

So it is put through the same treatment the extracted ones got: convert to RGBA,
crop to the alpha bounding box, square the canvas with transparency, and resize
to 128px. Nothing is redrawn and nothing is recoloured - the shape and the
colours are the picture's own.

    py tools/build_settings_icon.py

The source is left alone. It is the artwork; the output is the icon.
"""

import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "assets", "windows-settings.png")
OUT = os.path.join(ROOT, "assets", "shell", "settings-gear.png")
# The size every other app icon in assets/ is.
SIZE = 128


def squared(img):
    """The mark on a square transparent canvas, so nothing is stretched."""
    side = max(img.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    return canvas


def main():
    src = Image.open(SOURCE).convert("RGBA")
    print("source: %dx%d" % src.size)
    # Cropping to the alpha box first is what makes the icon tight: the artwork
    # has a transparent margin around it, and keeping that margin would make the
    # gear itself smaller than every icon beside it.
    cropped = src.crop(src.getbbox())
    print("cropped to the mark: %dx%d" % cropped.size)
    icon = squared(cropped).resize((SIZE, SIZE), Image.LANCZOS)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    icon.save(OUT, "PNG", optimize=True)
    print("wrote %s (%d bytes)" % (os.path.relpath(OUT, ROOT), os.path.getsize(OUT)))


if __name__ == "__main__":
    main()