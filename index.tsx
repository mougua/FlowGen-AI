import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Suppress ResizeObserver loop errors which are benign but noisy in React Flow usage
const resizeObserverLoopErr = /ResizeObserver loop limit exceeded/;
const resizeObserverLoopCompletedErr = /ResizeObserver loop completed with undelivered notifications/;

// 1. Override console.error to intercept logged errors
const originalError = console.error;
console.error = (...args) => {
  if (
    args[0] && 
    typeof args[0] === 'string' && 
    (resizeObserverLoopErr.test(args[0]) || resizeObserverLoopCompletedErr.test(args[0]))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// 2. Intercept uncaught exceptions via window.onerror (returning true prevents default handling)
window.onerror = function(message, source, lineno, colno, error) {
  const msg = typeof message === 'string' ? message : '';
  if (resizeObserverLoopErr.test(msg) || resizeObserverLoopCompletedErr.test(msg)) {
    return true; 
  }
  return false;
};

// 3. Intercept error events
window.addEventListener('error', (e) => {
  const msg = e.message || '';
  if (
    resizeObserverLoopErr.test(msg) || 
    resizeObserverLoopCompletedErr.test(msg)
  ) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

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