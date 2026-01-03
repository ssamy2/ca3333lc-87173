/**
 * Image Cache Utility
 * Caches images in localStorage to avoid repeated downloads
 */

const CACHE_PREFIX = 'img_cache_';
const CACHE_VERSION = 'v1';
const MAX_CACHE_SIZE = 50; // Maximum number of images to cache
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface CachedImage {
  data: string;
  timestamp: number;
  url: string;
}

/**
 * Generate a simple hash for the URL
 */
function hashUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get cache key for an image URL
 */
function getCacheKey(url: string): string {
  return `${CACHE_PREFIX}${CACHE_VERSION}_${hashUrl(url)}`;
}

/**
 * Check if cached image is still valid
 */
function isValidCache(cached: CachedImage): boolean {
  const now = Date.now();
  return (now - cached.timestamp) < CACHE_EXPIRY;
}

/**
 * Get image from cache
 */
export function getCachedImage(url: string): string | null {
  try {
    const key = getCacheKey(url);
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    const data: CachedImage = JSON.parse(cached);
    
    // Check if cache is still valid
    if (!isValidCache(data)) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error('Error reading from image cache:', error);
    return null;
  }
}

/**
 * Save image to cache
 */
export function setCachedImage(url: string, dataUrl: string): void {
  try {
    const key = getCacheKey(url);
    const data: CachedImage = {
      data: dataUrl,
      timestamp: Date.now(),
      url: url
    };
    
    localStorage.setItem(key, JSON.stringify(data));
    
    // Clean up old cache entries if we exceed the limit
    cleanupCache();
  } catch (error) {
    console.error('Error saving to image cache:', error);
    // If localStorage is full, try to clear some space
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearOldestCache();
      // Try again
      try {
        const key = getCacheKey(url);
        const data: CachedImage = {
          data: dataUrl,
          timestamp: Date.now(),
          url: url
        };
        localStorage.setItem(key, JSON.stringify(data));
      } catch (retryError) {
        console.error('Failed to cache image after cleanup:', retryError);
      }
    }
  }
}

/**
 * Clean up expired cache entries
 */
function cleanupCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    // Remove expired entries
    cacheKeys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const data: CachedImage = JSON.parse(cached);
          if (!isValidCache(data)) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        // If we can't parse it, remove it
        localStorage.removeItem(key);
      }
    });
    
    // If still too many, remove oldest
    const remainingKeys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_PREFIX));
    if (remainingKeys.length > MAX_CACHE_SIZE) {
      clearOldestCache();
    }
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}

/**
 * Clear oldest cache entries
 */
function clearOldestCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    // Get all cached items with timestamps
    const cachedItems: Array<{ key: string; timestamp: number }> = [];
    
    cacheKeys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const data: CachedImage = JSON.parse(cached);
          cachedItems.push({ key, timestamp: data.timestamp });
        }
      } catch (error) {
        // If we can't parse it, remove it
        localStorage.removeItem(key);
      }
    });
    
    // Sort by timestamp (oldest first)
    cachedItems.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove oldest 20%
    const toRemove = Math.ceil(cachedItems.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(cachedItems[i].key);
    }
  } catch (error) {
    console.error('Error clearing oldest cache:', error);
  }
}

/**
 * Clear all image cache
 */
export function clearImageCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    cacheKeys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing image cache:', error);
  }
}

/**
 * Fetch and cache an image
 */
export async function fetchAndCacheImage(url: string): Promise<string> {
  // Check cache first
  const cached = getCachedImage(url);
  if (cached) {
    return cached;
  }
  
  // Fetch the image
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    // Convert to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Cache it
        setCachedImage(url, dataUrl);
        resolve(dataUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching and caching image:', error);
    throw error;
  }
}
