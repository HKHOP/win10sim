import { createTextField } from '../../core/textfield.js';
// Notepad's dialogs. Win10's classic Notepad opens real top-level dialogs
// (Find, Replace, Go To, Font, About, and its prompts), so each of these is
// built on the same shell: a small window with a title bar, the controls,
// and a button row. The shell owns focus, Enter/Escape and the button
// order, so every dialog behaves the same way.

// A button action receives (close, content): it decides whether the dialog
// stays open (Replace Next) or closes (OK, Find Next).
export function dialogShell(context, opts) {
  var win = context.createWindow({
    title: opts.title,
    width: opts.width,
    height: opts.height
  });

  var form = document.createElement('div');
  form.className = 'np-dialog' + (opts.variant ? ' np-dialog-' + opts.variant : '');

  function close() {
    if (win && win.close) {
      win.close();
    }
  }

  var content = document.createElement('div');
  content.className = 'np-dialog-content';
  form.appendChild(content);

  var row = document.createElement('div');
  row.className = 'np-dialog-buttons';
  var buttons = [];
  (opts.buttons || [{ label: 'OK' }]).forEach(function (spec, index) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'np-dialog-button' + (index === 0 ? ' is-default' : '');
    button.textContent = spec.label;
    button.addEventListener('click', function () {
      if (spec.action) {
        spec.action(close, content);
      } else {
        close();
      }
    });
    row.appendChild(button);
    buttons.push(button);
  });
  form.appendChild(row);

  if (opts.build) {
    opts.build(content, close, buttons);
  }
  win.body.appendChild(form);

  // Escape cancels, Enter confirms, like every Win10 dialog.
  win.body.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Enter' || event.target.tagName === 'BUTTON' || event.target.tagName === 'TEXTAREA') {
      return;
    }
    event.preventDefault();
    buttons[0].click();
  });

  var focusable = content.querySelector('input, select, textarea');
  if (focusable && focusable.focus) {
    focusable.focus();
  }
  return { window: win, close: close, content: content };
}

function field(labelText, input) {
  var row = document.createElement('div');
  row.className = 'np-field-row';
  var label = document.createElement('label');
  label.className = 'np-label';
  label.textContent = labelText;
  row.appendChild(label);
  row.appendChild(input);
  return row;
}

function matchCaseRow() {
  var row = document.createElement('div');
  row.className = 'np-check-row';
  var label = document.createElement('label');
  label.className = 'np-check';
  var box = document.createElement('input');
  box.type = 'checkbox';
  label.appendChild(box);
  label.appendChild(document.createTextNode(' Match case'));
  row.appendChild(label);
  return { row: row, box: box };
}

// Win10's message box: a glyph, a sentence, and a button row.
export function showMessageBox(context, opts) {
  return dialogShell(context, {
    title: opts.title,
    width: opts.width || 380,
    height: opts.height || 160,
    variant: 'message',
    build: function (content) {
      var glyph = document.createElement('span');
      glyph.className = 'np-dialog-icon np-dialog-icon-' + (opts.icon || 'info');
      var text = document.createElement('div');
      text.className = 'np-dialog-text';
      text.textContent = opts.message || '';
      content.appendChild(glyph);
      content.appendChild(text);
    },
    buttons: (opts.buttons || ['OK']).map(function (label) {
      return {
        label: label,
        action: function (close) {
          if (opts.onChoice) {
            opts.onChoice(label);
          }
          close();
        }
      };
    })
  });
}

// Notepad's Find dialog: the text to look for, a Match case box, the
// direction arrows, and Find Next.
export function showFindDialog(context, opts) {
  return dialogShell(context, {
    title: 'Find',
    width: 380,
    height: 172,
    variant: 'find',
    build: function (content, close) {
      var input = createTextField({
        className: 'np-input np-input-grow',
        value: opts.initial || '',
        label: 'Find what'
      });
      content.appendChild(field('Find what:', input));

      var check = matchCaseRow();
      content.appendChild(check.row);

      // Win10 puts the search-direction arrows on the same line.
      var arrows = document.createElement('span');
      arrows.className = 'np-find-arrows';
      ['up', 'down'].forEach(function (dir, index) {
        var arrow = document.createElement('button');
        arrow.type = 'button';
        arrow.className = 'np-arrow' + (index === 1 ? ' is-active' : '');
        arrow.title = index === 0 ? 'Find Up' : 'Find Down';
        arrow.textContent = index === 0 ? '▲' : '▼';
        arrow.addEventListener('click', function () {
          var all = arrows.querySelectorAll('.np-arrow');
          for (var i = 0; i < all.length; i++) {
            all[i].classList.remove('is-active');
          }
          arrow.classList.add('is-active');
          content.__up = index === 0;
        });
        arrows.appendChild(arrow);
      });
      check.row.appendChild(arrows);

      content.__findNext = function () {
        if (input.value) {
          opts.onFind(input.value, check.box.checked, content.__up === true);
        }
      };
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          content.__findNext();
        }
      });
    },
    buttons: [
      { label: 'Find Next', action: function (close, content) { content.__findNext(); close(); } },
      { label: 'Cancel' }
    ]
  });
}

// Replace dialog: Find what / Replace with, Match case, Replace Next and
// Replace All. Both replace actions leave the dialog standing, like Win10.
export function showReplaceDialog(context, opts) {
  return dialogShell(context, {
    title: 'Replace',
    width: 410,
    height: 210,
    variant: 'replace',
    build: function (content) {
      var findInput = createTextField({
        className: 'np-input np-input-grow',
        value: opts.initial || '',
        label: 'Find what'
      });
      content.appendChild(field('Find what:', findInput));

      var withInput = createTextField({
        className: 'np-input np-input-grow',
        value: opts.replacement || '',
        label: 'Replace with'
      });
      content.appendChild(field('Replace with:', withInput));

      var check = matchCaseRow();
      content.appendChild(check.row);

      content.__findNext = function () {
        if (findInput.value) {
          opts.onFind(findInput.value, check.box.checked, false);
        }
      };
      content.__replaceNext = function () {
        if (findInput.value) {
          opts.onReplace(findInput.value, withInput.value, check.box.checked, false);
        }
      };
      content.__replaceAll = function () {
        if (findInput.value) {
          opts.onReplace(findInput.value, withInput.value, check.box.checked, true);
        }
      };
      findInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          content.__findNext();
        }
      });
      withInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          content.__replaceNext();
        }
      });
    },
    buttons: [
      { label: 'Replace Next', action: function (close, content) { content.__replaceNext(); } },
      { label: 'Replace All', action: function (close, content) { content.__replaceAll(); } },
      { label: 'Cancel' }
    ]
  });
}

// Go To: move the caret to a line number.
export function showGoToDialog(context, opts) {
  return dialogShell(context, {
    title: 'Go To',
    width: 320,
    height: 148,
    variant: 'goto',
    build: function (content) {
      var input = createTextField({
        className: 'np-input np-input-number',
        value: String(opts.initial || 1),
        label: 'Line number'
      });
      content.appendChild(field('Line number:', input));
      content.__go = function () {
        var line = parseInt(input.value, 10);
        if (line > 0) {
          opts.onGoTo(line);
          return true;
        }
        return false;
      };
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (content.__go()) {
            close();
          }
        }
      });
    },
    buttons: [
      { label: 'Go To', action: function (close, content) { if (content.__go()) { close(); } } },
      { label: 'Cancel' }
    ]
  });
}

// Format ▸ Font: family and size pickers with a live preview, like the
// classic dialog.
export function showFontDialog(context, opts) {
  var fonts = ['Consolas', 'Courier New', 'Lucida Console', 'Arial', 'Tahoma'];
  var sizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28'];
  return dialogShell(context, {
    title: 'Font',
    width: 380,
    height: 300,
    variant: 'font',
    build: function (content) {
      var fontSelect = document.createElement('select');
      fontSelect.className = 'np-select';
      fonts.forEach(function (name) {
        var option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        fontSelect.appendChild(option);
      });
      fontSelect.value = opts.font || fonts[0];

      var sizeSelect = document.createElement('select');
      sizeSelect.className = 'np-select np-select-narrow';
      sizes.forEach(function (size) {
        var option = document.createElement('option');
        option.value = size;
        option.textContent = size;
        sizeSelect.appendChild(option);
      });
      sizeSelect.value = String(opts.size || 14);

      var preview = document.createElement('div');
      preview.className = 'np-font-preview';
      function refresh() {
        preview.style.fontFamily = fontSelect.value;
        preview.style.fontSize = sizeSelect.value + 'px';
      }
      fontSelect.addEventListener('change', refresh);
      sizeSelect.addEventListener('change', refresh);
      refresh();

      var row = document.createElement('div');
      row.className = 'np-field-row';
      row.appendChild(textLabel('Font:'));
      row.appendChild(fontSelect);
      row.appendChild(textLabel('Font size:'));
      row.appendChild(sizeSelect);
      content.appendChild(row);
      content.appendChild(preview);

      content.__apply = function () {
        opts.onFont(fontSelect.value, parseInt(sizeSelect.value, 10));
      };
    },
    buttons: [
      { label: 'OK', action: function (close, content) { content.__apply(); close(); } },
      { label: 'Cancel' }
    ]
  });
}

function textLabel(text) {
  var label = document.createElement('label');
  label.className = 'np-label';
  label.textContent = text;
  return label;
}

// About Notepad: the standard Win10 credits box.
export function showAboutDialog(context, opts) {
  return dialogShell(context, {
    title: 'About Notepad',
    width: 400,
    height: 270,
    variant: 'about',
    build: function (content) {
      var mark = document.createElement('img');
      mark.className = 'np-about-mark';
      mark.src = opts.icon;
      mark.alt = '';
      mark.draggable = false;
      content.appendChild(mark);
      content.appendChild(textBlock('np-about-title', 'Microsoft® Windows® Operating System'));
      content.appendChild(textBlock('np-about-name', 'Microsoft Notepad'));
      content.appendChild(textBlock('np-about-version', 'Version 10.0.19042.525'));
      content.appendChild(textBlock('np-about-copy', 'Copyright © 1985-2021 Microsoft Corp.'));
      content.appendChild(textBlock('np-about-legal', 'This product is licensed to:'));
      content.appendChild(textBlock('np-about-user', opts.user || 'User'));
    },
    buttons: [{ label: 'OK' }]
  });
}

function textBlock(className, text) {
  var el = document.createElement('div');
  el.className = className;
  el.textContent = text;
  return el;
}