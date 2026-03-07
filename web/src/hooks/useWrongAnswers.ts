import { useState, useCallback, useEffect } from "react";
import type { EventGroup, PredictionOption } from "../models/types";
import { userService } from "../services/userService";

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
  } catch (error) {
    console.warn("Failed to load wrong answers:", error);
  }
  return [];
}

function saveWrongAnswers(answers: WrongAnswer[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch (error) {
    console.warn("Failed to save wrong answers:", error);
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isLocalOnlyId(value: string): boolean {
  return value.startsWith("wrong_");
}

export function useWrongAnswers(userId?: string | null) {
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>(loadWrongAnswers);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    saveWrongAnswers(wrongAnswers);
  }, [wrongAnswers]);

  // Hydrate and merge wrong answers from cloud when a user is logged in.
  useEffect(() => {
    if (!userId) {
      setIsSyncing(false);
      return;
    }

    let isMounted = true;
    setIsSyncing(true);

    void (async () => {
      try {
        let localSnapshot = [...wrongAnswers];

        // Push local-only entries to cloud first so they can get stable UUIDs.
        const localOnlyItems = localSnapshot.filter(
          (answer) => isLocalOnlyId(answer.id) && isUuid(answer.eventGroup.id)
        );

        for (const answer of localOnlyItems) {
          const synced = await userService.addWrongAnswer(userId, {
            eventGroupId: answer.eventGroup.id,
            userPrediction: answer.userPrediction,
            correctAnswer: answer.correctAnswer,
            createdAt: new Date(answer.timestamp).toISOString(),
          });

          if (!synced) {
            continue;
          }

          localSnapshot = localSnapshot.map((item) =>
            item.id === answer.id
              ? {
                  ...item,
                  id: synced.id,
                  timestamp: synced.timestamp,
                }
              : item
          );
        }

        const remoteAnswers = await userService.listWrongAnswers(userId);

        if (!isMounted) {
          return;
        }

        const remoteIds = new Set(remoteAnswers.map((answer) => answer.id));
        const keepLocal = localSnapshot.filter(
          (answer) => !remoteIds.has(answer.id) && (!isUuid(answer.id) || !isUuid(answer.eventGroup.id))
        );

        setWrongAnswers([...remoteAnswers, ...keepLocal]);
      } catch (error) {
        console.warn("Failed to sync wrong answers:", error);
      } finally {
        if (isMounted) {
          setIsSyncing(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const addWrongAnswer = useCallback(
    (answer: Omit<WrongAnswer, "id" | "timestamp">) => {
      const localId = `wrong_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const now = Date.now();

      const newWrongAnswer: WrongAnswer = {
        ...answer,
        id: localId,
        timestamp: now,
      };

      setWrongAnswers((prev) => [newWrongAnswer, ...prev]);

      if (!userId || !isUuid(answer.eventGroup.id)) {
        return;
      }

      void (async () => {
        try {
          const synced = await userService.addWrongAnswer(userId, {
            eventGroupId: answer.eventGroup.id,
            userPrediction: answer.userPrediction,
            correctAnswer: answer.correctAnswer,
            createdAt: new Date(now).toISOString(),
          });

          if (!synced) {
            return;
          }

          setWrongAnswers((prev) =>
            prev.map((item) =>
              item.id === localId
                ? {
                    ...item,
                    id: synced.id,
                    timestamp: synced.timestamp,
                  }
                : item
            )
          );
        } catch (error) {
          console.warn("Failed to sync new wrong answer:", error);
        }
      })();
    },
    [userId]
  );

  const removeWrongAnswer = useCallback(
    (id: string) => {
      setWrongAnswers((prev) => prev.filter((answer) => answer.id !== id));

      if (!userId) {
        return;
      }

      void userService.removeWrongAnswer(userId, id).catch((error) => {
        console.warn("Failed to remove wrong answer from cloud:", error);
      });
    },
    [userId]
  );

  const clearWrongAnswers = useCallback(() => {
    setWrongAnswers([]);

    if (!userId) {
      return;
    }

    void userService.clearWrongAnswers(userId).catch((error) => {
      console.warn("Failed to clear cloud wrong answers:", error);
    });
  }, [userId]);

  const getWrongAnswersCount = useCallback(() => wrongAnswers.length, [wrongAnswers.length]);

  return {
    wrongAnswers,
    addWrongAnswer,
    removeWrongAnswer,
    clearWrongAnswers,
    getWrongAnswersCount,
    isSyncing,
  };
}
