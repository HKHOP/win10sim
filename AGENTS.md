# AGENTS.md — Windows 10 Simulator

This file guides all agents (human + AI) working on this repo. Follow it on every task.

## 1. Project Overview

- Full Windows 10 simulator as a static web app, hosted on GitHub (e.g. GitHub Pages).
- Goal: faithful Windows 10 system UI + emulated APIs / system behavior.
- Audience: primarily mobile-device users who have never used a PC — teach basics through advanced usage by exploring the simulated system itself.
- No step-by-step tutorials in-app. Learning happens through the UI emulation.
- Stack: plain HTML + CSS + vanilla JavaScript (ES modules). No TypeScript. No Node.js. No npm. No build step. No backend.
- Deploy model: the repo IS the build. The completed state on the main/git-synced branch is what gets served statically. Do not add anything that requires server-side execution.

## 2. Repository Structure (Iteration 1 — do not reshape without approval)

```text
Root/
  index.html        Entry point. Links css/ and js/boot/ only. No inline app logic.
  css/              All styles. One concern per file (e.g. desktop.css, taskbar.css, window.css).
  js/
    boot/           Boot sequence: BIOS/UEFI splash, login/lock screen, session init.
    kernel/         Emulated kernel: process table, scheduler, memory, power states.
    core/           Core shell: desktop, window manager, taskbar, Start menu, Action Center, settings state.
    system/         System services: central state store, event bus, emulated registry, notifications.
    apis/           Emulated APIs exposed to apps: filesystem, registry, clipboard, network (fake), dialog boxes.
    apps/           Built-in apps. One subfolder per app (e.g. apps/explorer/, apps/notepad/).
                    Each app: app.js (entry) + app.css (scoped) + optional assets.
    global/         Shared constants, helpers, utils only. No app or system logic here.
  assets/           Static binary assets only: icons, wallpapers, fonts, sounds. No code.
  .nojekyll         Required for GitHub Pages (serve files as-is, allow underscore dirs).
  .gitignore        OS/editor junk only. Never ignore index.html, css/, js/, assets/.
  AGENTS.md         This file (agent operating instructions).
  CHANGELOG.md      Per-task-completion changelog (MAJOR.MINOR.PATCH).
```

Placement rules:
- UI shell (taskbar, desktop, windows) → `js/core/` + `css/`.
- Cross-cutting state/events → `js/system/`.
- Fake OS primitives (processes, FS, registry) → `js/kernel/` (scheduling/lifecycle) or `js/apis/` (call surface).
- New app → new folder under `js/apps/<app-name>/`. Never drop loose app files in `js/apps/` root.
- Shared pure helpers → `js/global/`. If it touches DOM/state, it does not belong in `global/`.
- Binary/media → `assets/` only.

## 3. Technical Constraints

1. Static only: must run by opening `index.html` or via GitHub Pages. No fetch to localhost, no Node APIs, no bundler imports.
2. Vanilla JS with `<script type="module">` + relative `import` paths. No CDN frameworks unless explicitly approved.
3. Mobile-first + touch support: every pointer interaction must also work with touch (pointer events, large hit targets). Test at 360px width.
4. Performance: DOM-based windowing, no canvas for UI chrome. Cap animations with `prefers-reduced-motion` respect.
5. Persistence is OPFS-backed (`js/apis/storage/opfs.js` via the `ntfs` surface); never use cookies or external storage.
6. No external network calls at runtime (offline-capable, except GitHub Pages hosting itself).

## 4. Coding Conventions

- ES modules, `camelCase` for JS, `kebab-case` for files/CSS classes, `UPPER_SNAKE` for constants in `js/global/`.
- One module = one responsibility. Keep files small; split when >300 lines.
- Boot order is the dependency order: `global` → `system` → `kernel` → `apis` → `core` → `apps` → `boot` (init last).
- No circular imports. `apps/` may import from `apis/`, `system/`, `global/` — never from another app directly and never from `boot/`.
- CSS scoped per component; no global `*` resets beyond the single base file.
- Pointer lock freezes the OS cursor, so real `:hover` never follows the sim cursor — author every interactive hover as a `:hover, .sim-hover` selector pair (`cursor.js` toggles the class while locked).
- Comments explain Windows-behavior emulation choices (e.g. "Win10 taskbar groups by app id"), not restatements of code.

## 5. Workflow

1. One task = one changelog version (see §6). Do not batch unrelated tasks into one version.
2. Structure first, logic later: Iteration 1 is structure only. Do not implement simulator logic until asked.
3. Verify by opening `index.html` directly in a browser (or `npx serve` equivalent is FORBIDDEN — no Node; use VS Code Live Server / Python http.server / GitHub Pages preview if needed).
4. Keep diffs minimal and categorized — never move files across categories silently; call it out in the changelog under `Changed`.

## 6. CHANGELOG.md Rules (strict)

- Add a new section on every TASK completion, not every conversation.
- Version format: `MAJOR.MINOR.PATCH` (`MAJOR` = breaking/rework, `MINOR` = new feature/category, `PATCH` = fix/tweak).
- Each version section MUST have: `## [x.y.z] - Title` + date line (`YYYY-MM-DD`), followed by ONLY these subsections in this order: `### Added`, `### Removed`, `### Changed`, `### Fixed`.
- No other subsection names. If a subsection is empty, write `- None`.
- Latest version on top.

## 7. Out of Scope (do not add without explicit request)

- Tutorials / guided tours, backend accounts, real filesystem access, executable downloads, Node/npm tooling, frameworks (React/Vue/Tailwind), TypeScript.
