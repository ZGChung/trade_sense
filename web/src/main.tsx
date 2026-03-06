import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('TradeSense: Starting...'); // v1.1.0

try {
  const root = document.getElementById('root');
  if (!root) {
    document.body.innerHTML = '<div style="padding:20px;color:red;">Root not found!</div>';
  } else {
    createRoot(root).render(<App />);
    console.log('TradeSense: Rendered successfully');
  }
} catch (e: unknown) {
  console.error('TradeSense Error:', e);
  const message = e instanceof Error ? e.message : String(e);
  document.body.innerHTML = '<div style="padding:20px;color:red;">Error: ' + message + '</div>';
}
