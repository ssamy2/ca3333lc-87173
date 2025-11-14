import React, { useState, useEffect } from 'react';
import { usePrefetchMarketData } from '@/hooks/useMarketData';
import { usePrefetchBlackFloorData } from '@/hooks/useBlackFloorData';

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
          <div className="p-5 bg-background rounded-full animate-pulse">
            <img src="/logo.png" width="100" height="100" alt="Logo" />
          </div>
        </div>

        <div role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
          <div style={{ height: '5px', background: 'var(--secondary)', borderRadius: '50px', width: '100%', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '5px', 
                width: `${progress}%`, 
                background: 'var(--primary)', 
                transition: 'width 0.5s ease-in-out', 
                borderRadius: 'inherit' 
              }}
            >
              <span style={{ display: 'none' }}>{progress}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLoader;
