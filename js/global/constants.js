// Shared constants for the emulated display and boot sequence.
// Win10 behavior: the boot screen targets a fixed 1366x768 monitor grid.

export const DISPLAY_WIDTH = 1366;
export const DISPLAY_HEIGHT = 768;

// Boot screen artwork (real captured assets in assets/).
export const BOOT_LOGO_SRC = 'assets/windows-logo.png';
export const BOOT_LOGO_WIDTH_PX = 140;
export const BOOT_SPINNER_SRC = 'assets/spinning-dots.apng';
export const BOOT_SPINNER_SIZE_PX = 64;

// Boot timeline with the classic Win10 bug: splash until 5s, then logo and
// spinner vanish — the spinner blinks back after 0.1s and dies at 8s;
// lock screen lands at 8.2s.
export const BOOT_GLITCH_MS = 5000;
export const BOOT_FLICKER_MS = 100;
export const BOOT_SPINNER_GONE_MS = 8000;
export const BOOT_LOCK_MS = 8200;

// Emulated hardware cursor: the OS pointer is hidden over the monitor and these
// assets are the only visible cursor, driven by the emulated cursor's position.
//
// The artwork is this machine's own Windows cursor set — the default (Aero)
// cursors a Windows 10 install shows — extracted to 32x32 PNGs by
// tools/extract_cursors.py, because a browser cannot draw a .cur file. The
// hotspots are the ones in those files' own headers.
export const CURSOR_SIZE_PX = 32;
export const CURSOR_IDLE_SRC = 'assets/cursor/arrow.png';
export const CURSOR_LINK_SRC = 'assets/cursor/hand.png';
export const CURSOR_TEXT_SRC = 'assets/cursor/text.png';
export const CURSOR_MOVE_SRC = 'assets/cursor/move.png';
export const CURSOR_RESIZE_EW_SRC = 'assets/cursor/resize-ew.png';
export const CURSOR_RESIZE_NS_SRC = 'assets/cursor/resize-ns.png';
export const CURSOR_RESIZE_NESW_SRC = 'assets/cursor/resize-nesw.png';
export const CURSOR_RESIZE_NWSE_SRC = 'assets/cursor/resize-nwse.png';
export const CURSOR_UNAVAILABLE_SRC = 'assets/cursor/unavailable.png';
// The loading cursor is animated, so it is drawn one extracted frame at a time.
export const CURSOR_BUSY_FRAME_COUNT = 18;
export const CURSOR_BUSY_FRAME_MS = 80;
// Hotspot (click point) inside each 32x32 glyph, as the source files carry it.
export const CURSOR_IDLE_HOTSPOT = [0, 0];
export const CURSOR_LINK_HOTSPOT = [6, 0];
export const CURSOR_TEXT_HOTSPOT = [15, 16];
export const CURSOR_MOVE_HOTSPOT = [11, 11];
export const CURSOR_RESIZE_EW_HOTSPOT = [11, 4];
export const CURSOR_RESIZE_NS_HOTSPOT = [4, 11];
export const CURSOR_DIAG_HOTSPOT = [8, 8];
export const CURSOR_BUSY_HOTSPOT = [16, 16];

// Touchpad mode (touch screens): one finger drag moves the cursor
// relatively, a quick tap left-clicks, two fingers drag to scroll.
export const MOUSE_SENSITIVITY = 1.0;
// Post-lock movement blackout + absurd-jump clamp (lock-transition artifacts).
export const POST_LOCK_IGNORE_MS = 120;
export const MAX_MOUSE_DELTA_PX = 400;
export const TOUCH_SENSITIVITY = 1.5;
export const TAP_MAX_MS = 300;
export const TAP_MAX_MOVE_PX = 12;
// Holding one finger still this long engages a press (drag windows/icons).
export const TOUCH_HOLD_MS = 500;

// Lock / sign-in artwork and identity.
export const LOCK_WALLPAPER_SRC = 'assets/Windows-10-lock-screen-bg.jpg';
// Desktop: hero wallpaper, welcome dwell, light-theme taskbar metrics.
export const DESKTOP_WALLPAPER_SRC = 'assets/win10-bg.jpg';
// Real shell artwork extracted from the 21343 icon set (Edge and Store
// are not in those DLLs, so they stay as drawn approximations for now).
export const THISPC_SRC = 'assets/this-pc.png';
export const RECYCLE_BIN_SRC = 'assets/recycle-bin.png';
export const EXPLORER_SRC = 'assets/file-explorer.png';
export const EDGE_SRC = 'assets/microsoft-edge.png';
export const STORE_SRC = 'assets/Microsoft_Store_logo_light.png';
// Generic item artwork for Explorer listings.
export const FOLDER_SRC = 'assets/folder.png';
export const FILE_SRC = 'assets/file.png';
// The profile's known folders and Quick Access, as the real Windows 10 shell
// draws them: each known folder gets its own icon rather than the plain
// folder glyph, and Quick access keeps the star it inherited from being
// called Favorites (extracted from the shell icon set by
// tools/extract_icons.py).
export const QUICK_ACCESS_SRC = 'assets/shell/quick-access.png';
export const DESKTOP_FOLDER_SRC = 'assets/shell/desktop-folder.png';
export const DOWNLOADS_SRC = 'assets/shell/downloads.png';
export const DOCUMENTS_SRC = 'assets/shell/documents.png';
export const PICTURES_SRC = 'assets/shell/pictures.png';
export const MUSIC_SRC = 'assets/shell/music.png';
export const VIDEOS_SRC = 'assets/shell/videos.png';
// Which artwork a known folder wears, wherever it is shown. The two views that
// can show one - a listing and the desktop - read it from here rather than each
// keeping its own copy.
export const KNOWN_FOLDER_SRC = {
  Desktop: DESKTOP_FOLDER_SRC,
  Downloads: DOWNLOADS_SRC,
  Documents: DOCUMENTS_SRC,
  Music: MUSIC_SRC,
  Pictures: PICTURES_SRC,
  Videos: VIDEOS_SRC
};
// The emulated volume is the system drive: Win10 shows the Windows-logo
// drive (Imageres_dll_031) for C:, not the plain drive glyph.
export const DRIVE_SRC = 'assets/shell/system-drive.png';
// Notepad: the real Windows 10 Notepad icon (blue spiral notepad).
export const NOTEPAD_SRC = 'assets/notepad.png';
// What a registered app may ask the shell for in its manifest. The shell
// checks the manifest before it hands an app a surface, so an app that has not
// asked is never given one: a permission is a promise it keeps rather than a
// label it carries.
export const APP_PERMISSIONS = {
  storage: 'Read and write the files stored on this PC'
};
// Notepad window defaults and its editor metrics.
export const NOTEPAD_DEFAULT_W = 720;
export const NOTEPAD_DEFAULT_H = 540;
export const NOTEPAD_FONT_PX = 14;
export const NOTEPAD_ZOOM_STEPS = [100, 200, 400, 500];
// Files Notepad remembers under File ▸ Recent documents.
export const NOTEPAD_RECENT_MAX = 4;
// Where the Open / Save As dialogs start: the user's Documents.
export const NOTEPAD_DEFAULT_DIR = 'C:\\Users\\User\\Documents';
// Explorer window + interaction tuning.
export const EXPLORER_DEFAULT_W = 980;
export const EXPLORER_DEFAULT_H = 560;
export const DOUBLE_TAP_MS = 400;
// Welcome handoff: inline spinner row dwell, content fade, wallpaper fade.
export const WELCOME_DURATION_MS = 1800;
export const WELCOME_SPINNER_PX = 30;
export const WELCOME_CONTENT_HOLD_MS = 500;
export const WELCOME_BG_FADE_MS = 600;
export const TASKBAR_HEIGHT_PX = 40;

// Start menu: Win10's medium panel, anchored bottom-left over the taskbar.
// The reference is a used install, so the panel is tall enough for the
// "Most used" rows, the A-Z list and four rows of tiles at once. Its width and
// height are not fixed here: the Start menu is sized in whole grid cells, so
// it is derived from the tile geometry and the stored column/row count.
export const START_TOP_PX = 62;
export const START_ANIM_MS = 240;
export const START_ANIM_CLOSE_MS = 200;
// The panel is not floating: it is flush to the left edge and sits on the
// taskbar, which paints over its lower edge so the menu really slides out
// from behind the taskbar.
export const START_LEFT_PX = 0;
// Middle pane: the app list, which is a segment of its own beside the icon
// column rather than part of it.
export const START_LIST_W = 252;
export const START_ACCOUNT_H = 52;
// Leftmost pane: the icon column, glyphs only until the pointer is on it.
export const START_RAIL_W = 48;
// Wide enough for the column's labels and for its fly-out menus, which open
// inside it.
export const START_RAIL_OPEN_W = 190;
// How long the pointer has to rest on the icon column before it opens. A
// deliberate dwell, not a sweep across the strip on the way to the tiles.
export const START_RAIL_HOVER_MS = 2000;
// Start tile grid geometry. The CSS draws from these as custom properties, so
// the resize snapping and the drawing cannot drift apart.
export const START_TILE_CELL_PX = 108;
export const START_TILE_GAP_PX = 9;
// The tile grid's insets, split the way the menu is drawn: a narrow gutter on
// the left, where the tiles sit close against the app list, and a wider one on
// the right. The right one has to clear the resize strip as well as pad the
// tiles off the panel edge, so it is never smaller than START_RESIZE_EDGE_PX.
// Their sum is unchanged from the single even pad these replaced, so the width
// the menu snaps to is the same size it was before the split.
export const START_TILE_PAD_LEFT_PX = 6;
export const START_TILE_PAD_RIGHT_PX = 38;
export const START_TILE_PAD_PX = 12;
// A plain tile's cell height: the artwork, the gap above the name, the name.
export const START_TILE_ROW_PX = 136;
// How small the Start menu may be dragged: its icon column's own controls plus
// a couple of rows of tiles.
export const START_MIN_H_PX = 260;
// The grab strips on the menu's top and right edges. They are wide in emulated
// pixels because the whole monitor is scaled down on a small screen, and the
// panes are inset by the same amount so a handle never covers a control.
export const START_RESIZE_EDGE_PX = 20;
// Account identity shown in the menu's account row.
export const START_ACCOUNT_ROW_ICON_PX = 30;

// Aero Snap: drag the titlebar to a work-area edge to snap. The pointer
// position (Win10 measures the cursor, not the window) selects the zone:
// top edge maximizes, left/right edges fill a half, corners fill a quarter.
export const SNAP_EDGE_PX = 20;
export const SNAP_TOP_PX = 12;
export const SNAP_CORNER_PX = 64;
// Aero Shake: shaking a titlebar back and forth minimizes every other
// window. A swing must be this long, this many direction flips, this fast.
export const SHAKE_MIN_STEP_PX = 24;
export const SHAKE_FLIPS = 3;
export const SHAKE_WINDOW_MS = 700;
// Snap Assist: the chooser offered in the vacant half after a snap.
export const SNAP_ASSIST_MS = 4500;
export const START_LOGO_SRC = 'assets/windows-logo.png';
export const ACCOUNT_PIC_SRC = 'assets/account-def-pic.png';
export const ACCOUNT_NAME = 'User';
export const AVATAR_SIZE_PX = 170;
