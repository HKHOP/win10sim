// The System category: what the machine is set up to do, rather than how it
// looks or what is on it.
//
// The groups below follow Windows 10 build 1903's own arrangement, including
// where Settings puts a label that does not match the storage key underneath it
// ("Night light (off until 9:00 PM)" is one setting, not two) - the key is the
// stable name for the value, the label is what the user reads.

export var DISPLAY = {
  id: 'display',
  title: 'Display',
  glyph: 'display',
  groups: [
    {
      id: 'brightness',
      title: 'Brightness & color',
      items: [
        { kind: 'slider', key: 'display.brightness', label: 'Brightness', min: 0, max: 100, step: 1, suffix: '%', default: 100 },
        {
          kind: 'toggle',
          key: 'display.nightLight',
          label: 'Night light (off until 9:00 PM)',
          default: false
        },
        { kind: 'link', label: 'Night light settings', to: 'nightlight' }
      ]
    },
    {
      id: 'textsize',
      title: 'Text size',
      items: [
        {
          kind: 'slider',
          key: 'display.textSize',
          label: 'Change the size of text, apps, and other items',
          min: 100,
          max: 500,
          step: 25,
          suffix: '%',
          default: 100,
          note: 'Windows scales the text it draws; this computer has no DPI to scale to.'
        }
      ]
    },
    {
      id: 'rearrange',
      title: 'Rearrange your displays',
      items: [
        {
          kind: 'displayBoxes',
          label: 'Select a display below to change the settings for it. Press and hold (or select) a display, then drag to rearrange it.'
        },
        { kind: 'button', label: 'Identify', action: 'display.identify' },
        { kind: 'button', label: 'Detect', action: 'display.detect' }
      ]
    },
    {
      id: 'scale',
      title: 'Scale and layout',
      items: [
        {
          kind: 'select',
          key: 'display.resolution',
          label: 'Display resolution',
          default: '1920 x 1080 (Recommended)',
          options: [
            { value: '1024 x 768', label: '1024 x 768' },
            { value: '1366 x 768', label: '1366 x 768' },
            { value: '1920 x 1080 (Recommended)', label: '1920 x 1080 (Recommended)' },
            { value: '2560 x 1440', label: '2560 x 1440' }
          ]
        },
        {
          kind: 'select',
          key: 'display.orientation',
          label: 'Orientation',
          default: 'Landscape',
          options: [
            { value: 'Landscape', label: 'Landscape' },
            { value: 'Portrait', label: 'Portrait' },
            { value: 'Landscape (flipped)', label: 'Landscape (flipped)' },
            { value: 'Portrait (flipped)', label: 'Portrait (flipped)' }
          ]
        },
        {
          kind: 'select',
          key: 'display.scale',
          label: 'Scale',
          default: '100% (Recommended)',
          options: [
            { value: '100% (Recommended)', label: '100% (Recommended)' },
            { value: '125%', label: '125%' },
            { value: '150%', label: '150%' },
            { value: '200%', label: '200%' }
          ]
        },
        { kind: 'link', label: 'Advanced display settings', to: 'displayAdvanced' }
      ]
    },
    {
      id: 'related',
      title: 'Related Settings',
      items: [
        { kind: 'link', label: 'Multitasking', to: 'multitasking' }
      ]
    }
  ]
};

export var NIGHTLIGHT = {
  id: 'nightlight',
  title: 'Night light',
  glyph: 'display',
  groups: [
    {
      id: 'schedule',
      title: 'Night light',
      items: [
        {
          kind: 'select',
          key: 'nightlight.schedule',
          label: 'Schedule night light',
          default: 'Sunset to sunrise',
          options: [
            { value: 'Off', label: 'Off' },
            { value: 'Sunset to sunrise', label: 'Sunset to sunrise' },
            { value: 'Always on', label: 'Always on' }
          ]
        },
        {
          kind: 'slider',
          key: 'nightlight.strength',
          label: 'Strength',
          min: 0,
          max: 100,
          step: 1,
          suffix: '%',
          default: 60
        },
        { kind: 'text', text: 'This computer reports no location, so sunset and sunrise cannot be looked up. Choose Always on to schedule it yourself.' }
      ]
    }
  ]
};

export var DISPLAY_ADVANCED = {
  id: 'displayAdvanced',
  title: 'Advanced display',
  glyph: 'display',
  groups: [
    {
      id: 'refresh',
      title: 'Refresh rate',
      items: [
        {
          kind: 'select',
          key: 'display.refreshRate',
          label: 'Choose a refresh rate',
          default: '60 Hz',
          options: [
            { value: '40 Hz', label: '40 Hz' },
            { value: '60 Hz', label: '60 Hz' },
            { value: '75 Hz', label: '75 Hz' },
            { value: '120 Hz', label: '120 Hz' },
            { value: '144 Hz', label: '144 Hz' }
          ]
        }
      ]
    },
    {
      id: 'adapter',
      title: 'Display adapter properties',
      items: [
        { kind: 'text', text: 'Microsoft Basic Display Adapter. Intel(R) HD Graphics 620.' },
        { kind: 'button', label: 'Properties', action: 'displayAdvanced.adapterProperties' }
      ]
    }
  ]
};

export var SOUND = {
  id: 'sound',
  title: 'Sound',
  glyph: 'sound',
  groups: [
    {
      id: 'output',
      title: 'Choose your output device',
      items: [
        { kind: 'deviceRow', key: 'sound.output', label: 'Speakers (High Definition Audio Device)', icon: 'speaker', default: 'speakers' },
        {
          kind: 'select',
          key: 'sound.outputDevice',
          label: 'Output device',
          default: 'Speakers (High Definition Audio Device)',
          options: [
            { value: 'Speakers (High Definition Audio Device)', label: 'Speakers (High Definition Audio Device)' },
            { value: 'Headphones (Headphone Microphone)', label: 'Headphones (Headphone Microphone)' },
            { value: 'Digital Output (S/PDIF)', label: 'Digital Output (S/PDIF)' }
          ]
        }
      ]
    },
    {
      id: 'volume',
      title: 'Volume',
      items: [
        { kind: 'slider', key: 'sound.masterVolume', label: 'Speakers', min: 0, max: 100, step: 1, suffix: '%', default: 50 }
      ]
    },
    {
      id: 'input',
      title: 'Choose your input device',
      items: [
        {
          kind: 'select',
          key: 'sound.inputDevice',
          label: 'Input device',
          default: 'Microphone (High Definition Audio Device)',
          options: [
            { value: 'Microphone (High Definition Audio Device)', label: 'Microphone (High Definition Audio Device)' },
            { value: 'Microphone Array (High Definition Audio Device)', label: 'Microphone Array (High Definition Audio Device)' },
            { value: 'Line In (High Definition Audio Device)', label: 'Line In (High Definition Audio Device)' }
          ]
        },
        { kind: 'slider', key: 'sound.inputVolume', label: 'Microphone', min: 0, max: 100, step: 1, suffix: '%', default: 75 }
      ]
    },
    {
      id: 'mixer',
      title: 'App volume and device preferences',
      items: [
        { kind: 'appVolumeList', label: 'App volume and device preferences' }
      ]
    },
    {
      id: 'sounds',
      title: 'Windows sounds',
      items: [
        {
          kind: 'select',
          key: 'sound.scheme',
          label: 'Choose a sound scheme',
          default: 'Windows Default',
          options: [
            { value: 'Windows Default', label: 'Windows Default' },
            { value: 'No Sounds', label: 'No Sounds' },
            { value: 'Quiet', label: 'Quiet' }
          ]
        },
        { kind: 'toggle', key: 'sound.systemSounds', label: 'Play system sounds', default: true }
      ]
    }
  ]
};

export var NOTIFICATIONS = {
  id: 'notifications',
  title: 'Notifications & actions',
  glyph: 'notifications',
  groups: [
    {
      id: 'quickactions',
      title: 'Quick actions',
      items: [
        { kind: 'text', text: 'Press and hold (or select) quick actions, then drag to manage them. These quick actions are visible in the notification area:' },
        { kind: 'quickActions', keyPrefix: 'notifications.quickActions', label: 'Quick actions' }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      items: [
        { kind: 'toggle', key: 'notifications.fromAppsAndSenders', label: 'Get notifications from apps and other senders', default: true },
        { kind: 'toggle', key: 'notifications.showOnLockScreen', label: 'Show notifications on the lock screen', default: true },
        { kind: 'toggle', key: 'notifications.remindersOnLockScreen', label: 'Show reminders and incoming WAF on the lock screen', default: true }
      ]
    },
    {
      id: 'more',
      title: 'More settings',
      items: [
        { kind: 'link', label: 'Focus assist', to: 'focusassist' },
        { kind: 'link', label: 'Notifications settings', to: 'notificationsAppSettings' }
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

export var NOTIFICATIONS_APP_SETTINGS = {
  id: 'notificationsAppSettings',
  title: 'Notifications & actions',
  glyph: 'notifications',
  groups: [
    {
      id: 'perapp',
      title: 'Choose which apps send you notifications',
      items: [
        { kind: 'perAppList', keyPrefix: 'notifications.app', label: 'App notifications', source: 'notifications' }
      ]
    },
    {
      id: 'summary',
      title: 'Summary',
      items: [
        { kind: 'button', label: 'Notification settings', action: 'notifications.resetAll', variant: 'primary' }
      ]
    }
  ]
};

export var FOCUS_ASSIST = {
  id: 'focusassist',
  title: 'Focus assist',
  glyph: 'focusAssist',
  groups: [
    {
      id: 'focus',
      title: 'Choose when to show notifications',
      items: [
        {
          kind: 'radio',
          key: 'focusassist.mode',
          label: '',
          default: 'off',
          options: [
            { value: 'off', label: 'Off', help: 'Notifications are shown all the time.' },
            { value: 'priority', label: 'Priority only', help: 'Only notifications from priority senders are shown.' },
            { value: 'alarms', label: 'Alarms only', help: 'Only alarms and urgent notifications are shown.' }
          ]
        }
      ]
    },
    {
      id: 'rules',
      title: 'Rules',
      items: [
        {
          kind: 'toggle',
          key: 'focusassist.autoRules',
          label: 'Automatically turn on when I’m playing a game or recording',
          default: false
        },
        { kind: 'text', text: 'Focus assist will be turned on automatically when this PC is in full-screen game mode.' }
      ]
    }
  ]
};

export var POWER = {
  id: 'power',
  title: 'Power & sleep',
  glyph: 'powerSleep',
  groups: [
    {
      id: 'screen',
      title: 'Screen',
      items: [
        {
          kind: 'select',
          key: 'power.screenPlugged',
          label: 'When plugged in',
          default: '10 minutes',
          options: [
            { value: 'Never', label: 'Never' },
            { value: '5 minutes', label: '5 minutes' },
            { value: '10 minutes', label: '10 minutes' },
            { value: '15 minutes', label: '15 minutes' },
            { value: '20 minutes', label: '20 minutes' },
            { value: '30 minutes', label: '30 minutes' },
            { value: '45 minutes', label: '45 minutes' },
            { value: '1 hour', label: '1 hour' },
            { value: '2 hours', label: '2 hours' },
            { value: '3 hours', label: '3 hours' },
            { value: '4 hours', label: '4 hours' },
            { value: '5 hours', label: '5 hours' },
            { value: 'Never (turn off only)', label: 'Never (turn off only)' }
          ]
        },
        {
          kind: 'select',
          key: 'power.screenBattery',
          label: 'When on battery',
          default: 'Never',
          options: [
            { value: 'Never', label: 'Never' },
            { value: '1 minute', label: '1 minute' },
            { value: '2 minutes', label: '2 minutes' },
            { value: '5 minutes', label: '5 minutes' },
            { value: '10 minutes', label: '10 minutes' },
            { value: '15 minutes', label: '15 minutes' },
            { value: '30 minutes', label: '30 minutes' },
            { value: '45 minutes', label: '45 minutes' },
            { value: '1 hour', label: '1 hour' },
            { value: '2 hours', label: '2 hours' },
            { value: 'Never (turn off only)', label: 'Never (turn off only)' }
          ]
        }
      ]
    },
    {
      id: 'sleep',
      title: 'Sleep',
      items: [
        {
          kind: 'select',
          key: 'power.sleepPlugged',
          label: 'When plugged in',
          default: '30 minutes',
          options: [
            { value: 'Never', label: 'Never' },
            { value: '5 minutes', label: '5 minutes' },
            { value: '10 minutes', label: '10 minutes' },
            { value: '15 minutes', label: '15 minutes' },
            { value: '30 minutes', label: '30 minutes' },
            { value: '45 minutes', label: '45 minutes' },
            { value: '1 hour', label: '1 hour' },
            { value: '2 hours', label: '2 hours' },
            { value: 'Never (turn off only)', label: 'Never (turn off only)' }
          ]
        },
        {
          kind: 'select',
          key: 'power.sleepBattery',
          label: 'When on battery',
          default: '15 minutes',
          options: [
            { value: 'Never', label: 'Never' },
            { value: '5 minutes', label: '5 minutes' },
            { value: '10 minutes', label: '10 minutes' },
            { value: '15 minutes', label: '15 minutes' },
            { value: '30 minutes', label: '30 minutes' },
            { value: '45 minutes', label: '45 minutes' },
            { value: '1 hour', label: '1 hour' },
            { value: 'Never (turn off only)', label: 'Never (turn off only)' }
          ]
        }
      ]
    },
    {
      id: 'battery',
      title: 'Battery',
      items: [
        {
          kind: 'slider',
          key: 'power.batteryLevel',
          label: 'Set the battery level at which to turn on battery saver',
          min: 5,
          max: 100,
          step: 5,
          suffix: '%',
          default: 20
        },
        { kind: 'toggle', key: 'power.energySaver', label: 'Battery saver', default: false }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Usage history', to: 'powerUsage' },
        { kind: 'link', label: 'Multitasking', to: 'multitasking' }
      ]
    }
  ]
};

export var POWER_USAGE = {
  id: 'powerUsage',
  title: 'Power usage',
  glyph: 'powerSleep',
  groups: [
    {
      id: 'battery',
      title: 'Battery usage',
      items: [
        {
          kind: 'usageChart',
          label: 'Battery usage',
          data: [
            { name: 'Microsoft Edge', minutes: 74 },
            { name: 'Windows Explorer', minutes: 51 },
            { name: 'Desktop Window Manager', minutes: 38 },
            { name: 'Settings', minutes: 22 }
          ]
        }
      ]
    },
    {
      id: 'other',
      title: 'Other power settings',
      items: [
        { kind: 'text', text: 'This computer runs on battery power. It has no separate energy report to show, because it has never charged.' }
      ]
    }
  ]
};

export var STORAGE = {
  id: 'storage',
  title: 'Storage',
  glyph: 'storage',
  groups: [
    {
      id: 'sensenote',
      title: 'Manage your space',
      items: [
        {
          kind: 'toggle',
          key: 'storage.sense',
          label: 'Storage Sense',
          default: false,
          note: 'Deletes temporary files that are no longer needed, empties the Recycle Bin automatically, and clears the Downloads folder if it has not been used for 30 days.'
        }
      ]
    },
    {
      id: 'usage',
      title: 'Storage usage',
      items: [
        { kind: 'storageUsage', label: 'See what’s new' },
        { kind: 'storageBreakdown', label: 'Storage used on C:' }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Default Save locations', to: 'defaultSave' }
      ]
    }
  ]
};

export var DEFAULT_SAVE = {
  id: 'defaultSave',
  title: 'Default save locations',
  glyph: 'storage',
  groups: [
    {
      id: 'where',
      title: 'Where to save your files',
      items: [
        {
          kind: 'select',
          key: 'storage.saveTo',
          label: 'Save new files to',
          default: 'C:\\Users\\User\\Documents',
          options: [
            { value: 'C:\\Users\\User\\Desktop', label: 'Desktop' },
            { value: 'C:\\Users\\User\\Documents', label: 'Documents' },
            { value: 'C:\\Users\\User\\Downloads', label: 'Downloads' },
            { value: 'C:\\Users\\User\\Pictures', label: 'Pictures' }
          ]
        },
        {
          kind: 'select',
          key: 'storage.picturesTo',
          label: 'Save pictures to',
          default: 'C:\\Users\\User\\Pictures',
          options: [
            { value: 'C:\\Users\\User\\Pictures', label: 'Pictures' },
            { value: 'C:\\Users\\User\\Desktop', label: 'Desktop' },
            { value: 'C:\\Users\\User\\Downloads', label: 'Downloads' }
          ]
        }
      ]
    }
  ]
};

export var TABLET = {
  id: 'tablet',
  title: 'Tablet mode',
  glyph: 'tablet',
  groups: [
    {
      id: 'use',
      title: 'Use your PC as a tablet',
      items: [
        {
          kind: 'select',
          key: 'tablet.when',
          label: 'When to use tablet mode',
          default: 'When no keyboard is attached',
          options: [
            { value: 'Never', label: 'Never' },
            { value: 'When no keyboard is attached', label: 'When no keyboard is attached' }
          ]
        },
        { kind: 'toggle', key: 'tablet.signedIn', label: 'Don’t show me this again', default: false }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Pen & Windows Ink', to: 'pen' },
        { kind: 'link', label: 'Touchpad', to: 'touchpad' }
      ]
    }
  ]
};

export var MULTITASKING = {
  id: 'multitasking',
  title: 'Multitasking',
  glyph: 'multitasking',
  groups: [
    {
      id: 'alttab',
      title: 'Alt+Tab',
      items: [
        {
          kind: 'select',
          key: 'multitasking.altTabWindows',
          label: 'When I press Alt+Tab, show the last __ window(s) used',
          default: '3',
          options: [
            { value: '3', label: '3' },
            { value: '4', label: '4' },
            { value: '5', label: '5' }
          ]
        },
        {
          kind: 'toggle',
          key: 'multitasking.altTabShowSnapWindows',
          label: 'Show snap windows when I press Alt+Tab',
          default: true
        }
      ]
    },
    {
      id: 'altsnap',
      title: 'Alt+Snap',
      items: [
        {
          kind: 'toggle',
          key: 'multitasking.altSnapEnabled',
          label: 'Let me snap a window to the screen without dragging it to the edge',
          default: false
        }
      ]
    },
    {
      id: 'windows',
      title: 'Windows',
      items: [
        {
          kind: 'toggle',
          key: 'multitasking.snapWindows',
          label: 'Let me snap a window to two half-screen displays',
          default: true
        },
        {
          kind: 'toggle',
          key: 'multitasking.snapAssist',
          label: 'Show me the snap layouts when I snap a window',
          default: true
        },
        {
          kind: 'toggle',
          key: 'multitasking.taskViewButton',
          label: 'Show the Task View button on the taskbar',
          default: true
        }
      ]
    },
    {
      id: 'desktops',
      title: 'Virtual desktops',
      items: [
        { kind: 'button', label: 'Rename a virtual desktop', action: 'multitasking.renameDesktop' }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Taskbar', to: 'taskbar' },
        { kind: 'link', label: 'Tablet mode', to: 'tablet' }
      ]
    }
  ]
};

export var PROJECTING = {
  id: 'projecting',
  title: 'Projecting to this PC',
  glyph: 'projecting',
  groups: [
    {
      id: 'status',
      title: 'PC status',
      items: [
        { kind: 'note', text: 'This device doesn’t support receiving Miracast, so you can’t project to it wirelessly.' },
        { kind: 'text', text: 'Project your Windows phone or PC to this screen, and use its keyboard, mouse and other devices, too.' }
      ]
    },
    {
      id: 'pcsettings',
      title: 'PC settings',
      items: [
        {
          kind: 'select',
          key: 'projecting.discovery',
          label: 'Windows PCs and phones can project to this PC when you say it’s OK',
          default: 'Always Off',
          options: [
            { value: 'Always Off', label: 'Always Off' },
            { value: 'Ask every time a connection is requested', label: 'Ask every time a connection is requested' },
            { value: 'Allow on secure networks', label: 'Allow on secure networks' }
          ]
        },
        {
          kind: 'select',
          key: 'projecting.ask',
          label: 'Ask to project to this PC',
          default: 'Every time a connection is requested',
          options: [
            { value: 'Every time a connection is requested', label: 'Every time a connection is requested' },
            { value: 'First time only', label: 'First time only' }
          ]
        },
        { kind: 'toggle', key: 'projecting.requirePin', label: 'Require PIN for pairing', default: false },
        {
          kind: 'toggle',
          key: 'projecting.pluggedOnly',
          label: 'This PC can only be discovered for projection when it is plugged in',
          default: false
        }
      ]
    }
  ]
};

export var WEBSITES = {
  id: 'websites',
  title: 'Apps for websites',
  glyph: 'websites',
  groups: [
    {
      id: 'site',
      title: 'Website access',
      items: [
        {
          kind: 'toggle',
          key: 'websites.desktopSite',
          label: 'Let Microsoft Edge open desktop sites',
          default: false
        },
        {
          kind: 'toggle',
          key: 'websites.notifications',
          label: 'Let web sites send notifications',
          default: false
        }
      ]
    },
    {
      id: 'permissions',
      title: 'Site permissions',
      items: [
        { kind: 'sitePermissions', label: 'Site permissions', source: 'websites' },
        { kind: 'link', label: 'Delete all site data', action: 'websites.deleteAll' }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Privacy', to: 'privacyLocation' }
      ]
    }
  ]
};

export var ABOUT = {
  id: 'about',
  title: 'About',
  glyph: 'about',
  groups: [
    {
      id: 'device',
      title: 'Device specifications',
      items: [
        { kind: 'specList', label: 'Device specifications', rows: [
          { label: 'Device name', value: 'DESKTOP-WIN10SIM' },
          { label: 'Processor', value: 'Intel(R) Core(TM) i5-6200U CPU @ 2.30GHz' },
          { label: 'Installed RAM', value: '8.00 GB (7.88 GB usable)' },
          { label: 'Device ID', value: 'A1B2C3D4-E5F6-4789-ABCD-EF0123456789' },
          { label: 'Product ID', value: '00331-80000-00000-AA512' },
          { label: 'System type', value: '64-bit operating system, x64-based processor' },
          { label: 'Pen and touch', value: 'Touch support available with no pen or touch input present' }
        ] },
        { kind: 'button', label: 'Rename this PC', action: 'about.rename' }
      ]
    },
    {
      id: 'windows',
      title: 'Windows specifications',
      items: [
        { kind: 'specList', label: 'Windows specifications', rows: [
          { label: 'Edition', value: 'Windows 10 Pro' },
          { label: 'Version', value: '22H2' },
          { label: 'Installed on', value: '10/15/2026' },
          { label: 'OS build', value: '19045.4046' },
          { label: 'Experience', value: 'Windows Feature Experience Pack 1000.19060.1.0' }
        ] },
        { kind: 'text', text: 'This copy of Windows is not genuine.' }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Windows Update', to: 'windowsUpdate' },
        { kind: 'link', label: 'Activation', to: 'activation' }
      ]
    }
  ]
};

export var SYSTEM = {
  id: 'system',
  title: 'System',
  blurb: 'Display, sound, notifications, power',
  glyph: 'system',
  pages: [
    DISPLAY,
    SOUND,
    NOTIFICATIONS,
    FOCUS_ASSIST,
    POWER,
    STORAGE,
    TABLET,
    MULTITASKING,
    PROJECTING,
    WEBSITES,
    ABOUT
  ]
};

export var SYSTEM_PAGES = [
  DISPLAY,
  NIGHTLIGHT,
  DISPLAY_ADVANCED,
  SOUND,
  NOTIFICATIONS,
  NOTIFICATIONS_APP_SETTINGS,
  FOCUS_ASSIST,
  POWER,
  POWER_USAGE,
  STORAGE,
  DEFAULT_SAVE,
  TABLET,
  MULTITASKING,
  PROJECTING,
  WEBSITES,
  ABOUT
];