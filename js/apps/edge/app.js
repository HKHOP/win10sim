import { registerApp } from '../../core/apps.js';
import { EDGE_SRC } from '../../global/constants.js';
import { openEdge } from './edge.js';

// Microsoft Edge: registers itself on load; boot imports this module once so the
// taskbar, desktop and Start menu can launch it. The taskbar has been pinning a
// Microsoft Edge button since before there was an app behind it - this is it.

export var EDGE_APP_ID = 'edge';

registerApp({
  id: EDGE_APP_ID,
  name: 'Microsoft Edge',
  icon: EDGE_SRC,
  manifest: {
    publisher: 'Microsoft Corporation',
    version: '42.0.0.2062',
    description: 'A browser. On this computer it has no internet to browse.',
    // Edge keeps a profile, which lives in the profile's own store, and offers
    // to save pages and shortcuts, which are files.
    permissions: ['storage']
  },
  start: {
    subtitle: 'Windows',
    tile: { size: 'medium', background: '#0f6cbd', color: '#0f6cbd' }
  },
  launch: function (context, args) {
    return openEdge(context, args || {});
  }
});