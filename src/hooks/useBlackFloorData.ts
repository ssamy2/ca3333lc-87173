import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCachedData, setCachedData } from '@/services/marketCache';
import { getAuthHeaders } from '@/lib/telegramAuth';

import { MarketItem } from '@/types/MarketData';

interface BlackAPIResponse {
  [key: string]: {
    gift_name: string;
    current_black_price_ton: number;
    current_black_price_usd: number;
    daily_change_percent_ton: number;
    daily_past_price_ton: number;
    daily_change_percent_usd: number;
    weekly_change_percent_ton: number;
    weekly_past_price_ton: number;
    weekly_change_percent_usd: number;
    monthly_change_percent_ton: number | null;
    monthly_past_price_ton: number | null;
    monthly_change_percent_usd: number | null;
    quarterly_change_percent_ton: number | null;
    quarterly_past_price_ton: number | null;
    quarterly_change_percent_usd: number | null;
  };
}

// Fetch black floor data from API
const fetchBlackFloorData = async (): Promise<MarketItem[]> => {
  const { DEV_MODE } = await import('@/config/devMode');
  const baseUrl = DEV_MODE ? 'http://localhost:5002' : 'https://www.channelsseller.site';
  const apiUrl = `${baseUrl}/api/black/summary`;
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
    throw new Error('Failed to fetch black floor data');
  }
  const data: BlackAPIResponse = await response.json();

  // Convert object of objects to array and preserve all fields
  const processedData: MarketItem[] = Object.entries(data).map(([shortName, item]) => {
    return {
      id: shortName,
      name: item.gift_name,
      short_name: shortName,
      image: `https://www.channelsseller.site/api/image/${shortName}`,
      price_ton: item.current_black_price_ton,
      price_usd: item.current_black_price_usd,
      black_price: item.current_black_price_ton,
      change_24h: item.daily_change_percent_ton,
      change_7d: item.weekly_change_percent_ton,
      change_30d: item.monthly_change_percent_ton ?? undefined,
      change_24h_ton_percent: item.daily_change_percent_ton,
      change_24h_usd_percent: item.daily_change_percent_usd,
      weekly_change_percent_ton: item.weekly_change_percent_ton,
      weekly_change_percent_usd: item.weekly_change_percent_usd,
      monthly_change_percent_ton: item.monthly_change_percent_ton ?? undefined,
      monthly_change_percent_usd: item.monthly_change_percent_usd ?? undefined,
      daily_past_price_ton: item.daily_past_price_ton,
      weekly_past_price_ton: item.weekly_past_price_ton,
      monthly_past_price_ton: item.monthly_past_price_ton ?? undefined,
      tonPrice24hAgo: item.daily_past_price_ton,
      tonPriceWeekAgo: item.weekly_past_price_ton,
      tonPriceMonthAgo: item.monthly_past_price_ton ?? undefined,
      is_black_market: true
    };
  });

  // Cache the data
  setCachedData('black-floor-data', processedData);

  return processedData;
};

// Custom hook for black floor data with caching
export const useBlackFloorData = () => {
  return useQuery({
    queryKey: ['black-floor-data'],
    queryFn: fetchBlackFloorData,
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
    placeholderData: () => getCachedData('black-floor-data'),
  });
};

// Prefetch black floor data
export const usePrefetchBlackFloorData = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: ['black-floor-data'],
      queryFn: fetchBlackFloorData,
      staleTime: 30000,
    });
  };
};
