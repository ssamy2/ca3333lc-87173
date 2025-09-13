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

// Proxy configurations with proper URL building
interface ProxyConfig {
  name: string;
  buildUrl: (targetUrl: string, forJson: boolean) => string;
  parseResponse: (responseData: any) => any;
}

const proxyConfigs: ProxyConfig[] = [
  // Custom proxy from environment (highest priority)
  ...(import.meta.env.VITE_CORS_PROXY ? [{
    name: 'Custom',
    buildUrl: (targetUrl: string) => `${import.meta.env.VITE_CORS_PROXY}/${encodeURIComponent(targetUrl)}`,
    parseResponse: (data: any) => data
  }] : []),
  
  // Elfsight CORS Proxy - fast and stable
  {
    name: 'Elfsight',
    buildUrl: (targetUrl: string) => `https://cors-proxy.elfsight.com/${targetUrl}`,
    parseResponse: (data: any) => data
  },
  
  // CORS.SH - reliable alternative
  {
    name: 'CORS.SH',
    buildUrl: (targetUrl: string) => `https://proxy.cors.sh/${targetUrl}`,
    parseResponse: (data: any) => data
  },
  
  // AllOrigins - handles JSON wrapping
  {
    name: 'AllOrigins',
    buildUrl: (targetUrl: string, forJson: boolean = true) => 
      forJson 
        ? `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`
        : `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    parseResponse: (data: any) => {
      // AllOrigins wraps response in { contents: "..." }
      if (data && typeof data === 'object' && data.contents) {
        try {
          return JSON.parse(data.contents);
        } catch {
          return data.contents;
        }
      }
      return data;
    }
  },
  
  // Corsflare - dedicated CORS service
  {
    name: 'Corsflare',
    buildUrl: (targetUrl: string) => `https://corsflare.com/?${encodeURIComponent(targetUrl)}`,
    parseResponse: (data: any) => data
  },
  
  // ThingProxy - simple and reliable
  {
    name: 'ThingProxy',
    buildUrl: (targetUrl: string) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(targetUrl)}`,
    parseResponse: (data: any) => data
  },
  
  // Isomorphic CORS - alternative
  {
    name: 'Isomorphic',
    buildUrl: (targetUrl: string) => `https://cors.isomorphic-git.org/${targetUrl}`,
    parseResponse: (data: any) => data
  },
  
  // CORS Anywhere - requires demo activation (last resort)
  {
    name: 'CORS-Anywhere',
    buildUrl: (targetUrl: string) => `https://cors-anywhere.herokuapp.com/${targetUrl}`,
    parseResponse: (data: any) => data
  }
];

// Build API URL with or without proxy and add cache busting
const buildApiUrl = (path: string, forJson: boolean = true, proxyIndex: number = 0) => {
  const timestamp = Date.now();
  const separator = path.includes('?') ? '&' : '?';
  const targetUrl = `${DIRECT_API_BASE_URL}${path}${separator}_t=${timestamp}`;
  
  if (!shouldUseProxy) {
    return targetUrl;
  }
  
  const proxy = proxyConfigs[proxyIndex];
  return proxy.buildUrl(targetUrl, forJson);
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
        signal: getTimeoutSignal(20000) // Increased to 20 seconds for slow connections
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
  for (let proxyAttempt = 0; proxyAttempt < proxyConfigs.length; proxyAttempt++) {
    const proxy = proxyConfigs[proxyAttempt];
    const apiUrl = buildApiUrl(`/api/nft-gifts?username=@${encodeURIComponent(cleanUsername)}`, true, proxyAttempt);
    
    console.log(`Attempt ${proxyAttempt + 1} (${proxy.name}): Fetching NFT data from:`, apiUrl);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Requested-With': 'XMLHttpRequest'
        },
        signal: getTimeoutSignal(15000)
      });
      
      if (!response.ok) {
        console.error(`${proxy.name} response not OK:`, response.status, response.statusText);
        
        // Log but continue to next proxy for these errors
        if (response.status === 403 || response.status === 429 || response.status >= 500) {
          lastError = new Error(response.status === 403 ? 'ACCESS_FORBIDDEN' : 
                               response.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'SERVER_ERROR');
          console.log(`${proxy.name} failed with ${response.status}, trying next proxy...`);
          continue;
        } else if (response.status === 404) {
          throw new Error('USER_NOT_FOUND');
        } else {
          lastError = new Error(`HTTP_${response.status}`);
          continue;
        }
      }
      
      // Try to parse response
      let responseData;
      try {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error(`${proxy.name} parse error:`, parseError);
        lastError = new Error('PARSE_ERROR');
        continue;
      }
      
      console.log(`${proxy.name} API Response:`, responseData);
      
      // Process response with proxy-specific parser
      const processedData = proxy.parseResponse(responseData);
      return processAPIResponse(processedData, proxyAttempt > 0);
      
    } catch (error) {
      console.error(`${proxy.name} failed:`, error);
      lastError = error;
      
      // For final/definitive errors, don't try other proxies
      if (error instanceof Error && 
          (error.message === 'USER_NOT_FOUND' || 
           error.message === 'CANNOT_RECEIVE_GIFTS')) {
        throw error;
      }
      
      // Continue to next proxy for network/temporary errors
      continue;
    }
  }
  
  // All attempts failed
  console.error('=== All connection attempts failed ===');
  console.error('Last error:', lastError);
  throw new Error('NETWORK_ERROR');
};

// Helper function to process API response
const processAPIResponse = (responseData: any, isProxy: boolean) => {
  let finalData = responseData;
  
  // Check for API error responses
  if (finalData && !finalData.success && finalData.error) {
    if (finalData.error === 'Cannot receive gifts') {
      throw new Error('CANNOT_RECEIVE_GIFTS');
    }
  }
  
  return finalData;
};