// Shared monochrome UI glyphs.
//
// These are the real Segoe MDL2 Assets outlines - the icon font Windows 10 draws
// its shell with - generated into ./mdl2.js by tools/build_mdl2_icons.py. They
// are filled with currentColor, so each surface colours them from CSS instead of
// the colour being frozen into the path data, which is what let one glyph be
// used on both the light taskbar and the dark lock screen before.
import {
  GLOBAL_NAV as MDL2_GLOBAL_NAV,
  BULLETED_LIST as MDL2_BULLETED_LIST,
  TILES as MDL2_TILES,
  POWER as MDL2_POWER,
  CONTACT as MDL2_CONTACT,
  REFRESH as MDL2_REFRESH,
  VIEW_ALL as MDL2_VIEW_ALL,
  CAPT_MIN as MDL2_CAPT_MIN,
  CAPT_MAX as MDL2_CAPT_MAX,
  CAPT_RESTORE as MDL2_CAPT_RESTORE,
  CAPT_CLOSE as MDL2_CAPT_CLOSE,
  SEARCH as MDL2_SEARCH,
  TASK_VIEW as MDL2_TASK_VIEW,
  CHEVRON_UP as MDL2_CHEVRON_UP,
  WIFI as MDL2_WIFI,
  GLOBE as MDL2_GLOBE,
  VOLUME as MDL2_VOLUME,
  ACTION_CENTER as MDL2_ACTION_CENTER,
  FORWARD as MDL2_FORWARD,
  EASE_OF_ACCESS as MDL2_EASE_OF_ACCESS,
  PC1 as MDL2_PC1,
  TV_MONITOR as MDL2_TV_MONITOR,
  PEOPLE as MDL2_PEOPLE,
  SWITCH_USER as MDL2_SWITCH_USER,
  LOCK as MDL2_LOCK,
  HOME as MDL2_HOME,
  FULL_SCREEN as MDL2_FULL_SCREEN,
  VIEW as MDL2_VIEW,
  DELETE as MDL2_DELETE,
  ACCEPT as MDL2_ACCEPT,
  ADD as MDL2_ADD,
  EDIT as MDL2_EDIT,
  SAVE as MDL2_SAVE,
  FOLDER as MDL2_FOLDER,
  NEW_FOLDER as MDL2_NEW_FOLDER,
  DOCUMENT as MDL2_DOCUMENT,
  PIN as MDL2_PIN,
  UNPIN as MDL2_UNPIN,
  SETTING as MDL2_SETTING,
  MORE as MDL2_MORE,
  CANCEL as MDL2_CANCEL,
  ZOOM as MDL2_ZOOM,
  OPEN_LOCAL as MDL2_OPEN_LOCAL
} from './mdl2.js';

// --- Lock / sign-in screen (light glyphs on the wallpaper) ----------------

// The sign-in screen's "network / accessibility / power" cluster. MDL2 has no
// desktop-monitor or eye glyph of its own, so the monitor is the PC1 computer
// and the eye stays a hand-drawn lens shape.
export const MONITOR_SVG = MDL2_PC1;
export const ACCESS_SVG = MDL2_EASE_OF_ACCESS;
export const POWER_SVG = MDL2_POWER;

export const EYE_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
  '<circle cx="12" cy="12" r="2.4" fill="currentColor"/>' +
  '</svg>';

export const ARROW_SVG = MDL2_FORWARD;

// --- Window caption glyphs -----------------------------------------------

export const CAPT_MIN_SVG = MDL2_CAPT_MIN;
export const CAPT_MAX_SVG = MDL2_CAPT_MAX;
export const CAPT_RESTORE_SVG = MDL2_CAPT_RESTORE;
export const CAPT_CLOSE_SVG = MDL2_CAPT_CLOSE;

// --- Taskbar + desktop glyphs --------------------------------------------

export const SEARCH_SVG = MDL2_SEARCH;
export const TASKVIEW_SVG = MDL2_TASK_VIEW;
export const CHEVRON_SVG = MDL2_CHEVRON_UP;
export const WIFI_SVG = MDL2_WIFI;
export const VOLUME_SVG = MDL2_VOLUME;
export const BELL_SVG = MDL2_ACTION_CENTER;

// The network state. The simulated machine has no network at all, and Win10
// says so with the globe rather than the wifi arcs - the arcs mean "connected
// to a network", which is the opposite of what is true here.
export const NETWORK_OFFLINE_SVG = MDL2_GLOBE;
export const GLOBE_SVG = MDL2_GLOBE;

// Start menu glyphs: the same real outlines, re-exported under the names the
// Start menu has always used.
export const HAMBURGER_SVG = MDL2_GLOBAL_NAV;

// App list: Win10's "all apps" glyph — a bulleted list.
export const APP_LIST_SVG = MDL2_BULLETED_LIST;

// Pinned apps: the tile-grid glyph, so the rail can name both views.
export const TILES_SVG = MDL2_TILES;

// Power: the circle-and-stalk shape Win10 uses on the Start menu.
export const START_POWER_SVG = MDL2_POWER;

// Account glyph: the plain-user figure, used where no avatar artwork exists.
export const USER_SVG = MDL2_CONTACT;

// Power menu glyphs: Sleep, Shut down, Restart. MDL2 has no moon for Sleep, so
// that one is still hand-drawn; the other two are the real outlines.
export const SLEEP_SVG =
  '<svg viewBox="0 0 16 16" aria-hidden="true">' +
  '<path d="M10 1.6a6.4 6.4 0 1 0 4.4 11.2A6.6 6.6 0 0 1 10 1.6z" fill="currentColor"/>' +
  '</svg>';

export const SHUTDOWN_SVG = MDL2_POWER;

export const RESTART_SVG = MDL2_REFRESH;

// Tile fallback art when an app declares a tile without artwork.
export const APP_TILE_SVG = MDL2_VIEW_ALL;

// Fullscreen: the four corner brackets, the glyph a fullscreen toggle uses
// everywhere. MDL2 has no corner-bracket glyph, so this one stays hand-drawn.
export const FULLSCREEN_SVG =
  '<svg viewBox="0 0 16 16" aria-hidden="true">' +
  '<path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/>' +
  '</svg>';

