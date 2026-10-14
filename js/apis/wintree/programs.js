// C:\Program Files, C:\Program Files (x86) and C:\ProgramData.
//
// The two Program Files folders are the 64-bit and 32-bit halves of the same
// idea, and that is the only reason both exist: a 64-bit program and a 32-bit
// program cannot both live in the same folder, because each expects its own
// libraries at the same relative path. (x86) on a 64-bit machine is where the
// 32-bit half goes - which is why Edge, a 64-bit program that ships 32-bit
// components, is found under it rather than in Program Files proper.
//
// ProgramData is what is left once "shared between all users" stops meaning
// "a folder every user can see". Windows puts it there, so it is here too.

const COMMON_FILES = {
  'InstallShield': {},
  'Merge Modules': {},
  Microsoft: {
    Shared: {
      'ClickToRun': {},
      'Office': {},
      'Windows Photo Viewer': {},
      'Windows Search': {}
    }
  },
  Services: {},
  'SpeechEngine': {},
  SSL: {},
  System: {}
};

export const PROGRAM_FILES = {
  'Common Files': COMMON_FILES,
  dotnet: { shared: {} },
  'Internet Explorer': { 'Application': {} },
  Microsoft: {
    Edge: {
      'Application': { '92.0.902.55': { 'msedge.exe': 2800128 } },
      Dev: {},
      Install: {},
      'WebView': {}
    },
    EdgeCore: { '92.0.902.55': { 'msedgecore.dll': 18358784 } },
    EdgeUpdate: { '92.0.902.55': { 'MicrosoftEdgeUpdate.exe': 172032 } },
    EdgeWebView: { '92.0.902.55': { 'msedgewebview2.exe': 1781952 } },
    OneDrive: { '19.121.0522.0': { 'OneDrive.exe': 1943552 } },
    'Update Health Tools': {}
  },
  'Microsoft.NET': { Framework: {}, 'Native Images': {} },
  MSBuild: { Current: { Bin: { Roslyn: {} } } },
  'Reference Assemblies': { 'Microsoft Framework': { 'v4.8': {} } },
  // WindowsApps is the one folder here a person should never try to edit: it is
  // what protects a Store app from being tampered with, and it is why the
  // Store's own program - the one this computer does not have - would live here.
  WindowsApps: {
    'DesktopAppInstaller_8wekyb3d8bbwe': {},
    'Microsoft.MicrosoftEdge_8wekyb3d8bbwe': {},
    'Microsoft.VCLibs.140.00_8wekyb3d8bbwe': {},
    'Microsoft.UI.Xaml.2.7_8wekyb3d8bbwe': {},
    'Microsoft.WindowsCalculator_8wekyb3d8bbwe': {},
    'Microsoft.Windows.ShellExperienceHost_cw5n1h2txyewy': {},
    'Microsoft.Xna_8wekyb3d8bbwe': {}
  },
  'Windows Defender': {
    'MpCmdRun.exe': 55808,
    'Platform': {},
    'Quarantine': {},
    'Scans': { History: { 'Results': {} } }
  },
  'Windows Media Player': { 'wmplayer.exe': 336384 },
  // The programs that ship with Windows and are started by name - Calculator,
  // Paint, Notepad, Sticky Notes, Character Map - are installed here rather
  // than copied out of the Windows folder.
  'Windows NT': { Accessories: {} },
  'Windows Photo Viewer': { 'PhotoAcquisition.exe': 176128 },
  'Windows Portable Devices': {},
  'Windows Side-by-Side': {},
  WindowsPowerShell: { Modules: {} },
  'Uninstall Information': {},
  'desktop.ini': ''
};

export const PROGRAM_FILES_X86 = {
  Accessibility: {},
  'Common Files': COMMON_FILES,
  GAC_32: {},
  GAC_MSIL: {},
  'Internet Explorer': { 'Application': {}, 'iehome.exe': 41984 },
  // A 64-bit Edge ships its 32-bit half here, which is why this is the folder
  // to look in for msedge.exe on a fresh Windows 10 machine.
  Microsoft: {
    Edge: {
      'Application': { '92.0.902.55': { 'msedge.exe': 2800128 } },
      Dev: {},
      Install: {}
    },
    OneDrive: {},
    'Windows Search': {}
  },
  'Windows Media Player': {},
  'Windows NT': { Accessory: {} },
  'desktop.ini': ''
};

export const PROGRAM_DATA = {
  BlueLight: {},
  DeviceSearch: {},
  Microsoft: {
    'AppInstaller': {},
    Cryptography: { Keys: { Account: {} } },
    Defender: {
      'Definition Updates': {},
      Quarantine: {},
      Scans: { History: { Results: {} } }
    },
    'Help and Support': {},
    Search: { Data: { Applications: {}, ApplicationsWindows: {} } },
    Windows: {
      'AppRepository': {},
      'Explorer': { IconCache: {} },
      'Start Menu': { 'Programs': { 'Startup': {} } },
      'WER': { ReportArchive: {}, ReportQueue: {} }
    }
  },
  'Microsoft Search': { Data: { Applications: {} } },
  'Package Cache': {},
  Packages: {},
  // The folder named after this computer, which every install writes its own
  // log and its shared settings into.
  'User-S-1-5-21-1964531255-1331432381-3380043568-1013': {
    'AppData': {},
    'Local': { 'Google': {} },
    'Roaming': {}
  }
};