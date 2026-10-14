import { KEYBOARD_SVG, GRIP_SVG } from '../global/icons.js';
import { TASKBAR_HEIGHT_PX } from '../global/constants.js';
import { isHandheld } from './sitechrome.js';
import { LETTERS_LAYER, SYMBOLS_LAYER } from './keyboard-layout.js';
import { pressKey } from './textfield-keys.js';
import { activeField } from './textfield.js';
import { stageScale } from './stage.js';
import { registerChromeNode } from './cursor.js';

// The virtual keyboard.
//
// A phone has no hardware keyboard, and the keyboard the browser puts up covers
// half the emulated monitor and looks nothing like Windows. This one is the
// Windows touch keyboard: the same two pages, the same modifiers, the same
// space bar and return, drawn in the shell's own key shapes - and it is page
// chrome rather than OS UI, so it sits outside the capture layer and the
// emulated cursor can never press it (see cursor.js).
//
// It is three things at once, which is why it is built here rather than in the
// shell: a toggle beside the fullscreen button, a panel that can be dragged
// anywhere on the screen by its grip bar, and a source of key presses for
// whichever field the emulated cursor has the caret in.
//
// It has no business raising a keyboard of its own: the fields it types into are
// the shell's own (see textfield.js) rather than the browser's, so there is
// nothing left for the browser to offer. What a key means is the field's
// business - pressKey sends it there and the field decides.
//
// Which keys there are is keyboard-layout.js; what each one does once pressed is
// textfield-keys.js.

var CHROME_CLASS = 'site-chrome';
var PANEL_CLASS = 'sim-keyboard';

// Backspace repeats while it is held, the way a hardware key does: the first
// repeat is slower than the rest, so a held backspace deletes a run of
// characters rather than everything on the line at once.
var REPEAT_DELAY_MS = 420;
var REPEAT_EVERY_MS = 55;

export function createVirtualKeyboard() {
  // A machine with a keyboard under the hands has no use for one drawn on the
  // glass, and the same question decides the fullscreen button.
  if (!isHandheld()) {
    return null;
  }

  var layer = LETTERS_LAYER;
  // Sticky modifiers: a tap latches one on, a second tap takes it off. Shift
  // is the exception - it lets go as soon as it has typed something, which is
  // what a phone keyboard does because there is no way to feel it latched.
  var mods = { shift: false, ctrl: false, alt: false };

  var panel = document.createElement('div');
  panel.className = PANEL_CLASS;
  panel.hidden = true;
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'Virtual keyboard');

  var grip = document.createElement('div');
  grip.className = 'kbd-grip';
  grip.setAttribute('aria-label', 'Move the keyboard');
  grip.innerHTML = GRIP_SVG;
  panel.appendChild(grip);

  var rows = document.createElement('div');
  rows.className = 'kbd-rows';
  panel.appendChild(rows);

  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = CHROME_CLASS + ' site-chrome-keyboard';
  toggle.setAttribute('aria-label', 'Virtual keyboard');
  toggle.setAttribute('aria-pressed', 'false');
  toggle.innerHTML = KEYBOARD_SVG;
  document.body.appendChild(toggle);
  // Both the toggle and the panel are the device's own furniture, not the
  // emulated screen, so the emulated cursor hit-tests past them rather than
  // pressing a key it was never pointed at (see cursor.js).
  registerChromeNode(toggle);

  var repeatTimer = null;
  var repeatEvery = null;
  // The click that follows a backspace press, which must not type a second
  // character for the same press.
  var swallowedClick = null;

  // --- keys ---------------------------------------------------------------

  function buildRow(specs) {
    var row = document.createElement('div');
    row.className = 'kbd-row';
    specs.forEach(function (spec) {
      row.appendChild(buildKey(spec));
    });
    return row;
  }

  function buildKey(spec) {
    var key = document.createElement('button');
    key.type = 'button';
    // A key that types shows what it types; the modifiers show their name, and
    // the space bar shows nothing at all, as it does in Windows.
    key.className = 'kbd-key kbd-key--' + spec.kind;
    if (spec.weight && spec.weight !== 1) {
      key.style.flexGrow = String(spec.weight);
    }
    key.textContent = spec.label;
    if (!spec.label) {
      key.setAttribute('aria-label', spec.kind);
    }
    if (spec.kind === 'layer') {
      key.setAttribute('aria-label', spec.key === 'letters' ? 'Letters' : 'Symbols');
    }

    // A key is a button, and a button takes focus when it is pressed - which
    // would pull the caret out of the field being typed into and collapse its
    // selection. Declining the press's default is what stops that; the click
    // still comes, so the key still works.
    key.addEventListener('pointerdown', function (event) {
      event.preventDefault();
      if (spec.kind === 'backspace') {
        // A held key repeats from the moment it goes down, the way a hardware
        // key does - which is why this one is not left to the click.
        swallowedClick = key;
        press(spec);
        startRepeat(spec, key);
      }
    });

    // The press is delivered on click rather than on pointerdown, so a finger
    // that slides off the key before lifting does not type into it.
    key.addEventListener('click', function () {
      if (swallowedClick === key) {
        // Backspace already deleted on the way down and repeated while held.
        swallowedClick = null;
        return;
      }
      press(spec);
    });
    if (spec.kind === 'backspace') {
      stopRepeatOn(key);
    }
    return key;
  }

  // Send one key to whichever field has the caret. With nothing to type into the
  // key still goes somewhere: to the body, where the shell's own shortcuts hear
  // it, so Escape closes a menu and Alt+Space opens a window's menu from the
  // keyboard too.
  function press(spec) {
    var field = activeField();
    pressKey(spec, field || document.body, mods);

    // Shift is one-shot: it has typed its one character and lets go, so the
    // next key is a lowercase one without a second tap to clear it.
    if (spec.kind === 'char' && mods.shift) {
      mods.shift = false;
      paintModifiers();
    }
  }

  function activate(spec) {
    if (spec.kind === 'layer') {
      setLayer(spec.key === 'letters' ? LETTERS_LAYER : SYMBOLS_LAYER);
      return;
    }
    if (spec.kind === 'shift' || spec.kind === 'ctrl' || spec.kind === 'alt') {
      mods[spec.kind] = !mods[spec.kind];
      paintModifiers();
      return;
    }
    press(spec);
  }

  function setLayer(next) {
    layer = next;
    rows.textContent = '';
    layer.rows.forEach(function (specs) {
      rows.appendChild(buildRow(specs));
    });
    // A symbol page reached with shift held would look like a mistake.
    mods.shift = false;
    paintModifiers();
  }

  function paintModifiers() {
    rows.querySelectorAll('.kbd-key--shift, .kbd-key--ctrl, .kbd-key--alt').forEach(function (key) {
      var kind = key.className.indexOf('--ctrl') >= 0 ? 'ctrl'
        : (key.className.indexOf('--alt') >= 0 ? 'alt' : 'shift');
      key.classList.toggle('is-on', !!mods[kind]);
    });
  }

  // --- held keys ----------------------------------------------------------

  function startRepeat(spec, keyEl) {
    stopRepeat();
    keyEl.classList.add('is-down');
    repeatTimer = setTimeout(function () {
      repeatEvery = setInterval(function () {
        press(spec);
      }, REPEAT_EVERY_MS);
    }, REPEAT_DELAY_MS);
  }

  function stopRepeat() {
    if (repeatTimer) {
      clearTimeout(repeatTimer);
      repeatTimer = null;
    }
    if (repeatEvery) {
      clearInterval(repeatEvery);
      repeatEvery = null;
    }
  }

  function stopRepeatOn(node) {
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (type) {
      node.addEventListener(type, function () {
        stopRepeat();
        node.classList.remove('is-down');
      });
    });
  }

  // --- showing, hiding, and where it sits ---------------------------------

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-pressed', open ? 'true' : 'false');
    toggle.classList.toggle('is-on', open);
    if (open) {
      place();
      return;
    }
    // A key that was repeating when the keyboard went away must not keep
    // deleting into a field nobody can see.
    stopRepeat();
  }

  // The emulated monitor is scaled to fit the viewport, so the taskbar's height
  // on this page is its height in emulated pixels times the stage's scale. The
  // keyboard opens sitting on top of it, the way a keyboard sits on a desk
  // rather than over the trackpad.
  function place() {
    var stage = document.getElementById('monitor-stage');
    var taskbar = TASKBAR_HEIGHT_PX * stageScale(stage);
    panel.style.top = '';
    panel.style.left = '';
    panel.style.bottom = Math.max(8, Math.round(taskbar)) + 'px';
  }

  toggle.addEventListener('click', function (event) {
    // The browser's button, not the emulated OS's: nothing here is routed.
    event.stopPropagation();
    setOpen(panel.hidden);
  });

  // --- moving it ----------------------------------------------------------

  var dragging = null;

  // How much of the panel has to stay on screen for it to be worth keeping.
  // A panel as wide as the screen has nowhere to move sideways *within* the
  // screen, and clamping it to that range pins it to the left edge - which looks
  // exactly like a drag that does not work. So it is allowed to travel as far as
  // it can while still keeping a strip of itself to grab.
  var GRAB_STRIP_PX = 56;

  grip.addEventListener('pointerdown', function (event) {
    event.preventDefault();
    event.stopPropagation();
    if (grip.setPointerCapture) {
      grip.setPointerCapture(event.pointerId);
    }
    var rect = panel.getBoundingClientRect();
    dragging = {
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top
    };
    // Measuring from a fixed bottom edge, so the panel is measured from the top
    // for as long as it is being dragged. It is also now positioned by hand, and
    // keeps its own left and top from here on rather than the centring rule the
    // docked panel uses - which would slide it half its own width to the left.
    panel.style.top = Math.round(rect.top) + 'px';
    panel.style.bottom = 'auto';
    panel.classList.add('is-placed');
    panel.classList.add('is-moving');
  });

  grip.addEventListener('pointermove', function (event) {
    if (!dragging) {
      return;
    }
    event.preventDefault();
    var rect = panel.getBoundingClientRect();
    var left = clamp(
      event.clientX - dragging.dx,
      GRAB_STRIP_PX - rect.width,
      window.innerWidth - GRAB_STRIP_PX
    );
    var top = clamp(event.clientY - dragging.dy, 0, window.innerHeight - rect.height);
    panel.style.left = Math.round(left) + 'px';
    panel.style.top = Math.round(top) + 'px';
  });

  function endDrag(event) {
    if (!dragging) {
      return;
    }
    dragging = null;
    panel.classList.remove('is-moving');
    if (event && grip.releasePointerCapture && event.pointerId != null) {
      try {
        grip.releasePointerCapture(event.pointerId);
      } catch (err) {
        // Already released.
      }
    }
  }

  grip.addEventListener('pointerup', endDrag);
  grip.addEventListener('pointercancel', endDrag);

  function clamp(value, low, high) {
    if (high < low) {
      // A panel wider than the viewport still has to be on screen somewhere.
      return low;
    }
    return Math.max(low, Math.min(high, value));
  }

  // A rotation or a resized browser can leave the keyboard off screen or off the
  // bottom edge; it is put back on its feet rather than left where it was.
  window.addEventListener('resize', function () {
    if (panel.hidden) {
      return;
    }
    if (panel.style.bottom !== 'auto') {
      place();
      return;
    }
    var rect = panel.getBoundingClientRect();
    if (rect.top < 0 || rect.left < 0 ||
        rect.top + rect.height > window.innerHeight ||
        rect.left + rect.width > window.innerWidth) {
      panel.style.left = '';
      panel.style.bottom = '';
      panel.style.top = '';
      place();
    }
  });

  setLayer(LETTERS_LAYER);
  document.body.appendChild(panel);
  registerChromeNode(panel);

  return {
    open: function () { setOpen(true); },
    close: function () { setOpen(false); },
    isOpen: function () {
      return !panel.hidden;
    },
    element: panel
  };
}