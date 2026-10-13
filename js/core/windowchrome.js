// Window chrome: the frame every floating window is built from — titlebar
// with icon, title and caption buttons, the body host, and the eight
// resize grips. The manager owns the state and behaviour; this module only
// builds and reads the DOM.

import {
  CAPT_MIN_SVG,
  CAPT_MAX_SVG,
  CAPT_RESTORE_SVG,
  CAPT_CLOSE_SVG
} from '../global/icons.js';

var RESIZE_ZONES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

function captionButton(svg, label, onClick) {
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'win-cap';
  button.innerHTML = svg;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', function (event) {
    event.stopPropagation();
    onClick();
  });
  return button;
}

// win: { title, icon } — everything else is updated by the manager.
// handlers: onCaption(action), onPress(target), onSystemMenu(x, y) where
// x/y are client coordinates.
export function buildWindowFrame(win, handlers) {
  var el = document.createElement('div');
  el.className = 'win';
  // The emulated desktop never shows the browser menu of its own.
  el.addEventListener('contextmenu', function (event) {
    event.preventDefault();
    event.stopPropagation();
  });

  var titlebar = document.createElement('div');
  titlebar.className = 'win-titlebar';

  if (win.icon) {
    var icon = document.createElement('img');
    icon.className = 'win-icon';
    icon.src = win.icon;
    icon.alt = '';
    icon.draggable = false;
    titlebar.appendChild(icon);
  }

  var title = document.createElement('div');
  title.className = 'win-title';
  title.textContent = win.title;
  titlebar.appendChild(title);

  var caps = document.createElement('div');
  caps.className = 'win-caps';
  var minBtn = captionButton(CAPT_MIN_SVG, 'Minimize', function () {
    handlers.onCaption('minimize');
  });
  var maxBtn = captionButton(CAPT_MAX_SVG, 'Maximize', function () {
    handlers.onCaption('maximize');
  });
  var closeBtn = captionButton(CAPT_CLOSE_SVG, 'Close', function () {
    handlers.onCaption('close');
  });
  minBtn.classList.add('win-min');
  maxBtn.classList.add('win-max');
  closeBtn.classList.add('win-close');
  caps.appendChild(minBtn);
  caps.appendChild(maxBtn);
  caps.appendChild(closeBtn);
  titlebar.appendChild(caps);

  var body = document.createElement('div');
  body.className = 'win-body';

  el.appendChild(titlebar);
  el.appendChild(body);
  RESIZE_ZONES.forEach(function (zone) {
    var grip = document.createElement('div');
    grip.className = 'win-resize win-resize-' + zone;
    grip.dataset.zone = zone;
    el.appendChild(grip);
  });

  // Routed presses (pointer-lock clicks, touch taps) are provisional: the
  // real press right behind them (same gesture) takes over.
  el.addEventListener('mousedown', function (event) {
    if (!event.isTrusted) {
      handlers.onPress(event.target);
    }
  });

  titlebar.addEventListener('dblclick', function (event) {
    var inCaps = event.target && event.target.closest ? event.target.closest('.win-caps') : null;
    if (!inCaps) {
      handlers.onCaption('maximize');
    }
  });

  // Win10's window menu lives on the titlebar. Both input paths land here:
  // a native contextmenu event when the pointer is free, or the routed
  // simcontextmenu event while pointer-locked (the routed event carries the
  // real press position in its detail, since a locked press is retargeted).
  ['contextmenu', 'simcontextmenu'].forEach(function (type) {
    el.addEventListener(type, function (event) {
      var target = event.target;
      var onBar = target && target.closest ? target.closest('.win-titlebar') : null;
      if (!onBar || (target.closest && target.closest('.win-caps'))) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      var point = event.detail && typeof event.detail.clientX === 'number'
        ? { x: event.detail.clientX, y: event.detail.clientY }
        : { x: event.clientX, y: event.clientY };
      handlers.onSystemMenu(point.x, point.y);
    });
  });

  return { el: el, titlebar: titlebar, body: body, maxBtn: maxBtn, title: title };
}
