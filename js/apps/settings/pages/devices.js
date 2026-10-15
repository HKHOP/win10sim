// The Devices category: the hardware attached to the machine, and the switches
// that decide how Windows treats it.

export var BLUETOOTH_DEVICES = {
  id: 'bluetooth',
  title: 'Bluetooth & other devices',
  glyph: 'bluetooth',
  groups: [
    {
      id: 'bluetooth',
      title: 'Bluetooth',
      items: [
        { kind: 'toggle', key: 'devices.bluetooth', label: 'Bluetooth', default: true },
        { kind: 'toggle', key: 'devices.bluetoothDiscoverable', label: 'Make this PC discoverable as long as it’s switched on', default: false }
      ]
    },
    {
      id: 'devices',
      title: 'Devices',
      items: [
        { kind: 'deviceList', label: 'Your devices', source: 'bluetooth' },
        { kind: 'button', label: 'Add a device', action: 'devices.bluetooth.add' }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Devices & Printers', action: 'devices.open' },
        { kind: 'link', label: 'Device manager', action: 'devices.manager' }
      ]
    }
  ]
};

export var PRINTERS = {
  id: 'printers',
  title: 'Printers & scanners',
  glyph: 'printers',
  groups: [
    {
      id: 'add',
      title: 'Add a printer or scanner',
      items: [
        { kind: 'button', label: 'Add a printer or scanner', action: 'printers.add', variant: 'primary' }
      ]
    },
    {
      id: 'list',
      title: 'Printers & scanners',
      items: [
        { kind: 'deviceList', label: 'Printers & scanners', source: 'printers' }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Bluetooth & other devices', to: 'bluetooth' },
        { kind: 'link', label: 'Devices & Printers', action: 'devices.open' }
      ]
    }
  ]
};

export var CAMERAS = {
  id: 'cameras',
  title: 'Cameras',
  glyph: 'cameras',
  groups: [
    {
      id: 'network',
      title: 'Add network cameras',
      items: [
        { kind: 'button', label: 'Add a network camera', action: 'cameras.addNetwork' }
      ]
    },
    {
      id: 'list',
      title: 'Cameras',
      items: [
        {
          kind: 'cameraList',
          label: 'Cameras',
          cameras: [
            { name: 'Integrated Camera', enabled: true, key: 'devices.camera.integrated' },
            { name: 'Integrated Camera (Secondary)', enabled: false, key: 'devices.camera.secondary' }
          ]
        }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Bluetooth & other devices', to: 'bluetooth' }
      ]
    }
  ]
};

export var MOUSE = {
  id: 'mouse',
  title: 'Mouse',
  glyph: 'mouse',
  groups: [
    {
      id: 'buttons',
      title: 'Additional mouse settings',
      items: [
        {
          kind: 'select',
          key: 'mouse.buttons',
          label: 'Choose how many buttons to show on the mouse',
          default: '3',
          options: [
            { value: '3', label: '3' },
            { value: '4', label: '4' },
            { value: '5', label: '5' }
          ]
        },
        {
          kind: 'select',
          key: 'mouse.doubleClickSpeed',
          label: 'Double-click speed',
          default: 'Medium',
          options: [
            { value: 'Slow', label: 'Slow' },
            { value: 'Medium', label: 'Medium' },
            { value: 'Fast', label: 'Fast' }
          ]
        },
        {
          kind: 'select',
          key: 'mouse.pointThreshold',
          label: 'Threshold to start selecting text',
          default: 'Medium',
          options: [
            { value: 'Low', label: 'Low' },
            { value: 'Medium', label: 'Medium' },
            { value: 'High', label: 'High' }
          ]
        }
      ]
    },
    {
      id: 'touchpad',
      title: 'Let the mouse be used when no mouse is attached',
      items: [
        {
          kind: 'toggle',
          key: 'mouse.alwaysOn',
          label: 'Allow mouse to be used when no mouse is attached',
          default: true
        }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Touchpad', to: 'touchpad' },
        { kind: 'link', label: 'Pen & Windows Ink', to: 'pen' }
      ]
    }
  ]
};

export var TOUCHPAD = {
  id: 'touchpad',
  title: 'Touchpad',
  glyph: 'touchpad',
  groups: [
    {
      id: 'tactile',
      title: 'Touchpad',
      items: [
        {
          kind: 'toggle',
          key: 'touchpad.tactile',
          label: 'Tactile feedback for the touchpad',
          default: false
        },
        {
          kind: 'toggle',
          key: 'touchpad.tapToClick',
          label: 'Tap the touchpad with one finger to click',
          default: true
        },
        {
          kind: 'toggle',
          key: 'touchpad.twoFingerScroll',
          label: 'Scroll direction',
          default: false
        }
      ]
    },
    {
      id: 'gestures',
      title: 'Gestures',
      items: [
        {
          kind: 'toggle',
          key: 'touchpad.twoFingerZoom',
          label: 'Pinch and zoom',
          default: true
        },
        {
          kind: 'toggle',
          key: 'touchpad.threeFingerSwipe',
          label: 'Three-finger swipe',
          default: false
        },
        {
          kind: 'toggle',
          key: 'touchpad.twoFingerTap',
          label: 'Two-finger tap to right-click',
          default: false
        }
      ]
    },
    {
      id: 'sensitivity',
      title: 'Touchpad sensitivity',
      items: [
        {
          kind: 'slider',
          key: 'touchpad.sensitivity',
          label: 'Tap and drag',
          min: 0,
          max: 5,
          step: 1,
          suffix: '',
          default: 3
        }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Mouse', to: 'mouse' },
        { kind: 'link', label: 'Pen & Windows Ink', to: 'pen' }
      ]
    }
  ]
};

export var TYPING = {
  id: 'typing',
  title: 'Typing',
  glyph: 'typing',
  groups: [
    {
      id: 'touchkeyboard',
      title: 'Touch keyboard',
      items: [
        {
          kind: 'toggle',
          key: 'typing.showTouchKeyboard',
          label: 'Show the touch keyboard when there’s no keyboard attached',
          default: false
        },
        {
          kind: 'toggle',
          key: 'typing.tapToType',
          label: 'Tap to type',
          default: false
        },
        {
          kind: 'toggle',
          key: 'typing.suggestions',
          label: 'Show text suggestions as I type',
          default: true
        },
        {
          kind: 'toggle',
          key: 'typing.autocorrect',
          label: 'Use spell check and autocorrect',
          default: false
        },
        {
          kind: 'toggle',
          key: 'typing.clipboardSuggestions',
          label: 'Show clipboard history button',
          default: true
        }
      ]
    },
    {
      id: 'handwriting',
      title: 'Pen & Windows Ink',
      items: [
        { kind: 'toggle', key: 'typing.inkToText', label: 'Write with the pen in the text box', default: true },
        { kind: 'link', label: 'Pen & Windows Ink settings', to: 'pen' }
      ]
    }
  ]
};

export var PEN = {
  id: 'pen',
  title: 'Pen & Windows Ink',
  glyph: 'pen',
  groups: [
    {
      id: 'palm',
      title: 'For a pen',
      items: [
        {
          kind: 'toggle',
          key: 'pen.palmRejection',
          label: 'Ignore touch input when a pen is in use',
          default: true
        },
        {
          kind: 'toggle',
          key: 'pen.alwaysShowInk',
          label: 'Show the pen toolbar',
          default: true
        }
      ]
    },
    {
      id: 'button',
      title: 'Pen button actions',
      items: [
        {
          kind: 'select',
          key: 'pen.buttonAction',
          label: 'When I press the pen barrel button',
          default: 'Nothing',
          options: [
            { value: 'Nothing', label: 'Nothing' },
            { value: 'Eraser', label: 'Eraser' },
            { value: 'Barrel eraser', label: 'Barrel eraser' },
            { value: 'Selection', label: 'Selection' },
            { value: 'Scroll', label: 'Scroll' }
          ]
        }
      ]
    },
    {
      id: 'pressure',
      title: 'For a touch screen (when available)',
      items: [
        {
          kind: 'toggle',
          key: 'pen.pressure',
          label: 'Use pressure-sensitive pen strokes',
          default: true
        },
        {
          kind: 'toggle',
          key: 'pen.tilt',
          label: 'Use tilt for inking',
          default: true
        }
      ]
    }
  ]
};

export var AUTOPLAY = {
  id: 'autoplay',
  title: 'AutoPlay',
  glyph: 'autoplay',
  groups: [
    {
      id: 'autoplay',
      title: 'Choose auto-play settings',
      items: [
        {
          kind: 'toggle',
          key: 'autoplay.enabled',
          label: 'Let me choose what media or device to auto-play',
          default: true
        },
        {
          kind: 'select',
          key: 'autoplay.photos',
          label: 'Photos',
          default: 'Take action',
          options: [
            { value: 'Ask me every time', label: 'Ask me every time' },
            { value: 'Take action', label: 'Take action' },
            { value: 'Do nothing', label: 'Do nothing' }
          ]
        },
        {
          kind: 'select',
          key: 'autoplay.videos',
          label: 'Videos',
          default: 'Play',
          options: [
            { value: 'Ask me every time', label: 'Ask me every time' },
            { value: 'Play', label: 'Play' },
            { value: 'Do nothing', label: 'Do nothing' }
          ]
        },
        {
          kind: 'select',
          key: 'autoplay.music',
          label: 'Music',
          default: 'Ask me every time',
          options: [
            { value: 'Ask me every time', label: 'Ask me every time' },
            { value: 'Play', label: 'Play' },
            { value: 'Do nothing', label: 'Do nothing' }
          ]
        },
        {
          kind: 'select',
          key: 'autoplay.exe',
          label: 'Mixed media',
          default: 'Ask me every time',
          options: [
            { value: 'Ask me every time', label: 'Ask me every time' },
            { value: 'Play', label: 'Play' },
            { value: 'Do nothing', label: 'Do nothing' }
          ]
        }
      ]
    },
    {
      id: 'reset',
      title: 'Reset',
      items: [
        { kind: 'button', label: 'Reset all AutoPlay settings', action: 'autoplay.reset' },
        { kind: 'button', label: 'Turn off AutoPlay', action: 'autoplay.off' }
      ]
    }
  ]
};

export var USB = {
  id: 'usb',
  title: 'USB',
  glyph: 'usb',
  groups: [
    {
      id: 'notifications',
      title: 'USB device notifications',
      items: [
        {
          kind: 'toggle',
          key: 'usb.notifications',
          label: 'Notify me when a USB storage device is connected',
          default: true
        },
        {
          kind: 'toggle',
          key: 'usb.powerSaving',
          label: 'Allow the computer to turn off the device to save power',
          default: false
        }
      ]
    },
    {
      id: 'related',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Bluetooth & other devices', to: 'bluetooth' },
        { kind: 'link', label: 'Power & sleep', to: 'power' }
      ]
    }
  ]
};

export var DEVICES = {
  id: 'devices',
  title: 'Devices',
  blurb: 'Bluetooth, printers, mouse',
  glyph: 'devices',
  pages: [
    BLUETOOTH_DEVICES,
    PRINTERS,
    CAMERAS,
    MOUSE,
    TOUCHPAD,
    TYPING,
    PEN,
    AUTOPLAY,
    USB
  ]
};