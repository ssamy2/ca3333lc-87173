import { mockNFTResponse, mockErrorResponses } from './mockData';

export const USE_MOCK_DATA = false; // Always use real API

// Get API base URL from environment or fallback
const DIRECT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://207.180.203.9:5000';
const FORCE_PROXY = import.meta.env.VITE_FORCE_PROXY === 'true';

// Detect environment safely
const isBrowser = typeof window !== 'undefined';
const pageProtocol = isBrowser ? window.location.protocol : 'https:';
const pageHostname = isBrowser ? window.location.hostname : '';
const isHttpsPage = pageProtocol === 'https:';
const isLovablePreview = pageHostname.endsWith('.lovable.app') || pageHostname.endsWith('.lovable.dev');
const isLocalhost = pageHostname === 'localhost';
const shouldUseProxy = FORCE_PROXY || 
  (isHttpsPage && DIRECT_API_BASE_URL.startsWith('http://')) || 
  isLovablePreview || 
  isLocalhost;

// Helper functions for proxy URLs with fallback
const corsProxies = [
  'https://api.allorigins.win',
  'https://cors-anywhere.herokuapp.com',
  'https://thingproxy.freeboard.io/fetch'
];

let currentProxyIndex = 0;

const withProxyGet = (targetUrl: string) => {
  const proxy = corsProxies[currentProxyIndex];
  if (proxy === 'https://thingproxy.freeboard.io/fetch') {
    return `${proxy}/${encodeURIComponent(targetUrl)}`;
  }
  return `${proxy}/get?url=${encodeURIComponent(targetUrl)}`;
};

const withProxyRaw = (targetUrl: string) => {
  const proxy = corsProxies[currentProxyIndex];
  if (proxy === 'https://thingproxy.freeboard.io/fetch') {
    return `${proxy}/${encodeURIComponent(targetUrl)}`;
  }
  return `${proxy}/raw?url=${encodeURIComponent(targetUrl)}`;
};

// Build API URL with or without proxy and add cache busting
const buildApiUrl = (path: string, forJson: boolean = true) => {
  const timestamp = Date.now();
  const separator = path.includes('?') ? '&' : '?';
  const targetUrl = `${DIRECT_API_BASE_URL}${path}${separator}_t=${timestamp}`;
  return shouldUseProxy ? (forJson ? withProxyGet(targetUrl) : withProxyRaw(targetUrl)) : targetUrl;
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
    const apiUrl = buildApiUrl('/api/health', false); // Use raw for health check
    
    const response = await fetch(apiUrl, { 
      method: 'GET',
      signal: getTimeoutSignal(5000) // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const fetchNFTGifts = async (username: string) => {
  // Clean username by removing @ if present
  const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
  
  let lastError: any;
  
  // Try direct connection first if not using proxy
  if (!shouldUseProxy) {
    const apiUrl = buildApiUrl(`/api/nft-gifts?username=@${encodeURIComponent(cleanUsername)}`, true);
    
    console.log('Attempting direct connection to:', apiUrl);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        signal: getTimeoutSignal(15000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return processAPIResponse(data, false);
      }
    } catch (error) {
      console.log('Direct connection failed, will try proxy...');
      lastError = error;
    }
  }
  
  // Try with proxy fallbacks
  for (let proxyAttempt = 0; proxyAttempt < corsProxies.length; proxyAttempt++) {
    currentProxyIndex = proxyAttempt;
    const apiUrl = buildApiUrl(`/api/nft-gifts?username=@${encodeURIComponent(cleanUsername)}`, true);
    
    console.log(`Attempt ${proxyAttempt + 1}: Fetching NFT data from:`, apiUrl);
    console.log('Using proxy:', corsProxies[currentProxyIndex]);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        signal: getTimeoutSignal(15000)
      });
      
      if (!response.ok) {
        console.error(`Proxy ${proxyAttempt + 1} response not OK:`, response.status, response.statusText);
        if (response.status === 429) {
          throw new Error('RATE_LIMIT_EXCEEDED');
        } else if (response.status >= 500) {
          throw new Error('SERVER_ERROR');
        } else if (response.status === 404) {
          throw new Error('USER_NOT_FOUND');
        } else {
          throw new Error(`HTTP_${response.status}`);
        }
      }
      
      const responseData = await response.json();
      console.log(`Proxy ${proxyAttempt + 1} API Response:`, responseData);
      
      return processAPIResponse(responseData, true);
      
    } catch (error) {
      console.error(`Proxy ${proxyAttempt + 1} failed:`, error);
      lastError = error;
      
      // If it's not a network error, don't try other proxies
      if (error instanceof Error && 
          !error.message.includes('fetch') && 
          !error.name.includes('NetworkError') &&
          error.name !== 'TypeError') {
        throw error;
      }
    }
  }
  
  // All attempts failed
  console.error('=== All connection attempts failed ===');
  console.error('Last error:', lastError);
  throw new Error('NETWORK_ERROR');
};

// Helper function to process API response
const processAPIResponse = (responseData: any, isProxy: boolean) => {
  // Handle CORS proxy response format
  let finalData = responseData;
  if (isProxy && responseData.contents) {
    try {
      finalData = JSON.parse(responseData.contents);
    } catch (parseError) {
      console.error('Failed to parse CORS proxy response:', parseError);
      throw new Error('PARSE_ERROR');
    }
  }
  
  // Check for API error responses
  if (finalData && !finalData.success && finalData.error) {
    if (finalData.error === 'Cannot receive gifts') {
      throw new Error('CANNOT_RECEIVE_GIFTS');
    }
  }
  
  return finalData;
};