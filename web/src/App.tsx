import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTradingSession } from "./hooks/useTradingSession";
import { useAchievements } from "./hooks/useAchievements";
import { usePracticeHistory } from "./hooks/usePracticeHistory";
import { useWrongAnswers } from "./hooks/useWrongAnswers";
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
import { PredictionOption as PredictionOptionValues, PredictionOption, getPerformanceCategory } from "./models/types";

function App() {
  const session = useTradingSession();
  const [showStats, setShowStats] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('tradesense_darkmode');
    if (saved !== null) return saved === 'true';
    return false; // Default to light mode
  });

  // Apply dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('tradesense_darkmode', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);
  
  const achievements = useAchievements(
    session.totalAttempts,
    session.currentStreak,
    session.maxStreak,
    session.challengeScore
  );
  
  const practiceHistory = usePracticeHistory();
  const wrongAnswers = useWrongAnswers();
  const [showWrongAnswers, setShowWrongAnswers] = useState(false);

  // Track previous state to detect when a practice is completed
  const [prevShowResult, setPrevShowResult] = useState(false);
  const [prevCorrectPredictions, setPrevCorrectPredictions] = useState(0);

  // Save practice record when a question is completed
  useEffect(() => {
    // When user moves from result view back to prediction (next question)
    if (prevShowResult && !session.showResult && session.totalAttempts > 0) {
      // Save record for casual mode only
      if (session.practiceMode === 'casual') {
        const isCorrect = session.correctPredictions > prevCorrectPredictions;
        practiceHistory.addRecord({
          mode: 'casual',
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
  
  // Check achievements after each prediction
  useEffect(() => {
    if (session.totalAttempts > 0) {
      achievements.checkAndUnlockAchievements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.totalAttempts, session.currentStreak, session.maxStreak, session.challengeScore]);

  const finalEvent =
    session.currentEventGroup.events[
      session.currentEventGroup.events.length - 1
    ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Prediction shortcuts (when not showing result)
      if (!session.showResult) {
        if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
          e.preventDefault();
          session.makePrediction(PredictionOptionValues.RISE);
        } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
          e.preventDefault();
          session.makePrediction(PredictionOptionValues.FALL);
        } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
          e.preventDefault();
          session.makePrediction(PredictionOptionValues.FLAT);
        }
      } else {
        // Continue / Next
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          session.nextEvent();
        }
      }

      // Global shortcuts
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        setShowStats((prev) => !prev);
      } else if (e.key === "o" || e.key === "O") {
        e.preventDefault();
        setShowAchievements((prev) => !prev);
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        setShowHistory((prev) => !prev);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        session.resetSession();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session]);

  // Safety check - ensure we have events
  if (!finalEvent || session.currentEventGroup.events.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error: No events available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Achievement Badge */}
      <AchievementBadge 
        count={achievements.unlockedCount} 
        total={achievements.totalCount}
        onClick={() => setShowAchievements(true)}
      />
      
      {/* Welcome Banner */}
      <div className="container mx-auto px-4 pt-14 max-w-2xl">
        <WelcomeBanner />
      </div>
      
      {/* Achievement Toast */}
      <AchievementToast 
        achievement={achievements.newlyUnlocked ?? null}
        onClose={achievements.clearNewlyUnlocked}
      />
      
      {/* Achievement Panel */}
      <AnimatePresence>
        {showAchievements && (
          <AchievementPanel
            unlocked={achievements.unlockedAchievements}
            locked={achievements.lockedAchievements}
            onClose={() => setShowAchievements(false)}
          />
        )}
      </AnimatePresence>
      
      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <HistoryPanel
            onClose={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>
      
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="fixed top-4 right-20 p-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors z-40"
            title={darkMode ? "切换到浅色模式" : "切换到深色模式"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              TradeSense
            </h1>
            <ModeBadge mode={session.practiceMode} />
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            训练你的交易直觉
          </p>
          <p className="text-xs text-gray-400 mt-1">
            快捷键: ↑涨 ↓跌 ←平 | 空格继续 | H统计 | O成就 | L历史 | R重置
          </p>
          
          {/* Challenge Mode Score */}
          {session.practiceMode === "challenge" && session.challengeScore > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mt-3 inline-block bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-lg"
            >
              🎯 挑战得分: {session.challengeScore}
            </motion.div>
          )}
          
          {/* Daily Challenge Score */}
          {session.practiceMode === "daily" && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mt-3 inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg"
            >
              📅 今日得分: {session.dailyScore} | 最高: {session.dailyHighScore}
            </motion.div>
          )}
          
          {/* Progress Bar */}
          <div className="mt-4 max-w-xs mx-auto">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>练习进度</span>
              <span>{session.currentEventIndex + 1}/{session.totalEvents}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${((session.currentEventIndex + 1) / session.totalEvents) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <ModeSelector
          currentMode={session.practiceMode}
          onModeChange={session.changeMode}
          isVisible={!session.showResult}
        />

        {/* Stock Category Filter */}
        <StockFilter
          selectedCategory={session.selectedCategory}
          onCategoryChange={session.changeCategory}
          searchQuery={session.searchQuery}
          onSearchChange={session.changeSearch}
        />

        {/* Stats Panel - Collapsible */}
        <div
          className={`mb-6 transition-all duration-500 ease-in-out ${
            showStats ? "opacity-100 max-h-96" : "opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          <StatsView
            totalAttempts={session.totalAttempts}
            currentStreak={session.currentStreak}
            maxStreak={session.maxStreak}
            formattedAccuracy={session.formattedAccuracy}
          />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Event Card */}
          <EventCard eventGroup={session.currentEventGroup} />

          {!session.showResult ? (
            <>
              {/* Prediction Prompt */}
              <div className="text-center px-5 py-4">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  请预测 {session.currentEventGroup.stockName} 在{" "}
                  {finalEvent.date} 后{finalEvent.daysAfterEvent}天的涨跌情况
                </p>
              </div>

              {/* Prediction Buttons */}
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
            <>
              <ResultView
                eventGroup={session.currentEventGroup}
                event={finalEvent}
                userPrediction={session.userPrediction}
                onContinue={session.nextEvent}
                totalAttempts={session.totalAttempts}
                correctPredictions={session.correctPredictions}
              />
              {/* Track wrong answers */}
              {(() => {
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
                return null;
              })()}
            </>
          ) : null}
        </div>

        {/* Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3 flex justify-between items-center">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label="Toggle stats"
          >
            {showStats ? "▲" : "📊"}
          </button>
          <button
            onClick={() => setShowWrongAnswers(true)}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
            aria-label="Wrong answers"
          >
            📝 {wrongAnswers.getWrongAnswersCount() > 0 && (
              <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                {wrongAnswers.getWrongAnswersCount()}
              </span>
            )}
          </button>
          <button
            onClick={session.resetSession}
            className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            重置
          </button>
        </div>

        {/* Wrong Answers Panel */}
        <WrongAnswersPanel
          isOpen={showWrongAnswers}
          onClose={() => setShowWrongAnswers(false)}
          wrongAnswers={wrongAnswers.wrongAnswers}
          onRemove={wrongAnswers.removeWrongAnswer}
          onClearAll={wrongAnswers.clearWrongAnswers}
        />

        {/* Spacer for fixed bottom bar */}
        <div className="h-16"></div>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

export default App;
