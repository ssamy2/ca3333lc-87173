/**
 * Get Telegram authentication token
 */
export const getToken = async (): Promise<string | null> => {
  try {
    // Check if Telegram WebApp is available
    if (!window.Telegram?.WebApp) {
      console.error('[TelegramAuth] Telegram WebApp not available');
      console.error('[TelegramAuth] window.Telegram:', !!window.Telegram);
      return null;
    }

    const webApp = window.Telegram.WebApp;
    const initData = webApp.initData;
    
    // Detailed logging
    console.log('[TelegramAuth] Platform:', (webApp as any).platform || 'unknown');
    console.log('[TelegramAuth] Version:', (webApp as any).version || 'unknown');
    console.log('[TelegramAuth] initData available:', !!initData);
    console.log('[TelegramAuth] initData length:', initData?.length || 0);
    
    if (!initData || initData.length === 0) {
      console.error('[TelegramAuth] initData is empty or unavailable');
      console.error('[TelegramAuth] This usually happens when:');
      console.error('[TelegramAuth] 1. App not opened via Telegram bot');
      console.error('[TelegramAuth] 2. Desktop/Mobile app has different initialization');
      console.error('[TelegramAuth] 3. WebApp not properly initialized');
      
      // Try alternative methods
      console.log('[TelegramAuth] Trying alternative: initDataUnsafe...');
      const unsafeData = webApp.initDataUnsafe;
      if (unsafeData && Object.keys(unsafeData).length > 0) {
        console.log('[TelegramAuth] initDataUnsafe available:', Object.keys(unsafeData));
        // Build initData string from unsafe data
        const params = new URLSearchParams();
        Object.entries(unsafeData).forEach(([key, value]) => {
          if (value && typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
        const constructedInitData = params.toString();
        console.log('[TelegramAuth] Constructed initData from unsafe:', !!constructedInitData);
        return constructedInitData || null;
      }
      
      return null;
    }
    
    console.log('[TelegramAuth] ✅ initData obtained successfully');
    return initData;
  } catch (error) {
    console.error('[TelegramAuth] Error getting Telegram token:', error);
    return null;
  }
};

/**
 * Get authorization headers for API requests
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getToken();
  
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'X-Telegram-Init-Data': token
    };
  }
  
  return {};
};

/**
 * Make authenticated API request with retry logic
 */
export const makeAuthenticatedRequest = async (
  url: string, 
  options: RequestInit = {},
  maxRetries: number = 2
): Promise<Response> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const authHeaders = await getAuthHeaders();
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers
        }
      });
      
      // If successful or not a 401, return the response
      if (response.ok || response.status !== 401) {
        return response;
      }
      
      // If 401 and not the last attempt, wait and retry
      if (attempt < maxRetries) {
        console.log(`Auth failed, retrying... (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        continue;
      }
      
      return response; // Return the failed response on last attempt
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        console.log(`Request failed, retrying... (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
};
