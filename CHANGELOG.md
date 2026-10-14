# Changelog — Windows 10 Simulator

All task completions (not conversations) get a new version section below.
Format: MAJOR.MINOR.PATCH. Latest version on top.

## [1.16.1] - The fields let go, and the pad scrolls the other way

2026-10-14

### Added

- None

### Removed

- None

### Changed

- **The virtual keyboard is black and flat**: rectangle keys with one fill and a
  hairline above it, no bevel, no gradient and no shadow. Over a picture on a
  phone the old hairline-and-shadow keyboard read as a separate object sitting on
  the screen rather than as part of the handset, so what each state says is now
  carried by the fill alone, and being dragged is said by the grip

### Fixed

- **A text box no longer wears a blue ring for being touched.** `:focus-visible`
  cannot tell a click from a key for a text field - a text box matches it whenever
  it has the focus, clicked or focused by script alike - so every box you touched
  came out ringed, which is the debugging look the ring was taken away for. The
  field now remembers which of the two reached it and the ring follows that: Tab
  rings the box it arrives at, and clicking or typing does not. The sign-in box,
  which says "the border is the focus" with a rule of its own, answers at the same
  weight rather than by stylesheet order
- **A field's placeholder sits in the middle of the box** rather than along the top
  of it. The rule that centres a placeholder was being overridden for an *empty*
  field by one that switched it to a block, so the text sat high - and only while
  the box was empty, which is why it looked right the moment anything was typed
- **Pressing elsewhere lets a field go.** Nothing blurred one: the emulated cursor
  dispatches its presses, a dispatched event runs none of the browser's default
  actions, and so a field kept the focus and went on swallowing every key after it.
  A field now watches for a press outside itself while it has the focus - the
  listener lives only as long as the focus does, so a window full of fields costs
  nothing
- **The virtual keyboard sits above the emulated cursor**, which is where phone
  furniture belongs: it covers the bottom of the screen while it is open, and a
  pointer drawn on top of its keys looked as though the PC's mouse were sitting in
  the middle of the handset's keyboard
- **The emulated cursor cannot address the keyboard or the site chrome at all.**
  The hit test stepped past the capture layer but not past the chrome, so the
  cursor could hover a key, light it up and press it. Page chrome is stepped past
  too - a finger presses it directly, and the emulated pointer addresses the
  emulated screen
- **Two fingers going up now scroll the page down**, and fingers going down take
  you up it. The sign is turned over at the one place a scroll leaves the touchpad,
  and to the numbers rather than to the call, so the coast carries on the way the
  fingers were already going. Sideways is untouched

## [1.16.0] - The Microsoft Store, which does not start

2026-10-14

### Added

- **`js/apps/store/`**: Microsoft Store, the second app the taskbar was already
  pinning a button for. Pressing it raises what Windows raises when a program that
  is not there is asked for, because nothing installed a store on this computer
- The path in the message is the real one. The Store is a packaged app rather than
  an ordinary program, so its executable is not on the PATH or in Program Files
  proper: it lives in the protected `WindowsApps` folder, in a folder named for
  the package and the exact build installed -
  `C:\Program Files\WindowsApps\Microsoft.WindowsStore_12005.1001.1.0_x64__8wekyb3d8bbwe\WinStore.App.exe`
  - which is exactly why asking for it by path is the thing that comes back with
  this error
- It asks for no window and no permissions: the one thing the Store can do on a
  computer it was never installed on is say so

### Removed

- None

### Changed

- None

### Fixed

- **A dialog's mark was drawn as text.** The popup handed the glyph it leads with -
  the red cross, the warning triangle, the information circle - to the helper that
  puts *words* into an element, so it came out as its own source code printed
  across the message. Every word a dialog says is text and belongs there; a mark
  is markup and now goes in as such. Nothing in the shell had used `glyph:` before,
  which is why it had gone unnoticed

## [1.15.0] - Microsoft Edge

2026-10-14

### Added

- **`js/apps/edge/`**: Microsoft Edge, the app the taskbar has been pinning a
  button for since before there was one behind it. The browser draws its own
  furniture - tab strip, toolbar, address bar - inside a shell window, the way
  Notepad's menu bar is, so the shell's title bar and window rules still hold it
- **The tab strip**: favicons, titles, a close button on each, the new-tab button,
  and per-tab history, so Back and Forward have somewhere to go and the address
  bar greys out when there is nowhere to go
- **The toolbar**: back, forward, refresh, home, the address bar ("Search or enter
  web address", which is the shell's own text field like every other box in the
  shell), and Edge's five tools on the right - collections, favorites, browser
  essentials, the account, and the three dots
- **The Settings and more menu**, item for item the way Edge draws it: the three
  new things at the top, the zoom row drawn as a row (`- 100% +` and full screen)
  rather than as list items, then favorites, history, downloads, apps,
  extensions, browser essentials, print, screenshot, find on page, more tools,
  settings, help and feedback, and the way out
- **The profile flyout**: the account, its address, "Sync is on", and Work,
  Profile 1, set up a new personal profile, other profiles
- **The new tab page**: the Edge mark over a drawn lake, a "Search the web" box
  that takes the focus as the page opens, and a row of the pages it can show. The
  picture Edge really shows is a Bing photograph, which is Microsoft's own artwork
  and not something this project can ship, so the picture is drawn in SVG and
  `newtab.js` says why
- **The pages Edge carries**: `edge://favorites`, `edge://history`,
  `edge://downloads`, `edge://settings`, `edge://about`, and one website Windows
  ships with. Everything else gets "Hmmm... can't reach this page", because there
  is no internet on this computer and a browser that invented pages would teach
  the wrong thing
- **Find on page**, which really highlights: the count of what it found, the mark
  on each match, the one the cursor is on, and next/previous
- **Favorites** the star actually keeps, **Save page as** and **Create shortcut**
  writing real files through the volume, and honest answers from print (no
  printer), screenshot (no Print Screen key) and browser essentials (nothing to
  keep ready)
- **Edge's shortcuts**: Ctrl+T, Ctrl+N, Ctrl+Shift+N for InPrivate, Ctrl+H,
  Ctrl+J, Ctrl+F, Ctrl+D, Ctrl+P, Ctrl+Shift+S, Ctrl+Shift+O, F5, Alt+Left,
  Alt+Right and Alt+F
- **A window with no title bar.** An app that draws its own chrome asks for
  `createWindow({ frameless: true })` and says which of its parts drags the window
  with `win.setDragHandle(element)`; the frame is built without a title bar, and a
  press inside that region moves the window - Aero Snap included - unless it
  landed on something meant to be pressed. Edge uses it: its tab strip is where a
  title bar would be, its own caption buttons sit at the end of that strip and
  call the same window API the shell's do, and dragging the empty strip moves the
  window the way dragging a title bar does
- Twenty glyphs Edge's chrome needs added to the Segoe MDL2 table in
  `tools/build_mdl2_icons.py` and regenerated into `js/global/mdl2.js` - the star,
  history, print, camera, help, InPrivate, new window, open in new, bookmarks,
  zoom in and out, clear, share, stop, the chevron and others - each looked up in
  Microsoft's own icon list rather than remembered. Three Edge buttons the font
  has no shape for (browser essentials, extensions, Copilot) are drawn, which is
  the one case where hand-drawing is the honest answer

### Removed

- None

### Changed

- None

### Fixed

- None

## [1.14.0] - The shell's own text fields

2026-10-14

### Added

- `js/core/textfield.js` and its four companions: a text field the emulated OS
  owns, drawn by the shell rather than handed to the browser. The text, the
  selection, the caret and the caret's blink are ours, so the browser has nothing
  to type into and nothing to raise a keyboard for - which is the whole reason
  the phone's own keyboard used to come up over the desktop every time a box was
  tapped
- The field answers the interface an `<input>` did - `.value`,
  `.selectionStart`/`.selectionEnd`, `.setSelectionRange()`, `.select()`,
  `.focus()`, `.scrollTop`/`.scrollHeight`, `.placeholder`, `.type`, and the
  keydown / beforeinput / input / change / select events - so the code that uses
  a field is unchanged and only the line that created one is different
- Editing Windows' way: a caret that blinks only while the field has focus,
  double-click takes a word and three clicks a line, a drag selects, arrows move
  by character or by word with Ctrl, Home/End work per line and Ctrl+End to the
  end of the text, and Backspace repeats when it is held
- **Undo and redo** the shell's own, with a run of typing kept as one step the
  way Windows keeps a word - and cut, copy and paste that work, since
  `document.execCommand` does nothing at all for a div. Notepad's four commands
  go through the field now instead of through a browser that has no text to act on
- A password field shows bullets, and the sign-in screen's show-password button
  still works, because `.type` is now a real thing the field answers to
- `css/textfield.css`: the box, the focus ring and the placeholder text. The
  caret and the selection are placed from the browser's own text measurement
  (a Range's rectangles), so wrapping, tabs and a hundred lines need no
  arithmetic here
- `js/system/drag.js`: whether a drag is under way, for the surfaces that need to
  know. Counted rather than flagged, because the worst failure of a flag here is
  permanent - a stuck one freezes the pointer for the rest of the session with
  nothing on screen to explain why

### Removed

- **`keyinput.js`**, and with it the whole workaround it existed for. Marking a
  field `readonly` and `inputmode="none"` to stop the browser raising its
  keyboard, catching the press before the focus to be in time, and putting the
  focus and the selection back after a key stole it - none of it is needed when
  the field is not a form control in the first place
- The popup's `suppressIfActive` hook, for the same reason

### Changed

- **Every text box the shell draws is now one of these**: Explorer's address bar,
  search box and rename, the popup API's text, password, number and multiline
  fields, the taskbar's search, the sign-in password, and Notepad's editor - so
  none of them can raise a keyboard, and a key on the virtual keyboard has
  something to type into that will still have the caret afterwards
- Notepad's editor is a shell field, so word wrap, the status bar's Ln/Col, find,
  replace, Go To and the editing commands all drive it as they did; the two
  places that reached for the browser's own undo and paste now ask the field
- `stage.js` gained `stageScale()`, which measures the scale the monitor is drawn
  at instead of recomputing it from the viewport, for the keyboard that sits its
  height above the taskbar
- The caret's cursor shape comes from `[role="textbox"]`, which the field
  carries, so the beam appears over a field the way it did over an `<input>`
- **`css/textfield.css` now loads second, straight after `css/base.css`**, and the
  field's defaults are written inside `:where()`. The sheet used to be last, where
  its defaults beat whichever surface came before: the sign-in field's
  `height: auto` lost to `.sim-field`'s own 22px and the box stopped filling its
  row. `:where()` matches identically and carries no specificity, so a surface is
  believed whatever order the stylesheets load in
- The field layer is no longer promoted with `will-change: transform`. A field
  with word wrap off is as wide as its longest line, and asking a phone's GPU for
  a texture that size is how text comes back garbled
- **The emulated cursor now says where it has moved to.** It dispatched presses
  but no `mousemove`, so nothing that follows a pointer ever heard about a drag.
  The event goes to the document and does not bubble: the shell's window-level
  `mousemove` handlers are the emulated pointer's own plumbing, already fed by the
  device that moved it, and an event bubbling up from an element would make every
  drag in the shell happen twice
- The emulated cursor is clipped to `.sim-cursor-frame`, a box the size of the
  stage bounded by the window. It has to live outside the stage - in there the
  stage's stacking context traps it and paints it under context menus - and
  nothing was clipping it, so at the edges of the screen its 32px sprite hung off
  the monitor, which on a phone lands visibly on the page. Clipping rather than
  clamping the pointer's position: the pointer still reaches every pixel of the
  screen, so a resize grip on the right edge of a window stays reachable
- A window title bar no longer dresses the pointer in the four-arrowed move
  cursor, on hover or through a drag. Windows does, and here the shape meant
  nothing: a title bar is the widest thing anyone aims at, so the arrow flickered
  on and off as the pointer crossed it on its way somewhere, and then stayed for
  the whole drag - one glyph still claiming a move after the window had moved
- Context menus take their **width** from the emulated screen as well as their
  height, and a narrowed menu ellipsizes its labels rather than pushing the
  shortcut hint and the submenu chevron off the edge

### Fixed

- **The caret is drawn beside its character instead of on top of it**, in every
  field. Three separate causes: a collapsed range at the end of a text node
  answers with the *last character's* rectangle, so a caret at the end of the text
  was drawn over it - in the password box, over the last dot; the caret and the
  selection are children of the layer that scrolling translates, so their numbers
  have to be where the text sits *before* the layer is moved, and the scroll was
  being applied a second time; and both were painted before the scroll was applied
  at all, leaving them a whole scroll behind
- **On a phone every field's caret was at a fraction of its distance**, because the
  browser measures in page pixels and the emulated display is scaled to fit the
  viewport: the caret for the tenth character was drawn where the fifth is. The
  field asks how big it is actually being drawn and divides by it. The selection
  had the same problem and was half its width, and scroll-into-view was comparing a
  half-scale distance against an unscaled width
- A field that has lost focus shows no caret at all. Stopping the blink is not how
  you get there: with no animation running the line sits at full opacity, which is
  how a caret came to stand in boxes nobody was typing in
- The caret at a soft wrap stands at the start of the new line. Measured from the
  character in front of it, which at a wrap does not exist, it was drawn at the
  end of the previous line instead
- **A click puts the caret between the characters** rather than at the start of the
  field. `caretPositionFromPoint` declines whenever the text sits in a layer that
  scrolling moves, and the fallback then answered 0; the offset is measured now,
  by searching the offsets for the line under the point and then the character
  within that line - both searches halve each step, so a click costs the same in a
  four-character password box as in a line of five thousand
- **Holding a character and dragging selects the text between**, so it can be
  copied - the same missing `mousemove` as above, with the field now reporting the
  selection as the drag goes both ways. A press with no movement behind it is
  still a caret and not a selection
- The selection is the accent blue laid *over* the field (`rgba(0, 90, 158,
  0.45)`) rather than a flat pale tint, so the characters stay legible through it.
  It sits behind the text and is drawn no wider than the characters it covers, so
  it never tints the field's own padding
- **Swiping the touchpad no longer holds the left button.** Tap-and-drag engaged
  on any movement past 24px after 150ms, and a swipe *is* movement past 150ms, so
  every swipe pressed and dragged whatever the cursor was over. A finger now has
  to come to rest before it travels, which is what tells a drag from a swipe on a
  real pad; the 500ms hold-to-press is unchanged
- The floating keyboard no longer snaps to the left edge when it is dragged: its
  clamp range was `[0, 100vw - (100vw - 8px)]`, so every sideways move landed on 0,
  and letting go of the drag restored the centring transform and jumped the panel
  half its own width to the left
- **Explorer Quick access no longer stacks its rows.** Pressing Recent, Favorites
  or Shared appended a set under the last one's for as long as the page was open,
  because the loop that clears them walked from the front and stopped on the
  header row it was meant to keep
- A context menu wider than the emulated screen ran off the right: only its height
  was ever clamped. One narrower than the screen now gives up its minimum rather
  than hanging off both sides, and a replaced page's tab strip stops reaching for
  the store at all
- Sign-in: Enter signs in, the arrow turns the accent blue when there is a
  password to send, the show-password eye is dark on the white box instead of
  white on white, and the password row is one box that the field fills rather than
  a small box in the corner
- The focus ring no longer appears when a text box is clicked into - the caret is
  the feedback, as on Windows - and comes back for keyboard navigation only
- A held key repeats by sending the key to the field rather than into the
  document, so a held Backspace keeps deleting


## [1.13.1] - The keyboard stops fighting the fields

2026-10-13

### Added

- None

### Removed

- None

### Changed

- The key press is caught in the capture phase, before the emulated cursor
  focuses the field. `cursor.js` dispatches the press and focuses in that
  order, so a field is marked before the focus lands rather than after it
- Suppression now sets `inputmode="none"` as well as `readonly`, and restores
  both - `inputmode` is what Android reads, `readonly` is what iOS reads
- A field whose focus has moved elsewhere is put back, with the selection it had,
  before the key is delivered
- A popup asks for the same treatment for the caret it puts in its own first
  field, which has no press to catch it beforehand

### Fixed

- **The phone's own keyboard still came up.** Marking a field readonly from a
  `focusin` handler was always too late: the browser asks for its keyboard as
  part of focusing a field, so by the time focusin ran it was already on its way
  up. It is now marked before the focus, which is the only moment the decision
  has not been made
- **The fields deselected when a key was pressed.** A key is a `<button>`, and a
  button takes focus when it is pressed, which pulled the caret out of the field
  and collapsed its selection - and left the following keys with nothing to type
  into. The press's default is now declined, and the focus is restored even if a
  browser moves it anyway
- A field the user taps away from is handed back to the browser rather than left
  readonly, and a field an app made readonly itself is left readonly

## [1.13.0] - A virtual keyboard

2026-10-13

### Added

- `js/core/keyboard.js`: the Windows touch keyboard, as page chrome beside the
  fullscreen button. It is two pages - letters and symbols behind `?123` - with
  shift, ctrl, alt, esc, backspace, tab-in-place, the arrow keys, space and
  return, and it can be dragged anywhere on the screen by its grip bar
- A toggle button above the fullscreen button puts it away and brings it back.
  It is offered only on a handset, for the same reason the fullscreen button is:
  a machine with a keyboard under the hands has no use for one drawn on the glass
- While it is up it holds the browser's own keyboard down, so there is never a
  second keyboard over the desktop. `inputmode` is honoured on Android and
  ignored on iOS, so the one thing both respect is `readonly` - which is safe
  here because the typing writes to the value directly
- `js/core/keyinput.js`: the keys and what pressing one does to a field. A press
  is delivered as the sequence a browser delivers for a real one - keydown, then
  beforeinput and input if the field accepted it, then keyup - so every app that
  already listens for keys keeps working. Notepad's Ctrl+S, Explorer's
  Enter-in-the-address-bar and a popup's Enter-to-submit are ordinary keydown
  listeners, and none of them asks whether the key was real
- Held keys repeat as hardware keys do: backspace deletes on the way down and
  keeps deleting, with a slower first repeat than the rest
- Sticky ctrl and alt, and a one-shot shift that lets go as soon as it has typed
  its one character - there is no way to feel a latch through a screen
- The keyboard opens sitting on top of the emulated taskbar rather than over it,
  measured from the stage's own scale, and is put back on its feet if a rotation
  leaves it off screen

### Removed

- None

### Changed

- `CHROME_SELECTOR` in `cursor.js` now names the keyboard panel as well as the
  `.site-chrome` buttons. It is a panel rather than a button, so dressing it in
  the button's own styles would be wrong, but it is the same thing to the input
  layer: chrome the emulated cursor must never press
- `isHandheld()` is exported from `sitechrome.js`; the keyboard asks the same
  question the fullscreen button does
- The MDL2 table grows `KeyboardStandard` (U+E92E) and `GripperBarHorizontal`
  (U+E76F), so the toggle and the drag handle are the font's own shapes

### Fixed

- A finger that starts on the page's chrome and moves no longer steers the
  emulated cursor: the touchpad only ignored chrome on `touchstart`, so dragging
  the keyboard by its grip moved the cursor underneath it. A gesture that
  *started* on the pad is still not abandoned when the finger crosses the chrome
  over it, because dropping it mid-drag would strand a press
- Backspace deleted nothing when there was no selection, because the edit was
  given an empty replacement for an empty range; it now takes the character in
  front of the caret
- A caret range that runs backwards no longer doubles the text around it

## [1.12.0] - Installable as an app

2026-10-13

### Added

- `manifest.webmanifest`: the site is now installable. A launcher opens it as an
  app - its own window, no browser bars, the Windows mark as its icon - and the
  service worker it already had means it opens with no network
- `assets/app/`: the app icons, built by `tools/build_app_icons.py` out of the
  Windows logo the shell already wears. The mark's own alpha is used as a
  silhouette and painted white on the accent blue, which is how Windows draws it,
  so nothing here redraws the logo. 192 and 512 for launchers, a maskable 512
  with the mark inside the safe circle, and an apple-touch-icon because iOS
  ignores the manifest and wants that name
- `index.html`: the manifest link, `theme-color` (the accent blue the taskbar is
  built on), the favicon, and the iOS tags - `apple-mobile-web-app-capable` and
  friends - so Share > Add to Home Screen opens the app rather than a web page
- **An install button**, the same courtesy the fullscreen button already offers:
  it appears only once the browser fires `beforeinstallprompt`, so a platform with
  no way to install us is never shown a button that would do nothing. The offer
  is spent on first use and the button goes away once it is taken up
- The install offer is asked for independently of the fullscreen button, so a
  desktop browser (offered the install, not the fullscreen) gets it too

### Removed

- None

### Changed

- `index.html`'s `apple-mobile-web-app-status-bar-style` is `default` rather than
  `black-translucent`: that one puts the page under the status bar, and nothing
  here handles the safe-area insets it would need

### Fixed

- **The message box marks are the real MDL2 glyphs after all.** [1.10.0] drew the
  warning triangle, error disc and info disc by hand on the stated grounds that
  the font has no circle-and-exclamation. It does: U+E7BA `Warning`, U+E783
  `Error` and U+E946 `Info` are all in Microsoft's own icon list. The drawn ones
  are gone, the generator's table carries the four new codepoints, and the skin
  colours the marks the way Windows colours them
- `FULLSCREEN_SVG`'s comment claims MDL2 has no corner-bracket glyph. That is
  worth a look: the font has U+E740 `FullScreen` and U+E92D `ChromeFullScreen`,
  and this file's own table already carries the first. The drawing is left alone
  here rather than changed on the side

## [1.11.0] - The touchpad behaves like a touchpad

2026-10-13

### Added

- `js/core/touchpad.js`: the gestures a finger set means, recognised apart from
  the cursor that reports them. The pad is the whole stage on a touch screen, so
  the gestures have to carry what a mouse would otherwise
- **Two fingers tapped is a right click**, routed to whatever is under the emulated
  cursor, so every context menu in the shell - the desktop, Explorer's files, a
  taskbar button, a window's system menu - is reachable without a mouse
- **Three fingers tapped is a middle click**, delivered as the button-1 press pair
  plus `auxclick` and deliberately not as a `click`, because a middle click is not
  an activation and must not launch anything
- **Tap and drag**: a finger that is still travelling 150 ms after landing, and
  has gone past the wobble of a click, presses and drags what the cursor is over,
  so a window or icon can be dragged without waiting out the hold
- **Scroll momentum**: a flick keeps scrolling after the fingers lift, decaying to
  a stop over up to 400 ms. A new finger, or a real wheel turning, stops it dead
- **Pointer acceleration**: slow finger travel gains less of the cursor than fast
  travel, so a taskbar icon can be hit and a screen can still be crossed. The top
  gain is unchanged, so a flick moves as far as it did before
- Two fingers have to travel past a small dead zone before anything scrolls, so a
  second finger landing slightly off centre is not a jolt

### Removed

- None

### Changed

- Gesture state left `cursor.js` for `touchpad.js` (846 -> 717 lines). The
  cursor now hands the pad a driver - move, press, release, click, rightClick,
  middleClick, scroll - and the pad never touches the DOM itself
- Scrolling follows the centroid of the fingers rather than one of them, so
  lifting one of three carries on instead of jumping
- A press that a second finger interrupts is released rather than left stuck down,
  and a cancelled gesture no longer coasts
- `TOUCH_SENSITIVITY` is replaced by `TOUCH_ACCEL_CURVE`, the tap, multi-tap,
  dead-zone and momentum values; the hold and tap timings are unchanged

### Fixed

- Two fingers lifting in the usual order (one before the other) no longer
  discarded the two-finger tap, which made right-click unreachable
- A two-finger scroll measured each finger separately, so the second one got a
  zero-length frame and the coast came out six times too strong

## [1.10.0] - The shell's real icons, and a machine with no network

2026-10-12

### Added

- `js/global/mdll2.js` (generated): 57 glyph outlines taken from the **Segoe MDL2 Assets** font, the icon font Windows 10 actually draws its shell with - Start hamburger, app list, tile grid, power, the four window caption buttons, task view, wifi, volume, Action Center, search, settings, and more
- `tools/build_mdl2_icons.py`: regenerates `js/global/mdl2.js` from `assets/win10-shell-icons/SegoeMDL2Assets.svg`. Every codepoint carries the name Microsoft documents for it, and the build **fails loudly** if a codepoint is not in the font rather than emitting a near-miss
- `assets/win10-shell-icons/SegoeMDL2Assets.svg` + `SegoeMDL2-LICENSE.md` (MIT) and `assets/win10-shell-icons/README-mdl2.md`
- `NETWORK_OFFLINE_SVG` / `GLOBE_SVG`: the globe Win10 shows when there is no network

### Removed

- Every hand-drawn monochrome glyph in `js/global/icons.js` that MDL2 actually provides (21 in all): hamburger, app list, tiles, power, account, shut down, restart, the four caption buttons, search, task view, chevron, wifi, volume, Action Center bell, the sign-in monitor/power/accessibility cluster, and the app-list forward arrow
- The colour baked into glyph paths (`stroke="#222"`, `fill="#222"`, `stroke="#fff"`)

### Changed

- Shell glyphs are now filled with `currentColor` and coloured by the surface that uses them, so one glyph serves both the light taskbar and the dark lock and sign-in screens instead of the colour being frozen into the artwork
- The simulated machine now reports **no network** on all three surfaces that showed one - the taskbar tray, the sign-in status bar and the lock screen. The tray icon is the globe and the accessible name is "Network - Not connected", which is what Win10 shows when nothing is connected; the wifi arcs claimed a connection that does not exist

### Fixed

- The window close button's hover colour was set with `stroke: #fff`, which stopped working once the glyph became a filled path; it is now a `color` on the button
- `PC1` (the monitor glyph used on sign-in and lock screens) was missing from `js/global/mdl2.js` because a duplicate `SWITCH_USER` key in the generator's table silently dropped it — now the generator has a duplicate-key guard that fails the build instead of silently dropping glyphs

### Notes

Three glyphs are still hand-drawn because MDL2 genuinely has no equivalent, and each says so in a comment: the Sleep moon, the fullscreen corner brackets, and the lock-screen eye.

## [1.10.0] - The popup API

2026-10-13

### Added

- `context.popup(spec)` - how any app asks the shell for a dialog, and the
  first surface an app gets without declaring a permission. One schema covers
  every shape Windows draws a dialog in: `title`, `icon`, `heading`, `body`
  (paragraphs, and links), and `fields` of `text`, `password`, `multiline`,
  `number`, `dropdown`, `listbox`, `checkbox`, `radio`, `slider` or `progress`,
  each with a label, a placeholder, a hint, a width and a disabled state
- Buttons decide the dialog: `primary` is the default Enter button, `cancel` is
  what Escape means, and a button can hold the dialog open. The call is awaited
  and answers with `{ button, values }`, or with `null` when the dialog was
  dismissed - the same difference Windows draws between closing a dialog and
  answering it
- The handle stays useful while the dialog is open: `values()`, `setValue()`,
  `enable()`, `setHint()` (with the red error styling Windows uses for a field
  that failed), `setTitle()`, `press()`, `close()`, `focus()`, `isOpen()`
- `onSubmit` may return `false` to refuse the close, which is how a popup
  validates: Enter is pressed, the field is marked, and the dialog stays put
- `onChange` reports a field as it is edited, with every value so far
- A dialog is dressed as one: no maximise, no resize grips, close and (unless the
  app opts out) minimise - `windowchrome`/`windowmanager` grew a `chrome` option
  for that. Its height follows what it has to say, so a one-line message is a
  short box and a three-field form is a tall one
- The dropdown chevron and the dialog's other marks come from the generated
  Segoe MDL2 glyphs. The red disc, blue disc and yellow triangle are drawn here,
  because the font has no circle-and-exclamation

### Removed

- None

### Changed

- The shell's message box is now a popup rather than a hand-built window, so
  Explorer's and the desktop's dialogs get the same glyphs, buttons and
  Enter/Escape handling as anything else that asks for one

### Fixed

- None

## [1.9.0] - Shortcuts

2026-10-12

### Added

- `js/apis/shelllink.js`: the `.lnk` shortcut - what it points at, where to
  start it, its icon, window state and description. Windows stores a shortcut as
  a binary Shell Link (MS-SHLLINK); there is no build step here to compile a
  binary writer and a real Shell Link would mean nothing to anything in this
  simulator, so a shortcut is a record under the `.lnk` name holding the fields
  Windows holds
- **Create shortcut** on a file, a folder or a desktop icon (Alt+Shift+T), writing
  `name - Shortcut.lnk` beside what it points at. A name already taken gets the
  next number rather than overwriting the first
- Opening a shortcut resolves it at that moment: a folder target walks into it,
  a file target goes to whatever app registered for its type, and an app target
  starts the app. A target that has gone says so in the message box Windows uses
  ("Windows can't find ...") instead of doing nothing
- Shortcuts wear the arrow over their icon, in Explorer and on the desktop, so a
  link never reads as the thing it points at
- A shortcut's Properties: target type, location, size, created, modified,
  start in, shortcut key and description, the fields Windows shows
- **The desktop now shows the desktop folder.** Everything in
  `C:\Users\User\Desktop` appears as an icon beside This PC and the Recycle
  Bin, keeps the slot it was dragged to across a refresh, opens on a double-click
  and can be deleted from its own menu
- `.lnk` registers as the **Shortcut** file type, so a shortcut calls itself that
  in Explorer's Type column and Properties
- `js/system/events.js`: the shell's event bus. Explorer changes the volume and
  the desktop re-reads its folder, so a shortcut made in one shows up in the
  other without either importing the other

### Removed

- **The `.ink` ink format from 1.9.0 of the same number.** That version was the
  wrong feature: "the .ink format" was asked for as the format of a *shortcut*,
  and it built InkML ink documents instead. The file-type registry it introduced
  is kept, because shortcuts need it

### Changed

- The known folders' artwork moved into `constants.js`, so the desktop and a
  listing agree on which folder wears which icon
- The shell's message box moved out of the Explorer app into `js/core/msgbox.js`,
  because the desktop needs one too and an app may not borrow another app's

### Fixed

- None

## [1.7.8] - The grid insets, corrected

2026-10-12

### Added

- None

### Removed

- The app list's own right inset by a resize strip, which is the panel's edge and only ever ran over the tile grid

### Changed

- `START_TILE_PAD_RIGHT_PX` is 38px, not 18px: the right inset has to clear the 20px resize strip as well as pad the tiles off the edge, and their sum is once again 44px - the same total the single even pad gave - so every snapped menu width is the size it was before the split

### Fixed

- The split insets put the tiles under the menu's right resize strip, so the last column of tiles ran out past the panel edge where the handle is drawn
- The app list reserved the right resize strip inside itself as well, opening a dead gutter roughly 26px wide between the list and the first column of tiles - the "huge left padding" the split was meant to reduce

## [1.7.7] - The Start column stops opening itself

2026-10-12

### Added

- None

### Removed

- The dwell no longer samples the pointer once as Start opens: the Start button sits directly below the column in the same 48px strip, so the pointer that opened the menu was always parked on the column
- `START_TILE_PAD_PX * 2` as the grid's horizontal inset, replaced by `gridPadX()`

### Changed

- The tile grid's insets are split into `START_TILE_PAD_LEFT_PX` (6px, the tiles sit close against the app list) and `START_TILE_PAD_RIGHT_PX` (18px, clear of the panel edge and the resize strip), handed to the CSS as `--tile-pad-left` / `--tile-pad-right`. Their sum is what the width snapping measures, so a whole-column snap is unchanged
- Leaving the column now calls off a dwell that is already running

### Fixed

- The Start icon column opened by itself with the pointer nowhere near it. Moving off the strip during the 2s dwell cleared the manual-dismissal flag but left the timer armed, so it fired and opened the column after the pointer had already gone somewhere else
- Opening Start and leaving the pointer still could arm the dwell at all, from the Start button's own position under the column — the same phantom open, two seconds after every open

## [1.7.6] - Start tiles move down as well as across

2026-10-12

### Added

- `--tile-rows` (the store's row count) and `--tile-row` (`START_TILE_ROW_PX`), so the grid declares its rows the way it already declared its columns

### Removed

- None

### Changed

- The tile grid's rows are now declared (`grid-template-rows`) at the same height the menu's resize snapping already assumed, instead of being left implicit at `auto`. Rows past the ones the menu is sized for come from `grid-auto-rows` at that same height, so a tile dropped below the last visible row still lands on an equal row

### Fixed

- A pinned tile could not be dragged down at all. The grid declared `grid-template-columns` but never `grid-template-rows`, so the computed `grid-template-rows` resolved to `none` and the drag's row walk had an empty track list to walk — every drop landed in row 0 and only horizontal movement appeared to work
- A scrolled tile grid targeted rows too low: the grid's own rect does not move when its content scrolls, so the scroll is now added back in before the row is measured

## [1.7.5] - The account and power stop crowding each other

2026-10-12

### Added

- None

### Removed

- None

### Changed

- The Start column's account row height moved from an inline `height` on the row to a `--account-h` custom property, so the CSS can give the closed column's stacked row a height of its own
- Closed, the account and the power are separated by 8px in a row that grows to fit them instead of being pinned to the 52px the open row uses side by side

### Fixed

- Closed, the account's 30px avatar did not fit the 24px box the stacked row gave it, so it ran down over the power button below and the two read as one crowded glyph

## [1.7.4] - The hamburger opens the Start column itself

2026-10-12

### Added

- The hamburger is a real switch: one press spells the column's labels out, the next puts them away, and its `aria-label` says which of the two the next press will do

### Removed

- The hamburger no longer flips between the App list and Pinned apps views - that job belongs to the two view buttons in the column, which always said so

### Changed

- A column the user shut by hand stays shut even with the pointer resting on the strip; the dwell only opens it again once the pointer has left the column and come back
- Closing Start clears the manual dismissal too, so every Start session begins from the strip shut

### Fixed

- None

## [1.7.3] - The Start icon column waits to be sure

2026-10-12

### Added

- `START_RAIL_HOVER_MS` (2s): how long the emulated cursor has to rest on the Start icon column before the column widens and spells out its labels
- The column is measured against its own rect as the pointer moves, so dwelling anywhere on the strip counts, not only hovering one of its buttons

### Removed

- The `:has(.start-rail:hover)` / `:has(.start-rail .sim-hover)` hover pair and the `.rail-latched` touch class: both are replaced by the single `.rail-open` state, since a real `:hover` never fires on the emulated UI and `.sim-hover` only ever landed on buttons

### Changed

- The column opens only after the dwell and then stays open for the rest of that Start session; closing Start is the only thing that puts the labels away (a tap off the column still closes it on touch, where a tap is the only gesture there is)
- The dwell is cancelled by a Start resize gesture and by closing the menu, so a column can't open over the next session

### Fixed

- None

## [1.7.2] - The Quick access tabs stop piling up rows

2026-10-12

### Added

- None

### Removed

- None

### Changed

- None

### Fixed

- Pressing Recent, Favorites or Shared appended another list instead of replacing the one on screen, so the rows doubled up with every press. Clearing the list asked for "keep removing until the header is first" - which was already true, so it removed nothing

## [1.8.0] - App manifests, permissions, and a real Open with

2026-10-12

### Added

- App manifests: a registered app now declares who publishes it, its version, a description, **what it may ask of the shell**, and **which files it opens**. Explorer, This PC and Notepad all ship one
- File type associations (`js/apis/associations.js`): the shell's own table of which app claims which extension, in the order they registered - the shape Windows keeps in HKCR. The first app to claim a type is the one a double-click opens it with
- **Files now open.** Double-clicking one launches the app that registered for its type, and a search hit opens the same way. Nothing launched anything before
- **Open with** on a file's menu: every app registered for the type, plus *Choose another app...*, which opens the "How do you want to open this file?" dialog - the apps with their publishers, the default ticked, and *Always use this app*. A remembered choice is kept per profile, and only counts while that app still claims the type, so it can never point at nothing
- The Type column and a file's Properties name the type an app gave it when it registered, and say which app will open it (`Opens with:`)
- `js/apis/prefs.js`: one small per-profile preference file on the volume, with debounced writes. Quick access and the file-type defaults share it now instead of each keeping its own copy

### Removed

- None

### Changed

- Permissions are enforced by the shell, not declared for show: `storage` is checked before an app is handed the volume, so an app whose manifest never asked is never given the files. It gets the same volume shape with storage unavailable, which is the path its "no storage" handling already took
- An app can ask what it may do: the launch context carries its `manifest` and a `hasPermission(name)` in case a surface is added later

### Fixed

- None

## [1.7.1] - The wheel scrolls again

2026-10-12

### Added

- None

### Removed

- None

### Changed

- A wheel over the emulated desktop now finds the scroller under the cursor and moves it: the nearest box above the pointer that can move on that axis, in the way the browser moves one for a real wheel. Line-mode deltas are translated to pixels first, so a wheel that reports lines still scrolls a sensible distance

### Fixed

- Nothing scrolled - not a folder listing, not a long Start menu, not a file in Notepad. Every wheel that reaches the emulated desktop is re-dispatched at the element under the pointer, and a browser only carries out a wheel's default action for a *trusted* event, so the re-dispatched one did nothing at all

## [1.7.0] - The command bar, the way Windows 10 draws it

2026-10-12

### Added

- The File tab is Backstage now: instead of another ribbon it takes over the whole command area with the places and commands this window can go (Quick access, This PC, Quick access settings, File Explorer Options, Pin to Quick access, Properties), the chosen one spelled out on the right, and a Back arrow that returns to the ribbon you came from
- Win10's two command shapes: a large tile (icon above, label below) for the command a group leads with, and a small button (icon beside the label) for everything else, with the group's name captioned underneath and a hairline between groups
- The groups Windows 10 puts on each tab - Computer: Clipboard (tall Paste beside Copy / Move to / Delete), Organize, Windows, Help. View: Navigation pane, Layout (the four icon sizes over the four views, in a four-across grid), Current view, Show/hide, Options
- The File tab wears the blue backstage button Windows 10 gives it, and the ribbon tab you are on takes a white tab with a blue edge
- Properties in the ribbon (and in Backstage) opens the current folder's own properties sheet
- Quick access's star, from the Favorites icon it inherited, extracted by `tools/extract_icons.py`

### Removed

- The Win11 house icon that stood in for the Home page: on a Windows 10 shell that page is Quick access, and the star is what names it

### Changed

- The page File Explorer opens on is now called **Quick access** everywhere Windows 10 says so: the nav pane, the address bar, the breadcrumbs and the search box. Typing `Quick access` or `Home` still reaches it
- The nav pane leads with the Quick access star, then the pinned folders, then This PC with the drive under it - no second "Quick access" heading under its own row
- The ribbon is about 70px tall instead of swallowing the top of the window, with Win10's metrics: a 22px tab row, 15px icons on small commands and 30px on tiles, 11px labels

### Fixed

- None

## [1.6.1] - The right folder icons, and no 3D Objects

2026-10-12

### Added

- None

### Removed

- `3D Objects` is no longer one of the profile's known folders. Windows dropped it along with the old Shell Experience Host, so a current install has no such folder in it

### Changed

- Desktop and Downloads wear the folder icons Windows 10 actually draws for them (from Imageres) instead of the standalone glyphs, so all six known folders now read as one set

### Fixed

- None

## [1.6.0] - This PC, and a Home to land on

2026-10-12

### Added

- `This PC` as its own app: it opens the machine's own page, while launching File Explorer lands on Home. Windows keeps both inside one program, so the This PC window still carries File Explorer's icon and title, and This PC has its own entry in the Start menu's app list
- The Home page Explorer opens on, laid out the way Win10 lays it out: a collapsible Quick access grid of the profile's pinned folders (artwork, name, "Stored locally", and a pin that takes one back out), then the Recent / Favorites / Shared tabs, then the folders and the drives
- `js/apis/quickaccess.js`: the pinned folders and the recently used list behind Home, kept per profile in one hidden file on C: (`$QuickAccess.json`) the way Windows keeps them in the registry. Opening a folder or a file lands in Recent, and opening it again moves it back to the top instead of listing it twice
- `tools/extract_icons.py`, and the seven shell icons it takes out of this machine's Windows 10 set: Home, plus Desktop / Downloads / Documents / Music / Pictures / Videos, which now wear their own artwork everywhere they appear instead of the plain folder glyph
- The nav pane gained Home at the top and a This PC group, and its Quick access list now follows the pins

### Removed

- None

### Changed

- Launching File Explorer opens Home instead of This PC; the desktop's This PC icon opens This PC through the new app
- Typing `Home` or `Quick access` into the address bar goes there, and Up from Home lands on This PC
- Notepad's Open and Save also record the file in Explorer's Recent list

### Fixed

- None

## [1.5.0] - The real Windows cursors

2026-10-12

### Added

- `tools/extract_cursors.py`: pulls the cursor artwork out of this machine's own `C:\Windows\Cursors` and writes 32x32 PNGs, because a browser cannot draw a `.cur` file. It reads each frame's size and hotspot out of the file's own header, decodes the DIB by hand (bitmap + AND mask, 1/8/16/24/32bpp), and walks the RIFF chunks of an `.ani` for its animated frames
- The default (Aero) set as the emulated cursor: arrow, hand, I-beam, move, horizontal / vertical / both diagonal resize cursors, the not-allowed ring, and the loading ring as its 18 extracted frames
- `cursor.js` wears the right one for what the pointer is over, as Windows does: a window's resize grip gets the cursor that runs along that edge, a titlebar the move cursor, a text field the beam, a control the hand
- The loading ring: launching an app puts it on the pointer for the moment the window takes to appear, played at 80ms a frame

### Removed

- The three hand-drawn cursor SVGs (`cursor-idle.svg`, `cursor-linkselect.svg`, `cursor-text.svg`)

### Changed

- `constants.js`: cursor sources and hotspots now come from the extracted files, not from approximations

### Fixed

- Coloured cursors came out with red and blue swapped: the loading ring was orange instead of Windows blue, and the not-allowed ring blue instead of red. A DIB stores pixels as BGRA and they were being read as RGB; the black-and-white cursors hid the mistake

## [1.4.1] - The resize edges can actually be grabbed

2026-10-12

### Added

- A faint blue line down the top and right edges of the menu, brighter while the pointer is on one, so the handles can be found at all
- `START_RESIZE_EDGE_PX` in `constants.js`: the width of the grab strips, shared by the strips, the pane insets and the snapping maths

### Removed

- None

### Changed

- The grab strips are 20 emulated pixels rather than 8: the whole monitor is scaled down on a small screen, where a hairline strip is a couple of real pixels and cannot be caught
- The tile grid, the app list and the icon column's header are inset by the strips (the strips run over the top and right edges), and the width/height maths subtracts the same amount, so a snapped size still gives the grid exactly the room its columns and rows need — verified for every column count
- Opening or closing Start cancels a resize in progress

### Fixed

- A resize gesture that never saw its release — the press let go outside the window, or Start closed underneath it — stayed armed and swallowed the next press on an edge, which left the menu looking impossible to resize
- The handles were thin enough to miss, and the right-hand strip covered the right edge of the rightmost tiles and rows

## [1.4.0] - The Start menu resizes, snapped to whole tiles

2026-10-12

### Added

- Start is resizable from its **top and right edges**, like Win10: the bottom stays pinned to the taskbar and the left to the screen edge, and the panel follows the pointer while it is dragged
- `.start-resize` handles: grab strips on those two edges, wide enough to take on a touch screen, tinted while the pointer is on them
- The menu's size is stored **in grid cells** (`startCols` / `startRows`) alongside the rest of the Start layout, so it is remembered between sessions like Win10 remembers it
- `getStartSize()` / `setStartSize()` in `startstate.js`, and `fitPinsToColumns()` to settle the layout when columns are taken away
- `START_TILE_CELL_PX`, `START_TILE_GAP_PX`, `START_TILE_PAD_PX`, `START_TILE_ROW_PX` and `START_MIN_H_PX` in `constants.js`: the grid geometry the snapping measures, handed to the CSS as custom properties so the snapping and the drawing cannot drift apart

### Removed

- `START_W`: the panel's width is derived from its columns now rather than being a fixed number

### Changed

- `startstate.js`: the grid's column count is the menu's stored width, so a wider menu really is more columns — tiles are placed in it, and the tile grid draws `--tile-cols` from it
- Widening leaves the layout alone (tiles stay where they were put, new columns open beside them); narrowing pulls the tiles in and repacks them in reading order so none end up on top of another
- A menu cannot be squeezed narrower than a wide or large tile is wide: the column count stops at the widest tile on the grid

### Fixed

- None

## [1.3.3] - No resize bars on the tiles

2026-10-12

### Added

- None

### Removed

- The tile resize handles (`.start-tile-grip`): the blue gradient bars that appeared down a hovered tile's right edge and under its label, and with them the edge-drag resize they took
- `starttiles.js`'s `buildGrips`, the grip check in `beginDrag`, and `resizeToPointer`

### Changed

- `starttiles.js`: a tile gesture is always a move now, so the gesture no longer carries a mode
- Tiles still resize — from the tile menu's Small / Medium / Wide / Large, which is where Win10 puts Resize too

### Fixed

- None

## [1.3.2] - The drop target stops running away from the pointer

2026-10-12

### Added

- None

### Removed

- `cellBox`, the hand-measured pixel box for the ghost

### Changed

- `starttiles.js`: the cell under the pointer is worked out from the grid geometry captured when the drag **begins**, not from the layout as it stands. Moving a tile changes that layout — rows appear and their heights change — so measuring the live one made the cell under a still pointer drift with every step, and the tile chased it and could never be taken any further
- The drop ghost is now a grid item of the target cell rather than a measured box, so the grid places it exactly where it places the tile that just moved there and the two cannot disagree

### Fixed

- A tile could be moved roughly one cell and no further, because its drop target kept moving away as the tile moved

## [1.3.1] - The drop ghost stops outliving its drag

2026-10-12

### Added

- `cancelTileDrag()` in `starttiles.js`: calls off a gesture and its ghost. Closing Start calls it, and so does losing window focus mid-drag
- A `ghostLive` flag, so "is a drop target showing" is tracked rather than inferred from the gesture state

### Removed

- None

### Changed

- `starttiles.js`: a rebuild re-appends the ghost while it is showing, not while a gesture happens to be live

### Fixed

- A drag target could be left behind as a stray dashed box on the Start grid. A press let go outside the browser window, or the page losing focus, never delivered a release, so the gesture stayed live and every rebuild drew its ghost again — including on the next time Start was opened

## [1.3.0] - The Start tile grid is a grid you fill in

2026-10-12

### Added

- Tiles remember the **cell** they sit in, not just an order: a pin is now `{ appId, size, col, row }`, and a dropped tile takes the cell under the pointer with the free cells around it left free
- Cell placement in `startstate.js`: `cellTaken`, `firstFreeCell`, `tileOverlapping` and `placePin`. Whatever a drop lands on refills into the first free cell forward, so the grid settles instead of overlapping or drifting
- A drop ghost (`.start-tile-ghost`) marking the cell a dragged tile would land in, positioned out of the flow so marking a cell never moves the layout
- `gridMetrics` / `cellAtPoint` in `starttiles.js`: the grid's own column widths, row heights and gaps are read back from the resolved layout, so the cell maths stays true whatever the tile sizes are drawn as — including rows of differing height under a 2x2 tile
- `START_TILE_COLS`, exported by the state store and handed to the grid as `--tile-cols`, so the placement rules and the drawing agree on how wide the grid is

### Removed

- The lift-under-pointer model (`translate`, `.is-dragging`): the grid *is* the layout now, so the tile sits in the cell it is being dragged to and a ghost shows the target
- `indexOfPin` is no longer used by the tile grid; the grid addresses pins by cell

### Changed

- `movePin(appId, col, row)` replaces the old index-based reorder, and returns false when nothing moved, so a drag that stays inside one cell costs nothing
- `setPinSize` places the tile again after resizing: it stays put and anything the bigger tile now covers moves on
- `pinApp` puts a new tile in the first free cell
- A Start layout saved before tiles had cells is packed in order on load, which puts every tile back exactly where it was drawn

### Fixed

- Tiles could only be reordered, never placed: the grid always packed them from the top left, so there was no such thing as a free cell to drop into

## [1.2.0] - F2: the way in without the ceremony

2026-10-12

### Added

- F2 anywhere in the boot sequence drops straight onto the signed-in desktop: the splash, the lock screen and the account are all called off at once. Offered nowhere in the UI — the key is the whole secret
- `later(fn, ms)` in `boot.js`, so the boot timers are cancelable as a set instead of one by one

### Removed

- None

### Changed

- `boot.js`: the lock root and the lock handle are tracked at module scope so the shortcut can tear the pair down (disposing the lock's clock and listeners) rather than leaving them running behind the desktop
- `boot.js`: the desktop is built at most once, whichever path gets there first — the secret shortcut or a real sign-in

### Fixed

- None

## [1.1.2] - A press can become a drag again

2026-10-12

### Added

- Routed presses that are the echo of a real device press are marked `simEcho` (`cursor.js`), so a surface that follows a press through its lifecycle can tell the echo from the press itself

### Removed

- `starttiles.js`'s `swallowClick`: with the launch decided on release, there is no click left to swallow

### Changed

- `starttiles.js`: a tile launches when its gesture ends up having been a tap, decided in `endDrag` — not on the click, which arrives in the same tick as the press that routed it and therefore always won the race. A press that moved reorders, a press on a resize handle resizes, and a cancelled touch does neither
- `starttiles.js`: a tile lifts (`is-dragging`) only once the press has actually become a drag, instead of on every press
- `desktop.js`: echoes are skipped by the mark rather than by the pointer-lock test, so they are skipped whether or not the pointer happens to be captured

### Fixed

- Start tiles could not be dragged at all: clicking one opened the app instantly with no hold, because the launch happened on the routed click before any drag could begin
- Desktop icons opened on a single click for the same reason — the echo and the real press counted as two taps, so one click read as a double-click

## [1.1.1] - The cursor scales with the emulated screen

2026-10-12

### Added

- None

### Removed

- None

### Changed

- `cursor.js`: the cursor glyph is measured against the stage's live on-screen rect, so it shrinks with the emulated monitor on a small viewport, and its hotspot offset scales with it so the pointer tip stays on the pixel it points at
- `cursor.js`: `resize` and `orientationchange` re-render the cursor, so a viewport change rescales the glyph even if the cursor itself never moves

### Fixed

- The cursor was drawn at a fixed 32 CSS pixels while everything it pointed at was scaled to fit the viewport, so on a phone it was several times too big for the taskbar it hovered

## [1.1.0] - Fullscreen button for handsets

2026-10-12

### Added

- `js/core/sitechrome.js` + `css/sitechrome.css`: a floating fullscreen button for touch devices. It asks for the screen itself, hides the moment it succeeds, and comes back the moment the site leaves fullscreen
- `FULLSCREEN_SVG` in `js/global/icons.js`: the four-corner-brackets glyph
- `index.html` links `sitechrome.css`; `js/boot/boot.js` creates the chrome before the machine boots

### Removed

- None

### Changed

- `cursor.js`: presses that land on `.site-chrome` are left to the browser — not swallowed by the capture layer, not prevented, not routed into the emulated OS — for both mouse and touch

### Fixed

- None

## [1.0.1] - Always run the code Pages is serving

2026-10-12

### Added

- `sw.js`: a service worker that answers every request network-first with `cache: 'reload'`, falling back to the last good copy when the network is gone. It skips the browser's HTTP cache, so a device can never run a stale `js/core/*.js` or `css/*.css` — unchanged files still come back as cheap 304s
- Worker registration in `js/boot/boot.js`: resolves `sw.js` against the module URL (so it works from a domain root or the `/win10sim/` subpath) and registers with `updateViaCache: 'none'`, so a change to the caching strategy itself lands without waiting for the browser's background update check
- Offline as a side effect: with the worker installed, a load with no network boots the OS from the last copy instead of failing

### Removed

- None

### Changed

- `AGENTS.md`: the repository structure lists `sw.js`, and §3 records that the worker — not hand-written `?v=` query strings, which would only cover the files `index.html` names and not the module graph they import — is the cache busting

### Fixed

- Devices kept running an old cached copy of the simulator for as long as the browser's cache allowed, so fixes reached phones and desktops late or not at all

## [1.0.0] - The emulated cursor is the only pointer

2026-10-12

### Added

- `.sim-input-layer` (`css/cursor.css`): a capture layer over the whole viewport that takes every real press, move, wheel and touch, so the browser's pointer can no longer hover, press or scroll the emulated UI — and the UI's own `:hover` can no longer fire
- `hitTestThroughInputLayer(clientX, clientY)` and `isRawDevicePress(event)` in `cursor.js`, shared with the surfaces that need them
- `cursor.hitTest()` and `tracker.hitTest()` for the code that follows a device press through its lifecycle (window moves, icon drags, tile drags) and so must find the target under the emulated cursor themselves
- Wheel routing: the real wheel now scrolls whatever sits under the emulated cursor, captured or not
- Hover tracking on touch: dragging a finger over a control hovers it, like a mouse
- `TOUCH_HOLD_MS` imported into `cursor.js` — it was used but never imported, so every touch hold threw a ReferenceError and touch drag never worked

### Removed

- The native-pointer path: `pointer.js` no longer tracks the browser pointer as a position of its own, the sim cursor no longer parks dimmed while uncaptured, the browser's own pointer glyph is hidden from boot onward, and the `.cursor-live` / `.sim-cursor-parked` styles
- `contextmenu.js`'s locked-press test, replaced by the shared capture-layer check

### Changed

- `cursor.js`: all device input is listened for at the window (the capture layer while uncaptured, the locked stage while captured) and routed to the emulated cursor; with no capture available the browser pointer steers the cursor absolutely instead of driving the UI itself
- The capture layer arms with the machine: the BIOS, lock and sign-in screens stay clickable with the browser's own pointer, as before there being no OS to be the pointer of
- `startmenu.js`, `contextmenu.js`, `snapassist.js` and `windowmenu.js`: a press the device made is no longer read as a press on the UI, so steering the cursor with a finger on the touchpad no longer closes the Start menu, dismisses a context menu or Snap Assist, or commits a guided window move
- `windowmanager.js` and `starttiles.js`: every real press is hit-tested under the emulated cursor, since it lands on the capture layer or the locked stage and its own target says nothing
- `desktop.js`: icon hit-testing goes through the cursor's own hit test for the same reason
- `startmenu.css`: the disabled account/power fly-out rows gained their `.sim-hover` twin, the last hover rule in the app that only answered to a real pointer

### Fixed

- Clicking through the touchpad: a finger on the touchpad reached the UI as a real touch, so Start closed, menus dismissed and windows started dragging under the finger instead of under the cursor
- Hovering with the browser's mouse highlighted controls the emulated cursor was nowhere near

## [0.21.3] - Using a Start fly-out no longer closes Start

2026-10-12

### Added

- `isContextMenuTarget(node)` in `contextmenu.js`: whether a node belongs to a menu on screen, cascade included, for surfaces that need to tell a menu press from a press outside themselves

### Removed

- None

### Changed

- `startmenu.js`: the outside-press handler now ignores presses that land in a context menu, since those menus hang off the document body rather than the panel

### Fixed

- Right-clicking a Start tile or an app list row and then picking anything from the menu closed the Start menu along with the fly-out

## [0.21.2] - The taskbar stopped jumping when Start opened

2026-10-12

### Added

- None

### Removed

- None

### Changed

- `monitor.css` / `desktop.css`: `#viewport`, `#monitor-stage` and `.desktop` now use `overflow: clip` after `overflow: hidden`, so they stop being scroll containers while keeping the same clipping on browsers that do not know `clip`
- `startmenu.js`: the app list takes focus with `{ preventScroll: true }` both when Start opens and when the arrow keys walk the list

### Fixed

- The taskbar jumped up and snapped back as Start opened: opening Start parked focus in the app list, and the browser scrolled that box into view — and `overflow: hidden` containers are still scroll containers, so on a viewport smaller than 1366x768 (a phone) it scrolled the stage itself, moving the whole emulated screen and the taskbar pinned to its bottom edge

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
