import { WINDOWS } from './windows.js';
import { PROGRAM_FILES, PROGRAM_FILES_X86, PROGRAM_DATA } from './programs.js';
import { USERS, USER_PROFILE, PUBLIC_PROFILE } from './users.js';

// The root of the emulated C: drive.
//
// This is what a freshly installed Windows 10 machine looks like from the top:
// the boot files the firmware needs, the folders Windows refuses to be without,
// and the drive's own bookkeeping. The listing follows the machine a Windows 10
// install actually makes rather than a tidy ideal - Recovery, System Volume
// Information, Config.Msi and MSOCache are all here because they are all on real
// machines, and so are Intel, inetpub and the odd MSI folder, because those are
// what drivers and installers leave behind.
//
// Nothing in this table (or in the tables it pulls in) is stored: it is read as
// data and never written anywhere. See tree.js for the notation and ntfs.js for
// how it sits over the real disk.

export const ROOT = {
  '$Recycle.Bin': {
    'S-1-5-21-1964531255-1331432381-3380043568-1013': {}
  },
  '$WinREAgent': {},
  Boot: {
    DFCache: {},
    'en-US': { 'bootmgr.exe.mui': 18702 },
    EFI: { font: {} }
  },
  'Config.Msi': {},
  'Documents and Settings': {},
  EFI: { Microsoft: { Boot: { 'bootmgfw.efi': 1397736 } } },
  inetpub: { logs: {} },
  Intel: {},
  MSOCache: {},
  PerfLogs: {},
  'Program Files': PROGRAM_FILES,
  'Program Files (x86)': PROGRAM_FILES_X86,
  ProgramData: PROGRAM_DATA,
  Recovery: { 'Winre.wim': 141148160 },
  'System Volume Information': {},
  Users: USERS,
  Windows: WINDOWS,

  // Boot files. The firmware reads bootmgr before anything Windows does, which
  // is why they sit at the root rather than in the Windows folder.
  BOOTNXT: 8589934592,
  'DumpStack.log.tmp': 12288,
  bootmgr: 385048,
  'hiberfil.sys': 3221225472,
  'pagefile.sys': 2147483648,
  'swapfile.sys': 16777216
};

// The signed-in account, named once so the places that spell it out (the tree
// and Explorer) agree.
export { USER_PROFILE, PUBLIC_PROFILE };