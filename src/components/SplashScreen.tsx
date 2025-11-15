import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [requestsComplete, setRequestsComplete] = useState(false);
  const { isAuthenticated } = useAuth();

  const smoothFillProgress = useCallback(() => {
    try {
      const fillInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(fillInterval);
            return 100;
          }
          const increment = Math.random() * 5 + 10;
          return Math.min(prev + increment, 100);
        });
      }, Math.random() * 40 + 80);

      return () => {
        try {
          clearInterval(fillInterval);
        } catch (error) {
          console.error('[SplashScreen] Error clearing fill interval:', error);
        }
      };
    } catch (error) {
      console.error('[SplashScreen] Error in smoothFillProgress:', error);
      return () => {};
    }
  }, []);

  useEffect(() => {
    try {
      console.log('[SplashScreen] Component mounted');
      
      const simulateRequests = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
          console.log('[SplashScreen] Requests completed');
          setRequestsComplete(true);
        } catch (error) {
          console.error('[SplashScreen] Error in simulateRequests:', error);
          setRequestsComplete(true);
        }
      };

      simulateRequests();

      const progressInterval = setInterval(() => {
        try {
          setProgress(prev => {
            if (prev >= 70) return prev;
            return prev + Math.random() * 3 + 2;
          });
        } catch (error) {
          console.error('[SplashScreen] Error updating progress:', error);
        }
      }, 100);

      const maxTimeout = setTimeout(() => {
        try {
          console.log('[SplashScreen] Max timeout reached (5s)');
          setRequestsComplete(true);
        } catch (error) {
          console.error('[SplashScreen] Error in maxTimeout:', error);
        }
      }, 5000);

      return () => {
        try {
          clearInterval(progressInterval);
          clearTimeout(maxTimeout);
        } catch (error) {
          console.error('[SplashScreen] Error in cleanup:', error);
        }
      };
    } catch (error) {
      console.error('[SplashScreen] Critical error in useEffect:', error);
      setRequestsComplete(true);
    }
  }, []);

  useEffect(() => {
    try {
      if (requestsComplete && progress < 100) {
        console.log('[SplashScreen] Requests complete, filling progress');
        const cleanup = smoothFillProgress();
        return cleanup;
      }
    } catch (error) {
      console.error('[SplashScreen] Error in requestsComplete effect:', error);
    }
  }, [requestsComplete, progress, smoothFillProgress]);

  useEffect(() => {
    try {
      if (progress >= 100 && isAuthenticated) {
        console.log('[SplashScreen] Progress complete and authenticated, hiding splash');
        
        const hideTimeout = setTimeout(() => {
          try {
            setIsVisible(false);
            setTimeout(() => {
              try {
                onComplete();
              } catch (error) {
                console.error('[SplashScreen] Error calling onComplete:', error);
              }
            }, 350);
          } catch (error) {
            console.error('[SplashScreen] Error hiding splash:', error);
          }
        }, 300);

        return () => {
          try {
            clearTimeout(hideTimeout);
          } catch (error) {
            console.error('[SplashScreen] Error clearing hideTimeout:', error);
          }
        };
      }
    } catch (error) {
      console.error('[SplashScreen] Critical error in completion effect:', error);
      onComplete();
    }
  }, [progress, isAuthenticated, onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsl(var(--background))',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '0 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '48px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <img
            src="/splash-logo.svg"
            alt="Logo"
            style={{
              width: '120px',
              height: '120px',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
            onError={(e) => {
              try {
                console.error('[SplashScreen] Error loading logo');
                e.currentTarget.style.display = 'none';
              } catch (error) {
                console.error('[SplashScreen] Error in onError handler:', error);
              }
            }}
          />
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #D4AF37 0%, #C9A14B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Nova Calculator
          </h1>
        </div>

        <div
          style={{
            width: '100%',
            height: '12px',
            background: 'rgba(201, 161, 75, 0.15)',
            borderRadius: '50px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #C9A14B 0%, #D4AF37 100%)',
              transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: 'inherit',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
