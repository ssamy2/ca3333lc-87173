/**
 * CoinGecko API Service with Base64 LocalStorage Image Caching
 * @novachartsbot - Crypto Gift Center
 */

export interface CryptoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
  sparkline_in_7d?: {
    price: number[];
  };
  // Cached image as base64
  image_base64?: string;
}

export interface CryptoChartData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CACHE_PREFIX = 'nova_crypto_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const IMAGE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Storage helpers
const getFromCache = <T>(key: string): { data: T; timestamp: number } | null => {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error('[CryptoService] Cache read error:', e);
  }
  return null;
};

const setToCache = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error('[CryptoService] Cache write error:', e);
    // Clear old cache if storage is full
    clearOldCache();
  }
};

const clearOldCache = (): void => {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(key => {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > IMAGE_CACHE_DURATION) {
          localStorage.removeItem(key);
        }
      }
    });
  } catch (e) {
    console.error('[CryptoService] Cache clear error:', e);
  }
};

// Convert image URL to Base64 for caching
const imageToBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('[CryptoService] Image fetch error:', e);
    return null;
  }
};

// Cache crypto images as base64
const cacheImages = async (coins: CryptoMarketData[]): Promise<CryptoMarketData[]> => {
  const updatedCoins = await Promise.all(
    coins.map(async (coin) => {
      const cacheKey = `img_${coin.id}`;
      const cached = getFromCache<string>(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < IMAGE_CACHE_DURATION) {
        return { ...coin, image_base64: cached.data };
      }
      
      const base64 = await imageToBase64(coin.image);
      if (base64) {
        setToCache(cacheKey, base64);
        return { ...coin, image_base64: base64 };
      }
      
      return coin;
    })
  );
  
  return updatedCoins;
};

/**
 * Fetch top 20 cryptocurrencies with market data and sparklines
 */
export const fetchTopCryptos = async (limit: number = 20): Promise<CryptoMarketData[]> => {
  const cacheKey = `market_top_${limit}`;
  const cached = getFromCache<CryptoMarketData[]>(cacheKey);
  
  // Return cached data if fresh
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('[CryptoService] Returning cached market data');
    return cached.data;
  }
  
  try {
    const url = `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&sparkline=true&price_change_percentage=24h,7d,30d`;
    
    console.log('[CryptoService] Fetching market data...');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: CryptoMarketData[] = await response.json();
    
    // Validate response
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid API response');
    }
    
    // Cache images as base64
    const dataWithImages = await cacheImages(data);
    
    // Cache the result
    setToCache(cacheKey, dataWithImages);
    
    console.log(`[CryptoService] Fetched ${data.length} coins`);
    return dataWithImages;
  } catch (error) {
    console.error('[CryptoService] Fetch error:', error);
    
    // Return stale cache if available
    if (cached) {
      console.log('[CryptoService] Returning stale cache');
      return cached.data;
    }
    
    throw error;
  }
};

/**
 * Fetch historical chart data for a specific coin
 */
export const fetchCryptoChart = async (
  coinId: string,
  days: number = 365
): Promise<CryptoChartData> => {
  const cacheKey = `chart_${coinId}_${days}`;
  const cached = getFromCache<CryptoChartData>(cacheKey);
  
  // Chart data can be cached longer
  const chartCacheDuration = days <= 1 ? 5 * 60 * 1000 : 15 * 60 * 1000;
  
  if (cached && Date.now() - cached.timestamp < chartCacheDuration) {
    console.log(`[CryptoService] Returning cached chart for ${coinId}`);
    return cached.data;
  }
  
  try {
    const url = `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
    
    console.log(`[CryptoService] Fetching chart for ${coinId}...`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: CryptoChartData = await response.json();
    
    // Validate response
    if (!data.prices || !Array.isArray(data.prices)) {
      throw new Error('Invalid chart data');
    }
    
    setToCache(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error(`[CryptoService] Chart fetch error for ${coinId}:`, error);
    
    if (cached) {
      return cached.data;
    }
    
    throw error;
  }
};

/**
 * Fetch single coin details
 */
export const fetchCoinDetails = async (coinId: string): Promise<any> => {
  const cacheKey = `details_${coinId}`;
  const cached = getFromCache<any>(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    const url = `${COINGECKO_API}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    setToCache(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error(`[CryptoService] Details fetch error for ${coinId}:`, error);
    
    if (cached) {
      return cached.data;
    }
    
    throw error;
  }
};

/**
 * Pre-fetch data on app bootstrap
 */
export const prefetchCryptoData = async (): Promise<void> => {
  try {
    console.log('[CryptoService] Starting prefetch...');
    await fetchTopCryptos(20);
    console.log('[CryptoService] Prefetch complete');
  } catch (error) {
    console.error('[CryptoService] Prefetch error:', error);
  }
};

/**
 * Format large numbers
 */
export const formatMarketCap = (value: number | null | undefined): string => {
  const num = Number(value) || 0;
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

/**
 * Format price with appropriate decimals
 */
export const formatPrice = (price: number | null | undefined): string => {
  const num = Number(price) || 0;
  if (num >= 1000) return `$${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (num >= 1) return `$${num.toFixed(2)}`;
  if (num >= 0.01) return `$${num.toFixed(4)}`;
  return `$${num.toFixed(8)}`;
};

/**
 * Format percentage change
 */
export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};
