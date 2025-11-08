import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCachedData, setCachedData } from '@/services/marketCache';

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
  const response = await fetch('http://151.241.228.83/api/market-data');
  if (!response.ok) {
    throw new Error('Failed to fetch market data');
  }
  const data = await response.json();
  
  // Cache the data
  setCachedData('market-data', data);
  
  return data;
};

// Custom hook for market data with caching
export const useMarketData = () => {
  return useQuery({
    queryKey: ['market-data'],
    queryFn: fetchMarketData,
    staleTime: 30000, // Data is fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: false,
    initialData: () => getCachedData('market-data'), // Use cached data initially
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
