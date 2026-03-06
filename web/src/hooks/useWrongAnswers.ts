import { useState, useCallback, useEffect } from "react";
import type { EventGroup, PredictionOption } from "../models/types";

const STORAGE_KEY = "tradesense_wrong_answers";

export interface WrongAnswer {
  id: string;
  timestamp: number;
  eventGroup: EventGroup;
  userPrediction: PredictionOption;
  correctAnswer: PredictionOption;
  stockSymbol: string;
  stockName: string;
}

function loadWrongAnswers(): WrongAnswer[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Failed to load wrong answers:", e);
  }
  return [];
}

function saveWrongAnswers(answers: WrongAnswer[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch (e) {
    console.warn("Failed to save wrong answers:", e);
  }
}

export function useWrongAnswers() {
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>(loadWrongAnswers);

  // Save to localStorage whenever wrongAnswers changes
  useEffect(() => {
    saveWrongAnswers(wrongAnswers);
  }, [wrongAnswers]);

  const addWrongAnswer = useCallback((answer: Omit<WrongAnswer, "id" | "timestamp">) => {
    const newWrongAnswer: WrongAnswer = {
      ...answer,
      id: `wrong_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    setWrongAnswers(prev => [newWrongAnswer, ...prev]);
  }, []);

  const removeWrongAnswer = useCallback((id: string) => {
    setWrongAnswers(prev => prev.filter(answer => answer.id !== id));
  }, []);

  const clearWrongAnswers = useCallback(() => {
    setWrongAnswers([]);
  }, []);

  const getWrongAnswersCount = useCallback(() => {
    return wrongAnswers.length;
  }, [wrongAnswers.length]);

  return {
    wrongAnswers,
    addWrongAnswer,
    removeWrongAnswer,
    clearWrongAnswers,
    getWrongAnswersCount,
  };
}
