// Edge's chrome glyphs.
//
// The browser draws its toolbar from the same Segoe MDL2 Assets font the shell
// does, so most of these are the real outlines out of mdl2.js under the names the
// toolbar uses. Three of Edge's buttons are Edge's own and the font has no
// equivalent shape for them; those are drawn here, which is the one case where
// hand-drawing is the honest answer rather than a shortcut.

import {
  BACK as MDL2_BACK,
  FORWARD as MDL2_FORWARD,
  REFRESH as MDL2_REFRESH,
  STOP as MDL2_STOP,
  CANCEL as MDL2_CANCEL,
  ADD as MDL2_ADD,
  HOME as MDL2_HOME,
  SEARCH as MDL2_SEARCH,
  MORE as MDL2_MORE,
  SETTING as MDL2_SETTING,
  CONTACT as MDL2_CONTACT,
  FAVORITE_STAR as MDL2_FAVORITE_STAR,
  FAVORITE_STAR_FILL as MDL2_FAVORITE_STAR_FILL,
  UNFAVORITE as MDL2_UNFAVORITE,
  BOOKMARKS as MDL2_BOOKMARKS,
  HISTORY as MDL2_HISTORY,
  DOWNLOAD as MDL2_DOWNLOAD,
  PRINT as MDL2_PRINT,
  CAMERA as MDL2_CAMERA,
  HELP as MDL2_HELP,
  FULL_SCREEN as MDL2_FULL_SCREEN,
  IN_PRIVATE as MDL2_IN_PRIVATE,
  NEW_WINDOW as MDL2_NEW_WINDOW,
  ZOOM_IN as MDL2_ZOOM_IN,
  ZOOM_OUT as MDL2_ZOOM_OUT,
  GLOBE as MDL2_GLOBE,
  ERROR as MDL2_ERROR,
  DELETE as MDL2_DELETE,
  CHEVRON_RIGHT as MDL2_CHEVRON_RIGHT,
  OTHER_USER as MDL2_OTHER_USER
} from '../../global/mdl2.js';

export var BACK_SVG = MDL2_BACK;
export var FORWARD_SVG = MDL2_FORWARD;
export var REFRESH_SVG = MDL2_REFRESH;
export var STOP_SVG = MDL2_CANCEL;
export var CANCEL_SVG = MDL2_CANCEL;
export var ADD_SVG = MDL2_ADD;
export var HOME_SVG = MDL2_HOME;
export var SEARCH_SVG = MDL2_SEARCH;
export var MORE_SVG = MDL2_MORE;
export var SETTING_SVG = MDL2_SETTING;
export var PROFILE_SVG = MDL2_CONTACT;
export var FAVORITE_SVG = MDL2_FAVORITE_STAR;
export var FAVORITE_FILL_SVG = MDL2_FAVORITE_STAR_FILL;
export var UNFAVORITE_SVG = MDL2_UNFAVORITE;
export var COLLECTIONS_SVG = MDL2_BOOKMARKS;
export var HISTORY_SVG = MDL2_HISTORY;
export var DOWNLOAD_SVG = MDL2_DOWNLOAD;
export var PRINT_SVG = MDL2_PRINT;
export var CAMERA_SVG = MDL2_CAMERA;
export var HELP_SVG = MDL2_HELP;
export var FULL_SCREEN_SVG = MDL2_FULL_SCREEN;
export var IN_PRIVATE_SVG = MDL2_IN_PRIVATE;
export var NEW_WINDOW_SVG = MDL2_NEW_WINDOW;
export var ZOOM_IN_SVG = MDL2_ZOOM_IN;
export var ZOOM_OUT_SVG = MDL2_ZOOM_OUT;
export var GLOBE_SVG = MDL2_GLOBE;
export var ERROR_SVG = MDL2_ERROR;
export var DELETE_SVG = MDL2_DELETE;
export var CHEVRON_RIGHT_SVG = MDL2_CHEVRON_RIGHT;
export var OTHER_USER_SVG = MDL2_OTHER_USER;

// --- the three Edge's own ---------------------------------------------------
// The Segoe MDL2 font is the Windows shell's icon set. It has no bag, no puzzle
// piece and no Copilot, because Windows has no such buttons - so these are
// drawn, at the toolbar's own size and in currentColor like everything else.

// Browser essentials: the little bag Edge keeps its essentials in.
export var ESSENTIALS_SVG =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">' +
  '<path d="M4.6 5.2V4.4a3.4 3.4 0 0 1 6.8 0v.8"/>' +
  '<path d="M2.6 5.4h10.8l-.7 8.2a1 1 0 0 1-1 .9H4.3a1 1 0 0 1-1-.9z"/>' +
  '</svg>';

// Extensions: a puzzle piece, because that is what an extension is.
export var EXTENSIONS_SVG =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">' +
  '<path d="M6 2.2h4v1.5a1.4 1.4 0 1 0 2.8 0v-.4H14v4h-1.5a1.4 1.4 0 1 0 0 2.8H14v3.7h-4.2v-1.4a1.4 1.4 0 1 0-2.8 0v1.4H2.2v-4h1.4a1.4 1.4 0 1 0 0-2.8H2.2V3.7H6z"/>' +
  '</svg>';

// Copilot: the loop Edge's assistant is drawn as.
export var COPILOT_SVG =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">' +
  '<path d="M8 1.9c1.6 2.4 4.6 2.7 4.6 6.1a4.6 4.6 0 0 1-9.2 0c0-1.4.6-2.3 1.4-3.1.3 1.2 1 1.7 2 1.9-.7-1.5-.3-3.4 1.2-4.9z"/>' +
  '</svg>';