import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Register PWA Service Worker for offline app shell and asset caching
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        // Check storage quota every 15 minutes or on initial registration
        if (registration.active) {
          registration.active.postMessage({ type: 'CHECK_STORAGE_QUOTA' });
        }
      })
      .catch((err) => {
        console.warn('PWA Service Worker registration skipped:', err);
      });
  });

  // Listen for storage quota warning messages from Service Worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'STORAGE_QUOTA_REPORT' && event.data.isCritical) {
      console.warn(
        `[Storage Alert] Local browser storage is at ${event.data.percentUsed}% capacity. Consider archiving older study packs.`
      );
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
