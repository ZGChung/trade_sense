import { useState, useCallback, useEffect, useRef } from 'react';

export function useCountdown(durationSeconds: number, onExpire?: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const isExpired = secondsLeft <= 0 && !isRunning;

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setIsRunning(false);
          onExpireRef.current?.();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const start = useCallback(() => {
    if (secondsLeft > 0) {
      setIsRunning(true);
    }
  }, [secondsLeft]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(durationSeconds);
  }, [durationSeconds]);

  const progress = durationSeconds > 0 ? secondsLeft / durationSeconds : 0;

  return { secondsLeft, isRunning, isExpired, progress, start, pause, reset };
}
