import { SYSTEM32, SYSWOW64 } from './system32.js';

// C:\Windows - the folder Windows keeps everything the operating system runs
// from, plus the folders Windows itself was installed into.
//
// The layout here is a Windows 10 installation (the shape build 21343 ships),
// taken from the documented folder lists rather than guessed: the language
// folders (en-US), the servicing folders (WinSxS, SoftwareDistribution,
// servicing, Setup), the ones Windows refuses to let anyone delete (System32,
// SysWOW64, DriverStore) and the many small ones whose names only make sense
// once you know what they are for.
//
// The files at the top are the ones a person actually meets: the ones the Start
// menu, the Run box and the boot files are named after.

// A trimmed copy: the real win.ini runs to several thousand lines of 16-bit
// compatibility tables. What is left here is the shape of it - the header the
// file opens with, and the sections a person can find something in.
const WIN_INI = [
  '; for 16-bit app support',
  '[fonts]',
  '[extensions]',
  '[mci extensions]',
  '[files]',
  ';---- FONT.SYS ----',
  '[386Enh]',
  'woafont=dosapp.fon',
  'EMMExclude=A000-AFFF',
  'EMMInclude=C000-C7FF',
  'Stacks=0,0',
  '[Windows]',
  'LoadTop=1',
  'No80Cols=1',
  'device=*int10',
  'run=winboot',
  'shell=explorer.exe,explorer.exe',
  '[Desktop]',
  'Wallpaper=(None)',
  'TileWallpaper=0',
  'WallpaperStyle=0',
  '[Extensions]',
  'mmsystem=mmcontrol.ocx',
  'mmsysteml=mmcplhlp.ocx',
  'cpl=control.exe',
  '[Internet]',
  'WarningLevel=2',
  'QuerySecurity=0',
  'EnableCredentialCache=1',
  'ProxyEnable=0',
  ''
].join('\r\n');

const SYSTEM_INI = [
  '; for 16-bit app support',
  '[386Enh]',
  'woafont=dosapp.fon',
  'EMMExclude=A000-AFFF',
  'EMMInclude=C000-C7FF',
  'Stacks=0,0',
  '[drivers]',
  ';------ 386 Enhanced Mode Drivers ------',
  ';DEVICE=MVGA',
  ';DEVICE=SVGA',
  '[386Enh.device]',
  'mouse.drv=mouse',
  ''
].join('\r\n');

const BOOT_INI = [
  '[bootloader]',
  'timeout=30',
  'default=multi',
  '[operating systems]',
  'multi=multi /WINDOWS:WINNT',
  ''
].join('\r\n');

export const WINDOWS = {
  Assembly: {
    GAC: {},
    GAC_32: {},
    GAC_MSIL: {},
    MSIL: {}
  },
  Boot: { DFCache: {}, 'en-US': { 'bootmgr.exe.mui': 18702 }, EFI: { font: {} } },
  Cursors: {},
  debug: {},
  DigitalLocker: {},
  Diagnostics: {},
  DiagTrack: {},
  'Downloaded Program Files': {},
  'en-US': {
    'explorer.exe.mui': 10496,
    'notepad.exe.mui': 10240,
    'shell32.dll.mui': 23040
  },
  Fonts: {
    'arial.ttf': 948984,
    'calibri.ttf': 711192,
    'consola.ttf': 423408,
    'cour.ttf': 348056,
    'segoeui.ttf': 966520,
    'tahoma.ttf': 210220,
    'times.ttf': 315428,
    'verdana.ttf': 744920
  },
  Globalization: { 'en-US': { 'en-US': {} } },
  Help: {},
  IME: {},
  // The Settings app is a Store app, and a Store app's own folder is a system
  // folder - which is why this is not under Program Files.
  ImmersiveControlPanel: { 'SystemSettings.exe': 30720 },
  INF: { 'setupapi.dev.log': 43542 },
  InputMethod: {},
  LiveKernelReports: {},
  Logs: { CBS: {}, DISM: {}, MoSetup: {} },
  Media: {},
  'Microsoft.NET': {
    Framework: {
      'v2.0.50727': { 'mscorlib.dll': 4194304, 'System.dll': 2310144 },
      'v4.0.30319': { 'clr.dll': 8784128, 'mscorlib.dll': 4666368, 'System.dll': 11599872 }
    }
  },
  Minidump: {},
  ModemLogs: {},
  OCR: {},
  'Offline Web Pages': {},
  Panther: {},
  Performance: { 'WinSAT DataFormal Assessment.dat': 19589 },
  PLA: { Logs: {}, Reports: {} },
  PolicyDefinitions: {},
  Prefetch: {},
  PrintDialog: {},
  Provisioning: {},
  Registration: {},
  rescache: {},
  Resources: {
    'Ease of Access Themes': {},
    Themes: { 'aero.msstyles': 137010 }
  },
  SchCache: {},
  security: {},
  ServiceProfiles: { LocalService: {}, NetworkService: {} },
  ServiceState: {},
  servicing: { Packages: {} },
  Setup: { Scripts: {} },
  ShellComponents: {},
  ShellExperiences: {},
  SoftwareDistribution: { Download: {}, PostRebootEventCacheV2: {} },
  Speech: {},
  Speech_OneCore: {},
  System32: SYSTEM32,
  SystemApps: {
    'Microsoft.Windows.Cortana_cw5n1h2txyewy': { 'Cortana.UI.exe': 967680 },
    'Microsoft.Windows.ShellExperienceHost_cw5n1h2txyewy': { 'ShellExperienceHost.exe': 968704 },
    'Microsoft.WindowsCalculator_8wekyb3d8bbwe': { 'Calculator.App.exe': 592384 },
    'Microsoft.Windows.SecHealthUI_cw5n1h2txyewy': { 'SecurityHealthUIBroker.exe': 258048 }
  },
  SystemResources: {},
  SystemTemp: {},
  SysWOW64: SYSWOW64,
  Tasks: {},
  Temp: {},
  TextInput: {},
  tracing: {},
  twain_32: {},
  twain_64: {},
  WaaS: {},
  Web: {},
  WebManagement: {},
  WinSxS: {},
  WUModels: {},

  // ---- the files a person meets ----
  // boot.ini is read by the boot manager, the way bootmgr is.
  'boot.ini': BOOT_INI,
  'explorer.exe': 4849664,
  'hiberfil.sys': 3221225472,
  ntldr: 292768,
  'pagefile.sys': 2147483648,
  'swapfile.sys': 16777216,
  'system.ini': SYSTEM_INI,
  'win.ini': WIN_INI,
  'winload.exe': 133216,
  'notepad.exe': 201216,
  'regedit.exe': 372736,
  'setup.exe': 158208,
  'taskmgr.exe': 223232,
  'winver.exe': 97280,
  'write.exe': 102400,
  'wscript.exe': 95232,
  'cscript.exe': 96256,
  'hh.exe': 53248
};