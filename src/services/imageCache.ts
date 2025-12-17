// Image cache service - stores images in localStorage for offline/faster loading

const CACHE_KEY = 'gift-image-cache';
const CACHE_VERSION = 'v2';
const MAX_CACHE_SIZE_MB = 15; // Max localStorage usage for images
const MAX_ENTRIES = 200; // Max number of cached images

interface CacheEntry {
  data: string; // base64
  timestamp: number;
  size: number;
}

interface CacheStore {
  version: string;
  entries: Record<string, CacheEntry>;
}

class ImageCacheService {
  private memoryCache: Map<string, string> = new Map();
  private pendingRequests: Map<string, Promise<string>> = new Map();
  private cacheStore: CacheStore | null = null;
  private initialized = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CacheStore;
        if (parsed.version === CACHE_VERSION) {
          this.cacheStore = parsed;
          // Load into memory cache
          Object.entries(parsed.entries).forEach(([url, entry]) => {
            this.memoryCache.set(url, entry.data);
          });
          console.log(`📦 Loaded ${this.memoryCache.size} images from cache`);
        } else {
          // Version mismatch, clear old cache
          localStorage.removeItem(CACHE_KEY);
          this.cacheStore = { version: CACHE_VERSION, entries: {} };
        }
      } else {
        this.cacheStore = { version: CACHE_VERSION, entries: {} };
      }
      // Clean up old cache key
      localStorage.removeItem('nft-image-cache');
    } catch (e) {
      console.warn('Failed to load image cache:', e);
      this.cacheStore = { version: CACHE_VERSION, entries: {} };
    }
    this.initialized = true;
  }

  private saveToStorage(): void {
    if (!this.cacheStore) return;
    
    try {
      const data = JSON.stringify(this.cacheStore);
      localStorage.setItem(CACHE_KEY, data);
    } catch (e) {
      // Storage full, evict oldest entries
      console.warn('Cache storage full, evicting old entries');
      this.evictOldEntries(50);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(this.cacheStore));
      } catch {
        // Still failed, clear all
        this.clearAllCache();
      }
    }
  }

  private evictOldEntries(count: number): void {
    if (!this.cacheStore) return;
    
    const entries = Object.entries(this.cacheStore.entries)
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = entries.slice(0, count);
    toRemove.forEach(([url]) => {
      delete this.cacheStore!.entries[url];
      this.memoryCache.delete(url);
    });
  }

  private enforceStorageLimits(): void {
    if (!this.cacheStore) return;
    
    const entries = Object.entries(this.cacheStore.entries);
    
    // Check entry count
    if (entries.length > MAX_ENTRIES) {
      this.evictOldEntries(entries.length - MAX_ENTRIES + 20);
    }
    
    // Check size
    const totalSize = entries.reduce((sum, [, entry]) => sum + entry.size, 0);
    const maxBytes = MAX_CACHE_SIZE_MB * 1024 * 1024;
    
    if (totalSize > maxBytes) {
      // Evict until under limit
      const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      let currentSize = totalSize;
      let i = 0;
      
      while (currentSize > maxBytes * 0.8 && i < sorted.length) {
        const [url, entry] = sorted[i];
        currentSize -= entry.size;
        delete this.cacheStore.entries[url];
        this.memoryCache.delete(url);
        i++;
      }
    }
  }

  /**
   * Get image from cache (returns base64 or null)
   */
  getImageFromCache(url: string): string | null {
    return this.memoryCache.get(url) || null;
  }

  /**
   * Check if image is cached
   */
  isCached(url: string): boolean {
    return this.memoryCache.has(url);
  }

  /**
   * Load and cache an image
   */
  async loadAndCache(url: string): Promise<string> {
    // Return from memory cache
    const cached = this.memoryCache.get(url);
    if (cached) {
      // Update timestamp
      if (this.cacheStore?.entries[url]) {
        this.cacheStore.entries[url].timestamp = Date.now();
      }
      return cached;
    }

    // Check if already loading
    const pending = this.pendingRequests.get(url);
    if (pending) {
      return pending;
    }

    // Load and convert to base64
    const loadPromise = this.fetchAndConvert(url);
    this.pendingRequests.set(url, loadPromise);

    try {
      const base64 = await loadPromise;
      this.pendingRequests.delete(url);
      return base64;
    } catch (e) {
      this.pendingRequests.delete(url);
      return url; // Return original URL on error
    }
  }

  private async fetchAndConvert(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          // Convert to base64
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(url);
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          const base64 = canvas.toDataURL('image/webp', 0.85);
          
          // Save to cache
          const size = base64.length;
          this.memoryCache.set(url, base64);
          
          if (this.cacheStore) {
            this.cacheStore.entries[url] = {
              data: base64,
              timestamp: Date.now(),
              size
            };
            this.enforceStorageLimits();
            this.saveToStorage();
          }
          
          resolve(base64);
        } catch (e) {
          // CORS or other error, just use URL
          resolve(url);
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load: ${url}`));
      };

      img.src = url;
    });
  }

  /**
   * Preload multiple images in batches
   */
  async preloadImages(urls: string[]): Promise<void> {
    const uncached = urls.filter(url => !this.memoryCache.has(url));
    if (uncached.length === 0) return;

    console.log(`📥 Caching ${uncached.length} new images...`);
    
    // Process in small batches to avoid memory spikes
    const batchSize = 3;
    for (let i = 0; i < uncached.length; i += batchSize) {
      const batch = uncached.slice(i, i + batchSize);
      await Promise.allSettled(batch.map(url => this.loadAndCache(url)));
      // Small delay between batches
      if (i + batchSize < uncached.length) {
        await new Promise(r => setTimeout(r, 100));
      }
    }
    
    console.log(`✅ Cache now has ${this.memoryCache.size} images`);
  }

  /**
   * Preload a single image (alias for loadAndCache)
   */
  async preloadImage(url: string): Promise<string> {
    return this.loadAndCache(url);
  }

  /**
   * Preload only uncached images
   */
  async preloadUncachedImages(urls: string[]): Promise<void> {
    const uncached = urls.filter(url => !this.memoryCache.has(url));
    if (uncached.length === 0) return;
    await this.preloadImages(uncached);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const entries = this.cacheStore ? Object.values(this.cacheStore.entries) : [];
    const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
    
    return {
      count: this.memoryCache.size,
      sizeMB: (totalSize / 1024 / 1024).toFixed(2),
      maxMB: MAX_CACHE_SIZE_MB
    };
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.memoryCache.clear();
    this.cacheStore = { version: CACHE_VERSION, entries: {} };
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {}
    console.log('🗑️ Image cache cleared');
  }
}

export const imageCache = new ImageCacheService();

// Export for backward compatibility
export const preloadImages = async () => {};
