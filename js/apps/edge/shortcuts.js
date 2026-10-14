// Edge's keyboard shortcuts, in one place.
//
// They are Edge's own - Ctrl+T for a new tab, Ctrl+H for history, Alt+Left to go
// back - and they only apply while one of this browser's windows has the focus,
// because the keydown is heard by the document and every window is listening.

export function installEdgeShortcuts(root, actions) {
  document.addEventListener('keydown', function (event) {
    if (!root.closest('.win-focused')) {
      return;
    }
    var ctrl = event.ctrlKey || event.metaKey;
    var key = (event.key || '').toLowerCase();

    if (event.key === 'Escape') {
      // A dialog that is open consumes Escape itself, so reaching here means
      // there is none.
      if (actions.dismiss()) {
        event.preventDefault();
      }
      return;
    }
    if (ctrl && !event.shiftKey && key === 't') {
      actions.newTab();
    } else if (ctrl && !event.shiftKey && key === 'n') {
      actions.newWindow();
    } else if (ctrl && event.shiftKey && key === 'n') {
      actions.inPrivate();
    } else if (ctrl && !event.shiftKey && key === 'h') {
      actions.history();
    } else if (ctrl && !event.shiftKey && key === 'j') {
      actions.downloads();
    } else if (ctrl && !event.shiftKey && key === 'f') {
      actions.find();
    } else if (ctrl && !event.shiftKey && key === 'd') {
      actions.favorite();
    } else if (ctrl && !event.shiftKey && key === 'p') {
      actions.print();
    } else if (ctrl && event.shiftKey && key === 's') {
      actions.screenshot();
    } else if (ctrl && event.shiftKey && key === 'o') {
      actions.favorites();
    } else if (event.key === 'F5') {
      actions.reload();
    } else if (event.altKey && event.key === 'ArrowLeft') {
      actions.back();
    } else if (event.altKey && event.key === 'ArrowRight') {
      actions.forward();
    } else if (event.altKey && key === 'f') {
      actions.menu();
    } else {
      return;
    }
    event.preventDefault();
  });
}