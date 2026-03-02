import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TIPS = [
  "📈 使用键盘快捷键：W涨 S跌 A平",
  "💡 每天练习，建立你的交易直觉",
  "🎯 连续答对题数越多，成就越高",
  "📊 点击底部📊查看你的统计数据",
  "🔊 尝试开启音效获得更好体验",
];

// Use deterministic index based on date
const getTipOfTheDay = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return TIPS[dayOfYear % TIPS.length];
};

// Subscribe to localStorage
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};
const getClientSnapshot = () => {
  const hasVisited = typeof window !== "undefined" && localStorage.getItem("tradesense_visited");
  const dismissed = typeof window !== "undefined" && localStorage.getItem("tradesense_welcome_dismissed");
  return { hasVisited: !!hasVisited, dismissed: !!dismissed };
};
const getServerSnapshot = () => ({ hasVisited: false, dismissed: false });

export function WelcomeBanner() {
  const { hasVisited, dismissed } = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const [show, setShow] = useState(!hasVisited && !dismissed);
  const tip = getTipOfTheDay();
  
  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("tradesense_welcome_dismissed", "true");
  };
  
  if (dismissed) return null;
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-4 p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">🎉 欢迎来到 TradeSense</h3>
              <p className="text-sm mt-1 opacity-90">{tip}</p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white text-xl leading-none"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
