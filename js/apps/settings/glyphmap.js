// Every glyph the Settings app can draw, keyed by the name a page uses.
//
// A page declares `glyph: 'cameraPrivacy'` and this turns that into the outline
// in glyphs.js. Resolving the name here rather than in each place that draws a
// glyph is what makes the name checkable: tools/check_settings.js runs the same
// conversion over every declared name, so a page naming a glyph that does not
// exist is a failed check rather than an empty box on screen.

import * as OUTLINES from './glyphs.js';

// 'cameraPrivacy' -> 'CAMERA_PRIVACY_SVG', which is how glyphs.js exports it.
// The same three rules the checker uses, so the two cannot disagree about what
// a name means.
export function exportNameFor(glyph) {
  return String(glyph || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase() + '_SVG';
}

export var GLYPHS = {};

Object.keys(OUTLINES).forEach(function (name) {
  if (/_SVG$/.test(name)) {
    // Back to the page-facing name: CAMERA_PRIVACY_SVG is 'cameraPrivacy'.
    GLYPHS[name.replace(/_SVG$/, '').toLowerCase().replace(/_([a-z])/g, function (_, ch) {
      return ch.toUpperCase();
    })] = OUTLINES[name];
  }
});

// The outline for a name, or '' for a name nothing declares. A page with no
// glyph draws no icon, which is what Win10 shows for a page it has no artwork
// for - never a broken one.
export function glyphFor(name) {
  return GLYPHS[String(name || '')] || '';
}

export default GLYPHS;