import { useState, useCallback, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import type {
  PredictionOption,
  TradingSessionState,
  EventGroup,
  StockCategory,
} from "../models/types";
import { PredictionOption as PredictionOptionValues, getPerformanceCategory } from "../models/types";
import { mockData } from "../models/mockData";
import type { PracticeMode } from "../components/ModeSelector";
import { playSound, vibrate } from "../utils/sound";
import {
  getDailyChallenge,
  getDailyChallengeInfo,
} from "../services/dailyChallenge";
import { eventService } from "../services/eventService";
import type { UserStats } from "../services/userService";
import { userService } from "../services/userService";
import { trackLeaderboardScore, trackPracticeAttempt } from "../services/analyticsService";

const STORAGE_KEY = "tradesense_stats";
const MODE_STORAGE_KEY = "tradesense_mode";
const CHALLENGE_BEST_SCORE_KEY = "tradesense_challenge_best_score";
const CHALLENGE_MAX_STRIKES = 3;
const CHALLENGE_TIMEOUT_MS = 10_000;

interface StoredStats {
  totalAttempts: number;
  correctPredictions: number;
  currentStreak: number;
  maxStreak: number;
}

interface PredictionActionOptions {
  forceIncorrect?: boolean;
  responseTimeMs?: number;
}

interface CompletedChallengeRun {
  score: number;
  heartsLeft: number;
  totalTimeMs: number;
  totalQuestions: number;
  runStatus: "failed" | "quit";
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

function loadChallengeBestScore(): number {
  try {
    const raw = localStorage.getItem(CHALLENGE_BEST_SCORE_KEY);
    if (!raw) {
      return 0;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch (error) {
    console.warn("Failed to load challenge best score:", error);
    return 0;
  }
}

function saveChallengeBestScore(score: number): void {
  try {
    localStorage.setItem(CHALLENGE_BEST_SCORE_KEY, String(score));
  } catch (error) {
    console.warn("Failed to save challenge best score:", error);
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

function createChallengeRunId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `challenge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useTradingSession(user?: Pick<User, "id" | "email" | "user_metadata"> | null) {
  const userId = user?.id ?? null;

  const [practiceMode, setPracticeMode] = useState<PracticeMode>(loadStoredMode);
  const [selectedCategory, setSelectedCategory] = useState<StockCategory | "全部">("全部");
  const [searchQuery, setSearchQuery] = useState("");

  const [challengeScore, setChallengeScore] = useState(0);
  const [challengeCurrentScore, setChallengeCurrentScore] = useState(0);
  const [challengeBestScore, setChallengeBestScore] = useState(loadChallengeBestScore);
  const [challengeStrikes, setChallengeStrikes] = useState(0);
  const [challengeRunTotalTimeMs, setChallengeRunTotalTimeMs] = useState(0);
  const [challengeRunEnded, setChallengeRunEnded] = useState(false);

  const [dailyDate, setDailyDate] = useState(() => getDailyChallengeInfo().date);
  const [dailyScore, setDailyScore] = useState(0);
  const [dailyEvents, setDailyEvents] = useState<EventGroup[]>(getDailyChallenge());
  const [dailyEventIndex, setDailyEventIndex] = useState(0);
  const [dailyAnsweredCount, setDailyAnsweredCount] = useState(0);
  const [dailyTotalTimeMs, setDailyTotalTimeMs] = useState(0);

  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventLoadError, setEventLoadError] = useState<string | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);

  const cloudSyncReadyRef = useRef(false);
  const questionPresentedAtRef = useRef(Date.now());
  const challengeRunIdRef = useRef(createChallengeRunId());

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
          setDailyScore(0);
          setDailyAnsweredCount(0);
          setDailyTotalTimeMs(0);

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
          setDailyScore(0);
          setDailyAnsweredCount(0);
          setDailyTotalTimeMs(0);
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

  useEffect(() => {
    if (!state.showResult) {
      questionPresentedAtRef.current = Date.now();
    }
  }, [state.currentEventGroup.id, state.currentEventIndex, state.showResult, practiceMode]);

  // Refresh daily challenge set when day rolls over.
  useEffect(() => {
    const info = getDailyChallengeInfo();
    if (info.date !== dailyDate || info.isNewDay) {
      setDailyDate(info.date);
      setDailyScore(0);
      setDailyAnsweredCount(0);
      setDailyTotalTimeMs(0);
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

  const submitChallengeRun = useCallback(
    async (run: CompletedChallengeRun) => {
      await trackLeaderboardScore(user ?? null, {
        mode: "challenge",
        score: run.score,
        scoreDate: dailyDate,
        totalQuestions: run.totalQuestions,
        correctAnswers: run.score,
        totalTimeMs: run.totalTimeMs,
        heartsLeft: run.heartsLeft,
        runStatus: run.runStatus,
      });
      setLeaderboardRefreshKey((prev) => prev + 1);
    },
    [dailyDate, user]
  );

  const makePrediction = useCallback(
    (prediction: PredictionOption, options: PredictionActionOptions = {}) => {
      const responseTimeMs = Math.max(
        0,
        Math.floor(options.responseTimeMs ?? Date.now() - questionPresentedAtRef.current)
      );

      let shouldIncrementDailyScore = false;
      let practiceAttemptPayload: Parameters<typeof trackPracticeAttempt>[1] | null = null;
      let completedChallengeRun: CompletedChallengeRun | null = null;

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
        const isCorrect = options.forceIncorrect ? false : prediction === correctAnswer;

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

        if (practiceMode === "challenge") {
          const nextRunTimeMs = challengeRunTotalTimeMs + responseTimeMs;
          setChallengeRunTotalTimeMs(nextRunTimeMs);

          if (isCorrect) {
            setChallengeCurrentScore((score) => score + 1);
          } else {
            const nextStrikes = Math.min(challengeStrikes + 1, CHALLENGE_MAX_STRIKES);
            setChallengeStrikes(nextStrikes);

            if (nextStrikes >= CHALLENGE_MAX_STRIKES) {
              const finalScore = challengeCurrentScore;
              completedChallengeRun = {
                score: finalScore,
                heartsLeft: 0,
                totalTimeMs: nextRunTimeMs,
                totalQuestions: Math.max(1, finalScore + CHALLENGE_MAX_STRIKES),
                runStatus: "failed",
              };

              setChallengeScore(finalScore);
              setChallengeRunEnded(true);

              if (finalScore > challengeBestScore) {
                setChallengeBestScore(finalScore);
                saveChallengeBestScore(finalScore);
              }

              playSound("success");
              vibrate("heavy");
            }
          }
        }

        if (practiceMode === "daily") {
          setDailyAnsweredCount((count) => count + 1);
          setDailyTotalTimeMs((time) => time + responseTimeMs);
          if (isCorrect) {
            shouldIncrementDailyScore = true;
          }
        }

        practiceAttemptPayload = {
          mode: practiceMode,
          eventGroupId: eventGroup.id,
          userPrediction: prediction,
          correctAnswer,
          isCorrect,
          responseTimeMs,
          challengeRunId: practiceMode === "challenge" ? challengeRunIdRef.current : undefined,
          dailyDate: practiceMode === "daily" ? dailyDate : undefined,
          occurredAt: new Date().toISOString(),
        };

        return {
          ...prev,
          currentEventGroup: eventGroup,
          currentEventIndex: practiceMode === "daily" ? dailyEventIndex : prev.currentEventIndex,
          userPrediction: prediction,
          totalAttempts: prev.totalAttempts + 1,
          correctPredictions: newCorrectPredictions,
          currentStreak: newCurrentStreak,
          maxStreak: newMaxStreak,
          showResult: true,
        };
      });

      if (shouldIncrementDailyScore) {
        setDailyScore((prev) => prev + 1);
      }

      if (practiceAttemptPayload) {
        void trackPracticeAttempt(user ?? null, practiceAttemptPayload);
      }

      if (completedChallengeRun) {
        void submitChallengeRun(completedChallengeRun);
      }
    },
    [
      practiceMode,
      dailyEvents,
      dailyEventIndex,
      dailyDate,
      challengeCurrentScore,
      challengeBestScore,
      challengeStrikes,
      challengeRunTotalTimeMs,
      user,
      submitChallengeRun,
    ]
  );

  const registerChallengeTimeout = useCallback(() => {
    if (practiceMode !== "challenge" || state.showResult) {
      return;
    }

    makePrediction(PredictionOptionValues.FLAT, {
      forceIncorrect: true,
      responseTimeMs: CHALLENGE_TIMEOUT_MS,
    });
  }, [practiceMode, state.showResult, makePrediction]);

  const nextEvent = useCallback(() => {
    if (practiceMode === "daily") {
      const totalDailyEvents = dailyEvents.length;
      if (totalDailyEvents === 0) {
        return;
      }

      let nextIndex = dailyEventIndex + 1;
      if (nextIndex >= totalDailyEvents) {
        const completedDailyScore = dailyScore;
        const completedQuestions = Math.max(dailyAnsweredCount, totalDailyEvents);
        const completedTimeMs = Math.max(0, dailyTotalTimeMs);

        if (completedQuestions > 0) {
          void trackLeaderboardScore(user ?? null, {
            mode: "daily",
            score: completedDailyScore,
            scoreDate: dailyDate,
            totalQuestions: completedQuestions,
            correctAnswers: completedDailyScore,
            totalTimeMs: completedTimeMs,
          }).then(() => {
            setLeaderboardRefreshKey((prev) => prev + 1);
          });
        }

        nextIndex = 0;
        setDailyScore(0);
        setDailyAnsweredCount(0);
        setDailyTotalTimeMs(0);
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

    if (practiceMode === "challenge" && challengeRunEnded) {
      setChallengeCurrentScore(0);
      setChallengeStrikes(0);
      setChallengeRunTotalTimeMs(0);
      setChallengeRunEnded(false);
      challengeRunIdRef.current = createChallengeRunId();
    }

    setState((prev) => ({
      ...prev,
      userPrediction: null,
      showResult: false,
    }));

    void loadRandomEvent(selectedCategory, searchQuery);
  }, [
    practiceMode,
    dailyEvents,
    dailyEventIndex,
    dailyScore,
    dailyAnsweredCount,
    dailyTotalTimeMs,
    dailyDate,
    loadRandomEvent,
    selectedCategory,
    searchQuery,
    challengeRunEnded,
    user,
  ]);

  const resetSession = useCallback(() => {
    setChallengeScore(0);
    setChallengeCurrentScore(0);
    setChallengeStrikes(0);
    setChallengeRunTotalTimeMs(0);
    setChallengeRunEnded(false);
    setDailyEventIndex(0);
    setDailyScore(0);
    setDailyAnsweredCount(0);
    setDailyTotalTimeMs(0);
    challengeRunIdRef.current = createChallengeRunId();

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
      if (practiceMode === "challenge" && mode !== "challenge") {
        const hasProgress =
          !challengeRunEnded &&
          (challengeCurrentScore > 0 || challengeStrikes > 0 || challengeRunTotalTimeMs > 0);

        if (hasProgress) {
          const heartsLeft = Math.max(0, CHALLENGE_MAX_STRIKES - challengeStrikes);
          const totalQuestions = Math.max(1, challengeCurrentScore + challengeStrikes);

          setChallengeScore(challengeCurrentScore);
          if (challengeCurrentScore > challengeBestScore) {
            setChallengeBestScore(challengeCurrentScore);
            saveChallengeBestScore(challengeCurrentScore);
          }

          void submitChallengeRun({
            score: challengeCurrentScore,
            heartsLeft,
            totalTimeMs: challengeRunTotalTimeMs,
            totalQuestions,
            runStatus: "quit",
          });
        }
      }

      setPracticeMode(mode);
      setChallengeScore(0);
      setChallengeCurrentScore(0);
      setChallengeStrikes(0);
      setChallengeRunTotalTimeMs(0);
      setChallengeRunEnded(false);
      setDailyEventIndex(0);
      setDailyScore(0);
      setDailyAnsweredCount(0);
      setDailyTotalTimeMs(0);
      challengeRunIdRef.current = createChallengeRunId();

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
    [
      practiceMode,
      challengeRunEnded,
      challengeCurrentScore,
      challengeStrikes,
      challengeRunTotalTimeMs,
      challengeBestScore,
      submitChallengeRun,
      dailyEvents,
      loadRandomEvent,
      refreshDailyEvents,
      searchQuery,
      selectedCategory,
    ]
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
    totalEvents:
      practiceMode === "daily"
        ? Math.max(dailyEvents.length, 1)
        : state.currentEventGroup.events.length,
    accuracy,
    formattedAccuracy,
    makePrediction,
    registerChallengeTimeout,
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
    challengeCurrentScore,
    challengeBestScore,
    challengeStrikes,
    challengeHeartsLeft: Math.max(0, CHALLENGE_MAX_STRIKES - challengeStrikes),
    challengeRunEnded,
    dailyScore,
    dailyDate,
    isLoadingEvents,
    eventLoadError,
    isCloudSyncing,
    leaderboardRefreshKey,
  };
}
