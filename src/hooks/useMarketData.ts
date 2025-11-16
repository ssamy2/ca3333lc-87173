import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCachedData, setCachedData } from '@/services/marketCache';
import { getAuthHeaders } from '@/lib/telegramAuth';
import { normalizeImageUrl } from '@/utils/urlNormalizer';

interface NFTMarketData {
  priceTon: number;
  priceUsd: number;
  tonPrice24hAgo?: number;
  usdPrice24hAgo?: number;
  tonPriceWeekAgo?: number;
  usdPriceWeekAgo?: number;
  tonPriceMonthAgo?: number;
  usdPriceMonthAgo?: number;
  'change_24h_ton_%': number;
  'change_24h_usd_%': number;
  market_cap_ton?: string;
  market_cap_usd?: string;
  fdv_ton?: string;
  fdv_usd?: string;
  price_ton: number;
  price_usd: number;
  image_url: string;
  upgradedSupply?: number;
}

interface MarketData {
  [key: string]: NFTMarketData;
}

// Fetch market data from API
const fetchMarketData = async (): Promise<MarketData> => {
  const apiUrl = 'https://www.channelsseller.site/api/market-data';
  const headers = await getAuthHeaders();
  
  const response = await fetch(apiUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      console.log('Access Denied S2170');
    }
    throw new Error('Failed to fetch market data');
  }
  const rawData = await response.json();
  
  // Normalize all image URLs in the data
  const data: MarketData = {};
  Object.entries(rawData).forEach(([key, value]: [string, any]) => {
    data[key] = {
      ...value,
      image_url: normalizeImageUrl(value.image_url)
    };
  });
  
  // Cache the normalized data
  setCachedData('market-data', data);
  
  // Immediately preload images after successful data fetch
  setTimeout(() => {
    import('@/services/imageCache').then(({ preloadImages }) => {
      preloadImages().catch(console.error);
    });
  }, 100); // Small delay to not block the UI
  
  return data;
};

// Custom hook for market data with caching
export const useMarketData = () => {
  return useQuery({
    queryKey: ['market-data'],
    queryFn: fetchMarketData,
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
    placeholderData: () => getCachedData('market-data'), // Show cached data while fetching
  });
};

// Prefetch market data
export const usePrefetchMarketData = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: ['market-data'],
      queryFn: fetchMarketData,
      staleTime: 30000,
    });
  };
};
