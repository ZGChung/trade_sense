import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type PracticeMode = "casual" | "challenge";

interface ModeSelectorProps {
  currentMode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  isVisible: boolean;
}

export function ModeSelector({ currentMode, onModeChange, isVisible }: ModeSelectorProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-4 flex justify-center gap-2"
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
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
        mode === "challenge"
          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      }`}
    >
      {mode === "challenge" ? "⚡ 挑战" : "🎯 练习"}
    </span>
  );
}
