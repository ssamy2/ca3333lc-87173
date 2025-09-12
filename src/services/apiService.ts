import { mockNFTResponse, mockErrorResponses } from './mockData';

export const USE_MOCK_DATA = false; // Always use real API

// Get the API base URL with CORS proxy for development
const getApiBaseUrl = () => {
  // Use CORS proxy for development to avoid CORS issues
  const isDevelopment = window.location.hostname.includes('lovable.dev') || window.location.hostname === 'localhost';
  const directUrl = 'http://207.180.203.9:5000';
  
  if (isDevelopment) {
    // Use a CORS proxy service for development
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`;
  }
  
  return directUrl;
};

// API Health Check
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    const baseUrl = getApiBaseUrl();
    const apiUrl = `${baseUrl}/api/health`;
    
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
  const isDevelopment = window.location.hostname.includes('lovable.dev') || window.location.hostname === 'localhost';
  
  let apiUrl: string;
  if (isDevelopment) {
    // For development with CORS proxy - use allorigins.win to bypass CORS
    const targetUrl = `http://207.180.203.9:5000/api/nft-gifts?username=@${encodeURIComponent(cleanUsername)}`;
    apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
  } else {
    // For production, use direct URL
    apiUrl = `http://207.180.203.9:5000/api/nft-gifts?username=@${encodeURIComponent(cleanUsername)}`;
  }
  
  console.log('Fetching NFT data from:', apiUrl);
  console.log('Is development:', isDevelopment);
  
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
    if (isDevelopment && responseData.contents) {
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
    console.error('Is Development:', isDevelopment);
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