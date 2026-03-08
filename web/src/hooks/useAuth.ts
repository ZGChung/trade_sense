import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { userService } from "../services/userService";

interface EmailAuthPayload {
  email: string;
  password: string;
}

export interface UseAuthResult {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithEmail: (payload: EmailAuthPayload) => Promise<void>;
  signUpWithEmail: (payload: EmailAuthPayload) => Promise<void>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

function parseError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!supabase) {
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) {
          return;
        }

        if (error) {
          setAuthError(parseError(error, "读取登录状态失败"));
        }

        setSession(data.session ?? null);
        setIsLoading(false);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setAuthError(parseError(error, "读取登录状态失败"));
        setIsLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        void userService.ensureProfile(nextSession.user);
      }
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const ensureAuthEnabled = useCallback(() => {
    if (!supabase) {
      throw new Error("Supabase Auth 尚未配置，请先设置环境变量。");
    }
  }, []);

  const signInWithEmail = useCallback(
    async ({ email, password }: EmailAuthPayload) => {
      clearAuthError();
      try {
        ensureAuthEnabled();
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) {
          throw error;
        }
      } catch (error) {
        setAuthError(parseError(error, "邮箱登录失败"));
        throw error;
      }
    },
    [clearAuthError, ensureAuthEnabled]
  );

  const signUpWithEmail = useCallback(
    async ({ email, password }: EmailAuthPayload) => {
      clearAuthError();
      try {
        ensureAuthEnabled();
        const { error } = await supabase!.auth.signUp({ email, password });
        if (error) {
          throw error;
        }
      } catch (error) {
        setAuthError(parseError(error, "邮箱注册失败"));
        throw error;
      }
    },
    [clearAuthError, ensureAuthEnabled]
  );

  const signOut = useCallback(async () => {
    clearAuthError();
    try {
      ensureAuthEnabled();
      const { error } = await supabase!.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      setAuthError(parseError(error, "退出登录失败"));
      throw error;
    }
  }, [clearAuthError, ensureAuthEnabled]);

  const user = useMemo<User | null>(() => session?.user ?? null, [session]);

  return {
    user,
    session,
    isLoading,
    authError,
    clearAuthError,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isConfigured: isSupabaseConfigured,
  };
}
