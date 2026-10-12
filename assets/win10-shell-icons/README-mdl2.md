Segoe MDL2 Assets glyphs — the shell's icon font
================================================

`SegoeMDL2Assets.svg` here is the outline data of the **Segoe MDL2 Assets**
font, which is the icon font Windows 10 draws its shell glyphs with: the Start
hamburger, the app-list lines, the tile grid, the power symbol, the window
caption buttons, the taskbar tray.

It is **source material**, not runtime content. The app never loads this file.
`tools/build_mdl2_icons.py` reads it and writes the glyphs the shell actually
uses into `js/global/mdll2.js`, which is committed and imported normally.

Why this file exists separately from the DLL icon library
---------------------------------------------------------

`imageres/` and `shell32/` in this folder are a **curated, renumbered subset**
of Windows 10 build 21343 — `Imageres_dll_001.ico` .. `Imageres_dll_336.ico`
and `Shell32_dll_001.ico` .. `Shell32_dll_327.ico`, both contiguous from 1.

**Those file numbers are not DLL resource IDs.** No real Imageres.dll or
Shell32.dll has a contiguous 1..N icon run; real IDs are sparse and go
negative. So a published index like "`shell32.dll,44` = Quick Access" does
**not** apply to these files, and `Shell32_dll_044.ico` here is not necessarily
Quick Access. Any tool that maps published icon indexes onto this folder is
mapping them onto the wrong pictures. (`tools/extract_icons.py` has
mappings that predate this note — treat them as unverified.)

That is the trap this note exists to prevent: a plausible-looking number
producing a plausible-looking icon that is simply the wrong one.

The MDL2 font is used instead because it does not have that problem. Each
glyph sits at a codepoint Microsoft publishes by name, so a mapping can be
checked against Microsoft's own table rather than guessed:

    https://learn.microsoft.com/windows/apps/design/iconography/segoe-ui-symbol-font

Regenerating
------------

From the repository root:

    py tools/build_mdl2_icons.py

It rewrites `js/global/mdl2.js`. Two rules keep it honest:

1. Every codepoint in the script's `GLYPHS` table carries the name Microsoft
   documents for it, as a comment in the generated file. If the two ever
   disagree, the script is wrong.
2. **If a codepoint is not in the font, the script fails loudly** and names
   the glyph. It never emits a fallback or a near-miss codepoint. A silently
   substituted glyph is exactly the failure mode described above, so the build
   is made to stop rather than guess.

Verifying a change
------------------

Do not judge an icon by eye. Two checks, in order:

1. Read the path data. `U+E700` (the hamburger) is three subpaths, each a
   full-width bar at y 192-256, 448-512 and 704-768. `U+ECA5` (Tiles) is four
   outer squares each with an inner hole, which is the 2x2 tile grid. A glyph
   whose geometry does not match its documented shape is the wrong glyph.
2. Render it and look. Windows renders these SVGs directly, so what the browser
   shows is the truth — a raster preview is only a check on the path data.

Note that an MDL2 glyph is one path whose subpaths include **holes** (Tiles and
ViewAll are both shapes with cut-outs). Any tool that previews these must
resolve winding; painting each subpath opaque fills the holes back in and makes
a correct glyph look wrong.

Licence
-------

`SegoeMDL2-LICENSE.md` is the MIT licence for the vector export this file came
from (`scottdorman/mdl2-icons`). Keep it next to the font.

The Segoe MDL2 Assets font itself is a Microsoft font and ships with Windows;
this folder holds an MIT-licensed vector export of its outlines for use in this
project. The `.ico` files in `imageres/` and `shell32/` are Microsoft's
artwork, kept here as reference material for the shell's illustrated icons.