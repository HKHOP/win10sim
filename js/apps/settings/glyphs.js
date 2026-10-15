// The glyphs the Settings nav and its pages are drawn with.
//
// Every one of these is a real Segoe MDL2 Assets outline, re-exported out of
// js/global/mdl2.js under the name the Settings page that uses it has here. None
// is hand-drawn: build_mdl2_icons.py takes each codepoint from the name
// Microsoft documents for it, and tools/mdl2_sheet.js renders them so the shape
// behind each name can be seen. See assets/win10-shell-icons/README-mdl2.md for
// why a name that looks right is not enough on its own.
import {
  HOME as MDL2_HOME,
  PC1 as MDL2_PC1,
  DEVICES as MDL2_DEVICES,
  CELL_PHONE as MDL2_CELL_PHONE,
  GLOBE as MDL2_GLOBE,
  PERSONALIZE as MDL2_PERSONALIZE,
  ALL_APPS as MDL2_ALL_APPS,
  ACCOUNTS as MDL2_ACCOUNTS,
  TIME_LANGUAGE as MDL2_TIME_LANGUAGE,
  XBOX as MDL2_XBOX,
  EASE_OF_ACCESS as MDL2_EASE_OF_ACCESS,
  SEARCH as MDL2_SEARCH,
  MICROPHONE as MDL2_MICROPHONE,
  LOCK as MDL2_LOCK,
  SYNC as MDL2_SYNC,

  TV_MONITOR as MDL2_TV_MONITOR,
  SPEAKERS as MDL2_SPEAKERS,
  ACTION_CENTER as MDL2_ACTION_CENTER,
  QUIET_HOURS as MDL2_QUIET_HOURS,
  POWER as MDL2_POWER,
  MEDIA_STORAGE_TOWER as MDL2_MEDIA_STORAGE_TOWER,
  TABLET_MODE as MDL2_TABLET_MODE,
  DOCK as MDL2_DOCK,
  PROJECTOR as MDL2_PROJECTOR,
  INFO as MDL2_INFO,

  BLUETOOTH as MDL2_BLUETOOTH,
  PRINT as MDL2_PRINT,
  CAMERA as MDL2_CAMERA,
  MOUSE as MDL2_MOUSE,
  TOUCHPAD as MDL2_TOUCHPAD,
  KEYBOARD_CLASSIC as MDL2_KEYBOARD_CLASSIC,
  EDIT as MDL2_EDIT,
  VIDEO as MDL2_VIDEO,
  USB as MDL2_USB,

  WIFI as MDL2_WIFI,
  NETWORK as MDL2_NETWORK,
  VPN as MDL2_VPN,
  WIFI_HOTSPOT as MDL2_WIFI_HOTSPOT,
  AIRPLANE as MDL2_AIRPLANE,
  DATA_SENSE as MDL2_DATA_SENSE,

  PICTURE as MDL2_PICTURE,
  COLOR as MDL2_COLOR,
  SET_LOCK_SCREEN as MDL2_SET_LOCK_SCREEN,
  LIBRARY as MDL2_LIBRARY,
  FONT as MDL2_FONT,
  TILES as MDL2_TILES,
  DOCK_BOTTOM as MDL2_DOCK_BOTTOM,

  BULLETED_LIST as MDL2_BULLETED_LIST,
  CHECKBOX_COMPOSITE as MDL2_CHECKBOX_COMPOSITE,
  DOWNLOAD_MAP as MDL2_DOWNLOAD_MAP,
  LIGHTNING_BOLT as MDL2_LIGHTNING_BOLT,

  CONTACT_PRESENCE as MDL2_CONTACT_PRESENCE,
  PERMISSIONS as MDL2_PERMISSIONS,
  PEOPLE as MDL2_PEOPLE,
  MAIL as MDL2_MAIL,

  CALENDAR as MDL2_CALENDAR,
  LANGUAGE_CHT as MDL2_LANGUAGE_CHT,
  HEADPHONE as MDL2_HEADPHONE,
  KEYBOARD as MDL2_KEYBOARD,
  KEYBOARD_STANDARD as MDL2_KEYBOARD_STANDARD,
  CAPTION as MDL2_CAPTION,

  GAME as MDL2_GAME,
  FULL_SCREEN as MDL2_FULL_SCREEN,

  ZOOM as MDL2_ZOOM,

  SETTING as MDL2_SETTING,
  LOCATION as MDL2_LOCATION,
  DIAGNOSTIC as MDL2_DIAGNOSTIC,
  ADMIN as MDL2_ADMIN,

  UPDATE_RESTORE as MDL2_UPDATE_RESTORE,
  DOWNLOAD as MDL2_DOWNLOAD,
  DEFENDER_APP as MDL2_DEFENDER_APP,
  HISTORY as MDL2_HISTORY,
  REPAIR as MDL2_REPAIR,
  REPEAT_ALL as MDL2_REPEAT_ALL,
  CLOUD as MDL2_CLOUD,
  CERTIFICATE as MDL2_CERTIFICATE,
  CODE as MDL2_CODE,

  BACK as MDL2_BACK,
  ADD as MDL2_ADD,
  DELETE as MDL2_DELETE,
  ACCEPT as MDL2_ACCEPT,
  BRIGHTNESS as MDL2_BRIGHTNESS,
  LEAF as MDL2_LEAF,
  WEBCAM as MDL2_WEBCAM,
  FEEDBACK_APP as MDL2_FEEDBACK_APP,
  STOPWATCH as MDL2_STOPWATCH,
  PASTE as MDL2_PASTE,
  BATTERY as MDL2_BATTERY,
  REMOTE as MDL2_REMOTE,
  SWITCH_APPS as MDL2_SWITCH_APPS,
  CHAT_BUBBLES as MDL2_CHAT_BUBBLES,
  RECORD as MDL2_RECORD,
  LIGHTBULB as MDL2_LIGHTBULB,
  DOCUMENT as MDL2_DOCUMENT,
  HELP as MDL2_HELP
} from '../../global/mdl2.js';

// --- The Home row and the back button --------------------------------------

export const HOME_SVG = MDL2_HOME;
export const BACK_SVG = MDL2_BACK;

// --- Categories (the Home grid and the nav pane's group rows) --------------

export const SYSTEM_SVG = MDL2_PC1;
export const DEVICES_SVG = MDL2_DEVICES;
export const PHONE_SVG = MDL2_CELL_PHONE;
export const NETWORK_SVG = MDL2_GLOBE;
export const PERSONALISATION_SVG = MDL2_PERSONALIZE;
export const APPS_SVG = MDL2_ALL_APPS;
export const ACCOUNTS_SVG = MDL2_ACCOUNTS;
export const TIME_LANGUAGE_SVG = MDL2_TIME_LANGUAGE;
export const GAMING_SVG = MDL2_XBOX;
export const EASE_SVG = MDL2_EASE_OF_ACCESS;
export const SEARCH_SVG = MDL2_SEARCH;
export const CORTANA_SVG = MDL2_MICROPHONE;
export const PRIVACY_SVG = MDL2_LOCK;
export const UPDATE_SVG = MDL2_SYNC;

// --- System ----------------------------------------------------------------

export const DISPLAY_SVG = MDL2_TV_MONITOR;
export const SOUND_SVG = MDL2_SPEAKERS;
export const NOTIFICATIONS_SVG = MDL2_ACTION_CENTER;
export const FOCUS_ASSIST_SVG = MDL2_QUIET_HOURS;
export const POWER_SLEEP_SVG = MDL2_POWER;
export const STORAGE_SVG = MDL2_MEDIA_STORAGE_TOWER;
export const TABLET_SVG = MDL2_TABLET_MODE;
export const MULTITASKING_SVG = MDL2_DOCK;
export const PROJECTING_SVG = MDL2_PROJECTOR;
export const ABOUT_SVG = MDL2_INFO;
export const BATTERY_SVG = MDL2_BATTERY;
export const SHARED_SVG = MDL2_PEOPLE;
export const CLIPBOARD_SVG = MDL2_PASTE;
export const REMOTE_DESKTOP_SVG = MDL2_REMOTE;

// --- Devices ---------------------------------------------------------------

export const BLUETOOTH_SVG = MDL2_BLUETOOTH;
export const PRINTERS_SVG = MDL2_PRINT;
export const CAMERAS_SVG = MDL2_CAMERA;
export const MOUSE_SVG = MDL2_MOUSE;
export const TOUCHPAD_SVG = MDL2_TOUCHPAD;
export const TYPING_SVG = MDL2_KEYBOARD_CLASSIC;
export const PEN_SVG = MDL2_EDIT;
export const AUTOPLAY_SVG = MDL2_VIDEO;
export const USB_SVG = MDL2_USB;

// --- Network & Internet ----------------------------------------------------

export const WIFI_SVG = MDL2_WIFI;
export const ETHERNET_SVG = MDL2_NETWORK;
export const VPN_SVG = MDL2_VPN;
export const HOTSPOT_SVG = MDL2_WIFI_HOTSPOT;
export const AIRPLANE_SVG = MDL2_AIRPLANE;
export const DATA_USAGE_SVG = MDL2_DATA_SENSE;

// --- Personalisation -------------------------------------------------------

export const BACKGROUND_SVG = MDL2_PICTURE;
export const COLORS_SVG = MDL2_COLOR;
export const LOCK_SCREEN_SVG = MDL2_SET_LOCK_SCREEN;
export const THEMES_SVG = MDL2_LIBRARY;
export const FONTS_SVG = MDL2_FONT;
export const START_SVG = MDL2_TILES;
export const TASKBAR_SVG = MDL2_DOCK_BOTTOM;

// --- Apps ------------------------------------------------------------------

export const APPS_FEATURES_SVG = MDL2_BULLETED_LIST;
export const DEFAULT_APPS_SVG = MDL2_CHECKBOX_COMPOSITE;
export const OFFLINE_MAPS_SVG = MDL2_DOWNLOAD_MAP;
export const WEBSITES_SVG = MDL2_GLOBE;
export const VIDEO_PLAYBACK_SVG = MDL2_VIDEO;
export const STARTUP_SVG = MDL2_LIGHTNING_BOLT;

// --- Accounts --------------------------------------------------------------

export const YOUR_INFO_SVG = MDL2_CONTACT_PRESENCE;
export const SIGNIN_SVG = MDL2_PERMISSIONS;
export const FAMILY_SVG = MDL2_PEOPLE;
export const EMAIL_SVG = MDL2_MAIL;
export const MAIL_SVG = MDL2_MAIL;
export const SYNC_ACCOUNT_SVG = MDL2_SYNC;

// --- Time & Language -------------------------------------------------------

export const DATE_TIME_SVG = MDL2_CALENDAR;
export const LANGUAGE_SVG = MDL2_LANGUAGE_CHT;
export const SPEECH_SVG = MDL2_MICROPHONE;
export const TEXT_SPEECH_SVG = MDL2_HEADPHONE;
export const HANDWRITING_SVG = MDL2_EDIT;
export const INPUT_SVG = MDL2_KEYBOARD;

// --- Gaming ----------------------------------------------------------------

export const GAME_MODE_SVG = MDL2_GAME;
export const FULLSCREEN_OPT_SVG = MDL2_FULL_SCREEN;
export const GAMEBAR_SVG = MDL2_XBOX;
export const CAPTURES_SVG = MDL2_CAMERA;
export const BROADCAST_SVG = MDL2_RECORD;
export const XBOX_SVG = MDL2_XBOX;

// --- Ease of Access --------------------------------------------------------

// Magnifier. MDL2 has no magnifier glyph, so this is the zoom glyph standing
// in for one - the shape Settings uses is a magnifying glass over content, and
// Zoom is the closest outline the font actually has.
export const MAGNIFIER_SVG = MDL2_ZOOM;
export const INTERACTION_SVG = MDL2_KEYBOARD;
// Closed captions is the caption glyph rather than a hand-drawn one: MDL2 has
// "Caption", which is the box-and-lines shape Windows draws beside the row.
export const CAPTIONS_SVG = MDL2_CAPTION;
// The Keyboard row under Interaction uses the on-screen-keyboard glyph, which is
// what MDL2 calls "KeyboardStandard" - the bare keyboard outline.
export const KEYBOARD_SVG = MDL2_KEYBOARD_STANDARD;

// The set was checked by rendering it (tools/mdl2_sheet.js): the sun, the clock
// face, the leaf, the webcam, the speech mark, the clipboard-with-sheet, the
// battery, the remote chevrons, the overlapping apps, the two speech bubbles,
// the record dot, the bulb, the sheet of paper and the question mark are all
// what their names say. See README-mdl2.md for why "the codepoint is in the
// font" is not on its own enough.

// --- Privacy & security ----------------------------------------------------

export const GENERAL_SVG = MDL2_SETTING;
export const LOCATION_SVG = MDL2_LOCATION;
export const CAMERA_PRIVACY_SVG = MDL2_CAMERA;
export const MICROPHONE_PRIVACY_SVG = MDL2_MICROPHONE;
export const DIAGNOSTICS_SVG = MDL2_DIAGNOSTIC;
export const PROTECTION_SVG = MDL2_ADMIN;
export const BACKGROUND_APPS_SVG = MDL2_SWITCH_APPS;
export const APP_DIAGNOSTICS_SVG = MDL2_DIAGNOSTIC;
export const AUTO_DOWNLOADS_SVG = MDL2_DOWNLOAD;
export const DOCUMENTS_PRIVACY_SVG = MDL2_DOCUMENT;
export const PICTURES_PRIVACY_SVG = MDL2_PICTURE;
// The App permissions sub-group of the Privacy nav pane. MDL2 documents
// CheckList for Tasks, which this build of the font does not contain, so Tasks
// is drawn with the bulleted-list glyph instead - same shape, and a glyph that
// is really in the file.
export const CALENDAR_PRIVACY_SVG = MDL2_CALENDAR;
export const TASKS_PRIVACY_SVG = MDL2_BULLETED_LIST;
export const MESSAGING_PRIVACY_SVG = MDL2_CHAT_BUBBLES;
export const RADIOS_PRIVACY_SVG = MDL2_NETWORK;
export const OTHER_DEVICES_PRIVACY_SVG = MDL2_DEVICES;

// --- Update & security -----------------------------------------------------

export const WINDOWS_UPDATE_SVG = MDL2_UPDATE_RESTORE;
export const DELIVERY_SVG = MDL2_DOWNLOAD;
export const SECURITY_SVG = MDL2_DEFENDER_APP;
export const PROTECTION_HISTORY_SVG = MDL2_HISTORY;
export const TROUBLESHOOT_SVG = MDL2_REPAIR;
export const RECOVERY_SVG = MDL2_REPEAT_ALL;
export const BACKUP_SVG = MDL2_CLOUD;
export const ACTIVATION_SVG = MDL2_CERTIFICATE;
export const FIND_DEVICE_SVG = MDL2_LOCATION;
export const DEVELOPERS_SVG = MDL2_CODE;
// MDL2 has no flask, which is what Windows draws for the Insider programme, so
// the light bulb stands in: a bulb for a preview build reads, and it is a real
// outline rather than something drawn by hand.
export const INSIDER_SVG = MDL2_LIGHTBULB;

// --- Row furniture ---------------------------------------------------------

export const ADD_SVG = MDL2_ADD;
export const DELETE_SVG = MDL2_DELETE;
export const ACCEPT_SVG = MDL2_ACCEPT;

// --- The little pictures a page draws beside a row --------------------------
//
// These are not nav artwork: they are the marks Windows puts at the left of an
// individual row - the sun at either end of the brightness slider, the leaf and
// bolt at the ends of the power-mode slider, the clock on a focus-assist rule,
// the webcam on "Camera" under Create your picture, the feedback mark beside
// "Give feedback".

export const BRIGHTNESS_SVG = MDL2_BRIGHTNESS;
export const LEAF_SVG = MDL2_LEAF;
export const WEBCAM_SVG = MDL2_WEBCAM;
export const FEEDBACK_SVG = MDL2_FEEDBACK_APP;
export const HELP_SVG = MDL2_HELP;
// Stopwatch, for want of a Clock: see the note on STOPWATCH in
// tools/build_mdl2_icons.py.
export const CLOCK_SVG = MDL2_STOPWATCH;