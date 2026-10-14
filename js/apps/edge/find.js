// Find on page: the bar that drops over the top of the page, with the count of
// what it found and the marks to prove it.
//
// A mark is a span around the text that matched, which means the page's own DOM
// is changed while the bar is open and put back exactly as it was when it closes.
// The shell's own text fields are left alone: their text is drawn by the field
// and rewritten on every keystroke, so a mark inside one would be thrown away.

import { createTextField } from '../../core/textfield.js';

var MARKS = 'edge-find-mark';
var CURRENT = 'edge-find-mark-current';

function isField(node) {
  var at = node.parentNode;
  while (at) {
    if (at.classList && at.classList.contains && at.classList.contains('sim-field')) {
      return true;
    }
    at = at.parentNode;
  }
  return false;
}

// Every run of text on the page that could be searched, in the order it is read.
function textRuns(root) {
  var out = [];
  var walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
      if (!node.nodeValue || !node.nodeValue.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      if (node.parentNode && node.parentNode.classList &&
        node.parentNode.classList.contains(MARKS)) {
        return NodeFilter.FILTER_REJECT;
      }
      return isField(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
  });
  var node = walk.nextNode();
  while (node) {
    out.push(node);
    node = walk.nextNode();
  }
  return out;
}

export function createFindBar(host, ops) {
  var bar = document.createElement('div');
  bar.className = 'edge-find';
  bar.hidden = true;

  var box = document.createElement('span');
  box.className = 'edge-find-box';
  // The shell's own field, like every other text box in the browser: it brings
  // no keyboard of its own and takes Enter and Escape the way a field does.
  var field = createTextField({
    placeholder: 'Find on page',
    label: 'Find on page',
    className: 'edge-find-field'
  });
  box.appendChild(field);
  bar.appendChild(box);

  var count = document.createElement('span');
  count.className = 'edge-find-count';
  bar.appendChild(count);

  var up = document.createElement('button');
  up.type = 'button';
  up.className = 'edge-find-step';
  up.textContent = '↑';
  up.setAttribute('aria-label', 'Previous match');
  bar.appendChild(up);
  var down = document.createElement('button');
  down.type = 'button';
  down.className = 'edge-find-step';
  down.textContent = '↓';
  down.setAttribute('aria-label', 'Next match');
  bar.appendChild(down);

  var close = document.createElement('button');
  close.type = 'button';
  close.className = 'edge-find-step';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Close find on page');
  bar.appendChild(close);

  var marks = [];
  var at = 0;
  var query = '';

  function clear() {
    marks.forEach(function (mark) {
      var parent = mark.parentNode;
      if (!parent) {
        return;
      }
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
      if (parent.normalize) {
        parent.normalize();
      }
    });
    marks = [];
  }

  function markCurrent() {
    marks.forEach(function (mark, i) {
      mark.classList.toggle(CURRENT, i === at);
    });
  }

  function scrollTo(mark) {
    var node = mark || host;
    if (node.scrollIntoView) {
      node.scrollIntoView({ block: 'center' });
    }
    if (ops.onScrolled) {
      ops.onScrolled();
    }
  }

  function run(keepPosition) {
    clear();
    marks = [];
    at = 0;
    query = field.value.trim();
    if (!query) {
      count.textContent = '';
      return;
    }
    var needle = query.toLowerCase();
    textRuns(host).forEach(function (node) {
      var hay = node.nodeValue;
      var lower = hay.toLowerCase();
      var from = 0;
      var pieces = null;
      while (true) {
        var found = lower.indexOf(needle, from);
        if (found < 0) {
          break;
        }
        // Never split a match across two pieces, and never start one inside the
        // one before it.
        if (found < from) {
          break;
        }
        pieces = pieces || [];
        pieces.push({ start: found, end: found + needle.length });
        from = found + needle.length;
      }
      if (!pieces) {
        return;
      }
      var fragment = document.createDocumentFragment();
      var at0 = 0;
      pieces.forEach(function (piece) {
        fragment.appendChild(document.createTextNode(hay.slice(at0, piece.start)));
        var mark = document.createElement('span');
        mark.className = MARKS;
        mark.appendChild(document.createTextNode(hay.slice(piece.start, piece.end)));
        fragment.appendChild(mark);
        at0 = piece.end;
      });
      fragment.appendChild(document.createTextNode(hay.slice(at0)));
      node.parentNode.replaceChild(fragment, node);
    });
    marks = Array.prototype.slice.call(host.querySelectorAll('.' + MARKS));
    if (keepPosition) {
      at = (at - 1 + marks.length) % marks.length;
    }
    count.textContent = marks.length ? (at + 1) + ' of ' + marks.length : 'No results';
    markCurrent();
    scrollTo(marks[at]);
  }

  function step(delta) {
    if (!marks.length) {
      return;
    }
    at = (at + delta + marks.length) % marks.length;
    count.textContent = (at + 1) + ' of ' + marks.length;
    markCurrent();
    scrollTo(marks[at]);
  }

  field.addEventListener('input', function () {
    run(false);
  });
  field.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      run(true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      hide();
    }
  });
  down.addEventListener('click', function () {
    step(1);
  });
  up.addEventListener('click', function () {
    step(-1);
  });
  close.addEventListener('click', function () {
    hide();
  });

  function show() {
    bar.hidden = false;
    field.focus();
    field.select();
  }

  // Called whenever the page changes: the marks belonged to the old one.
  function reset() {
    clear();
    marks = [];
    at = 0;
    count.textContent = '';
    bar.hidden = true;
    field.value = '';
  }

  function hide() {
    reset();
    if (ops.onClosed) {
      ops.onClosed();
    }
  }

  return {
    element: bar,
    show: show,
    hide: hide,
    reset: reset,
    isOpen: function () {
      return !bar.hidden;
    }
  };
}