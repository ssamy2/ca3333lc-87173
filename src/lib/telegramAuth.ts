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
      'Authorization': `Bearer ${token}`
    };
  }
  
  return {};
};
