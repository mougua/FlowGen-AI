import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Suppress ResizeObserver loop errors which are benign but noisy in React Flow usage
const resizeObserverLoopErr = /ResizeObserver loop limit exceeded/;
const resizeObserverLoopCompletedErr = /ResizeObserver loop completed with undelivered notifications/;

const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' && 
    (resizeObserverLoopErr.test(args[0]) || resizeObserverLoopCompletedErr.test(args[0]))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

window.addEventListener('error', (e) => {
  if (
    resizeObserverLoopErr.test(e.message) || 
    resizeObserverLoopCompletedErr.test(e.message)
  ) {
    e.stopImmediatePropagation();
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