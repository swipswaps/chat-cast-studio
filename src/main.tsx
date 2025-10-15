// File: index.tsx
// PRF-COMPLIANT ENTRY POINT
// Wraps App in ErrorBoundary and logs all global errors for troubleshooting.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Global error listener for uncaught runtime errors
window.addEventListener('error', (event) => {
  console.error("[Global Error]", event.error || event.message, event.filename, event.lineno, event.colno);
});

// Global listener for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error("[Unhandled Promise Rejection]", event.reason);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Render App inside ErrorBoundary
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
