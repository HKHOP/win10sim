import { openOpfs } from './storage/opfs.js';
import { createWindowsLayer } from './wintree/layer.js';
import { WINDOWS_ON_DISK_BYTES } from '../global/constants.js';
import {
  VOLUME_LABEL,
  ACCESS_DENIED,
  isAccessDenied,
  accessDenied,
  notFound,
  splitPath,
  parentOf
} from './winpath.js';

// Emulated NTFS volume "C:": Win-style paths, case-insensitive lookup, and two
// layers.
//
// The bottom layer is OPFS - the user's own files, the ones a document or a
// shortcut actually occupies space for. The top layer is the Windows tree in
// wintree/: the hundreds of folders and programs Windows itself is made of,
// read from a table and never written to, so a person can walk into
// C:\Windows\System32 on a phone and see what is there without the drive growing
// by a single byte. Where the two layers name the same thing - the user's
// Documents, the Recycle Bin - the disk wins: that is the copy with something in
// it.
//
// The rule that comes with the top layer is the one Windows enforces over it:
// anything Windows owns refuses to be deleted, replaced or renamed. The
// signed-in account's own folders are the exception, because those are the ones
// a person is meant to own.
//
// OPFS-only - where OPFS is unavailable (file://, private mode) mount resolves
// { available: false } and the sim boots without storage instead of crashing.

export { VOLUME_LABEL, ACCESS_DENIED, isAccessDenied };

export async function mountNtfs() {
  let store;
  try {
    store = await openOpfs();
  } catch (err) {
    return { available: false, label: VOLUME_LABEL, reason: String((err && err.message) || err) };
  }

  const windows = createWindowsLayer();

  // Walks case-insensitively, returning true on-disk segments.
  async function resolve(segments, createDirs) {
    const real = [];
    for (let i = 0; i < segments.length; i++) {
      const found = await store.resolve(real, segments[i]);
      if (found) {
        real.push(found.name);
      } else if (createDirs) {
        await store.makeDir(real.concat([segments[i]]));
        real.push(segments[i]);
      } else {
        throw notFound(segments.join('\\'));
      }
    }
    return real;
  }

  async function splitLeaf(path, createDirs) {
    const segments = splitPath(path);
    if (segments.length === 0) {
      throw new Error('Invalid path: ' + path);
    }
    const parent = await resolve(parentOf(segments), createDirs);
    const leaf = segments[segments.length - 1];
    const found = await store.resolve(parent, leaf);
    return { parent, name: found ? found.name : leaf };
  }

  // Whether anything of this path is on disk. The Windows layer answers for
  // folders that exist only in the table, so this is the only way to ask.
  async function onDisk(segments) {
    if (segments.length === 0) {
      return true;
    }
    try {
      await store.stat(parentOf(segments), segments[segments.length - 1]);
      return true;
    } catch (err) {
      return false;
    }
  }

  // OPFS handles expose no portable rename, so a move is a recursive copy
  // followed by a delete. Sim files are text, so a plain string round-trip
  // is enough.
  async function copyTree(srcSegments, destSegments) {
    const leaf = srcSegments[srcSegments.length - 1];
    if (!leaf) {
      throw new Error('Invalid path');
    }
    const info = await store.stat(parentOf(srcSegments), leaf);
    if (info.type === 'dir') {
      await store.makeDir(destSegments);
      const children = await store.listDir(srcSegments);
      for (const child of children) {
        await copyTree(srcSegments.concat([child.name]), destSegments.concat([child.name]));
      }
      return;
    }
    const file = await store.readFile(parentOf(srcSegments), leaf);
    await store.writeFile(parentOf(destSegments), destSegments[destSegments.length - 1], await file.text());
  }

  return {
    available: true,
    label: VOLUME_LABEL,

    // What the Windows tree says about a path, asked rather than caught: a
    // Delete button has to know before it moves anything, not after.
    isProtected(path) {
      return windows.isProtected(splitPath(path));
    },

    async listDir(path) {
      const segments = splitPath(path);
      if (windows.missing(segments)) {
        return [];
      }
      const out = [];
      const seen = new Set();
      const virtual = windows.children(segments);
      if (virtual) {
        for (const node of virtual.values()) {
          // A folder the person deleted stops being listed here as well: the
          // hiding is a property of the entry, not of the place it was in.
          if (windows.missing(segments.concat(node.name))) {
            continue;
          }
          seen.add(node.name.toLowerCase());
          out.push({ name: node.name, type: node.type, size: node.size, modified: node.modified });
        }
      }
      let real = [];
      try {
        real = await store.listDir(await resolve(segments, false));
      } catch (err) {
        // A folder that exists only in the Windows layer is not a folder on
        // disk; that is expected, and only worth reporting when there is no
        // Windows folder here either.
        if (!virtual) {
          throw notFound(path);
        }
      }
      for (const entry of real) {
        if (!seen.has(entry.name.toLowerCase())) {
          out.push(entry);
        }
      }
      // Same order the disk layer alone uses: folders first, then names.
      out.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
      return out;
    },

    async makeDir(path) {
      const segments = splitPath(path);
      if (segments.length === 0) {
        throw new Error('Invalid path: ' + path);
      }
      if (windows.missing(segments)) {
        throw notFound(path);
      }
      // Windows is quite happy to be asked for a folder it already has.
      if (windows.stat(segments)) {
        return;
      }
      windows.checkWritable(parentOf(segments), path);
      await resolve(segments, true);
    },

    async readFile(path) {
      const segments = splitPath(path);
      if (segments.length > 0 && !windows.missing(segments)) {
        const virtual = windows.stat(segments);
        if (virtual) {
          if (virtual.type !== 'file') {
            // Windows says this when a folder is opened as a file, and it is
            // the same answer it gives for anything else Windows owns.
            throw accessDenied(path);
          }
          return windows.openFile(virtual);
        }
      }
      const leaf = await splitLeaf(path, false);
      return store.readFile(leaf.parent, leaf.name);
    },

    async writeFile(path, data) {
      const segments = splitPath(path);
      if (segments.length === 0) {
        throw new Error('Invalid path: ' + path);
      }
      const existing = windows.missing(segments) ? null : windows.stat(segments);
      if (existing && existing.type === 'file') {
        // Replacing a file Windows owns is refused; replacing one of the
        // person's own is this, and the Windows copy stops being the answer.
        windows.checkProtected(segments, path);
        windows.forget(segments);
      }
      windows.checkWritable(parentOf(segments), path);
      windows.remember(segments);
      const leaf = await splitLeaf(path, true);
      await store.writeFile(leaf.parent, leaf.name, data);
    },

    async remove(path, recursive) {
      const segments = splitPath(path);
      windows.checkProtected(segments, path);
      const leaf = segments[segments.length - 1];
      if (!leaf) {
        throw new Error('Invalid path: ' + path);
      }
      if (!await onDisk(segments)) {
        if (windows.stat(segments)) {
          windows.forget(segments);
          return;
        }
        throw notFound(path);
      }
      windows.forget(segments);
      await store.remove(parentOf(segments), leaf, recursive);
    },

    async move(from, to) {
      const segments = splitPath(from);
      const dest = splitPath(to);
      const leaf = segments[segments.length - 1];
      if (!leaf || dest.length === 0) {
        throw new Error('Invalid path: ' + from);
      }
      windows.checkProtected(segments, from);
      windows.checkWritable(parentOf(dest), to);
      if (!await onDisk(segments)) {
        // Nothing to copy: a folder of the Windows tree moves by the name
        // changing, and the name it changes to is made real.
        windows.forget(segments);
        await store.makeDir(dest);
        return;
      }
      await copyTree(segments, dest);
      windows.forget(segments);
      windows.remember(dest);
      await store.remove(segments.slice(0, -1), leaf, true);
    },

    async stat(path) {
      const segments = splitPath(path);
      if (windows.missing(segments)) {
        throw notFound(path);
      }
      const virtual = windows.stat(segments);
      if (virtual) {
        return { type: virtual.type, size: virtual.size, modified: virtual.modified };
      }
      if (segments.length === 0) {
        return { type: 'dir', size: 0, modified: 0 };
      }
      const leaf = await splitLeaf(path, false);
      return store.stat(leaf.parent, leaf.name);
    },

    // What the drive says about itself.
    //
    // The free space is the browser's answer and only the browser's: it is the
    // one figure here a person could actually run out of, so nothing in this
    // project gets to improve on it. The used space is what Windows occupies on
    // a real system drive plus whatever this volume is storing - the Windows
    // entries the tree holds take no room at all, and the drive would be lying
    // to say they did.
    async getFreeSpace() {
      const info = await store.estimate();
      const free = Math.max(0, info.quota - info.usage);
      const usage = WINDOWS_ON_DISK_BYTES + info.usage;
      return { quota: usage + free, usage: usage, free: free };
    }
  };
}