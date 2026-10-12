import { FILE_SRC } from '../../global/constants.js';

// The "How do you want to open this file?" dialog: the apps that registered for
// this file's type, each with its publisher, the default one ticked, and the
// choice of whether to remember it. Win10 asks this the first time a file
// reaches a shell that has more than one candidate, and again from
// "Choose another app" in the file's menu.

function el(tag, cls, text) {
  var node = document.createElement(tag);
  if (cls) {
    node.className = cls;
  }
  if (text != null) {
    node.textContent = text;
  }
  return node;
}

// opts: { path, name, type, handlers: [{ appId, name, icon, publisher }],
//         defaultAppId, onAccept(appId, remember) }
export function showOpenWithDialog(context, opts) {
  var win = context.createWindow({
    title: 'How do you want to open this file?',
    width: 520,
    height: 440
  });

  var root = el('div', 'exp-openwith');
  var heading = el('div', 'exp-openwith-heading');
  heading.appendChild(el('strong', null, 'How do you want to open this file?'));
  var named = el('div', 'exp-openwith-name');
  var art = el('span', 'exp-openwith-art');
  var img = document.createElement('img');
  img.src = FILE_SRC;
  img.alt = '';
  img.draggable = false;
  art.appendChild(img);
  named.appendChild(art);
  var text = el('span');
  text.appendChild(el('span', 'exp-openwith-file', opts.name || ''));
  if (opts.type) {
    text.appendChild(el('span', 'exp-openwith-type', opts.type));
  }
  named.appendChild(text);
  heading.appendChild(named);
  root.appendChild(heading);

  var list = el('div', 'exp-openwith-list');
  var rows = {};
  var choice = opts.defaultAppId || (opts.handlers[0] && opts.handlers[0].appId) || '';

  opts.handlers.forEach(function (handler) {
    var row = el('button', 'exp-openwith-row');
    row.type = 'button';
    row.setAttribute('role', 'radio');
    var rowArt = el('span', 'exp-openwith-art');
    var rowImg = document.createElement('img');
    rowImg.src = handler.icon || FILE_SRC;
    rowImg.alt = '';
    rowImg.draggable = false;
    rowArt.appendChild(rowImg);
    var label = el('span', 'exp-openwith-label');
    label.appendChild(el('span', 'exp-openwith-app', handler.name));
    label.appendChild(el('span', 'exp-openwith-publisher', handler.publisher));
    row.appendChild(rowArt);
    row.appendChild(label);
    if (handler.appId === opts.defaultAppId) {
      var tag = el('span', 'exp-openwith-default');
      tag.textContent = 'Default';
      row.appendChild(tag);
    }
    row.addEventListener('click', function () {
      choice = handler.appId;
      paint();
    });
    rows[handler.appId] = row;
    list.appendChild(row);
  });
  root.appendChild(list);

  var remember = el('label', 'exp-openwith-remember');
  var box = document.createElement('input');
  box.type = 'checkbox';
  remember.appendChild(box);
  remember.appendChild(el('span', null, 'Always use this app'));
  root.appendChild(remember);

  var actions = el('div', 'exp-openwith-actions');
  var cancel = el('button', 'exp-openwith-btn', 'Cancel');
  cancel.type = 'button';
  cancel.addEventListener('click', function () {
    win.close();
  });
  var open = el('button', 'exp-openwith-btn is-primary', 'OK');
  open.type = 'button';
  actions.appendChild(cancel);
  actions.appendChild(open);
  root.appendChild(actions);

  function paint() {
    Object.keys(rows).forEach(function (id) {
      rows[id].classList.toggle('exp-openwith-row-on', id === choice);
      rows[id].setAttribute('aria-checked', id === choice ? 'true' : 'false');
    });
  }
  paint();

  function accept() {
    if (!choice) {
      return;
    }
    var appId = choice;
    var always = box.checked;
    win.close();
    opts.onAccept(appId, always);
  }

  open.addEventListener('click', accept);
  root.addEventListener('keydown', function (event) {
    // The dialog consumes its own Enter and Escape, so the window's global
    // shortcuts never fire a second time behind it.
    if (event.key === 'Enter') {
      event.preventDefault();
      accept();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      win.close();
    }
  });

  win.body.appendChild(root);
  return win;
}
