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

// Fetch User Profile from NFTs response (no separate request needed)
export const fetchUserProfile = async (username: string, nftResponseData?: any) => {
  const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
  
  // If we have NFT response data, use it directly (no separate request)
  if (nftResponseData && nftResponseData.profile_information) {
    const profileInfo = nftResponseData.profile_information || {};
    
    // Get name from profile_information.full_name
    let cleanName = profileInfo.full_name || nftResponseData.username || cleanUsername;
    if (cleanName) {
      // Remove "None" from the name and clean up spaces
      cleanName = cleanName.replace(/\bNone\b/g, '').replace(/\s+/g, ' ').trim();
      // If name becomes empty after cleaning, use username
      if (!cleanName) {
        cleanName = cleanUsername;
      }
    }
    
    // Get photo from profile_information.profile_image and fetch it as base64
    let photo_base64 = null;
    if (profileInfo.profile_image) {
      try {
        photo_base64 = await fetchImageAsBase64(profileInfo.profile_image);
      } catch (imgError) {
        console.warn('Failed to fetch profile image:', imgError);
        photo_base64 = null;
      }
    }
    
    return {
      name: cleanName,
      photo_base64: photo_base64,
      user_id: nftResponseData.user_id,
      total_nfts: nftResponseData.total_nfts
    };
  }
  
  // Fallback: return default data
  return {
    name: cleanUsername,
    photo_base64: null,
    user_id: null,
    total_nfts: 0
  };
};

// Helper function to fetch image as base64
const fetchImageAsBase64 = async (imageUrl: string): Promise<string | null> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image as base64:', error);
    return null;
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
  // Backend now returns: nfts (upgraded), regular_gifts (unupgraded), total_value_ton, total_value_usd
  if (responseData && responseData.nfts && Array.isArray(responseData.nfts)) {
    // Filter only upgraded/unique gifts (not regular gifts)
    const upgradedGifts = responseData.nfts || [];
    
    // Calculate minimum floor price from upgraded NFTs only
    const minFloorPrice = upgradedGifts.length > 0 
      ? Math.min(...upgradedGifts.map((gift: any) => gift.price_ton || gift.rarity_per_mille || 0))
      : 0;
    
    // Calculate average price from upgraded NFTs
    const avgPrice = upgradedGifts.length > 0
      ? upgradedGifts.reduce((sum: number, gift: any) => sum + (gift.price_ton || gift.rarity_per_mille || 0), 0) / upgradedGifts.length
      : 0;
    
    // Calculate minimum floor price in USD
    const tonToUsdRatio = responseData.total_value_ton > 0 
      ? responseData.total_value_usd / responseData.total_value_ton 
      : 2.12; // fallback ratio
    const minFloorPriceUSD = minFloorPrice * tonToUsdRatio;
    const avgPriceUSD = avgPrice * tonToUsdRatio;
    
    return {
      success: true,
      data: {
        owner: username || 'user',
        visible_nfts: upgradedGifts.length,
        prices: {
          floor_price: { 
            TON: parseFloat(minFloorPrice.toFixed(2)), 
            USD: parseFloat(minFloorPriceUSD.toFixed(2)), 
            STAR: 0 
          },
          avg_price: { 
            TON: parseFloat(avgPrice.toFixed(2)), 
            USD: parseFloat(avgPriceUSD.toFixed(2)), 
            STAR: 0 
          }
        },
        nfts: upgradedGifts.map((gift: any) => {
          // Build image URL using GET request to backend
          const imageUrl = gift.image_url 
            ? buildApiUrl(`/api/image/${encodeURIComponent(gift.image_url)}`)
            : '';
          
          // Ensure details object exists with safe defaults
          const details = gift.details || {};
          const links = Array.isArray(details.links) ? details.links : (gift.link ? [gift.link] : []);
          
          return {
            count: 1,
            name: gift.title || gift.name || 'Unknown',
            model: gift.model || 'Unknown',
            pattern: gift.backdrop || '',
            floor_price: gift.price_ton || gift.rarity_per_mille || 0,
            avg_price: gift.price_ton || gift.rarity_per_mille || 0,
            price_change_percent: 0,
            image: normalizeImageUrl(imageUrl),
            title: gift.title || gift.name || 'Unknown',
            backdrop: gift.backdrop || '',
            model_rarity: gift.rarity_per_mille || 0,
            quantity_issued: gift.number || 0,
            quantity_total: 0,
            quantity_raw: gift.number ? `#${gift.number}` : '',
            description: '',
            tg_deeplink: gift.link || '',
            details: {
              links: links
            }
          };
        }),
        total_saved_gifts: upgradedGifts.length
      },
      stats: {
        items: upgradedGifts.length,
        total_gifts: responseData.total_nfts || 0,
        enriched: upgradedGifts.length
      }
    };
  }
  
  return responseData;
};
