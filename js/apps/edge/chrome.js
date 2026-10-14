// The browser's toolbar: the navigation buttons, the address bar, and the tools
// on the right that Edge puts there.
//
// The address bar is the shell's own text field (see textfield.js), so it types,
// takes a caret, and never brings the phone's keyboard up over the desktop.

import { createTextField } from '../../core/textfield.js';
import {
  BACK_SVG,
  FORWARD_SVG,
  REFRESH_SVG,
  HOME_SVG,
  SEARCH_SVG,
  FAVORITE_SVG,
  FAVORITE_FILL_SVG,
  COLLECTIONS_SVG,
  ESSENTIALS_SVG,
  PROFILE_SVG,
  MORE_SVG
} from './edgeglyphs.js';

function button(className, svg, label, onPress) {
  var el = document.createElement('button');
  el.type = 'button';
  el.className = 'edge-btn ' + className;
  el.setAttribute('aria-label', label);
  el.title = label;
  el.innerHTML = svg;
  el.addEventListener('click', function (event) {
    event.stopPropagation();
    onPress();
  });
  return el;
}

export function buildChrome(ops) {
  var bar = document.createElement('div');
  bar.className = 'edge-toolbar';

  var back = button('edge-back', BACK_SVG, 'Back (Alt+Left)', ops.onBack);
  var forward = button('edge-forward', FORWARD_SVG, 'Forward (Alt+Right)', ops.onForward);
  var refresh = button('edge-refresh', REFRESH_SVG, 'Refresh (F5)', ops.onReload);
  var home = button('edge-home', HOME_SVG, 'Home', ops.onHome);
  bar.appendChild(back);
  bar.appendChild(forward);
  bar.appendChild(refresh);
  bar.appendChild(home);

  // The address bar. Clicking it takes the whole address, as Edge does, so a
  // new one can be typed straight over it.
  var omni = document.createElement('div');
  omni.className = 'edge-omni';
  var glass = document.createElement('span');
  glass.className = 'edge-omni-glass';
  glass.innerHTML = SEARCH_SVG;
  var address = createTextField({
    placeholder: 'Search or enter web address',
    label: 'Search or enter web address',
    className: 'edge-omni-field'
  });
  omni.appendChild(glass);
  omni.appendChild(address);
  bar.appendChild(omni);

  address.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    ops.onNavigate(address.value);
  });
  address.addEventListener('focus', function () {
    address.select();
  });

  // The tools on the right, in Edge's order.
  var tools = document.createElement('div');
  tools.className = 'edge-tools';
  var collections = button('edge-collections', COLLECTIONS_SVG, 'Collections', ops.onCollections);
  var favorite = button('edge-favorite', FAVORITE_SVG, 'Add this page to favorites (Ctrl+D)',
    ops.onFavorite);
  var essentials = button('edge-essentials', ESSENTIALS_SVG, 'Browser essentials', ops.onEssentials);
  var profile = button('edge-profile', PROFILE_SVG, 'Personal - not signed in', ops.onProfile);
  var more = button('edge-more', MORE_SVG, 'Settings and more (Alt+F)', ops.onMore);
  tools.appendChild(collections);
  tools.appendChild(favorite);
  tools.appendChild(essentials);
  tools.appendChild(profile);
  tools.appendChild(more);
  bar.appendChild(tools);

  // What the page is drawn into. The zoom level is a CSS `zoom` on this element
  // rather than a transform: a transform would scale the drawing without giving
  // back the room, so a page at 200% would need its own scrolling.
  var viewport = document.createElement('div');
  viewport.className = 'edge-pages';

  return {
    bar: bar,
    viewport: viewport,
    // The toolbar's state for the page being shown: what is behind it, what the
    // address says, and whether this page is a favorite.
    sync: function (state) {
      back.disabled = !state.canBack;
      forward.disabled = !state.canForward;
      if (document.activeElement !== address) {
        address.value = state.address;
      }
      favorite.innerHTML = state.favorite ? FAVORITE_FILL_SVG : FAVORITE_SVG;
      favorite.classList.toggle('is-on', !!state.favorite);
      favorite.title = state.favorite ? 'Remove this page from favorites' : 'Add this page to favorites';
      viewport.style.zoom = String(state.zoom);
    },
    focusAddress: function () {
      address.focus();
      address.select();
    },
    addressValue: function () {
      return address.value;
    }
  };
}