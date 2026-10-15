// "Find a setting": the box at the top of the nav pane, and the list of what it
// found.
//
// The box is the shell's own text field (see textfield.js), so it types, takes a
// caret and never raises the phone's keyboard over the desktop - the same reason
// Explorer and Edge use it rather than an <input>.
//
// Results appear *in place of* the nav pane rather than in a panel over it.
// That is what Windows does: the categories are the fallback, and once there is
// something to show, the categories go. It also means there is only ever one
// thing below the box.

import { createTextField } from '../../core/textfield.js';
import { SEARCH_SVG } from './glyphs.js';
import { searchSettings, INDEX } from './catalogue.js';

export function buildFind(ops) {
  var root = document.createElement('div');
  root.className = 'set-find';

  var box = document.createElement('div');
  box.className = 'set-find-box';
  var glass = document.createElement('span');
  glass.className = 'set-find-glass';
  glass.innerHTML = SEARCH_SVG;
  var field = createTextField({
    placeholder: 'Find a setting',
    label: 'Find a setting',
    className: 'set-find-field'
  });
  box.appendChild(glass);
  box.appendChild(field);
  root.appendChild(box);

  var results = document.createElement('div');
  results.className = 'set-find-results';
  results.hidden = true;
  root.appendChild(results);

  var query = '';

  function paint() {
    var hits = searchSettings(INDEX, query, 12);
    results.textContent = '';
    if (!hits.length) {
      // Windows says nothing at all when there is no match rather than drawing
      // an empty list, which is the same thing as saying "no results".
      results.hidden = true;
      return;
    }
    results.hidden = false;
    hits.forEach(function (hit) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'set-find-row';
      if (hit.pageHit) {
        row.classList.add('set-find-row--page');
      }
      var name = document.createElement('span');
      name.className = 'set-find-row-name';
      name.textContent = hit.label;
      row.appendChild(name);
      // Where the setting lives, which is what makes a hit findable: two pages
      // can both have a "Show notifications" and the one you want is the one
      // under Notifications & actions.
      var where = document.createElement('span');
      where.className = 'set-find-row-where';
      where.textContent = hit.pageHit
        ? hit.categoryTitle
        : [hit.categoryTitle, hit.pageTitle, hit.groupTitle].filter(Boolean).join('  ›  ');
      row.appendChild(where);
      row.addEventListener('click', function () {
        ops.navigate(hit.pageId);
        field.value = '';
        query = '';
        ops.onSearchClosed();
      });
      results.appendChild(row);
    });
  }

  field.addEventListener('input', function () {
    query = field.value;
    paint();
    ops.onSearchChanged(!!query.trim());
  });
  field.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter') {
      return;
    }
    // Enter opens the first result, the way it does in Windows.
    var first = results.querySelector('.set-find-row');
    if (first) {
      event.preventDefault();
      event.stopPropagation();
      first.click();
    }
  });

  return {
    el: root,
    field: field,
    results: results,
    refresh: paint,
    isOpen: function () {
      return !!query.trim();
    },
    focus: function () {
      field.focus();
    }
  };
}