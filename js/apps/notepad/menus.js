import { showContextMenu } from '../../core/contextmenu.js';

// Notepad's menu bar (File / Edit / Format / View / Help). Each top-level
// menu opens the same popup the rest of the shell uses, anchored under the
// bar button, and every entry maps to a command the editor exposes.
//
// `checkedFor` names the editor state a tick reflects, `disabledFor` the
// state that greys an entry out; both are resolved when the menu opens, so
// the menus always show the editor's real condition.

var MENUS = [
  { label: 'File', id: 'file', items: [
    { label: 'New', shortcut: 'Ctrl+N', command: 'newFile' },
    { label: 'Open...', shortcut: 'Ctrl+O', command: 'open' },
    { label: 'Save', shortcut: 'Ctrl+S', command: 'save' },
    { label: 'Save As...', shortcut: 'Ctrl+Shift+S', command: 'saveAs' },
    { separator: true },
    { label: 'Page Setup...', command: 'pageSetup' },
    { label: 'Print...', shortcut: 'Ctrl+P', command: 'print' },
    { separator: true },
    { label: 'Recent documents', submenu: 'recent' },
    { separator: true },
    { label: 'Exit', command: 'exit' }
  ] },
  { label: 'Edit', id: 'edit', items: [
    { label: 'Undo', shortcut: 'Ctrl+Z', command: 'undo' },
    { separator: true },
    { label: 'Cut', shortcut: 'Ctrl+X', command: 'cut' },
    { label: 'Copy', shortcut: 'Ctrl+C', command: 'copy' },
    { label: 'Paste', shortcut: 'Ctrl+V', command: 'paste' },
    { label: 'Delete', shortcut: 'Del', command: 'delete' },
    { separator: true },
    { label: 'Find...', shortcut: 'Ctrl+F', command: 'find' },
    { label: 'Find Next', shortcut: 'F3', command: 'findNext' },
    { label: 'Replace...', shortcut: 'Ctrl+H', command: 'replace' },
    { label: 'Go To...', shortcut: 'Ctrl+G', command: 'goTo' },
    { separator: true },
    { label: 'Select All', shortcut: 'Ctrl+A', command: 'selectAll' },
    { label: 'Time/Date', shortcut: 'F5', command: 'timeDate' }
  ] },
  { label: 'Format', id: 'format', items: [
    { label: 'Word Wrap', shortcut: 'Alt+Z', command: 'toggleWordWrap', checkedFor: 'wordWrap' },
    { label: 'Font...', command: 'font' }
  ] },
  { label: 'View', id: 'view', items: [
    { label: 'Status Bar', shortcut: 'F4', command: 'toggleStatusBar', checkedFor: 'statusBar' },
    { separator: true },
    { label: 'Zoom', submenu: [
      { label: 'Zoom In', shortcut: 'Ctrl++', command: 'zoomIn' },
      { label: 'Zoom Out', shortcut: 'Ctrl+-', command: 'zoomOut' },
      { label: 'Restore Default Zoom', shortcut: 'Ctrl+0', command: 'zoomReset' },
      { separator: true },
      { label: '100%', command: 'zoom100', checkedFor: 'zoom100' },
      { label: '200%', command: 'zoom200', checkedFor: 'zoom200' },
      { label: '400%', command: 'zoom400', checkedFor: 'zoom400' },
      { label: '500%', command: 'zoom500', checkedFor: 'zoom500' }
    ] }
  ] },
  { label: 'Help', id: 'help', items: [
    { label: 'View Help', command: 'viewHelp' },
    { separator: true },
    { label: 'About Notepad', command: 'about' }
  ] }
];

function resolve(item, api) {
  if (item.separator) {
    return { separator: true };
  }
  if (item.submenu === 'recent') {
    var recent = api.getRecent();
    if (!recent.length) {
      return { label: '(no recent files)', disabled: true };
    }
    return {
      label: 'Recent documents',
      submenu: recent.map(function (path) {
        return runnable({ label: path, command: 'openRecent', arg: path }, api);
      })
    };
  }
  if (item.submenu) {
    return {
      label: item.label,
      submenu: item.submenu.filter(function (child) {
        return !child.separator;
      }).map(function (child) {
        var entry = runnable(child, api);
        entry.checked = child.checkedFor ? api.isChecked(child.checkedFor) : false;
        return entry;
      })
    };
  }
  return runnable(item, api);
}

// The popup runs an entry's action, so each menu item carries the call back
// into the editor's command table.
function runnable(item, api) {
  return {
    label: item.label,
    shortcut: item.shortcut,
    checked: item.checkedFor ? api.isChecked(item.checkedFor) : false,
    disabled: item.command ? api.isDisabled(item.command) === true : false,
    action: item.command ? function () { api.run(item.command, item.arg); } : undefined
  };
}

export function buildMenuBar(api) {
  var bar = document.createElement('div');
  bar.className = 'np-menubar';
  bar.setAttribute('role', 'menubar');

  MENUS.forEach(function (menu) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'np-menubar-item';
    button.textContent = menu.label;
    button.dataset.menu = menu.id;

    function openMenu() {
      var rect = button.getBoundingClientRect();
      showContextMenu(rect.left, rect.bottom - 3, menu.items.map(function (item) {
        return resolve(item, api);
      }));
    }

    button.addEventListener('click', function (event) {
      event.stopPropagation();
      openMenu();
    });
    // Keep a press in the bar from reaching the outside-press closers.
    button.addEventListener('mousedown', function (event) {
      event.stopPropagation();
    });
    bar.appendChild(button);
  });

  return bar;
}

export { MENUS };