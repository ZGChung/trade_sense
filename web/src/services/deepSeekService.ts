import type { HistoricalEvent, PredictionOption } from "../models/types";
import { aiService } from "./aiService";

// Backward-compatible wrapper. New logic lives in aiService.
class DeepSeekService {
  async explainPredictionResult(
    events: HistoricalEvent[],
    stockName: string,
    correctAnswer: PredictionOption,
    userPrediction: PredictionOption,
    actualPerformance: number
  ): Promise<string> {
    const result = await aiService.explainPredictionResult(
      events,
      stockName,
      correctAnswer,
      userPrediction,
      actualPerformance
    );
    return result.text;
  }
}

export const deepSeekService = new DeepSeekService();
