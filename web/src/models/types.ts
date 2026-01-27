export const PredictionOption = {
  RISE: "涨",
  FALL: "跌",
  FLAT: "平",
} as const;

export type PredictionOption = typeof PredictionOption[keyof typeof PredictionOption];

export const PredictionOptionEmoji: Record<string, string> = {
  [PredictionOption.RISE]: "📈",
  [PredictionOption.FALL]: "📉",
  [PredictionOption.FLAT]: "➡️",
};

export interface HistoricalEvent {
  id: string;
  description: string;
  date: string;
  stockSymbol: string;
  stockName: string;
  actualPerformance: number; // Actual price change, e.g., 0.05 means +5%
  daysAfterEvent: number; // Days after event for performance measurement
}

export interface EventGroup {
  id: string;
  stockSymbol: string;
  stockName: string;
  events: HistoricalEvent[];
}

export interface TradingSessionState {
  currentEventGroup: EventGroup;
  currentEventIndex: number;
  userPrediction: PredictionOption | null;
  showResult: boolean;
  totalAttempts: number;
  correctPredictions: number;
  currentStreak: number;
  maxStreak: number;
}

// Helper functions
export function getFormattedPerformance(actualPerformance: number): string {
  const percent = actualPerformance * 100;
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(1)}%`;
}

export function getPerformanceCategory(
  actualPerformance: number
): PredictionOption {
  if (actualPerformance > 0.01) {
    return PredictionOption.RISE as PredictionOption;
  } else if (actualPerformance < -0.01) {
    return PredictionOption.FALL as PredictionOption;
  } else {
    return PredictionOption.FLAT as PredictionOption;
  }
}
