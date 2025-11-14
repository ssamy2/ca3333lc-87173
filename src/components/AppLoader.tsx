import React, { useState, useEffect } from 'react';
import { usePrefetchMarketData } from '@/hooks/useMarketData';
import { usePrefetchBlackFloorData } from '@/hooks/useBlackFloorData';

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
  
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const MAX_LOAD_TIME = 3000;
    const startTime = Date.now();
    let progressInterval: NodeJS.Timeout;
    
    const animateProgress = () => {
      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const targetProgress = Math.min((elapsed / MAX_LOAD_TIME) * 100, 99);
        setProgress(Math.floor(targetProgress));
      }, 50);
    };

    const loadData = async () => {
      try {
        animateProgress();
        
        const dataPromise = Promise.all([
          prefetchMarketData(),
          prefetchBlackFloorData()
        ]);
        
        const timeoutPromise = new Promise(resolve => 
          setTimeout(resolve, 2500)
        );
        
        await Promise.race([dataPromise, timeoutPromise]);
        
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(200, MAX_LOAD_TIME - elapsed);
        await new Promise(resolve => setTimeout(resolve, remaining));
        
        clearInterval(progressInterval);
        setProgress(100);
        await new Promise(resolve => setTimeout(resolve, 200));
        onComplete();
        
      } catch (error) {
        console.error('Error during loading:', error);
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MAX_LOAD_TIME - elapsed);
        
        setTimeout(() => {
          clearInterval(progressInterval);
          setProgress(100);
          setTimeout(() => onComplete(), 200);
        }, remaining);
      }
    };

    loadData();
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [onComplete, prefetchMarketData, prefetchBlackFloorData]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-background">
      <div className="w-1/2 lg:w-5/6 max-w-96 rounded-xl">
        <div className="w-full flex flex-col items-center justify-center mb-5">
          <div className="p-5 rounded-full">
            <div className="animate-pulse">
              <LogoIcon />
            </div>
          </div>
        </div>

        <div role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
          <div style={{ 
            height: '5px', 
            background: '#e5e7eb', 
            borderRadius: '50px', 
            width: '100%', 
            overflow: 'hidden' 
          }}>
            <div 
              style={{ 
                height: '5px', 
                width: `${progress}%`, 
                background: 'linear-gradient(90deg, #2196F3 0%, #21CBF3 100%)', 
                transition: 'width 0.3s ease-out', 
                borderRadius: 'inherit' 
              }}
            >
              <span style={{ display: 'none' }}>{progress}%</span>
            </div>
          </div>
        </div>
        
        {/* Progress Text */}
        <div className="text-center mt-3">
          <span className="text-sm font-medium" style={{ color: '#2196F3' }}>{progress}%</span>
        </div>
      </div>
    </div>
  );
};

export default AppLoader;
