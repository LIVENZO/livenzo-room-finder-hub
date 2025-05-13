
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add enhanced console logging for debugging
const originalConsoleLog = console.log;
console.log = function(...args) {
  const timestamp = new Date().toISOString();
  originalConsoleLog.apply(console, [`${timestamp} info:`, ...args]);
}

createRoot(document.getElementById("root")!).render(<App />);
