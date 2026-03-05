import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// @ts-ignore
window.onerror = function(msg, url, line, col, error) {
  // @ts-ignore
  document.body.innerHTML = '<div style="padding:20px;color:red;"><h3>Error: ' + msg + '</h3><p>Line: ' + line + '</p></div>';
};

try {
  const root = document.getElementById('root');
  if (root) {
    createRoot(root).render(<App />);
  } else {
    document.body.innerHTML = '<div style="padding:20px;"><h3>Root not found</h3></div>';
  }
} catch(e) {
  // @ts-ignore
  document.body.innerHTML = '<div style="padding:20px;color:red;"><h3>Exception: ' + e.message + '</h3></div>';
}
