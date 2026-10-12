import { FULLSCREEN_SVG } from '../global/icons.js';

// Browser chrome around the emulated OS — not part of the OS.
//
// A phone browser's own bars and address field eat a large slice of the
// screen, and the emulated monitor is already scaled to fit whatever is left,
// so on a handset the whole desktop ends up tiny. This floating button asks
// for the screen itself.
//
// It lives outside the capture layer (see cursor.js), so its presses are the
// browser's to handle rather than the emulated cursor's to route: site chrome
// carries the `.site-chrome` class precisely so the input layer can tell the
// two apart. It is offered only when the platform can actually do it — iPhone
// Safari has no element fullscreen, and a button that does nothing is worse
// than no button — and only while the site is not already fullscreen, so it
// disappears the moment it has done its job and comes back on the way out.

var CHROME_CLASS = 'site-chrome';

function fullscreenElement() {
  return document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null;
}

function requestFullscreen(root) {
  var ask = root.requestFullscreen ||
    root.webkitRequestFullscreen ||
    root.mozRequestFullScreen ||
    root.msRequestFullscreen;
  if (!ask) {
    return;
  }
  try {
    var result = ask.call(root);
    if (result && result.catch) {
      // A refused request (no user gesture, a policy, iOS) must leave the
      // button up: the site is still not fullscreen, so there is still
      // something to offer.
      result.catch(function () {});
    }
  } catch (err) {
    // Same: the button stays, and stays honest.
  }
}

function canGoFullscreen() {
  var root = document.documentElement;
  if (!(root.requestFullscreen || root.webkitRequestFullscreen ||
    root.mozRequestFullScreen || root.msRequestFullscreen)) {
    return false;
  }
  if (document.fullscreenEnabled === false) {
    // Explicitly unavailable, as on iPhone Safari.
    return false;
  }
  return true;
}

// A handset is the case this exists for; a desktop browser has its own
// fullscreen key and a desktop-sized viewport to fit the stage in.
function isHandheld() {
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    return true;
  }
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function createSiteChrome() {
  if (!isHandheld() || !canGoFullscreen()) {
    return null;
  }

  var button = document.createElement('button');
  button.type = 'button';
  button.className = CHROME_CLASS + ' site-chrome-fullscreen';
  button.setAttribute('aria-label', 'Full screen');
  button.innerHTML = FULLSCREEN_SVG;
  document.body.appendChild(button);

  function sync() {
    button.hidden = !!fullscreenElement();
  }

  button.addEventListener('click', function (event) {
    // Not the emulated OS's business: nothing here is routed or prevented.
    event.stopPropagation();
    requestFullscreen(document.documentElement);
  });

  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);

  sync();
  return button;
}