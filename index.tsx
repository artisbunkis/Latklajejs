// IMPORTANT: For deployment to GitHub Pages (or any static host),
// you MUST run 'npm run build' and configure your hosting to serve
// the 'dist/' folder. Do NOT deploy this 'index.tsx' file directly.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);