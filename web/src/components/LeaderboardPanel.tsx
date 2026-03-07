import type { LeaderboardEntry } from "../services/analyticsService";

interface LeaderboardPanelProps {
  title: string;
  subtitle: string;
  entries: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
}

export function LeaderboardPanel({ title, subtitle, entries, isLoading, error }: LeaderboardPanelProps) {
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
        <p className="text-xs text-gray-500 dark:text-gray-400">暂无排行数据，先完成几轮挑战吧。</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={`${entry.playerId}-${entry.rank}`}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="w-6 text-center font-semibold text-gray-700 dark:text-gray-300">
                  {entry.rank}
                </span>
                <span className="truncate text-gray-700 dark:text-gray-200">{entry.displayName}</span>
              </div>
              <span className="font-semibold text-blue-600 dark:text-blue-300">{entry.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
