// The interface a custom text field presents, which is the one an <input> has.
//
// Everything in the shell that uses a text box was written against the browser's
// own controls: it reads .value, asks where the caret is with
// .selectionStart, moves it with .setSelectionRange(), calls .focus() and
// .select(), sets .placeholder and .type, and reads .scrollTop when it wants to
// bring a match into view. All of that is declared here, in one place, so the
// field itself is not a wall of property definitions - and so that what the apps
// are allowed to ask for is written down somewhere.
//
// This module is deliberately mechanical: it holds no behaviour of its own, only
// the shape. The behaviour lives in textfield.js (what the field is) and
// textfield-keys.js (what each key does).

export function applyInputApi(host, ops) {
  Object.defineProperties(host, {
    value: {
      get: function () { return ops.state.value; },
      set: function (next) {
        ops.state.value = next == null ? '' : String(next);
        // Setting the text leaves the caret at the end of it, as a real field
        // does. The callers that want it elsewhere ask for one straight after.
        ops.state.start = ops.state.anchor = ops.state.end = ops.state.value.length;
        ops.paint();
      }
    },
    selectionStart: {
      get: function () { return ops.state.start; },
      set: function (at) { ops.setSelection(at, at); }
    },
    selectionEnd: {
      get: function () { return ops.state.end; },
      set: function (at) {
        ops.state.end = at;
        ops.clamp();
        ops.paint();
      }
    },
    scrollTop: {
      get: function () { return ops.view.scrollTop; },
      set: function (at) { ops.view.setScroll(ops.view.scrollLeft, at); }
    },
    scrollLeft: {
      get: function () { return ops.view.scrollLeft; },
      set: function (at) { ops.view.setScroll(at, ops.view.scrollTop); }
    },
    scrollHeight: {
      get: function () { return ops.view.contentHeight; }
    },
    scrollWidth: {
      get: function () { return ops.view.contentWidth; }
    },
    placeholder: {
      get: function () { return ops.placeholder; },
      set: function (text) {
        ops.placeholder = text || '';
        ops.paint();
      }
    },
    readOnly: {
      get: function () { return ops.state.readOnly; },
      set: function (on) {
        ops.state.readOnly = !!on;
        ops.paint();
      }
    },
    disabled: {
      get: function () { return ops.state.disabled; },
      set: function (on) {
        ops.state.disabled = !!on;
        host.setAttribute('tabindex', on ? -1 : 0);
        ops.paint();
      }
    },
    wrap: {
      get: function () { return ops.multiline ? ops.wrap : 'off'; },
      set: function (next) {
        ops.wrap = next === 'off' ? 'off' : 'soft';
        ops.paint();
      }
    },
    spellcheck: {
      // There is no spell checker here, but the old control had the property
      // and the code that sets it still does.
      get: function () { return false; },
      set: function () {}
    },
    type: {
      get: function () { return ops.type(); },
      set: function (next) {
        // Only the mask changes at runtime, and only between showing the
        // characters and showing bullets - which is what the sign-in screen's
        // show-password button asks for.
        ops.setPassword(next === 'password');
      }
    }
  });

  host.setSelectionRange = function (start, end) {
    ops.setSelection(start, end == null ? start : end);
  };
  host.select = function () {
    ops.setSelection(0, ops.state.value.length);
  };
  // Focusing gives the field the document's focus, which is what the apps and
  // the desktop's own keyboard rely on. Keeping the caret flag here means the
  // keyboard can find the field even while its own buttons hold the focus.
  //
  // The element's own focus() and blur() are captured before they are replaced
  // and called through, rather than looked up on HTMLElement.prototype: a field
  // is a div, and this is the div's focus, not a window's idea of one.
  host.focus = function (options) {
    ops.nativeFocus.call(host, options);
    if (!ops.state.disabled) {
      host.hasCaret = true;
      ops.keepCaretVisible();
    }
  };
  host.blur = function () {
    ops.nativeBlur.call(host);
    host.hasCaret = false;
  };
  host.insertText = ops.insertText;
  host.execCommand = ops.execCommand;
  host.markClosed = ops.markClosed;
}