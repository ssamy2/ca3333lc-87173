import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Calculator, RefreshCw, User, Gift, ArrowLeft } from 'lucide-react';
import NFTCard from '../components/NFTCard';
import RegularGiftCard from '../components/RegularGiftCard';
import VirtualizedNFTGrid from '../components/VirtualizedNFTGrid';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import TonIcon from '../components/TonIcon';
import StatsCard from '../components/StatsCard';
import { fetchNFTGifts, fetchSingleGiftPrice, fetchProfileImageAsBase64 } from '@/services/apiService';
import { proxyImageUrl } from '@/lib/imageProxy';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/i18n/translations';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  name: string;
  photo_base64: string | null;
}

interface NFTGift {
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
  number?: number;
  quantity_issued?: number;
  rarity_per_mille?: number;
}

interface RegularGift {
  name: string;
  price: number;
  image: string;
  count: number;
  total_value: number;
}

interface GiftData {
  success: boolean;
  data: {
    owner: string;
    name: string;
    profile_image: string;
    nfts: NFTGift[];
    regular_gifts: RegularGift[];
    total_nfts: number;
    total_upgraded: number;
    total_regular: number;
    total_value_ton: number;
    total_value_usd: number;
    upgraded_value_ton: number;
    upgraded_value_usd: number;
    regular_value_ton: number;
    regular_value_usd: number;
    visible_nfts: number;
  };
}

interface SingleGiftData {
  gift_name: string;
  gift_image: string;
  floor_price: number;
  avg_price: number;
  total_supply: number;
  gifts_in_circulation: number;
  estimated_value: number;
  model: string;
  rarity: string;
}

const UserGiftCalculatorPage: React.FC = () => {
  const { telegramUser } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // State Management
  const [searchMode, setSearchMode] = useState<'user' | 'gift'>('user');
  const [username, setUsername] = useState('');
  const [giftUrl, setGiftUrl] = useState('');
  const [currentUser, setCurrentUser] = useState<string>('');
  const [currentUserFullName, setCurrentUserFullName] = useState<string>('');
  const [currentUserPhotoUrl, setCurrentUserPhotoUrl] = useState<string>('');
  const [nftData, setNftData] = useState<GiftData | null>(null);
  const [singleGift, setSingleGift] = useState<SingleGiftData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchedUserProfile, setSearchedUserProfile] = useState<UserProfile | null>(null);

  // Initialize with Telegram user data
  useEffect(() => {
    if (telegramUser) {
      const detectedUsername = telegramUser.username || 'user';
      setCurrentUser(detectedUsername);
      setUsername(detectedUsername);
      
      const fullName = [telegramUser.first_name, telegramUser.last_name]
        .filter(Boolean)
        .join(' ') || 'User';
      setCurrentUserFullName(fullName);
      
      const photoUrl = (telegramUser as any).photo_url;
      if (photoUrl) {
        setCurrentUserPhotoUrl(photoUrl);
      }
    } else {
      setCurrentUser('demo_user');
      setUsername('demo_user');
      setCurrentUserFullName('Demo User');
    }

    // Load search history
    const history = localStorage.getItem('nft_search_history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Translations
  const t = (key: string) => {
    const translations = {
      heroTitle: language === 'ar' ? 'احسب قيمة هداياك بدقة الآن' : 'Calculate Your Gift Value Accurately Now',
      heroDescription: language === 'ar' ? 'اكتشف القيمة الحقيقية لهدايا Telegram الخاصة بك من خلال أداة التحليل المتقدمة لبيانات السوق في الوقت الفعلي' : 'Discover the true value of your Telegram gifts through our advanced real-time market data analysis tool',
      heroExample: language === 'ar' ? '💡 اختر هديتك ← شاهد الأسعار المباشرة ← اتخذ قرارات مستنيرة' : '💡 Select your gift → View live prices → Make informed decisions',
      enterUsername: language === 'ar' ? 'أدخل اسم المستخدم...' : 'Enter username...'
    };
    return translations[key as keyof typeof translations] || key;
  };

  // Save to search history
  const saveToHistory = (searchTerm: string) => {
    const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('nft_search_history', JSON.stringify(newHistory));
  };

  // Fetch NFT data for user
  const fetchNFTs = async (searchUsername: string) => {
    if (!searchUsername.trim()) return;

    setLoading(true);
    setError(null);
    setNftData(null);
    setSearchedUserProfile(null);

    try {
      const data = await fetchNFTGifts(searchUsername);

      if (data.success && data.data) {
        setNftData(data.data);
        
        // Fetch profile image
        let photoBase64: string | null = null;
        if (data.data.profile_image) {
          photoBase64 = await fetchProfileImageAsBase64(data.data.profile_image);
        }
        
        setSearchedUserProfile({
          name: data.data.name,
          photo_base64: photoBase64
        });
        saveToHistory(searchUsername);
        
        const giftCount = data.data.nfts?.length || data.data.visible_nfts || 0;
        toast({
          title: "Success!",
          description: `Found ${giftCount} NFT gifts for ${data.data.owner}`,
        });
      } else {
        setError('User not found or has no gifts');
      }
    } catch (err) {
      console.error('NFT fetch error:', err);
      setError('Failed to fetch user data. Please try again.');
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch single gift data
  const fetchGift = async () => {
    if (!giftUrl.trim()) {
      setError('Please enter a valid gift URL');
      return;
    }

    setLoading(true);
    setError(null);
    setSingleGift(null);
    setNftData(null);

    try {
      const result = await fetchSingleGiftPrice(giftUrl.trim());
      setSingleGift(result.data);
      toast({
        title: "Success!",
        description: `Found gift: ${result.data.gift_name}`,
      });
    } catch (err) {
      console.error('Gift fetch error:', err);
      if (err instanceof Error) {
        if (err.message === 'GIFT_NOT_FOUND') {
          setError('Gift not found. Please check the URL.');
        } else if (err.message === 'INVALID_GIFT_URL') {
          setError('Invalid gift URL. Please use a valid t.me/nft/ link.');
        } else {
          setError('Failed to fetch gift data. Please try again.');
        }
      }
      toast({
        title: "Error",
        description: "Failed to fetch gift data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    if (searchMode === 'user') {
      fetchNFTs(username);
    } else {
      fetchGift();
    }
  };

  // Sort NFTs by value
  const sortedNFTs = useMemo(() => {
    if (!nftData?.nfts || !Array.isArray(nftData.nfts)) return [];
    
    return [...nftData.nfts].sort((a, b) => {
      const priceA = a.floor_price * a.count;
      const priceB = b.floor_price * b.count;
      
      if (priceA === 0 && priceB !== 0) return 1;
      if (priceA !== 0 && priceB === 0) return -1;
      if (priceA === 0 && priceB === 0) return 0;
      
      return priceB - priceA;
    });
  }, [nftData?.nfts]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 p-4 max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/tools')}
            className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {language === 'ar' ? 'حاسبة هدايا المستخدم' : 'User Gift Calculator'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'احسب قيمة هدايا أي مستخدم' : "Calculate any user's gift value"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Hero Section */}
        {!nftData && !singleGift && !loading && !error && (
          <section className="telegram-card p-5 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            
            <div className="relative flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold text-foreground">
                {t('heroTitle')}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              {t('heroDescription')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('heroExample')}
            </p>
          </section>
        )}

        {/* Search Section */}
        <div className="telegram-card p-5">
          {/* Search Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={searchMode === 'user' ? 'default' : 'outline'}
              onClick={() => setSearchMode('user')}
              className="flex-1"
            >
              <User className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'بحث مستخدم' : 'User Search'}
            </Button>
            <Button
              variant={searchMode === 'gift' ? 'default' : 'outline'}
              onClick={() => setSearchMode('gift')}
              className="flex-1"
            >
              <Gift className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'بحث هدية' : 'Gift Search'}
            </Button>
          </div>

          {/* Search Input */}
          <div className="flex gap-2 mb-4">
            {searchMode === 'user' ? (
              <Input
                type="text"
                placeholder={currentUser ? `@${currentUser}` : t('enterUsername')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
            ) : (
              <Input
                type="text"
                placeholder={language === 'ar' ? 'أدخل رابط الهدية...' : 'Enter gift URL...'}
                value={giftUrl}
                onChange={(e) => setGiftUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
            )}
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && searchMode === 'user' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? 'البحث السابق:' : 'Recent Searches:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((term) => (
                  <Button
                    key={term}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUsername(term);
                      fetchNFTs(term);
                    }}
                    className="text-xs"
                  >
                    @{term}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && <LoadingState />}

        {/* Error State */}
        {error && <ErrorState error={error} onRetry={handleSearch} />}

        {/* Single Gift Result */}
        {singleGift && (
          <div className="space-y-4">
            <StatsCard
              title={singleGift.gift_name}
              value={singleGift.floor_price}
              change={0}
              icon={Gift}
              image={singleGift.gift_image}
            />
            <RegularGiftCard gift={singleGift} isDark={isDark} />
          </div>
        )}

        {/* NFT Collection Result */}
        {nftData && (
          <div className="space-y-4">
            {/* User Profile Card */}
            {searchedUserProfile && (
              <div className="telegram-card p-4 flex items-center gap-4">
                {searchedUserProfile.photo_base64 ? (
                  <img
                    src={`data:image/jpeg;base64,${searchedUserProfile.photo_base64}`}
                    alt={searchedUserProfile.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-semibold">{searchedUserProfile.name}</h2>
                  <p className="text-sm text-muted-foreground">@{nftData.owner}</p>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard
                title={language === 'ar' ? 'إجمالي القيمة' : 'Total Value'}
                value={nftData.total_value_ton}
                change={0}
                icon={Calculator}
              />
              <StatsCard
                title={language === 'ar' ? 'الهدايا المطورة' : 'Upgraded Gifts'}
                value={nftData.upgraded_value_ton}
                change={0}
                icon={Gift}
              />
              <StatsCard
                title={language === 'ar' ? 'الهدايا العادية' : 'Regular Gifts'}
                value={nftData.regular_value_ton}
                change={0}
                icon={Gift}
              />
            </div>

            {/* NFTs Grid */}
            {sortedNFTs.length > 0 && (
              <div className="telegram-card p-5">
                <h3 className="text-lg font-semibold mb-4">
                  {language === 'ar' ? 'قائمة الهدايا' : 'Gift Collection'}
                </h3>
                {sortedNFTs.length > 20 ? (
                  <VirtualizedNFTGrid nfts={sortedNFTs} isDark={isDark} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedNFTs.map((nft) => (
                      <NFTCard key={`${nft.model}-${nft.number}`} nft={nft} isDark={isDark} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserGiftCalculatorPage;
