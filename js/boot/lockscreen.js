import { LOCK_WALLPAPER_SRC } from '../global/constants.js';
import { NETWORK_OFFLINE_SVG } from '../global/icons.js';

// Lock screen: opaque wallpaper panel with the big live clock + date
// (lower-left, like Win10). Any key press, click, or tap dismisses it —
// the panel slides up to reveal the sign-in layer underneath.

var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatTime(date) {
  var hours = date.getHours() % 12;
  if (hours === 0) {
    hours = 12;
  }
  var minutes = date.getMinutes();
  return hours + ':' + (minutes < 10 ? '0' + minutes : minutes);
}

function formatDate(date) {
  return DAY_NAMES[date.getDay()] + ', ' + MONTH_NAMES[date.getMonth()] + ' ' + date.getDate();
}

export function createLockLayer(onDismiss) {
  var dismissed = false;

  var layer = document.createElement('div');
  layer.className = 'lock-layer';
  // Opaque: nothing from the sign-in layer may show through before dismissal.
  layer.style.backgroundImage = 'url("' + LOCK_WALLPAPER_SRC + '")';

  var clock = document.createElement('div');
  clock.className = 'lock-clock';

  var time = document.createElement('div');
  time.className = 'lock-time';

  var date = document.createElement('div');
  date.className = 'lock-date';

  function tick() {
    var now = new Date();
    time.textContent = formatTime(now);
    date.textContent = formatDate(now);
  }
  tick();
  var timer = window.setInterval(tick, 5000);

  clock.appendChild(time);
  clock.appendChild(date);

  var status = document.createElement('div');
  status.className = 'lock-status';
  status.innerHTML = NETWORK_OFFLINE_SVG;

  layer.appendChild(clock);
  layer.appendChild(status);

  function dismiss() {
    if (dismissed) {
      return;
    }
    dismissed = true;
    onDismiss();
  }

  layer.addEventListener('click', dismiss);
  layer.addEventListener('touchstart', dismiss);
  document.addEventListener('keydown', dismiss);

  return {
    element: layer,
    dispose: function () {
      window.clearInterval(timer);
      document.removeEventListener('keydown', dismiss);
      layer.removeEventListener('click', dismiss);
      layer.removeEventListener('touchstart', dismiss);
    }
  };
}
