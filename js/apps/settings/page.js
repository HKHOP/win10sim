// One Settings page, drawn from its declaration.
//
// A page is a title and a run of groups; a group is a heading and a run of
// items. Nothing here decides what a group looks like or what an item is - the
// catalogue said, and controls.js draws. What this file owns is the plumbing
// every control needs: the current value of every key, the one way to write one,
// and the list of controls to put back into step afterwards.

import { buildItem } from './controls.js';

export function buildPage(page, ops) {
  var root = document.createElement('div');
  root.className = 'set-page';

  var title = document.createElement('h1');
  title.className = 'set-title';
  title.textContent = page.title;
  root.appendChild(title);

  // Every control on the page, so a write from anywhere can be reflected here
  // without rebuilding the page out from under the user.
  var syncs = [];
  var repaints = [];
  var disposers = [];

  (page.groups || []).forEach(function (group) {
    var section = document.createElement('section');
    section.className = 'set-group';
    if (group.title) {
      var heading = document.createElement('h2');
      heading.className = 'set-group-title';
      heading.textContent = group.title;
      section.appendChild(heading);
    }
    var items = document.createElement('div');
    items.className = 'set-items';
    (group.items || []).forEach(function (item) {
      var control;
      try {
        control = buildItem(item, ops);
      } catch (err) {
        // One control that cannot be built must not take the page with it: the
        // rest of the settings are still usable, and a gap where one setting
        // should be is better than an empty page.
        control = { el: errorBox(item, err) };
      }
      items.appendChild(control.el);
      if (typeof control.sync === 'function') {
        syncs.push(control);
      }
      if (typeof control.refresh === 'function') {
        // A widget that draws a list answers refresh() rather than sync(): it is
        // rebuilt from what is installed or how full the disk is rather than
        // from one stored value, and a setting changing elsewhere still has to
        // reach it.
        repaints.push(control);
      }
      if (typeof control.dispose === 'function') {
        disposers.push(control.dispose);
      }
    });
    section.appendChild(items);
    root.appendChild(section);
  });

  return {
    el: root,
    // Re-reads every control and redraws every list. Called when a setting
    // changes from somewhere else - the other page that shows it, or the shell
    // acting on it.
    refresh: function () {
      syncs.forEach(function (control) {
        try {
          control.sync();
        } catch (err) {
          // A control that cannot re-read is stale, not broken; the store is
          // still right, which is what matters.
        }
      });
      repaints.forEach(function (control) {
        try {
          control.refresh();
        } catch (err) {
          // Same reasoning: a list that cannot be redrawn is out of date, not
          // wrong about the store.
        }
      });
      if (typeof ops.onPageBuilt === 'function') {
        ops.onPageBuilt(root);
      }
    },
    dispose: function () {
      disposers.forEach(function (fn) {
        try {
          fn();
        } catch (err) {
          // Nothing to do about a disposer that throws; the page is going away.
        }
      });
    }
  };
}

function errorBox(item, err) {
  var box = document.createElement('p');
  box.className = 'set-note set-note--missing';
  box.textContent = '“' + (item.label || item.kind) + '” could not be drawn: ' +
    (err && err.message ? err.message : 'unknown error');
  return box;
}