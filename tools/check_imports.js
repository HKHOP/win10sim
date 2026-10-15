// Checks that every named import resolves to a real export in the module it
// names, and that no module exports the same name twice.
//
// Why this exists rather than being left to the browser: node --check only parses,
// so it happily accepts an import of a name that does not exist, and it happily
// accepts two `export` statements of one name. Both reach the browser as a
// module error at load time - the whole shell's boot graph dies, every app with
// it - and neither is visible until the page is opened. The only reason the
// earlier ones were found at all was reading the code by hand.
//
// Run: node tools/check_imports.js

const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(__dirname);
const JS_DIR = path.join(ROOT, 'js');

// Every .js under js/, excluding the global barrel that re-exports the font.
function jsFiles(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      jsFiles(full, out);
    } else if (entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

const files = jsFiles(JS_DIR, []);

// A module's exports, read from its own source. This is the same information a
// bundler would build, gathered without running anything: an `export` keyword in
// front of a declaration, or a name listed in an `export { }` clause.
function exportsOf(file) {
  const src = fs.readFileSync(file, 'utf8');
  const names = new Set();
  const duplicates = [];

  const decl = /^\s*export\s+(?:async\s+)?(?:function\s*\*?|const|let|var|class)\s+([A-Za-z0-9_$]+)/gm;
  let m;
  while ((m = decl.exec(src))) {
    if (names.has(m[1])) {
      duplicates.push(m[1]);
    }
    names.add(m[1]);
  }

  // `export const A = 1, B = 2;` - the decl regex only catches the first.
  const multi = /^\s*export\s+(?:const|let|var)\s+([^=;]+)=/gm;
  while ((m = multi.exec(src))) {
    for (const part of m[1].split(',')) {
      const name = part.trim().match(/^([A-Za-z0-9_$]+)/);
      if (name && !names.has(name[1])) {
        names.add(name[1]);
      }
    }
  }

  // `export { a, b as c };` and `export { a } from './x.js';`
  const clause = /^\s*export\s*\{([^}]*)\}/gm;
  while ((m = clause.exec(src))) {
    for (const part of m[1].split(',')) {
      const as = part.trim().match(/\bas\s+([A-Za-z0-9_$]+)\s*$/);
      const plain = part.trim().match(/^([A-Za-z0-9_$]+)/);
      const name = as ? as[1] : (plain ? plain[1] : null);
      if (name) {
        if (names.has(name)) {
          duplicates.push(name);
        }
        names.add(name);
      }
    }
  }

  // `export default` is not a named export and nothing imports it by name.
  return { names, duplicates };
}

const exportCache = new Map();
function exportsCached(file) {
  if (!exportCache.has(file)) {
    exportCache.set(file, exportsOf(file));
  }
  return exportCache.get(file);
}

let checks = 0;
const failures = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');

  // A duplicate export is a load-time error for the whole module graph, and it
  // is invisible to a parse.
  for (const name of exportsCached(file).duplicates) {
    failures.push(rel + ': exported twice - "' + name + '"');
    checks += 1;
  }

  // Every named import from a relative path. Bare specifiers are left alone:
  // they name packages, and there are none.
  const re = /import\s*\{([^}]*)\}\s*from\s*['"](\.[^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src))) {
    const spec = m[2];
    const target = path.resolve(path.dirname(file), spec);
    checks += 1;
    if (!fs.existsSync(target)) {
      failures.push(rel + ': imports from "' + spec + '", which does not exist');
      continue;
    }
    const available = exportsCached(target).names;
    for (const part of m[1].split(',')) {
      const text = part.trim();
      if (!text) {
        continue;
      }
      // `import { a as b }` - the name that must exist in the target is the
      // one before the `as`, because that is what is being asked for.
      const as = text.match(/^([A-Za-z0-9_$]+)\s+as\s+/);
      const name = as ? as[1] : text;
      checks += 1;
      if (!available.has(name)) {
        failures.push(rel + ': imports "' + name + '" from "' + spec +
          '", which does not export it');
      }
    }
  }

  // `export { a } from './x.js'` and `export * from './x.js'` also have to point
  // somewhere real, or the module graph breaks at load.
  const reexport = /export\s*(?:\*|\{[^}]*\})\s*from\s*['"](\.[^'"]+)['"]/g;
  while ((m = reexport.exec(src))) {
    checks += 1;
    const target = path.resolve(path.dirname(file), m[1]);
    if (!fs.existsSync(target)) {
      failures.push(rel + ': re-exports from "' + m[1] + '", which does not exist');
    }
  }
}

if (failures.length) {
  console.error('Module contracts have ' + failures.length + ' problem(s):\n');
  failures.forEach((line) => console.error('  - ' + line));
  process.exit(1);
}
console.log('Module contracts are sound: ' + files.length + ' modules, ' +
  checks + ' import(s) resolve, no duplicate exports.');