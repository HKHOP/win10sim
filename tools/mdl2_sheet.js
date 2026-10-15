// Renders MDL2 glyphs to a PNG contact sheet, so a codepoint can be checked
// against what it actually draws instead of against what its name suggests.
//
// Why this exists: README-mdl2.md warns that the icon .ico files in
// assets/win10-shell-icons are a renumbered subset whose filenames are NOT DLL
// resource IDs, so a plausible-looking index produces a plausible-looking
// picture of the wrong icon. The MDL2 font does not have that problem - each
// glyph sits at a codepoint Microsoft documents by name - but only if the
// codepoint is right. A wrong one is just as wrong as a wrong .ico index, and
// just as plausible. build_mdl2_icons.py fails loudly when a codepoint is not
// in the font at all; it cannot tell you the codepoint is in the font and means
// something else. This can.
//
// Run:  node tools/mdl2_sheet.js --out out.png E700 E713 E721
//
// The sheet is written by the tool rather than printed: PowerShell's `>`
// redirection mangles binary stdout, and a PNG is binary.
//
// Pure node, no dependencies. The font uses only M/m h/H l/L v/V q/Q t/T z/Z,
// which is why the path parser here is short: there are no cubic segments and
// no arcs to approximate.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.dirname(__dirname);
const FONT = path.join(ROOT, 'assets', 'win10-shell-icons', 'SegoeMDL2Assets.svg');
const EM = 1024;

// --- The font ---------------------------------------------------------------

function loadFont() {
  const src = fs.readFileSync(FONT, 'utf8');
  const glyphs = new Map();
  const re = /<glyph\b[^>]*?>/g;
  let m;
  while ((m = re.exec(src))) {
    const tag = m[0];
    const uni = /\bunicode="([^"]*)"/.exec(tag);
    const d = /\bd="([^"]*)"/.exec(tag);
    if (!uni || !d) continue;
    // The font writes its codepoints as XML character references
    // (unicode="&#xe700;"), not as bare hex, so they have to be decoded
    // before anything can look one up.
    for (const raw of uni[1].trim().split(/\s+/)) {
      const text = raw
        .replace(/^&#x([0-9a-fA-F]+);$/, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/^&#(\d+);$/, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
      for (const ch of text) {
        const cp = ch.codePointAt(0);
        if (!glyphs.has(cp)) glyphs.set(cp, d[1]);
      }
    }
  }
  return glyphs;
}

// --- Path -> polygons -------------------------------------------------------

function tokenize(d) {
  return d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
}

// Flattens one glyph into closed polygons in em space (y down, as SVG draws),
// which is the same space the generator's translate(0,1024) scale(1,-1) puts
// the font's y-up outlines into.
function outline(d, steps) {
  const toks = tokenize(d);
  const polys = [];
  let cur = null;
  let x = 0, y = 0;
  let startX = 0, startY = 0;
  // Reflection state for S/T, which reuse the previous control point mirrored.
  let lastCubic = null, lastQuad = null;
  let cmd = null;
  let i = 0;

  const num = () => {
    const v = parseFloat(toks[i++]);
    return Number.isFinite(v) ? v : 0;
  };
  const push = (px, py) => { if (cur) cur.push([px, py]); };

  // Quadratic segment flattened into line segments.
  const quad = (x0, y0, cx, cy, x1, y1) => {
    for (let s = 1; s <= steps; s++) {
      const t = s / steps, u = 1 - t;
      push(
        u * u * x0 + 2 * u * t * cx + t * t * x1,
        u * u * y0 + 2 * u * t * cy + t * t * y1
      );
    }
  };

  while (i < toks.length) {
    if (/[A-Za-z]/.test(toks[i])) {
      cmd = toks[i++];
    }
    if (cmd === null) break;
    const rel = cmd === cmd.toLowerCase();
    const c = cmd.toLowerCase();

    if (c === 'z') {
      if (cur && cur.length) polys.push(cur);
      cur = null;
      x = startX; y = startY;
      lastCubic = lastQuad = null;
      continue;
    }

    // Moveto is the only command that opens a subpath, so it has to be handled
    // before anything that appends points to one.
    if (c === 'm') {
      if (cur && cur.length) polys.push(cur);
      const dx = num(), dy = num();
      if (rel) { x += dx; y += dy; } else { x = dx; y = dy; }
      startX = x; startY = y;
      cur = [[x, y]];
      lastCubic = lastQuad = null;
      // Further coordinate pairs after a moveto are implicit linetos.
      cmd = rel ? 'l' : 'L';
      continue;
    }

    // A subpath has to exist before points can be appended to it. A path that
    // opens with something other than a moveto is malformed; dropping it with a
    // note is better than drawing an empty cell that reads as "no glyph here".
    if (!cur) {
      throw new Error('path data starts with ' + JSON.stringify(cmd) +
        ' where a moveto was expected');
    }

    if (c === 'l') {
      const dx = num(), dy = num();
      x += dx; y += dy;
      push(x, y);
      lastCubic = lastQuad = null;
      continue;
    }
    if (c === 'h') { x += num(); push(x, y); lastCubic = lastQuad = null; continue; }
    if (c === 'v') { y += num(); push(x, y); lastCubic = lastQuad = null; continue; }
    if (c === 'q') {
      const c1x = num(), c1y = num(), x1 = num(), y1 = num();
      const ax = rel ? x : 0, ay = rel ? y : 0;
      const cx = ax + c1x, cy = ay + c1y;
      const ex = ax + x1, ey = ay + y1;
      quad(x, y, cx, cy, ex, ey);
      lastQuad = [cx, cy]; lastCubic = null;
      x = ex; y = ey;
      continue;
    }
    if (c === 't') {
      // Smooth quadratic: reflect the previous control point, or use the
      // current point when there was no previous quadratic to reflect.
      const c1x = num(), c1y = num();
      const cx = lastQuad ? 2 * x - lastQuad[0] : x;
      const cy = lastQuad ? 2 * y - lastQuad[1] : y;
      const ex = x + c1x, ey = y + c1y;
      quad(x, y, cx, cy, ex, ey);
      lastQuad = [cx, cy];
      x = ex; y = ey;
      continue;
    }
    // A command this font is documented not to contain. Saying so beats
    // silently drawing nothing.
    throw new Error('unexpected path command ' + JSON.stringify(cmd) +
      ' - the font was expected to use only M/m h/H l/L v/V q/Q t/T z/Z');
  }
  if (cur && cur.length) polys.push(cur);
  return polys;
}

// --- Scanline fill (non-zero winding, as SVG fill-rule="nonzero" default) ----

function fillPolys(polys, w, h, toPx) {
  const cov = new Float32Array(w * h);
  const edges = [];
  for (const poly of polys) {
    for (let k = 0; k < poly.length; k++) {
      const a = toPx(poly[k]);
      const b = toPx(poly[(k + 1) % poly.length]);
      if (a[1] !== b[1]) edges.push([a[0], a[1], b[0], b[1]]);
    }
  }
  if (!edges.length) return cov;

  let minY = Infinity, maxY = -Infinity;
  for (const e of edges) {
    minY = Math.min(minY, e[1], e[3]);
    maxY = Math.max(maxY, e[1], e[3]);
  }
  const y0 = Math.max(0, Math.floor(minY));
  const y1 = Math.min(h - 1, Math.ceil(maxY));

  for (let y = y0; y <= y1; y++) {
    const sy = y + 0.5;
    const xs = [];
    for (const e of edges) {
      const [ex0, ey0, ex1, ey1] = e;
      if ((sy >= ey0 && sy < ey1) || (sy >= ey1 && sy < ey0)) {
        xs.push({ x: ex0 + ((sy - ey0) / (ey1 - ey0)) * (ex1 - ex0), dir: ey1 > ey0 ? 1 : -1 });
      }
    }
    if (xs.length < 2) continue;
    xs.sort((p, q) => p.x - q.x);
    let wind = 0;
    for (let k = 0; k < xs.length - 1; k++) {
      wind += xs[k].dir;
      if (wind === 0) continue;
      const spanA = xs[k].x, spanB = xs[k + 1].x;
      const px0 = Math.max(0, Math.ceil(spanA - 0.5));
      const px1 = Math.min(w - 1, Math.floor(spanB - 0.5));
      for (let x = px0; x <= px1; x++) {
        // Horizontal coverage, which is what antialiases the diagonal edges.
        const l = Math.max(spanA, x - 0.5), r = Math.min(spanB, x + 0.5);
        if (r > l) cov[y * w + x] += Math.min(1, r - l);
      }
    }
  }
  return cov;
}

// --- PNG --------------------------------------------------------------------

function crc32(buf) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

// Gray 8-bit, no alpha: one channel, so the sheet is small and readable.
function writeGrayPng(cov, w, h) {
  const raw = Buffer.alloc((w + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w + 1)] = 0; // filter: none
    for (let x = 0; x < w; x++) {
      const v = cov[y * w + x];
      // Ink is black on white; clamp rather than wrap on overshoot.
      raw[y * (w + 1) + 1 + x] = Math.max(0, Math.min(255, Math.round(255 - v * 255)));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 0;  // colour type: grayscale
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// --- Sheet ------------------------------------------------------------------

function main() {
  const argv = process.argv.slice(2);
  let cell = 72, cols = 8, label = 9, out = null;
  const cps = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--cell') { cell = +argv[++i]; continue; }
    if (argv[i] === '--cols') { cols = +argv[++i]; continue; }
    if (argv[i] === '--out') { out = argv[++i]; continue; }
    cps.push(argv[i]);
  }
  if (!cps.length || !out) {
    process.stderr.write('usage: node tools/mdl2_sheet.js --out sheet.png [--cell N] [--cols N] E700 E713 ...\n');
    process.exit(2);
  }

  const glyphs = loadFont();
  const rows = Math.ceil(cps.length / cols);
  const pad = 6;
  const pitch = cell + pad * 2;
  const labelScale = 2;
  const labelH = 5 * labelScale + 3;
  const w = cols * pitch;
  const h = rows * (pitch + labelH);
  const sheet = new Float32Array(w * h);

  const missing = [];
  cps.forEach((arg, idx) => {
    const cp = parseInt(arg.replace(/^u\+/i, ''), 16);
    const gx = (idx % cols) * pitch;
    const gy = Math.floor(idx / cols) * (pitch + labelH);
    const d = glyphs.get(cp);
    // The label goes under every cell, including one with no glyph in it: an
    // unlabelled gap is exactly the thing that gets misattributed.
    drawLabel(sheet, w, h, cp.toString(16).toUpperCase().padStart(4, '0'),
      gx + pad + 1, gy + pad + cell + 2, labelScale);
    if (!d) {
      missing.push(arg.toUpperCase());
      // A missing codepoint draws as an empty cell, so the sheet still lines
      // up and the gap is visible where the glyph should have been.
      process.stderr.write('MISSING U+' + cp.toString(16).toUpperCase().padStart(4, '0') + '\n');
      return;
    }
    const inset = cell * 0.12;
    const scale = (cell - inset * 2) / EM;
    // Em space is y-up; flip into the y-down space the rasteriser walks, which
    // is the same flip build_mdl2_icons.py bakes into the transform.
    const toPx = ([px, py]) => [
      gx + pad + inset + px * scale,
      gy + pad + inset + (EM - py) * scale
    ];
    const cov = fillPolys(outline(d, 16), w, h, toPx);
    for (let i = 0; i < cov.length; i++) sheet[i] += cov[i];
  });

  fs.writeFileSync(out, writeGrayPng(sheet, w, h));
  process.stderr.write(cps.length + ' glyphs, ' + w + 'x' + h + ', ' +
    missing.length + ' missing -> ' + out + '\n');
}

// A 3x5 bitmap font for the four hex digits of a codepoint, so a cell can be
// named rather than counted. Counting columns in a dense grid is how a glyph
// gets attributed to the wrong codepoint, which is the exact failure
// README-mdl2.md warns about - so the sheet labels itself.
//
// Each glyph is five rows of three pixels, listed top row first, as a bitmask
// where bit 2 is the leftmost pixel.
const LABEL_FONT = {
  '0': [0b111, 0b101, 0b101, 0b101, 0b111],
  '1': [0b010, 0b110, 0b010, 0b010, 0b111],
  '2': [0b111, 0b001, 0b111, 0b100, 0b111],
  '3': [0b111, 0b001, 0b111, 0b001, 0b111],
  '4': [0b101, 0b101, 0b111, 0b001, 0b001],
  '5': [0b111, 0b100, 0b111, 0b001, 0b111],
  '6': [0b111, 0b100, 0b111, 0b101, 0b111],
  '7': [0b111, 0b001, 0b001, 0b001, 0b001],
  '8': [0b111, 0b101, 0b111, 0b101, 0b111],
  '9': [0b111, 0b101, 0b111, 0b001, 0b111],
  A: [0b010, 0b101, 0b111, 0b101, 0b101],
  B: [0b110, 0b101, 0b110, 0b101, 0b110],
  C: [0b011, 0b100, 0b100, 0b100, 0b011],
  D: [0b110, 0b101, 0b101, 0b101, 0b110],
  E: [0b111, 0b100, 0b110, 0b100, 0b111],
  F: [0b111, 0b100, 0b110, 0b100, 0b100]
};

function drawLabel(cov, w, h, text, ox, oy, scale) {
  let x = ox;
  for (const ch of text) {
    const rows = LABEL_FONT[ch];
    if (!rows) { x += 4 * scale; continue; }
    rows.forEach((bits, ry) => {
      for (let col = 0; col < 3; col++) {
        if (!(bits & (1 << (2 - col)))) continue;
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = x + col * scale + sx;
            const py = oy + ry * scale + sy;
            if (px >= 0 && px < w && py >= 0 && py < h) cov[py * w + px] += 1;
          }
        }
      }
    });
    x += 4 * scale;
  }
}

// The parts are exported so they can be exercised on their own; `main()` only
// runs when this file is the entry point.
module.exports = { loadFont, tokenize, outline, fillPolys, writeGrayPng, drawLabel, EM };

if (require.main === module) main();