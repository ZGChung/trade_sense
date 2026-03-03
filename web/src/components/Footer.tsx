export function Footer() {
  return (
    <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">
      <p>TradeSense v1.0.0</p>
      <p className="mt-1">
        <a 
          href="https://github.com/ZGChung/trade_sense" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-blue-500 transition-colors"
        >
          GitHub
        </a>
        {' '}|{' '}
        <a 
          href="https://trade-sense-delta.vercel.app" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-blue-500 transition-colors"
        >
          在线版本
        </a>
      </p>
    </div>
  );
}
