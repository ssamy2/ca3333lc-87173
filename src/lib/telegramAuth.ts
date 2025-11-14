/**
 * Get Telegram authentication token
 */
export const getToken = async (): Promise<string | null> => {
  try {
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) {
      console.warn('Telegram WebApp initData not available');
      return null;
    }
    return initData;
  } catch (error) {
    console.error('Error getting Telegram token:', error);
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
