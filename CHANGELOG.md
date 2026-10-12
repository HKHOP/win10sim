# Changelog — Windows 10 Simulator

All task completions (not conversations) get a new version section below.
Format: MAJOR.MINOR.PATCH. Latest version on top.

## [0.21.1] - Tiles: honest hover, and a tile you can actually pick up

2026-10-12

### Added

- The dragged tile is carried under the pointer while it is being reordered, the way Win10 lifts it out of the grid, with the offset kept across the rebuild a reorder triggers

### Removed

- None

### Changed

- `startmenu.css`: the resize handles moved wholly outside the tile (10px handles instead of 12px straddling the edge) and softened from 45% to 30% blue, so hovering a tile no longer paints a heavy blue bar over its edge
- `starttiles.js`: ending a drag clears the tile's lift and drop shadow, so it settles back into its new slot

### Fixed

- An invisible resize handle still took presses: `.start-tile-grip` had no `pointer-events` rule, so a transparent grip swallowed hit-tests, and the right-hand grip covered the tile's rightmost 7px — grabbing a tile near its edge began a resize instead of a move, which read as the tile being stuck
- A dragged tile stayed in its slot and did not follow the pointer, so a reorder looked like nothing happened at all

## [0.21.0] - Icon column opens on hover, app list becomes its own segment

2026-10-12

### Added

- The column opens its labels on hover: `:has(.start-rail:hover)` for the real pointer and `:has(.start-rail .sim-hover)` for the emulated one, since the frozen OS pointer never fires a real `:hover`
- A touch fallback — a tap on any column button latches it open with `.rail-latched` (coarse pointers only), and a tap inside the menu off the column, or closing Start, drops the latch
- `START_RAIL_OPEN_W` (190px) in `js/global/constants.js`: the column's open width, wide enough for its labels and for the account and power fly-outs
- `--menu-w` / `--rail-w` / `--rail-w-open` / `--list-w` custom properties, so the geometry stays in `constants.js` while the CSS owns the hover behaviour

### Removed

- The hamburger's label-folding job and the `.rail-collapsed` class — the column is glyphs only by default now, and hover (or a tap) is what spells it out

### Changed

- `startmenu.js`: the app list is a segment of the menu in its own right, appended between the column and the tile grid instead of living inside the column
- `startmenu.js`: the hamburger is now Win10's shortcut between the two column views, with its aria-label naming the view it switches to
- `startmenu.css`: the panel widens by the column's growth while the column is open, instead of squeezing the segments — the app list stays whole beside it and the tile grid is never clipped; the account and power glyphs stack only while the column is closed, and the fly-outs open beside the closed strip

### Fixed

- The app list was drawn inside the sidebar, so the sidebar and the list were one and the same thing rather than the separate segments Windows documents

## [0.20.2] - Fold the account and power row into the icon strip

2026-10-12

### Added

- None

### Removed

- None

### Changed

- `startmenu.css`: in the folded rail the account and power glyphs stack vertically, as they do in Win10's narrow icon column, and their fly-outs open to the right of the strip over the tiles instead of spilling past the menu's left edge

### Fixed

- With the rail folded to its 48px strip, the account and power buttons still sat side by side and needed roughly 80px, so the row overflowed the strip and drew over the tile grid

## [0.20.1] - Account and power row stayed at the rail's bottom

2026-10-12

### Added

- None

### Removed

- None

### Changed

- `startmenu.css`: the rail's bottom row takes `margin-top: auto`, so the account and power buttons stay on the rail's floor instead of riding up under the view picker

### Fixed

- In the Pinned apps view the app list is hidden, which left nothing stretching the rail column, so the account and power buttons jumped up to the top of the rail under the App list / Pinned apps buttons

## [0.20.0] - Start menu rail as its own view picker

2026-10-12

### Added

- A rail header carrying the hamburger and the "Start" title, the label Win10 1607 put back next to the hamburger after Windows XP
- An `App list` / `Pinned apps` view picker under the title, the selected view marked with a pressed background and `aria-pressed`; `App list` is the default view
- `APP_LIST_SVG` and `TILES_SVG` in `js/global/icons.js`: the bulleted-list and tile-grid glyphs the two rail views are named with
- A persisted `showAppList` Start setting (Win10's Settings > Personalization > Start > "Show app list"), so Start reopens in the view it was left in

### Removed

- The hamburger's old job of folding the rail's own labels away, which is now the App list / Pinned apps switch

### Changed

- `startmenu.js`: the rail is no longer the app list itself — the list is one view inside a rail that also owns its title, the view picker and the account/power row; picking `Pinned apps` hides the list and folds the rail into its 48px icon strip, handing the freed width to the tile grid, exactly as Win10 behaves when the app list is hidden
- `startmenu.js`: the hamburger now only spells the rail out or folds it while the app list is showing, and stands down in the Pinned apps view where the `App list` button is the way back; it keeps its own aria-label describing the direction of the toggle
- Arrow/Enter navigation of the app list is skipped while the list is hidden, and opening Start only parks focus in the list when it is on show
- `startmenu.css`: new `.start-rail-head`, `.start-rail-title`, `.start-rail-views`, `.start-rail-view` styles, icon-strip rules for the folded rail (including the view labels), and the hamburger's old full-width row replaced by a 24px button inside the header

### Fixed

- Start opened with the app list doubling as the sidebar, so there was no separate rail to hold the Start title, the view picker, and the account/power row

## [0.19.2] - Mandatory commit and push on task completion

2026-10-12

### Added

- None

### Removed

- None

### Changed

- `AGENTS.md` §5.5: a completed task now explicitly requires both a commit and a push — the work is committed to `main` together with its CHANGELOG entry, and the task is not reported as done until `git push origin main` succeeds, since Pages only serves the pushed state

### Fixed

- None

## [0.19.1] - Real Win10 shell icons for Notepad and the icon library

2026-10-11

### Added

- `assets/shell/`: the genuine Windows 10 shell + app icons, extracted from the build-21343 `Imageres.dll` / `Shell32.dll` sets already in `assets/win10-shell-icons` and rendered as tight, square 128px PNGs that match the other assets in `assets/`: `text-document` (Imageres 014), `folder` (003), `drive` (030), `system-drive` (031, the Windows-logo C: drive), `this-pc` (020) and `this-pc-monitor` (104), `file-explorer` (264), `settings-gear` (109), `control-panel`, `clock` (138), `onedrive` (220), `user` (237), `console` (242), `camera` (052), and `recycle-bin-full`

### Removed

- The hand-drawn `assets/notepad.svg` approximation (superseded by the real Notepad icon)
- The orphaned root `assets/drive.png` (the plain-drive glyph now lives at `assets/shell/drive.png`)

### Changed

- `NOTEPAD_SRC` now points at the real Windows 10 Notepad icon (`assets/notepad.png`), so the title bar, taskbar button and Start tile use the authentic blue spiral notepad
- `DRIVE_SRC` now points at the real Win10 system-drive icon (`assets/shell/system-drive.png`, `Imageres_dll_031` — the Windows logo over the drive), so both the Explorer's "System (C:)" quick-access item and the This PC drive row show the Windows-logo drive instead of the plain drive glyph

### Fixed

- Explorer's C: drive was using the generic drive icon instead of the Windows system-drive icon

## [0.19.0] - Notepad

2026-10-11

### Added

- `js/apps/notepad/` Microsoft Notepad, the Win10 original: menu bar (File / Edit / Format / View / Help), monospace Consolas editor with no spell-check or autocorrect, status bar, and the classic dialogs
- File menu with working New (Ctrl+N), Open (Ctrl+O), Save (Ctrl+S), Save As (Ctrl+Shift+S), Recent documents, and Exit, all reading and writing the emulated `C:` volume; Open and Save As use the classic Win10 dialogs with a navigable file list, a File name box and a `*.txt` type filter, and saving overwrites through a proper confirm
- Edit menu with Undo, Cut, Copy, Paste, Delete (Del), Find (Ctrl+F) with Find Next (F3), Replace (Ctrl+H, Replace Next / Replace All), Go To (Ctrl+G), Select All (Ctrl+A) and Time/Date (F5); Cut and Copy grey out with no selection, Paste falls back to the async clipboard when a synthetic click blocks the editing command
- Format menu with Word Wrap (Alt+Z) and a Font dialog (family + size + live preview); View menu with the Status Bar (F4) and the Zoom submenu (Zoom In Ctrl+=, Zoom Out Ctrl+-, Restore Ctrl+0, plus 100 / 200 / 400 / 500% ticks); Help menu with View Help and the standard About Notepad credits box
- `js/apps/notepad/menus.js` menu bar whose entries map to an editor command table with live checkmarks (Word Wrap, Status Bar, zoom level) and disabled states (Cut / Copy with no selection); `js/apps/notepad/dialogs.js` the shared dialog shell (Find, Replace, Go To, Font, About, and the message boxes) with Win10 focus, Enter/Escape and button order; `js/apps/notepad/filedialog.js` the shared Open / Save As file browser
- Find / Replace wrap around the document, match case, and select each hit so Replace Next and F3 keep stepping; Go To scrolls the caret to the line
- Status bar tracks `Ln x, Col y` and the live zoom percentage; the caret scrolls itself into view on find and go-to
- Notepad artwork: `assets/notepad.svg` (a blue-tabbed page) and `NOTEPAD_SRC`, plus the Notepad window/app constants; Notepad registers with Start metadata (`Windows` subtitle, medium tile), so it lists under "N" in the Start menu and can be pinned to a tile
- `css/notepad.css`: the menu bar, monospace editor (word-wrap on/off), status bar, and the full Notepad dialog styling (fields, buttons, message boxes, file dialogs, font preview, About box)
- Notepad launched from the registry (imported once by boot), so it appears in the taskbar, Start menu and app list automatically

### Removed

- None

### Changed

- None

### Fixed

- None

## [0.18.0] - Win10 Start menu

2026-10-11

### Added

- `js/core/startmenu.js`: the Win10 Start menu — panel flush to the left edge and seated on the taskbar (which paints over its lower edge, so the menu really slides out from behind the taskbar while it fades, no zoom), left rail with "Most used", "Recently added" and the A-Z app list (jump letters), the account row and power button at the bottom, and the pinned tile pane on the right. It collapses to icons from the hamburger, closes on an outside press / Escape / launch, and arrow keys walk the list with Enter launching
- Tiles are movable and resizable, like Win10: press and drag a tile anywhere in the grid to reorder it (the layout reflows live and the slot is persisted), and grab a tile's right or bottom edge — the handles Win10 shows on hover — to resize it between medium / wide (right edge) and medium / large (bottom edge), also persisted
- `js/core/starttiles.js`: the tile grid — Win10 small / medium / wide / large sizes, per-app tile colour and artwork, labels under the tile, hover states, a running-app marker, drag-to-reorder, edge-drag resize, and a right-press tile menu (Unpin from Start, resize, More)
- `js/core/pointer.js`: shared pointer bridge — sim cursor under pointer lock or on touch, real pointer outside it — with stage↔client mapping, now shared by the window manager and the tile grid
- `js/core/startstate.js`: the profile's Start layout (pinned tiles, their order and sizes) plus launch history, persisted as JSON at `C:\Users\User\AppData\Local\Start\startmenu.json` on the emulated C: volume, sharing the registry's single lazy mount; storage failures degrade to in-memory
- `js/core/power.js`: shared Sleep / Shut down / Restart actions, now driving both the sign-in status bar and the Start menu's power button (Sleep / Shut down / Restart)
- Start-menu APIs for later: `registerApp({ start: { … } })` manifest (list name, subtitle, tile size/colour/artwork, pinned, hidden), `listStartApps()` / `hasApp()` / `getApp()` discovery, `getMostUsed()` / `getRecentlyAdded()` / `getLaunchCount()` history, `pinApp` / `unpinApp` / `setPinSize` / `movePin` / `indexOfPin` tile layout, `subscribeStartState()` / `subscribeStartOpen()` change feeds, `registerLiveTile()` (animated tile content while the menu is open), `setTileBadge()`, running-app detection from the window manager, and a power menu
- `css/startmenu.css`: Win10 panel, rail, list rows (with running underlines), section headers, account/power row, tile grid (all four sizes + badges + resize handles + drag state), popovers, slim scrollbars, and the slide-with-fade taskbar-anchored motion (reduced-motion respected)
- Start menu glyphs (`HAMBURGER_SVG`, `START_POWER_SVG`, `SLEEP_SVG`, `SHUTDOWN_SVG`, `RESTART_SVG`, `USER_SVG`, `APP_TILE_SVG`) and Start metrics constants

### Removed

- None

### Changed

- The Start button is live: it opens/closes the menu and stays lit while it is open
- `js/core/apps.js` normalises Start metadata at registration and counts each launch (feeding "Most used"); `registerApp` also notes when an app first appears so "Recently added" can distinguish genuinely new apps from ones that ship with the profile
- A first boot seeds the profile's default Start layout from the manifests' `pinned` flags, so apps that ship pinned come up with a tile (a stored layout always wins afterwards)
- File Explorer registers with Start metadata: "System" subtitle and a pinned wide tile, so the menu has real content
- The sign-in power menu reuses the shared power actions instead of its own copies
- The window manager reads the pointer through the shared tracker instead of its own copy of that logic

### Fixed

- The desktop right-press menus no longer fire through the Start menu panel
- Tiles were pinned but frozen: the manifest's `pinned` flag was never turned into an actual pin, so the tile pane stayed empty on a first boot
- Tiles are divs with their own role now (they carry grips), so they keep keyboard focus and hit-testing without losing the click-to-launch behaviour after a drag

## [0.17.0] - Aero Snap + Snap Assist, plus deeper window handling

2026-10-11

### Added

- `js/core/snap.js`: Aero Snap geometry — Win10 reads the cursor against the work-area edges while a titlebar is held (top edge maximizes, left/right edges fill half, corners fill a quarter), plus the translucent landing preview that slides between zones during the drag
- `js/core/snapassist.js`: Win10's Snap Assist — after a window is snapped to a half, the vacant half offers the other open windows (icon + title, most recently focused first, minimised ones included); picking one snaps it into the empty half, and the chooser closes on pick, on an outside press or on Escape, or after its ~4.5s dwell
- `js/core/windowchrome.js`: window frame building (titlebar, icon, caption buttons, the eight resize grips) split out of the manager, including the routed-versus-native press wiring
- `js/core/windowmenu.js`: Win10's window system menu — Restore / Move / Size / Minimize / Maximize / Close — opened by a right-press on a titlebar or a taskbar button, or Alt+Space; Move and Size run the classic modal keyboard loop (arrows nudge 8px, 1px with Shift, Enter commits, Escape cancels, any click commits)
- Aero Shake: shaking a titlebar back and forth (three reversals of a 24px swing inside 700ms) minimises every other window, like Win7+
- Minimize/restore fly toward the window's taskbar button: the manager measures the button and stores the offset in `--win-snap-dx` / `--win-snap-dy`, so the window shrinks into the exact slot it will reappear from
- Snap-aware state bookkeeping: a snapped window maximises on top of its snap and restores back into it, dragging a maximised or snapped titlebar tears it back to its restore size under the pointer, and re-dragging to another edge re-snaps cleanly
- Constants in `js/global/constants.js` (`SNAP_EDGE_PX`, `SNAP_TOP_PX`, `SNAP_CORNER_PX`, `SHAKE_MIN_STEP_PX`, `SHAKE_FLIPS`, `SHAKE_WINDOW_MS`, `SNAP_ASSIST_MS`)
- Taskbar running buttons carry `data-win-id` and a `title` tooltip (Win10 names windows on taskbar hover), and right-pressing one opens that window's system menu

### Removed

- None

### Changed

- The window manager outgrew its file budget, so chrome building (`windowchrome.js`), the system menu with its guided Move/Size loop (`windowmenu.js`), the snap geometry with its preview (`snap.js`) and the Snap Assist chooser (`snapassist.js`) are separate modules again; `windowmanager.js` keeps the window records, z-order, minimize/maximize/snap state and the drag/resize gestures
- Gesture presses run through one shared path: native targeting while the pointer is free, hit-testing under the sim cursor while pointer-locked, routed presses from touch holds — maximised windows now accept a titlebar drag (to restore) and snapped windows accept an edge drag (to re-snap)
- Taskbar running buttons rebuild from the window snapshot but keep `data-win-id`, so a minimising window can aim at the exact button

### Fixed

- Window dragging with a plain mouse was inert while the sim cursor was parked: a native pointer outside pointer lock is now tracked in stage coordinates and drives gestures, so windows drag wherever pointer lock is unavailable
- Snap Assist picking a window snapped it into the half that was already occupied and immediately re-opened the chooser, so the panel appeared to ignore the click; the picked window now fills the vacant half, and the chooser does not return once both halves are taken

## [0.16.0] - Win10 context menus on the desktop and in File Explorer

2026-10-08

### Added

- `js/core/contextmenu.js` + `css/contextmenu.css`: Win10 context menu (light popup, 1px grey border, system shadow, Segoe UI rows with icon slot, shortcut hints, separators, disabled greys, checkmarks and cascading submenus that open on hover or press, close on outside press / Escape / focus loss, and flip against the viewport edge)
- Desktop right-press menus: icon menu (Open, Create shortcut, Delete, Rename, Properties) and the wallpaper menu with working View (Large / Medium / Small icon sizes re-flow the grid, Auto arrange icons) and Sort by (Name / Size / Item type / Date modified, ascending / descending) cascades, Refresh, Paste, New, Display settings and Personalize
- Explorer right-press menus: item menu (Open, Open with, Cut, Copy, Delete, Rename, Properties), folder menu (View, Sort by, Refresh, Paste, New ▸ Folder / Text Document, Properties, Open in Terminal, Select all) and the Recycle Bin menu (Restore this item, Restore all items, Empty Recycle Bin)
- Working context actions: New Folder / New Text Document (with Win10's `New folder (2)` naming), inline rename (F2, base name selected, extension left alone, duplicate-name replace prompt), Properties sheets for items, folders, drives and This PC, Select all, sort by Name / Date / Type / Size with folders first, and a reusable Win10 message box (error + info glyphs, button row) replacing the hard-coded path error
- Delete really recycles: `volume.move()` (recursive copy + delete, since OPFS has no portable rename) puts the payload under `C:\$Recycle.Bin\<SID>\$R…` with a `$I` record of the original path, the Recycle Bin window lists those items under their original names, Restore puts them back, Empty Recycle Bin wipes the SID folder, and `$` system entries stay hidden from listings and search the way Win10 hides them

### Removed

- None

### Changed

- `cursor.js` routes the right button while pointer-locked as a `simcontextmenu` custom event carrying the real hit target (locked real presses are retargeted at the lock element), and the stage suppresses the browser's own context menu everywhere inside the emulated desktop
- Right-press no longer routes as a left click, and the desktop background menu ignores presses that belong to a window or the taskbar
- Explorer item rows now carry their resolved path and item data (`data-place`, `data-bin`, `expItem`, `expLabel`) so menus, rename and Properties act on the exact item
- The ribbon exposes a `refresh` hook so the View menu can repaint the Layout group's active button

### Fixed

- None

## [0.16.1] - Context menu placement and 1s submenu dwell

2026-10-08

### Added

- Submenus cascade open after a one-second hover dwell (Win10's timing) instead of only on press, and fold away ~400ms after the pointer leaves
- Hover detection that works in both input modes: real `:hover` when the pointer is free, and the sim cursor's `.sim-hover` class while pointer-locked, so the dwell works on a locked pointer where no real hover exists
- Tall menus are capped to the screen and scroll internally instead of running past the bottom edge

### Removed

- None

### Changed

- Context menus open right under the press (2px nudge, like Win10) and flip up/left at the edges instead of sliding out of sight
- Menus are clamped to the emulated screen (the stage rect inside the letterboxed viewport) rather than the browser window, so they never hang off the monitor
- Menu stacking raised to the top of the range so a menu can never paint under a window, the desktop layer or the taskbar
- Submenu placement is relative to its parent row and flips to the left when it would run past the right edge
- The simulated cursor moved out of the stage to a document-level fixed element positioned from the stage's on-screen rect: inside the stage it was trapped in that stacking context and always painted underneath context menus

### Fixed

- Open submenus collapsing while the pointer was inside them
- The simulated cursor disappearing behind an open context menu (and the OS pointer showing through over menus while pointer-locked)

## [0.15.0] - Working search + editable address bar

2026-10-08

### Added

- Real File Explorer search: typing filters the current folder (subfolders included, This PC searches all of C:) with a 300ms pause, Enter or the magnifier runs it immediately, Esc clears it, `No items match your search.` when nothing hits, and directories in the results navigate while files land in their own folder selected
- Search box follows Win10: placeholder `Search <location>`, magnifier on the right end as a real button, blue border while focused, Ctrl+E / F3 jump into it
- Editable address bar: clicking the empty stretch of the breadcrumb (or Alt+D / Ctrl+L) swaps the crumbs for a full-path text box with the text pre-selected so Ctrl+C copies it, Enter navigates, Esc reverts, and a recent-places drop-down opens underneath with the visit history
- Typed paths resolve like Win10: absolute (`C:\Users\User\Documents`, `C:/…`, `C:`), relative (`Documents`), shell names (`This PC`, `Recycle Bin`) and known user folders from any location; an unresolvable path opens a Win10-style message box (`Windows cannot find '…'. Check the spelling and try again.` + OK)
- Typing a file path or opening a file from search reveals it in its folder with itself selected (no file associations exist yet)

### Removed

- None

### Changed

- Explorer's address bar is built once and updated in place instead of being recreated on every render, so the text boxes survive re-renders; Back/Forward/Up disabled states refresh per render and Up is greyed at This PC
- Search results, folder listings and drive rows guard against stale async renders, so fast typing can never paint old results over new ones
- A pointer-locked real mousedown is now default-prevented so it cannot steal focus from whatever the routed press just focused — without this the browser blurs the box mid-click and nothing types

### Fixed

- None

## [0.14.0] - Recycle Bin opens in File Explorer

2026-10-08

### Added

- Desktop Recycle Bin opens File Explorer on a virtual Recycle Bin shell folder: Win10 title, bin icon on the window, `Recycle Bin` breadcrumb root, `Search Recycle Bin` placeholder, `This folder is empty.` body and an Up button that lands on This PC
- Recycle Bin renders even when storage is unavailable, so opening it from `file://` shows the folder instead of the storage notice

### Removed

- None

### Changed

- Explorer's storage-unavailable screen now only blocks real volume paths; virtual shell folders skip the OPFS requirement and the first-run profile seeding

### Fixed

- None

## [0.13.1] - Desktop icons need a real double-click again

2026-10-08

### Added

- None

### Removed

- None

### Changed

- None

### Fixed

- Desktop icons opening on a single click while pointer-locked: the routed synthetic down/up pair and the real press were both counted as taps, so one physical click registered twice and instantly satisfied the double-click check; the routed echo is now dropped and only the real press lifecycle counts

## [0.13.0] - Window motion + working hover highlights

2026-10-06

### Added

- Universal window animations: open zooms/fades in, close zooms/fades out, minimize sinks toward the taskbar, restore rises back (all instant under reduced motion)
- Manual `.sim-hover` highlight system: the sim cursor hit-tests every locked move and lights up the control under it, since the frozen OS pointer kills real `:hover`

### Removed

- None

### Changed

- All 22 `:hover` rules twinned as `:hover, .sim-hover` pairs; convention documented in AGENTS.md for future UI

### Fixed

- No button showing any hover highlight while pointer-locked

## [0.12.0] - File Explorer

2026-10-06

### Added

- `js/apps/explorer/` File Explorer: ribbon (File/Computer/View tabs, working Tiles/List/Details switcher, working File-name-extensions toggle, collapsible), address bar (back/forward/up/breadcrumb/refresh/search box), nav pane (Quick access folders, This PC, System C:), browsable Tiles/List/Details views, This PC groups (profile Folders + live drive-space bar), status bar counts
- First-run profile setup seeds the 7 user folders, matching a fresh Windows account
- Desktop This PC opens Explorer on double-click/double-tap; manual double-tap detection works for mouse and touch alike

### Removed

- None

### Changed

- None

### Fixed

- None

## [0.11.0] - Touch press-and-hold

2026-10-06

### Added

- Press-and-hold on touch (500ms still): engages a press so windows drag/resize and icons drag/marquee by finger; release without moving clicks instead
- Second-finger and cancel paths release an engaged hold so presses never stick

### Removed

- None

### Changed

- Synthetic routed events split into down/up/click pieces to support the hold lifecycle
- Window gesture updates also track touch movement

### Fixed

- Mangled gesture updater left over from an earlier touchmove edit

## [0.10.0] - Window system + app framework

2026-10-06

### Added

- `js/core/windowmanager.js` floating windows: titlebar chrome with min/max/close, drag, 8-zone resize, minimize/maximize/restore/close, focus z-order, cascading placement
- `js/core/apps.js` app registry + launcher (`registerApp/launchApp`) with lazily-mounted shared NTFS volume for apps
- Taskbar running-app buttons with focus/minimize toggle and active underline, synced to window state
- Pinned Edge/Explorer/Store launch by app id (no-ops until those apps register)
- `css/window.css` chrome, grips, and running-button styles

### Removed

- None

### Changed

- None

### Fixed

- None

## [0.9.0] - NTFS virtual filesystem on OPFS

2026-10-06

### Added

- `js/apis/storage/opfs.js` OPFS backend: root handle, case-insensitive entry resolution, file/dir CRUD, quota via `estimate()`, `persist()` at open
- `js/apis/ntfs.js` emulated `C:` volume: Win-style paths, empty formatted volume, `listDir/makeDir/readFile/writeFile/remove/stat/getFreeSpace`; degrades to unavailable (sim still boots) where OPFS is missing

### Removed

- None

### Changed

- AGENTS.md persistence rule: OPFS-backed storage replaces the localStorage-only constraint

### Fixed

- None

## [0.8.2] - Working press lifecycle for marquee and drag

2026-10-06

### Added

- None

### Removed

- None

### Changed

- Desktop press tracking follows the real press (hit-tested under the sim cursor) instead of the instant routed click, so hold-and-drag registers again; touch taps still resolve via the synthetic press

### Fixed

- No selection box appearing on hold-and-drag (press was already gone before the drag began)
- Mangled `dropDragged` block from the rewire

## [0.8.1] - Fix desktop boot crash

2026-10-06

### Added

- None

### Removed

- None

### Changed

- None

### Fixed

- `cursor is not defined` crash when signing in: the cursor instance is now passed into the lock-screen flow so the desktop handoff can use it

## [0.8.0] - Desktop multi-select, marquee, rearrange

2026-10-06

### Added

- Ctrl+click (or Cmd) toggles icons in/out of a multi-selection
- Rubber-band marquee: dragging empty desktop draws the blue selection box (plain replaces, Ctrl adds)
- Icon rearranging: drag icons between grid slots with swap-on-occupied; positions live only in memory, nothing saved
- Routed clicks now carry the real modifier keys so Ctrl survives pointer-lock routing

### Removed

- None

### Changed

- Desktop icons moved onto an absolute slot grid; selection is press/release driven instead of click driven

### Fixed

- None

## [0.7.2] - Correct This PC and Explorer icons

2026-10-06

### Added

- None

### Removed

- None

### Changed

- `assets/this-pc.png` is now the real This PC monitor (`Imageres_dll_104`, was the Network globe-monitor)
- `assets/file-explorer.png` is now the real Explorer folder-over-blue (`Imageres_dll_264`, was the generic folder)

### Fixed

- None

## [0.7.1] - Real Edge and Store artwork

2026-10-06

### Added

- Pinned Edge and Store use the real `assets/microsoft-edge.png` and light Store logo

### Removed

- Drawn `EDGE_SVG` / `STORE_SVG` approximations, the unused SVG pinned-app builder, and the dark Store variant

### Changed

- None

### Fixed

- None

## [0.7.0] - Real 21343 shell icons

2026-10-06

### Added

- `assets/this-pc.png`, `assets/recycle-bin.png`, `assets/file-explorer.png` extracted at full size from the 21343 `win10-shell-icons` set (no renames needed)
- Desktop icons and the pinned Explorer now use the real artwork

### Removed

- Drawn `THISPC_SVG`, `RECYCLE_SVG`, `EXPLORER_SVG` approximations (superseded; Edge and Store stay drawn — not covered by those DLLs)

### Changed

- None

### Fixed

- None

## [0.6.4] - Spinner as transparent APNG

2026-10-06

### Added

- `assets/spinning-dots.apng`: all 103 GIF frames converted, looping forever, black background removed

### Removed

- `assets/spinning-dots.gif` (replaced by the APNG)

### Changed

- Boot and welcome spinners load the APNG (same constant, transparent background)

### Fixed

- None

## [0.6.3] - Faithful Welcome handoff

2026-10-06

### Added

- Two-phase sign-in exit: content fades first, wallpaper follows 0.5s later over the waiting desktop

### Removed

- Full-screen "Welcome" overlay (replaced by the inline row)

### Changed

- Password box is replaced in place by a spinner with "Welcome" beside it
- Desktop is inserted underneath before the fades begin, so the wallpaper dissolves into it

### Fixed

- None

## [0.6.2] - Cursor click routing fixes

2026-10-06

### Added

- Post-lock movement blackout (`POST_LOCK_IGNORE_MS`) plus absurd-delta clamp (`MAX_MOUSE_DELTA_PX`) against lock-transition jumps
- Lock-failure fallback: if pointer lock never engages, clicks stop being swallowed and the native pointer takes over

### Removed

- None

### Changed

- Engagement click is swallowed in the capture phase so it only captures and never mis-fires UI underneath
- Power menu closer ignores clicks inside the power control (click-outside pattern)

### Fixed

- Cursor snapping to random places on click (bogus lock-transition movement deltas applied raw)
- Infinite re-entry: routed synthetic clicks bubbling back into the stage handler
- Power menu instantly closing in the same gesture that opened it

## [0.6.1] - Text cursor + unified cursor scale

2026-10-06

### Added

- `assets/cursor-text.svg` white-with-black-outline I-beam (beam-middle hotspot)
- Cursor switches to the I-beam over text fields (password box, search box)

### Removed

- None

### Changed

- All three cursors normalized to the same small visual height (~60% of the box) via non-destructive group transforms; no path data touched
- Hotspots recalibrated for the current artwork (arrow tip, fingertip, beam middle)

### Fixed

- None

## [0.6.0] - Desktop shell with 1:1 light taskbar

2026-10-06

### Added

- Signing in now lands on the desktop after the "Welcome" beat (`WELCOME_DURATION_MS`)
- `js/core/desktop.js` desktop shell: `assets/win10-bg.jpg` hero wallpaper, This PC + Recycle Bin icons with Win10 selection behavior
- `js/core/taskbar.js` light-theme taskbar: dead Start button (menu later), typeable search box, Task view, pinned Edge/File Explorer/Store, running-app area, tray with hidden-icons chevron, network, volume, ENG, live clock/date, notifications, show-desktop sliver
- `css/desktop.css`, `css/taskbar.css` scoped styles; new icon glyphs in `js/global/icons.js`

### Removed

- None

### Changed

- None

### Fixed

- None

## [0.5.2] - True single-flicker boot bug

2026-10-06

### Added

- `BOOT_FLICKER_MS` (100ms) blink-off before the spinner returns

### Removed

- None

### Changed

- At 5s the logo dies for good while the spinner only blinks away for 0.1s, spins on, then disappears at 8s; lock still lands at 8.2s (blink skipped under reduced motion)

### Fixed

- None

## [0.5.1] - One-shot boot blackout + cursor hidden until boot

2026-10-06

### Added

- Cursor stays fully hidden (plus the capture hint) until the lock screen lands, via `cursor.setBooted()`

### Removed

- `js/boot/bootglitch.js` flicker + lag-stutter sequence (replaced by a single disappearance)
- `BOOT_SPINNER_GONE_MS` stage and the `.boot-flicker` style

### Changed

- At 5s the logo and spinner vanish once and stay gone; dead black until the lock screen at 8.2s

### Fixed

- None

## [0.5.0] - Buggy boot sequence emulation

2026-10-06

### Added

- `js/boot/bootglitch.js` faithful Win10 boot bug: at 5s the logo vanishes, the spinner flickers off once and comes back with an irregular laggy stutter
- Staged boot timeline constants (`BOOT_GLITCH_MS`, `BOOT_SPINNER_GONE_MS`, `BOOT_LOCK_MS`): spinner dies at 8s, dead black beat, lock screen at 8.2s

### Removed

- Single `BOOT_DURATION_MS` handoff (replaced by the staged glitch timeline)

### Changed

- None

### Fixed

- None

## [0.4.4] - White cursor with black outline

2026-10-06

### Added

- None

### Removed

- None

### Changed

- Both cursor SVGs: white fill with black outline (`paint-order="stroke"` keeps the outline outside the body so the shape stays exact)

### Fixed

- None

## [0.4.3] - Solid black cursor glyphs

2026-10-06

### Added

- None

### Removed

- Hollow inner counter-path from both cursor SVGs (it punched a transparent hole through each glyph)

### Changed

- `assets/cursor-idle.svg` and `assets/cursor-linkselect.svg` now render as their original solid black shapes

### Fixed

- Cursor rendering as just an outline with no filling

## [0.4.2] - Solid cursor fill

2026-10-06

### Added

- None

### Removed

- Hollow inner counter-path from both cursor SVGs (it punched a transparent hole through the glyph)

### Changed

- `assets/cursor-idle.svg` and `assets/cursor-linkselect.svg` now render solid white with a black outline, like real Windows cursors

### Fixed

- Cursor rendering as just an outline with no filling

## [0.4.1] - Pointer-lock mouse capture

2026-10-06

### Added

- Pointer-lock capture: clicking the stage locks the OS pointer in place and movement deltas steer the sim cursor (Esc releases, click re-captures)
- "Click to capture the mouse" hint pill while unlocked (fine-pointer machines only)

### Removed

- Absolute mouse-follow positioning on desktop

### Changed

- Desktop clicks route through the sim cursor (hit-tested dispatch) instead of landing natively
- Hover link-state resolved via hit-testing under the sim cursor
- OS pointer only hidden while locked; unlocked it works normally and the sim cursor parks dimmed

### Fixed

- None

## [0.4.0] - Emulated cursor + touchpad mode

2026-10-06

### Added

- `js/core/cursor.js` emulated hardware cursor: OS pointer hidden over the monitor, `assets/cursor-idle.svg` / `assets/cursor-linkselect.svg` rendered at the mapped position with correct hotspots
- Desktop: captured mouse movement drives the cursor; pointer switches to link-select over clickable elements
- Touch: stage behaves like a laptop touchpad — one-finger drag moves the cursor relatively, quick tap left-clicks, two-finger drag scrolls under the cursor
- `css/cursor.css` cursor styling, OS-pointer hiding, and `touch-action: none` for the stage

### Removed

- None

### Changed

- None

### Fixed

- None

## [0.3.1] - Opaque lock panel + zoom-blur sign-in transition

2026-10-06

### Added

- Sign-in layer owns a `.signin-wallpaper` copy plus a separate `.signin-dim` overlay

### Removed

- None

### Changed

- Lock panel is now opaque (carries the wallpaper itself) instead of transparent
- On dismiss, the sign-in wallpaper smoothly zooms (scale 1.07) and blurs (8px) behind the sharp content, Win10-style

### Fixed

- Sign-in elements (avatar, password box) showing through the lock screen before dismissal
- Dismiss transition missing the blur-and-zoom effect

## [0.3.0] - Lock screen + sign-in flow

2026-10-06

### Added

- Boot shows the splash for 5s (`BOOT_DURATION_MS`), then fades into the lock screen
- `js/boot/lockscreen.js` lock screen: beach-cave wallpaper, live clock/date lower-left, network icon lower-right
- Lock dismisses on any key, click, or tap and slides up to reveal sign-in
- `js/boot/signin.js` sign-in screen: avatar, account name, password box with reveal + submit buttons
- Any entered password signs in to a "Welcome" + spinner screen (no real accounts in the simulator)
- Empty-password submit shakes the box, Win10-style
- Status bar: ENG/US language, network, ease-of-access, and power icons
- Power menu with working Sleep (fade to black, wake back), Shut down (black + refresh hint), Restart (reboots the sim)
- `js/global/icons.js` shared SVG glyphs; `css/lockscreen.css`, `css/signin.css` scoped styles
- `account-def-pic.png` black background removed (transparent outside the circle)

### Removed

- None

### Changed

- None

### Fixed

- None

## [0.2.3] - Lower, larger boot spinner

2026-10-06

### Added

- `BOOT_SPINNER_SIZE_PX` constant for spinner display size

### Removed

- None

### Changed

- Boot spinner position 496px → 560px from stage top
- Boot spinner size 40px (natural) → 64px

### Fixed

- None

## [0.2.2] - Smaller boot logo

2026-10-06

### Added

- None

### Removed

- None

### Changed

- Boot logo width 200px → 140px to match the real Windows 10 boot proportions

### Fixed

- None

## [0.2.1] - Authentic boot artwork (real logo + spinner)

2026-10-06

### Added

- `assets/windows-logo.png` real Windows 10 logo used on the boot screen
- `assets/spinning-dots.gif` real loading animation used as the boot spinner

### Removed

- `js/boot/spinner.js` procedural DOM-dot spinner (replaced by the real GIF)
- Unused boot-art constants (`BOOT_LOGO_BLUE`, dot-count/radius/size/period)

### Changed

- `js/boot/boot.js` builds the splash from asset images instead of inline SVG + DOM dots
- `css/boot.css` styles the artwork images (spinner shown at natural size for crispness, hidden under `prefers-reduced-motion`)

### Fixed

- Boot screen looking fake: logo perspective and spinner motion now come from the real captured assets

## [0.2.0] - Fixed 1366x768 monitor stage + Windows 10 boot animation

2026-10-06

### Added

- `#monitor-stage` locked to exactly 1366x768 internal pixels with bezel styling
- `js/core/stage.js` fit-scaler (scales down on small viewports, never up)
- `js/global/constants.js` display + boot constants (resolution, logo blue, spinner config)
- `js/boot/boot.js` entry building the black boot screen with logo + spinner
- `js/boot/spinner.js` DOM ring-of-dots spinner with Win10 comet-trail gradient
- `css/base.css`, `css/monitor.css`, `css/boot.css` scoped styles
- `index.html` wired to css/ entry styles and `js/boot/boot.js` module

### Removed

- None

### Changed

- None

### Fixed

- None

## [0.1.0] - Initial project structure

2026-10-06

### Added

- `index.html` entry-point skeleton (structure only, no logic)
- `css/` category folder for all simulator styles
- `js/boot/` category for boot sequence (BIOS splash, login, session init)
- `js/kernel/` category for emulated kernel (processes, scheduler, memory)
- `js/core/` category for shell (desktop, window manager, taskbar, Start menu)
- `js/system/` category for system services (state store, event bus, registry)
- `js/apis/` category for emulated APIs (filesystem, registry, clipboard, fake network)
- `js/apps/` category for built-in apps (one subfolder per app, future)
- `js/global/` category for shared constants, helpers, utils
- `assets/` folder for static binary assets (icons, wallpapers, fonts, sounds)
- `.nojekyll` for GitHub Pages static serving
- `.gitignore` for OS/editor junk only
- `AGENTS.md` with project rules, structure, and workflow
- `CHANGELOG.md` with versioned task history

### Removed

- None

### Changed

- None

### Fixed

- None
