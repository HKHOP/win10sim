// Edge's caption buttons: minimise, maximise and close, drawn where a title bar
// would be rather than by the shell.
//
// A browser puts them at the end of its tab strip, so the window it lives in has
// no title bar at all - which is what `frameless` on the window is for. The
// buttons call the same window API the shell's own caption buttons call, so the
// window still minimises, maximises, snaps and closes exactly as it would.

import { CAPT_MIN_SVG, CAPT_MAX_SVG, CAPT_RESTORE_SVG, CAPT_CLOSE_SVG } from '../../global/icons.js';

function caption(className, label, inner, onPress) {
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'edge-cap ' + className;
  button.setAttribute('aria-label', label);
  button.title = label;
  button.innerHTML = inner;
  button.addEventListener('click', function (event) {
    // The window's own drag region is the strip this sits in, and a press on a
    // button is the button's - see PRESSABLE_SELECTOR in the window manager.
    event.stopPropagation();
    onPress();
  });
  return button;
}

export function buildCaptions(win) {
  var box = document.createElement('div');
  box.className = 'edge-caps';

  box.appendChild(caption('edge-cap-min', 'Minimize', CAPT_MIN_SVG, function () {
    win.minimize();
  }));

  // Maximise and restore are one button holding both glyphs, and the window's own
  // state says which is showing: a maximised window carries .win-maximized, so a
  // window snapped to a half - which is maximised as far as Windows is concerned
  // - shows the restore glyph too.
  var maxInner =
    '<span class="edge-cap-max-glyph">' + CAPT_MAX_SVG + '</span>' +
    '<span class="edge-cap-restore-glyph">' + CAPT_RESTORE_SVG + '</span>';
  box.appendChild(caption('edge-cap-max', 'Maximize', maxInner, function () {
    win.toggleMaximize();
  }));

  box.appendChild(caption('edge-cap-close', 'Close', CAPT_CLOSE_SVG, function () {
    win.close();
  }));

  return box;
}