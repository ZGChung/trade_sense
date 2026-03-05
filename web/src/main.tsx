import { createRoot } from 'react-dom/client'
import './index.css'

function SimpleApp() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#3b82f6' }}>📈 TradeSense</h1>
      <p>Loading...</p>
    </div>
  )
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<SimpleApp />);
}
