import { mockNFTResponse, mockErrorResponses } from './mockData';

export const USE_MOCK_DATA = false; // Always use real API

// Get API base URL from environment
const API_BASE_URL = (() => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';
  const lsUrl = typeof window !== 'undefined' ? localStorage.getItem('API_BASE_URL') || '' : '';
  return (lsUrl || envUrl || 'https://channelsseller.site').replace(/\/+$/, '');
})();

// Check if proxy is needed
const isBrowser = typeof window !== 'undefined';
const FORCE_PROXY = (import.meta.env.VITE_FORCE_PROXY === 'true') || (isBrowser && localStorage.getItem('FORCE_PROXY') === 'true');

// Detect Mixed Content scenario (HTTPS app trying to access HTTP API)
const isMixedContent = isBrowser && window.location.protocol === 'https:' && API_BASE_URL.startsWith('http:');

// Use proxy if forced or Mixed Content detected
const shouldUseProxy = FORCE_PROXY || isMixedContent;

// Get proxy URL with fallback chain
const getProxyUrl = () => {
  // In development, use local proxy
  if (import.meta.env.DEV) {
    return window.location.origin + '/api/proxy';
  }
  
  const envProxy = import.meta.env.VITE_CORS_PROXY || '';
  const lsProxy = isBrowser ? localStorage.getItem('CORS_PROXY_URL') || '' : '';
  
  // Reliable proxy options for production
  const fallbackProxies = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/'
  ];
  
  return lsProxy || envProxy || fallbackProxies[0];
};

interface ProxyConfig {
  name: string;
  buildUrl: (targetUrl: string) => string;
  parseResponse: (responseData: any) => any;
}

// Proxy configuration with multiple format support
const getProxyConfig = (): ProxyConfig | null => {
  if (!shouldUseProxy) return null;
  
  const proxyUrl = getProxyUrl();
  
  // Support local development proxy
  if (proxyUrl.includes('/api/proxy')) {
    return {
      name: 'Local Proxy',
      buildUrl: (targetUrl: string) => `${proxyUrl}?url=${encodeURIComponent(targetUrl)}`,
      parseResponse: (data: any) => data
    };
  }
  
  // Support different proxy formats
  if (proxyUrl.includes('allorigins.win')) {
    return {
      name: 'AllOrigins',
      buildUrl: (targetUrl: string) => proxyUrl + encodeURIComponent(targetUrl),
      parseResponse: (data: any) => data
    };
  }
  
  if (proxyUrl.includes('corsproxy.io')) {
    return {
      name: 'CORS Proxy',
      buildUrl: (targetUrl: string) => `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
      parseResponse: (data: any) => data
    };
  }
  
  if (proxyUrl.includes('cors.isomorphic-git.org')) {
    return {
      name: 'Isomorphic Git CORS',
      buildUrl: (targetUrl: string) => `https://cors.isomorphic-git.org/${targetUrl}`,
      parseResponse: (data: any) => data
    };
  }
  
  // Default custom proxy format
  return {
    name: 'Custom Proxy',
    buildUrl: (targetUrl: string) => `${proxyUrl}/${encodeURIComponent(targetUrl)}`,
    parseResponse: (data: any) => data
  };
};

// Build API URL with or without proxy and add cache busting
const buildApiUrl = (path: string) => {
  const timestamp = Date.now();
  const separator = path.includes('?') ? '&' : '?';
  const targetUrl = `${API_BASE_URL}${path}${separator}_t=${timestamp}`;
  
  const proxyConfig = getProxyConfig();
  
  if (!shouldUseProxy || !proxyConfig) {
    console.log('🔗 Direct API call:', targetUrl);
    return targetUrl;
  }
  
  const proxiedUrl = proxyConfig.buildUrl(targetUrl);
  console.log('🔀 Proxy API call:', proxiedUrl, `(via ${proxyConfig.name})`);
  console.log('🎯 Target URL:', targetUrl);
  
  return proxiedUrl;
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
    const apiUrl = buildApiUrl('/api/health');
    console.log('Health check API URL:', apiUrl);
    
    const response = await fetch(apiUrl, { 
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: getTimeoutSignal(5000)
    });
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

export const fetchNFTGifts = async (username: string) => {
  // Clean username by removing @ if present
  const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
  
  const apiUrl = buildApiUrl(`/api/nft-gifts?username=@${encodeURIComponent(cleanUsername)}`);
  
  console.log('Fetching NFT data from:', apiUrl);
  console.log('API Base URL:', API_BASE_URL);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: getTimeoutSignal(20000)
    });
    
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      
      if (response.status === 404) {
        throw new Error('USER_NOT_FOUND');
      } else if (response.status === 429) {
        // Read Retry-After header for rate limiting
        const retryAfter = response.headers.get('Retry-After');
        const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 10;
        const errorMessage = `RATE_LIMIT_EXCEEDED:${retryAfterSeconds}`;
        throw new Error(errorMessage);
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
    const proxyConfig = getProxyConfig();
    const processedData = shouldUseProxy && proxyConfig ? proxyConfig.parseResponse(responseData) : responseData;
    return processAPIResponse(processedData, shouldUseProxy);
    
  } catch (error) {
    console.error('API request failed:', error);
    
    // Handle mixed content errors specifically
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_BASE_URL.startsWith('http:')) {
        throw new Error('INSECURE_API_URL');
      }
    }
    
    // Re-throw specific errors
    if (error instanceof Error && (
        error.message.startsWith('RATE_LIMIT_EXCEEDED') ||
        ['USER_NOT_FOUND', 'CANNOT_RECEIVE_GIFTS', 'ACCESS_FORBIDDEN', 'SERVER_ERROR', 'PARSE_ERROR', 'INSECURE_API_URL'].includes(error.message)
    )) {
      throw error;
    }
    
    // Network or other errors
    throw new Error('NETWORK_ERROR');
  }
};

// Fetch User Profile (photo and name)
export const fetchUserProfile = async (username: string) => {
  const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
  const apiUrl = buildApiUrl(`/api/user-profile?username=${encodeURIComponent(cleanUsername)}`);
  
  console.log('Fetching user profile from:', apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: getTimeoutSignal(10000)
    });
    
    if (!response.ok) {
      console.error('User profile API response not OK:', response.status);
      if (response.status === 404) {
        throw new Error('USER_NOT_FOUND');
      }
      throw new Error('NETWORK_ERROR');
    }
    
    const responseData = await response.json();
    console.log('User profile response:', responseData);
    
    return {
      name: responseData.name || cleanUsername,
      photo_base64: responseData.photo_base64 || null
    };
    
  } catch (error) {
    console.error('User profile request failed:', error);
    // Return fallback data instead of throwing
    return {
      name: cleanUsername,
      photo_base64: null
    };
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