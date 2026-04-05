import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userLabel: string;
  authLoading: boolean;
  isLoggedIn: boolean;
  onAuthClick: () => void;
  achievementsLabel: string;
  onShowAchievements: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onShowShortcuts: () => void;
  wrongAnswersCount: number;
  onShowStats: () => void;
  onShowHistory: () => void;
  onShowWrongAnswers: () => void;
  onShowAISettings: () => void;
  onShowQuest: () => void;
  onReset: () => void;
}

interface MenuButtonProps {
  label: string;
  onClick: () => void;
  icon: ReactNode;
  variant?: "default" | "danger";
  badge?: number;
  detail?: string;
}

function MenuButton({ label, onClick, icon, variant = "default", badge, detail }: MenuButtonProps) {
  const isDanger = variant === "danger";

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
        isDanger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
      }`}
    >
      <span className="flex items-center gap-3">
        <span className="inline-flex h-5 w-5 items-center justify-center">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </span>
      <span className="flex items-center gap-2">
        {detail ? <span className="text-xs text-gray-500 dark:text-gray-400">{detail}</span> : null}
        {typeof badge === "number" && badge > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-300">
            {badge}
          </span>
        )}
      </span>
    </button>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20V9" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20v-3" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4h4" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function WrongAnswersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 3h8l3 3v15H5V3h3z" />
      <path d="M9 9h6" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="m5.6 5.6 2.1 2.1" />
      <path d="m16.3 16.3 2.1 2.1" />
      <path d="m18.4 5.6-2.1 2.1" />
      <path d="m7.7 16.3-2.1 2.1" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 4h8v3a4 4 0 0 1-8 0V4z" />
      <path d="M6 4H4a2 2 0 0 0 2 2" />
      <path d="M18 4h2a2 2 0 0 1-2 2" />
      <path d="M12 11v3" />
      <path d="M9 21h6" />
      <path d="M10 14h4" />
    </svg>
  );
}

function ThemeIcon({ darkMode }: { darkMode: boolean }) {
  return darkMode ? (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v2" />
      <path d="M12 19v2" />
      <path d="M4.2 5.8 5.6 7.2" />
      <path d="M18.4 16.8 19.8 18.2" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
      <path d="M4.2 18.2 5.6 16.8" />
      <path d="M18.4 7.2 19.8 5.8" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 12.3A7.2 7.2 0 1 1 11.7 3a6 6 0 0 0 9.3 9.3z" />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="7" width="18" height="10" rx="2" />
      <path d="M7 11h.01" />
      <path d="M10 11h.01" />
      <path d="M13 11h.01" />
      <path d="M16 11h.01" />
      <path d="M7 14h10" />
    </svg>
  );
}

function QuestIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 12l2 2 4-4" />
      <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.12 0 4.07.74 5.62 1.97" />
    </svg>
  );
}

export function SideMenu({
  isOpen,
  onClose,
  userLabel,
  authLoading,
  isLoggedIn,
  onAuthClick,
  achievementsLabel,
  onShowAchievements,
  darkMode,
  onToggleDarkMode,
  onShowShortcuts,
  wrongAnswersCount,
  onShowStats,
  onShowHistory,
  onShowWrongAnswers,
  onShowAISettings,
  onShowQuest,
  onReset,
}: SideMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="fixed inset-y-0 left-0 z-50 w-72 border-r border-gray-200 bg-white p-4 shadow-xl dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">操作菜单</h2>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="关闭菜单"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950/40">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">当前账户</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{userLabel}</p>
                </div>
                <button
                  onClick={() => {
                    onAuthClick();
                    onClose();
                  }}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    authLoading
                      ? "cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      : isLoggedIn
                        ? "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                  disabled={authLoading}
                >
                  {authLoading ? "加载中" : isLoggedIn ? "退出" : "登录"}
                </button>
              </div>

              <div className="space-y-1">
                <MenuButton
                  label="成就"
                  detail={achievementsLabel}
                  onClick={() => {
                    onShowAchievements();
                    onClose();
                  }}
                  icon={<TrophyIcon />}
                />
                <MenuButton
                  label={darkMode ? "切换到浅色模式" : "切换到深色模式"}
                  onClick={() => {
                    onToggleDarkMode();
                    onClose();
                  }}
                  icon={<ThemeIcon darkMode={darkMode} />}
                />
                <MenuButton
                  label="快捷键"
                  onClick={() => {
                    onShowShortcuts();
                    onClose();
                  }}
                  icon={<KeyboardIcon />}
                />
              </div>
            </div>

            <div className="space-y-1">
              <MenuButton
                label="统计面板"
                onClick={() => {
                  onShowStats();
                  onClose();
                }}
                icon={<ChartIcon />}
              />
              <MenuButton
                label="练习历史"
                onClick={() => {
                  onShowHistory();
                  onClose();
                }}
                icon={<HistoryIcon />}
              />
              <MenuButton
                label="错题本"
                onClick={() => {
                  onShowWrongAnswers();
                  onClose();
                }}
                icon={<WrongAnswersIcon />}
                badge={wrongAnswersCount}
              />
              <MenuButton
                label="每日任务"
                onClick={() => {
                  onShowQuest();
                  onClose();
                }}
                icon={<QuestIcon />}
              />
              <MenuButton
                label="AI 设置"
                onClick={() => {
                  onShowAISettings();
                  onClose();
                }}
                icon={<SettingsIcon />}
              />
              <MenuButton
                label="重置会话"
                onClick={() => {
                  onReset();
                  onClose();
                }}
                icon={<ResetIcon />}
                variant="danger"
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
