import type { User } from "@supabase/supabase-js";
import type { PredictionOption } from "../models/types";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const DEVICE_ID_KEY = "tradesense_device_id";
const ANON_NUMERIC_ID_KEY = "tradesense_anonymous_numeric_id";
const ANON_PLAYER_ID_KEY = "tradesense_anonymous_player_id";
const ANON_DISPLAY_NAME_KEY = "tradesense_anonymous_display_name";

type SessionMode = "casual" | "challenge" | "daily";

interface PlayerIdentity {
  userId: string | null;
  anonymousUserId: number | null;
  playerId: string;
  displayName: string;
}

interface PracticeAttemptPayload {
  mode: SessionMode;
  eventGroupId: string;
  userPrediction: PredictionOption;
  correctAnswer: PredictionOption;
  isCorrect: boolean;
  responseTimeMs: number;
  challengeRunId?: string;
  dailyDate?: string;
  occurredAt?: string;
}

interface LeaderboardScorePayload {
  mode: "daily" | "challenge";
  score: number;
  scoreDate?: string;
}

interface LeaderboardRow {
  player_id: string;
  display_name: string;
  score: number;
  created_at: string;
  score_date: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  score: number;
  scoreDate: string;
  createdAt: string;
}

let anonymousIdentityPromise: Promise<PlayerIdentity> | null = null;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function createLocalDeviceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateDeviceId(): string {
  const saved = localStorage.getItem(DEVICE_ID_KEY);
  if (saved && saved.trim().length > 0) {
    return saved;
  }

  const newId = createLocalDeviceId();
  localStorage.setItem(DEVICE_ID_KEY, newId);
  return newId;
}

function buildLocalAnonymousIdentity(): PlayerIdentity {
  let numericId = Number(localStorage.getItem(ANON_NUMERIC_ID_KEY) ?? "0");
  if (!Number.isFinite(numericId) || numericId <= 0) {
    numericId = Date.now();
    localStorage.setItem(ANON_NUMERIC_ID_KEY, String(numericId));
  }

  const playerId = `anonymous-${numericId}`;
  const displayName = `匿名#${numericId}`;
  localStorage.setItem(ANON_PLAYER_ID_KEY, playerId);
  localStorage.setItem(ANON_DISPLAY_NAME_KEY, displayName);

  return {
    userId: null,
    anonymousUserId: numericId,
    playerId,
    displayName,
  };
}

async function getOrCreateAnonymousIdentity(): Promise<PlayerIdentity> {
  const savedPlayerId = localStorage.getItem(ANON_PLAYER_ID_KEY);
  const savedDisplayName = localStorage.getItem(ANON_DISPLAY_NAME_KEY);
  const savedNumericId = Number(localStorage.getItem(ANON_NUMERIC_ID_KEY) ?? "0");

  if (
    savedPlayerId &&
    savedDisplayName &&
    Number.isFinite(savedNumericId) &&
    savedNumericId > 0
  ) {
    return {
      userId: null,
      anonymousUserId: savedNumericId,
      playerId: savedPlayerId,
      displayName: savedDisplayName,
    };
  }

  if (!isSupabaseConfigured || !supabase) {
    return buildLocalAnonymousIdentity();
  }

  const deviceId = getOrCreateDeviceId();

  const { data: existing, error: selectError } = await supabase
    .from("anonymous_users")
    .select("id")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (selectError) {
    console.warn("Failed to query anonymous identity:", selectError);
    return buildLocalAnonymousIdentity();
  }

  let numericId: number | null = existing?.id ?? null;

  if (!numericId) {
    const { data: inserted, error: insertError } = await supabase
      .from("anonymous_users")
      .insert({ device_id: deviceId })
      .select("id")
      .single();

    if (insertError) {
      // Handle race condition on unique device_id.
      const { data: raced } = await supabase
        .from("anonymous_users")
        .select("id")
        .eq("device_id", deviceId)
        .maybeSingle();

      numericId = raced?.id ?? null;
    } else {
      numericId = inserted.id;
    }
  }

  if (!numericId) {
    return buildLocalAnonymousIdentity();
  }

  const playerId = `anonymous-${numericId}`;
  const displayName = `匿名#${numericId}`;

  localStorage.setItem(ANON_NUMERIC_ID_KEY, String(numericId));
  localStorage.setItem(ANON_PLAYER_ID_KEY, playerId);
  localStorage.setItem(ANON_DISPLAY_NAME_KEY, displayName);

  return {
    userId: null,
    anonymousUserId: numericId,
    playerId,
    displayName,
  };
}

function getUserDisplayName(user: Pick<User, "id" | "email" | "user_metadata">): string {
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null;

  if (metadataName && metadataName.trim().length > 0) {
    return metadataName.trim();
  }

  if (user.email && user.email.includes("@")) {
    return user.email.split("@")[0];
  }

  return `用户#${user.id.slice(0, 6)}`;
}

export async function resolvePlayerIdentity(user?: Pick<User, "id" | "email" | "user_metadata"> | null): Promise<PlayerIdentity> {
  if (user?.id) {
    return {
      userId: user.id,
      anonymousUserId: null,
      playerId: `user-${user.id}`,
      displayName: getUserDisplayName(user),
    };
  }

  if (!anonymousIdentityPromise) {
    anonymousIdentityPromise = getOrCreateAnonymousIdentity();
  }

  try {
    return await anonymousIdentityPromise;
  } finally {
    anonymousIdentityPromise = null;
  }
}

export async function trackPracticeAttempt(
  user: Pick<User, "id" | "email" | "user_metadata"> | null,
  payload: PracticeAttemptPayload
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  try {
    const identity = await resolvePlayerIdentity(user);

    const { error } = await supabase.from("practice_attempts").insert({
      user_id: identity.userId,
      anonymous_user_id: identity.anonymousUserId,
      player_id: identity.playerId,
      display_name: identity.displayName,
      mode: payload.mode,
      event_group_id: isUuid(payload.eventGroupId) ? payload.eventGroupId : null,
      user_prediction: payload.userPrediction,
      correct_answer: payload.correctAnswer,
      is_correct: payload.isCorrect,
      response_time_ms: Math.max(0, Math.floor(payload.responseTimeMs)),
      challenge_run_id: payload.challengeRunId ?? null,
      daily_date: payload.dailyDate ?? null,
      occurred_at: payload.occurredAt ?? new Date().toISOString(),
    });

    if (error) {
      console.warn("Failed to insert practice attempt:", error);
    }
  } catch (error) {
    console.warn("trackPracticeAttempt failed:", error);
  }
}

export async function trackLeaderboardScore(
  user: Pick<User, "id" | "email" | "user_metadata"> | null,
  payload: LeaderboardScorePayload
): Promise<void> {
  if (!isSupabaseConfigured || !supabase || payload.score < 0) {
    return;
  }

  try {
    const identity = await resolvePlayerIdentity(user);

    const { error } = await supabase.from("leaderboard_scores").insert({
      user_id: identity.userId,
      anonymous_user_id: identity.anonymousUserId,
      player_id: identity.playerId,
      display_name: identity.displayName,
      mode: payload.mode,
      score: payload.score,
      score_date: payload.scoreDate ?? getTodayDateString(),
    });

    if (error) {
      console.warn("Failed to insert leaderboard score:", error);
    }
  } catch (error) {
    console.warn("trackLeaderboardScore failed:", error);
  }
}

function rankLeaderboardRows(rows: LeaderboardRow[], limit: number): LeaderboardEntry[] {
  const bestPerPlayer = new Map<string, LeaderboardRow>();

  for (const row of rows) {
    const existing = bestPerPlayer.get(row.player_id);
    if (!existing) {
      bestPerPlayer.set(row.player_id, row);
      continue;
    }

    if (row.score > existing.score) {
      bestPerPlayer.set(row.player_id, row);
      continue;
    }

    if (row.score === existing.score && row.created_at < existing.created_at) {
      bestPerPlayer.set(row.player_id, row);
    }
  }

  return Array.from(bestPerPlayer.values())
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.created_at.localeCompare(b.created_at);
    })
    .slice(0, limit)
    .map((row, index) => ({
      rank: index + 1,
      playerId: row.player_id,
      displayName: row.display_name,
      score: row.score,
      scoreDate: row.score_date,
      createdAt: row.created_at,
    }));
}

export async function fetchDailyLeaderboard(limit = 10, date = getTodayDateString()): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("leaderboard_scores")
    .select("player_id, display_name, score, created_at, score_date")
    .eq("mode", "daily")
    .eq("score_date", date)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(300);

  if (error) {
    console.warn("Failed to fetch daily leaderboard:", error);
    return [];
  }

  return rankLeaderboardRows((data ?? []) as LeaderboardRow[], limit);
}

export async function fetchChallengeLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("leaderboard_scores")
    .select("player_id, display_name, score, created_at, score_date")
    .eq("mode", "challenge")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    console.warn("Failed to fetch challenge leaderboard:", error);
    return [];
  }

  return rankLeaderboardRows((data ?? []) as LeaderboardRow[], limit);
}
