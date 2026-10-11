// OPFS backend: the raw origin-private filesystem for the ntfs surface.
// All paths here are segment arrays; Win-style translation lives in ntfs.js.
// Requires a secure context (https or localhost) — file:// has no OPFS.

export async function openOpfs() {
  if (!navigator.storage || !navigator.storage.getDirectory) {
    throw new Error('OPFS is not supported by this browser');
  }
  const root = await navigator.storage.getDirectory();
  try {
    await navigator.storage.persist();
  } catch (err) {
    // Persistence is a hint, not a requirement.
  }

  async function childDir(parent, name, create) {
    return parent.getDirectoryHandle(name, { create: !!create });
  }

  async function walk(rootHandle, segments, createDirs) {
    let dir = rootHandle;
    for (const segment of segments) {
      dir = await childDir(dir, segment, createDirs);
    }
    return dir;
  }

  return {
    // Resolves possibly-wrong-cased segments against actual entries so the
    // layer above can be case-insensitive like NTFS.
    async resolve(parentSegments, name) {
      const dir = await walk(root, parentSegments, false);
      const target = name.toLowerCase();
      for await (const [entryName, handle] of dir.entries()) {
        if (entryName.toLowerCase() === target) {
          return { name: entryName, kind: handle.kind };
        }
      }
      return null;
    },

    async listDir(segments) {
      const dir = await walk(root, segments, false);
      const out = [];
      for await (const [name, handle] of dir.entries()) {
        out.push({ name, type: handle.kind === 'file' ? 'file' : 'dir' });
      }
      out.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
      return out;
    },

    async makeDir(segments) {
      await walk(root, segments, true);
    },

    async readFile(parentSegments, name) {
      const dir = await walk(root, parentSegments, false);
      const handle = await dir.getFileHandle(name);
      return handle.getFile();
    },

    async writeFile(parentSegments, name, data) {
      const dir = await walk(root, parentSegments, true);
      const handle = await dir.getFileHandle(name, { create: true });
      const stream = await handle.createWritable();
      await stream.write(data);
      await stream.close();
    },

    async remove(parentSegments, name, recursive) {
      const dir = await walk(root, parentSegments, false);
      await dir.removeEntry(name, { recursive: !!recursive });
    },

    async stat(parentSegments, name) {
      const dir = await walk(root, parentSegments, false);
      try {
        const fileHandle = await dir.getFileHandle(name);
        const file = await fileHandle.getFile();
        return { type: 'file', size: file.size, modified: file.lastModified };
      } catch (err) {
        // Not a file — maybe a directory.
      }
      const dirHandle = await dir.getDirectoryHandle(name);
      void dirHandle;
      return { type: 'dir', size: 0, modified: 0 };
    },

    async estimate() {
      try {
        const info = await navigator.storage.estimate();
        return { quota: info.quota || 0, usage: info.usage || 0 };
      } catch (err) {
        return { quota: 0, usage: 0 };
      }
    }
  };
}
