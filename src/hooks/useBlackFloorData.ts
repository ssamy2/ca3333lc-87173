import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCachedData, setCachedData } from '@/services/marketCache';

interface BlackFloorItem {
  gift_name: string;
  short_name: string;
  black_price: number;
  recorded_at: string;
  change_24h_ton_percent?: number;
  change_1w_ton_percent?: number;
  change_1m_ton_percent?: number;
  change_3m_ton_percent?: number;
  change_1y_ton_percent?: number;
  oldest_available_date?: string;
  available_periods?: string[]; // e.g., ['24h', '1w', '1m']
}

// Fetch black floor data from API
const fetchBlackFloorData = async (): Promise<BlackFloorItem[]> => {
  const response = await fetch('http://151.241.228.83:8001/api/black/summary');
  if (!response.ok) {
    throw new Error('Failed to fetch black floor data');
  }
  const data: BlackFloorItem[] = await response.json();
  
  // Filter to get only the latest record for each gift
  const latestRecords = new Map<string, BlackFloorItem>();
  
  data.forEach(item => {
    const existing = latestRecords.get(item.gift_name);
    if (!existing || new Date(item.recorded_at) > new Date(existing.recorded_at)) {
      latestRecords.set(item.gift_name, item);
    }
  });
  
  const filteredData = Array.from(latestRecords.values());
  
  // Calculate changes for all available periods for each gift
  const dataWithChange = filteredData.map(item => {
    const currentTime = new Date(item.recorded_at).getTime();
    const currentPrice = item.black_price;
    
    // Get all records for this gift
    const giftRecords = data.filter(d => d.gift_name === item.gift_name);
    
    // Find oldest record
    const oldestRecord = giftRecords.reduce((oldest, record) => {
      return new Date(record.recorded_at) < new Date(oldest.recorded_at) ? record : oldest;
    }, item);
    
    const available_periods: string[] = [];
    
    // Helper function to find closest record to a target date
    const findClosestRecord = (targetTime: number) => {
      return giftRecords
        .filter(r => new Date(r.recorded_at).getTime() <= targetTime)
        .sort((a, b) => 
          Math.abs(new Date(a.recorded_at).getTime() - targetTime) - 
          Math.abs(new Date(b.recorded_at).getTime() - targetTime)
        )[0];
    };
    
    // Helper function to calculate change
    const calculateChange = (oldPrice: number) => {
      if (oldPrice > 0) {
        return ((currentPrice - oldPrice) / oldPrice) * 100;
      }
      return 0;
    };
    
    // 24h change
    let change_24h = 0;
    const dayAgo = currentTime - 24 * 60 * 60 * 1000;
    const record24h = findClosestRecord(dayAgo);
    if (record24h && new Date(record24h.recorded_at).getTime() <= dayAgo) {
      change_24h = calculateChange(record24h.black_price);
      available_periods.push('24h');
    }
    
    // 1 week change
    let change_1w = 0;
    const weekAgo = currentTime - 7 * 24 * 60 * 60 * 1000;
    const record1w = findClosestRecord(weekAgo);
    if (record1w && new Date(record1w.recorded_at).getTime() <= weekAgo) {
      change_1w = calculateChange(record1w.black_price);
      available_periods.push('1w');
    }
    
    // 1 month change
    let change_1m = 0;
    const monthAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
    const record1m = findClosestRecord(monthAgo);
    if (record1m && new Date(record1m.recorded_at).getTime() <= monthAgo) {
      change_1m = calculateChange(record1m.black_price);
      available_periods.push('1m');
    }
    
    // 3 months change
    let change_3m = 0;
    const threeMonthsAgo = currentTime - 90 * 24 * 60 * 60 * 1000;
    const record3m = findClosestRecord(threeMonthsAgo);
    if (record3m && new Date(record3m.recorded_at).getTime() <= threeMonthsAgo) {
      change_3m = calculateChange(record3m.black_price);
      available_periods.push('3m');
    }
    
    // 1 year change
    let change_1y = 0;
    const yearAgo = currentTime - 365 * 24 * 60 * 60 * 1000;
    const record1y = findClosestRecord(yearAgo);
    if (record1y && new Date(record1y.recorded_at).getTime() <= yearAgo) {
      change_1y = calculateChange(record1y.black_price);
      available_periods.push('1y');
    }
    
    return {
      ...item,
      change_24h_ton_percent: change_24h,
      change_1w_ton_percent: change_1w,
      change_1m_ton_percent: change_1m,
      change_3m_ton_percent: change_3m,
      change_1y_ton_percent: change_1y,
      oldest_available_date: oldestRecord.recorded_at,
      available_periods,
    };
  });
  
  // Cache the data
  setCachedData('black-floor-data', dataWithChange);
  
  return dataWithChange;
};

// Custom hook for black floor data with caching
export const useBlackFloorData = () => {
  return useQuery({
    queryKey: ['black-floor-data'],
    queryFn: fetchBlackFloorData,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    initialData: () => getCachedData('black-floor-data'),
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
