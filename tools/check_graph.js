// Stand-in for tools/check_boot_graph.py and tools/check_refs.py: this machine
// has no Python. Walks the module graph from index.html the same way and
// reports modules that do not exist, modules the boot never reaches, and
// circular imports.
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SKIP = new Set(['.git', 'node_modules', 'win10-shell-icons']);
const EXTERNAL = /^(https?:|\/\/|data:|mailto:|#|blob:)/;

const IMPORT_RE = /(?:^|[\s;=(])(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/gm;
const SCRIPT_RE = /<script[^>]*\ssrc=["']([^"']+)["']/gm;

function resolve(ref, from) {
  if (!ref || EXTERNAL.test(ref) || ref.includes('://')) return null;
  const base = path.normalize(path.join(path.dirname(from), ref));
  return base.endsWith('.js') ? base : null;
}

function importsOf(file) {
  let source;
  try { source = fs.readFileSync(file, 'utf8'); } catch (e) { return []; }
  const out = [];
  let m;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(source))) out.push(resolve(m[1] || m[2], file));
  return out.filter(Boolean);
}

function entries() {
  const index = path.join(ROOT, 'index.html');
  const source = fs.readFileSync(index, 'utf8');
  const out = [];
  let m;
  SCRIPT_RE.lastIndex = 0;
  while ((m = SCRIPT_RE.exec(source))) {
    const r = resolve(m[1], index);
    if (r) out.push(r);
  }
  return out;
}

const problems = [];
const seen = new Set();
const missing = new Set();
const queue = entries();
while (queue.length) {
  const p = queue.pop();
  if (!fs.existsSync(p)) { missing.add(p); continue; }
  if (seen.has(p)) continue;
  seen.add(p);
  queue.push(...importsOf(p));
}
for (const p of missing) problems.push('module does not exist: ' + path.relative(ROOT, p));

const graph = new Map();
for (const p of seen) graph.set(p, importsOf(p).filter((x) => seen.has(x)));

function findCycle() {
  const WHITE = 0, GREY = 1, BLACK = 2;
  const colour = new Map([...graph.keys()].map((k) => [k, WHITE]));
  for (const start of [...graph.keys()].sort()) {
    if (colour.get(start) !== WHITE) continue;
    const trail = [start];
    const stack = [[start, graph.get(start)[Symbol.iterator]()]];
    colour.set(start, GREY);
    while (stack.length) {
      const [node, it] = stack[stack.length - 1];
      let advanced = false;
      for (const child of it) {
        if (colour.get(child) === GREY) return trail.slice(trail.indexOf(child));
        if (colour.get(child) === WHITE) {
          colour.set(child, GREY);
          trail.push(child);
          stack.push([child, graph.get(child)[Symbol.iterator]()]);
          advanced = true;
          break;
        }
      }
      if (!advanced) { colour.set(node, BLACK); stack.pop(); trail.pop(); }
    }
  }
  return null;
}

const cycle = findCycle();
if (cycle) problems.push('circular import: ' + cycle.map((p) => path.relative(ROOT, p)).join(' -> ') + ' -> ' + path.relative(ROOT, cycle[0]));

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.js') && !seen.has(p)) problems.push('never reached from index.html: ' + path.relative(ROOT, p));
  }
}
walk(path.join(ROOT, 'js'));

// CSS references: every url() and <link href> must exist.
const cssMissing = [];
function checkCss(file) {
  const source = fs.readFileSync(file, 'utf8');
  const refs = [...source.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (EXTERNAL.test(ref) || ref.startsWith('data:')) continue;
    const target = path.normalize(path.join(path.dirname(file), ref.split('?')[0]));
    if (!fs.existsSync(target)) cssMissing.push(path.relative(ROOT, file) + ' -> ' + ref);
  }
}
for (const file of fs.readdirSync(path.join(ROOT, 'css'))) {
  if (file.endsWith('.css')) checkCss(path.join(ROOT, 'css', file));
}
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const m of indexHtml.matchAll(/<link[^>]*href=["']([^"']+)["']/g)) {
  const ref = m[1];
  if (EXTERNAL.test(ref)) continue;
  if (!fs.existsSync(path.normalize(path.join(ROOT, ref)))) cssMissing.push('index.html -> ' + ref);
}
for (const c of cssMissing) problems.push('stylesheet/asset does not exist: ' + c);

if (problems.length) {
  console.log('Boot graph (' + seen.size + ' module(s)) has ' + problems.length + ' problem(s):');
  for (const p of problems) console.log('  ' + p);
  process.exit(1);
}
console.log('Boot graph is sound: ' + seen.size + ' modules, no cycles, none orphaned, all CSS/assets resolve.');
