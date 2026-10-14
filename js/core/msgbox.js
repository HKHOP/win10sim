import { openPopup } from './popup.js';
import { focusedWindowId } from './windowmanager.js';

// The shell's message box: glyph on the left, text on the right, buttons along
// the bottom, the way Windows puts a dialog in front of you.
//
// It was Explorer's own; it belongs to the shell, because the desktop needs it
// too (a shortcut whose target has gone) and an app may not borrow another
// app's dialogs. It is now a popup rather than a hand-built window, so the
// glyph, the buttons and the Enter/Escape handling are the same ones every
// other dialog gets.
//
// context is anything with a createWindow - what the app launcher hands an app,
// and what the desktop builds for itself.

export function showMessageBox(context, opts) {
  var options = opts || {};
  var buttons = options.buttons || [{ label: 'OK', primary: true }];

  // A message box belongs to the window that raised it - Explorer's when it is
  // Explorer saying something - so that window cannot come up over the box, and
  // so the buttons it is offering stay pressable.
  return openPopup(context, {
    title: options.title || 'File Explorer',
    icon: options.icon || '',
    width: options.width || 440,
    // Win10 picks the glyph by what it has to say: a red disc for something
    // that went wrong, a blue one for a note.
    glyph: options.info ? 'info' : 'error',
    body: options.message || '',
    behind: !!options.behind,
    buttons: buttons.map(function (button, index) {
      return {
        label: button.label,
        value: 'b' + index,
        primary: !!button.primary
      };
    }),
    onSubmit: function (value, values, popup) {
      // A caller's own button behaviour runs once the dialog is gone, which is
      // when the old hand-built box ran it.
      var chosen = buttons[Number(String(value).slice(1))];
      if (chosen && chosen.action) {
        popup.close();
        chosen.action();
      }
      return false;
    }
  }, options.ownerId !== undefined ? options.ownerId : focusedWindowId());
}
