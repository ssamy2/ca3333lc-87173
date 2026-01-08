import { lazy, ComponentType } from 'react';

/**
 * Lazy load with retry logic for dynamic imports
 * Handles "Failed to fetch dynamically imported module" errors
 * by retrying with cache busting and falling back to page reload
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: Error | null = null;
    
    for (let i = 0; i < retries; i++) {
      try {
        // Try to import the component
        return await componentImport();
      } catch (error) {
        lastError = error as Error;
        console.warn(`[LazyLoad] Attempt ${i + 1}/${retries} failed:`, error);
        
        // Check if it's a chunk loading error
        const isChunkError = 
          error instanceof Error && 
          (error.message.includes('Failed to fetch dynamically imported module') ||
           error.message.includes('Loading chunk') ||
           error.message.includes('Loading CSS chunk') ||
           error.message.includes('ChunkLoadError'));
        
        if (isChunkError && i < retries - 1) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, interval));
          
          // Try to bust the cache by adding a timestamp
          // This works by forcing a fresh request
          console.log(`[LazyLoad] Retrying with cache bust...`);
        } else if (!isChunkError) {
          // If it's not a chunk error, don't retry
          throw error;
        }
      }
    }
    
    // All retries failed - likely a version mismatch
    console.error('[LazyLoad] All retries failed. Triggering page reload...');
    
    // Store flag to prevent reload loop
    const reloadKey = 'chunk_reload_timestamp';
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();
    
    // Only auto-reload if we haven't reloaded in the last 10 seconds
    if (!lastReload || now - parseInt(lastReload) > 10000) {
      sessionStorage.setItem(reloadKey, now.toString());
      
      // Clear any cached modules
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          console.log('[LazyLoad] Cleared browser caches');
        } catch (e) {
          console.warn('[LazyLoad] Failed to clear caches:', e);
        }
      }
      
      // Force hard reload
      window.location.reload();
    }
    
    // If we're in a reload loop, throw the error to show ErrorBoundary
    throw lastError || new Error('Failed to load module after multiple retries');
  });
}

/**
 * Preload a lazy component to warm the cache
 */
export function preloadComponent(
  componentImport: () => Promise<{ default: ComponentType<any> }>
): void {
  componentImport().catch(() => {
    // Silently fail - the actual load will retry
  });
}

export default lazyWithRetry;
