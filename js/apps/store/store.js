// The Microsoft Store, which does not start.
//
// The taskbar has been pinning a Microsoft Store button since before there was
// an app behind it. Pressing it raises what Windows raises when a program that is
// not there is asked for - which is what the Store is on this computer: nothing
// installed a store, so there is nothing to open.
//
// The path is the real one. The Store is a packaged app rather than an ordinary
// program, so its executable is not on the PATH or in Program Files proper: it
// lives in the protected WindowsApps folder, in a folder named for the package
// and the exact build installed -
//   C:\Program Files\WindowsApps\Microsoft.WindowsStore_<version>_<arch>__8wekyb3d8bbwe\WinStore.App.exe
// (8wekyb3d8bbwe is Microsoft's publisher ID for the Store package, and the
// version below is the one Windows 10 build 2004 shipped.) Which is why asking
// for it by path is exactly the sort of thing that comes back with this error.

var MISSING = 'C:\\Program Files\\WindowsApps\\Microsoft.WindowsStore_12005.1001.1.0_x64__8wekyb3d8bbwe\\WinStore.App.exe';

export function openStore(context) {
  return context.popup({
    title: MISSING,
    glyph: 'error',
    body: [
      "Windows cannot find '" + MISSING + "'.",
      'Make sure you typed the name correctly, and then try again.'
    ],
    buttons: [{ label: 'OK', primary: true, value: 'ok' }]
  });
}