import type { EventGroup } from "../models/types";
import { mockData } from "../models/mockData";

/**
 * 每日挑战服务
 * 每天生成不同的题目集，确保所有用户同一天做相同的题目
 */

// 获取今天的日期字符串 (YYYY-MM-DD)
function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

// 将字符串转换为数字 (用于种子)
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Fisher-Yates 洗牌算法 (带种子)
function shuffleArray<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let currentIndex = result.length;
  let randomValue = seed;

  while (currentIndex !== 0) {
    randomValue = (randomValue * 1103515245 + 12345) & 0x7fffffff;
    const randomIndex = randomValue % currentIndex;
    currentIndex--;
    [result[currentIndex], result[randomIndex]] = [
      result[randomIndex],
      result[currentIndex],
    ];
  }

  return result;
}

/**
 * 获取每日挑战的题目集
 * @param count 题目数量，默认 10 道
 * @returns 每日挑战的事件组数组
 */
export function getDailyChallenge(count: number = 10): EventGroup[] {
  const today = getTodayDateString();
  const seed = stringToSeed(today);

  // 复制并打乱数据
  const shuffled = shuffleArray([...mockData], seed);

  // 每天选择固定数量的题目
  const dailyEvents: EventGroup[] = [];
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const eventGroup = { ...shuffled[i] };
    // 每个事件组也打乱顺序
    const shuffledEvents = shuffleArray([...eventGroup.events], seed + i);
    eventGroup.events = shuffledEvents;
    dailyEvents.push(eventGroup);
  }

  return dailyEvents;
}

/**
 * 获取今日挑战的信息
 */
export function getDailyChallengeInfo(): {
  date: string;
  isNewDay: boolean;
  eventCount: number;
} {
  const today = getTodayDateString();
  const storedDate = localStorage.getItem("tradesense_daily_date");
  const isNewDay = storedDate !== today;

  if (isNewDay) {
    localStorage.setItem("tradesense_daily_date", today);
  }

  return {
    date: today,
    isNewDay,
    eventCount: 10,
  };
}

/**
 * 获取每日挑战的最高分
 */
export function getDailyHighScore(): number {
  const today = getTodayDateString();
  const key = `tradesense_daily_score_${today}`;
  const score = localStorage.getItem(key);
  return score ? parseInt(score, 10) : 0;
}

/**
 * 保存每日挑战分数
 */
export function saveDailyHighScore(score: number): boolean {
  const today = getTodayDateString();
  const key = `tradesense_daily_score_${today}`;
  const currentHighScore = getDailyHighScore();

  if (score > currentHighScore) {
    localStorage.setItem(key, score.toString());
    return true;
  }
  return false;
}
