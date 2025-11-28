interface CachedImage {
  base64: string;
  timestamp: number;
}

const CACHE_KEY = 'nft-image-cache';
const CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days (permanent cache)

class ImageCacheService {
  private memoryCache: Map<string, string> = new Map();
  private pendingRequests: Map<string, Promise<string>> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    // Load all cached images into memory on initialization
    this.initializeMemoryCache();
  }

  /**
   * Initialize memory cache from localStorage on startup
   */
  private initializeMemoryCache(): void {
    if (this.isInitialized) return;
    
    try {
      const cacheData = localStorage.getItem(CACHE_KEY);
      if (!cacheData) {
        this.isInitialized = true;
        return;
      }

      const cache: Record<string, CachedImage> = JSON.parse(cacheData);
      const now = Date.now();
      let loadedCount = 0;

      Object.entries(cache).forEach(([url, data]) => {
        // Only load non-expired images
        if (now - data.timestamp <= CACHE_EXPIRY) {
          this.memoryCache.set(url, data.base64);
          loadedCount++;
        }
      });

      console.log(`🚀 Loaded ${loadedCount} images into memory cache`);
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing memory cache:', error);
      this.isInitialized = true;
    }
  }

  /**
   * Get image from cache (memory only for maximum speed)
   */
  getImageFromCache(url: string): string | null {
    // Ensure cache is initialized
    if (!this.isInitialized) {
      this.initializeMemoryCache();
    }

    // Return from memory cache (instant access)
    return this.memoryCache.get(url) || null;
  }

  /**
   * Save image to cache (both memory and localStorage)
   */
  saveImageToCache(url: string, base64: string): void {
    // Save to memory cache
    this.memoryCache.set(url, base64);

    // Save to localStorage
    try {
      const cacheData = localStorage.getItem(CACHE_KEY);
      const cache: Record<string, CachedImage> = cacheData ? JSON.parse(cacheData) : {};

      cache[url] = {
        base64,
        timestamp: Date.now()
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving to image cache:', error);
      // If localStorage is full, try to clear old entries
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearExpiredCache();
        // Try saving again
        try {
          const cache: Record<string, CachedImage> = {};
          cache[url] = {
            base64,
            timestamp: Date.now()
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch (retryError) {
          console.error('Failed to save image after clearing cache:', retryError);
        }
      }
    }
  }

  /**
   * Preload and cache an image with request deduplication (stores in RAM permanently)
   */
  async preloadImage(url: string): Promise<string> {
    // Check if already cached in memory
    const cached = this.getImageFromCache(url);
    if (cached) {
      return cached;
    }

    // Check if already being loaded (request deduplication)
    const pending = this.pendingRequests.get(url);
    if (pending) {
      return pending;
    }

    // Create new loading promise
    const loadingPromise = new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0);
          // Use WebP format for better compression if supported
          const base64 = canvas.toDataURL('image/webp', 0.85);
          
          // Save to both memory and localStorage
          this.saveImageToCache(url, base64);
          this.pendingRequests.delete(url);
          resolve(base64);
        } catch (error) {
          console.error('Failed to convert image to base64:', error);
          // Fallback: save URL itself
          this.saveImageToCache(url, url);
          this.pendingRequests.delete(url);
          resolve(url);
        }
      };

      img.onerror = () => {
        console.error('Failed to load image:', url);
        this.pendingRequests.delete(url);
        // Don't reject, just resolve with the URL
        resolve(url);
      };

      img.src = url;
    });

    this.pendingRequests.set(url, loadingPromise);
    return loadingPromise;
  }

  /**
   * Preload multiple images in parallel
   */
  async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map(url => 
      this.preloadImage(url).catch(error => {
        console.error(`Failed to preload image ${url}:`, error);
        return null;
      })
    );
    
    await Promise.all(promises);
  }

  /**
   * Preload images that are not already cached with strict checking and deduplication
   */
  async preloadUncachedImages(urls: string[]): Promise<void> {
    // Remove duplicate URLs
    const uniqueUrls = [...new Set(urls)];
    
    // Filter out cached and pending images
    const uncachedUrls = uniqueUrls.filter(url => {
      const cached = this.getImageFromCache(url);
      const pending = this.pendingRequests.has(url);
      return !cached && !pending;
    });
    
    if (uncachedUrls.length === 0) {
      console.log('✅ All images already cached or loading, skipping preload');
      return;
    }
    
    console.log(`📥 Preloading ${uncachedUrls.length}/${uniqueUrls.length} images (${uniqueUrls.length - uncachedUrls.length} already cached/loading)`);
    await this.preloadImages(uncachedUrls);
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    try {
      const cacheData = localStorage.getItem(CACHE_KEY);
      if (!cacheData) return;

      const cache: Record<string, CachedImage> = JSON.parse(cacheData);
      const now = Date.now();
      let hasChanges = false;

      Object.keys(cache).forEach(url => {
        if (now - cache[url].timestamp > CACHE_EXPIRY) {
          delete cache[url];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  /**
   * Clear all cache (both memory and localStorage)
   */
  clearAllCache(): void {
    this.memoryCache.clear();
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { memoryCacheSize: number; localStorageSize: number; memorySizeMB: number } {
    const memoryCacheSize = this.memoryCache.size;
    let localStorageSize = 0;
    let totalBytes = 0;

    // Calculate memory usage
    this.memoryCache.forEach(value => {
      totalBytes += value.length;
    });

    try {
      const cacheData = localStorage.getItem(CACHE_KEY);
      if (cacheData) {
        const cache: Record<string, CachedImage> = JSON.parse(cacheData);
        localStorageSize = Object.keys(cache).length;
      }
    } catch (error) {
      console.error('Error getting cache stats:', error);
    }

    return { 
      memoryCacheSize, 
      localStorageSize,
      memorySizeMB: Math.round(totalBytes / (1024 * 1024) * 100) / 100
    };
  }

  /**
   * Check if an image is cached in memory
   */
  isCached(url: string): boolean {
    return this.memoryCache.has(url);
  }

  /**
   * Preload image immediately and return cached version
   */
  async getCachedOrLoad(url: string): Promise<string> {
    const cached = this.getImageFromCache(url);
    if (cached) return cached;
    
    return await this.preloadImage(url);
  }
}

// Export singleton instance
export const imageCache = new ImageCacheService();

// Log cache stats on initialization (after a short delay)
setTimeout(() => {
  const stats = imageCache.getCacheStats();
  console.log(`📊 Image Cache Stats: ${stats.memoryCacheSize} images in RAM (${stats.memorySizeMB} MB), ${stats.localStorageSize} in localStorage`);
}, 2000);

/**
 * Preload images from market data
 * This function will be called in the background after data is fetched
 */
export const preloadImages = async () => {
  try {
    // Try multiple cache sources
    let data = null;
    
    // First try the market cache
    const marketDataCache = localStorage.getItem('market-cache-market-data');
    if (marketDataCache) {
      const parsed = JSON.parse(marketDataCache);
      data = parsed.data || parsed;
    }
    
    // If no market cache, try React Query cache
    if (!data) {
      const queryCache = localStorage.getItem('REACT_QUERY_OFFLINE_CACHE');
      if (queryCache) {
        const parsed = JSON.parse(queryCache);
        const marketQuery = parsed.clientState?.queries?.find((q: any) => 
          q.queryKey?.includes('market-data')
        );
        if (marketQuery?.state?.data) {
          data = marketQuery.state.data;
        }
      }
    }
    
    if (!data) {
      console.log('📭 No market data found for image preloading');
      return;
    }

    // Extract all image URLs from market data
    const imageUrls = Object.values(data)
      .map((item: any) => item.image_url)
      .filter((url: string) => url && url.startsWith('http'));

    if (imageUrls.length === 0) {
      console.log('📭 No image URLs found in market data');
      return;
    }

    console.log(`🖼️ Preloading ${imageUrls.length} images in background...`);
    
    // Preload only uncached images with aggressive caching
    await imageCache.preloadUncachedImages(imageUrls);
    
    console.log('✅ Image preloading complete');
  } catch (error) {
    console.error('Error preloading images:', error);
  }
};

