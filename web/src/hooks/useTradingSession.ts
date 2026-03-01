import { useState, useCallback, useEffect } from "react";
import type {
  PredictionOption,
  TradingSessionState,
} from "../models/types";
import { getPerformanceCategory } from "../models/types";
import { getRandomEventGroup } from "../models/mockData";
import type { PracticeMode } from "../components/ModeSelector";
import { playSound, vibrate } from "../utils/sound";

const STORAGE_KEY = "tradesense_stats";
const MODE_STORAGE_KEY = "tradesense_mode";

interface StoredStats {
  totalAttempts: number;
  correctPredictions: number;
  currentStreak: number;
  maxStreak: number;
}

function loadStoredMode(): PracticeMode {
  try {
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    if (saved === "challenge" || saved === "casual") {
      return saved;
    }
  } catch (e) {
    console.warn("Failed to load mode from localStorage:", e);
  }
  return "casual";
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
  const storedMode = loadStoredMode();

  const [practiceMode, setPracticeMode] = useState<PracticeMode>(storedMode);
  const [challengeScore, setChallengeScore] = useState(0);

  const [state, setState] = useState<TradingSessionState>(() => ({
    currentEventGroup: getRandomEventGroup(),
    currentEventIndex: 0,
    userPrediction: null,
    showResult: false,
    ...storedStats,
  }));

  // Persist mode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, practiceMode);
    } catch (e) {
      console.warn("Failed to save mode to localStorage:", e);
    }
  }, [practiceMode]);

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
        playSound('correct');
        vibrate('light');
      } else {
        newCurrentStreak = 0;
        playSound('wrong');
        vibrate('medium');
      }

      // Challenge mode: game over on wrong answer
      if (practiceMode === "challenge" && !isCorrect) {
        setChallengeScore(prev.totalAttempts);
        playSound('success');
        vibrate('heavy');
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
  }, [practiceMode]);

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
    setChallengeScore(0);
    saveStats({
      totalAttempts: 0,
      correctPredictions: 0,
      currentStreak: 0,
      maxStreak: 0,
    });
  }, []);

  const changeMode = useCallback((mode: PracticeMode) => {
    setPracticeMode(mode);
    setChallengeScore(0);
  }, []);

  return {
    ...state,
    totalEvents: state.currentEventGroup.events.length,
    accuracy,
    formattedAccuracy,
    makePrediction,
    nextEvent,
    resetSession,
    practiceMode,
    changeMode,
    challengeScore,
  };
}
