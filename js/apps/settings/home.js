// The Settings home screen: the heading, the search box, and the grid of
// categories.
//
// Win10 build 1903 opens Settings on this and nowhere else - there is no other
// landing page - so it is a real page rather than a stub, and the back button is
// disabled while it is showing because there is nowhere behind it to go.

import { glyphFor } from './glyphmap.js';
import { CATEGORIES, HOME_PAGE_ID } from './catalogue.js';
import { HOME_SVG } from './glyphs.js';
import { prefersReducedMotion } from '../../core/motion.js';

export function buildHome(ops) {
  var root = document.createElement('div');
  root.className = 'set-home';

  var heading = document.createElement('h1');
  heading.className = 'set-home-title';
  heading.textContent = 'Windows Settings';
  root.appendChild(heading);

  // The search box belongs to the shell, not here: it is in the nav pane on
  // every page and searches the same catalogue from all of them. The shell
  // passes its own element in so there is one box rather than two.
  var slot = document.createElement('div');
  slot.className = 'set-home-search';
  root.appendChild(slot);

  var grid = document.createElement('div');
  grid.className = 'set-home-grid';
  CATEGORIES.forEach(function (category) {
    grid.appendChild(categoryTile(category, ops));
  });
  root.appendChild(grid);

  return {
    el: root,
    searchSlot: slot,
    // The home screen has no row in the nav pane, so Home is marked as current
    // by having no row marked at all - which is what Windows does.
    isHome: true,
    pageId: HOME_PAGE_ID
  };
}

function categoryTile(category, ops) {
  var tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'set-tile';

  var art = document.createElement('span');
  art.className = 'set-tile-art';
  art.innerHTML = glyphFor(category.glyph);
  tile.appendChild(art);

  var body = document.createElement('span');
  body.className = 'set-tile-body';
  var name = document.createElement('span');
  name.className = 'set-tile-name';
  name.textContent = category.title;
  body.appendChild(name);
  var blurb = document.createElement('span');
  blurb.className = 'set-tile-blurb';
  blurb.textContent = category.blurb || '';
  body.appendChild(blurb);
  tile.appendChild(body);

  tile.addEventListener('click', function () {
    // A home-only tile names where it goes, because it has no pages of its own
    // in the nav; everything else opens its first page.
    ops.navigate(category.goto || (category.pages && category.pages[0] && category.pages[0].id));
  });
  return tile;
}

// The nav pane: Home, the search box, and the pages of the category you are in.
//
// It is scoped to one category rather than listing all of Settings, and that is
// what Windows does: on Personalization > Start the pane holds Home, the box and
// the eight Personalization pages, and nothing else. Listing every category at
// once would be a Start-menu-length column in a pane the width of a phone.
//
// On the home screen there is no pane at all - Windows draws the grid across
// the whole window - so setScope('') hides the whole thing.
export function buildNav(ops) {
  var root = document.createElement('div');
  root.className = 'set-nav';

  var home = document.createElement('button');
  home.type = 'button';
  home.className = 'set-nav-home';
  var homeArt = document.createElement('span');
  homeArt.className = 'set-nav-art';
  homeArt.innerHTML = HOME_SVG;
  home.appendChild(homeArt);
  home.appendChild(document.createTextNode('Home'));
  home.addEventListener('click', function () {
    ops.navigate(HOME_PAGE_ID);
  });
  root.appendChild(home);

  var slot = document.createElement('div');
  slot.className = 'set-nav-search';
  root.appendChild(slot);

  var list = document.createElement('div');
  list.className = 'set-nav-list';
  root.appendChild(list);

  var rows = [];
  // The category the pane is currently showing, so a navigation between two of
  // its pages leaves the pane alone - the way it does in Windows - and only a
  // change of category brings the rows in again.
  var scopedTo = null;
  // The sub-heading the run of rows is currently under, so the heading is drawn
  // once rather than repeated on every nested row.
  var shownGroup = '';

  return {
    el: root,
    searchSlot: slot,
    homeRow: home,

    // Draws the pane for one page, or hides the pane on the home screen.
    // Returns whether the category changed, which is what decides whether the
    // rows animate.
    setScope: function (pageId) {
      var category = pageId ? ops.categoryOf(pageId) : null;
      var changed = (category ? category.id : null) !== scopedTo;
      root.hidden = !pageId;
      root.classList.remove('is-searching');
      scopedTo = category ? category.id : null;
      rows = [];
      shownGroup = '';
      list.textContent = '';
      list.classList.remove('is-entering');
      if (!category) {
        return changed;
      }
      var title = document.createElement('h3');
      title.className = 'set-nav-group-title';
      title.textContent = category.title;
      list.appendChild(title);
      (category.pages || []).forEach(function (page) {
        // A page may sit under a sub-heading: the Privacy pane puts six rows
        // under "App permissions". The heading is drawn once, where the run of
        // pages under it begins, and the rows under it are indented to say so.
        if (page.navGroup && page.navGroup !== shownGroup) {
          shownGroup = page.navGroup;
          var sub = document.createElement('div');
          sub.className = 'set-nav-subgroup';
          sub.textContent = page.navGroup;
          list.appendChild(sub);
        } else if (!page.navGroup) {
          shownGroup = '';
        }
        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'set-nav-row' + (page.navGroup ? ' set-nav-row--nested' : '');
        var art = document.createElement('span');
        art.className = 'set-nav-art';
        art.innerHTML = glyphFor(page.glyph || category.glyph);
        row.appendChild(art);
        row.appendChild(document.createTextNode(page.title));
        row.addEventListener('click', function () {
          ops.navigate(page.id);
        });
        list.appendChild(row);
        rows.push({ el: row, pageId: page.id });
      });
      this.mark(pageId);
      return changed;
    },

    // Fades the rows in, for a change of category. Restarted rather than left
    // to run once, so two category changes in quick succession both show it.
    markFade: function () {
      if (prefersReducedMotion()) {
        return;
      }
      list.classList.remove('is-entering');
      void list.offsetWidth;
      list.classList.add('is-entering');
    },

    // Marks the row for the page on screen, and only that row.
    mark: function (pageId) {
      rows.forEach(function (row) {
        row.el.classList.toggle('is-current', row.pageId === pageId);
        if (row.pageId === pageId) {
          row.el.setAttribute('aria-current', 'page');
        } else {
          row.el.removeAttribute('aria-current');
        }
      });
      home.classList.toggle('is-current', !pageId);
    }
  };
}