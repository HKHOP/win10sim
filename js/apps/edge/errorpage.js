// The page a browser shows when a page cannot be shown.
//
// This is the older Edge error page, which is the one to copy: a circled
// exclamation mark, the heading, a line of advice, the two things you can try
// instead, and one blue button. There is no illustration on it, and the whole
// of it is left-aligned inside a column that sits in the middle of the tab -
// which is the part that matters, because a centred column of centred text reads
// as a poster and this is a page telling you what went wrong.
//
// ops:
//   onReload    the Refresh button, and "Refresh this page"
//   onNewTab    "Open a new tab"

// A ring and an exclamation mark, drawn rather than typed: the mark is the only
// artwork on the page, and a typed "!" in a CSS circle would be the wrong weight
// and would not sit on the circle's centre.
var MARK =
  '<svg class="edge-error-mark" viewBox="0 0 96 96" aria-hidden="true">' +
  '<circle cx="48" cy="48" r="41" fill="none" stroke="#202124" stroke-width="7"/>' +
  '<rect x="43" y="25" width="10" height="31" rx="5" fill="#202124"/>' +
  '<circle cx="48" cy="69" r="6" fill="#202124"/>' +
  '</svg>';

export function buildErrorPage(entry, ops) {
  var page = document.createElement('div');
  page.className = 'edge-page edge-error';

  var box = document.createElement('div');
  box.className = 'edge-error-box';

  var mark = document.createElement('div');
  mark.innerHTML = MARK;
  box.appendChild(mark);

  var heading = document.createElement('h1');
  heading.className = 'edge-error-heading';
  heading.textContent = 'This page is having a problem';

  var sub = document.createElement('p');
  sub.className = 'edge-error-sub';
  sub.textContent = 'Try coming back to it later.';

  box.appendChild(heading);
  box.appendChild(sub);

  // The two things you can do instead, offered as buttons rather than as prose,
  // because both of them are real: this one can open a tab and it can reload.
  var also = document.createElement('div');
  also.className = 'edge-error-also';
  var alsoLabel = document.createElement('p');
  alsoLabel.className = 'edge-error-also-label';
  alsoLabel.textContent = 'You could also:';
  also.appendChild(alsoLabel);

  var list = document.createElement('ul');
  list.className = 'edge-error-also-list';
  [
    { label: 'Open a new tab', run: ops.onNewTab },
    { label: 'Refresh this page', run: ops.onReload }
  ].forEach(function (item) {
    var row = document.createElement('li');
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'edge-error-also-link';
    button.textContent = item.label;
    button.addEventListener('click', function () {
      if (item.run) {
        item.run();
      }
    });
    row.appendChild(button);
    list.appendChild(row);
  });
  also.appendChild(list);
  box.appendChild(also);

  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'edge-error-reload';
  button.textContent = 'Refresh';
  button.addEventListener('click', function () {
    if (ops.onReload) {
      ops.onReload();
    }
  });
  box.appendChild(button);

  page.appendChild(box);
  return page;
}