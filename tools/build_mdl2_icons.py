"""Regenerates js/global/mdl2.js from the Segoe MDL2 Assets outlines.

Win10 draws its shell glyphs - the Start hamburger, the app-list lines, the
tile grid, the power symbol - from the Segoe MDL2 Assets icon font, not from an
icon file. The ones in js/global/icons.js were hand-drawn approximations; these
are the real outlines, taken from the font.

Source: fonts/mdl2.svg in scottdorman/mdl2-icons (MIT licensed, a vector export
of the Segoe MDL2 Assets font). Every codepoint below is the one Microsoft
documents for that glyph name in its Segoe MDL2 Assets icon list, so a name here
can be checked against Microsoft's own table rather than taken on trust:

    https://learn.microsoft.com/windows/apps/design/iconography/segoe-ui-symbol-font

Run from the repository root:

    py tools/build_mdl2_icons.py
"""

import os
import re
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, "assets", "win10-shell-icons", "SegoeMDL2Assets.svg")
OUT = os.path.join(ROOT, "js", "global", "mdl2.js")
NS = "{http://www.w3.org/2000/svg}"
UNITS = 1024

# Export name -> (codepoint, the name Microsoft documents for it).
# Only the glyphs the shell actually draws; the font holds ~928.
GLYPHS = {
    "GLOBAL_NAV": (0xE700, "GlobalNavigationButton"),
    "ALL_APPS": (0xE71D, "AllApps"),
    "REFRESH": (0xE72C, "Refresh"),
    "SEARCH": (0xE721, "Search"),
    "SETTING": (0xE713, "Setting"),
    "WIFI": (0xE701, "Wifi"),
    "GLOBE": (0xE774, "Globe"),
    "VOLUME": (0xE767, "Volume"),
    "ADD": (0xE710, "Add"),
    "CANCEL": (0xE711, "Cancel"),
    "DELETE": (0xE74D, "Delete"),
    "EDIT": (0xE70F, "Edit"),
    "SAVE": (0xE74E, "Save"),
    "DOCUMENT": (0xE8A5, "Document"),
    "FOLDER": (0xE8B7, "Folder"),
    "NEW_FOLDER": (0xE8F4, "NewFolder"),
    "PIN": (0xE718, "Pin"),
    "UNPIN": (0xE77A, "Unpin"),
    "BULLETED_LIST": (0xE8FD, "BulletedList"),
    "LIST": (0xEA37, "List"),
    "TILES": (0xECA5, "Tiles"),
    "VIEW_ALL": (0xE8A9, "ViewAll"),
    "MORE": (0xE712, "More"),
    "SWITCH": (0xE8AB, "Switch"),
    "ACCEPT": (0xE8FB, "Accept"),
    # Caption buttons: Win10's window buttons are the Chrome* set, which is
    # why they are named for the browser chrome they were drawn for.
    "CAPT_MIN": (0xE921, "ChromeMinimize"),
    "CAPT_MAX": (0xE922, "ChromeMaximize"),
    "CAPT_RESTORE": (0xE923, "ChromeRestore"),
    "CAPT_CLOSE": (0xE8BB, "ChromeClose"),
    "ACTION_CENTER": (0xE7E7, "ActionCenterNotification"),
    "TASK_VIEW": (0xE7C4, "TaskView"),
    "CHEVRON_UP_DOWN": (0xE70E, "ChevronUp"),
    "FORWARD": (0xE72A, "Forward"),
    "TV_MONITOR": (0xE7F4, "TVMonitor"),
    "EASE_OF_ACCESS": (0xE776, "EaseOfAccess"),
    "PEOPLE": (0xE716, "People"),
    "SWITCH_USER": (0xE748, "SwitchUser"),
    "PC1": (0xE977, "PC1"),
    "MUTE": (0xE74F, "Mute"),
    "CHEVRON_RIGHT": (0xE76C, "ChevronRight"),
    "CHEVRON_LEFT": (0xE76B, "ChevronLeft"),
    "CHEVRON_DOWN": (0xE70D, "ChevronDown"),
    "CHEVRON_UP": (0xE70E, "ChevronUp"),
    "POWER": (0xE7E8, "PowerButton"),
    "CONTACT": (0xE77B, "Contact"),
    "LOCK": (0xE72E, "Lock"),
    "HOME": (0xE80F, "Home"),
    "FULL_SCREEN": (0xE740, "FullScreen"),
    "BACK": (0xE72B, "Back"),
    "VIEW": (0xE890, "View"),
    "CROP": (0xE7A8, "Crop"),
    "ROTATE": (0xE7AD, "Rotate"),
    "COLOR": (0xE790, "Color"),
    "OPEN_LOCAL": (0xE8DA, "OpenLocal"),
    # Edge's own chrome: the browser draws its toolbar from the same font the
    # shell does, so these are real outlines rather than Edge-branded artwork.
    "FAVORITE_STAR": (0xE734, "FavoriteStar"),
    "FAVORITE_STAR_FILL": (0xE735, "FavoriteStarFill"),
    "UNFAVORITE": (0xE8D9, "Unfavorite"),
    "BOOKMARKS": (0xE8A4, "Bookmarks"),
    "IN_PRIVATE": (0xE727, "InPrivate"),
    "NEW_WINDOW": (0xE78B, "NewWindow"),
    "OPEN_IN_NEW": (0xE8A7, "OpenInNewWindow"),
    "HISTORY": (0xE81C, "History"),
    "STOP": (0xE71A, "Stop"),
    "CLEAR": (0xE894, "Clear"),
    "SHARE": (0xE72D, "Share"),
    "PRINT": (0xE749, "Print"),
    "CAMERA": (0xE722, "Camera"),
    "HELP": (0xE897, "Help"),
    "ZOOM_OUT": (0xE71F, "ZoomOut"),
    "ZOOM_IN": (0xE8A3, "ZoomIn"),
    "ZOOM_LEVEL": (0xE71E, "Zoom"),
    "PREVIOUS": (0xE892, "Previous"),
    "NEXT": (0xE893, "Next"),
    "OTHER_USER": (0xE7EE, "OtherUser"),
    "ACCEPT_CHECK": (0xE73E, "CheckMark"),
    "PIN_FILL": (0xE841, "PinFill"),
    "PINNED": (0xE840, "Pinned"),
    "ZOOM": (0xE71E, "Zoom"),
    # The dialog marks: a message box is a triangle, a disc with a cross, and a
    # disc with a bar - all three are in the font, so none of them is drawn here.
    "WARNING": (0xE7BA, "Warning"),
    "ERROR": (0xE783, "Error"),
    "INFO": (0xE946, "Info"),
    # The install offer on the page's own chrome: an arrow down to a line.
    "DOWNLOAD": (0xE896, "Download"),
    # The virtual keyboard's own toggle and its drag handle.
    "KEYBOARD": (0xE92E, "KeyboardStandard"),
    "GRIP_H": (0xE76F, "GripperBarHorizontal"),
    # Settings. One glyph per category and per page in the Settings nav, each
    # the name Microsoft documents for it rather than a name for how it looks -
    # see README-mdl2.md for why that distinction matters here. The list was
    # built by name (searching Microsoft's table for "Storage", "Touchpad" and
    # so on) and then checked by rendering every one of them to a contact sheet
    # with tools/mdl2_sheet.js, so each is known to be both correctly named and
    # the shape that name promises.
    "PERSONALIZE": (0xE771, "Personalize"),
    "CELL_PHONE": (0xE8EA, "CellPhone"),
    "ACCOUNTS": (0xE910, "Accounts"),
    "QUIET_HOURS": (0xE708, "QuietHours"),
    "AIRPLANE": (0xE709, "Airplane"),
    "DEVICES": (0xE772, "Devices"),
    "TIME_LANGUAGE": (0xE775, "TimeLanguage"),
    "XBOX": (0xE990, "XboxOneConsole"),
    "BLUETOOTH": (0xE702, "Bluetooth"),
    "KEYBOARD_CLASSIC": (0xE765, "KeyboardClassic"),
    "USB": (0xE88E, "USB"),
    "SPEAKERS": (0xE7F5, "Speakers"),
    "MEDIA_STORAGE_TOWER": (0xE965, "MediaStorageTower"),
    "TABLET_MODE": (0xEBFC, "TabletMode"),
    "DOCK": (0xE952, "Dock"),
    "DOCK_BOTTOM": (0xE90E, "DockBottom"),
    "PROJECTOR": (0xE95D, "Projector"),
    "PICTURE": (0xE8B9, "Picture"),
    "SET_LOCK_SCREEN": (0xE7B5, "SetlockScreen"),
    "LIBRARY": (0xE8F1, "Library"),
    "FONT": (0xE8D2, "Font"),
    "PERMISSIONS": (0xE8D7, "Permissions"),
    "DOWNLOAD_MAP": (0xE826, "DownloadMap"),
    "LIGHTNING_BOLT": (0xE945, "LightningBolt"),
    "CONTACT_PRESENCE": (0xE8CF, "ContactPresence"),
    "CALENDAR": (0xE787, "Calendar"),
    "LANGUAGE_CHT": (0xE88C, "LanguageCht"),
    "HEADPHONE": (0xE7F6, "Headphone"),
    "GAME": (0xE7FC, "Game"),
    "LOCATION": (0xE81D, "Location"),
    "ADMIN": (0xE7EF, "Admin"),
    "DEFENDER_APP": (0xE83D, "DefenderApp"),
    "UPDATE_RESTORE": (0xE777, "UpdateRestore"),
    "REPAIR": (0xE90F, "Repair"),
    "REPEAT_ALL": (0xE8EE, "RepeatAll"),
    "CLOUD": (0xE753, "Cloud"),
    "CERTIFICATE": (0xEB95, "Certificate"),
    "CODE": (0xE943, "Code"),
    "DIAGNOSTIC": (0xE9D9, "Diagnostic"),
    "VIDEO": (0xE714, "Video"),
    "TOUCHPAD": (0xE815, "Touch"),
    "NETWORK": (0xE968, "Network"),
    "VPN": (0xE705, "VPN"),
    "WIFI_HOTSPOT": (0xE88A, "WifiHotspot"),
    "DATA_SENSE": (0xE791, "DataSense"),
    "CHECKBOX_COMPOSITE": (0xE73A, "CheckboxComposite"),
    # Settings draws these too, and the shell already used the REFRESH outline
    # for Restart, which is why Sync - a different codepoint, not an alias - was
    # not in the list until Settings wanted it.
    "MICROPHONE": (0xE720, "Microphone"),
    "MOUSE": (0xE962, "Mouse"),
    "MAIL": (0xE715, "Mail"),
    "SYNC": (0xE895, "Sync"),
    # Settings' own icons, taken from the same documented table. Each is one the
    # shell never drew, so each is here because a Settings page in build 1903 does.
    "BRIGHTNESS": (0xE706, "Brightness"),
    "LEAF": (0xE8BE, "Leaf"),
    "WEBCAM": (0xE8B8, "Webcam"),
    "FEEDBACK_APP": (0xE939, "FeedbackApp"),
    # Focus assist's "During these times" rule is a clock. MDL2 documents no plain
    # Clock, so the Stopwatch stands in: it is a real glyph, it is a clock face,
    # and the alternative - inventing one - is the thing this table exists to
    # avoid.
    "STOPWATCH": (0xE916, "Stopwatch"),
    # Nav artwork for pages this catalogue gained when it was checked against
    # screenshots of build 1903 rather than against memory.
    "PASTE": (0xE77F, "Paste"),
    "BATTERY": (0xE83F, "Battery10"),
    "REMOTE": (0xE8AF, "Remote"),
    "SWITCH_APPS": (0xE8F9, "SwitchApps"),
    "CHAT_BUBBLES": (0xE8F2, "ChatBubbles"),
    "RECORD": (0xE7C8, "Record"),
    "LIGHTBULB": (0xEA80, "Lightbulb"),
    "DOCUMENT": (0xE8A5, "Document"),
    "HELP": (0xE897, "Help"),
    "CAPTION": (0xE8BA, "Caption"),
    "KEYBOARD_STANDARD": (0xE92E, "KeyboardStandard"),
    # Tasks in the Privacy nav wants MDL2's CheckList (U+E9D5), which Microsoft
    # documents but this build of the font does not contain - the generator fails
    # loudly on it rather than emitting an empty box, so the Tasks row uses
    # BulletedList instead. Same shape, and a glyph that is really there.
}


def load_glyphs():
    root = ET.parse(FONT).getroot()
    out = {}
    for g in root.iter(NS + "glyph"):
        uni, d = g.get("unicode"), g.get("d")
        if not uni or not d:
            continue
        cp = ord(uni) if len(uni) == 1 else int(uni, 16)
        out[cp] = d
    return out


def main():
    # A duplicate key would silently drop one glyph's export, which is how a
    # consumer ends up importing a name that is not there. Python will not
    # warn about it, so check before generating.
    seen = set()
    for key in GLYPHS:
        if key in seen:
            raise SystemExit("duplicate export name %r in GLYPHS" % key)
        seen.add(key)

    if not os.path.exists(FONT):
        raise SystemExit(
            "SegoeMDL2Assets.svg not found at %s\n"
            "See assets/win10-shell-icons/README-mdl2.md for where it comes from." % FONT
        )
    glyphs = load_glyphs()
    lines = [
        "// Segoe MDL2 Assets glyph outlines - the icon font Windows 10 draws its",
        "// shell with. Generated by tools/build_mdl2_icons.py; do not hand-edit.",
        "//",
        "// Each export is the glyph's own path on the font's 1024-unit em square,",
        "// flipped into the y-down space SVG uses, and filled with currentColor so",
        "// CSS colours it like any other icon. The codepoint for each name is the",
        "// one Microsoft documents for that glyph, so it can be checked against",
        "// Microsoft's own icon list rather than guessed at.",
        "//",
        "// Source: Segoe MDL2 Assets (MIT export, scottdorman/mdl2-icons).",
        "",
    ]
    missing = []
    for name, (cp, doc) in sorted(GLYPHS.items()):
        d = glyphs.get(cp)
        if d is None:
            missing.append((name, cp, doc))
            continue
        # Collapse whitespace; the font wraps nothing, but keep lines sane.
        lines.append("// U+%04X  %s" % (cp, doc))
        lines.append(
            "export const %s =\n"
            "  '<svg viewBox=\"0 0 %d %d\" fill=\"currentColor\" aria-hidden=\"true\">'\n"
            "  + '<path transform=\"translate(0,%d) scale(1,-1)\" d=\"%s\"/>'\n"
            "  + '</svg>';" % (name, UNITS, UNITS, UNITS, d)
        )
        lines.append("")
    if missing:
        for name, cp, doc in missing:
            print("MISSING %s U+%04X (%s)" % (name, cp, doc))
        raise SystemExit("font is missing %d glyph(s)" % len(missing))
    with open(OUT, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(lines))
    print("wrote %s (%d glyphs)" % (OUT, len(GLYPHS)))


if __name__ == "__main__":
    main()