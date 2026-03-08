import { AnimatePresence, motion } from "framer-motion";
import { StatsView } from "./StatsView";

interface StatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  totalAttempts: number;
  currentStreak: number;
  maxStreak: number;
  formattedAccuracy: string;
}

export function StatsPanel({
  isOpen,
  onClose,
  totalAttempts,
  currentStreak,
  maxStreak,
  formattedAccuracy,
}: StatsPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-gray-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">训练统计</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="关闭统计"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <StatsView
                totalAttempts={totalAttempts}
                currentStreak={currentStreak}
                maxStreak={maxStreak}
                formattedAccuracy={formattedAccuracy}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
