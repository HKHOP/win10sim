import { openOpfs } from './storage/opfs.js';

// Emulated NTFS volume "C:": Win-style paths, case-insensitive lookup,
// empty formatted volume (no seed tree). OPFS-only — where OPFS is
// unavailable (file://, private mode) mount resolves { available: false }
// and the sim boots without storage instead of crashing.

export const VOLUME_LABEL = 'C:';

function splitPath(path) {
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

function parentOf(segments) {
  return segments.slice(0, -1);
}

export async function mountNtfs() {
  let store;
  try {
    store = await openOpfs();
  } catch (err) {
    return { available: false, label: VOLUME_LABEL, reason: String((err && err.message) || err) };
  }

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
        throw new Error('Path not found: ' + segments.join('\\'));
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

    async listDir(path) {
      const segments = await resolve(splitPath(path), false);
      return store.listDir(segments);
    },

    async makeDir(path) {
      await resolve(splitPath(path), true);
    },

    async readFile(path) {
      const leaf = await splitLeaf(path, false);
      return store.readFile(leaf.parent, leaf.name);
    },

    async writeFile(path, data) {
      const leaf = await splitLeaf(path, true);
      await store.writeFile(leaf.parent, leaf.name, data);
    },

    async remove(path, recursive) {
      const leaf = await splitLeaf(path, false);
      await store.remove(leaf.parent, leaf.name, recursive);
    },

    async move(from, to) {
      const segments = splitPath(from);
      const leaf = segments[segments.length - 1];
      if (!leaf) {
        throw new Error('Invalid path: ' + from);
      }
      await copyTree(segments, splitPath(to));
      await store.remove(segments.slice(0, -1), leaf, true);
    },

    async stat(path) {
      const segments = splitPath(path);
      if (segments.length === 0) {
        return { type: 'dir', size: 0, modified: 0 };
      }
      const leaf = await splitLeaf(path, false);
      return store.stat(leaf.parent, leaf.name);
    },

    async getFreeSpace() {
      const info = await store.estimate();
      return { quota: info.quota, usage: info.usage, free: Math.max(0, info.quota - info.usage) };
    }
  };
}
