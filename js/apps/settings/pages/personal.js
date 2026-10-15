// The Gaming, Ease of Access and Search categories.
//
// Nothing here is installed on this computer - there is no game, no narrator, no
// speech recognizer - so each page says so in Windows' words rather than
// offering switches for a program that is not there. The switches that would
// apply to the shell itself (Game Mode's effect on the task scheduler, the
// magnifier's effect on text) are present and persist, because Settings is
// remembered whether or not the thing it configures exists today.

export var GAME_MODE = {
  id: 'gameMode',
  title: 'Game Mode',
  glyph: 'gameMode',
  groups: [
    {
      id: 'gamemode',
      title: 'Optimizations for windowed games',
      items: [
        {
          kind: 'toggle',
          key: 'gaming.gameMode',
          label: 'Turn on Game Mode',
          default: true,
          note: 'Game Mode optimises your PC for play.'
        }
      ]
    },
    {
      id: 'fullscreen',
      title: 'Optimizations for windowed games',
      items: [
        {
          kind: 'toggle',
          key: 'gaming.fullscreenOptimizations',
          label: 'Optimizations for windowed games',
          default: true
        },
        {
          kind: 'select',
          key: 'gaming.optimizedApps',
          label: 'Choose which applications to optimize',
          default: 'Let Windows decide',
          options: [
            { value: 'Let Windows decide', label: 'Let Windows decide' },
            { value: 'Microsoft Edge', label: 'Microsoft Edge' },
            { value: 'Notepad', label: 'Notepad' }
          ]
        },
        { kind: 'toggle', key: 'gaming.hardwareGpu', label: 'Use hardware-accelerated GPU scheduling', default: false }
      ]
    },
    {
      id: 'capture',
      title: 'Capture',
      items: [
        { kind: 'link', label: 'Captures (Win+Alt+PrtScn)', to: 'captures' }
      ]
    }
  ]
};

export var GAMEBAR = {
  id: 'gameBar',
  title: 'Xbox Game Bar',
  glyph: 'gamebar',
  groups: [
    {
      id: 'gamebar',
      title: 'Xbox Game Bar',
      items: [
        {
          kind: 'toggle',
          key: 'gaming.gameBar',
          label: 'Turn on Xbox Game Bar',
          default: false
        },
        { kind: 'text', text: 'No Xbox Game Bar is installed on this computer.' }
      ]
    },
    {
      id: 'button',
      title: 'Open Xbox Game Bar using this button on a controller',
      items: [
        {
          kind: 'select',
          key: 'gaming.gameBarButton',
          label: 'Xbox button',
          default: 'Xbox button',
          options: [
            { value: 'Xbox button', label: 'Xbox button' },
            { value: 'Other keys', label: 'Other keys' }
          ]
        }
      ]
    }
  ]
};

export var CAPTURES = {
  id: 'captures',
  title: 'Captures',
  glyph: 'captures',
  groups: [
    {
      id: 'local',
      title: 'Local captures',
      items: [
        {
          kind: 'select',
          key: 'gaming.screenshotFolder',
          label: 'Save screenshots to',
          default: 'Pictures\\Screenshots',
          options: [
            { value: 'Pictures\\Screenshots', label: 'Pictures\\Screenshots' },
            { value: 'Pictures\\Screenshots\\Desktop', label: 'Pictures\\Screenshots\\Desktop' },
            { value: 'Desktop', label: 'Desktop' }
          ]
        },
        {
          kind: 'select',
          key: 'gaming.gameClipFolder',
          label: 'Save game clips to',
          default: 'Videos\\Captures',
          options: [
            { value: 'Videos\\Captures', label: 'Videos\\Captures' },
            { value: 'Videos\\Captures\\Desktop', label: 'Videos\\Captures\\Desktop' }
          ]
        },
        { kind: 'button', label: 'Open folder', action: 'gaming.openCaptures' }
      ]
    },
    {
      id: 'gamebar',
      title: 'Game bar',
      items: [
        {
          kind: 'toggle',
          key: 'gaming.recordGameplay',
          label: 'Record gameplay',
          default: false
        },
        {
          kind: 'toggle',
          key: 'gaming.screenshotHotkey',
          label: 'Take a screenshot',
          default: true
        }
      ]
    }
  ]
};

export var GAMING = {
  id: 'gaming',
  title: 'Gaming',
  blurb: 'Game bar, captures, broadcasting, Game Mode',
  glyph: 'gaming',
  pages: [GAME_MODE, GAMEBAR, CAPTURES]
};

// --- Ease of Access ---------------------------------------------------------

export var VISION = {
  id: 'easeVision',
  title: 'Vision',
  glyph: 'magnifier',
  groups: [
    {
      id: 'textsize',
      title: 'Make text bigger',
      items: [
        {
          kind: 'link',
          label: 'Change text size',
          action: 'ease.textSize'
        },
        { kind: 'text', text: 'Text size is set in Settings > System > Display. This page shows the same value rather than a second one.' },
        { kind: 'link', label: 'Display settings', to: 'display' }
      ]
    },
    {
      id: 'magnify',
      title: 'Magnify',
      items: [
        { kind: 'toggle', key: 'ease.magnifier', label: 'On', default: false },
        {
          kind: 'select',
          key: 'ease.magnifierMode',
          label: 'Magnify part of the screen',
          default: 'Full screen',
          options: [
            { value: 'Full screen', label: 'Full screen' },
            { value: 'Lens', label: 'Lens' },
            { value: 'Docked', label: 'Docked' }
          ]
        },
        {
          kind: 'slider',
          key: 'ease.magnifierZoom',
          label: 'Magnification',
          min: 100,
          max: 1000,
          step: 50,
          suffix: '%',
          default: 200
        },
        {
          kind: 'slider',
          key: 'ease.magnifierTextSize',
          label: 'Text size',
          min: 0,
          max: 100,
          step: 1,
          suffix: '%',
          default: 50
        },
        { kind: 'link', label: 'Advanced magnification settings', action: 'ease.magnifierAdvanced' }
      ]
    },
    {
      id: 'narrator',
      title: 'Narrator',
      items: [
        { kind: 'toggle', key: 'ease.narrator', label: 'On', default: false },
        { kind: 'text', text: 'No narrator is installed on this computer.' },
        { kind: 'link', label: 'Narrator settings', action: 'ease.narratorSettings' }
      ]
    },
    {
      id: 'visual',
      title: 'Visual animations',
      items: [
        { kind: 'toggle', key: 'ease.animations', label: 'Animation effects', default: true }
      ]
    }
  ]
};

export var CONTRAST = {
  id: 'easeContrast',
  title: 'High contrast',
  glyph: 'ease',
  groups: [
    {
      id: 'themes',
      title: 'Choose a high contrast theme to apply',
      items: [
        { kind: 'text', text: 'High contrast themes provide a contrast ratio of at least 4.5:1 against adjacent colours.' },
        {
          kind: 'themePicker',
          key: 'ease.contrastTheme',
          label: 'Contrast themes',
          default: 'None',
          options: [
            { value: 'None', label: 'None' },
            { value: 'High contrast - White on black', label: 'High contrast - White on black' },
            { value: 'High contrast - Black on white', label: 'High contrast - Black on white' },
            { value: 'High contrast - Yellow on black', label: 'High contrast - Yellow on black' }
          ]
        }
      ]
    },
    {
      id: 'settings',
      title: 'Contrast settings',
      items: [
        { kind: 'toggle', key: 'ease.contrast', label: 'On', default: false },
        { kind: 'button', label: 'Settings', action: 'ease.contrastSettings' }
      ]
    }
  ]
};

export var INTERACTION = {
  id: 'easeInteraction',
  title: 'Interaction',
  glyph: 'interaction',
  groups: [
    {
      id: 'mousekeys',
      title: 'Mouse keys',
      items: [
        { kind: 'toggle', key: 'ease.mouseKeys', label: 'On', default: false },
        { kind: 'link', label: 'Settings', action: 'ease.mouseKeysSettings' }
      ]
    },
    {
      id: 'stickykeys',
      title: 'Sticky keys',
      items: [
        { kind: 'toggle', key: 'ease.stickyKeys', label: 'On', default: false },
        { kind: 'link', label: 'Settings', action: 'ease.stickyKeysSettings' }
      ]
    },
    {
      id: 'filterkeys',
      title: 'Filter keys',
      items: [
        { kind: 'toggle', key: 'ease.filterKeys', label: 'On', default: false },
        { kind: 'link', label: 'Settings', action: 'ease.filterKeysSettings' }
      ]
    },
    {
      id: 'keyboard',
      title: 'Keyboard shortcuts for Windows',
      items: [
        {
          kind: 'radio',
          key: 'ease.filterKeysBehaviour',
          label: 'Filter keys',
          default: 'beep',
          options: [
            { value: 'beep', label: 'Beep', help: 'Windows beeps when a key is pressed more than twice in a row.' },
            { value: 'toggle', label: 'Toggle', help: 'Holding the right SHIFT key for eight seconds turns Filter Keys on or off.' },
            { value: 'windowFlag', label: 'Window Flag', help: 'Holding the right SHIFT key for eight seconds displays a window message.' }
          ]
        }
      ]
    }
  ]
};

export var NARRATION = {
  id: 'easeNarration',
  title: 'Speech',
  glyph: 'speech',
  groups: [
    {
      id: 'narrator',
      title: 'Narrator',
      items: [
        { kind: 'toggle', key: 'ease.narratorOn', label: 'On', default: false },
        {
          kind: 'select',
          key: 'ease.narratorVoice',
          label: 'Narrator voice',
          default: 'Microsoft David',
          options: [
            { value: 'Microsoft David', label: 'Microsoft David' },
            { value: 'Microsoft Zira', label: 'Microsoft Zira' }
          ]
        },
        {
          kind: 'select',
          key: 'ease.narratorSpeed',
          label: 'Narrator speed',
          default: 'Medium',
          options: [
            { value: 'Slow', label: 'Slow' },
            { value: 'Medium', label: 'Medium' },
            { value: 'Fast', label: 'Fast' }
          ]
        }
      ]
    },
    {
      id: 'onboard',
      title: 'On-Screen Keyboard (OSK)',
      items: [
        { kind: 'toggle', key: 'ease.osk', label: 'On', default: false },
        { kind: 'text', text: 'This computer draws its own virtual keyboard, which serves the same purpose.' }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Speech', to: 'speech' },
        { kind: 'link', label: 'Narration settings', action: 'ease.narrationSettings' }
      ]
    }
  ]
};

export var EASE_OF_ACCESS = {
  id: 'ease',
  title: 'Ease of Access',
  blurb: 'Narrator, magnifier, high contrast',
  glyph: 'ease',
  pages: [VISION, CONTRAST, INTERACTION, NARRATION]
};

// --- Search -----------------------------------------------------------------

export var FIND_MY_FILES = {
  id: 'findMyFiles',
  title: 'Find my files',
  glyph: 'search',
  groups: [
    {
      id: 'perdevice',
      title: 'Find my files',
      items: [
        {
          kind: 'select',
          key: 'search.perDevice',
          label: 'Per Device',
          default: 'Classic',
          options: [
            { value: 'Classic', label: 'Classic' },
            { value: 'Enhanced', label: 'Enhanced' },
            { value: 'Never', label: 'Never' }
          ]
        }
      ]
    },
    {
      id: 'onedrive',
      title: 'Microsoft OneDrive cloud content search',
      items: [
        { kind: 'note', text: 'This computer is not connected to OneDrive, so there is no cloud content to search.' }
      ]
    }
  ]
};

export var CORTANA = {
  id: 'cortana',
  title: 'Cortana',
  glyph: 'cortana',
  groups: [
    {
      id: 'talk',
      title: 'Talk to Cortana',
      items: [
        { kind: 'toggle', key: 'search.cortanaOn', label: 'On', default: false },
        { kind: 'text', text: 'Cortana is not available in this country or region, and this computer has no network to reach it.' }
      ]
    },
    {
      id: 'permissions',
      title: 'Cortana',
      items: [
        {
          kind: 'toggle',
          key: 'search.cortanaSearchWeb',
          label: 'Let Cortana search the web',
          default: false
        },
        {
          kind: 'toggle',
          key: 'search.cortanaTypingOnly',
          label: 'Send Cortana my typing to improve Microsoft products',
          default: false
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Cortana\'s notifications',
      items: [
        {
          kind: 'toggle',
          key: 'search.cortanaNotifications',
          label: 'Show me suggestions in Cortana when I press the Windows key + Space',
          default: false
        }
      ]
    },
    {
      id: 'taskbar',
      title: 'Talk to Cortana',
      items: [
        { kind: 'toggle', key: 'search.cortanaTaskbar', label: 'Show me Windows', default: false }
      ]
    }
  ]
};

export var WINDOWS_SEARCH = {
  id: 'windowsSearch',
  title: 'Windows Search',
  glyph: 'search',
  groups: [
    {
      id: 'find',
      title: 'Find my devices',
      items: [
        { kind: 'toggle', key: 'search.findMyDevice', label: 'Find my devices', default: true },
        { kind: 'toggle', key: 'search.findMyFiles', label: 'Find my files', default: true },
        { kind: 'toggle', key: 'search.findMyFilesAndDevices', label: 'Find my files and devices', default: true }
      ]
    },
    {
      id: 'permissions',
      title: 'Permissions',
      items: [
        { kind: 'link', label: 'Windows Search', to: 'findMyFiles' }
      ]
    },
    {
      id: 'more',
      title: 'More settings',
      items: [
        {
          kind: 'toggle',
          key: 'search.letAppsUseSearch',
          label: 'Let apps use search',
          default: true
        },
        {
          kind: 'toggle',
          key: 'search.safeSearch',
          label: 'SafeSearch',
          default: false
        },
        { kind: 'toggle', key: 'search.highlights', label: 'Show search highlights', default: true }
      ]
    }
  ]
};

export var SEARCH = {
  id: 'search',
  title: 'Search',
  blurb: 'Find my files, permissions',
  glyph: 'search',
  pages: [FIND_MY_FILES, CORTANA, WINDOWS_SEARCH]
};