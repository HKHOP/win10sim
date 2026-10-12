# Extracts the emulated cursor artwork from this machine's own Windows cursor
# set (C:\Windows\Cursors) into PNGs the browser can draw. A .cur is an ICO
# container, so the frame sizes and the hotspot both come out of its header; a
# .ani is a RIFF file with whole cursors inside it, and each of those frames
# comes out the same way. The 32x32 frame is the one the emulated cursor draws
# at — a Windows 10 cursor at 100% scale.
#
# Run: py tools\extract_cursors.py

import io
import os
import struct
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(os.environ.get("SystemRoot", r"C:\Windows"), "Cursors")
OUT = os.path.join(ROOT, "assets", "cursor")
SIZE = 32

# The default (Aero) set a Windows 10 install actually shows. The legacy files
# in the same folder — arrow_*, beam_*, lwait and the rest — belong to the older
# themes and are left where they are.
STATIC_CURSORS = [
    # (source file, output name, cursor state it stands in for)
    ("aero_arrow.cur", "arrow.png", "idle"),
    ("aero_link.cur", "hand.png", "link"),
    ("beam_i.cur", "text.png", "text"),
    ("aero_move.cur", "move.png", "move"),
    ("aero_ew.cur", "resize-ew.png", "resize horizontal"),
    ("aero_ns.cur", "resize-ns.png", "resize vertical"),
    ("aero_nesw.cur", "resize-nesw.png", "resize one diagonal"),
    ("aero_nwse.cur", "resize-nwse.png", "resize the other diagonal"),
    ("aero_unavail.cur", "unavailable.png", "not allowed"),
]

# The loading cursor is animated: an .ani is a RIFF file whose 'icon' chunks are
# whole cursor frames, so the spin can be drawn as a sprite rather than as a
# still.
ANIMATED_CURSORS = [
    # (source file, output prefix)
    ("aero_busy.ani", "busy"),
]


def dib_frame(data, size):
    """A cursor/ icon frame stored as a plain DIB: a BGRA bitmap plus the 1-bit
    AND mask that says which pixels are see-through.

    Pillow's ICO reader hands back whichever frame it opened first and drops the
    mask on the DIB ones, which is where a black background behind a cursor
    comes from — so the frame is decoded here.
    """
    header_size, width, height, planes, bpp = struct.unpack_from("<IiiHH", data, 0)
    if header_size < 40 or width <= 0:
        raise ValueError("not a DIB frame")
    # In a cursor (and in an icon with a mask) the height is doubled: the image
    # and its mask are stored one after the other in a single bitmap.
    image_height = abs(height) // 2 if height > 0 else abs(height)
    if (width, image_height) != (size, size):
        raise ValueError("frame is %dx%d, wanted %dx%d" % (width, image_height, size, size))

    colour_used = struct.unpack_from("<I", data, 32)[0]
    # Up to 256bpp the colours come from a palette of BGRA quads straight after
    # the header (the older cursors are stored this way; the newer Aero ones are
    # 32bpp and have no palette at all).
    if bpp <= 8:
        entries = colour_used or (1 << bpp)
        palette = []
        for i in range(entries):
            at = header_size + i * 4
            palette.append((data[at + 2], data[at + 1], data[at]))
    else:
        palette = []
    palette_size = len(palette) * 4
    stride = ((width * bpp + 31) // 32) * 4
    mask_stride = ((width + 31) // 32) * 4
    xor_at = header_size + palette_size
    mask_at = xor_at + stride * image_height

    out = bytearray(size * size * 4)
    for y in range(size):
        # A DIB is stored bottom-up; the buffer handed to Pillow is top-down, so
        # output row y comes from source row size-1-y.
        row = y * size * 4
        src = xor_at + (size - 1 - y) * stride
        mrow = mask_at + (size - 1 - y) * mask_stride
        for x in range(size):
            # DIB pixels are BGRA / BGR — blue first. Reading them as RGB
            # swaps red and blue, which turns Windows blue into orange.
            if bpp == 32:
                red, green, blue = data[src + x * 4 + 2], data[src + x * 4 + 1], data[src + x * 4]
            elif bpp == 24:
                red, green, blue = data[src + x * 3 + 2], data[src + x * 3 + 1], data[src + x * 3]
            elif bpp == 16:
                value = struct.unpack_from("<H", data, src + x * 2)[0]
                red = ((value >> 10) & 0x1f) << 3
                green = ((value >> 5) & 0x1f) << 3
                blue = (value & 0x1f) << 3
            else:
                # Packed palette indices, least significant bits first.
                per_byte = 8 // bpp
                shift = (8 - bpp) - (x % per_byte) * bpp
                index = (data[src + x // per_byte] >> shift) & ((1 << bpp) - 1)
                red, green, blue = palette[index] if index < len(palette) else (0, 0, 0)
            # The mask is authoritative: a set bit is a transparent pixel.
            bit = (data[mrow + (x // 8)] >> (7 - (x % 8))) & 1
            at = row + x * 4
            out[at] = red
            out[at + 1] = green
            out[at + 2] = blue
            out[at + 3] = 0 if bit else 255
    return Image.frombytes("RGBA", (size, size), bytes(out))


def read_cursor_frame(path_or_bytes, size=SIZE):
    """The frame of a .cur (or .ico) at `size`, and its hotspot.

    A .cur keeps the hotspot where an .ico keeps its colour planes; an .ico
    frame has no hotspot, so the caller supplies one (the animated cursor's
    rings are centred anyway).
    """
    if isinstance(path_or_bytes, bytes):
        raw = path_or_bytes
    else:
        with open(path_or_bytes, "rb") as handle:
            raw = handle.read()

    reserved, kind, count = struct.unpack_from("<HHH", raw, 0)
    if reserved != 0 or kind not in (1, 2):
        raise ValueError("not a cursor/icon file")
    for i in range(count):
        at = 6 + i * 16
        width, height = struct.unpack_from("<BB", raw, at)
        if (width or 256, height or 256) != (size, size):
            continue
        hotspot = struct.unpack_from("<HH", raw, at + 4) if kind == 2 else (0, 0)
        length, offset = struct.unpack_from("<II", raw, at + 8)
        blob = raw[offset:offset + length]
        if blob[:4] == b"\x89PNG":
            frame = Image.open(io.BytesIO(blob)).convert("RGBA")
        else:
            frame = dib_frame(blob, size)
        if frame.size != (size, size):
            raise ValueError("frame came out %s, wanted %s" % (frame.size, (size, size)))
        return frame, hotspot
    raise ValueError("no %dx%d frame" % (size, size))


def check_transparent(out_name, frame):
    """A cursor with no see-through pixels is the black-background bug wearing
    a different hat, so the corner is checked before anything is written."""
    alpha = frame.getchannel("A")
    if alpha.getextrema()[0] != 0:
        raise SystemExit("%s has no transparent pixels — it would draw as a black box" % out_name)


def read_ani_header(data):
    """The animated cursor's frame count and, when it carries them, the
    per-frame hotspots (an .ani keeps those in an array after its header)."""
    count, flags, hotspots = 0, 0, []
    for tag, body in walk_chunks(data, 12):
        if tag == b"anih" and len(body) >= 36:
            count = struct.unpack_from("<I", body, 4)[0]
            flags = struct.unpack_from("<I", body, 32)[0]
            # AF_ICON: the frames are cursors, and their hotspots follow.
            if flags & 0x1:
                for i in range(count):
                    at2 = 36 + i * 4
                    if at2 + 4 <= len(body):
                        hotspots.append(struct.unpack_from("<HH", body, at2))
    return count, hotspots


def walk_chunks(data, at=12):
    """(tag, body) for every chunk, descending into LIST containers.

    An .ani keeps its frames inside a `LIST fram`, so a flat walk of the file
    finds the header and nothing else.
    """
    while at + 8 <= len(data):
        tag = data[at:at + 4]
        length = struct.unpack_from("<I", data, at + 4)[0]
        body = data[at + 8:at + 8 + length]
        yield tag, body
        if tag == b"LIST":
            # A LIST body opens with its own four-byte type ('fram', 'rate'),
            # and the chunks inside follow it.
            for inner in walk_chunks(body, 4):
                yield inner
        at += 8 + length + (length & 1)


def ani_frames(path, size=SIZE):
    """Every distinct cursor frame inside an .ani, in order, with its hotspot."""
    data = open(path, "rb").read()
    if data[:4] != b"RIFF" or data[8:12] != b"ACON":
        raise ValueError("%s is not an animated cursor" % path)

    declared, hotspots = read_ani_header(data)
    frames = []
    seen = set()
    for tag, body in walk_chunks(data, 12):
        if tag == b"icon" and body not in seen:
            seen.add(body)
            frame, hotspot = read_cursor_frame(body, size)
            if not hotspots:
                # No hotspot in the file: the ring is drawn around its centre.
                hotspot = (size // 2, size // 2)
            frames.append((frame, hotspot))
    if declared:
        print("     (%s declares %d frames, %d distinct)" % (os.path.basename(path), declared, len(frames)))
    return frames


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, out_name, role in STATIC_CURSORS:
        src = os.path.join(SRC, name)
        if not os.path.exists(src):
            sys.exit("missing %s" % src)
        frame, hotspot = read_cursor_frame(src)
        check_transparent(out_name, frame)
        frame.save(os.path.join(OUT, out_name))
        print("%-16s -> assets/cursor/%-18s %-22s hotspot=%s  %dx%d" % (
            name, out_name, role, hotspot, frame.size[0], frame.size[1]))

    for name, prefix in ANIMATED_CURSORS:
        src = os.path.join(SRC, name)
        if not os.path.exists(src):
            sys.exit("missing %s" % src)
        frames = ani_frames(src)
        if not frames:
            sys.exit("%s held no %dx%d frames" % (name, SIZE, SIZE))
        for index, (frame, hotspot) in enumerate(frames):
            out_name = "%s-%d.png" % (prefix, index)
            check_transparent(out_name, frame)
            frame.save(os.path.join(OUT, out_name))
        print("%-16s -> assets/cursor/%s-0..%d.png (%d frames, hotspot=%s)" % (
            name, prefix, len(frames) - 1, len(frames), frames[0][1]))


if __name__ == "__main__":
    main()