// The .ink file: an emulated ink document format.
//
// Windows stores ink as ISF (Ink Serialized Format) - a compact binary layout
// whose specification Microsoft publishes separately. A static browser app
// cannot write that: there is no build step here, nothing compiles a binary
// encoder, and the layout is documented in a downloadable spec rather than in
// code. So the format implemented here is InkML, the W3C standard ink markup
// language, which Windows reads as well - a .ink written by the simulator is a
// real InkML document rather than an approximation of a real ISF one.
//
// What that costs, stated plainly:
//   - Coordinates are himetric, as Windows writes them (1/100 mm), converted at
//     96 dpi. The document carries its pixel extent so a drawing reopens at the
//     size it was drawn.
//   - Pen identity (ballpoint / pencil / highlighter) has no InkML concept, so
//     it rides along as a namespaced attribute and the visual result - colour,
//     width, opacity - is written the standard way.
//   - A real ISF file that turns up here is detected and reported as
//     unsupported rather than being read as text and turned to noise.

export const INK_EXTENSION = 'ink';
export const INK_MEDIA_TYPE = 'application/inkml+xml';

// InkML's namespace, and one of our own for the bits the standard has no word
// for.
const INKML_NS = 'http://www.w3.org/2003/InkML';
const SIM_NS = 'https://hkhop.github.io/win10sim/ns/ink';

// Himetric units per pixel at 96 dpi: 1 inch is 2540, an inch is 96 pixels.
const HIMETRIC_PER_PX = 2540 / 96;
// Windows writes force as a 15-bit integer; InkML's convention is the same.
const FORCE_MAX = 32767;
// InkML's channel maximum for the document space, in himetric. 32767 himetric
// is a little over 32 cm, comfortably more than the emulated screen.
const CHANNEL_MAX = 32767;

const TOOLS = ['ballpoint', 'pencil', 'highlighter'];

// How each pen looks, which is what a brush in InkML actually describes. The
// highlighter is translucent and wide, the pencil soft, the ballpoint solid.
function brushFor(tool) {
  if (tool === 'highlighter') {
    return { opacity: 0.4, round: false };
  }
  if (tool === 'pencil') {
    return { opacity: 0.55, round: true };
  }
  return { opacity: 1, round: true };
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toUnits(px) {
  var value = Math.round(px * HIMETRIC_PER_PX);
  if (value < 0) {
    return 0;
  }
  return value > CHANNEL_MAX ? CHANNEL_MAX : value;
}

function fromUnits(units) {
  return Math.round(units / HIMETRIC_PER_PX * 10) / 10;
}

// strokes: [{ tool, color, size, points: [[x, y, pressure], ...] }]
// extent: the pixel size of the surface they were drawn on, kept so a drawing
// comes back at the same scale.
export function serializeInk(strokes, extent) {
  var brushes = [];
  var brushIds = {};
  function brushIdFor(stroke) {
    var look = brushFor(stroke.tool);
    var key = stroke.color + '|' + stroke.size + '|' + look.opacity;
    if (brushIds[key]) {
      return brushIds[key];
    }
    var id = 'br' + brushes.length;
    brushIds[key] = id;
    brushes.push({
      id: id,
      tool: stroke.tool,
      color: stroke.color,
      size: stroke.size,
      opacity: look.opacity
    });
    return id;
  }

  var traces = strokes.map(function (stroke) {
    var points = stroke.points.map(function (p) {
      return toUnits(p[0]) + ' ' + toUnits(p[1]) + ' ' +
        Math.max(0, Math.min(FORCE_MAX, Math.round((p[2] === undefined ? 0.6 : p[2]) * FORCE_MAX)));
    }).join(' ');
    return '  <trace contextRef="#ctx0" brushRef="#' + brushIdFor(stroke) + '"' +
      ' ink:tool="' + escapeXml(stroke.tool) + '">' + points + '</trace>';
  });

  var brushXml = brushes.map(function (brush) {
    return '    <brush xml:id="' + brush.id + '">\n' +
      '      <brushProperty name="width" value="' + escapeXml(brush.size) + '" units="dev"/>\n' +
      '      <brushProperty name="height" value="' + escapeXml(brush.size) + '" units="dev"/>\n' +
      '      <brushProperty name="color" value="' + escapeXml(brush.color) + '"/>\n' +
      '      <brushProperty name="opacity" value="' + brush.opacity + '"/>\n' +
      '    </brush>';
  }).join('\n');

  var size = extent || { width: 0, height: 0 };

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<ink xmlns="' + INKML_NS + '" xmlns:ink="' + SIM_NS + '"' +
    ' ink:extent="' + Math.round(size.width) + 'x' + Math.round(size.height) + '">\n' +
    '  <definitions>\n' +
    brushXml + '\n' +
    '    <context xml:id="ctx0">\n' +
    '      <inkSource xml:id="inkSrc0">\n' +
    '        <traceFormat>\n' +
    '          <channel name="X" type="integer" max="' + CHANNEL_MAX + '" units="himetric"/>\n' +
    '          <channel name="Y" type="integer" max="' + CHANNEL_MAX + '" units="himetric"/>\n' +
    '          <channel name="F" type="integer" max="' + FORCE_MAX + '" units="dev"/>\n' +
    '        </traceFormat>\n' +
    '      </inkSource>\n' +
    '    </context>\n' +
    '  </definitions>\n' +
    traces.join('\n') + '\n' +
    '</ink>\n';
}

// A small XML reader, written for this one job.
//
// A full parser is not needed to read ink - the documents are elements,
// attributes and numbers - and not using one means the format layer can be
// exercised outside a browser, where there is no DOMParser to lean on. It reads
// the XML subset an InkML document actually uses and ignores the rest.
function readXml(text) {
  var root = { name: '', attrs: {}, children: [], text: '' };
  var stack = [root];
  var index = 0;
  var length = text.length;

  function tagEnd(from) {
    // A quoted attribute value may hold a '>', so the tag is walked, not cut.
    var quote = '';
    for (var i = from; i < length; i++) {
      var ch = text.charAt(i);
      if (quote) {
        if (ch === quote) {
          quote = '';
        }
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === '>') {
        return i;
      }
    }
    return -1;
  }

  var ATTR = /([\w.:-]+)\s*=\s*"([^"]*)"/g;

  while (index < length) {
    var open = text.indexOf('<', index);
    if (open < 0) {
      stack[stack.length - 1].text += text.slice(index);
      break;
    }
    if (open > index) {
      stack[stack.length - 1].text += text.slice(index, open);
    }
    if (text.substr(open, 4) === '<!--') {
      var comment = text.indexOf('-->', open);
      index = comment < 0 ? length : comment + 3;
      continue;
    }
    if (text.charAt(open + 1) === '?' || text.charAt(open + 1) === '!') {
      var skip = text.indexOf('>', open);
      index = skip < 0 ? length : skip + 1;
      continue;
    }
    var end = tagEnd(open);
    if (end < 0) {
      break;
    }
    var body = text.slice(open + 1, end);
    index = end + 1;
    if (body.charAt(0) === '/') {
      if (stack.length > 1) {
        stack.pop();
      }
      continue;
    }
    var selfClosing = body.charAt(body.length - 1) === '/';
    if (selfClosing) {
      body = body.slice(0, -1);
    }
    var nameMatch = /^([\w.:-]+)/.exec(body);
    if (!nameMatch) {
      continue;
    }
    var node = { name: nameMatch[1], attrs: {}, children: [], text: '' };
    ATTR.lastIndex = 0;
    var attr;
    while ((attr = ATTR.exec(body)) !== null) {
      node.attrs[attr[1]] = attr[2];
    }
    stack[stack.length - 1].children.push(node);
    if (!selfClosing) {
      stack.push(node);
    }
  }
  return root;
}

function descendants(node, name) {
  var found = [];
  (function walk(current) {
    current.children.forEach(function (child) {
      if (child.name === name || child.name.split(':').pop() === name) {
        found.push(child);
      }
      walk(child);
    });
  })(node);
  return found;
}

// Tolerant by design: a file that is not ink, or is a shape this does not know,
// comes back as null rather than throwing, the way a shell opening an unfamiliar
// file just shows you nothing.
export function parseInk(text) {
  if (!isInkText(text)) {
    return null;
  }
  var root = readXml(text);
  if (!root.children.length || root.children[0].name !== 'ink') {
    return null;
  }
  var ink = root.children[0];

  var extent = { width: 0, height: 0 };
  var declared = ink.attrs['ink:extent'] || ink.attrs.extent;
  if (declared) {
    var parts = String(declared).split('x');
    extent = { width: Number(parts[0]) || 0, height: Number(parts[1]) || 0 };
  }

  var brushes = {};
  descendants(ink, 'brush').forEach(function (brush) {
    var props = {};
    descendants(brush, 'brushProperty').forEach(function (prop) {
      props[prop.attrs.name] = prop.attrs.value;
    });
    // A reference is written as "#br0", an id is not: keyed the same way so the
    // two meet.
    brushes[String(brush.attrs['xml:id'] || brush.attrs.id || '').replace(/^#/, '')] = {
      color: props.color || '#000000',
      size: Number(props.width) || 2,
      opacity: props.opacity === undefined ? 1 : Number(props.opacity)
    };
  });

  var strokes = [];
  descendants(ink, 'trace').forEach(function (trace) {
    var brush = brushes[String(trace.attrs.brushRef || '').replace(/^#/, '')] ||
      { color: '#000000', size: 2, opacity: 1 };
    var tool = trace.attrs['ink:tool'] || trace.attrs.tool || 'ballpoint';
    if (TOOLS.indexOf(tool) < 0) {
      tool = 'ballpoint';
    }
    var numbers = String(trace.text).trim().split(/\s+/);
    var points = [];
    for (var i = 0; i + 2 < numbers.length; i += 3) {
      var x = Number(numbers[i]);
      var y = Number(numbers[i + 1]);
      var force = Number(numbers[i + 2]);
      if (isNaN(x) || isNaN(y)) {
        continue;
      }
      points.push([
        fromUnits(x),
        fromUnits(y),
        Math.max(0, Math.min(1, (isNaN(force) ? 0.6 * FORCE_MAX : force) / FORCE_MAX))
      ]);
    }
    if (points.length === 0) {
      return;
    }
    strokes.push({ tool: tool, color: brush.color, size: brush.size, points: points });
  });

  return { extent: extent, strokes: strokes };
}

export function isInkText(text) {
  var head = String(text || '').slice(0, 4096);
  if (!head.length) {
    return false;
  }
  // A real ISF file is binary; it will not read as markup, and saying so is
  // better than handing back a document full of mojibake.
  if (/[ --]/.test(head)) {
    return false;
  }
  return head.indexOf('<ink') >= 0;
}

// Reading and writing go through the emulated volume like every other file, so
// an .ink document lives on C: beside everything else.
export function readInkFile(volume, path) {
  return volume.readFile(path).then(function (file) {
    return file.text().then(function (text) {
      var parsed = parseInk(text);
      if (!parsed) {
        return { format: 'unsupported', path: path, strokes: [], extent: { width: 0, height: 0 } };
      }
      return {
        format: 'inkml',
        path: path,
        strokes: parsed.strokes,
        extent: parsed.extent
      };
    });
  }, function () {
    return null;
  });
}

export function writeInkFile(volume, path, strokes, extent) {
  return volume.writeFile(path, serializeInk(strokes || [], extent));
}

export { TOOLS };
