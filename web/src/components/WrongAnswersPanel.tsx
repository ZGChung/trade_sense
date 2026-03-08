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

export function WrongAnswersPanel({
  isOpen,
  onClose,
  wrongAnswers,
  onRemove,
  onClearAll,
  onPractice,
}: WrongAnswersPanelProps) {
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
            className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">错题本</h2>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {wrongAnswers.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="关闭错题本"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {wrongAnswers.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <p>太棒了！目前没有错题</p>
                </div>
              ) : (
                wrongAnswers.map((answer) => (
                  <motion.div
                    key={answer.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{answer.stockSymbol}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{answer.stockName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {onPractice && (
                          <button
                            onClick={() => onPractice(answer)}
                            className="text-sm font-medium text-blue-500 transition-colors hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            重练
                          </button>
                        )}
                        <button
                          onClick={() => onRemove(answer.id)}
                          className="text-sm text-gray-400 transition-colors hover:text-red-500"
                        >
                          删除
                        </button>
                      </div>
                    </div>

                    <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
                      {answer.eventGroup.events[0]?.description || "未知事件"}
                    </p>

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

                    <div className="mt-2 text-xs text-gray-400">{formatDate(answer.timestamp)}</div>
                  </motion.div>
                ))
              )}
            </div>

            {wrongAnswers.length > 0 && (
              <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                <button
                  onClick={onClearAll}
                  className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  清空错题本
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
