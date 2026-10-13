import { FULLSCREEN_SVG, DOWNLOAD_SVG } from '../global/icons.js';

// Browser chrome around the emulated OS — not part of the OS.
//
// A phone browser's own bars and address field eat a large slice of the
// screen, and the emulated monitor is already scaled to fit whatever is left,
// so on a handset the whole desktop ends up tiny. This floating button asks
// for the screen itself.
//
// The second button offers the same courtesy to the whole page: the site is
// installable (manifest.webmanifest + sw.js), so a browser that can install it
// announces that with a beforeinstallprompt event, and the button appears only
// once one has arrived. A platform with no install prompt — iOS Safari among
// them, where the way in is Share > Add to Home Screen — is never shown a
// button that would do nothing.
//
// Both live outside the capture layer (see cursor.js), so their presses are the
// browser's to handle rather than the emulated cursor's to route: site chrome
// carries the `.site-chrome` class precisely so the input layer can tell the
// two apart. The fullscreen button is offered only while the site is not
// already fullscreen, so it disappears the moment it has done its job and comes
// back on the way out.

var CHROME_CLASS = 'site-chrome';

// The install button, once the browser has said it has one to offer.
var installButton = null;

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
  // The install offer is not the fullscreen button's business: a desktop
  // browser is offered the install and not the fullscreen, and a handset that
  // cannot go fullscreen may still be installable. Both are asked for
  // independently and each appears only if the platform can do it.
  createInstallOffer();

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

// The install offer, for the platforms that make one.
//
// A browser that can install this site (it is a manifest and a service worker)
// fires beforeinstallprompt once it decides the site is worth installing, and
// only then is there anything to offer - so the button does not exist until
// that event arrives. iOS Safari never fires it; there the way in is Share >
// Add to Home Screen, and the app-icon tags in index.html are what make it
// worth doing.
//
// The event may only be used once, and the browser throws if it is asked twice,
// so it is spent as soon as the prompt is shown.
function createInstallOffer() {
  var offer = null;

  window.addEventListener('beforeinstallprompt', function (event) {
    // Not the emulated OS's business, exactly like the fullscreen button.
    event.preventDefault();
    offer = event;
    showOffer();
  });

  window.addEventListener('appinstalled', function () {
    // Installed: the offer has been taken up, so it is not offered again.
    offer = null;
    hideOffer();
  });

  function showOffer() {
    if (!offer || installButton) {
      return;
    }
    installButton = document.createElement('button');
    installButton.type = 'button';
    installButton.className = CHROME_CLASS + ' site-chrome-install';
    installButton.setAttribute('aria-label', 'Install as an app');
    installButton.innerHTML = DOWNLOAD_SVG;
    installButton.addEventListener('click', function (event) {
      event.stopPropagation();
      var pending = offer;
      offer = null;
      hideOffer();
      if (!pending) {
        return;
      }
      pending.prompt();
      // prompt() resolves with the user's answer; a refusal is as normal as an
      // acceptance, and neither leaves the button worth showing again this
      // session.
      if (pending.userChoice && pending.userChoice.then) {
        pending.userChoice.then(function () {}, function () {});
      }
    });
    document.body.appendChild(installButton);
  }

  function hideOffer() {
    if (installButton && installButton.parentNode) {
      installButton.parentNode.removeChild(installButton);
    }
    installButton = null;
  }
}