import { motion, AnimatePresence } from "framer-motion";
import { PredictionOptionEmoji } from "../models/types";
import type { WrongAnswer } from "../hooks/useWrongAnswers";

interface WrongAnswersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  wrongAnswers: WrongAnswer[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onPractice?: (answer: WrongAnswer) => void;
}

export function WrongAnswersPanel({ isOpen, onClose, wrongAnswers, onRemove, onClearAll, onPractice }: WrongAnswersPanelProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 z-50 shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  📝 错题本
                </h2>
                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-full">
                  {wrongAnswers.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {wrongAnswers.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-3">🎉</div>
                  <p>太棒了！</p>
                  <p className="text-sm">目前没有错题</p>
                </div>
              ) : (
                wrongAnswers.map((answer) => (
                  <motion.div
                    key={answer.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    {/* Stock info */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {answer.stockSymbol}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {answer.stockName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {onPractice && (
                          <button
                            onClick={() => onPractice(answer)}
                            className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm font-medium"
                          >
                            重练
                          </button>
                        )}
                        <button
                          onClick={() => onRemove(answer.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                        >
                          删除
                        </button>
                      </div>
                    </div>

                    {/* Event description */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {answer.eventGroup.events[0]?.description || "未知事件"}
                    </p>

                    {/* Prediction vs Answer */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 dark:text-gray-400">你的预测:</span>
                        <span className="font-medium text-red-600 dark:text-red-400">
                          {PredictionOptionEmoji[answer.userPrediction]} {answer.userPrediction}
                        </span>
                      </div>
                      <span className="text-gray-400">→</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 dark:text-gray-400">正确答案:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {PredictionOptionEmoji[answer.correctAnswer]} {answer.correctAnswer}
                        </span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="mt-2 text-xs text-gray-400">
                      {formatDate(answer.timestamp)}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {wrongAnswers.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClearAll}
                  className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
                >
                  清空错题本
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
