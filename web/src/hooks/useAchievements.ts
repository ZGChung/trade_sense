import { useState, useCallback, useMemo, useEffect } from "react";
import type { Achievement, AchievementId } from "../models/achievements";
import { ACHIEVEMENTS } from "../models/achievements";
import { userService } from "../services/userService";

interface AchievementState {
  unlocked: AchievementId[];
  newlyUnlocked: AchievementId | null;
}

const STORAGE_KEY = "tradesense_achievements";
const DAILY_STREAK_KEY = "tradesense_daily_streak";

interface DailyStreak {
  lastPracticeDate: string;
  streak: number;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getAchievementState(): AchievementState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AchievementState>;
      return {
        unlocked: Array.isArray(parsed.unlocked) ? (parsed.unlocked as AchievementId[]) : [],
        newlyUnlocked: null,
      };
    }
  } catch (error) {
    console.error("Failed to load achievements:", error);
  }

  return { unlocked: [], newlyUnlocked: null };
}

function saveAchievementState(state: AchievementState): void {
  try {
    // Persist only unlocked list; newlyUnlocked is session-only UI state.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        unlocked: state.unlocked,
        newlyUnlocked: null,
      } satisfies AchievementState)
    );
  } catch (error) {
    console.error("Failed to save achievements:", error);
  }
}

function getDailyStreak(): DailyStreak {
  try {
    const stored = localStorage.getItem(DAILY_STREAK_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load daily streak:", error);
  }

  return { lastPracticeDate: "", streak: 0 };
}

function saveDailyStreak(streak: DailyStreak): void {
  try {
    localStorage.setItem(DAILY_STREAK_KEY, JSON.stringify(streak));
  } catch (error) {
    console.error("Failed to save daily streak:", error);
  }
}

function updateDailyStreak(): DailyStreak {
  const today = getToday();
  const streak = getDailyStreak();

  if (streak.lastPracticeDate === today) {
    return streak;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (streak.lastPracticeDate === yesterdayStr) {
    streak.streak += 1;
  } else {
    streak.streak = 1;
  }

  streak.lastPracticeDate = today;
  saveDailyStreak(streak);
  return streak;
}

export function useAchievements(
  totalAttempts: number,
  currentStreak: number,
  maxStreak: number,
  challengeScore: number,
  userId?: string | null
) {
  const [state, setState] = useState<AchievementState>(getAchievementState);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (totalAttempts > 0) {
      updateDailyStreak();
    }
  }, [totalAttempts]);

  // Hydrate from cloud and merge with local achievements.
  useEffect(() => {
    if (!userId) {
      setIsSyncing(false);
      return;
    }

    let isMounted = true;
    setIsSyncing(true);

    void (async () => {
      try {
        const remoteAchievements = (await userService.getUserAchievements(userId)) as AchievementId[];
        if (!isMounted) {
          return;
        }

        setState((prev) => {
          const mergedUnlocked = Array.from(new Set([...prev.unlocked, ...remoteAchievements]));
          const nextState: AchievementState = {
            unlocked: mergedUnlocked,
            newlyUnlocked: null,
          };
          saveAchievementState(nextState);
          return nextState;
        });
      } catch (error) {
        console.warn("Failed to sync achievements from cloud:", error);
      } finally {
        if (isMounted) {
          setIsSyncing(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Push local unlocked achievements to cloud.
  useEffect(() => {
    if (!userId || state.unlocked.length === 0) {
      return;
    }

    void userService.addUserAchievements(userId, state.unlocked).catch((error) => {
      console.warn("Failed to sync achievements to cloud:", error);
    });
  }, [userId, state.unlocked]);

  const checkAndUnlockAchievements = useCallback(() => {
    const currentUnlocked = new Set(state.unlocked);
    const dailyStreak = getDailyStreak();
    const newUnlocked: AchievementId[] = [];

    if (!currentUnlocked.has("first_prediction") && totalAttempts >= 1) {
      newUnlocked.push("first_prediction");
    }
    if (!currentUnlocked.has("streak_3") && currentStreak >= 3) {
      newUnlocked.push("streak_3");
    }
    if (!currentUnlocked.has("streak_5") && currentStreak >= 5) {
      newUnlocked.push("streak_5");
    }
    if (!currentUnlocked.has("streak_10") && currentStreak >= 10) {
      newUnlocked.push("streak_10");
    }
    if (!currentUnlocked.has("streak_15") && currentStreak >= 15) {
      newUnlocked.push("streak_15");
    }
    if (!currentUnlocked.has("streak_25") && currentStreak >= 25) {
      newUnlocked.push("streak_25");
    }
    if (!currentUnlocked.has("streak_30") && currentStreak >= 30) {
      newUnlocked.push("streak_30");
    }
    if (!currentUnlocked.has("streak_50") && currentStreak >= 50) {
      newUnlocked.push("streak_50");
    }
    if (!currentUnlocked.has("streak_100") && currentStreak >= 100) {
      newUnlocked.push("streak_100");
    }
    if (!currentUnlocked.has("perfect_10") && maxStreak >= 10) {
      newUnlocked.push("perfect_10");
    }
    if (!currentUnlocked.has("perfect_20") && maxStreak >= 20) {
      newUnlocked.push("perfect_20");
    }
    if (!currentUnlocked.has("challenge_starter") && challengeScore >= 10) {
      newUnlocked.push("challenge_starter");
    }
    if (!currentUnlocked.has("challenge_master") && challengeScore >= 50) {
      newUnlocked.push("challenge_master");
    }
    if (!currentUnlocked.has("challenge_legend") && challengeScore >= 100) {
      newUnlocked.push("challenge_legend");
    }
    if (!currentUnlocked.has("dedicated_trader") && totalAttempts >= 100) {
      newUnlocked.push("dedicated_trader");
    }
    if (!currentUnlocked.has("volume_300") && totalAttempts >= 300) {
      newUnlocked.push("volume_300");
    }
    if (!currentUnlocked.has("century_club") && totalAttempts >= 1000) {
      newUnlocked.push("century_club");
    }
    if (!currentUnlocked.has("volume_2000") && totalAttempts >= 2000) {
      newUnlocked.push("volume_2000");
    }
    if (!currentUnlocked.has("daily_streak_3") && dailyStreak.streak >= 3) {
      newUnlocked.push("daily_streak_3");
    }
    if (!currentUnlocked.has("daily_streak_7") && dailyStreak.streak >= 7) {
      newUnlocked.push("daily_streak_7");
    }
    if (!currentUnlocked.has("daily_streak_30") && dailyStreak.streak >= 30) {
      newUnlocked.push("daily_streak_30");
    }

    if (newUnlocked.length > 0) {
      const allUnlocked = [...state.unlocked, ...newUnlocked];
      const latestUnlocked = newUnlocked[newUnlocked.length - 1];
      const newState = { unlocked: allUnlocked, newlyUnlocked: latestUnlocked };
      saveAchievementState(newState);
      setState(newState);
    }
  }, [state.unlocked, totalAttempts, currentStreak, maxStreak, challengeScore]);

  const clearNewlyUnlocked = useCallback(() => {
    setState((prev) => {
      const nextState = { ...prev, newlyUnlocked: null };
      saveAchievementState(nextState);
      return nextState;
    });
  }, []);

  const getAchievement = useCallback((id: AchievementId): Achievement | undefined => {
    return ACHIEVEMENTS.find((achievement) => achievement.id === id);
  }, []);

  const unlockedAchievements = useMemo(
    () =>
      state.unlocked
        .map((id) => getAchievement(id))
        .filter((achievement): achievement is Achievement => achievement !== undefined),
    [state.unlocked, getAchievement]
  );

  const lockedAchievements = useMemo(
    () => ACHIEVEMENTS.filter((achievement) => !state.unlocked.includes(achievement.id)),
    [state.unlocked]
  );

  return {
    unlockedCount: state.unlocked.length,
    totalCount: ACHIEVEMENTS.length,
    unlockedAchievements,
    lockedAchievements,
    newlyUnlocked: state.newlyUnlocked ? getAchievement(state.newlyUnlocked) ?? null : null,
    checkAndUnlockAchievements,
    clearNewlyUnlocked,
    getAchievement,
    isSyncing,
  };
}
