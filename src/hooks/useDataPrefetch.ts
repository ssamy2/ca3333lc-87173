import { useEffect } from 'react';
import { usePrefetchMarketData } from './useMarketData';
import { usePrefetchBlackFloorData } from './useBlackFloorData';
import { preloadImages } from '@/services/imageCache';

/**
 * Hook to prefetch all data and images for both Home and Chart pages
 * This ensures smooth navigation between pages with no loading time
 */
export const useDataPrefetch = () => {
  const prefetchMarketData = usePrefetchMarketData();
  const prefetchBlackFloorData = usePrefetchBlackFloorData();

  useEffect(() => {
    // Prefetch all data immediately
    const prefetchAll = async () => {
      try {
        // Prefetch market and black floor data in parallel
        await Promise.all([
          prefetchMarketData(),
          prefetchBlackFloorData()
        ]);

        console.log('✅ Data prefetched successfully');

        // Preload images after data is fetched
        // This is done in the background and doesn't block the UI
        preloadImages();
      } catch (error) {
        console.error('Error prefetching data:', error);
      }
    };

    prefetchAll();
  }, [prefetchMarketData, prefetchBlackFloorData]);
};
