
import React from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'

// Add enhanced console logging for debugging
const originalConsoleLog = console.log;
console.log = function(...args) {
  const timestamp = new Date().toISOString();
  originalConsoleLog.apply(console, [`${timestamp} info:`, ...args]);
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
