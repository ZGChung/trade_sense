import { useState, useCallback, useEffect, useRef } from "react";
import type {
  PredictionOption,
  TradingSessionState,
  EventGroup,
  StockCategory,
} from "../models/types";
import { getPerformanceCategory } from "../models/types";
import { mockData } from "../models/mockData";
import type { PracticeMode } from "../components/ModeSelector";
import { playSound, vibrate } from "../utils/sound";
import {
  getDailyChallenge,
  getDailyChallengeInfo,
  saveDailyHighScore,
  getDailyHighScore,
} from "../services/dailyChallenge";
import { eventService } from "../services/eventService";
import type { UserStats } from "../services/userService";
import { userService } from "../services/userService";

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
  } catch (error) {
    console.warn("Failed to load mode from localStorage:", error);
  }
  return "casual";
}

function loadStats(): StoredStats {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn("Failed to load stats from localStorage:", error);
  }

  return {
    totalAttempts: 0,
    correctPredictions: 0,
    currentStreak: 0,
    maxStreak: 0,
  };
}

function saveStats(stats: StoredStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.warn("Failed to save stats to localStorage:", error);
  }
}

function mergeStats(localStats: StoredStats, remoteStats: UserStats | null): StoredStats {
  if (!remoteStats) {
    return localStats;
  }

  return {
    totalAttempts: Math.max(localStats.totalAttempts, remoteStats.totalAttempts),
    correctPredictions: Math.max(localStats.correctPredictions, remoteStats.correctPredictions),
    currentStreak: Math.max(localStats.currentStreak, remoteStats.currentStreak),
    maxStreak: Math.max(localStats.maxStreak, remoteStats.maxStreak),
  };
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function useTradingSession(userId?: string | null) {
  const [practiceMode, setPracticeMode] = useState<PracticeMode>(loadStoredMode);
  const [selectedCategory, setSelectedCategory] = useState<StockCategory | "全部">("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [challengeScore, setChallengeScore] = useState(0);

  const [dailyDate, setDailyDate] = useState(() => getDailyChallengeInfo().date);
  const [dailyScore, setDailyScore] = useState(0);
  const [dailyHighScore, setDailyHighScore] = useState(getDailyHighScore());
  const [dailyEvents, setDailyEvents] = useState<EventGroup[]>(getDailyChallenge());
  const [dailyEventIndex, setDailyEventIndex] = useState(0);

  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventLoadError, setEventLoadError] = useState<string | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  const cloudSyncReadyRef = useRef(false);

  const [state, setState] = useState<TradingSessionState>(() => {
    const storedStats = loadStats();
    return {
      currentEventGroup: mockData[0],
      currentEventIndex: 0,
      userPrediction: null,
      showResult: false,
      ...storedStats,
    };
  });

  const loadRandomEvent = useCallback(
    async (category: StockCategory | "全部", search: string) => {
      setIsLoadingEvents(true);
      setEventLoadError(null);
      try {
        const eventGroup = await eventService.fetchRandomEventGroup(category, search);
        setState((prev) => ({
          ...prev,
          currentEventGroup: eventGroup,
          currentEventIndex: 0,
          userPrediction: null,
          showResult: false,
        }));
      } catch (error) {
        setEventLoadError(error instanceof Error ? error.message : "加载题目失败");
      } finally {
        setIsLoadingEvents(false);
      }
    },
    []
  );

  const refreshDailyEvents = useCallback(
    async (date: string, resetToFirst: boolean) => {
      try {
        const cloudDailyEvents = await eventService.fetchDailyChallenge(date, 10);
        const fallbackEvents = getDailyChallenge();
        const nextDailyEvents = cloudDailyEvents.length > 0 ? cloudDailyEvents : fallbackEvents;
        setDailyEvents(nextDailyEvents);

        if (resetToFirst) {
          setDailyEventIndex(0);
          if (practiceMode === "daily" && nextDailyEvents[0]) {
            setState((prev) => ({
              ...prev,
              currentEventGroup: nextDailyEvents[0],
              currentEventIndex: 0,
              userPrediction: null,
              showResult: false,
            }));
          }
        }
      } catch (error) {
        console.warn("Failed to load daily challenge from cloud, using local fallback:", error);
        const fallbackEvents = getDailyChallenge();
        setDailyEvents(fallbackEvents);

        if (resetToFirst && practiceMode === "daily" && fallbackEvents[0]) {
          setDailyEventIndex(0);
          setState((prev) => ({
            ...prev,
            currentEventGroup: fallbackEvents[0],
            currentEventIndex: 0,
            userPrediction: null,
            showResult: false,
          }));
        }
      }
    },
    [practiceMode]
  );

  useEffect(() => {
    void (async () => {
      await Promise.all([
        loadRandomEvent(selectedCategory, searchQuery),
        refreshDailyEvents(dailyDate, true),
      ]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, practiceMode);
    } catch (error) {
      console.warn("Failed to save mode to localStorage:", error);
    }
  }, [practiceMode]);

  useEffect(() => {
    saveStats({
      totalAttempts: state.totalAttempts,
      correctPredictions: state.correctPredictions,
      currentStreak: state.currentStreak,
      maxStreak: state.maxStreak,
    });
  }, [state.totalAttempts, state.correctPredictions, state.currentStreak, state.maxStreak]);

  // Refresh daily challenge set when day rolls over.
  useEffect(() => {
    const info = getDailyChallengeInfo();
    if (info.date !== dailyDate || info.isNewDay) {
      setDailyDate(info.date);
      setDailyScore(0);
      setDailyHighScore(getDailyHighScore());
      void refreshDailyEvents(info.date, true);
    }
  }, [dailyDate, refreshDailyEvents]);

  // Hydrate cloud stats once user logs in.
  useEffect(() => {
    if (!userId) {
      cloudSyncReadyRef.current = false;
      setIsCloudSyncing(false);
      return;
    }

    cloudSyncReadyRef.current = false;
    setIsCloudSyncing(true);

    const localStats: StoredStats = {
      totalAttempts: state.totalAttempts,
      correctPredictions: state.correctPredictions,
      currentStreak: state.currentStreak,
      maxStreak: state.maxStreak,
    };

    let isMounted = true;

    void (async () => {
      try {
        const remoteStats = await userService.getUserStats(userId);
        if (!isMounted) {
          return;
        }

        const mergedStats = mergeStats(localStats, remoteStats);
        setState((prev) => ({ ...prev, ...mergedStats }));
        await userService.upsertUserStats(userId, mergedStats);
      } catch (error) {
        console.warn("Failed to hydrate cloud stats:", error);
      } finally {
        if (isMounted) {
          cloudSyncReadyRef.current = true;
          setIsCloudSyncing(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Push incremental stats updates to cloud after hydration.
  useEffect(() => {
    if (!userId || !cloudSyncReadyRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      void userService
        .upsertUserStats(userId, {
          totalAttempts: state.totalAttempts,
          correctPredictions: state.correctPredictions,
          currentStreak: state.currentStreak,
          maxStreak: state.maxStreak,
        })
        .catch((error) => {
          console.warn("Failed to sync stats:", error);
        });
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    userId,
    state.totalAttempts,
    state.correctPredictions,
    state.currentStreak,
    state.maxStreak,
  ]);

  const accuracy =
    state.totalAttempts > 0
      ? (state.correctPredictions / state.totalAttempts) * 100
      : 0;

  const formattedAccuracy = `${accuracy.toFixed(1)}%`;

  const makePrediction = useCallback(
    (prediction: PredictionOption) => {
      setState((prev) => {
        const eventGroup =
          practiceMode === "daily"
            ? dailyEvents[dailyEventIndex] ?? prev.currentEventGroup
            : prev.currentEventGroup;

        if (!eventGroup || eventGroup.events.length === 0) {
          return prev;
        }

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
          playSound("correct");
          vibrate("light");
        } else {
          newCurrentStreak = 0;
          playSound("wrong");
          vibrate("medium");
        }

        if (practiceMode === "challenge" && !isCorrect) {
          setChallengeScore(prev.totalAttempts);
          playSound("success");
          vibrate("heavy");
        }

        return {
          ...prev,
          currentEventGroup: eventGroup,
          currentEventIndex: practiceMode === "daily" ? dailyEventIndex : 0,
          userPrediction: prediction,
          totalAttempts: prev.totalAttempts + 1,
          correctPredictions: newCorrectPredictions,
          currentStreak: newCurrentStreak,
          maxStreak: newMaxStreak,
          showResult: true,
        };
      });

      if (practiceMode === "daily") {
        setDailyScore((prev) => {
          const newScore = prev + 1;
          if (saveDailyHighScore(newScore)) {
            setDailyHighScore(newScore);
          }
          return newScore;
        });
      }
    },
    [practiceMode, dailyEvents, dailyEventIndex]
  );

  const nextEvent = useCallback(() => {
    if (practiceMode === "daily") {
      const totalDailyEvents = dailyEvents.length;
      if (totalDailyEvents === 0) {
        return;
      }

      let nextIndex = dailyEventIndex + 1;
      if (nextIndex >= totalDailyEvents) {
        nextIndex = 0;
        setDailyScore(0);
      }

      const nextEventGroup = dailyEvents[nextIndex] ?? dailyEvents[0];
      setDailyEventIndex(nextIndex);
      setState((prev) => ({
        ...prev,
        currentEventGroup: nextEventGroup,
        currentEventIndex: nextIndex,
        userPrediction: null,
        showResult: false,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      currentEventIndex: 0,
      userPrediction: null,
      showResult: false,
    }));
    void loadRandomEvent(selectedCategory, searchQuery);
  }, [practiceMode, dailyEvents, dailyEventIndex, loadRandomEvent, selectedCategory, searchQuery]);

  const resetSession = useCallback(() => {
    setChallengeScore(0);
    setDailyEventIndex(0);
    setDailyScore(0);

    setState((prev) => ({
      ...prev,
      currentEventGroup:
        practiceMode === "daily" ? dailyEvents[0] ?? prev.currentEventGroup : prev.currentEventGroup,
      currentEventIndex: 0,
      userPrediction: null,
      showResult: false,
      totalAttempts: 0,
      correctPredictions: 0,
      currentStreak: 0,
      maxStreak: 0,
    }));

    saveStats({
      totalAttempts: 0,
      correctPredictions: 0,
      currentStreak: 0,
      maxStreak: 0,
    });

    if (practiceMode !== "daily") {
      void loadRandomEvent(selectedCategory, searchQuery);
    }
  }, [practiceMode, dailyEvents, loadRandomEvent, selectedCategory, searchQuery]);

  const changeMode = useCallback(
    (mode: PracticeMode) => {
      setPracticeMode(mode);
      setChallengeScore(0);
      setDailyEventIndex(0);
      setDailyScore(0);

      if (mode === "daily") {
        if (dailyEvents.length === 0) {
          void refreshDailyEvents(getTodayDateString(), true);
          return;
        }

        setState((prev) => ({
          ...prev,
          currentEventGroup: dailyEvents[0],
          currentEventIndex: 0,
          userPrediction: null,
          showResult: false,
        }));
        return;
      }

      void loadRandomEvent(selectedCategory, searchQuery);
    },
    [dailyEvents, loadRandomEvent, refreshDailyEvents, searchQuery, selectedCategory]
  );

  const changeCategory = useCallback(
    (category: StockCategory | "全部") => {
      setSelectedCategory(category);
      if (practiceMode !== "daily") {
        void loadRandomEvent(category, searchQuery);
      }
    },
    [practiceMode, loadRandomEvent, searchQuery]
  );

  const changeSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (practiceMode !== "daily") {
        void loadRandomEvent(selectedCategory, query);
      }
    },
    [practiceMode, loadRandomEvent, selectedCategory]
  );

  const practiceEventGroup = useCallback(
    (eventGroup: EventGroup) => {
      if (practiceMode !== "casual") {
        setPracticeMode("casual");
      }

      setState((prev) => ({
        ...prev,
        currentEventGroup: eventGroup,
        currentEventIndex: 0,
        userPrediction: null,
        showResult: false,
      }));
    },
    [practiceMode]
  );

  return {
    ...state,
    totalEvents: practiceMode === "daily" ? Math.max(dailyEvents.length, 1) : state.currentEventGroup.events.length,
    accuracy,
    formattedAccuracy,
    makePrediction,
    nextEvent,
    resetSession,
    practiceEventGroup,
    practiceMode,
    changeMode,
    changeCategory,
    changeSearch,
    selectedCategory,
    searchQuery,
    challengeScore,
    dailyScore,
    dailyHighScore,
    isLoadingEvents,
    eventLoadError,
    isCloudSyncing,
  };
}
