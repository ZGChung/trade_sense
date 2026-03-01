import { motion } from 'framer-motion';
import type { Achievement } from '../models/achievements';

interface AchievementPanelProps {
  unlocked: Achievement[];
  locked: Achievement[];
  onClose: () => void;
}

export function AchievementPanel({ unlocked, locked, onClose }: AchievementPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">🏅 成就</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>
          <p className="opacity-90 mt-1">
            已解锁 {unlocked.length} / {unlocked.length + locked.length}
          </p>
        </div>

        {/* Achievement List */}
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
          {/* Unlocked */}
          {unlocked.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                已解锁
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {unlocked.map((achievement) => (
                  <AchievementItem key={achievement.id} achievement={achievement} unlocked />
                ))}
              </div>
            </div>
          )}

          {/* Locked */}
          {locked.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                未解锁
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {locked.map((achievement) => (
                  <AchievementItem key={achievement.id} achievement={achievement} unlocked={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

interface AchievementItemProps {
  achievement: Achievement;
  unlocked: boolean;
}

function AchievementItem({ achievement, unlocked }: AchievementItemProps) {
  return (
    <div
      className={`p-3 rounded-xl flex items-center gap-3 ${
        unlocked
          ? 'bg-yellow-50 dark:bg-yellow-900/20'
          : 'bg-gray-100 dark:bg-gray-800 opacity-60'
      }`}
    >
      <span className="text-2xl">{unlocked ? achievement.icon : '🔒'}</span>
      <div className="flex-1">
        <p className={`font-semibold ${unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
          {achievement.title}
        </p>
        <p className={`text-sm ${unlocked ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
          {achievement.description}
        </p>
      </div>
    </div>
  );
}
