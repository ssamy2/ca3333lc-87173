import { useState, useCallback } from 'react';
import { fetchNFTGifts, fetchUserProfile } from '@/services/apiService';

export interface NFTGift {
  count: number;
  name: string;
  model: string;
  floor_price: number;
  avg_price: number;
  image?: string;
  title?: string;
  backdrop?: string;
  backdrop_rarity?: string;
  symbol?: string;
  symbol_rarity?: string;
  model_rarity?: string;
  quantity_issued?: number;
  quantity_total?: number;
  quantity_raw?: string;
  description?: string;
  tg_deeplink?: string;
  details: {
    links: string[];
  };
}

export interface NFTData {
  owner: string;
  visible_nfts?: number;
  total_saved_gifts?: number;
  prices: {
    floor_price: { TON: number; USD: number; STAR: number };
    avg_price: { TON: number; USD: number; STAR: number };
  };
  nfts: NFTGift[];
}

export interface UserProfile {
  name: string;
  photo_base64: string | null;
}

export const useNFTSearch = () => {
  const [nftData, setNftData] = useState<NFTData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchNFTs = useCallback(async (username: string) => {
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    setNftData(null);
    setUserProfile(null);

    try {
      const [nftResponse, profileResponse] = await Promise.all([
        fetchNFTGifts(username),
        fetchUserProfile(username)
      ]);

      if (nftResponse.success && nftResponse.data) {
        setNftData(nftResponse.data);
        setUserProfile(profileResponse);
        return { success: true, data: nftResponse.data, profile: profileResponse };
      } else {
        const errorMsg = nftResponse.error || nftResponse.message || 'Failed to fetch NFT data';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setNftData(null);
    setUserProfile(null);
    setError(null);
  }, []);

  return {
    nftData,
    userProfile,
    loading,
    error,
    searchNFTs,
    clearResults
  };
};
