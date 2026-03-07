import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsomorphicEffect } from "../hooks/useIsomorphicEffect";

export type PracticeMode = "casual" | "challenge" | "daily";

interface ModeSelectorProps {
  currentMode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  isVisible?: boolean;
  showLeaderboardButton?: boolean;
  leaderboardOpen?: boolean;
  onLeaderboardClick?: () => void;
}

function modeButtonClass(isActive: boolean, accent: "blue" | "green" | "amber") {
  const accentMap = {
    blue: "border-blue-400/70 bg-blue-600 text-white shadow-blue-500/30",
    green: "border-emerald-400/70 bg-emerald-600 text-white shadow-emerald-500/30",
    amber: "border-amber-400/70 bg-amber-600 text-white shadow-amber-500/30",
  } as const;

  if (isActive) {
    return `${accentMap[accent]} shadow-md`;
  }

  return "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-800";
}

export function ModeSelector({
  currentMode,
  onModeChange,
  isVisible = true,
  showLeaderboardButton = false,
  leaderboardOpen = false,
  onLeaderboardClick,
}: ModeSelectorProps) {
  const [isClient, setIsClient] = useState(false);

  useIsomorphicEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="mb-3 flex flex-wrap items-center justify-center gap-2"
      >
        <button
          onClick={() => onModeChange("casual")}
          className={`inline-flex h-11 min-w-[118px] items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-all ${modeButtonClass(
            currentMode === "casual",
            "blue"
          )}`}
        >
          练习模式
        </button>
        <button
          onClick={() => onModeChange("daily")}
          className={`inline-flex h-11 min-w-[118px] items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-all ${modeButtonClass(
            currentMode === "daily",
            "green"
          )}`}
        >
          每日挑战
        </button>
        <button
          onClick={() => onModeChange("challenge")}
          className={`inline-flex h-11 min-w-[118px] items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-all ${modeButtonClass(
            currentMode === "challenge",
            "amber"
          )}`}
        >
          挑战模式
        </button>

        {showLeaderboardButton && onLeaderboardClick && (
          <button
            onClick={onLeaderboardClick}
            className={`inline-flex h-11 min-w-[118px] items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors ${
              leaderboardOpen
                ? "border-indigo-400/70 bg-indigo-600 text-white"
                : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
            }`}
            aria-label={leaderboardOpen ? "隐藏排行榜" : "显示排行榜"}
          >
            排行榜
          </button>
        )}
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
          bg: "bg-amber-100 dark:bg-amber-900/30",
          text: "text-amber-700 dark:text-amber-300",
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
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
