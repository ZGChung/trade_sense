import type { PredictionOption } from "../models/types";
import { PredictionOption as PredictionOptionValues, PredictionOptionEmoji } from "../models/types";
import { playSound, vibrate } from "../utils/sound";

interface PredictionButtonProps {
  option: PredictionOption;
  isSelected: boolean;
  onClick: () => void;
}

function getStyle(option: PredictionOption, isSelected: boolean) {
  if (option === PredictionOptionValues.RISE) {
    return isSelected
      ? "border-green-500 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-green-200 dark:border-green-400 dark:from-green-900/50 dark:to-emerald-900/40 dark:text-green-200"
      : "border-green-300 bg-white text-green-700 hover:border-green-400 hover:shadow-green-100 dark:border-green-800 dark:bg-gray-900 dark:text-green-300";
  }

  if (option === PredictionOptionValues.FALL) {
    return isSelected
      ? "border-red-500 bg-gradient-to-r from-red-100 to-rose-100 text-red-800 shadow-red-200 dark:border-red-400 dark:from-red-900/50 dark:to-rose-900/40 dark:text-red-200"
      : "border-red-300 bg-white text-red-700 hover:border-red-400 hover:shadow-red-100 dark:border-red-800 dark:bg-gray-900 dark:text-red-300";
  }

  return isSelected
    ? "border-slate-500 bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 shadow-slate-200 dark:border-slate-400 dark:from-slate-800 dark:to-gray-800 dark:text-slate-200"
    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:shadow-slate-100 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-300";
}

export function PredictionButton({ option, isSelected, onClick }: PredictionButtonProps) {
  return (
    <button
      onClick={() => {
        playSound("click");
        vibrate("light");
        onClick();
      }}
      className={`group w-full rounded-2xl border-[2.5px] px-5 py-4 shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:ring-white/5 dark:focus:ring-offset-gray-950 ${getStyle(option, isSelected)}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{PredictionOptionEmoji[option]}</span>
          <span className="text-lg font-semibold">{option}</span>
        </div>
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs transition-colors ${
            isSelected
              ? "border-current bg-white/70 dark:bg-black/20"
              : "border-current/40 text-current/40 group-hover:text-current/70"
          }`}
        >
          {isSelected ? "✓" : ""}
        </span>
      </div>
    </button>
  );
}
