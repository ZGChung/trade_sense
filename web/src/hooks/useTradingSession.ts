import { useState, useCallback, useEffect } from "react";
import type {
  PredictionOption,
  TradingSessionState,
} from "../models/types";
import { getPerformanceCategory } from "../models/types";
import { getRandomEventGroup } from "../models/mockData";

const STORAGE_KEY = "tradesense_stats";

interface StoredStats {
  totalAttempts: number;
  correctPredictions: number;
  currentStreak: number;
  maxStreak: number;
}

function loadStats(): StoredStats {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Failed to load stats from localStorage:", e);
  }
  return {
    totalAttempts: 0,
    correctPredictions: 0,
    currentStreak: 0,
    maxStreak: 0,
  };
}

function saveStats(stats: StoredStats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn("Failed to save stats to localStorage:", e);
  }
}

export function useTradingSession() {
  const storedStats = loadStats();

  const [state, setState] = useState<TradingSessionState>(() => ({
    currentEventGroup: getRandomEventGroup(),
    currentEventIndex: 0,
    userPrediction: null,
    showResult: false,
    ...storedStats,
  }));

  // Persist stats to localStorage when they change
  useEffect(() => {
    saveStats({
      totalAttempts: state.totalAttempts,
      correctPredictions: state.correctPredictions,
      currentStreak: state.currentStreak,
      maxStreak: state.maxStreak,
    });
  }, [state.totalAttempts, state.correctPredictions, state.currentStreak, state.maxStreak]);

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
    const newStats = {
      currentEventGroup: getRandomEventGroup(),
      currentEventIndex: 0,
      userPrediction: null,
      showResult: false,
      totalAttempts: 0,
      correctPredictions: 0,
      currentStreak: 0,
      maxStreak: 0,
    };
    setState(newStats);
    saveStats({
      totalAttempts: 0,
      correctPredictions: 0,
      currentStreak: 0,
      maxStreak: 0,
    });
  }, []);

  return {
    ...state,
    totalEvents: state.currentEventGroup.events.length,
    accuracy,
    formattedAccuracy,
    makePrediction,
    nextEvent,
    resetSession,
  };
}
