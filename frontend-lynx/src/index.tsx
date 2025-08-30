import '@lynx-js/preact-devtools';
import '@lynx-js/react/debug';
import { root } from '@lynx-js/react';

import { App } from './App.jsx';

// Initialize the app
root.render(<App />);

// Hot reload support
if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}
