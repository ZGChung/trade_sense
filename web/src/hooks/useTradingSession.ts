import { useState, useCallback, useEffect } from "react";
import type {
  PredictionOption,
  TradingSessionState,
  EventGroup,
  StockCategory,
} from "../models/types";
import { getPerformanceCategory } from "../models/types";
import { mockData, getRandomEventGroup, getStockCategory } from "../models/mockData";
import type { PracticeMode } from "../components/ModeSelector";
import { playSound, vibrate } from "../utils/sound";
import {
  getDailyChallenge,
  getDailyChallengeInfo,
  saveDailyHighScore,
  getDailyHighScore,
} from "../services/dailyChallenge";

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
    if (saved === "challenge" || saved === "casual" || saved === "daily") {
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

  // Initialize daily challenge with lazy state check
  const getInitialDailyState = (): { events: EventGroup[]; index: number; score: number; highScore: number } => {
    const info = getDailyChallengeInfo();
    if (info.isNewDay) {
      return {
        events: getDailyChallenge(),
        index: 0,
        score: 0,
        highScore: getDailyHighScore(),
      };
    }
    return {
      events: getDailyChallenge(),
      index: 0,
      score: 0,
      highScore: getDailyHighScore(),
    };
  };

  const initialDailyState = getInitialDailyState();

  const [practiceMode, setPracticeMode] = useState<PracticeMode>(storedMode);
  const [selectedCategory, setSelectedCategory] = useState<StockCategory | "全部">("全部");
  const [challengeScore, setChallengeScore] = useState(0);

  // Get random event group based on selected category
  const getRandomEvent = useCallback((category: StockCategory | "全部"): EventGroup => {
    if (category === "全部") {
      return getRandomEventGroup();
    }
    const filtered = mockData.filter(
      (eg) => getStockCategory(eg.stockSymbol) === category
    );
    if (filtered.length === 0) {
      return getRandomEventGroup();
    }
    return filtered[Math.floor(Math.random() * filtered.length)];
  }, []);
  const [dailyScore, setDailyScore] = useState(initialDailyState.score);
  const [dailyHighScore, setDailyHighScore] = useState(initialDailyState.highScore);
  const [dailyEvents] = useState<EventGroup[]>(initialDailyState.events);
  const [dailyEventIndex, setDailyEventIndex] = useState(initialDailyState.index);

  const [state, setState] = useState<TradingSessionState>(() => ({
    currentEventGroup: getRandomEvent("全部"),
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
      // For daily mode, use daily events
      const eventGroup = practiceMode === "daily" 
        ? dailyEvents[dailyEventIndex] 
        : prev.currentEventGroup;
      
      const finalEvent = eventGroup.events[eventGroup.events.length - 1];
      const correctAnswer = getPerformanceCategory(finalEvent.actualPerformance);
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
        currentEventGroup: eventGroup,
        userPrediction: prediction,
        totalAttempts: prev.totalAttempts + 1,
        correctPredictions: newCorrectPredictions,
        currentStreak: newCurrentStreak,
        maxStreak: newMaxStreak,
        showResult: true,
      };
    });

    // Daily mode: track score (outside setState to avoid dependency issues)
    if (practiceMode === "daily") {
      setDailyScore((prev) => {
        const newScore = prev + 1;
        if (saveDailyHighScore(newScore)) {
          setDailyHighScore(newScore);
        }
        return newScore;
      });
    }
  }, [practiceMode, dailyEvents, dailyEventIndex]);

  const nextEvent = useCallback(() => {
    if (practiceMode === "daily") {
      // Move to next daily event
      if (dailyEventIndex < dailyEvents.length - 1) {
        setDailyEventIndex((prev) => prev + 1);
      } else {
        // Daily challenge completed - reset to first event
        setDailyEventIndex(0);
        setDailyScore(0);
      }
    }
    
    setState((prev) => ({
      ...prev,
      currentEventGroup: practiceMode === "daily" 
        ? dailyEvents[dailyEventIndex] 
        : getRandomEvent(selectedCategory),
      currentEventIndex: 0,
      userPrediction: null,
      showResult: false,
    }));
  }, [practiceMode, dailyEvents, dailyEventIndex, getRandomEvent, selectedCategory]);

  const resetSession = useCallback(() => {
    const newStats = {
      currentEventGroup: getRandomEvent(selectedCategory),
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
    setDailyEventIndex(0);
    setDailyScore(0);
    saveStats({
      totalAttempts: 0,
      correctPredictions: 0,
      currentStreak: 0,
      maxStreak: 0,
    });
  }, [getRandomEvent, selectedCategory]);

  const changeMode = useCallback((mode: PracticeMode) => {
    setPracticeMode(mode);
    setChallengeScore(0);
    setDailyEventIndex(0);
    setDailyScore(0);
    
    // Reset to appropriate starting event group
    if (mode === "daily") {
      setState((prev) => ({
        ...prev,
        currentEventGroup: dailyEvents[0],
      }));
    }
  }, [dailyEvents]);

  const changeCategory = useCallback((category: StockCategory | "全部") => {
    setSelectedCategory(category);
    // Get new event with the selected category
    setState((prev) => ({
      ...prev,
      currentEventGroup: getRandomEvent(category),
      currentEventIndex: 0,
      userPrediction: null,
      showResult: false,
    }));
  }, [getRandomEvent]);

  return {
    ...state,
    totalEvents: practiceMode === "daily" ? dailyEvents.length : state.currentEventGroup.events.length,
    accuracy,
    formattedAccuracy,
    makePrediction,
    nextEvent,
    resetSession,
    practiceMode,
    changeMode,
    changeCategory,
    selectedCategory,
    challengeScore,
    dailyScore,
    dailyHighScore,
  };
}
