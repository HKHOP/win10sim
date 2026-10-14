// Win-style paths, and the two answers the filesystem gives back.
//
// Everything above this pair speaks in segments ("Windows", "System32") rather
// than in paths, because a path is what a person types and a segment array is
// what a lookup needs. The drive letter is dropped, separators are normalised,
// "." and ".." are folded away, and every name is then compared without regard
// to case - which is the one thing NTFS promised and everything above it relies
// on.

export const VOLUME_LABEL = 'C:';

// Windows refuses rather than failing: a delete of something the system owns
// comes back as this code, and a caller can tell the refusal apart from a
// mistake of its own.
export const ACCESS_DENIED = 'access-denied';

export function accessDenied(path) {
  const err = new Error('Access is denied: ' + path);
  err.code = ACCESS_DENIED;
  return err;
}

export function isAccessDenied(err) {
  return !!(err && err.code === ACCESS_DENIED);
}

export function notFound(path) {
  return new Error('Path not found: ' + path);
}

export function splitPath(path) {
  const cleaned = String(path || '').replace(/\//g, '\\');
  const parts = cleaned.split('\\').filter((part) => part && part !== '.');
  if (parts.length > 0 && /^[a-zA-Z]:$/.test(parts[0])) {
    parts.shift();
  }
  const out = [];
  for (const part of parts) {
    if (part === '..') {
      out.pop();
    } else {
      out.push(part);
    }
  }
  return out;
}

export function parentOf(segments) {
  return segments.slice(0, -1);
}

// The name a path is filed under, in the one case the filesystem has for it:
// as a key, in lower case, with the separators the caller already normalised.
export function keyOf(segments) {
  return segments.join('\\').toLowerCase();
}