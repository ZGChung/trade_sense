import { useState, useEffect, useCallback } from "react";

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  completed: boolean;
  expiresAt: string;
}

const QUEST_DEFINITIONS = [
  {
    id: "streak3",
    title: "🔥 3连胜",
    description: "连续答对3题",
    target: 3,
    reward: 10,
  },
  {
    id: "streak5",
    title: "🔥 5连胜",
    description: "连续答对5题",
    target: 5,
    reward: 30,
  },
  {
    id: "complete_daily",
    title: "📅 完成每日挑战",
    description: "完成今日的10道题",
    target: 10,
    reward: 50,
  },
  {
    id: "play5",
    title: "🎮 练习5轮",
    description: "完成5轮练习",
    target: 5,
    reward: 20,
  },
  {
    id: "play10",
    title: "🎮 勤学苦练",
    description: "完成10轮练习",
    target: 10,
    reward: 40,
  },
];

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function getStorageKey(questId: string, date: string): string {
  return `tradesense_quest_${questId}_${date}`;
}

export function useDailyQuests() {
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [totalReward, setTotalReward] = useState(() => {
    const today = getTodayKey();
    const savedReward = localStorage.getItem(`tradesense_total_reward_${today}`);
    return savedReward ? parseInt(savedReward, 10) : 0;
  });

  // Initialize quests on mount (setState needed for async initialization)
  useEffect(() => {
    const today = getTodayKey();

    const initializedQuests = QUEST_DEFINITIONS.map((def) => {
      const storageKey = getStorageKey(def.id, today);
      const saved = localStorage.getItem(storageKey);

      if (saved) {
        const data = JSON.parse(saved);
        return {
          ...def,
          progress: data.progress,
          completed: data.progress >= def.target,
          expiresAt: today,
        };
      }

      return {
        ...def,
        progress: 0,
        completed: false,
        expiresAt: today,
      };
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuests(initializedQuests);
  }, []);

  // Update localStorage when quests change
  useEffect(() => {
    if (quests.length > 0) {
      const today = getTodayKey();
      quests.forEach((quest) => {
        const storageKey = getStorageKey(quest.id, today);
        localStorage.setItem(
          storageKey,
          JSON.stringify({ progress: quest.progress, completed: quest.completed })
        );
      });
      localStorage.setItem(`tradesense_total_reward_${today}`, totalReward.toString());
    }
  }, [quests, totalReward]);

  // Update quest progress
  const updateQuest = useCallback((questId: string, amount: number = 1) => {
    setQuests((prev) =>
      prev.map((quest) => {
        if (quest.id !== questId || quest.completed) {
          return quest;
        }

        const newProgress = Math.min(quest.progress + amount, quest.target);
        const isCompleted = newProgress >= quest.target;

        if (isCompleted && !quest.completed) {
          setTotalReward((r) => r + quest.reward);
        }

        return {
          ...quest,
          progress: newProgress,
          completed: isCompleted,
        };
      })
    );
  }, []);

  // Update streak (call when user gets a correct answer)
  const recordCorrectAnswer = useCallback(
    (currentStreak: number) => {
      // Update streak3 if currentStreak >= 3
      if (currentStreak >= 3) {
        setQuests((prev) =>
          prev.map((quest) => {
            if (quest.id !== "streak3" || quest.completed) {
              return quest;
            }

            const newProgress = Math.min(currentStreak, quest.target);
            const isCompleted = newProgress >= quest.target;

            if (isCompleted && !quest.completed) {
              setTotalReward((r) => r + quest.reward);
            }

            return {
              ...quest,
              progress: newProgress,
              completed: isCompleted,
            };
          })
        );
      }

      // Update streak5 if currentStreak >= 5
      if (currentStreak >= 5) {
        setQuests((prev) =>
          prev.map((quest) => {
            if (quest.id !== "streak5" || quest.completed) {
              return quest;
            }

            const newProgress = Math.min(currentStreak, quest.target);
            const isCompleted = newProgress >= quest.target;

            if (isCompleted && !quest.completed) {
              setTotalReward((r) => r + quest.reward);
            }

            return {
              ...quest,
              progress: newProgress,
              completed: isCompleted,
            };
          })
        );
      }
    },
    []
  );

  // Complete daily challenge
  const completeDailyChallenge = useCallback(() => {
    const today = getTodayKey();
    const storageKey = getStorageKey("complete_daily", today);
    const saved = localStorage.getItem(storageKey);

    if (!saved) {
      const dailyProgress =QUEST_DEFINITIONS.find(d=>d.id==="complete_daily")?.target || 10;
      updateQuest("complete_daily", dailyProgress);
    }
  }, [updateQuest]);

  // Increment play count
  const recordPlay = useCallback(() => {
    updateQuest("play5", 1);
    updateQuest("play10", 1);
  }, [updateQuest]);

  // Claim all completed quests (for display purposes)
  const claimCompletedQuests = useCallback(() => {
    return quests.filter((q) => q.completed);
  }, [quests]);

  return {
    quests,
    totalReward,
    updateQuest,
    recordCorrectAnswer,
    completeDailyChallenge,
    recordPlay,
    claimCompletedQuests,
  };
}