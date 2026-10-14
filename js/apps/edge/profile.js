// The profile flyout: the panel that drops below the account button, with the
// profile this browser is using and the other profiles it could be using.

import { ACCOUNT_PIC_SRC, ACCOUNT_NAME } from '../../global/constants.js';
import { PROFILE_SVG, CHEVRON_RIGHT_SVG, SETTING_SVG, OTHER_USER_SVG, ADD_SVG } from './edgeglyphs.js';

function row(art, name, note, chevron, onPress) {
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'edge-profile-row' + (chevron ? ' has-chevron' : '');
  var glyph = document.createElement('span');
  glyph.className = 'edge-profile-row-art';
  glyph.innerHTML = art;
  var words = document.createElement('span');
  words.className = 'edge-profile-row-words';
  var title = document.createElement('span');
  title.className = 'edge-profile-row-name';
  title.textContent = name;
  words.appendChild(title);
  if (note) {
    var line = document.createElement('span');
    line.className = 'edge-profile-row-note';
    line.textContent = note;
    words.appendChild(line);
  }
  button.appendChild(glyph);
  button.appendChild(words);
  if (chevron) {
    var arrow = document.createElement('span');
    arrow.className = 'edge-profile-row-arrow';
    arrow.innerHTML = CHEVRON_RIGHT_SVG;
    button.appendChild(arrow);
  }
  if (onPress) {
    button.addEventListener('click', onPress);
  } else {
    button.disabled = true;
  }
  return button;
}

export function buildProfileFlyout(ops) {
  var panel = document.createElement('div');
  panel.className = 'edge-flyout edge-profile';
  panel.hidden = true;

  var head = document.createElement('div');
  head.className = 'edge-profile-head';
  var pic = document.createElement('img');
  pic.className = 'edge-profile-pic';
  pic.src = ACCOUNT_PIC_SRC;
  pic.alt = '';
  pic.draggable = false;
  var id = document.createElement('div');
  id.className = 'edge-profile-id';
  var name = document.createElement('p');
  name.className = 'edge-profile-name';
  name.textContent = 'Personal';
  var mail = document.createElement('p');
  mail.className = 'edge-profile-mail';
  mail.textContent = ACCOUNT_NAME + '@contoso.com';
  var sync = document.createElement('p');
  sync.className = 'edge-profile-sync';
  var dot = document.createElement('span');
  dot.className = 'edge-profile-dot';
  sync.appendChild(dot);
  sync.appendChild(document.createTextNode('Sync is on'));
  id.appendChild(name);
  id.appendChild(mail);
  id.appendChild(sync);
  head.appendChild(pic);
  head.appendChild(id);
  panel.appendChild(head);

  var settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'edge-profile-settings';
  settings.setAttribute('aria-label', 'Profile settings');
  settings.innerHTML = SETTING_SVG;
  settings.addEventListener('click', function () {
    ops.onSettings();
  });
  head.appendChild(settings);
  panel.appendChild(head);

  panel.appendChild(row(PROFILE_SVG, 'Work', ACCOUNT_NAME + '@contoso.com', false, null));
  panel.appendChild(row(OTHER_USER_SVG, 'Profile 1', 'Not signed in', false, null));
  panel.appendChild(row(ADD_SVG, 'Set up new personal profile', '', true, null));

  var others = document.createElement('button');
  others.type = 'button';
  others.className = 'edge-profile-row has-chevron';
  var othersWords = document.createElement('span');
  othersWords.className = 'edge-profile-row-words';
  var othersName = document.createElement('span');
  othersName.className = 'edge-profile-row-name';
  othersName.textContent = 'Other profiles';
  othersWords.appendChild(othersName);
  others.appendChild(othersWords);
  var othersArrow = document.createElement('span');
  othersArrow.className = 'edge-profile-row-arrow';
  othersArrow.innerHTML = CHEVRON_RIGHT_SVG;
  others.appendChild(othersArrow);
  others.addEventListener('click', function () {
    ops.onOtherProfiles();
  });
  panel.appendChild(others);

  function place(anchor) {
    // Under the account button, and to its left by its own width so the panel
    // hangs off the right-hand end the way Edge's does.
    var root = anchor.offsetParent;
    if (!root) {
      return;
    }
    panel.style.left = Math.max(4, anchor.offsetLeft + anchor.offsetWidth - panel.offsetWidth) + 'px';
    panel.style.top = (anchor.offsetTop + anchor.offsetHeight + 2) + 'px';
  }

  return {
    element: panel,
    open: function (anchor) {
      panel.hidden = false;
      place(anchor);
    },
    close: function () {
      panel.hidden = true;
    },
    isOpen: function () {
      return !panel.hidden;
    },
    contains: function (node) {
      return panel.contains(node);
    }
  };
}