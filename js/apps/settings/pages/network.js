// The Network & Internet category, and the Phone category beside it.
//
// Every page here is reporting that there is no network, because there is no
// network. That is the honest answer and it is also the one Windows gives on a
// machine that has never been connected - so the pages say it in Windows' words
// rather than pretending a connection exists.

export var WIFI = {
  id: 'wifi',
  title: 'Wi-Fi',
  glyph: 'wifi',
  groups: [
    {
      id: 'wifi',
      title: 'Wi-Fi',
      items: [
        { kind: 'toggle', key: 'network.wifi', label: 'Wi-Fi', default: true },
        { kind: 'note', text: 'No Wi-Fi networks are available. This computer has no network adapter in it.' }
      ]
    },
    {
      id: 'properties',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Airplane mode', to: 'airplane' },
        { kind: 'link', label: 'Mobile hotspot', to: 'hotspot' },
        { kind: 'link', label: 'Data usage', to: 'datausage' }
      ]
    }
  ]
};

export var ETHERNET = {
  id: 'ethernet',
  title: 'Ethernet',
  glyph: 'ethernet',
  groups: [
    {
      id: 'ethernet',
      title: 'Ethernet',
      items: [
        { kind: 'toggle', key: 'network.ethernet', label: 'Ethernet', default: false },
        { kind: 'note', text: 'No network adapter in this computer.' }
      ]
    }
  ]
};

export var VPN = {
  id: 'vpn',
  title: 'VPN',
  glyph: 'vpn',
  groups: [
    {
      id: 'vpn',
      title: 'VPN',
      items: [
        { kind: 'toggle', key: 'network.vpn', label: 'VPN', default: false },
        { kind: 'button', label: 'Add a VPN connection', action: 'vpn.add', variant: 'primary' }
      ]
    },
    {
      id: 'properties',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'VPN settings', action: 'vpn.settings' },
        { kind: 'link', label: 'Resolve network problems', to: 'troubleshoot' }
      ]
    }
  ]
};

export var HOTSPOT = {
  id: 'hotspot',
  title: 'Mobile hotspot',
  glyph: 'hotspot',
  groups: [
    {
      id: 'hotspot',
      title: 'Mobile hotspot',
      items: [
        { kind: 'toggle', key: 'network.hotspot', label: 'Mobile hotspot', default: false },
        { kind: 'note', text: 'You can’t turn on mobile hotspot because this computer has no network adapter.' },
        {
          kind: 'select',
          key: 'network.hotspotBand',
          label: 'Network band',
          default: '2.4 GHz',
          options: [
            { value: '2.4 GHz', label: '2.4 GHz' },
            { value: '5 GHz', label: '5 GHz' }
          ]
        }
      ]
    },
    {
      id: 'share',
      title: 'Share my internet connection from',
      items: [
        {
          kind: 'select',
          key: 'network.hotspotShare',
          label: 'Share my internet connection from',
          default: 'None',
          options: [{ value: 'None', label: 'None' }]
        }
      ]
    }
  ]
};

export var AIRPLANE = {
  id: 'airplane',
  title: 'Airplane mode',
  glyph: 'airplane',
  groups: [
    {
      id: 'airplane',
      title: 'Airplane mode',
      items: [
        { kind: 'toggle', key: 'network.airplane', label: 'Airplane mode', default: false },
        { kind: 'note', text: 'Turn on airplane mode to stop all wireless communication.' }
      ]
    },
    {
      id: 'wifi',
      title: 'Wi-Fi',
      items: [
        { kind: 'toggle', key: 'network.wifi', label: 'Wi-Fi', default: true }
      ]
    },
    {
      id: 'properties',
      title: 'Related settings',
      items: [
        { kind: 'link', label: 'Mobile hotspot', to: 'hotspot' },
        { kind: 'link', label: 'Airplane mode settings', action: 'airplane.settings' }
      ]
    }
  ]
};

export var DATA_USAGE = {
  id: 'datausage',
  title: 'Data usage',
  glyph: 'dataUsage',
  groups: [
    {
      id: 'last30',
      title: 'Data usage in the last 30 days',
      items: [
        { kind: 'note', text: 'No data has been used in the last 30 days. There is no network on this computer to have used any.' },
        { kind: 'dataUsage', label: 'Data usage', rows: [
          { name: 'Microsoft Edge', bytes: 0 },
          { name: 'Microsoft Store', bytes: 0 },
          { name: 'Settings', bytes: 0 },
          { name: 'System', bytes: 0 }
        ] }
      ]
    },
    {
      id: 'usage',
      title: 'Data usage details',
      items: [
        { kind: 'toggle', key: 'network.dataUsageShow', label: 'Show data usage details for all apps', default: false }
      ]
    }
  ]
};

export var NETWORK = {
  id: 'network',
  title: 'Network & Internet',
  blurb: 'WiFi, flight mode, VPN',
  glyph: 'network',
  pages: [
    WIFI,
    ETHERNET,
    VPN,
    HOTSPOT,
    AIRPLANE,
    DATA_USAGE
  ]
};

export var PHONE = {
  id: 'phone',
  title: 'Phone',
  blurb: 'Link your Android, iPhone',
  glyph: 'phone',
  pages: [
    {
      id: 'phone',
      title: 'Phone',
      glyph: 'phone',
      groups: [
        {
          id: 'add',
          title: 'Add a mobile device',
          items: [
            { kind: 'button', label: 'Add a mobile device', action: 'phone.add' },
            { kind: 'note', text: 'No mobile devices are paired with this PC.' }
          ]
        },
        {
          id: 'related',
          title: 'Related settings',
          items: [
            { kind: 'link', label: 'Windows Cloud Discovery', action: 'phone.cloudDiscovery' }
          ]
        }
      ]
    }
  ]
};