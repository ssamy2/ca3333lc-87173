import { useState, useEffect, useCallback } from 'react';

export const useRateLimit = () => {
  const [countdown, setCountdown] = useState(0);
  const [isLimited, setIsLimited] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsLimited(false);
    }
  }, [countdown]);

  const startCountdown = useCallback((seconds: number = 60) => {
    setCountdown(seconds);
    setIsLimited(true);
  }, []);

  const resetLimit = useCallback(() => {
    setCountdown(0);
    setIsLimited(false);
  }, []);

  return {
    countdown,
    isLimited,
    startCountdown,
    resetLimit
  };
};
