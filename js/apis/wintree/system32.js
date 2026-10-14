// C:\Windows\System32 and C:\Windows\SysWOW64.
//
// System32 holds the programs and libraries Windows is made of, and it is the
// folder Windows protects hardest: everything in it is loaded during boot or
// belongs to a running service, so deleting any of it is refused rather than
// merely unwise. SysWOW64 is the same library for 32-bit programs - the name
// means System Windows on Windows 64, which is the whole joke the folder is
// named for - so it carries the same programs with the same names.
//
// Only the programs a person will actually meet by name are listed. A real
// System32 holds several thousand files, none of which is stored here: these are
// names to browse, and every one of them is refused a delete.

const SYSTEM32_FILES = {
  'attrib.exe': 11264,
  'bcdboot.exe': 293376,
  'bcdedit.exe': 172032,
  'bootcfg.exe': 29184,
  'calc.exe': 10752,
  'cleanmgr.exe': 677888,
  'cmd.exe': 289792,
  'cmstp.exe': 155136,
  'cscript.exe': 96256,
  'diskpart.exe': 576512,
  'dllhost.exe': 11264,
  'driverquery.exe': 66560,
  'dxdiag.exe': 1081344,
  'eventcreate.exe': 64512,
  'expand.exe': 126976,
  'fsutil.exe': 219136,
  'gpupdate.exe': 626688,
  'hostname.exe': 36928,
  'icacls.exe': 163840,
  'ipconfig.exe': 100352,
  'lsass.exe': 62464,
  'magnify.exe': 151040,
  'mstsc.exe': 615936,
  'msconfig.exe': 564224,
  'msdt.exe': 397312,
  'mshta.exe': 61440,
  'msiexec.exe': 646656,
  'narrator.exe': 130048,
  'nbtstat.exe': 40960,
  'netsh.exe': 263168,
  'netstat.exe': 45056,
  'ntdll.dll': 1755136,
  'odbcad32.exe': 176128,
  'openfiles.exe': 73216,
  'osk.exe': 211968,
  'ping.exe': 43008,
  'powercfg.exe': 151552,
  'reg.exe': 62464,
  'regsvr32.exe': 70144,
  'robocopy.exe': 297984,
  'rundll32.exe': 45312,
  'schtasks.exe': 175104,
  'sc.exe': 101376,
  'services.exe': 96128,
  'sfc.exe': 147456,
  'shutdown.exe': 89088,
  'smss.exe': 118784,
  'snippingtool.exe': 1893888,
  'spoolsv.exe': 56320,
  'sfc_os.dll': 2646016,
  'taskhostw.exe': 39424,
  'taskkill.exe': 77696,
  'tasklist.exe': 80512,
  'timedate.cpl': 101376,
  'tracert.exe': 47104,
  'tskill.exe': 33280,
  'verclsid.exe': 40960,
  'verifier.exe': 439296,
  'waitfor.exe': 379904,
  'where.exe': 39744,
  'whoami.exe': 45056,
  'winhlp32.exe': 295936,
  'wininit.exe': 60928,
  'winmm.dll': 404480,
  'winsat.exe': 66048,
  'wmic.exe': 1223680,
  'wscript.exe': 95232,
  'write.exe': 102400,
  'xcopy.exe': 160256,
  // The libraries Windows is itself written against. These four names are the
  // ones every Windows developer learns first, which is why they are here.
  'kernel32.dll': 732672,
  'ntdll.dll': 1904128,
  'user32.dll': 8126464,
  'gdi32.dll': 1037312,
  'advapi32.dll': 1024000,
  'shell32.dll': 1152528,
  'ole32.dll': 230912,
  'oleaut32.dll': 1249280,
  'comctl32.dll': 604672,
  'comdlg32.dll': 355328,
  'msvcrt.dll': 91304,
  'wininet.dll': 3083264,
  'ws2_32.dll': 398848,
  'shlwapi.dll': 717312,
  'psapi.dll': 25088,
  'version.dll': 18944,
  'crypt32.dll': 1573376,
  'wintrust.dll': 346112,
  'ucrtbase.dll': 861600
};

// The hosts file is the one system file a person is encouraged to open and
// read, so it carries its real content: Microsoft's own comment block, with the
// lines that would name a machine switched off at the bottom.
const HOSTS = [
  '# Copyright (c) 1993-2009 Microsoft Corp.',
  '#',
  '# This is a sample HOSTS file used by Microsoft TCP/IP for Windows.',
  '#',
  '# This file contains the mappings of IP addresses to host names. Each',
  '# entry should be kept on an individual line. The IP address should',
  '# be placed in the first column followed by the corresponding host name.',
  '# The IP address and the host name should be separated by at least one',
  '# space.',
  '#',
  '# Additionally, comments (such as these) may be inserted on individual',
  '# lines or following the machine name denoted by a # symbol.',
  '#',
  '# For example:',
  '#',
  '#      102.54.94.97     rhino.acme.com          # source server',
  '#       38.25.63.10     x.acme.com              # x client host',
  '',
  '# localhost name resolution is handled within DNS itself.',
  '#	127.0.0.1       localhost',
  '#	::1             localhost',
  ''
].join('\r\n');

// Win10 ships these four beside the hosts file, in the same folder, for the
// same reason: they are the other half of how name resolution is configured.
const ETC = {
  hosts: HOSTS,
  'lmhosts.sam': '',
  networks: '',
  protocols: '',
  services: ''
};

export const SYSTEM32 = {
  ...SYSTEM32_FILES,
  CatRoot: {},
  CatRoot2: {},
  CodeIntegrity: {},
  Com: {},
  // The registry hives, as files. Windows has already copied these back from
  // disk by the time anyone can browse them, which is why they are readable
  // here and not refused like the executables beside them.
  config: {
    DEFAULT: 40960,
    SAM: 49152,
    SECURITY: 196608,
    SOFTWARE: 41287680,
    SYSTEM: 33554432
  },
  drivers: {
    etc: ETC,
    'usb': {},
    'Class': {},
    'FileSystem': {},
    'Printer': {},
    'Video': {}
  },
  DriverStore: {},
  'en-US': {},
  F12: { 'IEFrame.dll': 0, 'start.htm': 0 },
  GroupPolicy: {},
  IME: {},
  inetsrv: {},
  Licenses: {},
  LogFiles: { WMI: {} },
  MRT: {},
  MUI: {},
  networklist: {},
  oobe: {},
  OpenSSH: { 'ssh.exe': 966656, 'sshd.exe': 890880 },
  Policies: {},
  spool: { PRINTERS: {} },
  Tasks: {},
  wbem: {},
  WindowsPowerShell: {
    'v1.0': {
      'powershell.exe': 609280,
      'powershell_ise.exe': 96768,
      Modules: {}
    }
  },
  winevt: { Logs: {} }
};

// 32-bit programs run against the same names in SysWOW64, which is why the two
// folders are the same table with the same keys.
export const SYSWOW64 = { ...SYSTEM32_FILES, drivers: { etc: ETC }, config: {}, wbem: {} };