// The Apps category: what is installed, what opens a file by default, and what
// runs when you sign in.
//
// The two list pages - Apps & features and Start-up - are built from the app
// registry rather than declared here, the same way Explorer's This PC is built
// from the volume. A declared list of installed programs would be a second,
// wrong answer to a question the shell already knows how to answer.

export var APPS_FEATURES = {
  id: 'appsFeatures',
  title: 'Apps & features',
  glyph: 'appsFeatures',
  groups: [
    {
      id: 'where',
      title: 'Choose where to get apps',
      items: [
        { kind: 'note', text: 'Installing apps only from Microsoft Store helps protect your device.' },
        {
          kind: 'select',
          key: 'apps.installFrom',
          label: 'Install apps from',
          default: 'Anywhere',
          options: [
            { value: 'Anywhere', label: 'Anywhere' },
            { value: 'Microsoft Store only', label: 'Microsoft Store only' }
          ]
        }
      ]
    },
    {
      id: 'features',
      title: 'Apps & features',
      items: [
        { kind: 'link', label: 'Optional features', action: 'apps.optionalFeatures' },
        { kind: 'link', label: 'App execution aliases', action: 'apps.executionAliases' }
      ]
    },
    {
      id: 'list',
      title: 'Apps & features',
      items: [
        {
          kind: 'text',
          text: 'Search, sort, and filter by drive. If you would like to uninstall or move an app, select it from the list.'
        },
        { kind: 'appsFilter', label: 'Filter this list' },
        { kind: 'appsList', keyPrefix: 'apps.features', label: 'Installed apps', source: 'appsFeatures' }
      ]
    }
  ]
};

export var OPTIONAL_FEATURES = {
  id: 'optionalFeatures',
  title: 'Optional features',
  glyph: 'appsFeatures',
  groups: [
    {
      id: 'list',
      title: 'Installed features',
      items: [
        {
          kind: 'featureList',
          label: 'Optional features',
          features: [
            { name: 'Windows Media Player', installed: true, key: 'apps.feature.mediaPlayer' },
            { name: 'Microsoft Print to PDF', installed: true, key: 'apps.feature.printToPdf' },
            { name: 'Windows Projecting', installed: false, key: 'apps.feature.projecting' },
            { name: 'Language pack: English (United States)', installed: true, key: 'apps.feature.enusPack' }
          ]
        }
      ]
    },
    {
      id: 'more',
      title: 'More',
      items: [
        { kind: 'link', label: 'View features that can be used on this PC', action: 'apps.featuresForPc' }
      ]
    }
  ]
};

export var EXECUTION_ALIASES = {
  id: 'executionAliases',
  title: 'App execution aliases',
  glyph: 'appsFeatures',
  groups: [
    {
      id: 'list',
      title: 'App execution aliases',
      items: [
        {
          kind: 'featureList',
          label: 'Aliases',
          features: [
            { name: 'Photos', alias: 'photos.exe', installed: true, key: 'apps.alias.photos' },
            { name: 'Phone Companion', alias: 'phone.exe', installed: false, key: 'apps.alias.phone' },
            { name: 'Your Phone', alias: 'crossdevice.exe', installed: false, key: 'apps.alias.yourPhone' }
          ],
          alias: true
        }
      ]
    }
  ]
};

export var DEFAULT_APPS = {
  id: 'defaultApps',
  title: 'Default apps',
  glyph: 'defaultApps',
  groups: [
    {
      id: 'choose',
      title: 'Choose default applications',
      items: [
        { kind: 'defaultApps', label: 'Choose default applications', source: 'defaultApps' }
      ]
    },
    {
      id: 'links',
      title: 'Links',
      items: [
        { kind: 'link', label: 'Choose default apps by file type', action: 'defaultApps.byType' },
        { kind: 'link', label: 'Choose default apps by protocol', action: 'defaultApps.byProtocol' },
        { kind: 'link', label: 'Set defaults by app', action: 'defaultApps.byApp' }
      ]
    },
    {
      id: 'recommended',
      title: 'Reset to the Microsoft recommended defaults',
      items: [
        { kind: 'button', label: 'Reset', action: 'defaultApps.reset' }
      ]
    }
  ]
};

export var OFFLINE_MAPS = {
  id: 'offlineMaps',
  title: 'Offline maps',
  glyph: 'offlineMaps',
  groups: [
    {
      id: 'maps',
      title: 'Maps',
      items: [
        { kind: 'note', text: 'You don’t have any offline maps downloaded.' },
        { kind: 'button', label: 'Download maps', action: 'offlineMaps.download' }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Location', to: 'privacyLocation' },
        { kind: 'link', label: 'Default apps', to: 'defaultApps' }
      ]
    }
  ]
};

export var VIDEO_PLAYBACK = {
  id: 'videoPlayback',
  title: 'Video playback',
  glyph: 'videoPlayback',
  groups: [
    {
      id: 'quality',
      title: 'Video quality',
      items: [
        {
          kind: 'select',
          key: 'apps.videoQuality',
          label: 'Choose video quality',
          default: 'Optimized',
          options: [
            { value: 'Optimized', label: 'Optimized' },
            { value: 'Always use the highest quality video', label: 'Always use the highest quality video' },
            { value: 'Always use the lowest quality video', label: 'Always use the lowest quality video' }
          ]
        }
      ]
    },
    {
      id: 'howto',
      title: 'How to use',
      items: [
        { kind: 'text', text: 'This computer has no video player installed and no codecs to play with, so there is nothing to play video with.' }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Sound', to: 'sound' },
        { kind: 'link', label: 'Apps & features', to: 'appsFeatures' }
      ]
    }
  ]
};

export var STARTUP = {
  id: 'startup',
  title: 'Start-up',
  glyph: 'startup',
  groups: [
    {
      id: 'startupapps',
      title: 'Startup Apps',
      items: [
        {
          kind: 'text',
          text: 'Apps can be configured to start when you log in. In most cases apps will start minimised or may only start a background task.'
        },
        { kind: 'startupSort', label: 'Sort by' },
        { kind: 'startupList', keyPrefix: 'startup.app', label: 'Startup apps', source: 'startup' }
      ]
    },
    {
      id: 'background',
      title: 'Background tasks',
      items: [
        { kind: 'startupBackground', label: 'Background tasks' }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Taskbar', to: 'taskbar' },
        { kind: 'link', label: 'Sign-in options', to: 'signin' }
      ]
    }
  ]
};

export var APPS = {
  id: 'apps',
  title: 'Apps',
  blurb: 'Uninstall, defaults, optional features',
  glyph: 'apps',
  pages: [
    APPS_FEATURES,
    DEFAULT_APPS,
    OFFLINE_MAPS,
    VIDEO_PLAYBACK,
    STARTUP
  ]
};

// Reached by link from Apps & features, not shown in the nav - which is where
// Windows puts them too.
export var APPS_EXTRA_PAGES = [
  OPTIONAL_FEATURES,
  EXECUTION_ALIASES
];