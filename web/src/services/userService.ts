import type { User } from "@supabase/supabase-js";
import type { EventGroup, PredictionOption } from "../models/types";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { eventService } from "./eventService";

export interface UserStats {
  totalAttempts: number;
  correctPredictions: number;
  currentStreak: number;
  maxStreak: number;
}

export interface WrongAnswerRecord {
  id: string;
  timestamp: number;
  eventGroup: EventGroup;
  userPrediction: PredictionOption;
  correctAnswer: PredictionOption;
  stockSymbol: string;
  stockName: string;
}

interface WrongAnswerInsertPayload {
  eventGroupId: string;
  userPrediction: PredictionOption;
  correctAnswer: PredictionOption;
  createdAt?: string;
}

interface WrongAnswerRow {
  id: string;
  created_at: string;
  event_group_id: string;
  user_prediction: PredictionOption;
  correct_answer: PredictionOption;
}

interface WrongAnswerRowWithGroup extends WrongAnswerRow {
  event_groups: {
    id: string;
    stock_symbol: string;
    stock_name: string;
    category: string | null;
    events: {
      id: string;
      description: string;
      event_date: string;
      stock_symbol: string;
      stock_name: string;
      actual_performance: number | string;
      days_after_event: number;
    }[];
  } | null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getCloudErrorMessage(error: unknown, fallback = "云端同步失败"): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

class UserService {
  private ensureClient(): void {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase 未配置，云端同步不可用");
    }
  }

  async ensureProfile(user: User): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    const displayName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : typeof user.email === "string"
            ? user.email.split("@")[0]
            : null;

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        display_name: displayName,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.warn("Failed to ensure user profile:", error);
    }

    // Create stats row if it does not exist.
    await this.upsertUserStats(user.id, {
      totalAttempts: 0,
      correctPredictions: 0,
      currentStreak: 0,
      maxStreak: 0,
    }).catch(() => {
      // Ignore initialization failures to avoid blocking auth flow.
    });
  }

  async getUserStats(userId: string): Promise<UserStats | null> {
    this.ensureClient();

    const { data, error } = await supabase!
      .from("user_stats")
      .select("total_attempts, correct_predictions, current_streak, max_streak")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(getCloudErrorMessage(error, "读取用户统计失败"));
    }

    if (!data) {
      return null;
    }

    return {
      totalAttempts: data.total_attempts ?? 0,
      correctPredictions: data.correct_predictions ?? 0,
      currentStreak: data.current_streak ?? 0,
      maxStreak: data.max_streak ?? 0,
    };
  }

  async upsertUserStats(userId: string, stats: UserStats): Promise<void> {
    this.ensureClient();

    const { error } = await supabase!.from("user_stats").upsert(
      {
        user_id: userId,
        total_attempts: stats.totalAttempts,
        correct_predictions: stats.correctPredictions,
        current_streak: stats.currentStreak,
        max_streak: stats.maxStreak,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      throw new Error(getCloudErrorMessage(error, "写入用户统计失败"));
    }
  }

  async getUserAchievements(userId: string): Promise<string[]> {
    this.ensureClient();

    const { data, error } = await supabase!
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId);

    if (error) {
      throw new Error(getCloudErrorMessage(error, "读取用户成就失败"));
    }

    return (data ?? []).map((row) => row.achievement_id);
  }

  async addUserAchievements(userId: string, achievementIds: string[]): Promise<void> {
    this.ensureClient();

    if (achievementIds.length === 0) {
      return;
    }

    const rows = achievementIds.map((achievementId) => ({
      user_id: userId,
      achievement_id: achievementId,
      unlocked_at: new Date().toISOString(),
    }));

    const { error } = await supabase!
      .from("user_achievements")
      .upsert(rows, { onConflict: "user_id,achievement_id", ignoreDuplicates: true });

    if (error) {
      throw new Error(getCloudErrorMessage(error, "同步用户成就失败"));
    }
  }

  async listWrongAnswers(userId: string): Promise<WrongAnswerRecord[]> {
    this.ensureClient();

    const { data, error } = await supabase!
      .from("user_wrong_answers")
      .select(
        "id, created_at, event_group_id, user_prediction, correct_answer, event_groups(id, stock_symbol, stock_name, category, events(id, description, event_date, stock_symbol, stock_name, actual_performance, days_after_event))"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(getCloudErrorMessage(error, "读取错题失败"));
    }

    const rows = (data ?? []) as unknown as WrongAnswerRowWithGroup[];

    const missingGroupIds = rows
      .filter((row) => !row.event_groups)
      .map((row) => row.event_group_id)
      .filter((id): id is string => Boolean(id));

    const fallbackGroups = await eventService.fetchEventGroupsByIds(missingGroupIds);
    const fallbackMap = new Map(fallbackGroups.map((group) => [group.id, group]));

    return rows
      .map((row) => {
        const eventGroupFromJoin = row.event_groups
          ? {
              id: row.event_groups.id,
              stockSymbol: row.event_groups.stock_symbol,
              stockName: row.event_groups.stock_name,
              category: (row.event_groups.category as EventGroup["category"]) ?? undefined,
              events: (row.event_groups.events ?? []).map((event) => ({
                id: event.id,
                description: event.description,
                date: event.event_date,
                stockSymbol: event.stock_symbol,
                stockName: event.stock_name,
                actualPerformance:
                  typeof event.actual_performance === "string"
                    ? parseFloat(event.actual_performance)
                    : event.actual_performance,
                daysAfterEvent: event.days_after_event,
              })),
            }
          : null;

        const eventGroup = eventGroupFromJoin ?? fallbackMap.get(row.event_group_id) ?? null;
        if (!eventGroup) {
          return null;
        }

        return {
          id: row.id,
          timestamp: new Date(row.created_at).getTime(),
          eventGroup,
          userPrediction: row.user_prediction,
          correctAnswer: row.correct_answer,
          stockSymbol: eventGroup.stockSymbol,
          stockName: eventGroup.stockName,
        } satisfies WrongAnswerRecord;
      })
      .filter((record): record is WrongAnswerRecord => Boolean(record));
  }

  async addWrongAnswer(
    userId: string,
    payload: WrongAnswerInsertPayload
  ): Promise<{ id: string; timestamp: number } | null> {
    this.ensureClient();

    if (!isUuid(payload.eventGroupId)) {
      return null;
    }

    const { data, error } = await supabase!
      .from("user_wrong_answers")
      .insert({
        user_id: userId,
        event_group_id: payload.eventGroupId,
        user_prediction: payload.userPrediction,
        correct_answer: payload.correctAnswer,
        created_at: payload.createdAt ?? new Date().toISOString(),
      })
      .select("id, created_at")
      .single();

    if (error) {
      throw new Error(getCloudErrorMessage(error, "写入错题失败"));
    }

    return {
      id: data.id,
      timestamp: new Date(data.created_at).getTime(),
    };
  }

  async removeWrongAnswer(userId: string, wrongAnswerId: string): Promise<void> {
    this.ensureClient();

    if (!isUuid(wrongAnswerId)) {
      return;
    }

    const { error } = await supabase!
      .from("user_wrong_answers")
      .delete()
      .eq("id", wrongAnswerId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(getCloudErrorMessage(error, "删除错题失败"));
    }
  }

  async clearWrongAnswers(userId: string): Promise<void> {
    this.ensureClient();

    const { error } = await supabase!
      .from("user_wrong_answers")
      .delete()
      .eq("user_id", userId);

    if (error) {
      throw new Error(getCloudErrorMessage(error, "清空错题失败"));
    }
  }
}

export const userService = new UserService();
