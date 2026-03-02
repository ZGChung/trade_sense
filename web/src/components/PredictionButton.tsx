import type { PredictionOption } from "../models/types";
import { PredictionOption as PredictionOptionValues, PredictionOptionEmoji } from "../models/types";
import { playSound, vibrate } from "../utils/sound";

interface PredictionButtonProps {
  option: PredictionOption;
  isSelected: boolean;
  onClick: () => void;
}

export function PredictionButton({
  option,
  isSelected,
  onClick,
}: PredictionButtonProps) {
  const getBackgroundColor = () => {
    if (isSelected) {
      if (option === PredictionOptionValues.RISE) {
        return "bg-green-100 dark:bg-green-900/30";
      } else if (option === PredictionOptionValues.FLAT) {
        return "bg-gray-100 dark:bg-gray-800";
      } else if (option === PredictionOptionValues.FALL) {
        return "bg-red-100 dark:bg-red-900/30";
      }
    }
    return "bg-gray-50 dark:bg-gray-900";
  };

  const getBorderColor = () => {
    if (isSelected) {
      if (option === PredictionOptionValues.RISE) {
        return "border-green-500";
      } else if (option === PredictionOptionValues.FLAT) {
        return "border-gray-500";
      } else if (option === PredictionOptionValues.FALL) {
        return "border-red-500";
      }
    }
    return "border-transparent";
  };

  return (
    <button
      onClick={() => {
        playSound('click');
        vibrate('light');
        onClick();
      }}
      className={`
        w-full min-h-[60px] px-5 py-4 rounded-xl
        flex items-center justify-center gap-4
        transition-all duration-200
        ${getBackgroundColor()}
        border-2 ${getBorderColor()}
        hover:scale-[1.02] active:scale-[0.98]
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      `}
    >
      <span className="text-2xl">{PredictionOptionEmoji[option]}</span>
      <span className="text-lg font-semibold">{option}</span>
    </button>
  );
}
