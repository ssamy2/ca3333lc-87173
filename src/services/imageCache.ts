// Lightweight image cache - stores only URLs, no base64 conversion
// Uses browser's native caching for actual image data

class ImageCacheService {
  private loadedUrls: Set<string> = new Set();
  private pendingRequests: Map<string, Promise<HTMLImageElement>> = new Map();

  /**
   * Check if an image URL has been loaded before
   */
  getImageFromCache(url: string): string | null {
    return this.loadedUrls.has(url) ? url : null;
  }

  /**
   * Mark URL as loaded (for compatibility with existing code)
   */
  saveImageToCache(url: string): void {
    this.loadedUrls.add(url);
  }

  /**
   * Preload an image (uses browser cache, no base64 conversion)
   */
  async preloadImage(url: string): Promise<string> {
    // Already loaded
    if (this.loadedUrls.has(url)) {
      return url;
    }

    // Already loading
    const pending = this.pendingRequests.get(url);
    if (pending) {
      await pending;
      return url;
    }

    // Load image
    const loadingPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        this.loadedUrls.add(url);
        this.pendingRequests.delete(url);
        resolve(img);
      };

      img.onerror = () => {
        this.pendingRequests.delete(url);
        reject(new Error(`Failed to load: ${url}`));
      };

      img.src = url;
    });

    this.pendingRequests.set(url, loadingPromise);
    
    try {
      await loadingPromise;
      return url;
    } catch {
      return url;
    }
  }

  /**
   * Preload multiple images
   */
  async preloadImages(urls: string[]): Promise<void> {
    // Limit concurrent loads to prevent memory spikes
    const batchSize = 5;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      await Promise.allSettled(batch.map(url => this.preloadImage(url)));
    }
  }

  /**
   * Preload uncached images only
   */
  async preloadUncachedImages(urls: string[]): Promise<void> {
    const uncached = [...new Set(urls)].filter(url => !this.loadedUrls.has(url));
    if (uncached.length === 0) return;
    
    console.log(`📥 Preloading ${uncached.length} images`);
    await this.preloadImages(uncached);
  }

  /**
   * Check if cached
   */
  isCached(url: string): boolean {
    return this.loadedUrls.has(url);
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return { 
      memoryCacheSize: this.loadedUrls.size, 
      localStorageSize: 0,
      memorySizeMB: 0 // No longer storing base64
    };
  }

  /**
   * Clear cache
   */
  clearAllCache(): void {
    this.loadedUrls.clear();
  }

  clearExpiredCache(): void {
    // No-op since we don't use localStorage anymore
  }

  async getCachedOrLoad(url: string): Promise<string> {
    await this.preloadImage(url);
    return url;
  }
}

export const imageCache = new ImageCacheService();

/**
 * Preload images from market data (disabled for performance)
 */
export const preloadImages = async () => {
  // Disabled - let browser handle caching naturally
};

// Clean up old base64 cache from localStorage
try {
  localStorage.removeItem('nft-image-cache');
} catch {
  // Ignore errors
}
