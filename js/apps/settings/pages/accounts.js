// The Accounts category and the Time & Language category.
//
// Neither account on this machine exists - nothing has signed in, because there
// is no network to sign in to and no Microsoft account has ever been added - so
// both categories report an empty list rather than showing a profile that is not
// there.

// Your info. The page is the account card and nothing else: Windows shows the
// avatar, the name, and the two lines under it, then offers a way to put a
// picture on it. There is no sign-in button here and no sync group - the sign-in
// is the "Sign in" at the top of the nav pane, and sync is its own page.
//
// The account name is the local account the shell actually runs as, and the two
// lines under it are its type and its group, which is what Windows writes under
// a name for an account that is not a Microsoft account.
export var YOUR_INFO = {
  id: 'yourInfo',
  title: 'Your info',
  glyph: 'yourInfo',
  groups: [
    {
      id: 'profile',
      items: [
        {
          kind: 'profileCard',
          label: 'Your info',
          name: 'ADMINISTRATOR',
          accountType: 'Local Account',
          role: 'Administrator'
        }
      ]
    },
    {
      id: 'picture',
      title: 'Create your picture',
      items: [
        { kind: 'link', label: 'Camera', action: 'accounts.picture.camera', icon: 'webcam' },
        { kind: 'link', label: 'Browse for one', action: 'accounts.picture.browse', icon: 'document' }
      ]
    },
    {
      id: 'question',
      title: 'Do you have a question?',
      items: [
        { kind: 'link', label: 'Creating a Microsoft account', action: 'accounts.help.create' },
        { kind: 'link', label: 'Changing your account picture', action: 'accounts.help.picture' }
      ]
    }
  ],
  rail: [
    {
      title: 'Related settings',
      links: [
        { label: 'Sign-in options', to: 'signin' },
        { label: 'Sync settings', to: 'syncSettings' }
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

// Your family: nothing is set up, and Windows says so rather than offering a
// switch for a group that does not exist.
export var FAMILY = {
  id: 'family',
  title: 'Your family',
  glyph: 'family',
  groups: [
    {
      id: 'family',
      title: 'Your family',
      items: [
        { kind: 'text', text: 'Your family group is not set up.' },
        { kind: 'button', label: 'Set up a family', action: 'accounts.setUpFamily' }
      ]
    }
  ]
};

export var SIGNIN = {
  id: 'signin',
  title: 'Sign-in options',
  glyph: 'signin',
  groups: [
    {
      id: 'who',
      title: 'Who can use this device',
      items: [
        {
          kind: 'select',
          key: 'accounts.requireSignin',
          label: 'Change',
          default: 'Never',
          options: [
            { value: 'Never', label: 'Never' },
            { value: 'When someone tries to sign in', label: 'When someone tries to sign in' },
            { value: 'Always', label: 'Always' }
          ]
        },
        {
          kind: 'note',
          text: 'Windows Hello requires a camera. This computer has one, and it is turned off by default in Settings.'
        }
      ]
    },
    {
      id: 'local',
      title: 'Local accounts',
      items: [
        { kind: 'accountList', label: 'Local Security', source: 'local' },
        { kind: 'link', label: 'Other accounts', to: 'otherAccounts' },
        { kind: 'link', label: 'User accounts', to: 'userAccounts' }
      ]
    },
    {
      id: 'family',
      title: 'Family and other users',
      items: [
        { kind: 'link', label: 'Your family', action: 'accounts.family' },
        { kind: 'link', label: 'Other people', to: 'otherPeople' }
      ]
    }
  ]
};

export var OTHER_ACCOUNTS = {
  id: 'otherAccounts',
  title: 'Other accounts',
  glyph: 'signin',
  groups: [
    {
      id: 'list',
      title: 'Other accounts',
      items: [
        { kind: 'accountList', label: 'Other accounts', source: 'other' },
        { kind: 'button', label: 'Add someone else to this PC', action: 'accounts.addOther' }
      ]
    }
  ]
};

export var USER_ACCOUNTS = {
  id: 'userAccounts',
  title: 'User accounts',
  glyph: 'signin',
  groups: [
    {
      id: 'list',
      title: 'User accounts',
      items: [
        { kind: 'accountList', label: 'User accounts', source: 'users' },
        { kind: 'text', text: 'Changes you make here affect the user account only.' }
      ]
    }
  ]
};

export var OTHER_PEOPLE = {
  id: 'otherPeople',
  title: 'Family & other users',
  glyph: 'family',
  groups: [
    {
      id: 'other',
      title: 'Other users',
      items: [
        { kind: 'text', text: 'Allow people who are not part of your family to sign in with their own accounts. This won’t add them to your family.' },
        { kind: 'button', label: 'Add someone else to this PC', action: 'accounts.addOther', icon: 'add', wide: true },
        { kind: 'accountRow', name: 'admin_demo', role: 'Administrator', account: 'Local account' }
      ]
    },
    {
      id: 'kiosk',
      title: 'Set up a kiosk',
      items: [
        {
          kind: 'ruleRow',
          key: 'accounts.kioskAssignedAccess',
          icon: 'desktopIcons',
          label: 'Assigned access',
          sublabel: 'Set up this device as a kioskâ€”this could be a digital sign, an interactive display, a public browser, among other things.',
          default: true
        }
      ]
    }
  ],
  rail: [
    {
      title: 'Help from the web',
      links: [
        { label: 'Creating a local user account', action: 'accounts.help.local' },
        { label: 'Switching to a local account', action: 'accounts.help.switchLocal' },
        { label: 'Setting screen time limits', action: 'accounts.help.screenTime' },
        { label: 'Switching users', action: 'accounts.help.switch' }
      ]
    }
  ]
};

export var EMAIL_ACCOUNTS = {
  id: 'emailAccounts',
  title: 'Email & accounts',
  glyph: 'email',
  groups: [
    {
      id: 'email',
      title: 'Email',
      items: [
        { kind: 'button', label: 'Add account', action: 'accounts.addEmail' },
        { kind: 'accountList', label: 'Email', source: 'email' }
      ]
    },
    {
      id: 'accounts',
      title: 'Accounts',
      items: [
        { kind: 'link', label: 'Manage your account', to: 'yourInfo' }
      ]
    }
  ]
};

export var SYNC_SETTINGS = {
  id: 'syncSettings',
  title: 'Sync settings',
  glyph: 'syncAccount',
  groups: [
    {
      id: 'status',
      title: 'Sync your settings',
      items: [
        { kind: 'text', text: 'Windows is not signed in, so nothing is being synced. Your settings are saved to this PC.' }
      ]
    },
    {
      id: 'backup',
      title: 'Backup',
      items: [
        { kind: 'link', label: 'Back up your PC', to: 'backup' }
      ]
    }
  ]
};

export var WORKPLACE = {
  id: 'workplace',
  title: 'Work or school',
  glyph: 'accounts',
  groups: [
    {
      id: 'workplace',
      title: 'If your organization uses Azure Active Directory (Azure AD)',
      items: [
        { kind: 'note', text: 'You havenâ€™t connected any work or school accounts to this device.' }
      ]
    },
    {
      id: 'somewhere',
      title: 'Connect a device to your work or school',
      items: [
        { kind: 'link', label: 'Find your domain', action: 'workplace.findDomain' }
      ]
    }
  ]
};

export var ACCOUNTS = {
  id: 'accounts',
  title: 'Accounts',
  blurb: 'Your accounts, email, sync, work, other people',
  glyph: 'accounts',
  // Windows' order: Your info, then Email & accounts, then the two pages about
  // signing in to *this* machine, then the one about signing in to it anywhere.
  pages: [
    YOUR_INFO,
    EMAIL_ACCOUNTS,
    SIGNIN,
    WORKPLACE,
    SYNC_SETTINGS
  ]
};

export var ACCOUNTS_EXTRA_PAGES = [
  OTHER_ACCOUNTS,
  USER_ACCOUNTS,
  OTHER_PEOPLE,
  FAMILY
];

// --- Time & Language --------------------------------------------------------

export var DATE_TIME = {
  id: 'dateTime',
  title: 'Date & time',
  glyph: 'dateTime',
  groups: [
    {
      id: 'current',
      title: 'Current date and time',
      items: [{ kind: 'clock', label: 'Current date and time' }]
    },
    {
      id: 'auto',
      title: 'Set time',
      items: [
        { kind: 'toggle', key: 'time.setAutomatically', label: 'Set time automatically', default: true },
        { kind: 'text', text: 'Time Zone: (UTC-05:00) Eastern Time (US & Canada)' }
      ]
    },
    {
      id: 'sync',
      title: 'Set date and time',
      items: [
        { kind: 'toggle', key: 'time.setTimeAutomatically', label: 'Set time automatically', default: true },
        { kind: 'button', label: 'Sync now', action: 'time.syncNow' },
        { kind: 'button', label: 'Date and time settings', action: 'time.windowsSettings' }
      ]
    },
    {
      id: 'zone',
      title: 'Set time zone',
      items: [
        {
          kind: 'select',
          key: 'time.zone',
          label: '(UTC-05:00) Eastern Time (US & Canada)',
          default: '(UTC-05:00) Eastern Time (US & Canada)',
          options: [
            { value: '(UTC-08:00) Pacific Time (US & Canada)', label: '(UTC-08:00) Pacific Time (US & Canada)' },
            { value: '(UTC-06:00) Central Time (US & Canada)', label: '(UTC-06:00) Central Time (US & Canada)' },
            { value: '(UTC-05:00) Eastern Time (US & Canada)', label: '(UTC-05:00) Eastern Time (US & Canada)' },
            { value: '(UTC+00:00) Coordinated Universal Time', label: '(UTC+00:00) Coordinated Universal Time' },
            { value: '(UTC+01:00) Amsterdam, Berlin, Bern, Rome', label: '(UTC+01:00) Amsterdam, Berlin, Bern, Rome' }
          ]
        },
        { kind: 'toggle', key: 'time.zoneAutomatic', label: 'Set time zone automatically', default: true }
      ]
    },
    {
      id: 'region',
      title: 'Region format',
      items: [
        {
          kind: 'select',
          key: 'time.regionFormat',
          label: 'Choose regional format:',
          default: 'Match OS',
          options: [
            { value: 'Match OS', label: 'Match OS' },
            { value: 'English (United States)', label: 'English (United States)' },
            { value: 'English (United Kingdom)', label: 'English (United Kingdom)' },
            { value: 'German (Germany)', label: 'German (Germany)' }
          ]
        }
      ]
    }
  ]
};

export var LANGUAGE_REGION = {
  id: 'languageRegion',
  title: 'Language & region',
  glyph: 'language',
  groups: [
    {
      id: 'display',
      title: 'Windows display language',
      items: [
        {
          kind: 'select',
          key: 'time.displayLanguage',
          label: 'Windows display language',
          default: 'English (United States)',
          options: [
            { value: 'English (United States)', label: 'English (United States)' },
            { value: 'Deutsch (Deutschland)', label: 'Deutsch (Deutschland)' },
            { value: 'EspaÃ±ol (EspaÃ±a)', label: 'EspaÃ±ol (EspaÃ±a)' }
          ]
        },
        {
          kind: 'select',
          key: 'time.inputMethod',
          label: 'Default input method',
          default: 'English (United States) - QWERTY keyboard layout',
          options: [
            { value: 'English (United States) - QWERTY keyboard layout', label: 'English (United States) - QWERTY keyboard layout' },
            { value: 'Deutsch (Deutschland) - QWERTZ keyboard layout', label: 'Deutsch (Deutschland) - QWERTZ keyboard layout' }
          ]
        }
      ]
    },
    {
      id: 'preferred',
      title: 'Preferred languages',
      items: [
        { kind: 'languageList', label: 'Preferred languages' },
        { kind: 'link', label: 'Add a language', action: 'time.addLanguage' }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Region', to: 'dateTime' },
        { kind: 'link', label: 'Administrative language settings', action: 'time.adminLanguage' }
      ]
    }
  ]
};

export var SPEECH = {
  id: 'speech',
  title: 'Speech',
  glyph: 'speech',
  groups: [
    {
      id: 'overview',
      title: 'Speech overview',
      items: [
        { kind: 'text', text: 'This computer has no speech recognizer or voice installed. Voice typing needs one, and Windows has none to offer.' }
      ]
    },
    {
      id: 'language',
      title: 'Speech language',
      items: [
        {
          kind: 'select',
          key: 'time.speechLanguage',
          label: 'Speech language',
          default: 'English (United States)',
          options: [
            { value: 'English (United States)', label: 'English (United States)' },
            { value: 'English (United Kingdom)', label: 'English (United Kingdom)' }
          ]
        },
        { kind: 'toggle', key: 'time.autoDetectLanguage', label: 'Automatically detect my language when I start talking', default: false }
      ]
    },
    {
      id: 'voice',
      title: 'Choose the default voice for speech synthesis',
      items: [
        {
          kind: 'select',
          key: 'time.voiceType',
          label: 'Voice',
          default: 'One Core Voice',
          options: [
            { value: 'One Core Voice', label: 'One Core Voice' },
            { value: 'Microsoft David - English (United States)', label: 'Microsoft David - English (United States)' }
          ]
        },
        { kind: 'slider', key: 'time.speechVolume', label: 'Volume', min: 0, max: 100, step: 1, suffix: '%', default: 100 },
        { kind: 'button', label: 'Test voice here', action: 'time.testVoice' }
      ]
    },
    {
      id: 'typing',
      title: 'Microsoft voice typing language',
      items: [
        {
          kind: 'select',
          key: 'time.voiceTypingLanguage',
          label: 'Voice typing language',
          default: 'English (United States)',
          options: [
            { value: 'English (United States)', label: 'English (United States)' },
            { value: 'English (United Kingdom)', label: 'English (United Kingdom)' }
          ]
        }
      ]
    }
  ]
};

export var TEXT_TO_SPEECH = {
  id: 'textToSpeech',
  title: 'Text to speech',
  glyph: 'textSpeech',
  groups: [
    {
      id: 'tts',
      title: 'Text to speech',
      items: [
        { kind: 'text', text: 'Windows Media Speech is not installed on this computer.' },
        { kind: 'button', label: 'Install speech features', action: 'time.installSpeech' }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Speech', to: 'speech' },
        { kind: 'link', label: 'Ease of Access > Speech', to: 'easeNarration' }
      ]
    }
  ]
};

export var INPUT_METHOD = {
  id: 'inputMethod',
  title: 'Typing, handwriting & input',
  glyph: 'input',
  groups: [
    {
      id: 'personalize',
      title: 'Personalize your text input settings',
      items: [
        { kind: 'toggle', key: 'time.textPrediction', label: 'Use text prediction', default: true },
        { kind: 'toggle', key: 'time.handwriting', label: 'Write with the pen in the text box', default: true }
      ]
    },
    {
      id: 'keyboard',
      title: 'Keyboard',
      items: [
        { kind: 'link', label: 'Add a keyboard', action: 'time.addKeyboard' },
        {
          kind: 'toggle',
          key: 'time.useOsTextInput',
          label: 'Let me use my computerâ€™s default text input settings',
          default: false
        }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Pen & Windows Ink', to: 'pen' },
        { kind: 'link', label: 'Typing', to: 'typing' }
      ]
    }
  ]
};

export var TIME_LANGUAGE = {
  id: 'time',
  title: 'Time & Language',
  blurb: 'Speech, region, date',
  glyph: 'timeLanguage',
  pages: [
    DATE_TIME,
    LANGUAGE_REGION,
    SPEECH,
    TEXT_TO_SPEECH,
    INPUT_METHOD
  ]
};