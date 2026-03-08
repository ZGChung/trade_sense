import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  aiService,
  type AIProviderMode,
  type AISettings,
  type UserAIProvider,
} from "../services/aiService";

interface AISettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const providerOptions: Array<{ label: string; value: UserAIProvider }> = [
  { label: "DeepSeek", value: "deepseek" },
  { label: "OpenAI", value: "openai" },
  { label: "Gemini", value: "gemini" },
];

function getDefaultEndpoint(provider: UserAIProvider): string {
  if (provider === "openai") {
    return "https://api.openai.com/v1/chat/completions";
  }
  if (provider === "deepseek") {
    return "https://api.deepseek.com/chat/completions";
  }
  return "";
}

export function AISettingsPanel({ isOpen, onClose }: AISettingsPanelProps) {
  const [settings, setSettings] = useState<AISettings>(() => aiService.getSettings());
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const onModeChange = (mode: AIProviderMode) => {
    setSettings((prev) => ({ ...prev, mode }));
  };

  const onProviderChange = (provider: UserAIProvider) => {
    setSettings((prev) => ({
      ...prev,
      userProvider: provider,
      userBaseUrl: provider === "gemini" ? "" : prev.userBaseUrl || getDefaultEndpoint(provider),
    }));
  };

  const onSave = () => {
    aiService.updateSettings(settings);
    setSavedMessage("已保存。你的 Key 仅保存在当前浏览器 localStorage。");
  };

  const onClearKey = () => {
    const next = {
      ...settings,
      userApiKey: "",
    };
    setSettings(next);
    aiService.updateSettings(next);
    setSavedMessage("已清除本地 API Key。");
  };

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
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl dark:bg-gray-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI 设置</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  优先级: Gemini 免费 -&gt; 用户 Key -&gt; 静态兜底
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <section>
                <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">默认模式</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onModeChange("gemini-free")}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      settings.mode === "gemini-free"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    免费 AI
                  </button>
                  <button
                    onClick={() => onModeChange("user-key")}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      settings.mode === "user-key"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    自带 Key
                  </button>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">用户 Key 配置</h3>

                <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Provider</label>
                <select
                  value={settings.userProvider}
                  onChange={(event) => onProviderChange(event.target.value as UserAIProvider)}
                  className="mb-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {providerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">API Key</label>
                <input
                  type="password"
                  value={settings.userApiKey}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      userApiKey: event.target.value,
                    }))
                  }
                  placeholder="仅保存在本地浏览器"
                  className="mb-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />

                <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Model (可选)</label>
                <input
                  type="text"
                  value={settings.userModel}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      userModel: event.target.value,
                    }))
                  }
                  placeholder="留空使用默认模型"
                  className="mb-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />

                {settings.userProvider !== "gemini" && (
                  <>
                    <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Endpoint (可选)</label>
                    <input
                      type="text"
                      value={settings.userBaseUrl}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          userBaseUrl: event.target.value,
                        }))
                      }
                      placeholder={getDefaultEndpoint(settings.userProvider)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </>
                )}
              </section>

              <div className="flex gap-2">
                <button
                  onClick={onSave}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  保存设置
                </button>
                <button
                  onClick={onClearKey}
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  清除 Key
                </button>
              </div>

              <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                隐私说明: 你的自带 API Key 永远不会上传到服务器，只会保存在本浏览器 localStorage。
              </p>

              {savedMessage && (
                <p className="rounded-lg bg-green-50 p-3 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  {savedMessage}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
