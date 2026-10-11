// Shared Win10 power actions. The sign-in status bar and the Start menu's
// power button both drive the same three actions, so they live here rather
// than inside either UI:
//   Sleep     - screen fades to black, then wakes back up
//   Shut down - screen goes black; refreshing powers the PC back on
//   Restart   - reloads the page (the whole sim reboots)

// Win10 sleep: a black veil fades in, holds, then fades out again.
export function sleep(host) {
  var overlay = document.createElement('div');
  overlay.className = 'sleep-overlay';
  host.appendChild(overlay);
  window.requestAnimationFrame(function () {
    overlay.classList.add('sleep-on');
  });
  window.setTimeout(function () {
    overlay.classList.remove('sleep-on');
    window.setTimeout(function () {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 600);
  }, 2200);
}

// Win10 shut down: black screen. The page is the power button here, so say
// how to turn the machine back on.
export function shutDown(host) {
  var overlay = document.createElement('div');
  overlay.className = 'shutdown-overlay';
  var hint = document.createElement('div');
  hint.className = 'shutdown-hint';
  hint.textContent = 'Refresh the page to turn the PC back on.';
  overlay.appendChild(hint);
  host.appendChild(overlay);
  window.requestAnimationFrame(function () {
    overlay.classList.add('shutdown-on');
  });
}

export function restart() {
  window.location.reload();
}
