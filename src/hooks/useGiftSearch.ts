import { useState, useCallback } from 'react';
import { fetchSingleGiftPrice } from '@/services/apiService';

export interface SingleGift {
  gift_name: string;
  model?: string;
  backdrop?: string;
  rarity?: number;
  backdrop_rarity?: number;
  price_ton: number;
  price_usd: number;
  image: string;
  image_url?: string;
  link?: string;
}

export const useGiftSearch = () => {
  const [gift, setGift] = useState<SingleGift | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchGift = useCallback(async (giftUrl: string) => {
    if (!giftUrl.trim()) {
      setError('Please enter a valid gift URL');
      return { success: false, error: 'Invalid URL' };
    }

    setLoading(true);
    setError(null);
    setGift(null);

    try {
      const result = await fetchSingleGiftPrice(giftUrl.trim());
      setGift(result.data);
      return { success: true, data: result.data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch gift data';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearGift = useCallback(() => {
    setGift(null);
    setError(null);
  }, []);

  return {
    gift,
    loading,
    error,
    searchGift,
    clearGift
  };
};
