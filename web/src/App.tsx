import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { useCountdown } from "./hooks/useCountdown";
import {
  PredictionOption as PredictionOptionValues,
  PredictionOption,
  getPerformanceCategory,
} from "./models/types";

const CHALLENGE_TIMER_SECONDS = 15;

function App() {
  const auth = useAuth();
  const session = useTradingSession(auth.user?.id);

  const [showStats, setShowStats] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showWrongAnswers, setShowWrongAnswers] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("tradesense_darkmode");
    if (saved !== null) {
      return saved === "true";
    }
    return false;
  });

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
      session.makePrediction(PredictionOptionValues.FLAT);
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
        <div className="flex items-center gap-2">
          {auth.isLoading ? (
            <div className="rounded-lg bg-gray-200 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              登录状态加载中...
            </div>
          ) : auth.user ? (
            <>
              <div className="rounded-lg bg-green-100 px-3 py-2 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
                已登录
              </div>
              <button
                onClick={() => void auth.signOut()}
                className="rounded-lg bg-gray-200 px-3 py-2 text-xs text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                退出
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs text-white transition-colors hover:bg-blue-700"
            >
              登录同步
            </button>
          )}
        </div>

        <AchievementBadge
          count={achievements.unlockedCount}
          total={achievements.totalCount}
          onClick={() => setShowAchievements(true)}
        />

        <button
          onClick={toggleDarkMode}
          className="rounded-lg bg-gray-200 p-2 text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          title={darkMode ? "切换到浅色模式" : "切换到深色模式"}
          aria-label={darkMode ? "切换到浅色模式" : "切换到深色模式"}
        >
          {darkMode ? "☀️" : "🌙"}
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
            快捷键: ↑涨 ↓跌 ←平 | 空格继续 | H统计 | O成就 | L历史 | R重置
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {auth.user
              ? `云端模式: ${auth.user.email ?? auth.user.id}`
              : "匿名模式: 数据仅保存在当前浏览器"}
          </p>
          {(session.isCloudSyncing || wrongAnswers.isSyncing || achievements.isSyncing) && (
            <p className="mt-1 text-xs text-blue-500">正在同步云端数据...</p>
          )}

          {session.practiceMode === "challenge" && session.challengeScore > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mt-3 inline-block rounded-lg bg-purple-100 px-4 py-2 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
            >
              🎯 挑战得分: {session.challengeScore}
            </motion.div>
          )}

          {session.practiceMode === "daily" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mt-3 inline-block rounded-lg bg-green-100 px-4 py-2 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            >
              📅 今日得分: {session.dailyScore} | 最高: {session.dailyHighScore}
            </motion.div>
          )}

          <div className="mx-auto mt-4 max-w-xs">
            <div className="mb-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>练习进度</span>
              <span>
                {session.currentEventIndex + 1}/{session.totalEvents}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                initial={{ width: 0 }}
                animate={{
                  width: `${((session.currentEventIndex + 1) / session.totalEvents) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        <ModeSelector
          currentMode={session.practiceMode}
          onModeChange={session.changeMode}
          isVisible={!session.showResult}
        />

        <StockFilter
          selectedCategory={session.selectedCategory}
          onCategoryChange={session.changeCategory}
          searchQuery={session.searchQuery}
          onSearchChange={session.changeSearch}
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

              <div className="space-y-4 px-10">
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
