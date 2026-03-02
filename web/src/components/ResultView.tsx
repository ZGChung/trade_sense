import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { EventGroup, HistoricalEvent, PredictionOption } from "../models/types";
import { getFormattedPerformance, getPerformanceCategory } from "../models/types";
import { PredictionOptionEmoji } from "../models/types";
import { deepSeekService } from "../services/deepSeekService";
import { playSound, vibrate } from "../utils/sound";

interface ResultViewProps {
  eventGroup: EventGroup;
  event: HistoricalEvent;
  userPrediction: PredictionOption;
  onContinue: () => void;
  totalAttempts: number;
  correctPredictions: number;
}

export function ResultView({
  eventGroup,
  event,
  userPrediction,
  onContinue,
  totalAttempts,
  correctPredictions,
}: ResultViewProps) {
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  const isCorrect = userPrediction === getPerformanceCategory(event.actualPerformance);
  const resultColor = isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  const resultIcon = isCorrect ? "✓" : "✗";

  const accuracy = totalAttempts > 0 ? ((correctPredictions / totalAttempts) * 100).toFixed(1) : "0";
  const stockName = eventGroup.stockName;

  useEffect(() => {
    loadAIExplanation();
    // Play sound and vibrate on result shown
    if (isCorrect) {
      playSound('correct');
      vibrate('success');
    } else {
      playSound('wrong');
      vibrate('medium');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventGroup.id, event.id, userPrediction]);

  const loadAIExplanation = async () => {
    setIsLoadingExplanation(true);
    setExplanationError(null);

    try {
      const explanation = await deepSeekService.explainPredictionResult(
        eventGroup.events,
        eventGroup.stockName,
        getPerformanceCategory(event.actualPerformance),
        userPrediction,
        event.actualPerformance
      );
      setAiExplanation(explanation);
    } catch (error) {
      setExplanationError(
        error instanceof Error ? error.message : "获取解释失败"
      );
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="w-full p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg"
      >
        <div className="text-center space-y-4">
        <div className={`text-6xl ${resultColor}`}>{resultIcon}</div>
        <h2 className={`text-2xl font-bold ${resultColor}`}>
          {isCorrect ? "预测正确!" : "预测错误"}
        </h2>

        <div className="space-y-2">
          <p className="text-lg">
            你的预测: {userPrediction} {PredictionOptionEmoji[userPrediction]}
          </p>
          <p className="text-lg">
            实际结果: {getPerformanceCategory(event.actualPerformance)}{" "}
            {PredictionOptionEmoji[getPerformanceCategory(event.actualPerformance)]}
          </p>
          <p
            className={`text-xl font-semibold ${
              event.actualPerformance >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            涨跌幅: {getFormattedPerformance(event.actualPerformance)}
          </p>
        </div>

        {/* AI Explanation */}
        <div className="mt-6 text-left">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🧠</span>
            <h3 className="text-lg font-semibold">AI 分析解释</h3>
          </div>

          {isLoadingExplanation && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm">AI正在分析...</span>
            </div>
          )}

          {explanationError && (
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400">
              获取解释失败: {explanationError}
            </div>
          )}

          {!isLoadingExplanation && !explanationError && aiExplanation && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
              {aiExplanation}
            </div>
          )}
        </div>

        <button
          onClick={onContinue}
          className="w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors duration-200 mt-6"
        >
          继续练习
        </button>

        {/* Share Result */}
        <button
          onClick={() => {
            const text = `我在 TradeSense 预测 ${stockName}：${isCorrect ? "✅ 正确" : "❌ 错误"} | 正确率: ${accuracy}%`;
            navigator.clipboard.writeText(text);
            alert("已复制到剪贴板！");
          }}
          className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl transition-colors duration-200 mt-2"
        >
          📤 分享结果
        </button>
      </div>
      </motion.div>
    </AnimatePresence>
  );
}
