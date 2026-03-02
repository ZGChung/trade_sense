import { motion } from "framer-motion";
import { usePracticeHistory } from "../hooks/usePracticeHistory";
import type { PracticeRecord } from "../hooks/usePracticeHistory";

interface HistoryPanelProps {
  onClose: () => void;
}

export function HistoryPanel({ onClose }: HistoryPanelProps) {
  const { history, todayRecords, weeklyStats, clearHistory } = usePracticeHistory();

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'casual': return '🏠 练习';
      case 'challenge': return '🎯 挑战';
      case 'daily': return '📅 每日';
      default: return mode;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' + 
           date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            📊 练习历史
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {todayRecords.length}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">今日练习</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {weeklyStats.avgAccuracy}%
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">平均正确率</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {weeklyStats.bestScore}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">最高分</div>
            </div>
          </div>

          {/* History List */}
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-4xl mb-2">📝</p>
              <p>还没有练习记录</p>
              <p className="text-sm">完成练习后会显示在这里</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((record: PracticeRecord) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(record.date)}
                    </span>
                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-medium">
                      {getModeLabel(record.mode)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {record.correctAnswers}/{record.totalQuestions}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {record.accuracy}% {record.maxStreak ? `| 最高${record.maxStreak}连` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {history.length > 0 && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(history, null, 2);
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `tradesense-history-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm"
              >
                📥 导出数据
              </button>
              <button
                onClick={clearHistory}
                className="flex-1 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
              >
                🗑️ 清空记录
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
