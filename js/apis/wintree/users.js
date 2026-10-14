// C:\Users - one folder per account, and the signed-in one is the only part of
// the C: drive a person owns.
//
// The account here is called User, which is the name Explorer's own profile
// folder uses. Its subfolders are the "known folders" Windows creates when the
// account is made: the six that appear in Quick access (Desktop, Downloads,
// Documents, Music, Pictures, Videos) and the rest, which are there whether or
// not anyone ever looks at them - Favorites, Links, Saved Games, Contacts, and
// AppData, which is where a program's own settings live rather than the user's
// documents.
//
// NTUSER.DAT is the account's registry hive: the file Windows loads at sign-in
// to restore settings, and the reason a profile folder is not something to tidy
// away.

export const USER_PROFILE = {
  '3D Objects': {},
  AppData: {
    Local: {
      CrashDumps: {},
      History: {},
      Microsoft: {
        Edge: { 'User Data': { Default: {} } },
        Windows: {
          Explorer: {},
          INetCache: {},
          'WebCache': {}
        }
      },
      Packages: {},
      Temp: {}
    },
    LocalLow: { Microsoft: {} },
    Roaming: { Microsoft: { Windows: { 'Start Menu': { 'Programs': { Startup: {} } } } } }
  },
  Contacts: {},
  Desktop: {},
  Documents: {},
  Downloads: {},
  Favorites: {},
  Links: {},
  Music: {},
  'NTUSER.DAT': 41943040,
  OneDrive: {},
  Pictures: {},
  'Saved Games': {},
  Searches: {},
  Videos: {},
  'desktop.ini': ''
};

export const PUBLIC_PROFILE = {
  Documents: {},
  Downloads: {},
  Music: {},
  Pictures: {},
  'Public Documents': { 'Public Documents': {} },
  Videos: {}
};

// The profile Windows keeps to make a new account from, and the junction that
// old programs still use to find it.
const DEFAULT_PROFILE = {
  AppData: { Local: {}, LocalLow: {}, Roaming: {} },
  Desktop: {},
  Documents: {},
  Downloads: {},
  Favorites: {},
  Links: {},
  Music: {},
  'NTUSER.DAT': 0,
  Pictures: {},
  'Public Documents': {},
  'Saved Games': {},
  Searches: {},
  Templates: {},
  Videos: {}
};

export const USERS = {
  User: USER_PROFILE,
  Public: PUBLIC_PROFILE,
  Default: DEFAULT_PROFILE,
  'Default User': DEFAULT_PROFILE,
  'All Users': {}
};