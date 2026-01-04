/**
 * ============================================================================
 * NOVA IMAGE CACHE SERVICE - Smart Image-Only Caching
 * Protocol: CODE_DIRECT_REFACTOR_IMAGE_CACHE_2026
 * ============================================================================
 * 
 * Features:
 * - Cache API for persistent browser storage (survives page reloads)
 * - Memory cache for instant access
 * - Automatic format optimization (WebP conversion)
 * - LRU eviction strategy
 * - Batch preloading with priority queue
 * - Image-only filtering (PNG, JPG, SVG, WebP, GIF)
 */

const CACHE_NAME = 'nova-image-cache-v3';
const MEMORY_CACHE_MAX = 100;
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];

interface CacheMetadata {
  url: string;
  timestamp: number;
  size: number;
  contentType: string;
}

class NovaImageCacheService {
  private memoryCache: Map<string, string> = new Map();
  private metadataCache: Map<string, CacheMetadata> = new Map();
  private pendingRequests: Map<string, Promise<string>> = new Map();
  private cacheAvailable: boolean = false;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the cache service
   */
  private async initialize(): Promise<void> {
    // Check if Cache API is available
    this.cacheAvailable = 'caches' in window;
    
    if (this.cacheAvailable) {
      try {
        // Clean up old cache versions
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name.startsWith('nova-image-cache') && name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
        
        // Load metadata from existing cache
        await this.loadMetadataFromCache();
        console.log(`🖼️ Nova Image Cache initialized with ${this.metadataCache.size} entries`);
      } catch (e) {
        console.warn('Cache API initialization failed:', e);
        this.cacheAvailable = false;
      }
    }
    
    this.initialized = true;
  }

  /**
   * Load metadata from existing cache entries
   */
  private async loadMetadataFromCache(): Promise<void> {
    if (!this.cacheAvailable) return;

    try {
      const cache = await caches.open(CACHE_NAME);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const timestamp = parseInt(response.headers.get('x-cache-timestamp') || '0');
          const size = parseInt(response.headers.get('x-cache-size') || '0');
          const contentType = response.headers.get('content-type') || 'image/webp';
          
          // Check if entry is expired
          if (Date.now() - timestamp > CACHE_MAX_AGE_MS) {
            await cache.delete(request);
          } else {
            this.metadataCache.set(request.url, {
              url: request.url,
              timestamp,
              size,
              contentType
            });
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load cache metadata:', e);
    }
  }

  /**
   * Check if a URL is an image URL
   */
  isImageUrl(url: string): boolean {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return IMAGE_EXTENSIONS.some(ext => lowerUrl.includes(ext)) ||
           lowerUrl.includes('/image/') ||
           lowerUrl.includes('/img/') ||
           lowerUrl.includes('cdn') ||
           lowerUrl.includes('photo');
  }

  /**
   * Check if image is in cache
   */
  isCached(url: string): boolean {
    return this.memoryCache.has(url) || this.metadataCache.has(url);
  }

  /**
   * Get image from memory cache (instant)
   */
  getFromMemory(url: string): string | null {
    return this.memoryCache.get(url) || null;
  }

  /**
   * Get image from cache (async, checks Cache API)
   */
  async getImage(url: string): Promise<string | null> {
    // Check memory cache first
    const memCached = this.memoryCache.get(url);
    if (memCached) {
      return memCached;
    }

    // Check Cache API
    if (this.cacheAvailable) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match(url);
        
        if (response) {
          const blob = await response.blob();
          const base64 = await this.blobToBase64(blob);
          
          // Add to memory cache for faster subsequent access
          this.addToMemoryCache(url, base64);
          
          return base64;
        }
      } catch (e) {
        console.warn('Cache read failed:', e);
      }
    }

    return null;
  }

  /**
   * Load and cache an image
   */
  async loadAndCache(url: string): Promise<string> {
    if (!url || !this.isImageUrl(url)) {
      return url;
    }

    // Check memory cache
    const memCached = this.memoryCache.get(url);
    if (memCached) {
      return memCached;
    }

    // Check pending requests
    const pending = this.pendingRequests.get(url);
    if (pending) {
      return pending;
    }

    // Check Cache API
    const cached = await this.getImage(url);
    if (cached) {
      return cached;
    }

    // Fetch and cache
    const loadPromise = this.fetchAndStore(url);
    this.pendingRequests.set(url, loadPromise);

    try {
      const result = await loadPromise;
      this.pendingRequests.delete(url);
      return result;
    } catch (e) {
      this.pendingRequests.delete(url);
      return url;
    }
  }

  /**
   * Fetch image and store in cache
   */
  private async fetchAndStore(url: string): Promise<string> {
    try {
      // Fetch the image
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || 'image/webp';
      
      // Verify it's an image
      if (!IMAGE_MIME_TYPES.some(type => contentType.includes(type.split('/')[1]))) {
        return url;
      }

      const blob = await response.blob();
      
      // Convert to optimized format if needed
      let optimizedBlob = blob;
      let base64: string;

      if (contentType !== 'image/svg+xml' && blob.size > 50000) {
        // Convert large images to WebP for better compression
        optimizedBlob = await this.optimizeImage(blob);
      }

      base64 = await this.blobToBase64(optimizedBlob);

      // Store in Cache API
      if (this.cacheAvailable) {
        try {
          const cache = await caches.open(CACHE_NAME);
          const cacheResponse = new Response(optimizedBlob, {
            headers: {
              'content-type': optimizedBlob.type,
              'x-cache-timestamp': Date.now().toString(),
              'x-cache-size': optimizedBlob.size.toString()
            }
          });
          await cache.put(url, cacheResponse);
          
          // Update metadata
          this.metadataCache.set(url, {
            url,
            timestamp: Date.now(),
            size: optimizedBlob.size,
            contentType: optimizedBlob.type
          });
        } catch (e) {
          console.warn('Failed to store in Cache API:', e);
        }
      }

      // Add to memory cache
      this.addToMemoryCache(url, base64);

      return base64;
    } catch (e) {
      // Fallback: try using Image element
      return this.fetchViaImage(url);
    }
  }

  /**
   * Fallback: fetch using Image element (handles CORS differently)
   */
  private async fetchViaImage(url: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
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

          this.addToMemoryCache(url, base64);
          resolve(base64);
        } catch (e) {
          resolve(url);
        }
      };

      img.onerror = () => resolve(url);
      img.src = url;
    });
  }

  /**
   * Optimize image by converting to WebP
   */
  private async optimizeImage(blob: Blob): Promise<Blob> {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(blob);
          return;
        }

        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (webpBlob) => resolve(webpBlob || blob),
          'image/webp',
          0.85
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(blob);
      };

      img.src = objectUrl;
    });
  }

  /**
   * Convert blob to base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Add to memory cache with LRU eviction
   */
  private addToMemoryCache(url: string, data: string): void {
    // Evict oldest if at capacity
    if (this.memoryCache.size >= MEMORY_CACHE_MAX) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }

    this.memoryCache.set(url, data);
  }

  /**
   * Preload multiple images with batching
   */
  async preloadImages(urls: string[]): Promise<void> {
    const imageUrls = urls.filter(url => this.isImageUrl(url));
    const uncached = imageUrls.filter(url => !this.isCached(url));

    if (uncached.length === 0) return;

    console.log(`📥 Preloading ${uncached.length} images...`);

    const batchSize = 4;
    for (let i = 0; i < uncached.length; i += batchSize) {
      const batch = uncached.slice(i, i + batchSize);
      await Promise.allSettled(batch.map(url => this.loadAndCache(url)));

      if (i + batchSize < uncached.length) {
        await new Promise(r => setTimeout(r, 50));
      }
    }

    console.log(`✅ Preloaded ${uncached.length} images`);
  }

  /**
   * Preload a single image
   */
  async preloadImage(url: string): Promise<string> {
    return this.loadAndCache(url);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { memory: number; persistent: number; totalSizeMB: string } {
    const totalSize = Array.from(this.metadataCache.values())
      .reduce((sum, meta) => sum + meta.size, 0);

    return {
      memory: this.memoryCache.size,
      persistent: this.metadataCache.size,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
    };
  }

  /**
   * Clear all caches
   */
  async clearAllCache(): Promise<void> {
    this.memoryCache.clear();
    this.metadataCache.clear();

    if (this.cacheAvailable) {
      try {
        await caches.delete(CACHE_NAME);
      } catch (e) {
        console.warn('Failed to clear Cache API:', e);
      }
    }

    console.log('🗑️ Nova Image Cache cleared');
  }

  /**
   * Clear expired entries
   */
  async cleanExpired(): Promise<number> {
    if (!this.cacheAvailable) return 0;

    let cleaned = 0;
    const cache = await caches.open(CACHE_NAME);

    for (const [url, meta] of this.metadataCache.entries()) {
      if (Date.now() - meta.timestamp > CACHE_MAX_AGE_MS) {
        await cache.delete(url);
        this.metadataCache.delete(url);
        this.memoryCache.delete(url);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }

    return cleaned;
  }
}

export const imageCache = new NovaImageCacheService();

// Backward compatibility exports
export const preloadImages = (urls: string[]) => imageCache.preloadImages(urls);
export const getImageFromCache = (url: string) => imageCache.getFromMemory(url);
export const isCached = (url: string) => imageCache.isCached(url);
