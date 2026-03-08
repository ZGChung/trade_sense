import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { UseAuthResult } from "../hooks/useAuth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  auth: UseAuthResult;
}

type AuthMode = "sign-in" | "sign-up";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(email);
}

export function AuthModal({ isOpen, onClose, auth }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const resetMessages = () => {
    setLocalMessage(null);
    auth.clearAuthError();
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password.trim()) {
      setLocalMessage("请输入邮箱和密码");
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setLocalMessage("请输入正确的邮箱格式");
      return;
    }
    if (mode === "sign-up" && password !== confirmPassword) {
      setLocalMessage("两次输入的密码不一致");
      return;
    }
    if (password.length < 6) {
      setLocalMessage("密码长度至少 6 位");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "sign-in") {
        await auth.signInWithEmail({ email: normalizedEmail, password });
        setLocalMessage("登录成功，正在同步你的数据...");
        onClose();
      } else {
        await auth.signUpWithEmail({ email: normalizedEmail, password });
        setLocalMessage("注册成功，已自动登录。");
        onClose();
      }
    } catch {
      // Error is surfaced by authError.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-[60] grid place-items-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
            >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">账号登录</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">登录后可跨设备同步统计与错题</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>

            {!auth.isConfigured ? (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                尚未配置 Supabase。请先设置 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`。
              </div>
            ) : (
              <>
                <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                  <button
                    onClick={() => {
                      setMode("sign-in");
                      setConfirmPassword("");
                      resetMessages();
                    }}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      mode === "sign-in"
                        ? "bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-300"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                    }`}
                  >
                    登录
                  </button>
                  <button
                    onClick={() => {
                      setMode("sign-up");
                      setConfirmPassword("");
                      resetMessages();
                    }}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      mode === "sign-up"
                        ? "bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-300"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                    }`}
                  >
                    注册
                  </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="邮箱"
                    autoComplete="email"
                    inputMode="email"
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="密码 (至少 6 位)"
                    autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  {mode === "sign-up" && (
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="确认密码"
                      autoComplete="new-password"
                      required
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "处理中..." : mode === "sign-in" ? "邮箱登录" : "邮箱注册"}
                  </button>
                </form>

                {(localMessage || auth.authError) && (
                  <div
                    className={`mt-4 rounded-lg p-3 text-sm ${
                      auth.authError
                        ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300"
                        : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    }`}
                  >
                    {auth.authError ?? localMessage}
                  </div>
                )}
              </>
            )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
