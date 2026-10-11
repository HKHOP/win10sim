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

function showLockScreen(stage, cursor) {
  var bootEl = stage.querySelector('.boot-screen');

  var root = document.createElement('div');
  root.className = 'lock-root';

  root.appendChild(createSignInLayer(
    function insertDesktop() {
      // Underneath: desktop waits while the sign-in fades in two phases.
      stage.insertBefore(createDesktop(cursor, stage), root);
    },
    function finishSignIn() {
      if (root.parentNode) {
        root.parentNode.removeChild(root);
      }
    }
  ));

  var lock = createLockLayer(function () {
    root.classList.add('dismissed');
    window.setTimeout(function () {
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
    window.setTimeout(function () {
      if (bootEl.parentNode) {
        bootEl.parentNode.removeChild(bootEl);
      }
    }, 500);
  }
}

function init() {
  var stage = document.getElementById('monitor-stage');
  if (!stage) {
    return;
  }
  stage.appendChild(buildBootScreen());
  // Lock the emulated monitor grid, fit it into the real viewport,
  // and take over the cursor for the whole session.
  watchStage(stage);
  // No cursor until boot finishes: the machine is not usable yet.
  var cursor = createCursor(stage);

  var bootEl = stage.querySelector('.boot-screen');

  window.setTimeout(function () {
    // The bug: logo goes away for good; the spinner blinks off for 0.1s,
    // comes back, then dies at the end.
    bootEl.querySelector('.boot-logo').classList.add('boot-logo-gone');
    var spinnerWrap = bootEl.querySelector('.boot-spinner-wrap');
    spinnerWrap.style.display = 'none';
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
      window.setTimeout(function () {
        spinnerWrap.style.display = '';
      }, BOOT_FLICKER_MS);
    }
  }, BOOT_GLITCH_MS);
  window.setTimeout(function () {
    bootEl.querySelector('.boot-spinner-wrap').style.display = 'none';
  }, BOOT_SPINNER_GONE_MS);
  window.setTimeout(function () {
    showLockScreen(stage, cursor);
    cursor.setBooted(true);
  }, BOOT_LOCK_MS);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
