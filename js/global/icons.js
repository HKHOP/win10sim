// Shared monochrome UI glyphs (white line icons drawn as SVG strings).
// Pure data only — no DOM access, so they live in global/.

export const MONITOR_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<rect x="3" y="4" width="18" height="12" fill="none" stroke="#fff" stroke-width="1.6"/>' +
  '<path d="M9 20h6M12 16v4" stroke="#fff" stroke-width="1.6"/>' +
  '</svg>';

export const ACCESS_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="3 2"/>' +
  '<circle cx="12" cy="8.2" r="2" fill="#fff"/>' +
  '<path d="M7 12.5h10M12 12.5V18" stroke="#fff" stroke-width="1.6"/>' +
  '</svg>';

export const POWER_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M12 3v8" stroke="#fff" stroke-width="1.8"/>' +
  '<path d="M6.3 6.5a8 8 0 1 0 11.4 0" fill="none" stroke="#fff" stroke-width="1.8"/>' +
  '</svg>';

export const EYE_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" fill="none" stroke="#666" stroke-width="1.6"/>' +
  '<circle cx="12" cy="12" r="2.4" fill="#666"/>' +
  '</svg>';

export const ARROW_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="#333" stroke-width="1.8"/>' +
  '</svg>';

// Window caption glyphs (dark, drawn to match the Segoe MDL2 shapes).

export const CAPT_MIN_SVG =
  '<svg viewBox="0 0 12 12" aria-hidden="true">' +
  '<path d="M1 6h10" stroke="#222" stroke-width="1.4"/>' +
  '</svg>';

export const CAPT_MAX_SVG =
  '<svg viewBox="0 0 12 12" aria-hidden="true">' +
  '<rect x="2" y="2" width="8" height="8" fill="none" stroke="#222" stroke-width="1.4"/>' +
  '</svg>';

export const CAPT_RESTORE_SVG =
  '<svg viewBox="0 0 12 12" aria-hidden="true">' +
  '<path d="M4 1h7v7" fill="none" stroke="#222" stroke-width="1.3"/>' +
  '<rect x="1" y="4" width="7" height="7" fill="#fff" stroke="#222" stroke-width="1.3"/>' +
  '</svg>';

export const CAPT_CLOSE_SVG =
  '<svg viewBox="0 0 12 12" aria-hidden="true">' +
  '<path d="M2 2l8 8M10 2l-8 8" stroke="#222" stroke-width="1.4"/>' +
  '</svg>';

// Taskbar + desktop glyphs. Tray/start glyphs are dark (light taskbar);
// app and desktop icons are full-color approximations of the Win10 artwork.

export const SEARCH_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<circle cx="10" cy="10" r="6" fill="none" stroke="#666" stroke-width="2"/>' +
  '<path d="M14.5 14.5L20 20" stroke="#666" stroke-width="2"/>' +
  '</svg>';

export const TASKVIEW_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<rect x="2" y="5" width="13" height="10" fill="none" stroke="#333" stroke-width="1.8"/>' +
  '<rect x="9" y="9" width="13" height="10" fill="#f0f0f0" stroke="#333" stroke-width="1.8"/>' +
  '</svg>';

export const CHEVRON_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M5 14l7-7 7 7" fill="none" stroke="#222" stroke-width="1.8"/>' +
  '</svg>';

export const WIFI_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M3.5 9.5a13 13 0 0 1 17 0" fill="none" stroke="#222" stroke-width="1.8"/>' +
  '<path d="M6.5 13a8.5 8.5 0 0 1 11 0" fill="none" stroke="#222" stroke-width="1.8"/>' +
  '<circle cx="12" cy="16.8" r="1.7" fill="#222"/>' +
  '</svg>';

export const VOLUME_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="#222"/>' +
  '<path d="M16 8.5a5.5 5.5 0 0 1 0 7M18.5 6a9.5 9.5 0 0 1 0 12" fill="none" stroke="#222" stroke-width="1.6"/>' +
  '</svg>';

export const BELL_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M4 5h16v10H9.5L4 19V5z" fill="none" stroke="#222" stroke-width="1.8"/>' +
  '</svg>';

// Start menu glyphs (dark, light menu theme).

// Hamburger: the rail expand/collapse toggle.
export const HAMBURGER_SVG =
  '<svg viewBox="0 0 16 16" aria-hidden="true">' +
  '<path d="M2 4h12M2 8h12M2 12h12" stroke="#222" stroke-width="1.3"/>' +
  '</svg>';

// Power: the circle-and-stalk shape Win10 uses on the Start menu.
export const START_POWER_SVG =
  '<svg viewBox="0 0 16 16" aria-hidden="true">' +
  '<path d="M8 1.8v5" stroke="#222" stroke-width="1.3"/>' +
  '<path d="M4.2 3.6a5.2 5.2 0 1 0 7.6 0" fill="none" stroke="#222" stroke-width="1.3"/>' +
  '</svg>';

// Account glyph: the plain-user circle, used where no avatar artwork exists.export const USER_SVG =
  '<svg viewBox="0 0 16 16" aria-hidden="true">' +
  '<circle cx="8" cy="8" r="6.2" fill="none" stroke="#222" stroke-width="1.3"/>' +
  '<circle cx="8" cy="6" r="2.1" fill="#222"/>' +
  '<path d="M4 12.4c.7-1.6 2.2-2.3 4-2.3s3.3.7 4 2.3" fill="none" stroke="#222" stroke-width="1.3"/>' +
  '</svg>';

// Power menu glyphs (dark, light menu theme): Sleep, Shut down, Restart.
export const SLEEP_SVG =
  '<svg viewBox="0 0 16 16" aria-hidden="true">' +
  '<path d="M10 1.6a6.4 6.4 0 1 0 4.4 11.2A6.6 6.6 0 0 1 10 1.6z" fill="#222"/>' +
  '</svg>';

export const SHUTDOWN_SVG =
  '<svg viewBox="0 0 16 16" aria-hidden="true">' +
  '<path d="M8 1.8v5" stroke="#222" stroke-width="1.3"/>' +
  '<path d="M4.2 3.6a5.2 5.2 0 1 0 7.6 0" fill="none" stroke="#222" stroke-width="1.3"/>' +
  '</svg>';

export const RESTART_SVG =
  '<svg viewBox="0 0 16 16" aria-hidden="true">' +
  '<path d="M13.2 8a5.2 5.2 0 1 1-1.7-3.8" fill="none" stroke="#222" stroke-width="1.3"/>' +
  '<path d="M13.4 1.4v3.6H9.8" fill="none" stroke="#222" stroke-width="1.3"/>' +
  '</svg>';

// Tile fallback art when an app declares a tile without artwork.
export const APP_TILE_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
  '<path d="M8 12.2l2.6 2.6L16.4 9" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
  '</svg>';

