// How a custom text field looks: the text, the selection behind it, the caret,
// the placeholder and the scrolling.
//
// It is deliberately ignorant of how text gets edited. It is handed a state -
// what the text is, what is selected, whether this is a password - and asked to
// show it, and it answers two questions the editing side needs: where the caret
// is, and which character is under a point on the screen.
//
// The measurement is the browser's, not ours. A Range over the one text node
// gives exact rectangles for the caret and for every line of a selection,
// wrapped or not, in a single line or a hundred, without this file having to
// know a line height or a font.

var CARET = 'sim-field-caret';
var TEXT = 'sim-field-text';

export function createFieldView(host, options) {
  var doc = host.ownerDocument;

  var viewport = doc.createElement('div');
  viewport.className = 'sim-field-viewport';

  var layer = doc.createElement('div');
  layer.className = 'sim-field-layer';

  var highlights = doc.createElement('div');
  highlights.className = 'sim-field-highlights';

  var textEl = doc.createElement('span');
  textEl.className = TEXT;

  var caret = doc.createElement('div');
  caret.className = CARET;

  layer.appendChild(highlights);
  layer.appendChild(textEl);
  layer.appendChild(caret);
  viewport.appendChild(layer);
  host.appendChild(viewport);

  var placeholder = null;
  var shown = null;
  var scrollX = 0;
  var scrollY = 0;

  function setPlaceholder(text) {
    if (!placeholder) {
      placeholder = doc.createElement('div');
      placeholder.className = 'sim-field-placeholder';
      host.appendChild(placeholder);
    }
    if (placeholder.textContent !== text) {
      placeholder.textContent = text || '';
    }
  }

  // Everything the browser measures comes back in PAGE pixels, but the caret and
  // the highlights are positioned in the field's OWN pixels - and the emulated
  // display is scaled to fit the viewport, so on a phone those are not the same
  // size. Measuring without asking how big the field is being drawn is how a
  // caret ends up at half its distance, standing in the middle of the text it
  // belongs at the end of. The scale is read off the viewport: how wide it is
  // being drawn against how wide it is laid out.
  function layerScale() {
    var drawn = viewport.getBoundingClientRect().width;
    var laidOut = viewport.offsetWidth;
    return drawn && laidOut ? drawn / laidOut : 1;
  }

  // The caret and the highlights live inside the layer - they have to, so the
  // selection travels with the text when it scrolls - which means their numbers
  // are in the LAYER's space, where the text sits before the layer is moved.
  //
  // Three things have to be undone to get there. The measurement is in page
  // pixels, so it is divided by the scale to reach the field's own. The
  // viewport's own corner comes off - the viewport is inset:0 in the host's
  // padding box and the layer starts at its top-left. And the layer has been
  // moved already, so the scroll goes back on: the browser measured the character
  // with the translate applied, and leaving that out would let the layer apply it
  // a second time, leaving the caret and the selection over the text rather than
  // beside it.
  function relativeToLayer(rect) {
    var base = viewport.getBoundingClientRect();
    var scale = layerScale();
    return {
      left: (rect.left - base.left) / scale + scrollX,
      top: (rect.top - base.top) / scale + scrollY,
      width: rect.width / scale,
      height: rect.height / scale
    };
  }

  // A range over the text is the ruler: one rectangle per line of a selection,
  // wrapped or not, in a single line or a hundred, without this file having to
  // know a line height or a font.
  function selectionRange(start, end) {
    var node = textEl.firstChild;
    var range = doc.createRange();
    if (!node) {
      range.selectNodeContents(textEl);
      return range;
    }
    try {
      range.setStart(node, Math.max(0, Math.min(start, node.length)));
      range.setEnd(node, Math.max(0, Math.min(end, node.length)));
    } catch (err) {
      range.selectNodeContents(textEl);
    }
    return range;
  }

  // Where the insertion point is, measured rather than guessed.
  //
  // Anywhere but the very end, this is the browser's own answer and it is right:
  // including at a point where the text wraps onto the next line, which is the one
  // place there is no character in front of the caret to measure.
  //
  // At the very end it is not. A collapsed range at the end of a text node comes
  // back as the rectangle of the LAST character, so a caret measured that way is
  // drawn on top of it rather than after it - in a password box, on top of the
  // last dot. That one is measured from the character itself, and its right edge
  // is where the next character would begin.
  function caretSpot(offset) {
    var node = textEl.firstChild;
    if (!node || !node.length) {
      // Nothing to measure: an empty field's caret stands at the text's own
      // left edge.
      var box = textEl.getBoundingClientRect();
      return { left: box.left, top: box.top, height: 0 };
    }
    var at = Math.max(0, Math.min(offset, node.length));
    var range = doc.createRange();
    if (at < node.length) {
      try {
        range.setStart(node, at);
      } catch (err) {
        range.selectNodeContents(textEl);
      }
      range.collapse(true);
      var point = range.getClientRects()[0] || range.getBoundingClientRect();
      return { left: point.left, top: point.top, height: point.height };
    }
    range.setStart(node, node.length - 1);
    range.setEnd(node, node.length);
    var rects = range.getClientRects();
    // Wrapped text puts the insertion point at the end of the last rectangle.
    var rect = rects.length ? rects[rects.length - 1] : range.getBoundingClientRect();
    return { left: rect.right, top: rect.top, height: rect.height };
  }

  function render(state) {
    setPlaceholder(state.placeholder || '');

    if (state.text !== shown) {
      shown = state.text;
      textEl.textContent = state.text;
      // Any old highlight rectangles were measured against the old text.
      while (highlights.firstChild) {
        highlights.removeChild(highlights.firstChild);
      }
    }

    placeSelection(state.start, state.end);
    placeCaret(state);
    host.classList.toggle('is-empty', state.text === '');
  }

  function placeSelection(start, end) {
    var wanted = end > start ? selectionRange(start, end).getClientRects() : [];
    var children = highlights.children;
    // One rectangle per wrapped line of the selection; the count changes as the
    // selection grows, so the divs are added and taken away to match.
    while (children.length > wanted.length) {
      highlights.removeChild(highlights.lastChild);
    }
    while (children.length < wanted.length) {
      var box = doc.createElement('div');
      box.className = 'sim-field-hl';
      highlights.appendChild(box);
    }
    for (var i = 0; i < wanted.length; i++) {
      var rect = relativeToLayer(wanted[i]);
      var box = highlights.children[i];
      box.style.left = rect.left + 'px';
      box.style.top = rect.top + 'px';
      box.style.width = rect.width + 'px';
      box.style.height = rect.height + 'px';
    }
  }

  function placeCaret(state) {
    var spot = relativeToLayer(caretSpot(state.end));
    // An empty field has no range to measure, so the caret stands at the text's
    // own left edge at the height of a line.
    var height = spot.height || textEl.offsetHeight || parseFloat(getComputedStyle(host).lineHeight) || 16;
    caret.style.left = spot.left + 'px';
    caret.style.top = (spot.height ? spot.top : spot.top) + 'px';
    caret.style.height = height + 'px';
    caret.hidden = state.readOnly || state.disabled;
    // Restarting the blink is what makes a caret that just moved look awake.
    caret.classList.remove('is-blinking');
    // Force a reflow so the animation restarts rather than continuing.
    void caret.offsetHeight;
    caret.classList.add('is-blinking');
  }

  // The box a span of characters occupies, in the field's own pixels.
  function spanBox(from, to) {
    var node = textEl.firstChild;
    if (!node) {
      return null;
    }
    var range = doc.createRange();
    var at = Math.max(0, Math.min(from, node.length));
    var end = Math.max(at, Math.min(to, node.length));
    range.setStart(node, at);
    range.setEnd(node, end);
    var rects = range.getClientRects();
    return relativeToLayer(rects.length ? rects[rects.length - 1] : range.getBoundingClientRect());
  }

  // Which character a point falls in, measured rather than asked for.
  //
  // The offsets of a field are ordered twice over: downwards, so the line a point
  // is on can be found by searching for the first offset that is below it, and
  // then - within that line - left to right. Both are searches over the same
  // measurement the caret is drawn from, and both halve the distance each step,
  // so this costs what a click costs in a four-character password box and in a
  // document with a line of five thousand.
  function measuredIndexAt(x, y) {
    var length = textEl.firstChild ? textEl.firstChild.length : 0;
    if (!length) {
      return 0;
    }
    // The insertion point at an offset, in the same space as the point clicked.
    function spotAt(offset) {
      return relativeToLayer(caretSpot(offset));
    }
    // The first offset whose line the point is not above: a line that ends before
    // the point has been left behind, and the first one that does not is the line
    // the point is on.
    var lo = 0;
    var hi = length;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      var line = spotAt(mid);
      if (line.top + line.height <= y) { lo = mid + 1; } else { hi = mid; }
    }
    var lineStart = lo;
    // The first offset that has dropped past it: the end of that line.
    hi = length;
    while (lo < hi) {
      var next = (lo + hi) >> 1;
      if (spotAt(next).top <= y) { lo = next + 1; } else { hi = next; }
    }
    var lineEnd = lo;
    if (lineEnd <= lineStart) {
      return lineStart;
    }
    // Within the line: the last offset whose insertion point is at or before the
    // point, which is the character the point is in or the one before it.
    lo = lineStart;
    hi = lineEnd;
    while (lo < hi) {
      var mid3 = (lo + hi) >> 1;
      if (spotAt(mid3).left <= x) { lo = mid3 + 1; } else { hi = mid3; }
    }
    var at = lo - 1 < lineStart ? lineStart : lo - 1;
    // Which half of the character the point was in decides whether the caret goes
    // before it or after it - and a point out past the end of the line is that
    // line's end, the way Windows puts it there rather than at the next line's
    // start.
    if (at + 1 <= lineEnd) {
      var box = spanBox(at, at + 1);
      if (box && x > box.left + box.width / 2) {
        at = at + 1;
      }
    }
    return Math.min(at, length);
  }

  // Which character is under this point? The browser will say, and when it will
  // that is both the cheapest answer and the one that knows about writing
  // systems this file knows nothing about. It often will not: the text sits in a
  // layer that scrolling moves, and a point in the empty space to the right of a
  // line comes back as the element rather than as the text node. So when it
  // declines, the offset is measured - a click has to put the caret where the
  // finger is, not at the start of the field.
  function indexAt(clientX, clientY) {
    var range = null;
    if (doc.caretPositionFromPoint) {
      var position = doc.caretPositionFromPoint(clientX, clientY);
      if (position && position.offsetNode === textEl.firstChild) {
        range = doc.createRange();
        range.setStart(position.offsetNode, position.offset);
      }
    } else if (doc.caretRangeFromPoint) {
      range = doc.caretRangeFromPoint(clientX, clientY);
    }
    if (range && range.startContainer === textEl.firstChild) {
      return Math.max(0, Math.min(range.startOffset, shown ? shown.length : 0));
    }
    // Into the field's own pixels: the point as the text sees it, not as the page
    // draws it.
    var scale = layerScale();
    var base = viewport.getBoundingClientRect();
    var x = (clientX - base.left) / scale + scrollX;
    var y = (clientY - base.top) / scale + scrollY;
    return measuredIndexAt(x, y);
  }

  function setScroll(x, y) {
    var maxX = Math.max(0, contentWidth() - viewport.clientWidth);
    var maxY = Math.max(0, contentHeight() - viewport.clientHeight);
    scrollX = Math.max(0, Math.min(x, maxX));
    scrollY = options.multiline ? Math.max(0, Math.min(y, maxY)) : 0;
    layer.style.transform = 'translate(' + -scrollX + 'px,' + -scrollY + 'px)';
  }

  function contentWidth() {
    return Math.max(textEl.offsetWidth, viewport.clientWidth);
  }

  function contentHeight() {
    return Math.max(textEl.offsetHeight, viewport.clientHeight);
  }

  function keepCaretVisible(state) {
    var spot = relativeToLayer(caretSpot(state.end));
    var height = spot.height || caret.offsetHeight || 16;
    var nextX = scrollX;
    var nextY = scrollY;
    if (spot.left < scrollX) {
      nextX = spot.left;
    } else if (spot.left + 1 > scrollX + viewport.clientWidth) {
      nextX = spot.left + 1 - viewport.clientWidth;
    }
    if (options.multiline) {
      if (spot.top - (height - caret.offsetHeight) < scrollY) {
        nextY = Math.max(0, spot.top - height + caret.offsetHeight);
      } else if (spot.top > scrollY + viewport.clientHeight - height) {
        nextY = spot.top + height - viewport.clientHeight;
      }
    }
    if (nextX !== scrollX || nextY !== scrollY) {
      setScroll(nextX, nextY);
      // Scrolling moved the text out from under a caret and a selection that
      // were placed a moment ago, so they are placed again. Left alone they
      // would stand a whole scroll behind - which, on a document scrolled by a
      // line, is a line away from the character they belong to.
      placeSelection(state.start, state.end);
      placeCaret(state);
    }
  }

  return {
    render: render,
    indexAt: indexAt,
    setScroll: setScroll,
    keepCaretVisible: keepCaretVisible,
    caretHeight: function () {
      return caret.offsetHeight || 16;
    },
    get scrollLeft() { return scrollX; },
    get scrollTop() { return scrollY; },
    get contentWidth() { return contentWidth(); },
    get contentHeight() { return contentHeight(); },
    textElement: textEl
  };
}