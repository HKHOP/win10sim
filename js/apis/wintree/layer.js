import {
  winStat,
  winChildren,
  winIsProtected,
  winWritable,
  winContent
} from './tree.js';
import { keyOf, accessDenied } from '../winpath.js';

// The Windows tree as the volume asks for it.
//
// The volume above knows about a store and nothing else; everything it needs to
// know about Windows - what a folder holds, whether it may be written to, what
// a file is worth - comes from here, so that the rules about Windows' own files
// live in one place instead of being spread through the disk code.
//
// It also keeps the one piece of state the layer needs: the entries that have
// been deleted or renamed away this session. A Windows folder is not on disk, so
// deleting one has nothing to erase - what a person sees is the folder no longer
// being there, and that is what this remembers. It describes how the drive is
// being looked at right now rather than what is on it, so it is not stored.

export function createWindowsLayer() {
  const gone = new Set();

  // True when this path, or anything above it, has been deleted or moved away.
  function missing(segments) {
    for (let i = 1; i <= segments.length; i++) {
      if (gone.has(keyOf(segments.slice(0, i)))) {
        return true;
      }
    }
    return false;
  }

  return {
    missing,

    // The entry a path names, Windows' own, or null.
    stat: winStat,

    // A folder's entries, Windows' own, or null when the path is not one.
    children: winChildren,

    // Windows does not give these away: a delete, a replace and a rename of
    // anything it owns are all refused, and the refusal names the thing.
    isProtected: winIsProtected,

    checkProtected(segments, path) {
      if (winIsProtected(segments)) {
        throw accessDenied(path);
      }
    },

    // Where a new file may be written: any folder the person owns, plus the bin.
    checkWritable(parentSegments, path) {
      if (winStat(parentSegments) && !winWritable(parentSegments)) {
        throw accessDenied(path);
      }
    },

    // What a Windows file holds: its own content where it has any, and nothing
    // at all where it does not. A file nobody has ever written is empty, and
    // this one is nobody's.
    openFile(node) {
      return new File([winContent(node)], node.name, { lastModified: node.modified });
    },

    // An entry the disk layer is now the answer for, so the Windows copy of the
    // name steps aside.
    forget(segments) {
      gone.add(keyOf(segments));
    },

    // ...and the other way round, for a name that has come back.
    remember(segments) {
      gone.delete(keyOf(segments));
    }
  };
}