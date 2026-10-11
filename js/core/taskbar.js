import {
  TASKBAR_HEIGHT_PX,
  START_LOGO_SRC,
  EXPLORER_SRC,
  EDGE_SRC,
  STORE_SRC
} from '../global/constants.js';
import {
  SEARCH_SVG,
  TASKVIEW_SVG,
  CHEVRON_SVG,
  WIFI_SVG,
  VOLUME_SVG,
  BELL_SVG
} from '../global/icons.js';
import { launchApp } from './apps.js';
import { subscribeWindows, showWindowSystemMenu } from './windowmanager.js';
import { toggleStartMenu, subscribeStartOpen } from './startmenu.js';

// Win10 light-theme taskbar: Start button, search box, Task view, pinned
// apps, running-app area, and the tray (chevron, network, volume, language,
// clock, notifications, show-desktop). The Start button is intentionally dead
// this iteration — Start menu arrives separately.

function formatTrayTime(date) {
  var hours = date.getHours() % 12;
  if (hours === 0) {
    hours = 12;
  }
  var minutes = date.getMinutes();
  var suffix = date.getHours() < 12 ? 'AM' : 'PM';
  return hours + ':' + (minutes < 10 ? '0' + minutes : minutes) + ' ' + suffix;
}

function formatTrayDate(date) {
  return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
}

function buildTrayButton(svg, label) {
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'tray-btn';
  button.innerHTML = svg;
  button.setAttribute('aria-label', label);
  return button;
}

function buildPinnedAppImg(src, label, appId) {
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'task-pinned';
  var img = document.createElement('img');
  img.src = src;
  img.alt = '';
  img.draggable = false;
  button.appendChild(img);
  button.setAttribute('aria-label', label);
  button.addEventListener('click', function () {
    // Unregistered apps (coming later) simply do nothing yet.
    launchApp(appId);
  });
  return button;
}

export function buildTaskbar() {
  var bar = document.createElement('div');
  bar.className = 'taskbar';
  bar.style.height = TASKBAR_HEIGHT_PX + 'px';

  // Start button: opens the Win10 Start menu (bottom-left panel with the
  // app list and pinned tiles), and shows its open state.
  var start = document.createElement('button');
  start.type = 'button';
  start.className = 'task-start';
  start.setAttribute('aria-label', 'Start');
  var startLogo = document.createElement('img');
  startLogo.src = START_LOGO_SRC;
  startLogo.className = 'task-start-logo';
  startLogo.alt = '';
  startLogo.draggable = false;
  start.appendChild(startLogo);
  start.addEventListener('click', function (event) {
    event.stopPropagation();
    toggleStartMenu();
  });
  subscribeStartOpen(function (isOpen) {
    start.classList.toggle('task-active-app', isOpen);
  });
  bar.appendChild(start);

  // Search box: typeable, but results arrive in a later iteration.
  var search = document.createElement('div');
  search.className = 'task-search';
  var searchIcon = document.createElement('span');
  searchIcon.className = 'task-search-icon';
  searchIcon.innerHTML = SEARCH_SVG;
  var searchInput = document.createElement('input');
  searchInput.className = 'task-search-input';
  searchInput.placeholder = 'Type here to search';
  searchInput.setAttribute('aria-label', 'Search');
  search.appendChild(searchIcon);
  search.appendChild(searchInput);
  bar.appendChild(search);

  var taskView = document.createElement('button');
  taskView.type = 'button';
  taskView.className = 'task-btn';
  taskView.innerHTML = TASKVIEW_SVG;
  taskView.setAttribute('aria-label', 'Task view');
  bar.appendChild(taskView);

  var pinned = document.createElement('div');
  pinned.className = 'task-pinned-group';
  pinned.appendChild(buildPinnedAppImg(EDGE_SRC, 'Microsoft Edge', 'edge'));
  pinned.appendChild(buildPinnedAppImg(EXPLORER_SRC, 'File Explorer', 'explorer'));
  pinned.appendChild(buildPinnedAppImg(STORE_SRC, 'Microsoft Store', 'store'));
  bar.appendChild(pinned);

  // Running apps: one button per window, active underline for focus.
  var running = document.createElement('div');
  running.className = 'task-running';
  subscribeWindows(function (snapshot) {
    while (running.firstChild) {
      running.removeChild(running.firstChild);
    }
    snapshot.forEach(function (item) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'task-running-app' + (item.focused && !item.minimized ? ' task-active' : '');
      button.dataset.winId = String(item.id);
      // Win10 names windows on their taskbar hover.
      button.title = item.title;
      button.setAttribute('aria-label', item.title);
      if (item.icon) {
        var img = document.createElement('img');
        img.src = item.icon;
        img.alt = '';
        img.draggable = false;
        button.appendChild(img);
      } else {
        button.textContent = item.title.charAt(0);
      }
      button.addEventListener('click', function () {
        if (item.focused && !item.minimized) {
          item.win.minimize();
        } else {
          item.win.restore();
        }
      });
      // Right-press opens Win10's window menu, desktop-style.
      ['contextmenu', 'simcontextmenu'].forEach(function (type) {
        button.addEventListener(type, function (event) {
          event.preventDefault();
          event.stopPropagation();
          var x = event.detail && typeof event.detail.clientX === 'number' ? event.detail.clientX : event.clientX;
          var y = event.detail && typeof event.detail.clientY === 'number' ? event.detail.clientY : event.clientY;
          showWindowSystemMenu(item.id, x, y);
        });
      });
      running.appendChild(button);
    });
  });
  bar.appendChild(running);

  var tray = document.createElement('div');
  tray.className = 'task-tray';
  tray.appendChild(buildTrayButton(CHEVRON_SVG, 'Show hidden icons'));
  tray.appendChild(buildTrayButton(WIFI_SVG, 'Network'));
  tray.appendChild(buildTrayButton(VOLUME_SVG, 'Volume'));

  var lang = document.createElement('div');
  lang.className = 'tray-lang';
  lang.textContent = 'ENG';
  tray.appendChild(lang);

  var clock = document.createElement('button');
  clock.type = 'button';
  clock.className = 'tray-clock';
  clock.setAttribute('aria-label', 'Clock');
  var timeLine = document.createElement('div');
  var dateLine = document.createElement('div');
  function tick() {
    var now = new Date();
    timeLine.textContent = formatTrayTime(now);
    dateLine.textContent = formatTrayDate(now);
  }
  tick();
  window.setInterval(tick, 10000);
  clock.appendChild(timeLine);
  clock.appendChild(dateLine);
  tray.appendChild(clock);

  tray.appendChild(buildTrayButton(BELL_SVG, 'Notifications'));
  bar.appendChild(tray);

  // Show-desktop sliver: hover glow only until windows exist to minimize.
  var showDesktop = document.createElement('div');
  showDesktop.className = 'task-showdesktop';
  showDesktop.title = 'Show desktop';
  bar.appendChild(showDesktop);

  return bar;
}
