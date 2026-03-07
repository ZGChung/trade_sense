import type { User } from "@supabase/supabase-js";
import type { PredictionOption } from "../models/types";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const DEVICE_ID_KEY = "tradesense_device_id";
const ANON_NUMERIC_ID_KEY = "tradesense_anonymous_numeric_id";
const ANON_PLAYER_ID_KEY = "tradesense_anonymous_player_id";
const ANON_DISPLAY_NAME_KEY = "tradesense_anonymous_display_name";
const ANON_COUNTER_KEY = "tradesense_anonymous_counter";

type SessionMode = "casual" | "challenge" | "daily";
export type ChallengeRunStatus = "completed" | "failed" | "quit";

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
  totalQuestions?: number;
  correctAnswers?: number;
  totalTimeMs?: number;
  heartsLeft?: number;
  runStatus?: ChallengeRunStatus;
}

interface LeaderboardRow {
  player_id: string;
  display_name: string;
  score: number;
  created_at: string;
  score_date: string;
  total_questions?: number | null;
  correct_answers?: number | null;
  total_time_ms?: number | null;
  hearts_left?: number | null;
  run_status?: ChallengeRunStatus | null;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  score: number;
  scoreDate: string;
  createdAt: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  totalTimeMs: number;
  heartsLeft: number | null;
  runStatus: ChallengeRunStatus | null;
}

export interface LeaderboardSnapshot {
  topEntries: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  totalPlayers: number;
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

function allocateLocalAnonymousNumericId(): number {
  const rawCounter = Number(localStorage.getItem(ANON_COUNTER_KEY) ?? "0");
  const counter = Number.isFinite(rawCounter) && rawCounter >= 0 ? Math.floor(rawCounter) : 0;
  const next = counter + 1;
  localStorage.setItem(ANON_COUNTER_KEY, String(next));
  return next;
}

function buildLocalAnonymousIdentity(): PlayerIdentity {
  let numericId = Number(localStorage.getItem(ANON_NUMERIC_ID_KEY) ?? "0");
  if (!Number.isFinite(numericId) || numericId <= 0) {
    numericId = allocateLocalAnonymousNumericId();
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

function clampNonNegativeInt(value: number | undefined, fallback = 0): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.floor(value as number));
}

function isMissingColumnError(message: string): boolean {
  return /column .* does not exist/i.test(message);
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
    const totalQuestions = clampNonNegativeInt(payload.totalQuestions, payload.mode === "daily" ? 10 : payload.score);
    const correctAnswers = clampNonNegativeInt(payload.correctAnswers, payload.score);
    const totalTimeMs = clampNonNegativeInt(payload.totalTimeMs, 0);
    const heartsLeft = payload.mode === "challenge" ? clampNonNegativeInt(payload.heartsLeft, 0) : null;
    const runStatus = payload.mode === "challenge" ? payload.runStatus ?? "completed" : null;

    const insertPayload = {
      user_id: identity.userId,
      anonymous_user_id: identity.anonymousUserId,
      player_id: identity.playerId,
      display_name: identity.displayName,
      mode: payload.mode,
      score: payload.score,
      score_date: payload.scoreDate ?? getTodayDateString(),
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      total_time_ms: totalTimeMs,
      hearts_left: heartsLeft,
      run_status: runStatus,
    };

    const { error } = await supabase.from("leaderboard_scores").insert(insertPayload);

    if (error && isMissingColumnError(error.message ?? "")) {
      // Backward compatibility for projects that have not applied latest schema yet.
      const { error: fallbackError } = await supabase.from("leaderboard_scores").insert({
        user_id: identity.userId,
        anonymous_user_id: identity.anonymousUserId,
        player_id: identity.playerId,
        display_name: identity.displayName,
        mode: payload.mode,
        score: payload.score,
        score_date: payload.scoreDate ?? getTodayDateString(),
      });

      if (fallbackError) {
        console.warn("Failed to insert leaderboard score (fallback):", fallbackError);
      }
      return;
    }

    if (error) {
      console.warn("Failed to insert leaderboard score:", error);
    }
  } catch (error) {
    console.warn("trackLeaderboardScore failed:", error);
  }
}

function normalizeRowNumber(value: number | null | undefined, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Number(value);
}

function extractMetrics(row: LeaderboardRow): {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  totalTimeMs: number;
  heartsLeft: number | null;
  runStatus: ChallengeRunStatus | null;
} {
  const totalQuestions = Math.max(0, Math.floor(normalizeRowNumber(row.total_questions, 0)));
  const fallbackCorrect = Math.max(0, Math.floor(normalizeRowNumber(row.score, 0)));
  const correctAnswers = Math.max(
    0,
    Math.min(
      totalQuestions > 0 ? totalQuestions : Number.MAX_SAFE_INTEGER,
      Math.floor(normalizeRowNumber(row.correct_answers, fallbackCorrect))
    )
  );

  const denominator = totalQuestions > 0 ? totalQuestions : Math.max(1, fallbackCorrect);
  const accuracy = Math.min(1, Math.max(0, correctAnswers / denominator));
  const totalTimeMs = Math.max(0, Math.floor(normalizeRowNumber(row.total_time_ms, 0)));

  const heartsLeftRaw = row.hearts_left;
  const heartsLeft =
    heartsLeftRaw === null || heartsLeftRaw === undefined
      ? null
      : Math.max(0, Math.min(3, Math.floor(normalizeRowNumber(heartsLeftRaw, 0))));

  const runStatus =
    row.run_status === "completed" || row.run_status === "failed" || row.run_status === "quit"
      ? row.run_status
      : null;

  return {
    totalQuestions,
    correctAnswers,
    accuracy,
    totalTimeMs,
    heartsLeft,
    runStatus,
  };
}

function compareDailyRows(a: LeaderboardRow, b: LeaderboardRow): number {
  const aMetrics = extractMetrics(a);
  const bMetrics = extractMetrics(b);

  if (bMetrics.accuracy !== aMetrics.accuracy) {
    return bMetrics.accuracy - aMetrics.accuracy;
  }

  if (aMetrics.totalTimeMs !== bMetrics.totalTimeMs) {
    return aMetrics.totalTimeMs - bMetrics.totalTimeMs;
  }

  if (b.score !== a.score) {
    return b.score - a.score;
  }

  return a.created_at.localeCompare(b.created_at);
}

function compareChallengeRows(a: LeaderboardRow, b: LeaderboardRow): number {
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  const aHearts = extractMetrics(a).heartsLeft ?? 0;
  const bHearts = extractMetrics(b).heartsLeft ?? 0;
  if (bHearts !== aHearts) {
    return bHearts - aHearts;
  }

  const aTime = extractMetrics(a).totalTimeMs;
  const bTime = extractMetrics(b).totalTimeMs;
  if (aTime !== bTime) {
    return aTime - bTime;
  }

  return a.created_at.localeCompare(b.created_at);
}

function pickBestPerPlayer(
  rows: LeaderboardRow[],
  comparator: (a: LeaderboardRow, b: LeaderboardRow) => number
): LeaderboardRow[] {
  const bestPerPlayer = new Map<string, LeaderboardRow>();

  for (const row of rows) {
    const existing = bestPerPlayer.get(row.player_id);
    if (!existing || comparator(row, existing) < 0) {
      bestPerPlayer.set(row.player_id, row);
    }
  }

  return Array.from(bestPerPlayer.values());
}

function toEntry(row: LeaderboardRow, rank: number): LeaderboardEntry {
  const metrics = extractMetrics(row);

  return {
    rank,
    playerId: row.player_id,
    displayName: row.display_name,
    score: row.score,
    scoreDate: row.score_date,
    createdAt: row.created_at,
    totalQuestions: metrics.totalQuestions,
    correctAnswers: metrics.correctAnswers,
    accuracy: metrics.accuracy,
    totalTimeMs: metrics.totalTimeMs,
    heartsLeft: metrics.heartsLeft,
    runStatus: metrics.runStatus,
  };
}

function buildSnapshot(
  rows: LeaderboardRow[],
  limit: number,
  viewerPlayerId: string | null,
  comparator: (a: LeaderboardRow, b: LeaderboardRow) => number
): LeaderboardSnapshot {
  const deduped = pickBestPerPlayer(rows, comparator);
  const rankedRows = deduped.sort(comparator);
  const rankedEntries = rankedRows.map((row, index) => toEntry(row, index + 1));

  return {
    topEntries: rankedEntries.slice(0, limit),
    currentUserEntry: viewerPlayerId
      ? rankedEntries.find((entry) => entry.playerId === viewerPlayerId) ?? null
      : null,
    totalPlayers: rankedEntries.length,
  };
}

async function fetchLeaderboardRows(mode: "daily" | "challenge", date?: string): Promise<LeaderboardRow[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  let query = supabase
    .from("leaderboard_scores")
    .select(
      "player_id, display_name, score, created_at, score_date, total_questions, correct_answers, total_time_ms, hearts_left, run_status"
    )
    .eq("mode", mode)
    .limit(3000);

  if (date) {
    query = query.eq("score_date", date);
  }

  const { data, error } = await query;

  if (error && isMissingColumnError(error.message ?? "")) {
    const fallbackQuery = supabase
      .from("leaderboard_scores")
      .select("player_id, display_name, score, created_at, score_date")
      .eq("mode", mode)
      .limit(3000);

    const { data: fallbackData, error: fallbackError } = date
      ? await fallbackQuery.eq("score_date", date)
      : await fallbackQuery;

    if (fallbackError) {
      console.warn(`Failed to fetch ${mode} leaderboard (fallback):`, fallbackError);
      return [];
    }

    return ((fallbackData ?? []) as LeaderboardRow[]).map((row) => ({
      ...row,
      total_questions: mode === "daily" ? 10 : row.score,
      correct_answers: row.score,
      total_time_ms: 0,
      hearts_left: mode === "challenge" ? 0 : null,
      run_status: null,
    }));
  }

  if (error) {
    console.warn(`Failed to fetch ${mode} leaderboard:`, error);
    return [];
  }

  return (data ?? []) as LeaderboardRow[];
}

export async function fetchDailyLeaderboard(
  limit = 5,
  date = getTodayDateString(),
  viewerPlayerId: string | null = null
): Promise<LeaderboardSnapshot> {
  const rows = await fetchLeaderboardRows("daily", date);
  return buildSnapshot(rows, limit, viewerPlayerId, compareDailyRows);
}

export async function fetchChallengeLeaderboard(
  limit = 5,
  viewerPlayerId: string | null = null
): Promise<LeaderboardSnapshot> {
  const rows = await fetchLeaderboardRows("challenge");
  return buildSnapshot(rows, limit, viewerPlayerId, compareChallengeRows);
}
