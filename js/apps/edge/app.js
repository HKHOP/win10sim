// Microsoft Edge: registers itself on load; boot imports this module once so
// the taskbar, desktop and Start menu can launch it. The taskbar has been pinning
// a Microsoft Edge button since before there was an app behind it - this is it.

import { registerApp } from '../../core/apps.js';
import { EDGE_SRC } from '../../global/constants.js';
import { openEdge } from './edge.js';

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
    permissions: ['storage'],
    // The file types Edge opens. These are what make a double-click on a .html
    // on the desktop open in Edge rather than in whatever else claims text - the
    // same way a registered app writes its own ProgIDs into HKCR.
    //
    // Documents only. An image is not a thing a browser opens, and Edge downloads
    // nothing in this world, so a file it did not already have is a file it
    // cannot have, whatever a web address on it might say.
    associations: [
      {
        ext: ['html', 'htm', 'xhtml', 'svg'],
        type: 'HTML Document',
        role: 'editor'
      }
    ]
  },
  start: {
    subtitle: 'Windows',
    tile: { size: 'medium', background: '#0f6cbd', color: '#0f6cbd' }
  },
  // A file association hands the app a path. A browser's own answer to a path is
  // the file: address for it, so Explorer, the desktop and the shell's "open
  // with" all arrive in the same place - and openEdge turns the path into that
  // address itself.
  launch: function (context, args) {
    return openEdge(context, args || {});
  }
});