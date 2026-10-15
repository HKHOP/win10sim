// The System category: what the machine is set up to do, rather than how it
// looks or what is on it.
//
// The groups below follow Windows 10 build 1903's own arrangement, including
// where Settings puts a label that does not match the storage key underneath it
// ("Night light (off until 9:00 PM)" is one setting, not two) - the key is the
// stable name for the value, the label is what the user reads.
//
// Display, Sound, Focus assist, Power & sleep, Tablet mode, Snap, Projecting to
// this PC and Clipboard were set from screenshots of 1903 rather than from
// memory, which is where several of the details below come from: Display opens
// with the three things Windows puts first (text, size, brightness) before the
// older groups, Power & sleep has a Performance and Energy group between Screen
// and Sleep, and Snap is the page's own title even though the nav row above it
// still says Multitasking.

export var DISPLAY = {
  id: 'display',
  title: 'Display',
  glyph: 'display',
  groups: [
    {
      id: 'intro',
      items: [
        { kind: 'text', text: 'Make your display easier to see.' }
      ]
    },
    {
      id: 'textbigger',
      title: 'Make text bigger',
      items: [
        {
          kind: 'textSample',
          key: 'display.textSize',
          label: 'Make text bigger',
          min: 100,
          max: 500,
          step: 25,
          default: 100
        }
      ]
    },
    {
      id: 'everythingbigger',
      title: 'Make everything bigger',
      items: [
        {
          kind: 'select',
          key: 'display.scale',
          label: 'Change the size of apps and text on the main display',
          default: '100% (Recommended)',
          options: [
            { value: '100% (Recommended)', label: '100% (Recommended)' },
            { value: '125%', label: '125%' },
            { value: '150%', label: '150%' },
            { value: '175%', label: '175%' },
            { value: '200%', label: '200%' },
            { value: '225%', label: '225%' },
            { value: '250%', label: '250%' }
          ]
        },
        { kind: 'link', label: 'Change the size of apps and text on other displays', action: 'display.otherDisplays' },
        { kind: 'link', label: 'Change the size and color of your cursor and mouse pointer', action: 'display.pointerSize' }
      ]
    },
    {
      id: 'everythingbrighter',
      title: 'Make everything brighter',
      items: [
        {
          kind: 'slider',
          key: 'display.brightness',
          label: 'Change the brightness of your built-in display',
          min: 0,
          max: 100,
          step: 1,
          suffix: '%',
          default: 51,
          icon: 'brightness',
          iconEnd: 'brightness'
        }
      ]
    },
    {
      id: 'brightnesscolor',
      title: 'Brightness & color',
      items: [
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
        { kind: 'link', label: 'Advanced display settings', to: 'displayAdvanced' }
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
    }
  ],
  // Related settings, the questions and the feedback link are the rail *beside*
  // the settings rather than groups under them, which is where 1903 puts them -
  // and why this page has no "Related settings" group of its own.
  rail: [
    {
      title: 'Related settings',
      links: [
        { label: 'Additional display settings', to: 'displayAdvanced' },
        { label: 'Background settings', to: 'background' },
        { label: 'Color settings', to: 'colors' },
        { label: 'Theme settings', to: 'themes' }
      ]
    },
    {
      title: 'Have a question?',
      links: [
        { label: 'Using color filters', to: 'easeColors' },
        { label: 'Turning on high contrast', to: 'easeContrast' },
        { label: 'Get help', action: 'help.get' }
      ]
    },
    {
      title: 'Make Windows better',
      links: [
        { label: 'Give us feedback', action: 'help.feedback' }
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

// Sound: the two groups Windows 1903 splits it into, each with the same sentence
// under the device box, and the master volume as a row rather than a group of its
// own. The volume sliders carry the mark for what they are a volume of - a
// speaker for the output, a microphone for the input - which is the only thing
// telling two identical bars apart.
export var SOUND = {
  id: 'sound',
  title: 'Sound',
  glyph: 'sound',
  groups: [
    {
      id: 'output',
      title: 'Output',
      items: [
        {
          kind: 'select',
          key: 'sound.outputDevice',
          label: 'Choose your output device',
          default: 'Speakers (Realtek High Definition Audio)',
          options: [
            { value: 'Speakers (Realtek High Definition Audio)', label: 'Speakers (Realtek High Definition Audio)' },
            { value: 'Headphones (Realtek Audio)', label: 'Headphones (Realtek Audio)' },
            { value: 'Digital Output (S/PDIF)', label: 'Digital Output (S/PDIF)' }
          ]
        },
        { kind: 'text', text: 'Certain apps may be set up to use different sound devices than the one selected here. Customize app volumes and devices in advanced sound options.' },
        { kind: 'link', label: 'Device properties', action: 'sound.outputProperties' },
        {
          kind: 'slider',
          key: 'sound.masterVolume',
          label: 'Master volume',
          min: 0,
          max: 100,
          step: 1,
          default: 75,
          icon: 'speaker'
        },
        { kind: 'button', label: 'Troubleshoot', action: 'sound.troubleshoot', icon: 'warning' },
        { kind: 'link', label: 'Manage sound devices', action: 'sound.manageDevices' }
      ]
    },
    {
      id: 'input',
      title: 'Input',
      items: [
        {
          kind: 'select',
          key: 'sound.inputDevice',
          label: 'Choose your input device',
          default: 'Microphone (Realtek High Definition Audio)',
          options: [
            { value: 'Microphone (Realtek High Definition Audio)', label: 'Microphone (Realtek High Definition Audio)' },
            { value: 'Microphone Array (Realtek High Definition Audio)', label: 'Microphone Array (Realtek High Definition Audio)' },
            { value: 'Line In (Realtek High Definition Audio)', label: 'Line In (Realtek High Definition Audio)' }
          ]
        },
        { kind: 'text', text: 'Certain apps may be set up to use different sound devices than the one selected here. Customize app volumes and devices in advanced sound options.' },
        { kind: 'link', label: 'Device properties', action: 'sound.inputProperties' },
        {
          kind: 'slider',
          key: 'sound.inputVolume',
          label: 'Test your microphone',
          min: 0,
          max: 100,
          step: 1,
          default: 75,
          icon: 'microphone'
        }
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
  ],
  rail: [
    {
      title: 'Related settings',
      links: [
        { label: 'Volume mixer', action: 'sound.mixer' },
        { label: 'Default sound device settings', action: 'sound.defaults' }
      ]
    },
    {
      title: 'Have a question?',
      links: [
        { label: 'Fixing sound problems', action: 'sound.help' },
        { label: 'Get help', action: 'help.get' }
      ]
    },
    {
      title: 'Make Windows better',
      links: [
        { label: 'Give us feedback', action: 'help.feedback' }
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

// Focus assist. The three answers each carry the sentence Windows writes under
// them, and "Priority only" carries a link as well - because "Customize your
// priority list" is the way out of that answer rather than a setting of its own.
//
// The automatic rules are not switches on a page: each is a mark, the thing that
// sets it off, what it will do when it fires, and the switch. The second line is
// the part a switch row has nowhere to put.
export var FOCUS_ASSIST = {
  id: 'focusassist',
  title: 'Focus assist',
  glyph: 'focusAssist',
  groups: [
    {
      id: 'intro',
      items: [
        { kind: 'text', text: 'Choose which notification you’d like to see and hear so you can stay focused. The rest will go straight to action center where you can see them any time.' }
      ]
    },
    {
      id: 'modes',
      items: [
        {
          kind: 'radio',
          key: 'focusassist.mode',
          label: '',
          default: 'off',
          options: [
            { value: 'off', label: 'Off', help: 'Get all notifications from your apps and contacts.' },
            {
              value: 'priority',
              label: 'Priority only',
              help: 'See only selected notifications from the priority list. The rest will go straight to action center.',
              link: { label: 'Customize your priority list', action: 'focusassist.priorityList' }
            },
            { value: 'alarms', label: 'Alarms only', help: 'Hide all notifications, except for alarms.' }
          ]
        }
      ]
    },
    {
      id: 'rules',
      title: 'Automatic rules',
      items: [
        { kind: 'text', text: 'Choose the times and activities when you don’t want to be disturbed, and focus assist will turn on automatically.' },
        { kind: 'ruleRow', key: 'focusassist.ruleTimes', icon: 'clock', label: 'During these times', sublabel: '11:00 PM - 7:00 AM; Priority only', default: false },
        { kind: 'ruleRow', key: 'focusassist.ruleDuplicatingDisplay', icon: 'tvMonitor', label: 'When I’m duplicating my display', sublabel: 'Alarms only', default: true },
        { kind: 'ruleRow', key: 'focusassist.rulePlayingGame', icon: 'game', label: 'When I’m playing a game', sublabel: 'Priority only', default: true },
        { kind: 'ruleRow', key: 'focusassist.ruleFullScreen', icon: 'fullScreen', label: 'When I’m using an app in full screen mode', sublabel: 'Alarms only', default: true },
        { kind: 'checkbox', key: 'focusassist.summary', label: 'Show me a summary of what I missed while focus assist was on', default: false }
      ]
    }
  ]
};

// Power & sleep. The page 1903 shows is short and has a group the older layout did
// not: Performance and Energy, with the power mode as a five-position slider
// between a leaf and a bolt and the name of the current position in the caption.
// The five positions are Windows' own five power modes, so the slider steps in
// fives of twenty rather than in arbitrary numbers.
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
          label: 'When plugged in, turn off after',
          default: 'Never',
          options: [
            { value: 'Never', label: 'Never' },
            { value: '1 minute', label: '1 minute' },
            { value: '2 minutes', label: '2 minutes' },
            { value: '3 minutes', label: '3 minutes' },
            { value: '5 minutes', label: '5 minutes' },
            { value: '10 minutes', label: '10 minutes' },
            { value: '15 minutes', label: '15 minutes' },
            { value: '20 minutes', label: '20 minutes' },
            { value: '25 minutes', label: '25 minutes' },
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
          label: 'When on battery, turn off after',
          default: 'Never',
          options: [
            { value: 'Never', label: 'Never' },
            { value: '1 minute', label: '1 minute' },
            { value: '2 minutes', label: '2 minutes' },
            { value: '3 minutes', label: '3 minutes' },
            { value: '5 minutes', label: '5 minutes' },
            { value: '10 minutes', label: '10 minutes' },
            { value: '15 minutes', label: '15 minutes' },
            { value: '20 minutes', label: '20 minutes' },
            { value: '25 minutes', label: '25 minutes' },
            { value: '30 minutes', label: '30 minutes' },
            { value: '45 minutes', label: '45 minutes' },
            { value: '1 hour', label: '1 hour' },
            { value: '2 hours', label: '2 hours' },
            { value: '3 hours', label: '3 hours' },
            { value: '5 hours', label: '5 hours' },
            { value: 'Never (turn off only)', label: 'Never (turn off only)' }
          ]
        }
      ]
    },
    {
      id: 'performance',
      title: 'Performance and Energy',
      items: [
        {
          kind: 'slider',
          key: 'power.mode',
          label: 'Power mode',
          min: 0,
          max: 100,
          step: 25,
          default: 75,
          showValue: false,
          icon: 'leaf',
          iconEnd: 'lightningBolt',
          endLabels: ['Best energy savings', 'Best performance'],
          labelFrom: {
            0: 'Best energy efficiency',
            25: 'Better battery life',
            50: 'Balanced',
            75: 'Better performance',
            100: 'Best performance'
          }
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
          label: 'When plugged in, turn off after',
          default: 'Never',
          options: [
            { value: 'Never', label: 'Never' },
            { value: '1 minute', label: '1 minute' },
            { value: '2 minutes', label: '2 minutes' },
            { value: '3 minutes', label: '3 minutes' },
            { value: '5 minutes', label: '5 minutes' },
            { value: '10 minutes', label: '10 minutes' },
            { value: '15 minutes', label: '15 minutes' },
            { value: '30 minutes', label: '30 minutes' },
            { value: '45 minutes', label: '45 minutes' },
            { value: '1 hour', label: '1 hour' },
            { value: '2 hours', label: '2 hours' },
            { value: '3 hours', label: '3 hours' },
            { value: 'Never (turn off only)', label: 'Never (turn off only)' }
          ]
        },
        {
          kind: 'select',
          key: 'power.sleepBattery',
          label: 'When on battery, turn off after',
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
            { value: '3 hours', label: '3 hours' },
            { value: 'Never (turn off only)', label: 'Never (turn off only)' }
          ]
        }
      ]
    },
    {
      id: 'energy',
      title: 'Save energy and battery life',
      items: [
        { kind: 'text', text: 'Make your battery last longer by choosing shorter times for screen and sleep settings.' }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Additional power settings', to: 'powerUsage' }
      ]
    },
    {
      id: 'web',
      title: 'Help from the web',
      items: [
        { kind: 'link', label: 'Lock your Windows PC automatically', action: 'power.lock' }
      ]
    }
  ]
};

// The Battery row Windows puts in the nav between Power & sleep and Storage. The
// two settings on it moved off the Power & sleep page, which in 1903 is where a
// screenshot shows them not to be.
export var BATTERY = {
  id: 'battery',
  title: 'Battery',
  glyph: 'battery',
  groups: [
    {
      id: 'level',
      title: 'Set the battery level at which to turn on battery saver',
      items: [
        { kind: 'slider', key: 'power.batteryLevel', label: 'Battery level', min: 5, max: 100, step: 5, suffix: '%', default: 20 }
      ]
    },
    {
      id: 'saver',
      title: 'Battery saver',
      items: [
        { kind: 'toggle', key: 'power.energySaver', label: 'Battery saver', default: false },
        {
          kind: 'select',
          key: 'power.lowBatteryLevel',
          label: 'Set battery saver level when',
          default: '20%',
          options: [
            { value: 'Never', label: 'Never' },
            { value: '20%', label: '20%' },
            { value: '30%', label: '30%' },
            { value: '40%', label: '40%' },
            { value: '50%', label: '50%' }
          ]
        }
      ]
    },
    {
      id: 'usage',
      title: 'Battery usage',
      items: [
        { kind: 'usageChart', label: 'Battery usage', data: [
          { name: 'Microsoft Edge', minutes: 74 },
          { name: 'Windows Explorer', minutes: 51 },
          { name: 'Desktop Window Manager', minutes: 38 },
          { name: 'Settings', minutes: 22 }
        ] }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Power & sleep', to: 'power' }
      ]
    }
  ]
};

export var POWER_USAGE = {
  id: 'powerUsage',
  title: 'Additional power settings',
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

// Tablet mode: four rows and nothing else in 1903 - two questions Windows asks
// and two switches it draws - so there is no Related settings group here.
export var TABLET = {
  id: 'tablet',
  title: 'Tablet mode',
  glyph: 'tablet',
  groups: [
    {
      id: 'use',
      items: [
        {
          kind: 'select',
          key: 'tablet.when',
          label: 'When I sign in',
          default: 'Use the appropriate mode for my hardware',
          options: [
            { value: 'Use the appropriate mode for my hardware', label: 'Use the appropriate mode for my hardware' },
            { value: 'Always use tablet mode', label: 'Always use tablet mode' },
            { value: 'Never use tablet mode', label: 'Never use tablet mode' }
          ]
        },
        {
          kind: 'select',
          key: 'tablet.autoSwitch',
          label: 'When this device automatically switches tablet mode on or off',
          default: 'Always ask me before switching',
          options: [
            { value: 'Always ask me before switching', label: 'Always ask me before switching' },
            { value: 'Never ask me before switching', label: 'Never ask me before switching' }
          ]
        },
        { kind: 'toggle', key: 'tablet.hideTaskbarIcons', label: 'Hide app icons on the taskbar in tablet mode', default: true },
        { kind: 'toggle', key: 'tablet.autoHideTaskbar', label: 'Automatically hide the taskbar in tablet mode', default: false }
      ]
    }
  ]
};

// The nav row above this says Multitasking and the page's own title says Snap,
// which is what Windows does: the row names the feature, the page names what it
// configures. It is the one place in Settings where those two differ.
export var MULTITASKING = {
  id: 'multitasking',
  title: 'Snap',
  glyph: 'multitasking',
  groups: [
    {
      id: 'snap',
      items: [
        {
          kind: 'toggle',
          key: 'multitasking.snapWindows',
          label: 'Arrange windows automatically by dragging them to the sides or corners of the screen',
          default: true
        },
        {
          kind: 'toggle',
          key: 'multitasking.snapFill',
          label: 'When I snap a window, automatically size it to fill available space',
          default: true
        },
        {
          kind: 'toggle',
          key: 'multitasking.snapAssist',
          label: 'When I snap a window, show what I can snap next to it',
          default: true
        },
        {
          kind: 'toggle',
          key: 'multitasking.snapTogether',
          label: 'When I resize a snapped window, simultaneously resize any adjacent snapped window',
          default: true
        }
      ]
    },
    {
      id: 'desktops',
      title: 'Virtual desktops',
      items: [
        {
          kind: 'select',
          key: 'multitasking.taskbarShowOn',
          label: 'On the taskbar, show windows that are open on',
          default: 'Only the desktop I’m using',
          options: [
            { value: 'All desktops', label: 'All desktops' },
            { value: 'Only the desktop I’m using', label: 'Only the desktop I’m using' }
          ]
        },
        {
          kind: 'select',
          key: 'multitasking.altTabShowOn',
          label: 'Pressing Alt+Tab shows windows that are open on',
          default: 'Only the desktop I’m using',
          options: [
            { value: 'All desktops', label: 'All desktops' },
            { value: 'Only the desktop I’m using', label: 'Only the desktop I’m using' }
          ]
        }
      ]
    }
  ],
  rail: [
    {
      title: 'Related settings',
      links: [
        { label: 'Taskbar', to: 'taskbar' },
        { label: 'Tablet mode', to: 'tablet' }
      ]
    },
    {
      title: 'Have a question?',
      links: [
        { label: 'Get help', action: 'help.get' }
      ]
    },
    {
      title: 'Make Windows better',
      links: [
        { label: 'Give us feedback', action: 'help.feedback' }
      ]
    }
  ]
};

// Projecting to this PC on a machine with no Miracast receiver: Windows says so
// in red at the top and then greys out every setting that depends on it. They are
// declared disabled rather than left out, because a screenshot of this page
// shows them all - drawn, greyed, and answering nothing.
export var PROJECTING = {
  id: 'projecting',
  title: 'Projecting to this PC',
  glyph: 'projecting',
  groups: [
    {
      id: 'status',
      items: [
        { kind: 'note', text: 'This device doesn’t support receiving Miracast, so you can’t project to it wirelessly.' },
        { kind: 'text', text: 'Project your Windows phone or PC to this screen, and use its keyboard, mouse and other devices, too.' }
      ]
    },
    {
      id: 'settings',
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
          ],
          disabled: true
        },
        {
          kind: 'select',
          key: 'projecting.ask',
          label: 'Ask to project to this PC',
          default: 'Every time a connection is requested',
          options: [
            { value: 'Every time a connection is requested', label: 'Every time a connection is requested' },
            { value: 'First time only', label: 'First time only' }
          ],
          disabled: true
        },
        { kind: 'toggle', key: 'projecting.requirePin', label: 'Require PIN for pairing', default: false, disabled: true },
        {
          kind: 'toggle',
          key: 'projecting.pluggedOnly',
          label: 'This PC can only be discovered for projection only when it is plugged in',
          default: true,
          disabled: true
        }
      ]
    },
    {
      id: 'pcname',
      items: [
        { kind: 'specList', label: 'PC name', rows: [
          { label: 'PC name', value: 'WIN10SIM-PC' }
        ] },
        { kind: 'link', label: 'Rename your PC', action: 'about.rename' }
      ]
    }
  ],
  rail: [
    {
      title: 'Have a question?',
      links: [
        { label: 'Fixing a connection problem', action: 'projecting.help' },
        { label: 'Get help', action: 'help.get' }
      ]
    },
    {
      title: 'Make Windows better',
      links: [
        { label: 'Give us feedback', action: 'help.feedback' }
      ]
    }
  ]
};

// Shared experiences: the two rows about what Windows suggests, which is all
// this page has ever held.
export var SHARED = {
  id: 'shared',
  title: 'Shared experiences',
  glyph: 'shared',
  groups: [
    {
      id: 'general',
      title: 'General',
      items: [
        { kind: 'toggle', key: 'shared.tips', label: 'Show me tips as I use Windows', default: true },
        { kind: 'toggle', key: 'shared.suggestedSettings', label: 'Show me suggested content in Settings', default: true },
        { kind: 'toggle', key: 'shared.sendSuggestions', label: 'Send Microsoft suggestions', default: false }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Privacy', to: 'privacyGeneral' },
        { kind: 'link', label: 'Diagnostics & feedback', to: 'privacyDiagnostics' }
      ]
    }
  ]
};

// Clipboard: the three things the page does - keep a history, sync it, clear it -
// and the pair of help links Windows closes every one of these pages with.
export var CLIPBOARD = {
  id: 'clipboard',
  title: 'Clipboard',
  glyph: 'clipboard',
  groups: [
    {
      id: 'intro',
      items: [
        { kind: 'text', text: 'When you copy or cut something in Windows, it’s copied to the clipboard for you to paste.' }
      ]
    },
    {
      id: 'history',
      title: 'Clipboard history',
      items: [
        { kind: 'text', text: 'Save multiple items to the clipboard to use later. Press the Windows logo key + V to view your clipboard history and paste from it.' },
        // The heading above already says what the switch is for, so the words are
        // not drawn beside it a second time.
        { kind: 'toggle', key: 'clipboard.history', label: 'Clipboard history', labelHidden: true, default: false }
      ]
    },
    {
      id: 'sync',
      title: 'Sync across devices',
      items: [
        { kind: 'text', text: 'Paste text on your other devices when you sign in with a Microsoft account or work account.' },
        { kind: 'link', label: 'Sign in', to: 'yourInfo' }
      ]
    },
    {
      id: 'clear',
      title: 'Clear clipboard data',
      items: [
        { kind: 'text', text: 'Clear everything (except pinned items) on this device and with Microsoft.' },
        { kind: 'button', label: 'Clear', action: 'clipboard.clear' }
      ]
    },
    {
      id: 'help',
      title: 'Talk to us',
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

export var REMOTE_DESKTOP = {
  id: 'remoteDesktop',
  title: 'Remote Desktop',
  glyph: 'remoteDesktop',
  groups: [
    {
      id: 'discover',
      title: 'Remote Desktop',
      items: [
        { kind: 'toggle', key: 'remoteDesktop.discoverable', label: 'Allow remote PCs to connect to this PC', default: false },
        { kind: 'toggle', key: 'remoteDesktop.authenticated', label: 'Require PCs to be authenticated', default: true }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Projecting to this PC', to: 'projecting' }
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
  // Windows 1903's own order: the five things everyone has, then the ones a
  // given machine may not, then the three between Projecting and Apps for
  // websites, then About at the foot.
  pages: [
    DISPLAY,
    SOUND,
    NOTIFICATIONS,
    FOCUS_ASSIST,
    POWER,
    BATTERY,
    STORAGE,
    TABLET,
    MULTITASKING,
    PROJECTING,
    SHARED,
    CLIPBOARD,
    REMOTE_DESKTOP,
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
  BATTERY,
  POWER_USAGE,
  STORAGE,
  DEFAULT_SAVE,
  TABLET,
  MULTITASKING,
  PROJECTING,
  SHARED,
  CLIPBOARD,
  REMOTE_DESKTOP,
  WEBSITES,
  ABOUT
];