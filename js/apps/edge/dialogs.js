// The dialogs this browser asks for, each one a description handed to the
// shell's popup API rather than a window built here.
//
// They are honest about what a browser with no network and no printer can do:
// the ones that would need hardware or a connection say so, and the one that
// genuinely works - saving a shortcut - actually writes the file.

import { ACCOUNT_NAME } from '../../global/constants.js';

var DESKTOP = 'C:\\Users\\' + ACCOUNT_NAME + '\\Desktop\\';
var DOWNLOADS = 'C:\\Users\\' + ACCOUNT_NAME + '\\Downloads\\';

function clean(name) {
  return String(name).replace(/[\\/:*?"<>|]/g, '-');
}

export function showEssentials(context) {
  return context.popup({
    title: 'Browser essentials',
    heading: 'Browser essentials',
    body: [
      'Essentials are the things Edge keeps ready for you. There is very little of anything to keep ready here:',
      'Favorites kept: none yet.',
      'Passwords saved: none - nothing has been typed into a sign-in.',
      'History: only the pages this browser carries.'
    ],
    buttons: [{ label: 'Close', primary: true, value: 'ok' }]
  });
}

export function showPrint(context) {
  return context.popup({
    title: 'Print',
    heading: 'Print',
    body: [
      'There is no printer installed on this computer.',
      'A page can be printed once a printer is set up, the same as anything else in Windows. Nothing was sent anywhere.'
    ],
    buttons: [
      { label: 'OK', primary: true, value: 'ok' },
      { label: 'Cancel', cancel: true }
    ]
  });
}

export function showScreenshot(context) {
  return context.popup({
    title: 'Screenshot',
    heading: 'Take a screenshot',
    body: [
      'Screenshots need the Print Screen key on a full keyboard.',
      'On a computer with a keyboard, pressing Print Screen copies the screen, and there are shortcuts for the window and the tab you are on. This browser has nothing to capture yet - open something first.'
    ],
    buttons: [{ label: 'Close', primary: true, value: 'ok' }]
  });
}

export function showSaveAs(context, entry) {
  var name = clean(entry.title || 'Page') + '.html';
  return context.popup({
    title: 'Save As',
    heading: 'Save this page as',
    body: 'Saving writes a file you can open later from Explorer.',
    fields: [
      { type: 'text', name: 'name', label: 'File name', value: name },
      {
        type: 'dropdown',
        name: 'where',
        label: 'Save in',
        value: 'Downloads',
        options: [
          { value: 'Downloads', label: 'Downloads' },
          { value: 'Documents', label: 'Documents' },
          { value: 'Desktop', label: 'Desktop' }
        ]
      }
    ],
    buttons: [
      { label: 'Save', primary: true, value: 'save' },
      { label: 'Cancel', cancel: true }
    ]
  }).then(function (answer) {
    if (!answer || answer.value !== 'save') {
      return null;
    }
    var folders = {
      Downloads: DOWNLOADS,
      Documents: 'C:\\Users\\' + ACCOUNT_NAME + '\\Documents\\',
      Desktop: DESKTOP
    };
    var path = (folders[answer.values.where] || DOWNLOADS) + clean(answer.values.name || name);
    return volume().writeFile(path,
      '<!doctype html>\r\n<title>' + entry.title + '</title>\r\n' +
      '<p>Saved from Microsoft Edge: ' + entry.url + '</p>\r\n').then(function () {
      return path;
    });
  });
}

export function showCreateShortcut(context, entry) {
  return context.popup({
    title: 'Create shortcut',
    heading: 'Create a shortcut for this page',
    body: 'A shortcut is a file you can open from the desktop. It points at the page rather than copying it.',
    fields: [
      { type: 'text', name: 'name', label: 'Name', value: entry.title || 'Page' }
    ],
    buttons: [
      { label: 'Create', primary: true, value: 'create' },
      { label: 'Cancel', cancel: true }
    ]
  }).then(function (answer) {
    if (!answer || answer.value !== 'create') {
      return null;
    }
    var path = DESKTOP + clean(answer.values.name || 'Page') + '.url';
    return volume().writeFile(path,
      '[InternetShortcut]\r\nURL=' + entry.url + '\r\n').then(function () {
      return path;
    });
  });
}

export function showClearData(context) {
  return context.popup({
    title: 'Clear browsing data',
    heading: 'Clear browsing data',
    body: [
      'This clears the pages this browser has been to and anything it has kept.',
      'Favorites are left alone. There is nothing else here to forget.'
    ],
    buttons: [
      { label: 'Clear', primary: true, value: 'clear' },
      { label: 'Cancel', cancel: true }
    ]
  });
}

export function showHelp(context) {
  return context.popup({
    title: 'Microsoft Edge',
    heading: 'What this browser can do',
    body: [
      'It opens tabs, keeps the addresses of the pages you have been to, and remembers a few things about you.',
      'It cannot reach the internet from this computer, so every other address ends at the page that says so.',
      'The pages it can show are edge://favorites, edge://history, edge://downloads, edge://settings and edge://about.'
    ],
    buttons: [{ label: 'Close', primary: true, value: 'ok' }]
  });
}

export function showOtherProfiles(context) {
  return context.popup({
    title: 'Other profiles',
    heading: 'Profiles',
    body: [
      'A profile is a separate set of favorites, history and settings for one person.',
      'This browser has one profile, Personal, and it is not signed in to anything. Setting up another needs an account, which needs the internet.'
    ],
    buttons: [{ label: 'Close', primary: true, value: 'ok' }]
  });
}

// The volume is asked for lazily: a browser that never saves anything should
// never open the profile's files.
var volume = null;
export function attachVolume(getVolume) {
  volume = getVolume;
}