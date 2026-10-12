// The shell's message box: glyph on the left, text on the right, buttons along
// the bottom, the way Windows puts a dialog in front of you. It was Explorer's
// own; it belongs to the shell, because the desktop needs it too (a shortcut
// whose target has gone) and an app may not borrow another app's dialogs.
//
// context is anything with a createWindow, which is what the app launcher hands
// an app and what the desktop builds for itself.

var ERROR_SVG =
  '<svg viewBox="0 0 32 32" aria-hidden="true">' +
  '<circle cx="16" cy="16" r="13" fill="#e81123"/>' +
  '<path d="M11 11l10 10M21 11L11 21" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
  '</svg>';

var INFO_SVG =
  '<svg viewBox="0 0 32 32" aria-hidden="true">' +
  '<circle cx="16" cy="16" r="13" fill="#0078d7"/>' +
  '<path d="M16 8v11" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
  '<circle cx="16" cy="23.5" r="2" fill="#fff"/>' +
  '</svg>';

function el(tag, cls, html) {
  var node = document.createElement(tag);
  if (cls) {
    node.className = cls;
  }
  if (html != null) {
    node.innerHTML = html;
  }
  return node;
}

export function showMessageBox(context, opts) {
  var options = opts || {};
  var dlg = context.createWindow({
    title: options.title || 'File Explorer',
    icon: options.icon || '',
    width: options.width || 440,
    height: options.height || 176
  });
  var box = el('div', 'exp-msgbox');
  var glyph = el('span', 'exp-msgbox-icon');
  glyph.innerHTML = options.info ? INFO_SVG : ERROR_SVG;
  var msg = el('div', 'exp-msgbox-text');
  msg.textContent = options.message || '';
  var actions = el('div', 'exp-msgbox-actions');
  (options.buttons || [{ label: 'OK' }]).forEach(function (spec) {
    var btn = el('button', 'exp-msgbox-btn' + (spec.primary ? ' is-primary' : ''), spec.label);
    btn.type = 'button';
    btn.addEventListener('click', function () {
      dlg.close();
      if (spec.action) {
        spec.action();
      }
    });
    actions.appendChild(btn);
  });
  box.appendChild(glyph);
  box.appendChild(msg);
  box.appendChild(actions);
  dlg.body.appendChild(box);
  return dlg;
}
