interface CachedChart {
  imageMap: Map<string, HTMLImageElement>;
  timestamp: number;
}

const CHART_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const chartCache = new Map<string, CachedChart>();

/**
 * Generate cache key for chart data
 */
export const generateChartCacheKey = (
  chartType: string,
  timeGap: string,
  currency: string,
  dataHash: string
): string => {
  return `chart-${chartType}-${timeGap}-${currency}-${dataHash}`;
};

/**
 * Get cached chart image map
 */
export const getCachedChartImages = (cacheKey: string): Map<string, HTMLImageElement> | null => {
  const cached = chartCache.get(cacheKey);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CHART_CACHE_DURATION) {
    chartCache.delete(cacheKey);
    return null;
  }
  
  return cached.imageMap;
};

/**
 * Cache chart image map
 */
export const setCachedChartImages = (cacheKey: string, imageMap: Map<string, HTMLImageElement>): void => {
  chartCache.set(cacheKey, {
    imageMap,
    timestamp: Date.now()
  });
};

/**
 * Clear expired chart cache
 */
export const clearExpiredChartCache = (): void => {
  const now = Date.now();
  for (const [key, cached] of chartCache.entries()) {
    if (now - cached.timestamp > CHART_CACHE_DURATION) {
      chartCache.delete(key);
    }
  }
};

/**
 * Clear all chart cache
 */
export const clearAllChartCache = (): void => {
  chartCache.clear();
};

/**
 * Generate hash for data to detect changes
 * Uses a simple hash function that works with Unicode characters
 */
export const generateDataHash = (data: any): string => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};
