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
LIBRARY = os.path.join(ROOT, "assets", "win10-shell-icons")
OUT = os.path.join(ROOT, "assets", "shell")
SIZE = 128

# Icon file name -> output name. Every one of these was found by LOOKING at the
# library: the whole folder was rendered to a contact sheet and the known folders
# and the Quick access star were picked off it by eye. The numbers are positions
# in this folder and NOT DLL resource IDs - see README-mdl2.md - so no published
# index maps onto them, and none of these mappings was derived from one.
WANTED = {
    "imageres/Imageres_dll_174.ico": "desktop-folder",
    "imageres/Imageres_dll_175.ico": "downloads",
    "shell32/Shell32_dll_044.ico": "quick-access",
    "shell32/Shell32_dll_127.ico": "documents",
    "shell32/Shell32_dll_128.ico": "pictures",
    "shell32/Shell32_dll_129.ico": "music",
    "shell32/Shell32_dll_130.ico": "videos",
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
        source = os.path.join(LIBRARY, *name.split("/"))
        out = square(Image.open(source))
        if out.getchannel("A").getextrema()[0] == 255:
            raise SystemExit(
                "%s has no transparent pixels - it would draw as a black box" % name
            )
        path = os.path.join(OUT, label + ".png")
        out.save(path)
        print("%-30s -> assets/shell/%s.png" % (name, label))


if __name__ == "__main__":
    main()
