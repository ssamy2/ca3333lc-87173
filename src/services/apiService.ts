import { mockNFTResponse, mockErrorResponses } from './mockData';

export const USE_MOCK_DATA = false; // Always use real API

// Get API base URL from environment
const API_BASE_URL = (() => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';
  const lsUrl = typeof window !== 'undefined' ? localStorage.getItem('API_BASE_URL') || '' : '';
  return (lsUrl || envUrl || 'http://207.180.203.9:5000').replace(/\/+$/, '');
})();
const FORCE_PROXY = import.meta.env.VITE_FORCE_PROXY === 'true';

// Only use proxy if explicitly forced
const shouldUseProxy = FORCE_PROXY;

// Custom proxy configuration (only if needed)
const isBrowser = typeof window !== 'undefined';
const customProxy = shouldUseProxy ? (import.meta.env.VITE_CORS_PROXY || (isBrowser ? localStorage.getItem('CORS_PROXY_URL') || '' : '')) : '';

interface ProxyConfig {
  name: string;
  buildUrl: (targetUrl: string) => string;
  parseResponse: (responseData: any) => any;
}

// Only custom proxy if forced
const proxyConfig: ProxyConfig | null = customProxy ? {
  name: 'Custom',
  buildUrl: (targetUrl: string) => `${customProxy}/${encodeURIComponent(targetUrl)}`,
  parseResponse: (data: any) => data
} : null;

// Build API URL with or without proxy and add cache busting
const buildApiUrl = (path: string) => {
  const timestamp = Date.now();
  const separator = path.includes('?') ? '&' : '?';
  const targetUrl = `${API_BASE_URL}${path}${separator}_t=${timestamp}`;
  
  if (!shouldUseProxy || !proxyConfig) {
    return targetUrl;
  }
  
  return proxyConfig.buildUrl(targetUrl);
};

// Robust timeout signal (polyfill for AbortSignal.timeout)
const getTimeoutSignal = (ms: number): AbortSignal => {
  const anyAbortSignal = AbortSignal as any;
  if (typeof anyAbortSignal?.timeout === 'function') {
    return anyAbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
};

// API Health Check
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    // Prevent mixed-content requests from HTTPS -> HTTP
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_BASE_URL.startsWith('http:')) {
      throw new Error('INSECURE_API_URL');
    }
    const apiUrl = buildApiUrl('/api/health');
    
    const response = await fetch(apiUrl, { 
      method: 'GET',
      signal: getTimeoutSignal(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const fetchNFTGifts = async (username: string) => {
  // Clean username by removing @ if present
  const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
  
  // Prevent mixed-content requests from HTTPS -> HTTP
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_BASE_URL.startsWith('http:')) {
    throw new Error('INSECURE_API_URL');
  }
  
  const apiUrl = buildApiUrl(`/api/nft-gifts?username=@${encodeURIComponent(cleanUsername)}`);
  
  console.log('Fetching NFT data from:', apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(window.location.origin && { 'Origin': window.location.origin })
      },
      signal: getTimeoutSignal(20000)
    });
    
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      
      if (response.status === 404) {
        throw new Error('USER_NOT_FOUND');
      } else if (response.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      } else if (response.status === 403) {
        throw new Error('ACCESS_FORBIDDEN');
      } else if (response.status >= 500) {
        throw new Error('SERVER_ERROR');
      } else {
        throw new Error('NETWORK_ERROR');
      }
    }
    
    // Parse response
    let responseData;
    try {
      const text = await response.text();
      responseData = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('Parse error:', parseError);
      throw new Error('PARSE_ERROR');
    }
    
    console.log('API Response:', responseData);
    
    // Process response with proxy parser if using proxy
    const processedData = shouldUseProxy && proxyConfig ? proxyConfig.parseResponse(responseData) : responseData;
    return processAPIResponse(processedData, shouldUseProxy);
    
  } catch (error) {
    console.error('API request failed:', error);
    
    // Re-throw specific errors
    if (error instanceof Error && 
        ['USER_NOT_FOUND', 'CANNOT_RECEIVE_GIFTS', 'RATE_LIMIT_EXCEEDED', 'ACCESS_FORBIDDEN', 'SERVER_ERROR', 'PARSE_ERROR', 'INSECURE_API_URL'].includes(error.message)) {
      throw error;
    }
    
    // Network or other errors
    throw new Error('NETWORK_ERROR');
  }
};

// Helper function to process API response
const processAPIResponse = (responseData: any, isProxy: boolean) => {
  // Check for API error responses
  if (responseData && !responseData.success && responseData.error) {
    if (responseData.error === 'Cannot receive gifts') {
      throw new Error('CANNOT_RECEIVE_GIFTS');
    }
  }
  
  return responseData;
};