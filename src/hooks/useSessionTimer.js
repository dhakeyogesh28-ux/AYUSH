import { useState, useEffect, useRef, useCallback } from 'react';

const useSessionTimer = (durationSeconds = 300, onExpire, isActive = false) => {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const intervalRef = useRef(null);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive]);

  const formatTime = useCallback(() => {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, [timeLeft]);

  const percentLeft = (timeLeft / durationSeconds) * 100;
  const isWarning = timeLeft <= 60;
  const isCritical = timeLeft <= 30;

  return { timeLeft, formatTime, percentLeft, isWarning, isCritical };
};

export default useSessionTimer;
