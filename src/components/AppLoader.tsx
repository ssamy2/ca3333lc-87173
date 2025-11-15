import React, { useState, useEffect, useCallback } from 'react';
import { usePrefetchMarketData } from '@/hooks/useMarketData';
import { usePrefetchBlackFloorData } from '@/hooks/useBlackFloorData';
import { useAuth } from '@/contexts/AuthContext';

// Logo component as inline SVG
const LogoIcon = () => (
  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="url(#gradient)"/>
    <path d="M20 75L20 50L30 40L40 55L50 25L60 45L70 50L80 35L80 75H20Z" fill="white" fillOpacity="0.9"/>
    <path d="M75 20L85 15L90 20L80 25L75 20Z" fill="white" fillOpacity="0.9"/>
    <defs>
      <linearGradient id="gradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2196F3"/>
        <stop offset="1" stopColor="#21CBF3"/>
      </linearGradient>
    </defs>
  </svg>
);

interface AppLoaderProps {
  onComplete: () => void;
}

const AppLoader: React.FC<AppLoaderProps> = ({ onComplete }) => {
  const prefetchMarketData = usePrefetchMarketData();
  const prefetchBlackFloorData = usePrefetchBlackFloorData();
  const { isAuthenticated } = useAuth();
  
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [requestsComplete, setRequestsComplete] = useState(false);

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
          console.error('[AppLoader] Error clearing fill interval:', error);
        }
      };
    } catch (error) {
      console.error('[AppLoader] Error in smoothFillProgress:', error);
      return () => {};
    }
  }, []);

  useEffect(() => {
    try {
      console.log('[AppLoader] Component mounted');
      
      const loadData = async () => {
        try {
          await Promise.all([
            prefetchMarketData(),
            prefetchBlackFloorData()
          ]);
          console.log('[AppLoader] Data loaded successfully');
          setRequestsComplete(true);
        } catch (error) {
          console.error('[AppLoader] Error loading data:', error);
          setRequestsComplete(true);
        }
      };

      loadData();

      const progressInterval = setInterval(() => {
        try {
          setProgress(prev => {
            if (prev >= 70) return prev;
            return prev + Math.random() * 3 + 2;
          });
        } catch (error) {
          console.error('[AppLoader] Error updating progress:', error);
        }
      }, 100);

      const maxTimeout = setTimeout(() => {
        try {
          console.log('[AppLoader] Max timeout reached (5s)');
          setRequestsComplete(true);
        } catch (error) {
          console.error('[AppLoader] Error in maxTimeout:', error);
        }
      }, 5000);

      return () => {
        try {
          clearInterval(progressInterval);
          clearTimeout(maxTimeout);
        } catch (error) {
          console.error('[AppLoader] Error in cleanup:', error);
        }
      };
    } catch (error) {
      console.error('[AppLoader] Critical error in useEffect:', error);
      setRequestsComplete(true);
    }
  }, [prefetchMarketData, prefetchBlackFloorData]);

  useEffect(() => {
    try {
      if (requestsComplete && progress < 100) {
        console.log('[AppLoader] Requests complete, filling progress');
        const cleanup = smoothFillProgress();
        return cleanup;
      }
    } catch (error) {
      console.error('[AppLoader] Error in requestsComplete effect:', error);
    }
  }, [requestsComplete, progress, smoothFillProgress]);

  useEffect(() => {
    try {
      if (progress >= 100 && isAuthenticated) {
        console.log('[AppLoader] Progress complete and authenticated, hiding loader');
        
        const hideTimeout = setTimeout(() => {
          try {
            setIsVisible(false);
            setTimeout(() => {
              try {
                onComplete();
              } catch (error) {
                console.error('[AppLoader] Error calling onComplete:', error);
              }
            }, 350);
          } catch (error) {
            console.error('[AppLoader] Error hiding loader:', error);
          }
        }, 300);

        return () => {
          try {
            clearTimeout(hideTimeout);
          } catch (error) {
            console.error('[AppLoader] Error clearing hideTimeout:', error);
          }
        };
      }
    } catch (error) {
      console.error('[AppLoader] Critical error in completion effect:', error);
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
                console.error('[AppLoader] Error loading logo');
                e.currentTarget.style.display = 'none';
              } catch (error) {
                console.error('[AppLoader] Error in onError handler:', error);
              }
            }}
          />
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              textAlign: 'center',
              background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary)))',
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
            background: 'hsl(var(--secondary))',
            borderRadius: '50px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'hsl(var(--primary))',
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

export default AppLoader;
