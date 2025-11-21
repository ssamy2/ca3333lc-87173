import { mockNFTResponse, mockErrorResponses } from './mockData';
import { getAuthHeaders } from '@/lib/telegramAuth';
import { normalizeImageUrl } from '@/utils/urlNormalizer';

export const USE_MOCK_DATA = false; // Always use real API

// Build API URL directly to new domain
const buildApiUrl = (path: string): string => {
  return `https://www.channelsseller.site${path}`;
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

// Fetch NFT gifts for a specific username
export const fetchNFTGifts = async (username: string) => {
  // Clean username and add @ if not present
  const cleanUsername = username.startsWith('@') ? username : `@${username}`;
  
  const apiUrl = buildApiUrl(`/api/user/${encodeURIComponent(cleanUsername)}/nfts`);
  const authHeaders = await getAuthHeaders();
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...authHeaders
      },
      signal: getTimeoutSignal(20000)
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.log('Access Denied S2170');
        throw new Error('ACCESS_DENIED');
      } else if (response.status === 404) {
        throw new Error('USER_NOT_FOUND');
      } else if (response.status === 429) {
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
      throw new Error('PARSE_ERROR');
    }
    
    return processAPIResponse(responseData, cleanUsername);
    
  } catch (error) {
    // Re-throw specific errors
    if (error instanceof Error && (
        error.message.startsWith('RATE_LIMIT_EXCEEDED') ||
        ['USER_NOT_FOUND', 'CANNOT_RECEIVE_GIFTS', 'ACCESS_FORBIDDEN', 'SERVER_ERROR', 'PARSE_ERROR'].includes(error.message)
    )) {
      throw error;
    }
    
    // Network or other errors
    throw new Error('NETWORK_ERROR');
  }
};

// Fetch Single Gift Price from link
export const fetchSingleGiftPrice = async (giftUrl: string) => {
  // Validate URL format
  if (!giftUrl.includes('t.me/nft/') && !giftUrl.includes('telegram.me/nft/')) {
    throw new Error('INVALID_GIFT_URL');
  }
  
  const apiUrl = buildApiUrl(`/api/gift/from-link?url=${encodeURIComponent(giftUrl)}`);
  const authHeaders = await getAuthHeaders();
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...authHeaders
      },
      signal: getTimeoutSignal(10000)
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.log('Access Denied S2170');
        throw new Error('ACCESS_DENIED');
      } else if (response.status === 404) {
        throw new Error('GIFT_NOT_FOUND');
      }
      throw new Error('NETWORK_ERROR');
    }
    
    const responseData = await response.json();
    
    // Handle new API response format with success/data wrapper
    let actualData = responseData;
    if (responseData.success && responseData.data) {
      actualData = responseData.data;
    }
    
    // Normalize the response to match expected format
    const normalizedData = {
      ...actualData,
      image: normalizeImageUrl(actualData.image_url || actualData.image), // Use image_url if available
    };
    
    return {
      success: true,
      data: normalizedData
    };
    
  } catch (error) {
    if (error instanceof Error && error.message === 'GIFT_NOT_FOUND') {
      throw error;
    }
    
    throw new Error('NETWORK_ERROR');
  }
};

// Fetch User Profile (photo and name)
export const fetchUserProfile = async (username: string) => {
  const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
  
  const apiUrl = buildApiUrl(`/api/user-profile?username=@${encodeURIComponent(cleanUsername)}`);
  const authHeaders = await getAuthHeaders();
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...authHeaders
      },
      signal: getTimeoutSignal(10000)
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.log('Access Denied S2170');
        throw new Error('ACCESS_DENIED');
      } else if (response.status === 404) {
        throw new Error('USER_NOT_FOUND');
      }
      throw new Error('NETWORK_ERROR');
    }
    
    const responseData = await response.json();
    
    // Clean the name to remove "None" and extra spaces
    let cleanName = responseData.name || cleanUsername;
    if (cleanName) {
      // Remove "None" from the name and clean up spaces
      cleanName = cleanName.replace(/\bNone\b/g, '').replace(/\s+/g, ' ').trim();
      // If name becomes empty after cleaning, use username
      if (!cleanName) {
        cleanName = cleanUsername;
      }
    }
    
    return {
      name: cleanName,
      photo_base64: responseData.photo_base64 || null
    };
    
  } catch (error) {
    // Return fallback data for errors
    return {
      name: cleanUsername,
      photo_base64: null
    };
  }
};

// Helper function to process API response
const processAPIResponse = (responseData: any, username?: string) => {
  // Handle empty gifts response
  if (responseData && responseData.total_nfts === 0) {
    return {
      success: true,
      data: {
        owner: username || 'user',
        visible_nfts: 0,
        prices: {
          floor_price: { TON: 0, USD: 0, STAR: 0 },
          avg_price: { TON: 0, USD: 0, STAR: 0 }
        },
        nfts: [],
        total_saved_gifts: 0
      },
      stats: {
        items: 0,
        total_gifts: 0,
        enriched: 0
      }
    };
  }
  
  // Transform new API response format to expected format
  if (responseData && responseData.nft_gifts) {
    // Calculate minimum floor price from all NFTs
    const minFloorPrice = responseData.nft_gifts.length > 0 
      ? Math.min(...responseData.nft_gifts.map((gift: any) => gift.price_ton || 0))
      : 0;
    
    // Calculate minimum floor price in USD
    const tonToUsdRatio = responseData.total_value_ton > 0 
      ? responseData.total_value_usd / responseData.total_value_ton 
      : 2.12; // fallback ratio
    const minFloorPriceUSD = minFloorPrice * tonToUsdRatio;
    
    return {
      success: true,
      data: {
        owner: username || 'user',
        visible_nfts: responseData.total_nfts || 0,
        prices: {
          floor_price: { 
            TON: minFloorPrice, 
            USD: minFloorPriceUSD, 
            STAR: 0 
          },
          avg_price: { 
            TON: responseData.total_value_ton || 0, 
            USD: responseData.total_value_usd || 0, 
            STAR: 0 
          }
        },
        nfts: responseData.nft_gifts.map((gift: any) => {
          // Extract gift number from link if mint is not available
          let giftNumber = gift.mint;
          if (!giftNumber && gift.link) {
            const match = gift.link.match(/\/nft\/[^/]+_(\d+)/);
            if (match) giftNumber = match[1];
          }
          
          return {
            count: 1,
            name: gift.gift_name || 'Unknown',
            model: gift.model || 'Unknown',
            pattern: gift.pattern || '',
            floor_price: gift.price_ton || 0,
            avg_price: gift.price_ton || 0,
            price_change_percent: 0,
            image: normalizeImageUrl(gift.image) || '',
            title: gift.gift_name || 'Unknown',
            backdrop: gift.backdrop || '',
            model_rarity: gift.rarity || 0,
            quantity_issued: giftNumber || 0,
            quantity_total: 0,
            quantity_raw: giftNumber ? `#${giftNumber}` : '',
            description: '',
            tg_deeplink: gift.link || '',
            details: {
              links: gift.link ? [gift.link] : []
            }
          };
        }),
        total_saved_gifts: responseData.total_nfts
      },
      stats: {
        items: responseData.total_nfts || 0,
        total_gifts: responseData.total_nfts || 0,
        enriched: responseData.total_nfts || 0
      }
    };
  }
  
  return responseData;
};
