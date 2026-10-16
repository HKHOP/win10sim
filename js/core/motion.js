// Whether the visitor has asked for less motion.
//
// This is read when it is used rather than once at load. Three modules used to
// sample it into a module-level constant as they were first evaluated, so a
// session that began with motion on kept animating after the setting was
// turned off - which is exactly when someone who needs it least wants to be the
// one who changes it. The stylesheets already follow the setting live through
// their own @media blocks; this is the JavaScript half of the same question.
//
// It is a MediaQueryList kept for the length of the session rather than a fresh
// matchMedia() per read: asking the browser to evaluate the query is cheap, but
// this is read on every window that opens.

import { storedValue } from '../apis/settings-store.js';

var QUERY = '(prefers-reduced-motion: reduce)';

var media = window.matchMedia ? window.matchMedia(QUERY) : null;

export function prefersReducedMotion() {
  // Ease of Access > Display > "Show animations in Windows" is the same
  // question asked from the other side: turning the setting off is asking for
  // less motion even when the device has not asked for it, and it is read here
  // rather than sampled once so a change takes effect at once.
  if (storedValue('ease.animations') === false) {
    return true;
  }
  return !!(media && media.matches);
}