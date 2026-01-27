import { useState, useCallback } from "react";
import type {
  PredictionOption,
  TradingSessionState,
} from "../models/types";
import { getPerformanceCategory } from "../models/types";
import { getRandomEventGroup } from "../models/mockData";

export function useTradingSession() {
  const [state, setState] = useState<TradingSessionState>(() => ({
    currentEventGroup: getRandomEventGroup(),
    currentEventIndex: 0,
    userPrediction: null,
    showResult: false,
    totalAttempts: 0,
    correctPredictions: 0,
    currentStreak: 0,
    maxStreak: 0,
  }));

  const accuracy =
    state.totalAttempts > 0
      ? (state.correctPredictions / state.totalAttempts) * 100
      : 0;

  const formattedAccuracy = `${accuracy.toFixed(1)}%`;

  const makePrediction = useCallback((prediction: PredictionOption) => {
    setState((prev) => {
      const finalEvent = prev.currentEventGroup.events[
        prev.currentEventGroup.events.length - 1
      ];
      const correctAnswer = getPerformanceCategory(
        finalEvent.actualPerformance
      );
      const isCorrect = prediction === correctAnswer;

      let newCorrectPredictions = prev.correctPredictions;
      let newCurrentStreak = prev.currentStreak;
      let newMaxStreak = prev.maxStreak;

      if (isCorrect) {
        newCorrectPredictions += 1;
        newCurrentStreak += 1;
        newMaxStreak = Math.max(newMaxStreak, newCurrentStreak);
      } else {
        newCurrentStreak = 0;
      }

      return {
        ...prev,
        userPrediction: prediction,
        totalAttempts: prev.totalAttempts + 1,
        correctPredictions: newCorrectPredictions,
        currentStreak: newCurrentStreak,
        maxStreak: newMaxStreak,
        showResult: true,
      };
    });
  }, []);

  const nextEvent = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentEventGroup: getRandomEventGroup(),
      currentEventIndex: 0,
      userPrediction: null,
      showResult: false,
    }));
  }, []);

  const resetSession = useCallback(() => {
    setState({
      currentEventGroup: getRandomEventGroup(),
      currentEventIndex: 0,
      userPrediction: null,
      showResult: false,
      totalAttempts: 0,
      correctPredictions: 0,
      currentStreak: 0,
      maxStreak: 0,
    });
  }, []);

  return {
    ...state,
    accuracy,
    formattedAccuracy,
    makePrediction,
    nextEvent,
    resetSession,
  };
}
