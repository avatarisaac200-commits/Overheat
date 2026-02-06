
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Using a relative path './sw.js' ensures the worker is registered 
    // within the correct subdomain/origin in sandboxed environments.
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((error) => {
        // Fail gracefully if Service Workers are restricted (common in some preview environments)
        console.warn('ServiceWorker registration failed: ', error);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element to mount to");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
