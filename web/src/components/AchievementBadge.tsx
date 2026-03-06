import { motion, AnimatePresence } from 'framer-motion';
import type { Achievement } from '../models/achievements';

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
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
}

export function AchievementBadge({ count, total, onClick }: AchievementBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="fixed top-4 right-4 z-40 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-md"
    >
      <span className="text-lg">🏅</span>
      <span className="font-semibold text-sm">
        {count}/{total}
      </span>
    </button>
  );
}
