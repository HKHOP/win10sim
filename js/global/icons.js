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
// The offline state adds the red-circle-white-cross badge (the Windows "no
// internet" overlay) in the bottom-right of the globe.
export const NETWORK_OFFLINE_SVG =
  // Win10's "no internet" mark: the globe with the red prohibition badge hanging
  // off its lower-right. The viewBox is deliberately larger than the glyph grid
  // (1150 rather than 1024) and the globe is scaled to 0.78 to make room, because
  // a badge that overhangs the viewBox gets clipped at the corner and reads as a
  // dot no matter how large its radius is.
  '<svg viewBox="0 0 1150 1150" aria-hidden="true">' +
  // Globe (from MDL2 U+E774), flipped upright as the generator emits it, then
  // scaled about its own centre and moved up-left to clear the badge corner.
  '<path fill="currentColor" transform="translate(450,450) scale(0.78) translate(-512,-512) translate(0,1024) scale(1,-1)" d="M512 1024q70.5 0 136-18.25t122.5-51.5 103.75-80 80-103.75 51.5-122.5 18.25-136-18.25-136-51.5-122.5-80-103.75-103.75-80-122.5-51.5-136-18.25-136 18.25-122.5 51.5-103.75 80-80 103.75-51.5 122.25-18.25 136.25q0 70.5 18.25 136t51.5 122.5 80 103.75 103.75 80 122.25 51.5 136.25 18.25zM916.5 704q-19 40.5-46 76.25t-60 65.25-71.5 52.5-80.5 37.5q18-25 32.5-53t25.75-57.75 19.25-60.25 14-60.5h166.5zM960 512q0 66.5-18.5 128h-181.5q4-32 6-63.75t2-64.25-2-64.25-6-63.75h181.5q18.5 61.5 18.5 128zM512 64q24.5 0 45.75 13.5t39.25 35.5 32.25 49.75 25.25 56.25 18.5 55 11.5 46h-345q4-19.5 11.5-46t18.5-55 25.25-56.25 32.25-49.75 39.25-35.5 45.75-13.5zM695.5 384q4 32 6.25 63.75t2.25 64.25-2.25 64.25-6.25 63.75h-367q-4-32-6.25-63.75t-2.25-64.25 2.25-64.25 6.25-63.75h367zM64 512q0-66.5 18.5-128h181.5q-4 32-6 63.75t-2 64.25 2 64.25 6 63.75h-181.5q-18.5-61.5-18.5-128zM512 960q-24.5 0-45.75-13.5t-39.25-35.5-32.25-49.75-25.25-56.25-18.5-55-11.5-46h345q-4 19.5-11.5 46t-18.5 55-25.25 56.25-32.25 49.75-39.25 35.5-45.75 13.5zM365.5 935.5q-42-14.5-80.5-37.5t-71.5-52.5-60-65.25-46-76.25h166.5q6 30 14 60.5t19.25 60.25 25.75 57.75 32.5 53zM107.5 320q19-40.5 46-76.25t60-65.25 71.5-52.5 80.5-37.5q-18 25-32.5 53t-25.75 57.75-19.25 60.25-14 60.5h-166.5zM658.5 88.5q42 14.5 80.5 37.5t71.5 52.5 60 65.25 46 76.25h-166.5q-6-30-14-60.5t-19.25-60.25-25.75-57.75-32.5-53z"/>' +
  // The badge overlaps the globe's edge rather than sitting clear of it, which is
  // what makes it read as part of the globe instead of a second, separate icon.
  '<circle cx="880" cy="880" r="250" fill="#e81123"/>' +
  '<path fill="none" stroke="#fff" stroke-width="46" stroke-linecap="round" d="M775 775l210 210M985 775l-210 210"/>' +
  '</svg>';
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

