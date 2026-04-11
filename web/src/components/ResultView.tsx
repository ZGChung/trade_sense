import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { EventGroup, HistoricalEvent, PredictionOption } from "../models/types";
import { getFormattedPerformance, getPerformanceCategory, PredictionOptionEmoji } from "../models/types";
import { aiService, type AIExplanationResult } from "../services/aiService";

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
  const [aiResult, setAiResult] = useState<AIExplanationResult | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  const isCorrect = userPrediction === getPerformanceCategory(event.actualPerformance);
  const resultColor = isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  const resultIcon = isCorrect ? "✓" : "✗";

  const accuracy = totalAttempts > 0 ? ((correctPredictions / totalAttempts) * 100).toFixed(1) : "0";
  const stockName = eventGroup.stockName;

  const loadAIExplanation = useCallback(async () => {
    setIsLoadingExplanation(true);
    setExplanationError(null);

    try {
      const explanation = await aiService.explainPredictionResult(
        eventGroup.events,
        eventGroup.stockSymbol,
        eventGroup.stockName,
        getPerformanceCategory(event.actualPerformance),
        userPrediction,
        event.actualPerformance
      );
      setAiResult(explanation);
    } catch (error) {
      setExplanationError(error instanceof Error ? error.message : "获取解释失败");
      setAiResult(null);
    } finally {
      setIsLoadingExplanation(false);
    }
  }, [eventGroup.events, eventGroup.stockName, event.actualPerformance, userPrediction]);

  useEffect(() => {
    void loadAIExplanation();
  }, [loadAIExplanation, eventGroup.id, event.id]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="w-full rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-900"
      >
        <div className="space-y-4 text-center">
          <div className={`text-6xl ${resultColor}`}>{resultIcon}</div>
          <h2 className={`text-2xl font-bold ${resultColor}`}>{isCorrect ? "预测正确!" : "预测错误"}</h2>

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

          <div className="mt-6 text-left">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧠</span>
                <h3 className="text-lg font-semibold">AI 分析解释</h3>
              </div>
              {aiResult && (
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                  {aiResult.providerLabel}
                </span>
              )}
            </div>

            {isLoadingExplanation && (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-500" />
                <span className="text-sm">AI 正在分析...</span>
              </div>
            )}

            {explanationError && (
              <div className="rounded-lg bg-red-50 p-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                获取解释失败: {explanationError}
              </div>
            )}

            {!isLoadingExplanation && !explanationError && aiResult && (
              <div className="space-y-2">
                <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">{aiResult.text}</div>
                {aiResult.source === "static-template" && aiResult.errorMessage && (
                  <p className="text-xs text-amber-600 dark:text-amber-300">
                    AI 服务暂时不可用，已自动降级为静态模板。
                  </p>
                )}
              </div>
            )}

            {!isLoadingExplanation && (
              <button
                onClick={() => void loadAIExplanation()}
                className="mt-3 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                重新生成解释
              </button>
            )}
          </div>

          <button
            onClick={onContinue}
            className="mt-6 h-12 w-full rounded-xl bg-blue-500 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-600"
          >
            继续练习
          </button>

          <button
            onClick={() => {
              const text = `我在 TradeSense 预测 ${stockName}：${isCorrect ? "✅ 正确" : "❌ 错误"} | 正确率: ${accuracy}%`;
              navigator.clipboard.writeText(text);
              const toast = document.createElement("div");
              toast.className =
                "animate-fade-in fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-white dark:text-gray-900";
              toast.textContent = "已复制到剪贴板！";
              document.body.appendChild(toast);
              setTimeout(() => toast.remove(), 2000);
            }}
            className="mt-2 h-12 w-full rounded-xl bg-gray-100 px-4 text-sm font-semibold text-gray-600 transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            📤 分享结果
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
