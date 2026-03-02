import { useState, useCallback } from 'react';

export interface PracticeRecord {
  id: string;
  date: string;
  mode: 'casual' | 'challenge' | 'daily';
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  maxStreak?: number;
  score?: number;
}

const STORAGE_KEY = 'tradesense_history';

const loadHistory = (): PracticeRecord[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Failed to parse history:', e);
    return [];
  }
};

export function usePracticeHistory() {
  const [history, setHistory] = useState<PracticeRecord[]>(loadHistory);

  // Save to localStorage
  const saveHistory = useCallback((newHistory: PracticeRecord[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    setHistory(newHistory);
  }, []);

  // Add a new record
  const addRecord = useCallback((record: Omit<PracticeRecord, 'id' | 'date'>) => {
    const newRecord: PracticeRecord = {
      ...record,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    
    const newHistory = [newRecord, ...history].slice(0, 50); // Keep last 50 records
    saveHistory(newHistory);
    
    return newRecord;
  }, [history, saveHistory]);

  // Clear all history
  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  // Get today's records
  const todayRecords = history.filter(record => {
    const recordDate = new Date(record.date).toDateString();
    const today = new Date().toDateString();
    return recordDate === today;
  });

  // Get weekly stats
  const weeklyStats = {
    totalPractices: history.filter(record => {
      const recordDate = new Date(record.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return recordDate >= weekAgo;
    }).length,
    avgAccuracy: 0,
    bestScore: Math.max(...history.filter(r => r.score !== undefined).map(r => r.score || 0), 0),
  };

  if (history.length > 0) {
    const recentRecords = history.slice(0, 7);
    weeklyStats.avgAccuracy = Math.round(
      recentRecords.reduce((sum, r) => sum + r.accuracy, 0) / recentRecords.length
    );
  }

  return {
    history,
    todayRecords,
    weeklyStats,
    addRecord,
    clearHistory,
  };
}
