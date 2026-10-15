// The Privacy category and the Update & Security category - the last two on the
// Settings home screen, and the two a real machine leans on hardest.
//
// Windows Defender is on, because it is always on, and the pages that describe
// a protection that is not running say which protection is not running rather
// than showing a green tick over nothing.

export var PRIVACY_GENERAL = {
  id: 'privacyGeneral',
  title: 'General',
  glyph: 'general',
  groups: [
    {
      id: 'change',
      title: 'Change privacy options',
      items: [
        {
          kind: 'toggle',
          key: 'privacy.advertisingId',
          label: 'Let apps use advertising ID to make ads more interesting to you',
          default: false
        },
        {
          kind: 'toggle',
          key: 'privacy.settingsSuggestedContent',
          label: 'Show me suggested content in Settings app',
          default: true
        }
      ]
    },
    {
      id: 'writing',
      title: 'Let’s find some apps',
      items: [
        { kind: 'link', label: 'Choose which apps can access general settings', to: 'privacyApps' }
      ]
    }
  ]
};

export var PRIVACY_LOCATION = {
  id: 'privacyLocation',
  title: 'Location',
  glyph: 'location',
  groups: [
    {
      id: 'location',
      title: 'Location',
      items: [
        { kind: 'toggle', key: 'privacy.location', label: 'Location', default: false },
        { kind: 'toggle', key: 'privacy.locationBackground', label: 'Let apps run in the background', default: false }
      ]
    },
    {
      id: 'choose',
      title: 'Choose what location access apps can use',
      items: [
        { kind: 'perAppList', keyPrefix: 'privacy.location.app', label: 'Location apps', source: 'location' }
      ]
    },
    {
      id: 'storeapps',
      title: 'Microsoft Store apps can use your location',
      items: [
        { kind: 'note', text: 'No Microsoft Store app is installed, so nothing here can ask for your location.' }
      ]
    }
  ]
};

export var PRIVACY_CAMERA = {
  id: 'privacyCamera',
  title: 'Camera',
  glyph: 'cameraPrivacy',
  groups: [
    {
      id: 'camera',
      title: 'Camera',
      items: [
        { kind: 'toggle', key: 'privacy.camera', label: 'Let apps access your camera', default: false }
      ]
    },
    {
      id: 'choose',
      title: 'Choose which apps can access your camera',
      items: [
        { kind: 'perAppList', keyPrefix: 'privacy.camera.app', label: 'Camera apps', source: 'camera', apps: [
          { appId: 'edge', title: 'Microsoft Edge' },
          { appId: 'store', title: 'Microsoft Store' }
        ] }
      ]
    },
    {
      id: 'background',
      title: 'Let desktop apps access your camera',
      items: [
        { kind: 'toggle', key: 'privacy.cameraDesktop', label: 'Allow desktop apps to access your camera', default: false }
      ]
    }
  ]
};

export var PRIVACY_MICROPHONE = {
  id: 'privacyMicrophone',
  title: 'Microphone',
  glyph: 'microphonePrivacy',
  groups: [
    {
      id: 'microphone',
      title: 'Microphone',
      items: [
        { kind: 'toggle', key: 'privacy.microphone', label: 'Let apps access your microphone', default: false }
      ]
    },
    {
      id: 'choose',
      title: 'Choose which apps can access your microphone',
      items: [
        { kind: 'perAppList', keyPrefix: 'privacy.microphone.app', label: 'Microphone apps', source: 'microphone', apps: [
          { appId: 'edge', title: 'Microsoft Edge' },
          { appId: 'store', title: 'Microsoft Store' }
        ] }
      ]
    },
    {
      id: 'background',
      title: 'Let desktop apps access your microphone',
      items: [
        { kind: 'toggle', key: 'privacy.microphoneDesktop', label: 'Allow desktop apps to access your microphone', default: false }
      ]
    }
  ]
};

export var PRIVACY_NOTIFICATIONS = {
  id: 'privacyNotifications',
  title: 'Notifications',
  glyph: 'notifications',
  groups: [
    {
      id: 'notifications',
      title: 'Notifications',
      items: [
        {
          kind: 'toggle',
          key: 'privacy.notifications',
          label: 'Let apps send you notifications',
          default: false
        }
      ]
    },
    {
      id: 'choose',
      title: 'Choose which apps can send you notifications',
      items: [
        { kind: 'perAppList', keyPrefix: 'privacy.notifications.app', label: 'Notification apps', source: 'notifications' }
      ]
    }
  ]
};

export var PRIVACY_DIAGNOSTICS = {
  id: 'privacyDiagnostics',
  title: 'Diagnostics & feedback',
  glyph: 'diagnostics',
  groups: [
    {
      id: 'diagnosticdata',
      title: 'Diagnostic data viewer',
      items: [
        { kind: 'text', text: 'Diagnostic data is being sent to Microsoft. Your device is also configured to send optional device data.' },
        { kind: 'link', label: 'Diagnostic data viewer', action: 'privacy.diagnosticViewer' }
      ]
    },
    {
      id: 'improve',
      title: 'Improve the product',
      items: [
        {
          kind: 'toggle',
          key: 'privacy.improveProduct',
          label: 'Send Microsoft diagnostic and usage data',
          default: false
        },
        {
          kind: 'toggle',
          key: 'privacy.diagnosticLogViewer',
          label: 'Turn on Diagnostic Log Viewer',
          default: false
        }
      ]
    }
  ]
};

export var PRIVACY_PROTECTION = {
  id: 'privacyProtection',
  title: 'About protection',
  glyph: 'protection',
  groups: [
    {
      id: 'protection',
      title: 'About protection',
      items: [
        {
          kind: 'toggle',
          key: 'privacy.strengthenedProtection',
          label: 'Use Microsoft Defender Enhanced Protection',
          default: false,
          note: 'Enhanced Protection checks every file and download against a vast collection of malware and other threats, and can block access to parts of the device that are not protected.'
        }
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy',
      items: [
        { kind: 'link', label: 'Windows Security', to: 'windowsSecurity' }
      ]
    }
  ]
};

export var PRIVACY_APPS = {
  id: 'privacyApps',
  title: 'Choose which apps can access general settings',
  glyph: 'general',
  groups: [
    {
      id: 'list',
      title: 'Choose which apps can access general settings',
      items: [
        { kind: 'perAppList', keyPrefix: 'privacy.general.app', label: 'Apps', source: 'general' }
      ]
    }
  ]
};

export var PRIVACY = {
  id: 'privacy',
  title: 'Privacy',
  blurb: 'Location, camera, microphone',
  glyph: 'privacy',
  pages: [
    PRIVACY_GENERAL,
    PRIVACY_LOCATION,
    PRIVACY_CAMERA,
    PRIVACY_MICROPHONE,
    PRIVACY_NOTIFICATIONS,
    PRIVACY_DIAGNOSTICS,
    PRIVACY_PROTECTION
  ]
};

export var PRIVACY_EXTRA_PAGES = [
  PRIVACY_APPS
];

// --- Update & security ------------------------------------------------------

export var WINDOWS_UPDATE = {
  id: 'windowsUpdate',
  title: 'Windows Update',
  glyph: 'windowsUpdate',
  groups: [
    {
      id: 'status',
      title: 'You’re up to date',
      items: [
        { kind: 'text', text: 'Last checked: Today, 10:42 AM' },
        { kind: 'button', label: 'Check for updates', action: 'update.check', variant: 'primary' },
        { kind: 'note', text: 'This computer has no network, so it can never reach Windows Update. Everything it reports is what it already has.' }
      ]
    },
    {
      id: 'more',
      title: 'More settings',
      items: [
        {
          kind: 'select',
          key: 'update.activeHours',
          label: 'Get up and running as fast as possible after an update',
          default: '8:00 AM to 10:00 PM',
          options: [
            { value: '8:00 AM to 10:00 PM', label: '8:00 AM to 10:00 PM' },
            { value: '9:00 AM to 5:00 PM', label: '9:00 AM to 5:00 PM' },
            { value: 'Off', label: 'Off' }
          ]
        },
        { kind: 'link', label: 'Update history', action: 'update.history' },
        { kind: 'link', label: 'Restart options', action: 'update.restart' },
        { kind: 'link', label: 'Advanced options', to: 'updateAdvanced' },
        { kind: 'link', label: 'Delivery Optimization', to: 'deliveryOptimization' }
      ]
    }
  ]
};

export var UPDATE_ADVANCED = {
  id: 'updateAdvanced',
  title: 'Advanced options',
  glyph: 'windowsUpdate',
  groups: [
    {
      id: 'optional',
      title: 'Update settings',
      items: [
        {
          kind: 'toggle',
          key: 'update.optionalUpdates',
          label: 'Get updates for other Microsoft products when updating or restarting Windows',
          default: true
        },
        {
          kind: 'toggle',
          key: 'update.pauseUpdates',
          label: 'Pause updates',
          default: false
        }
      ]
    },
    {
      id: 'choose',
      title: 'Choose the update settings you’d like',
      items: [
        {
          kind: 'select',
          key: 'update.quality',
          label: 'Get the latest updates as soon as they’re available',
          default: 'Off (recommended)',
          options: [
            { value: 'Off (recommended)', label: 'Off (recommended)' },
            { value: 'On', label: 'On' }
          ]
        },
        {
          kind: 'select',
          key: 'update.insider',
          label: 'Get preview builds of Windows',
          default: 'Off',
          options: [
            { value: 'Off', label: 'Off' },
            { value: 'Fast ring', label: 'Fast ring' },
            { value: 'Slow ring', label: 'Slow ring' }
          ]
        },
        { kind: 'button', label: 'Check for updates', action: 'update.check', variant: 'primary' }
      ]
    }
  ]
};

export var DELIVERY_OPTIMIZATION = {
  id: 'deliveryOptimization',
  title: 'Delivery Optimization',
  glyph: 'delivery',
  groups: [
    {
      id: 'status',
      title: 'Delivery Optimization',
      items: [
        { kind: 'text', text: 'Delivery Optimization is turned on' },
        { kind: 'text', text: 'Download the updates from the closest Microsoft servers, which may reduce download time.' }
      ]
    },
    {
      id: 'options',
      title: 'Advanced options',
      items: [
        {
          kind: 'toggle',
          key: 'update.deliveryPeers',
          label: 'Allow downloads from other PCs',
          default: true
        },
        {
          kind: 'select',
          key: 'update.deliveryLimit',
          label: 'Limit how much bandwidth is used for updates on metered connections',
          default: 'Off',
          options: [
            { value: 'Off', label: 'Off' },
            { value: '5% of available bandwidth', label: '5% of available bandwidth' },
            { value: '20% of available bandwidth', label: '20% of available bandwidth' }
          ]
        },
        { kind: 'button', label: 'Advanced options', action: 'update.deliveryAdvanced' }
      ]
    }
  ]
};

export var WINDOWS_SECURITY = {
  id: 'windowsSecurity',
  title: 'Windows Security',
  glyph: 'security',
  groups: [
    {
      id: 'status',
      title: 'Open Windows Security',
      items: [
        { kind: 'text', text: 'Open Windows Security to get the latest information about the security status of your device and get help with the issues you are having.' },
        { kind: 'button', label: 'Open Windows Security', action: 'security.open', variant: 'primary' }
      ]
    },
    {
      id: 'sections',
      title: 'Virus & threat protection',
      items: [
        {
          kind: 'protectionRow',
          label: 'Virus & threat protection',
          icon: 'shield',
          title: 'Your device is protected',
          detail: 'No action needed.',
          key: 'security.virusThreat',
          default: 'protected'
        },
        {
          kind: 'protectionRow',
          label: 'Firewall & network protection',
          icon: 'shield',
          title: 'No action needed',
          detail: 'Your device is protected.',
          key: 'security.firewall',
          default: 'protected'
        },
        {
          kind: 'protectionRow',
          label: 'App & browser control',
          icon: 'shield',
          title: 'No action needed',
          detail: 'Your device is protected.',
          key: 'security.appBrowser',
          default: 'protected'
        },
        {
          kind: 'protectionRow',
          label: 'Device security',
          icon: 'shield',
          title: 'Standard hardware security not supported',
          detail: 'Your processor supports standard hardware security.',
          key: 'security.deviceSecurity',
          default: 'protected'
        },
        {
          kind: 'protectionRow',
          label: 'Device performance & health',
          icon: 'shield',
          title: 'No action needed',
          detail: 'Your device is running well.',
          key: 'security.performance',
          default: 'protected'
        },
        {
          kind: 'protectionRow',
          label: 'Family options',
          icon: 'people',
          title: 'No family options are set up',
          detail: 'Add family options in the Windows Security app.',
          key: 'security.family',
          default: 'protected'
        }
      ]
    },
    {
      id: 'statusqueries',
      title: 'Protection history',
      items: [
        { kind: 'link', label: 'Protection history', to: 'protectionHistory' }
      ]
    }
  ]
};

export var PROTECTION_HISTORY = {
  id: 'protectionHistory',
  title: 'Protection history',
  glyph: 'protectionHistory',
  groups: [
    {
      id: 'history',
      title: 'Protection history',
      items: [
        {
          kind: 'protectionHistory',
          label: 'No items',
          empty: 'No threats have been found on this device.',
          rows: []
        }
      ]
    },
    {
      id: 'settings',
      title: 'Manage settings',
      items: [
        { kind: 'link', label: 'Manage settings', action: 'security.settings' }
      ]
    }
  ]
};

export var TROUBLESHOOT = {
  id: 'troubleshoot',
  title: 'Troubleshoot',
  glyph: 'troubleshoot',
  groups: [
    {
      id: 'intro',
      title: 'Your PC is running Windows 10',
      items: [
        { kind: 'text', text: 'If you’re having trouble with this PC, run the troubleshooter.' },
        { kind: 'button', label: 'This PC', action: 'troubleshoot.runThisPc', variant: 'primary' }
      ]
    },
    {
      id: 'other',
      title: 'Other troubleshooters',
      items: [
        {
          kind: 'featureList',
          label: 'Other troubleshooters',
          alias: true,
          features: [
            { name: 'Internet Connections', installed: false, key: 'troubleshoot.internet' },
            { name: 'Audio', installed: true, key: 'troubleshoot.audio' },
            { name: 'Printing', installed: true, key: 'troubleshoot.printing' },
            { name: 'Windows Update', installed: true, key: 'troubleshoot.update' },
            { name: 'Bluetooth', installed: true, key: 'troubleshoot.bluetooth' },
            { name: 'Speech', installed: false, key: 'troubleshoot.speech' }
          ]
        }
      ]
    },
    {
      id: 'reset',
      title: 'Reset',
      items: [
        { kind: 'link', label: 'Recovery', to: 'recovery' }
      ]
    }
  ]
};

export var RECOVERY = {
  id: 'recovery',
  title: 'Recovery',
  glyph: 'recovery',
  groups: [
    {
      id: 'advancedstartup',
      title: 'Advanced startup',
      items: [
        { kind: 'link', label: 'Restart now', action: 'recovery.restartNow' },
        { kind: 'link', label: 'Troubleshoot', to: 'troubleshoot' }
      ]
    },
    {
      id: 'resetpc',
      title: 'Reset this PC',
      items: [
        {
          kind: 'select',
          key: 'recovery.resetOption',
          label: 'Choose an option',
          default: 'Keep my files',
          options: [
            { value: 'Keep my files', label: 'Keep my files' },
            { value: 'Remove everything', label: 'Remove everything' },
            { value: 'Restore from a cloud download', label: 'Restore from a cloud download' }
          ]
        },
        { kind: 'note', text: 'This computer has no recovery environment on it, so no option here can be carried out.' }
      ]
    },
    {
      id: 'gethelp',
      title: 'Get help',
      items: [
        { kind: 'link', label: 'Get help with Windows Update', action: 'recovery.updateHelp' }
      ]
    }
  ]
};

export var BACKUP = {
  id: 'backup',
  title: 'Backup',
  glyph: 'backup',
  groups: [
    {
      id: 'filehistory',
      title: 'File History',
      items: [
        { kind: 'text', text: 'File History isn’t turned on for this account.' },
        { kind: 'button', label: 'Turn on File History', action: 'backup.turnOn', variant: 'primary' }
      ]
    },
    {
      id: 'onedrive',
      title: 'OneDrive',
      items: [
        { kind: 'text', text: 'This computer is not connected to OneDrive, so nothing is being backed up there.' }
      ]
    },
    {
      id: 'restore',
      title: 'System Restore',
      items: [
        { kind: 'toggle', key: 'backup.systemRestore', label: 'System Restore', default: true },
        { kind: 'link', label: 'Create a restore point', action: 'backup.createPoint' }
      ]
    },
    {
      id: 'more',
      title: 'More options',
      items: [
        { kind: 'link', label: 'Change backup drive', action: 'backup.drive' }
      ]
    }
  ]
};

export var ACTIVATION = {
  id: 'activation',
  title: 'Activation',
  glyph: 'activation',
  groups: [
    {
      id: 'status',
      title: 'Activation',
      items: [
        { kind: 'specList', label: 'Activation', rows: [
          { label: 'Windows 10 Pro', value: 'Windows 10 Pro is not activated' }
        ] },
        { kind: 'button', label: 'Activate now', action: 'activation.now' },
        { kind: 'button', label: 'Change product key', action: 'activation.key' },
        { kind: 'text', text: 'Activation failed due to one or more errors.' }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Troubleshoot', to: 'troubleshoot' }
      ]
    }
  ]
};

export var FIND_DEVICE = {
  id: 'findDevice',
  title: 'Find my device',
  glyph: 'findDevice',
  groups: [
    {
      id: 'findmydevice',
      title: 'Find my device',
      items: [
        { kind: 'toggle', key: 'security.findMyDevice', label: 'Find my device', default: false },
        { kind: 'note', text: 'This device has no location to report and no account signed in to it, so nothing would be found.' }
      ]
    },
    {
      id: 'settings',
      title: 'Find my device settings',
      items: [
        { kind: 'link', label: 'Find my device settings', action: 'security.findSettings' }
      ]
    }
  ]
};

export var DEVELOPERS = {
  id: 'developers',
  title: 'For developers',
  glyph: 'developers',
  groups: [
    {
      id: 'devmode',
      title: 'For developers',
      items: [
        { kind: 'toggle', key: 'security.developerMode', label: 'Developer Mode', default: false }
      ]
    },
    {
      id: 'deviceportal',
      title: 'Device portal',
      items: [
        { kind: 'toggle', key: 'security.devicePortal', label: 'Enable Device Portal', default: false }
      ]
    },
    {
      id: 'discovery',
      title: 'Device discovery',
      items: [
        { kind: 'toggle', key: 'security.discovery', label: 'Enable discovery of this device', default: false }
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

export var UPDATE_SECURITY = {
  id: 'update',
  title: 'Update & Security',
  blurb: 'Windows Update, recovery, backup',
  glyph: 'update',
  pages: [
    WINDOWS_UPDATE,
    WINDOWS_SECURITY,
    TROUBLESHOOT,
    RECOVERY,
    BACKUP,
    ACTIVATION,
    FIND_DEVICE,
    DEVELOPERS
  ]
};

export var UPDATE_EXTRA_PAGES = [
  UPDATE_ADVANCED,
  DELIVERY_OPTIMIZATION,
  PROTECTION_HISTORY
];