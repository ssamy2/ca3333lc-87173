import { mockNFTResponse, mockErrorResponses } from './mockData';

export const USE_MOCK_DATA = false; // Always use real API

// Get API base URL from environment or fallback
const DIRECT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://207.180.203.9:5000';
const FORCE_PROXY = import.meta.env.VITE_FORCE_PROXY === 'true';

// Detect if we need to use a proxy
const isHttpsPage = window.location.protocol === 'https:';
const isLovablePreview = window.location.hostname.endsWith('.lovable.app') || window.location.hostname.endsWith('.lovable.dev');
const isLocalhost = window.location.hostname === 'localhost';
const shouldUseProxy = FORCE_PROXY || 
  (isHttpsPage && DIRECT_API_BASE_URL.startsWith('http://')) || 
  isLovablePreview || 
  isLocalhost;

// Helper functions for proxy URLs
const withProxyGet = (targetUrl: string) => 
  `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

const withProxyRaw = (targetUrl: string) => 
  `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

// Build API URL with or without proxy
const buildApiUrl = (path: string, forJson: boolean = true) => {
  const targetUrl = `${DIRECT_API_BASE_URL}${path}`;
  return shouldUseProxy ? (forJson ? withProxyGet(targetUrl) : withProxyRaw(targetUrl)) : targetUrl;
};

// API Health Check
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    const apiUrl = buildApiUrl('/api/health', false); // Use raw for health check
    
    const response = await fetch(apiUrl, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const fetchNFTGifts = async (username: string) => {
  // Clean username by removing @ if present
  const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
  
  const apiUrl = buildApiUrl(`/api/nft-gifts?username=@${encodeURIComponent(cleanUsername)}`, true);
  
  console.log('Fetching NFT data from:', apiUrl);
  console.log('Using proxy:', shouldUseProxy);
  console.log('Page protocol:', window.location.protocol);
  console.log('API base URL:', DIRECT_API_BASE_URL);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      // Handle different HTTP status codes
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
    console.log('API Response:', responseData);
    
    // Handle CORS proxy response format
    if (shouldUseProxy && responseData.contents) {
      try {
        return JSON.parse(responseData.contents);
      } catch (parseError) {
        console.error('Failed to parse CORS proxy response:', parseError);
        throw new Error('PARSE_ERROR');
      }
    }
    
    return responseData;
  } catch (error) {
    // Detailed error logging
    console.error('=== NFT Fetch Error Details ===');
    console.error('Username:', cleanUsername);
    console.error('API URL:', apiUrl);
    console.error('Using Proxy:', shouldUseProxy);
    console.error('Page Protocol:', window.location.protocol);
    console.error('API Base URL:', DIRECT_API_BASE_URL);
    console.error('Error Type:', error?.constructor?.name);
    console.error('Error Message:', error?.message);
    console.error('Full Error Object:', error);
    console.error('Stack Trace:', error?.stack);
    console.error('==========================');
    
    // Handle different error types
    if (error instanceof TypeError) {
      console.error('Network/CORS error detected - connection failed or CORS blocking');
      throw new Error('NETWORK_ERROR');
    } else if (error?.name === 'AbortError') {
      console.error('Timeout error detected - request took too long');
      throw new Error('TIMEOUT_ERROR');
    } else if (error instanceof Error && error.message.includes('CORS')) {
      console.error('CORS error detected - cross-origin request blocked');
      throw new Error('CORS_ERROR');
    }
    
    console.error('Re-throwing original error');
    throw error;
  }
};