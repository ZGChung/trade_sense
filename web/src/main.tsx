import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Simple test - just render some text
function TestApp() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>TradeSense Loading...</h1>
      <p>If you see this, React is working!</p>
    </div>
  )
}

export default TestApp

// Global error handler for debugging
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', message, source, lineno, colno, error);
};

window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
});

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <TestApp />
    </StrictMode>,
  );
} else {
  console.error('Root element not found!');
}
