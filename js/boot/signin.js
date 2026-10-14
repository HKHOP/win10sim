import {
  ACCOUNT_PIC_SRC,
  ACCOUNT_NAME,
  AVATAR_SIZE_PX,
  BOOT_SPINNER_SRC,
  LOCK_WALLPAPER_SRC,
  WELCOME_DURATION_MS,
  WELCOME_SPINNER_PX,
  WELCOME_CONTENT_HOLD_MS,
  WELCOME_BG_FADE_MS
} from '../global/constants.js';
import { createTextField } from '../core/textfield.js';
import { NETWORK_OFFLINE_SVG, ACCESS_SVG, POWER_SVG, EYE_SVG, ARROW_SVG } from '../global/icons.js';
import { sleep, shutDown, restart as restartPc } from '../core/power.js';

// Sign-in layer: centered avatar + name, password box with reveal and
// submit buttons, and the Win10 status bar (language, network,
// ease of access, power). Any entered password signs in — this is a
// simulator with no real accounts, so every password is "correct".

function buildIconButton(className, svg, label, onClick) {
  var button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.innerHTML = svg;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', onClick);
  return button;
}

function buildPowerMenu(layer) {
  var menu = document.createElement('div');
  menu.className = 'power-menu power-hidden';

  var items = [
    { label: 'Sleep', run: function () { sleep(layer); } },
    { label: 'Shut down', run: function () { shutDown(layer); } },
    { label: 'Restart', run: restartPc }
  ];

  items.forEach(function (item) {
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'power-item';
    row.textContent = item.label;
    row.addEventListener('click', function (event) {
      event.stopPropagation();
      menu.classList.add('power-hidden');
      item.run();
    });
    menu.appendChild(row);
  });

  return menu;
}

// Win10 post-password: the password box is replaced by a spinner with
// "Welcome" beside it. Then the sign-in content fades, and 0.5s later the
// wallpaper fades too, revealing the desktop already waiting underneath.
function showWelcome(layer, onInsertDesktop, onFinished) {
  var form = layer.querySelector('.signin-form');

  var row = document.createElement('div');
  row.className = 'welcome-row';

  var spinner = document.createElement('img');
  spinner.src = BOOT_SPINNER_SRC;
  spinner.className = 'welcome-spinner-inline';
  spinner.style.width = WELCOME_SPINNER_PX + 'px';
  spinner.style.height = WELCOME_SPINNER_PX + 'px';
  spinner.alt = 'Loading';
  spinner.draggable = false;

  var text = document.createElement('div');
  text.className = 'welcome-text-inline';
  text.textContent = 'Welcome';

  row.appendChild(spinner);
  row.appendChild(text);
  form.parentNode.replaceChild(row, form);

  window.setTimeout(function () {
    onInsertDesktop();
    layer.classList.add('signin-content-fade');
    window.setTimeout(function () {
      layer.classList.add('signin-bg-fade');
      window.setTimeout(function () {
        onFinished();
      }, WELCOME_BG_FADE_MS);
    }, WELCOME_CONTENT_HOLD_MS);
  }, WELCOME_DURATION_MS);
}

export function createSignInLayer(onInsertDesktop, onFinished) {
  var layer = document.createElement('div');
  layer.className = 'signin-layer';

  // Own wallpaper copy: on dismiss it smoothly zooms + blurs, Win10-style,
  // while the content above stays sharp.
  var wallpaper = document.createElement('div');
  wallpaper.className = 'signin-wallpaper';
  wallpaper.style.backgroundImage = 'url("' + LOCK_WALLPAPER_SRC + '")';
  layer.appendChild(wallpaper);

  var dim = document.createElement('div');
  dim.className = 'signin-dim';
  layer.appendChild(dim);

  var center = document.createElement('div');
  center.className = 'signin-center';

  var avatar = document.createElement('img');
  avatar.src = ACCOUNT_PIC_SRC;
  avatar.className = 'signin-avatar';
  avatar.style.width = AVATAR_SIZE_PX + 'px';
  avatar.style.height = AVATAR_SIZE_PX + 'px';
  avatar.alt = ACCOUNT_NAME;
  avatar.draggable = false;

  var name = document.createElement('div');
  name.className = 'signin-name';
  name.textContent = ACCOUNT_NAME;

  var form = document.createElement('form');
  form.className = 'signin-form';
  form.setAttribute('autocomplete', 'off');

  var input = createTextField({
    type: 'password',
    className: 'signin-password',
    placeholder: 'Password',
    label: 'Password'
  });

  var eye = buildIconButton('signin-icon-btn', EYE_SVG, 'Show password', function () {
    input.type = input.type === 'password' ? 'text' : 'password';
    input.focus();
  });

  var submit = buildIconButton('signin-icon-btn signin-submit', ARROW_SVG, 'Sign in', function () {
    trySignIn();
  });
  submit.disabled = true;

  // Win10's arrow is grey until there is something to send, and turns the accent
  // blue the moment there is - so it says whether the box is ready before it is
  // pressed.
  function syncSubmit() {
    var ready = input.value.length > 0;
    submit.disabled = !ready;
    submit.classList.toggle('is-ready', ready);
  }

  input.addEventListener('input', syncSubmit);
  input.addEventListener('keyup', syncSubmit);
  syncSubmit();

  function trySignIn() {
    if (input.value.length === 0) {
      // Win10 shakes the box when there is nothing to check.
      form.classList.remove('signin-shake');
      void form.offsetWidth;
      form.classList.add('signin-shake');
      return;
    }
    showWelcome(layer, onInsertDesktop, onFinished);
  }

  // Enter signs in. The field is the shell's own rather than a form control (see
  // textfield.js), and the browser's implicit submission works off form
  // controls, so there is nothing for it to fire on: Enter has to be handled
  // here, as the box's own key.
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      trySignIn();
    }
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    trySignIn();
  });

  form.appendChild(input);
  form.appendChild(eye);
  form.appendChild(submit);

  center.appendChild(avatar);
  center.appendChild(name);
  center.appendChild(form);

  var statusbar = document.createElement('div');
  statusbar.className = 'signin-statusbar';

  var lang = document.createElement('div');
  lang.className = 'signin-lang';
  lang.innerHTML = 'ENG<br>US';

  var powerMenu = buildPowerMenu(layer);
  var powerWrap = document.createElement('div');
  powerWrap.className = 'power-wrap';
  var powerButton = buildIconButton('status-icon-btn', POWER_SVG, 'Power', function (event) {
    event.stopPropagation();
    powerMenu.classList.toggle('power-hidden');
  });
  powerWrap.appendChild(powerMenu);
  powerWrap.appendChild(powerButton);

  statusbar.appendChild(lang);
  statusbar.appendChild(buildIconButton('status-icon-btn', NETWORK_OFFLINE_SVG, 'Network - Not connected', function () {}));
  statusbar.appendChild(buildIconButton('status-icon-btn', ACCESS_SVG, 'Ease of Access', function () {}));
  statusbar.appendChild(powerWrap);

  document.addEventListener('click', function hideMenu(event) {
    // Clicks inside the power control are handled there; only outside
    // clicks dismiss. Routed sim-cursor clicks bubble here too, so this
    // guard stops them from undoing the toggle in the same gesture.
    if (event.target && event.target.closest && event.target.closest('.power-wrap')) {
      return;
    }
    powerMenu.classList.add('power-hidden');
  });

  layer.appendChild(center);
  layer.appendChild(statusbar);

  return layer;
}
