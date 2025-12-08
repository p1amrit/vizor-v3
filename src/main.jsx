import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import * as buffer from 'buffer';

if (typeof window !== 'undefined') {
  window.Buffer = buffer.Buffer;
  window.process = {
    env: {},
    nextTick: (cb) => setTimeout(cb, 0)
  };
}

createRoot(document.getElementById('root')).render(
  <App />
)
