import { AnimatePresence, motion } from "framer-motion";

interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: "↑ / W", desc: "选择 涨" },
  { key: "↓ / S", desc: "选择 跌" },
  { key: "← / → / A", desc: "选择 平" },
  { key: "Space / Enter", desc: "继续下一题" },
  { key: "H", desc: "打开统计面板" },
  { key: "O", desc: "打开成就面板" },
  { key: "L", desc: "打开练习历史" },
  { key: "R", desc: "重置会话" },
];

export function KeyboardShortcutsPanel({ isOpen, onClose }: KeyboardShortcutsPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-gray-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">快捷键</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="关闭快捷键说明"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 p-4">
              {shortcuts.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800"
                >
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{item.key}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{item.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
