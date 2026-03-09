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

  return (
    <AnimatePresence>
      {achievement ? (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
        >
          <div className="w-[min(560px,calc(100vw-2rem))] min-w-[18rem] rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 px-5 py-4 text-white shadow-2xl dark:from-yellow-600 dark:to-orange-700">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 text-2xl leading-none">
                {achievement.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wider opacity-90">成就解锁!</p>
                <p className="text-lg font-bold leading-snug">{achievement.title}</p>
                <p className="text-sm leading-snug opacity-90">{achievement.description}</p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="关闭成就提示"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
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
