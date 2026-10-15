// The Personalisation category: how Windows looks.
//
// Background, Colors, Lock screen, Themes, Fonts, Start and Taskbar. The Start
// page is the one with settings the shell already keeps elsewhere: "Show app list
// in Start menu" is not a second copy of that choice, it is the same choice, and
// its item says so with a bridge - see shell.js.

export var BACKGROUND = {
  id: 'background',
  title: 'Background',
  glyph: 'background',
  groups: [
    {
      id: 'preview',
      title: 'Background',
      items: [
        { kind: 'backgroundPreview', label: 'Background preview' }
      ]
    },
    {
      id: 'kind',
      title: 'Background',
      items: [
        {
          kind: 'select',
          key: 'personalisation.background.kind',
          label: 'Background',
          default: 'Picture',
          options: [
            { value: 'Picture', label: 'Picture' },
            { value: 'Solid colour', label: 'Solid colour' },
            { value: 'Slideshow', label: 'Slideshow' }
          ]
        }
      ]
    },
    {
      id: 'picture',
      title: 'Choose your picture',
      items: [
        { kind: 'backgroundPicker', key: 'personalisation.background.picture', label: 'Choose your picture', default: 'img0.jpg' },
        { kind: 'button', label: 'Browse', action: 'personalisation.background.browse' }
      ]
    },
    {
      id: 'colour',
      title: 'Choose a solid colour',
      items: [
        { kind: 'colourPicker', key: 'personalisation.background.colour', label: 'Choose a solid colour', default: '0078d7' }
      ]
    },
    {
      id: 'fit',
      title: 'Choose a fit',
      items: [
        {
          kind: 'select',
          key: 'personalisation.background.fit',
          label: 'Choose a fit',
          default: 'Fill',
          options: [
            { value: 'Fill', label: 'Fill' },
            { value: 'Fit', label: 'Fit' },
            { value: 'Stretch', label: 'Stretch' },
            { value: 'Tile', label: 'Tile' },
            { value: 'Center', label: 'Center' }
          ]
        }
      ]
    },
    {
      id: 'related',
      title: 'Related Settings',
      items: [
        { kind: 'link', label: 'High contrast settings', to: 'easeContrast' }
      ]
    }
  ]
};

export var COLORS = {
  id: 'colors',
  title: 'Colors',
  glyph: 'colors',
  groups: [
    {
      id: 'choose',
      title: 'Choose your colour',
      items: [
        {
          kind: 'select',
          key: 'personalisation.colors.mode',
          label: 'Choose your colour',
          default: 'Windows colours',
          options: [
            { value: 'Windows colours', label: 'Windows colours' },
            { value: 'Custom colours', label: 'Custom colours' }
          ]
        },
        {
          kind: 'select',
          key: 'personalisation.colors.accent',
          label: 'Choose accent colour',
          default: 'Windows blue',
          options: [
            { value: 'Windows blue', label: 'Windows blue' },
            { value: 'Windows teal', label: 'Windows teal' },
            { value: 'Windows green', label: 'Windows green' },
            { value: 'Windows orange', label: 'Windows orange' },
            { value: 'Windows red', label: 'Windows red' },
            { value: 'Windows purple', label: 'Windows purple' }
          ]
        },
        {
          kind: 'toggle',
          key: 'personalisation.colors.transparent',
          label: 'Choose transparent or solid colour',
          default: false
        }
      ]
    },
    {
      id: 'preview',
      title: 'Current colours',
      items: [
        { kind: 'swatches', key: 'personalisation.colors.accentSwatch', label: 'Accent colour preview' }
      ]
    },
    {
      id: 'choosewhere',
      title: 'Choose where you want to see the accent colour',
      items: [
        {
          kind: 'checkbox',
          key: 'personalisation.colourOn.start',
          label: 'Start and taskbar',
          default: true
        },
        {
          kind: 'checkbox',
          key: 'personalisation.colourOn.actionCentre',
          label: 'Action Centre and notification area',
          default: false
        },
        {
          kind: 'checkbox',
          key: 'personalisation.colourOn.lockScreen',
          label: 'Lock screen and sign-in screen',
          default: false
        },
        {
          kind: 'checkbox',
          key: 'personalisation.colourOn.titlebars',
          label: 'Title bars and window borders',
          default: false
        }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'High contrast settings', to: 'easeContrast' },
        { kind: 'link', label: 'Transparency', to: 'easeNarration' }
      ]
    }
  ]
};

export var LOCK_SCREEN = {
  id: 'lockscreen',
  title: 'Lock screen',
  glyph: 'lockScreen',
  groups: [
    {
      id: 'preview',
      title: 'Background',
      items: [
        { kind: 'lockPreview', label: 'Lock screen preview' }
      ]
    },
    {
      id: 'background',
      title: 'Background',
      items: [
        {
          kind: 'select',
          key: 'personalisation.lock.kind',
          label: 'Background',
          default: 'Windows spotlight',
          options: [
            { value: 'Windows spotlight', label: 'Windows spotlight' },
            { value: 'Picture', label: 'Picture' },
            { value: 'Slideshow', label: 'Slideshow' }
          ]
        },
        { kind: 'button', label: 'Browse', action: 'personalisation.lock.browse' }
      ]
    },
    {
      id: 'detail',
      title: 'Choose one app to show detailed status on the lock screen',
      items: [
        {
          kind: 'select',
          key: 'personalisation.lock.detailApp',
          label: 'Detailed status app',
          default: 'None',
          options: [
            { value: 'None', label: 'None' },
            { value: 'Microsoft Edge', label: 'Microsoft Edge' },
            { value: 'Mail', label: 'Mail' },
            { value: 'Weather', label: 'Weather' }
          ]
        }
      ]
    },
    {
      id: 'quick',
      title: 'Choose which apps show quick status on the lock screen',
      items: [
        { kind: 'lockStatusApps', keyPrefix: 'personalisation.lock.quickApps', label: 'Apps showing quick status' }
      ]
    },
    {
      id: 'signin',
      title: 'Sign-in options',
      items: [
        {
          kind: 'toggle',
          key: 'personalisation.lock.onSignIn',
          label: 'Show lock screen background picture on the sign-in screen',
          default: true
        }
      ]
    },
    {
      id: 'links',
      title: 'Cortana lock screen settings / Screen timeout settings / Screen saver settings',
      items: [
        { kind: 'link', label: 'Screen timeout settings', to: 'power' },
        { kind: 'link', label: 'Screen saver settings', action: 'personalisation.lock.screensaver' }
      ]
    }
  ]
};

export var THEMES = {
  id: 'themes',
  title: 'Themes',
  glyph: 'themes',
  groups: [
    {
      id: 'themes',
      title: 'Themes',
      items: [
        { kind: 'themePreview', label: 'Themes' },
        { kind: 'button', label: 'Browse for more themes online', action: 'themes.browse' }
      ]
    },
    {
      id: 'settings',
      title: 'Related settings',
      items: [
        {
          kind: 'select',
          key: 'personalisation.theme.desktopIconSize',
          label: 'Desktop icon size',
          default: 'Medium icons',
          options: [
            { value: 'Small icons', label: 'Small icons' },
            { value: 'Medium icons', label: 'Medium icons' },
            { value: 'Large icons', label: 'Large icons' }
          ]
        },
        { kind: 'toggle', key: 'personalisation.theme.desktopIcons', label: 'Show desktop icons', default: true },
        { kind: 'button', label: 'Theme settings', action: 'themes.settings' }
      ]
    }
  ]
};

export var FONTS = {
  id: 'fonts',
  title: 'Fonts',
  glyph: 'fonts',
  groups: [
    {
      id: 'fontsscaling',
      title: 'Font scaling',
      items: [
        { kind: 'note', text: 'Fonts are not installed on this computer.' }
      ]
    },
    {
      id: 'typography',
      title: 'Typography',
      items: [
        {
          kind: 'link',
          label: 'Adjust ClearType text',
          action: 'fonts.cleartype'
        },
        {
          kind: 'link',
          label: 'Language options',
          to: 'languageRegion'
        }
      ]
    }
  ]
};

export var START = {
  id: 'start',
  title: 'Start',
  glyph: 'start',
  groups: [
    {
      id: 'start',
      title: 'Start',
      items: [
        { kind: 'toggle', key: 'personalisation.start.showMoreTiles', label: 'Show more tiles on Start', default: false },
        // The shell already keeps this choice, in startstate.js, and the Start
        // menu reads it on every open. The bridge is what stops this page from
        // becoming a second, contradicting copy of it.
        { kind: 'toggle', key: 'personalisation.start.showAppList', label: 'Show app list in Start menu', default: true, bridge: 'startShowAppList' },
        { kind: 'toggle', key: 'personalisation.start.showRecentlyAdded', label: 'Show recently added apps', default: true },
        { kind: 'toggle', key: 'personalisation.start.showMostUsed', label: 'Show most used apps', default: false },
        { kind: 'toggle', key: 'personalisation.start.showSuggestions', label: 'Show suggestions occasionally in Start', default: true },
        { kind: 'toggle', key: 'personalisation.start.useFullScreen', label: 'Use Start full screen', default: false },
        {
          kind: 'toggle',
          key: 'personalisation.start.showJumpLists',
          label: 'Show recently opened items in Jump Lists on Start or the taskbar and in File Explorer Quick Access',
          default: true
        }
      ]
    },
    {
      id: 'folders',
      title: 'Folders',
      items: [
        { kind: 'link', label: 'Choose which folders appear on Start', action: 'personalisation.start.folders' }
      ]
    },
    {
      id: 'feedback',
      title: 'Talk to us',
      items: [
        { kind: 'button', label: 'Get help', action: 'help.get' },
        { kind: 'button', label: 'Give feedback', action: 'help.feedback' }
      ]
    }
  ]
};

export var TASKBAR = {
  id: 'taskbar',
  title: 'Taskbar',
  glyph: 'taskbar',
  groups: [
    {
      id: 'taskbaritems',
      title: 'Taskbar items',
      items: [
        {
          kind: 'select',
          key: 'personalisation.taskbar.where',
          label: 'Taskbar location on screen:',
          default: 'Bottom',
          options: [
            { value: 'Bottom', label: 'Bottom' },
            { value: 'Left', label: 'Left' },
            { value: 'Right', label: 'Right' },
            { value: 'Top', label: 'Top' }
          ]
        },
        {
          kind: 'select',
          key: 'personalisation.taskbar.whichIcons',
          label: 'Select which taskbar icons appear on the taskbar (⌘ + click to select multiple).',
          default: 'All',
          options: [
            { value: 'All', label: 'All' },
            { value: 'Main', label: 'Main' },
            { value: 'None', label: 'None' },
            { value: 'System', label: 'System' }
          ]
        }
      ]
    },
    {
      id: 'combine',
      title: 'Combine taskbar buttons, show labels',
      items: [
        {
          kind: 'select',
          key: 'personalisation.taskbar.combine',
          label: 'Combine taskbar buttons, show labels',
          default: 'When taskbar is full',
          options: [
            { value: 'Never', label: 'Never' },
            { value: 'When taskbar is full', label: 'When taskbar is full' },
            { value: 'Always', label: 'Always' }
          ]
        },
        {
          kind: 'toggle',
          key: 'personalisation.taskbar.showLabels',
          label: 'Show taskbar button labels',
          default: false
        }
      ]
    },
    {
      id: 'appearance',
      title: 'Taskbar appearance',
      items: [
        { kind: 'toggle', key: 'personalisation.taskbar.autoHide', label: 'Automatically hide the taskbar', default: false },
        { kind: 'toggle', key: 'personalisation.taskbar.locked', label: 'Lock the taskbar', default: true },
        { kind: 'toggle', key: 'personalisation.taskbar.smallIcons', label: 'Use small icons in the taskbar button', default: false },
        { kind: 'toggle', key: 'personalisation.taskbar.showButtons', label: 'Show taskbar buttons on: All taskbars', default: false }
      ]
    },
    {
      id: 'jump',
      title: 'Jump Lists',
      items: [
        {
          kind: 'toggle',
          key: 'personalisation.taskbar.jumpLists',
          label: 'Show Jump Lists on the Start or the taskbar',
          default: true
        },
        {
          kind: 'toggle',
          key: 'personalisation.taskbar.jumpListRecent',
          label: 'Show recently opened items in Jump Lists',
          default: true
        },
        { kind: 'toggle', key: 'personalisation.taskbar.jumpListFrequent', label: 'Show most used items in Jump Lists', default: true }
      ]
    },
    {
      id: 'people',
      title: 'People',
      items: [
        { kind: 'toggle', key: 'personalisation.taskbar.showPeople', label: 'Show People button on taskbar', default: false }
      ]
    }
  ]
};

export var PERSONALISATION = {
  id: 'personalisation',
  title: 'Personalisation',
  blurb: 'Background, lock screen, colours',
  glyph: 'personalisation',
  pages: [
    BACKGROUND,
    COLORS,
    LOCK_SCREEN,
    THEMES,
    FONTS,
    START,
    TASKBAR
  ]
};