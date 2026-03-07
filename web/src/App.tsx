import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useTradingSession } from "./hooks/useTradingSession";
import { useAchievements } from "./hooks/useAchievements";
import { usePracticeHistory } from "./hooks/usePracticeHistory";
import { useWrongAnswers } from "./hooks/useWrongAnswers";
import { useAuth } from "./hooks/useAuth";
import { EventCard } from "./components/EventCard";
import { PredictionButton } from "./components/PredictionButton";
import { ResultView } from "./components/ResultView";
import { StatsView } from "./components/StatsView";
import { ModeSelector, ModeBadge } from "./components/ModeSelector";
import { AchievementBadge, AchievementToast } from "./components/AchievementBadge";
import { AchievementPanel } from "./components/AchievementPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { WrongAnswersPanel } from "./components/WrongAnswersPanel";
import { StockFilter } from "./components/StockFilter";
import { WelcomeBanner } from "./components/WelcomeBanner";
import { Footer } from "./components/Footer";
import { StreakCelebration } from "./components/StreakCelebration";
import { CountdownBar } from "./components/CountdownBar";
import { AuthModal } from "./components/AuthModal";
import { AISettingsPanel } from "./components/AISettingsPanel";
import { SideMenu } from "./components/SideMenu";
import { LeaderboardPanel } from "./components/LeaderboardPanel";
import { useCountdown } from "./hooks/useCountdown";
import {
  PredictionOption as PredictionOptionValues,
  PredictionOption,
  getPerformanceCategory,
} from "./models/types";
import {
  fetchChallengeLeaderboard,
  fetchDailyLeaderboard,
  resolvePlayerIdentity,
  type LeaderboardEntry,
} from "./services/analyticsService";

const CHALLENGE_TIMER_SECONDS = 10;

const MODE_DESCRIPTIONS: Record<"casual" | "challenge" | "daily", string> = {
  casual: "练习模式：随机抽题、无限次数，可自由搜索股票并快速练习。",
  challenge: "挑战模式：每题限时10秒，答错或超时记1次失误，累计3次失误本轮结束。",
  daily: "每日挑战：每天固定10题，按正确率排名；正确率相同则总用时更短者靠前。",
};

function App() {
  const auth = useAuth();
  const session = useTradingSession(auth.user);

  const [showStats, setShowStats] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showWrongAnswers, setShowWrongAnswers] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("tradesense_darkmode");
    if (saved !== null) {
      return saved === "true";
    }
    return false;
  });

  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailyCurrentRank, setDailyCurrentRank] = useState<LeaderboardEntry | null>(null);
  const [challengeLeaderboard, setChallengeLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [challengeCurrentRank, setChallengeCurrentRank] = useState<LeaderboardEntry | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("tradesense_darkmode", String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const countdown = useCountdown(CHALLENGE_TIMER_SECONDS, () => {
    if (session.practiceMode === "challenge" && !session.showResult) {
      session.registerChallengeTimeout();
    }
  });

  useEffect(() => {
    if (session.practiceMode === "challenge" && !session.showResult) {
      countdown.reset();
      countdown.start();
    } else {
      countdown.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.practiceMode, session.showResult, session.currentEventGroup.id]);

  const achievements = useAchievements(
    session.totalAttempts,
    session.currentStreak,
    session.maxStreak,
    session.challengeScore,
    auth.user?.id
  );

  const practiceHistory = usePracticeHistory();
  const wrongAnswers = useWrongAnswers(auth.user?.id);

  const [prevShowResult, setPrevShowResult] = useState(false);
  const [prevCorrectPredictions, setPrevCorrectPredictions] = useState(0);
  const lastAttemptCountRef = useRef<number | null>(null);

  const loadLeaderboard = useCallback(async () => {
    if (!showLeaderboard || (session.practiceMode !== "daily" && session.practiceMode !== "challenge")) {
      setLeaderboardError(null);
      return;
    }

    setLeaderboardLoading(true);
    setLeaderboardError(null);

    try {
      const identity = await resolvePlayerIdentity(auth.user ?? null);

      if (session.practiceMode === "daily") {
        const snapshot = await fetchDailyLeaderboard(5, session.dailyDate, identity.playerId);
        setDailyLeaderboard(snapshot.topEntries);
        setDailyCurrentRank(snapshot.currentUserEntry);
      } else {
        const snapshot = await fetchChallengeLeaderboard(5, identity.playerId);
        setChallengeLeaderboard(snapshot.topEntries);
        setChallengeCurrentRank(snapshot.currentUserEntry);
      }
    } catch (error) {
      setLeaderboardError(error instanceof Error ? error.message : "排行榜加载失败");
    } finally {
      setLeaderboardLoading(false);
    }
  }, [showLeaderboard, session.practiceMode, session.dailyDate, auth.user]);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard, session.leaderboardRefreshKey]);

  useEffect(() => {
    if (prevShowResult && !session.showResult && session.totalAttempts > 0) {
      if (session.practiceMode === "casual") {
        const isCorrect = session.correctPredictions > prevCorrectPredictions;
        practiceHistory.addRecord({
          mode: "casual",
          totalQuestions: 1,
          correctAnswers: isCorrect ? 1 : 0,
          accuracy: isCorrect ? 100 : 0,
          maxStreak: session.currentStreak,
        });
      }
    }
    setPrevShowResult(session.showResult);
    setPrevCorrectPredictions(session.correctPredictions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.showResult, session.practiceMode, session.currentStreak]);

  const finalEvent =
    session.currentEventGroup.events[
      session.currentEventGroup.events.length - 1
    ];

  useEffect(() => {
    if (session.showResult && session.userPrediction && finalEvent) {
      const correctAnswer = getPerformanceCategory(finalEvent.actualPerformance);
      if (session.userPrediction !== correctAnswer) {
        wrongAnswers.addWrongAnswer({
          eventGroup: session.currentEventGroup,
          userPrediction: session.userPrediction,
          correctAnswer,
          stockSymbol: session.currentEventGroup.stockSymbol,
          stockName: session.currentEventGroup.stockName,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.showResult]);

  useEffect(() => {
    if (lastAttemptCountRef.current === null) {
      lastAttemptCountRef.current = session.totalAttempts;
      return;
    }

    if (session.totalAttempts > lastAttemptCountRef.current) {
      achievements.checkAndUnlockAchievements();
    }
    lastAttemptCountRef.current = session.totalAttempts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.totalAttempts, session.currentStreak, session.maxStreak, session.challengeScore]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (!session.showResult) {
        if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
          event.preventDefault();
          session.makePrediction(PredictionOptionValues.RISE);
        } else if (
          event.key === "ArrowDown" ||
          event.key === "s" ||
          event.key === "S"
        ) {
          event.preventDefault();
          session.makePrediction(PredictionOptionValues.FALL);
        } else if (
          event.key === "ArrowLeft" ||
          event.key === "ArrowRight" ||
          event.key === "a" ||
          event.key === "A"
        ) {
          event.preventDefault();
          session.makePrediction(PredictionOptionValues.FLAT);
        }
      } else if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        session.nextEvent();
      }

      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        setShowStats((prev) => !prev);
      } else if (event.key === "o" || event.key === "O") {
        event.preventDefault();
        setShowAchievements((prev) => !prev);
      } else if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        setShowHistory((prev) => !prev);
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        session.resetSession();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session]);

  if (session.isLoadingEvents && !finalEvent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-500 dark:text-gray-400">正在加载题目数据...</p>
      </div>
    );
  }

  if (!finalEvent || session.currentEventGroup.events.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error: No events available</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            刷新重试
          </button>
        </div>
      </div>
    );
  }

  const modeDescription = MODE_DESCRIPTIONS[session.practiceMode];

  const renderModeInfo = () => {
    if (session.practiceMode === "daily") {
      return null;
    }

    if (session.practiceMode === "challenge") {
      return (
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-900/20">
          <div className="text-center">
            <p className="text-xs text-amber-700 dark:text-amber-300">本轮通过</p>
            <p className="text-lg font-semibold text-amber-800 dark:text-amber-100">{session.challengeCurrentScore}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-amber-700 dark:text-amber-300">失误</p>
            <p className="text-lg font-semibold text-amber-800 dark:text-amber-100">{session.challengeStrikes}/3</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-amber-700 dark:text-amber-300">生命</p>
            <p className="text-lg font-semibold text-amber-800 dark:text-amber-100">
              {Array.from({ length: 3 }, (_, index) =>
                index < session.challengeHeartsLeft ? "❤️" : "🖤"
              ).join(" ")}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/40 dark:bg-blue-900/20">
        <div className="text-center">
          <p className="text-xs text-blue-700 dark:text-blue-300">累计作答</p>
          <p className="text-lg font-semibold text-blue-800 dark:text-blue-100">{session.totalAttempts}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-blue-700 dark:text-blue-300">当前连胜</p>
          <p className="text-lg font-semibold text-blue-800 dark:text-blue-100">{session.currentStreak}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-blue-700 dark:text-blue-300">正确率</p>
          <p className="text-lg font-semibold text-blue-800 dark:text-blue-100">{session.formattedAccuracy}</p>
        </div>
      </div>
    );
  };

  const topControlClass =
    "inline-flex h-11 w-36 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-3 text-sm font-semibold text-gray-700 shadow-md transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-200 dark:hover:bg-gray-800";

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 dark:bg-gray-950">
      <button
        onClick={() => setShowSideMenu(true)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-white/95 p-2.5 text-gray-700 shadow-md transition-colors hover:bg-gray-100 dark:bg-gray-900/90 dark:text-gray-200 dark:hover:bg-gray-800"
        aria-label="打开菜单"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      </button>

      <div className="fixed right-4 top-4 z-40 flex flex-col items-end gap-2">
        {auth.isLoading ? (
          <div className={`${topControlClass} cursor-not-allowed opacity-80`}>
            登录状态加载中...
          </div>
        ) : auth.user ? (
          <button
            onClick={() => void auth.signOut()}
            className={topControlClass}
          >
            退出登录
          </button>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className={topControlClass}
          >
            登录同步
          </button>
        )}

        <AchievementBadge
          count={achievements.unlockedCount}
          total={achievements.totalCount}
          onClick={() => setShowAchievements(true)}
          className={topControlClass}
        />

        <button
          onClick={toggleDarkMode}
          className={topControlClass}
          title={darkMode ? "切换到浅色模式" : "切换到深色模式"}
          aria-label={darkMode ? "切换到浅色模式" : "切换到深色模式"}
        >
          <span>{darkMode ? "☀️" : "🌙"}</span>
          <span>{darkMode ? "浅色模式" : "深色模式"}</span>
        </button>
      </div>

      <div className="container mx-auto max-w-2xl px-4 pt-14">
        <WelcomeBanner />
      </div>

      <StreakCelebration streak={session.currentStreak} />

      <AchievementToast
        achievement={achievements.newlyUnlocked ?? null}
        onClose={achievements.clearNewlyUnlocked}
      />

      <AnimatePresence>
        {showAchievements && (
          <AchievementPanel
            unlocked={achievements.unlockedAchievements}
            locked={achievements.lockedAchievements}
            onClose={() => setShowAchievements(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      </AnimatePresence>

      <div className="container mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 pt-4 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">TradeSense</h1>
            <ModeBadge mode={session.practiceMode} />
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">训练你的交易直觉</p>
          <p className="mt-1 text-xs text-gray-400">
            快捷键: ↑涨 ↓跌 ←平 / →平 | 空格继续 | H统计 | O成就 | L历史 | R重置
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {auth.user
              ? `云端模式: ${auth.user.email ?? auth.user.id}`
              : "匿名模式: 数据会被记录用于题目难度校准"}
          </p>
          {(session.isCloudSyncing || wrongAnswers.isSyncing || achievements.isSyncing) && (
            <p className="mt-1 text-xs text-blue-500">正在同步云端数据...</p>
          )}
        </div>

        <ModeSelector
          currentMode={session.practiceMode}
          onModeChange={(mode) => {
            session.changeMode(mode);
            if (mode === "casual") {
              setShowLeaderboard(false);
            }
          }}
          isVisible
          showLeaderboardButton={session.practiceMode !== "casual"}
          leaderboardOpen={showLeaderboard}
          onLeaderboardClick={() => setShowLeaderboard((prev) => !prev)}
        />

        <p className="mb-3 text-center text-sm text-gray-600 dark:text-gray-300">{modeDescription}</p>

        {renderModeInfo()}

        {showLeaderboard && session.practiceMode === "daily" && (
          <LeaderboardPanel
            mode="daily"
            title="每日挑战排行榜"
            subtitle={`日期 ${session.dailyDate} · Top 5 + 你的排名`}
            entries={dailyLeaderboard}
            currentUserEntry={dailyCurrentRank}
            isLoading={leaderboardLoading}
            error={leaderboardError}
          />
        )}
        {showLeaderboard && session.practiceMode === "challenge" && (
          <LeaderboardPanel
            mode="challenge"
            title="挑战模式排行榜"
            subtitle="Top 5 + 你的排名 · 排名规则: 通过题数 > 剩余生命 > 总用时"
            entries={challengeLeaderboard}
            currentUserEntry={challengeCurrentRank}
            isLoading={leaderboardLoading}
            error={leaderboardError}
          />
        )}

        <StockFilter
          selectedCategory={session.selectedCategory}
          onCategoryChange={session.changeCategory}
          searchQuery={session.searchQuery}
          onSearchChange={session.practiceMode === "casual" ? session.changeSearch : undefined}
        />

        {session.eventLoadError && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            数据加载已降级到本地缓存: {session.eventLoadError}
          </div>
        )}

        {session.isLoadingEvents && (
          <div className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">正在拉取最新题目...</div>
        )}

        <div
          className={`mb-6 transition-all duration-500 ease-in-out ${
            showStats ? "max-h-96 opacity-100" : "max-h-0 overflow-hidden opacity-0"
          }`}
        >
          <StatsView
            totalAttempts={session.totalAttempts}
            currentStreak={session.currentStreak}
            maxStreak={session.maxStreak}
            formattedAccuracy={session.formattedAccuracy}
          />
        </div>

        <div className="space-y-6">
          <EventCard eventGroup={session.currentEventGroup} />

          {!session.showResult ? (
            <>
              {session.practiceMode === "challenge" && (
                <CountdownBar
                  secondsLeft={countdown.secondsLeft}
                  progress={countdown.progress}
                  isRunning={countdown.isRunning}
                />
              )}

              <div className="px-5 py-4 text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  请预测 {session.currentEventGroup.stockName} 在 {finalEvent.date} 后
                  {finalEvent.daysAfterEvent}天的涨跌情况
                </p>
              </div>

              <div className="space-y-4 px-6 sm:px-10">
                {Object.values(PredictionOptionValues).map((option) => (
                  <PredictionButton
                    key={option}
                    option={option as PredictionOption}
                    isSelected={session.userPrediction === option}
                    onClick={() => session.makePrediction(option as PredictionOption)}
                  />
                ))}
              </div>
            </>
          ) : session.userPrediction ? (
            <ResultView
              eventGroup={session.currentEventGroup}
              event={finalEvent}
              userPrediction={session.userPrediction}
              onContinue={session.nextEvent}
              totalAttempts={session.totalAttempts}
              correctPredictions={session.correctPredictions}
            />
          ) : null}
        </div>

        <SideMenu
          isOpen={showSideMenu}
          onClose={() => setShowSideMenu(false)}
          showStats={showStats}
          wrongAnswersCount={wrongAnswers.getWrongAnswersCount()}
          onToggleStats={() => setShowStats((prev) => !prev)}
          onShowHistory={() => setShowHistory(true)}
          onShowWrongAnswers={() => setShowWrongAnswers(true)}
          onShowAISettings={() => setShowAISettings(true)}
          onReset={session.resetSession}
        />

        <WrongAnswersPanel
          isOpen={showWrongAnswers}
          onClose={() => setShowWrongAnswers(false)}
          wrongAnswers={wrongAnswers.wrongAnswers}
          onRemove={wrongAnswers.removeWrongAnswer}
          onClearAll={wrongAnswers.clearWrongAnswers}
          onPractice={(answer) => {
            session.practiceEventGroup(answer.eventGroup);
            setShowWrongAnswers(false);
          }}
        />

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          auth={auth}
        />

        <AISettingsPanel
          isOpen={showAISettings}
          onClose={() => setShowAISettings(false)}
        />

        <Footer />
      </div>
    </div>
  );
}

export default App;
