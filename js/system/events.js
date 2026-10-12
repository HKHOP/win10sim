// The shell's event bus: the one place the parts of the shell that cannot see
// each other talk. Explorer changes the volume and the desktop re-reads; a
// window closes and the taskbar repaints. Nothing imports a subscriber's
// module to say "this changed" - they subscribe to a topic instead, which is
// what keeps the desktop from having to know that Explorer exists.

var listeners = {};

export function on(topic, handler) {
  if (!listeners[topic]) {
    listeners[topic] = [];
  }
  listeners[topic].push(handler);
  return function () {
    off(topic, handler);
  };
}

export function off(topic, handler) {
  var forTopic = listeners[topic];
  if (!forTopic) {
    return;
  }
  var at = forTopic.indexOf(handler);
  if (at >= 0) {
    forTopic.splice(at, 1);
  }
}

export function emit(topic, payload) {
  var forTopic = listeners[topic];
  if (!forTopic) {
    return;
  }
  // Copied first: a handler is allowed to unsubscribe while the topic fires.
  forTopic.slice().forEach(function (handler) {
    try {
      handler(payload);
    } catch (err) {
      // One bad subscriber must not stop the rest of the shell hearing it.
    }
  });
}

// What Explorer emits after anything it does to the volume: a file created,
// renamed, deleted or moved. The desktop re-reads its folder when it hears it.
export const VOLUME_CHANGED = 'volume-changed';
