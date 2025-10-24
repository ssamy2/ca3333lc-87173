interface CachedImage {
  base64: string;
  timestamp: number;
}

const CACHE_KEY = 'nft-image-cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

class ImageCacheService {
  private memoryCache: Map<string, string> = new Map();
  private pendingRequests: Map<string, Promise<string>> = new Map();

  /**
   * Get image from cache (checks memory first, then localStorage)
   */
  getImageFromCache(url: string): string | null {
    // Check memory cache first (faster)
    if (this.memoryCache.has(url)) {
      return this.memoryCache.get(url)!;
    }

    // Check localStorage
    try {
      const cacheData = localStorage.getItem(CACHE_KEY);
      if (!cacheData) return null;

      const cache: Record<string, CachedImage> = JSON.parse(cacheData);
      const cachedImage = cache[url];

      if (!cachedImage) return null;

      // Check if expired
      const now = Date.now();
      if (now - cachedImage.timestamp > CACHE_EXPIRY) {
        delete cache[url];
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        return null;
      }

      // Store in memory cache for faster access
      this.memoryCache.set(url, cachedImage.base64);
      return cachedImage.base64;
    } catch (error) {
      console.error('Error reading from image cache:', error);
      return null;
    }
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
   * Preload and cache an image with request deduplication
   */
  async preloadImage(url: string): Promise<string> {
    // Check if already cached
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
          const base64 = canvas.toDataURL('image/png');
          
          this.saveImageToCache(url, base64);
          this.pendingRequests.delete(url);
          resolve(base64);
        } catch (error) {
          console.error('Failed to convert image to base64:', error);
          // Fallback to original URL
          this.saveImageToCache(url, url);
          this.pendingRequests.delete(url);
          resolve(url);
        }
      };

      img.onerror = () => {
        console.error('Failed to load image:', url);
        this.pendingRequests.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
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
   * Preload images that are not already cached with strict checking
   */
  async preloadUncachedImages(urls: string[]): Promise<void> {
    // Filter out cached and pending images
    const uncachedUrls = urls.filter(url => {
      const cached = this.getImageFromCache(url);
      const pending = this.pendingRequests.has(url);
      return !cached && !pending;
    });
    
    if (uncachedUrls.length === 0) {
      console.log('✅ All images already cached or loading, skipping preload');
      return;
    }
    
    console.log(`📥 Preloading ${uncachedUrls.length} new images (${urls.length - uncachedUrls.length} already cached/loading)`);
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
  getCacheStats(): { memoryCacheSize: number; localStorageSize: number } {
    const memoryCacheSize = this.memoryCache.size;
    let localStorageSize = 0;

    try {
      const cacheData = localStorage.getItem(CACHE_KEY);
      if (cacheData) {
        const cache: Record<string, CachedImage> = JSON.parse(cacheData);
        localStorageSize = Object.keys(cache).length;
      }
    } catch (error) {
      console.error('Error getting cache stats:', error);
    }

    return { memoryCacheSize, localStorageSize };
  }
}

// Export singleton instance
export const imageCache = new ImageCacheService();
