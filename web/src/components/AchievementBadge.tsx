import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Achievement } from "../models/achievements";

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  useEffect(() => {
    if (!achievement) {
      return;
    }

    const timer = window.setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [achievement, onClose]);

  if (!achievement) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.8 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-yellow-600 dark:to-orange-700 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4">
          <span className="text-4xl">{achievement.icon}</span>
          <div>
            <p className="text-xs uppercase tracking-wider opacity-90">成就解锁!</p>
            <p className="font-bold text-lg">{achievement.title}</p>
            <p className="text-sm opacity-90">{achievement.description}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-2 text-white/80 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

interface AchievementBadgeProps {
  count: number;
  total: number;
  onClick: () => void;
  className?: string;
}

export function AchievementBadge({ count, total, onClick, className = "" }: AchievementBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-3 py-2 text-sm font-semibold text-gray-700 shadow-md transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-200 dark:hover:bg-gray-800 ${className}`}
    >
      <span>🏅</span>
      <span>成就 {count}/{total}</span>
    </button>
  );
}
