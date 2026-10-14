# Checks that every static reference in the repo points at a file that exists.
#
# The service worker spent its whole life registered as ../sw.js from js/boot/,
# which resolves to js/sw.js - a path that does not exist. Nothing broke: the
# registration is best-effort by design, so Chrome answered the 404 and carried
# on, and the only evidence was a console line nobody was reading. A wrong
# module path is the same - the page boots, one feature is quietly dead.
#
# This walks every way a file can name another file:
#   - ES module imports and re-exports, static and dynamic
#   - new URL('../x', import.meta.url), which the boot sequence uses for sw.js
#   - <link href> and <script src> in index.html
#   - the icons, start_url and scope named in manifest.webmanifest
# and reports anything that does not resolve. It reads the repo; it never writes.
#
# Run: py tools\check_refs.py
# Exit code 1 when something is missing, so it can gate a commit.

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Skipped: assets/win10-shell-icons is source material the app never requests,
# and .git holds the repository rather than the site.
SKIP_DIRS = {".git", "node_modules", "win10-shell-icons"}

# import ... from 'x' / export ... from 'x' / import 'x', and import('x').
# The from clause is optional: a bare import or re-export is a side-effect one.
IMPORT_RE = re.compile(
    r"""(?:^|[\s;=(])(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]"""
    r"""|import\s*\(\s*['"]([^'"]+)['"]\s*\)""",
    re.MULTILINE,
)

# new URL('../sw.js', import.meta.url) - a specifier resolved against the module.
NEW_URL_RE = re.compile(r"new URL\(\s*['\"]([^'\"]+)['\"]\s*,\s*import\.meta\.url\s*\)")

HTML_REF_RE = re.compile(r"""(?:href|src)=["']([^"']+)["']""")

# Schemes that are not files in this repo.
EXTERNAL_PREFIXES = ("http:", "https:", "data:", "//", "mailto:", "#", "blob:")


def walk_files(extensions):
    """Every file under the repo with one of these extensions."""
    found = []
    for base, dirs, names in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in names:
            if os.path.splitext(name)[1] in extensions:
                found.append(os.path.join(base, name))
    return found


def is_external(ref):
    return ref.startswith(EXTERNAL_PREFIXES) or "://" in ref


def relative(path):
    return os.path.relpath(path, ROOT).replace("\\", "/")


def resolves_from(ref, source_file):
    """The file `ref` names, as seen from `source_file`, or None if it is not a
    path in this repo."""
    if is_external(ref) or not ref:
        return None
    if ref.startswith("/"):
        return os.path.join(ROOT, ref.lstrip("/"))
    return os.path.normpath(os.path.join(os.path.dirname(source_file), ref))


def check_js(problems):
    """Every module specifier and import.meta.url target in every .js file."""
    for path in walk_files({".js", ".mjs"}):
        with open(path, "r", encoding="utf-8") as handle:
            source = handle.read()
        for pattern in (IMPORT_RE, NEW_URL_RE):
            for match in pattern.finditer(source):
                ref = match.group(1) or match.group(2)
                target = resolves_from(ref, path)
                if target and not os.path.exists(target):
                    line = source.count("\n", 0, match.start()) + 1
                    problems.append(
                        "%s:%d -> %s (resolved to %s)"
                        % (relative(path), line, ref, relative(target))
                    )


def check_html(problems):
    """Every href and src in index.html."""
    path = os.path.join(ROOT, "index.html")
    if not os.path.exists(path):
        problems.append("index.html is missing")
        return
    with open(path, "r", encoding="utf-8") as handle:
        source = handle.read()
    for match in HTML_REF_RE.finditer(source):
        ref = match.group(1)
        target = resolves_from(ref, path)
        if target and not os.path.exists(target):
            line = source.count("\n", 0, match.start()) + 1
            problems.append("index.html:%d -> %s" % (line, ref))


def walk_manifest(node, problems, trail=""):
    """The icons, start_url and scope the manifest names."""
    if isinstance(node, list):
        for index, value in enumerate(node):
            walk_manifest(value, problems, "%s[%d]." % (trail, index))
        return
    if not isinstance(node, dict):
        return
    for key, value in node.items():
        if key in ("src", "start_url", "scope") and isinstance(value, str):
            target = resolves_from(value, os.path.join(ROOT, "manifest.webmanifest"))
            if target and not os.path.exists(target):
                problems.append("manifest.webmanifest %s%s -> %s" % (trail, key, value))
        walk_manifest(value, problems, trail + key + ".")


def check_manifest(problems):
    path = os.path.join(ROOT, "manifest.webmanifest")
    if not os.path.exists(path):
        problems.append("manifest.webmanifest is missing")
        return
    with open(path, "r", encoding="utf-8") as handle:
        walk_manifest(json.load(handle), problems)


def main():
    problems = []
    check_js(problems)
    check_html(problems)
    check_manifest(problems)
    if problems:
        print("Missing references (%d):" % len(problems))
        for problem in problems:
            print("  " + problem)
        return 1
    print("All references resolve.")
    return 0


if __name__ == "__main__":
    sys.exit(main())