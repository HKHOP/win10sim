"""Pulls the shell icons the shell needs out of the real Windows 10 icon set.

assets/win10-shell-icons/ holds the Build 21343 icon library (Imageres.dll +
Shell32.dll) split into one .ico per icon. The simulator only ever needs a
handful of them, extracted to 128x128 PNGs under assets/shell/, so this script
extracts exactly those by file name.

Run from the repository root:

    py tools/extract_icons.py
"""

import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHELL32 = os.path.join(ROOT, "assets", "win10-shell-icons", "shell32")
OUT = os.path.join(ROOT, "assets", "shell")
SIZE = 128

# Shell32 file name -> output name. These are the icons Windows 10 draws for
# the profile's known folders and for Quick Access's Home page, so the shell
# never has to draw an approximation of one.
WANTED = {
    "Shell32_dll_104.ico": "desktop-folder",
    "Shell32_dll_123.ico": "downloads",
    "Shell32_dll_127.ico": "documents",
    "Shell32_dll_128.ico": "pictures",
    "Shell32_dll_129.ico": "music",
    "Shell32_dll_130.ico": "videos",
    "Shell32_dll_151.ico": "home",
}


def square(im):
    """Crop to the drawn artwork, centre it in a square, scale to SIZE."""
    im = im.convert("RGBA")
    alpha = im.getchannel("A")
    box = alpha.getbbox() if alpha.getextrema()[0] < 255 else im.getbbox()
    if box:
        im = im.crop(box)
    side = max(im.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, label in sorted(WANTED.items(), key=lambda kv: kv[1]):
        source = os.path.join(SHELL32, name)
        out = square(Image.open(source))
        if out.getchannel("A").getextrema()[0] == 255:
            raise SystemExit(
                "%s has no transparent pixels - it would draw as a black box" % name
            )
        path = os.path.join(OUT, label + ".png")
        out.save(path)
        print("%-20s -> assets/shell/%s.png" % (name, label))


if __name__ == "__main__":
    main()
