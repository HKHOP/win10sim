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

var QUERY = '(prefers-reduced-motion: reduce)';

var media = window.matchMedia ? window.matchMedia(QUERY) : null;

export function prefersReducedMotion() {
  return !!(media && media.matches);
}