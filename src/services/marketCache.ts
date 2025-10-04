interface CachedData {
  data: any;
  timestamp: number;
}

const CACHE_DURATION = 10000; // 10 seconds
const cache = new Map<string, CachedData>();

export const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

export const setCachedData = (key: string, data: any) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

export const clearCache = () => {
  cache.clear();
};