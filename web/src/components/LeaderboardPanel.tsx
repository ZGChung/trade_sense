import type { LeaderboardEntry } from "../services/analyticsService";
import type { PracticeMode } from "./ModeSelector";

interface LeaderboardPanelProps {
  title: string;
  subtitle: string;
  mode: Extract<PracticeMode, "daily" | "challenge">;
  entries: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  isLoading: boolean;
  error: string | null;
}

function formatSeconds(ms: number): string {
  const seconds = Math.max(0, ms) / 1000;
  return `${seconds.toFixed(1)}s`;
}

function renderValue(mode: "daily" | "challenge", entry: LeaderboardEntry): string {
  if (mode === "daily") {
    const percent = `${(entry.accuracy * 100).toFixed(0)}%`;
    return `准确率 ${percent} · 用时 ${formatSeconds(entry.totalTimeMs)}`;
  }

  const hearts = entry.heartsLeft ?? 0;
  return `通过 ${entry.score} 题 · ❤️ ${hearts} · 用时 ${formatSeconds(entry.totalTimeMs)}`;
}

function renderSubline(mode: "daily" | "challenge", entry: LeaderboardEntry): string {
  if (mode === "daily") {
    const totalQuestions = entry.totalQuestions > 0 ? entry.totalQuestions : 10;
    return `答对 ${entry.correctAnswers}/${totalQuestions}`;
  }

  return entry.runStatus === "quit" ? "状态：主动退出" : "状态：挑战结束";
}

function EntryRow({ mode, entry, isCurrent = false }: { mode: "daily" | "challenge"; entry: LeaderboardEntry; isCurrent?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${
        isCurrent
          ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/30"
          : "border-transparent bg-gray-50 dark:bg-gray-800"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="w-6 text-center font-semibold text-gray-700 dark:text-gray-200">{entry.rank}</span>
          <span className="truncate text-gray-800 dark:text-gray-100">{entry.displayName}</span>
        </div>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{renderValue(mode, entry)}</span>
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{renderSubline(mode, entry)}</p>
    </div>
  );
}

export function LeaderboardPanel({
  title,
  subtitle,
  mode,
  entries,
  currentUserEntry,
  isLoading,
  error,
}: LeaderboardPanelProps) {
  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>

      {isLoading ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">排行榜加载中...</p>
      ) : error ? (
        <p className="text-xs text-amber-600 dark:text-amber-300">{error}</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">暂无排行数据，先完成一轮再来看看。</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <EntryRow
              key={`${entry.playerId}-${entry.rank}`}
              mode={mode}
              entry={entry}
            />
          ))}

          <div className="my-2 border-t border-dashed border-gray-300 pt-2 dark:border-gray-600" />

          {currentUserEntry ? (
            <EntryRow mode={mode} entry={currentUserEntry} isCurrent />
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">当前用户暂无排名记录。</p>
          )}
        </div>
      )}
    </div>
  );
}
