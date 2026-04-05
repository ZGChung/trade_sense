import { motion, AnimatePresence } from "framer-motion";
import { useDailyQuests, type DailyQuest } from "../hooks/useDailyQuests";

interface QuestPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function QuestCard({ quest }: { quest: DailyQuest }) {
  const progressPercent = (quest.progress / quest.target) * 100;

  return (
    <div
      className={`p-3 rounded-lg border-2 transition-all ${
        quest.completed
          ? "bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-600"
          : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">{quest.title}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">{quest.description}</p>
        </div>
        {quest.completed && (
          <span className="text-green-600 text-sm font-bold">✓</span>
        )}
      </div>

      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`absolute left-0 top-0 h-full rounded-full ${
            quest.completed ? "bg-green-500" : "bg-blue-500"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs">
        <span className="text-gray-500 dark:text-gray-400">
          {quest.progress} / {quest.target}
        </span>
        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
          +{quest.reward} 金币
        </span>
      </div>
    </div>
  );
}

export function QuestPanel({ isOpen, onClose }: QuestPanelProps) {
  const { quests, totalReward } = useDailyQuests();

  const completedCount = quests.filter((q) => q.completed).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl z-50 overflow-y-auto"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    📜 每日任务
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {completedCount} / {quests.length} 完成
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Total Reward */}
              <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      今日获得金币
                    </p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {totalReward}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quest List */}
              <div className="space-y-3">
                {quests.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  任务每天 0:00 重置，完成任务可获得金币奖励
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}