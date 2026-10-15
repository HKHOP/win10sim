// The Personalisation category: how Windows looks.
//
// Background, Colors, Lock screen, Themes, Fonts, Start and Taskbar. The Start
// page is the one with settings the shell already keeps elsewhere: "Show app list
// in Start menu" is not a second copy of that choice, it is the same choice, and
// its item says so with a bridge - see shell.js.

// Background. One page for all three kinds of background, with the rows that
// belong to the chosen kind drawn in and the rest out - which is what Windows
// does: pick "Slideshow" and "Change picture every" and "Shuffle" appear where
// they had not been.
//
// The preview, the drop-down and the two links below it are the page. The rest
// belongs to a kind, and saying which kind a row belongs to is the whole of what
// makes this page correct rather than a list of settings that do not apply.
export var BACKGROUND = {
  id: 'background',
  title: 'Background',
  glyph: 'background',
  groups: [
    {
      id: 'preview',
      items: [
        { kind: 'backgroundPreview', label: 'Background preview' }
      ]
    },
    {
      id: 'kind',
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
      when: { key: 'personalisation.background.kind', is: 'Picture' },
      items: [
        { kind: 'backgroundPicker', key: 'personalisation.background.picture', label: 'Choose your picture', default: 'img0.jpg' },
        { kind: 'button', label: 'Browse', action: 'personalisation.background.browse' }
      ]
    },
    {
      id: 'colour',
      when: { key: 'personalisation.background.kind', is: 'Solid colour' },
      items: [
        { kind: 'colourPicker', key: 'personalisation.background.colour', label: 'Choose a solid colour', default: '0078d7' }
      ]
    },
    {
      id: 'slideshow',
      when: { key: 'personalisation.background.kind', is: 'Slideshow' },
      items: [
        { kind: 'albumPicker', label: 'Choose albums for your slideshow', default: 'pictures' },
        { kind: 'button', label: 'Browse', action: 'personalisation.background.browseAlbum' },
        {
          kind: 'select',
          key: 'personalisation.background.slideshowInterval',
          label: 'Change picture every',
          default: '30 minutes',
          options: [
            { value: '5 seconds', label: '5 seconds' },
            { value: '15 seconds', label: '15 seconds' },
            { value: '30 seconds', label: '30 seconds' },
            { value: '1 minute', label: '1 minute' },
            { value: '5 minutes', label: '5 minutes' },
            { value: '15 minutes', label: '15 minutes' },
            { value: '30 minutes', label: '30 minutes' },
            { value: '1 hour', label: '1 hour' }
          ]
        },
        { kind: 'toggle', key: 'personalisation.background.shuffle', label: 'Shuffle', default: false }
      ]
    },
    {
      id: 'fit',
      when: { key: 'personalisation.background.kind', is: 'Picture' },
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
    }
  ],
  rail: [
    {
      title: 'Related Settings',
      links: [
        { label: 'High contrast settings', to: 'easeContrast' },
        { label: 'Sync your settings', to: 'syncSettings' }
      ]
    },
    {
      title: 'Have a question?',
      links: [
        { label: 'Changing my desktop background', action: 'background.help.change' },
        { label: 'Finding new themes', to: 'themes' },
        { label: 'Showing desktop icons', action: 'background.help.icons' }
      ]
    }
  ]
};

// Colors. The order is Windows': the preview, the two switches, then the accent
// colour as a gallery - recent colours first, then the Windows palette - and
// then "Choose where you want to see the accent colour".
//
// The gallery is a real kind rather than a list of boxes because the page has two
// of them with different contents and different rules: Recent colours is what
// you have picked, Windows colours is the palette, and the second is a fixed
// table while the first is whatever the store has seen. Declaring one gallery
// with two groups of cells would have made the second one look like history.
export var COLORS = {
  id: 'colors',
  title: 'Colors',
  glyph: 'colors',
  groups: [
    {
      id: 'preview',
      items: [
        { kind: 'colorsPreview', label: 'Colors preview' }
      ]
    },
    {
      id: 'choose',
      items: [
        {
          kind: 'select',
          key: 'personalisation.colors.mode',
          label: 'Choose your color',
          default: 'Light',
          options: [
            { value: 'Light', label: 'Light' },
            { value: 'Custom', label: 'Custom' }
          ]
        },
        {
          kind: 'toggle',
          key: 'personalisation.colors.transparent',
          label: 'Transparency effects',
          default: true
        }
      ]
    },
    {
      id: 'accent',
      title: 'Choose your accent color',
      items: [
        {
          kind: 'checkbox',
          key: 'personalisation.colors.fromWallpaper',
          label: 'Automatically pick an accent color from my background',
          default: false
        }
      ]
    },
    {
      id: 'recent',
      title: 'Recent colors',
      items: [
        { kind: 'colourRow', key: 'personalisation.colors.accent', label: 'Recent colors', group: 'recent' }
      ]
    },
    {
      id: 'windows',
      title: 'Windows colors',
      items: [
        { kind: 'colourRow', key: 'personalisation.colors.accent', label: 'Windows colors', group: 'windows' }
      ]
    },
    {
      id: 'where',
      title: 'Choose where you want to see the accent color',
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
          label: 'Action Center and notification area',
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
    }
  ],
  rail: [
    {
      title: 'Related Settings',
      links: [
        { label: 'High contrast settings', to: 'easeContrast' },
        { label: 'Sync your settings', to: 'syncSettings' }
      ]
    },
    {
      title: 'Help from the web',
      text: null,
      links: [
        { label: 'Changing desktop or background colors', action: 'colors.help.background' },
        { label: 'Changing taskbar color', action: 'colors.help.taskbar' }
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

// Themes. The page is a picture of the theme and a list of what it is made of,
// then the gallery.
//
// "Current theme: Custom" is plain text, not a heading and not a control: it is
// a statement about what is installed. The list beside the picture is four rows
// of mark, name and value, and each value is the answer from another page - which
// is why they are read from the store rather than written here.
export var THEMES = {
  id: 'themes',
  title: 'Themes',
  glyph: 'themes',
  groups: [
    {
      id: 'current',
      items: [
        { kind: 'text', text: 'Current theme: Custom' }
      ]
    },
    {
      id: 'preview',
      items: [
        { kind: 'themePreview', label: 'Themes' }
      ]
    },
    {
      id: 'save',
      items: [
        { kind: 'button', label: 'Save theme', action: 'themes.save' }
      ]
    },
    {
      id: 'change',
      title: 'Change theme',
      items: [
        { kind: 'link', label: 'Get more themes in Microsoft Store', action: 'themes.store', icon: 'store' },
        { kind: 'themeGallery', key: 'personalisation.theme.current', label: 'Themes' }
      ]
    }
  ],
  rail: [
    {
      title: 'Get more personality in Windows',
      text: 'Download free themes from the Microsoft Store that combine wallpapers, sounds, and colors.'
    },
    {
      title: 'Related Settings',
      links: [
        { label: 'Desktop icon settings', to: 'desktopIcons' },
        { label: 'High contrast settings', to: 'easeContrast' },
        { label: 'Sync your settings', to: 'syncSettings' }
      ]
    }
  ]
};

// Desktop icon settings. Windows reaches this page from Themes' rail and from
// the desktop's own right-click menu, and does not give it a row in the nav pane,
// so it is declared here and reached by link - see PERSONALISATION_EXTRA_PAGES.
export var DESKTOP_ICONS = {
  id: 'desktopIcons',
  title: 'Desktop icon settings',
  glyph: 'desktopIcons',
  groups: [
    {
      id: 'size',
      title: 'Change the size of the desktop icons',
      items: [
        {
          kind: 'select',
          key: 'personalisation.theme.desktopIconSize',
          label: 'Icon size',
          default: 'Medium icons',
          options: [
            { value: 'Small icons', label: 'Small icons' },
            { value: 'Medium icons', label: 'Medium icons' },
            { value: 'Large icons', label: 'Large icons' }
          ]
        }
      ]
    },
    {
      id: 'show',
      title: 'Choose which desktop icons to show',
      items: [
        { kind: 'toggle', key: 'personalisation.theme.desktopIcons', label: 'Show desktop icons', default: true }
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

// Start. The page is one run of switches and then two rows of help, with no
// group headings anywhere - Windows puts none on this page, and a heading over
// each switch would be a heading that names nothing the switch did not already
// say.
//
// "Show app list in Start menu" is not a second copy of the Start menu's own
// choice: the shell already keeps it in startstate.js and reads it on every open,
// and the bridge is what stops this page from contradicting it.
export var START = {
  id: 'start',
  title: 'Start',
  glyph: 'start',
  groups: [
    {
      id: 'toggles',
      items: [
        { kind: 'toggle', key: 'personalisation.start.showMoreTiles', label: 'Show more tiles on Start', default: false },
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
      items: [
        { kind: 'link', label: 'Choose which folders appear on Start', action: 'personalisation.start.folders' }
      ]
    },
    {
      id: 'help',
      items: [
        {
          kind: 'helpLinks',
          label: 'Talk to us',
          links: [
            { label: 'Get help', action: 'help.get', icon: 'help' },
            { label: 'Give feedback', action: 'help.feedback', icon: 'feedback' }
          ]
        }
      ]
    }
  ]
};

// Taskbar. Again no headings: seven switches, then the two drop-downs. Windows
// does not group them, and "Taskbar items" over a list that already says
// taskbar four times is a heading that adds nothing.
//
// "Use small taskbar buttons" and "Show badges on taskbar buttons" are switches
// on this page in 1903; earlier builds had them as drop-downs further down.
export var TASKBAR = {
  id: 'taskbar',
  title: 'Taskbar',
  glyph: 'taskbar',
  groups: [
    {
      id: 'toggles',
      items: [
        { kind: 'toggle', key: 'personalisation.taskbar.locked', label: 'Lock the taskbar', default: true },
        { kind: 'toggle', key: 'personalisation.taskbar.autoHideDesktop', label: 'Automatically hide the taskbar in desktop mode', default: false },
        { kind: 'toggle', key: 'personalisation.taskbar.autoHideTablet', label: 'Automatically hide the taskbar in tablet mode', default: false },
        { kind: 'toggle', key: 'personalisation.taskbar.smallIcons', label: 'Use small taskbar buttons', default: false },
        {
          kind: 'toggle',
          key: 'personalisation.taskbar.peek',
          label: 'Use Peek to preview the desktop when you move your mouse to the Show desktop button at the end of the taskbar',
          default: false
        },
        {
          kind: 'toggle',
          key: 'personalisation.taskbar.powerShellMenu',
          label: 'Replace Command Prompt with Windows PowerShell in the menu when I right-click the start button or press Windows key+X',
          default: true
        },
        { kind: 'toggle', key: 'personalisation.taskbar.badges', label: 'Show badges on taskbar buttons', default: true }
      ]
    },
    {
      id: 'options',
      items: [
        {
          kind: 'select',
          key: 'personalisation.taskbar.where',
          label: 'Taskbar location on screen',
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
          key: 'personalisation.taskbar.combine',
          label: 'Combine taskbar buttons',
          default: 'Always, hide labels',
          options: [
            { value: 'Never', label: 'Never' },
            { value: 'When taskbar is full', label: 'When taskbar is full' },
            { value: 'Always, hide labels', label: 'Always, hide labels' },
            { value: 'Always, show labels', label: 'Always, show labels' },
            { value: 'Never, show labels', label: 'Never, show labels' }
          ]
        }
      ]
    }
  ],
  rail: [
    {
      title: 'Related Settings',
      links: [
        { label: 'Sync your settings', to: 'syncSettings' }
      ]
    },
    {
      title: 'Have a question?',
      links: [
        { label: 'Fix a problem with the taskbar', action: 'taskbar.help' },
        { label: 'Get help', action: 'help.get' }
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

// Reached by link rather than drawn in the nav, which is where Windows puts this
// one: it is a dialog in Windows, and the nav row for it is the desktop's own
// right-click menu item.
export var PERSONALISATION_EXTRA_PAGES = [
  DESKTOP_ICONS
];