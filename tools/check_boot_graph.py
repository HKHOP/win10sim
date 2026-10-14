# Walks the module graph the shell actually boots, from index.html down.
#
# check_refs.py answers "does this path exist?". This answers the two questions
# that only come out of the graph as a whole:
#
#   - reachability: a module that is written but never reached is dead weight,
#     and one that is reached but missing takes the whole boot down. A module
#     fetch that 404s mid-graph is not a console line here, it is a blank
#     screen, because the entry's import never resolves.
#   - cycles: AGENTS.md forbids circular imports, and a cycle between two
#     modules is legal ES that fails at run time - one of them sees the other's
#     exports still undefined. Nothing else in the repo enforces the rule, so
#     it is enforced here.
#
# Boot order is the dependency order (global -> system -> kernel -> apis ->
# core -> apps -> boot); a cycle is reported with the whole ring, so what to
# move is visible from the output.
#
# Run: py tools\check_boot_graph.py
# Exit code 1 on a missing module or a cycle.

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SKIP_DIRS = {".git", "node_modules", "win10-shell-icons"}

# import ... from 'x' / export ... from 'x' / import 'x', and import('x').
IMPORT_RE = re.compile(
    r"""(?:^|[\s;=(])(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]"""
    r"""|import\s*\(\s*['"]([^'"]+)['"]\s*\)""",
    re.MULTILINE,
)

SCRIPT_SRC_RE = re.compile(r"""<script[^>]*\ssrc=["']([^"']+)["']""")

EXTERNAL_PREFIXES = ("http:", "https:", "data:", "//", "mailto:", "#", "blob:")


def relative(path):
    return os.path.relpath(path, ROOT).replace("\\", "/")


def is_external(ref):
    return ref.startswith(EXTERNAL_PREFIXES) or "://" in ref


def module_path(ref, source_file):
    """The .js file `ref` names from `source_file`, or None if it is not a
    relative module in this repo."""
    if not ref or is_external(ref):
        return None
    base = os.path.normpath(os.path.join(os.path.dirname(source_file), ref))
    return base if base.endswith(".js") else None


def imports_of(path):
    """Every relative module this file imports, as absolute paths.

    Side-effect imports (`import './x.js'`) count: they still have to resolve,
    and they are still an edge in the graph.
    """
    if not path or not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as handle:
        source = handle.read()
    out = []
    for match in IMPORT_RE.finditer(source):
        target = module_path(match.group(1) or match.group(2), path)
        if target:
            out.append(target)
    return out


def entry_points():
    """index.html's module script: the one the browser starts from."""
    index = os.path.join(ROOT, "index.html")
    if not os.path.exists(index):
        return []
    with open(index, "r", encoding="utf-8") as handle:
        source = handle.read()
    out = []
    for match in SCRIPT_SRC_RE.finditer(source):
        target = module_path(match.group(1), index)
        if target:
            out.append(target)
    return out


def reachable(entries, problems):
    """Every module the boot pulls in, plus the ones that do not exist."""
    seen = set()
    missing = set()
    queue = list(entries)
    while queue:
        path = queue.pop()
        if not os.path.exists(path):
            missing.add(path)
            continue
        if path in seen:
            continue
        seen.add(path)
        queue.extend(imports_of(path))
    for path in sorted(missing):
        problems.append("module does not exist: " + relative(path))
    return seen


def find_cycle(graph):
    """One cycle in the graph, as the list of modules in it, or None.

    Iterative depth-first search with the recursion stack kept on the side, so a
    deep graph cannot run this into Python's limit.
    """
    WHITE, GREY, BLACK = 0, 1, 2
    colour = {node: WHITE for node in graph}
    trail = []

    for start in sorted(graph):
        if colour[start] != WHITE:
            continue
        stack = [(start, iter(graph[start]))]
        colour[start] = GREY
        trail.append(start)
        while stack:
            node, children = stack[-1]
            advanced = False
            for child in children:
                if child not in colour:
                    continue          # a module that does not exist
                if colour[child] == GREY:
                    # Back edge: everything from `child` onward is the ring.
                    return trail[trail.index(child):]
                if colour[child] == WHITE:
                    colour[child] = GREY
                    trail.append(child)
                    stack.append((child, iter(graph[child])))
                    advanced = True
                    break
            if not advanced:
                colour[node] = BLACK
                stack.pop()
                trail.pop()
    return None


def orphaned(modules, graph):
    """Modules under js/ that the boot never reaches."""
    out = []
    for base, dirs, names in os.walk(os.path.join(ROOT, "js")):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in names:
            if not name.endswith(".js"):
                continue
            path = os.path.join(base, name)
            if path not in modules:
                out.append(relative(path))
    return sorted(out)


def main():
    problems = []
    entries = entry_points()
    if not entries:
        print("index.html names no module script; nothing to walk.")
        return 1

    modules = reachable(entries, problems)
    graph = {path: imports_of(path) for path in modules}

    cycle = find_cycle(graph)
    if cycle:
        problems.append(
            "circular import: " + " -> ".join(relative(p) for p in cycle) +
            " -> " + relative(cycle[0])
        )

    for name in orphaned(modules, graph):
        problems.append("never reached from index.html: " + name)

    if problems:
        print("Boot graph (%d module(s) reached) has %d problem(s):"
              % (len(modules), len(problems)))
        for problem in problems:
            print("  " + problem)
        return 1
    print("Boot graph is sound: %d modules, no cycles, none orphaned."
          % len(modules))
    return 0


if __name__ == "__main__":
    sys.exit(main())