import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsomorphicEffect } from "../hooks/useIsomorphicEffect";

export type PracticeMode = "casual" | "challenge" | "daily";

interface ModeSelectorProps {
  currentMode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  isVisible: boolean;
}

export function ModeSelector({ currentMode, onModeChange, isVisible }: ModeSelectorProps) {
  const [isClient, setIsClient] = useState(false);

  useIsomorphicEffect(() => {
    setIsClient(true);
  });

  if (!isClient || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-4 flex justify-center gap-2 flex-wrap"
      >
        <button
          onClick={() => onModeChange("casual")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentMode === "casual"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          🎯 练习模式
        </button>
        <button
          onClick={() => onModeChange("daily")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentMode === "daily"
              ? "bg-green-500 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          📅 每日挑战
        </button>
        <button
          onClick={() => onModeChange("challenge")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentMode === "challenge"
              ? "bg-purple-500 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          ⚡ 挑战模式
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

interface ModeBadgeProps {
  mode: PracticeMode;
}

export function ModeBadge({ mode }: ModeBadgeProps) {
  const getModeConfig = () => {
    switch (mode) {
      case "daily":
        return {
          bg: "bg-green-100 dark:bg-green-900/30",
          text: "text-green-700 dark:text-green-300",
          label: "📅 每日",
        };
      case "challenge":
        return {
          bg: "bg-purple-100 dark:bg-purple-900/30",
          text: "text-purple-700 dark:text-purple-300",
          label: "⚡ 挑战",
        };
      default:
        return {
          bg: "bg-blue-100 dark:bg-blue-900/30",
          text: "text-blue-700 dark:text-blue-300",
          label: "🎯 练习",
        };
    }
  };

  const config = getModeConfig();

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
