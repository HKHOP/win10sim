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
      var chosen = buttons[Number(String(value).slice(1))];
      // Only a button that brings behaviour of its own is handled here. Every
      // other button - the plain OK, Cancel, Continue of a message that has
      // nothing to do but be read - is answered by popup.js closing the box,
      // which is what returning true means. Refusing the close here is what a
      // button has to do to keep a validating dialog up, and a message box has
      // nothing to validate: refusing every plain button left OK, Cancel and
      // Continue silent, so only the caption buttons could get a person out.
      if (!chosen || !chosen.action) {
        return true;
      }
      // A caller's own button behaviour runs once the dialog is gone, which is
      // when the old hand-built box ran it.
      popup.close();
      chosen.action();
      return false;
    }
  }, options.ownerId !== undefined ? options.ownerId : focusedWindowId());
}
