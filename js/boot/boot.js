import {
  BOOT_LOGO_SRC,
  BOOT_LOGO_WIDTH_PX,
  BOOT_SPINNER_SRC,
  BOOT_SPINNER_SIZE_PX,
  BOOT_GLITCH_MS,
  BOOT_FLICKER_MS,
  BOOT_SPINNER_GONE_MS,
  BOOT_LOCK_MS
} from '../global/constants.js';
import { watchStage } from '../core/stage.js';
import { createCursor } from '../core/cursor.js';
import { createDesktop } from '../core/desktop.js';
import { createSiteChrome } from '../core/sitechrome.js';
import { createVirtualKeyboard } from '../core/keyboard.js';
import { createLockLayer } from './lockscreen.js';
import { createSignInLayer } from './signin.js';
// App registrations (side effects): taskbar, desktop and Start menu launch
// by app id.
import '../apps/explorer/app.js';
import '../apps/notepad/app.js';

// Boot flow: black splash with logo + spinner, then the classic Win10 bug
// (logo and spinner vanish for no reason), a beat of dead black, and the
// lock screen fades in. Dismissing the lock slides it up to reveal sign-in;
// signing in lands on the desktop.
//
// F2 skips the whole sequence — see skipToDesktop.

var stage = null;
var cursor = null;
// The lock + sign-in pair, while it is on screen.
var lockRoot = null;
var lock = null;
// Set the moment the desktop exists, so there is only ever one.
var signedIn = false;
// Boot timers, so the shortcut can call the whole sequence off.
var pending = [];

function later(fn, ms) {
  var id = window.setTimeout(function () {
    var at = pending.indexOf(id);
    if (at >= 0) {
      pending.splice(at, 1);
    }
    fn();
  }, ms);
  pending.push(id);
  return id;
}

// The secret way in. F2 drops the boot, the lock and the account in one go and
// lands on the desktop: there is no account here to sign into (every password
// is accepted), so the sequence has nothing to check, only waiting to do. It is
// deliberately offered nowhere in the UI — the shortcut is the secret.
// Captured at the window so it lands before the lock screen's own
// any-key-dismisses handler.
window.addEventListener('keydown', function (event) {
  if (event.key !== 'F2') {
    return;
  }
  event.preventDefault();
  skipToDesktop();
}, true);

function skipToDesktop() {
  if (signedIn || !stage || !cursor) {
    return;
  }
  signedIn = true;
  while (pending.length) {
    window.clearTimeout(pending.pop());
  }
  if (lock) {
    lock.dispose();
    lock = null;
  }
  if (lockRoot) {
    if (lockRoot.parentNode) {
      lockRoot.parentNode.removeChild(lockRoot);
    }
    lockRoot = null;
  }
  var bootEl = stage.querySelector('.boot-screen');
  if (bootEl && bootEl.parentNode) {
    bootEl.parentNode.removeChild(bootEl);
  }
  stage.appendChild(createDesktop(cursor, stage));
  cursor.setBooted(true);
}

function buildImage(src, className, alt) {
  var img = document.createElement('img');
  img.src = src;
  img.className = className;
  img.alt = alt;
  img.draggable = false;
  return img;
}

function buildBootScreen() {
  var screen = document.createElement('div');
  screen.className = 'boot-screen';

  var logo = document.createElement('div');
  logo.className = 'boot-logo';
  var logoImg = buildImage(BOOT_LOGO_SRC, 'boot-logo-mark', 'Windows logo');
  logoImg.style.width = BOOT_LOGO_WIDTH_PX + 'px';
  logo.appendChild(logoImg);

  var spinnerWrap = document.createElement('div');
  spinnerWrap.className = 'boot-spinner-wrap';
  var spinnerImg = buildImage(BOOT_SPINNER_SRC, 'boot-spinner-img', 'Loading');
  spinnerImg.style.width = BOOT_SPINNER_SIZE_PX + 'px';
  spinnerImg.style.height = BOOT_SPINNER_SIZE_PX + 'px';
  spinnerWrap.appendChild(spinnerImg);

  screen.appendChild(logo);
  screen.appendChild(spinnerWrap);
  return screen;
}

function showLockScreen() {
  var bootEl = stage.querySelector('.boot-screen');

  var root = document.createElement('div');
  root.className = 'lock-root';
  lockRoot = root;

  root.appendChild(createSignInLayer(
    function insertDesktop() {
      if (signedIn) {
        return;
      }
      signedIn = true;
      // Underneath: desktop waits while the sign-in fades in two phases.
      stage.insertBefore(createDesktop(cursor, stage), root);
    },
    function finishSignIn() {
      if (root.parentNode) {
        root.parentNode.removeChild(root);
      }
    }
  ));

  lock = createLockLayer(function () {
    root.classList.add('dismissed');
    later(function () {
      if (lock.element.parentNode) {
        lock.element.parentNode.removeChild(lock.element);
      }
      lock.dispose();
      var password = root.querySelector('.signin-password');
      if (password) {
        password.focus();
      }
    }, 450);
  });
  root.appendChild(lock.element);

  stage.appendChild(root);
  window.requestAnimationFrame(function () {
    root.classList.add('lock-visible');
  });

  if (bootEl) {
    bootEl.classList.add('boot-fade');
    later(function () {
      if (bootEl.parentNode) {
        bootEl.parentNode.removeChild(bootEl);
      }
    }, 500);
  }
}

// Cache busting: register the root service worker, which answers every
// request from the network first so a device always runs the code Pages is
// serving now (see sw.js). Registered from the entry rather than inline in
// index.html, and resolved against this module so it lands the same whether
// the site sits on a domain root or a project subpath. updateViaCache 'none'
// stops the browser serving the worker's own script out of its HTTP cache, so
// a strategy change lands without waiting for the background update check.
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    // Opening index.html straight off disk (file://) has no workers; the site
    // still runs, just without the cache busting.
    return;
  }
  try {
    navigator.serviceWorker.register(new URL('../sw.js', import.meta.url), {
      updateViaCache: 'none'
    }).catch(function () {
      // A refused worker (private mode, storage denied) must never keep the
      // simulator from booting.
    });
  } catch (err) {
    // Same: the cache busting is best-effort, the OS is the product.
  }
}

function init() {
  registerServiceWorker();
  // The website's own chrome, outside the emulated OS: on a handset, where
  // the browser's bars eat the screen the stage has to fit into, this is how
  // you hand that screen back.
  createSiteChrome();
  createVirtualKeyboard();
  stage = document.getElementById('monitor-stage');
  if (!stage) {
    return;
  }
  stage.appendChild(buildBootScreen());
  // Lock the emulated monitor grid, fit it into the real viewport,
  // and take over the cursor for the whole session.
  watchStage(stage);
  // No cursor until boot finishes: the machine is not usable yet.
  cursor = createCursor(stage);

  var bootEl = stage.querySelector('.boot-screen');

  later(function () {
    // The bug: logo goes away for good; the spinner blinks off for 0.1s,
    // comes back, then dies at the end.
    bootEl.querySelector('.boot-logo').classList.add('boot-logo-gone');
    var spinnerWrap = bootEl.querySelector('.boot-spinner-wrap');
    spinnerWrap.style.display = 'none';
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
      later(function () {
        spinnerWrap.style.display = '';
      }, BOOT_FLICKER_MS);
    }
  }, BOOT_GLITCH_MS);
  later(function () {
    bootEl.querySelector('.boot-spinner-wrap').style.display = 'none';
  }, BOOT_SPINNER_GONE_MS);
  later(function () {
    if (signedIn) {
      // F2 already dropped us on the desktop; no lock screen in between.
      return;
    }
    showLockScreen();
    cursor.setBooted(true);
  }, BOOT_LOCK_MS);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
