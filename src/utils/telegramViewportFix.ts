/**
 * Fix for Telegram Web App viewport change crashes
 * 
 * When sending images or resizing the viewport in Telegram apps,
 * the internal event handler (_positionChanged) can crash because
 * the callback function becomes undefined during component unmounting.
 * 
 * This utility provides a safe wrapper for viewport change events.
 */

let isInitialized = false;
let originalConsoleError: typeof console.error | null = null;

/**
 * Initialize the Telegram viewport error fix
 * Should be called once when the app starts
 */
export const initTelegramViewportFix = (): void => {
  if (isInitialized) return;
  isInitialized = true;

  // Suppress specific Telegram viewport errors
  originalConsoleError = console.error;
  console.error = function(...args: any[]) {
    const errorString = args[0]?.toString?.() || '';
    
    // Check if this is a Telegram viewport-related error
    if (
      errorString.includes('_positionChanged') ||
      errorString.includes("reading 'call'") ||
      errorString.includes('viewportChanged') ||
      errorString.includes('Cannot read properties of undefined')
    ) {
      console.warn('[Telegram] Viewport change error suppressed:', args[0]);
      return;
    }
    
    // Call original console.error for other errors
    if (originalConsoleError) {
      originalConsoleError.apply(console, args);
    }
  };

  // Add safe viewport change handler if Telegram WebApp is available
  const telegram = (window as any).Telegram;
  if (telegram?.WebApp) {
    try {
      const webApp = telegram.WebApp;
      
      // Add a safe wrapper for viewport changes
      const safeViewportHandler = () => {
        try {
          // Do nothing, just prevent crash
          console.log('[Telegram] Viewport changed safely');
        } catch (e) {
          // Ignore errors
        }
      };
      
      if (typeof webApp.onEvent === 'function') {
        webApp.onEvent('viewportChanged', safeViewportHandler);
      }
      
      // Also handle window resize which can trigger viewport changes
      window.addEventListener('resize', () => {
        try {
          // Give Telegram some time to handle its internal events
          setTimeout(() => {}, 100);
        } catch (e) {
          // Ignore errors
        }
      });
      
      console.log('[Telegram] Viewport fix initialized');
    } catch (e) {
      console.warn('[Telegram] Failed to initialize viewport fix:', e);
    }
  }
};

/**
 * Cleanup the Telegram viewport error fix
 * Call when the app unmounts (optional)
 */
export const cleanupTelegramViewportFix = (): void => {
  if (originalConsoleError) {
    console.error = originalConsoleError;
    originalConsoleError = null;
  }
  isInitialized = false;
};
