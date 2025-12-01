import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Star, Share2, Download, Send } from 'lucide-react';
import { toast } from 'sonner';
import TonIcon from '@/components/TonIcon';
import { getAuthHeaders } from '@/lib/telegramAuth';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/contexts/LanguageContext';

interface RegularGiftData {
  gift_id: string;
  gift_name: string;
  image_url: string;
  price_ton: number;
  price_usd: number;
  price_stars: number;
  change_24h: number;
  multiplier: string;
  supply: number;
  supply_text: string;
  value: string;
  match_confidence: number;
  last_updated: string;
}

const RegularGiftDetail: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { isLight } = useTheme();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [giftData, setGiftData] = useState<RegularGiftData | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedGifts, setSelectedGifts] = useState<string[]>([]);

  const t = {
    ar: {
      back: 'رجوع',
      regularGift: 'هدية عادية',
      notUpgraded: 'غير مطورة',
      price: 'السعر',
      change24h: 'التغير 24س',
      supply: 'الكمية',
      multiplier: 'المضاعف',
      stars: 'نجوم',
      shareToTelegram: 'مشاركة عبر تيليجرام',
      saveImage: 'حفظ الصورة',
      loading: 'جاري التحميل...',
      notFound: 'الهدية غير موجودة',
      lastUpdated: 'آخر تحديث',
      confidence: 'دقة المطابقة',
      selectToShare: 'اختر هدايا للمشاركة',
      selected: 'مختارة',
      shareSelected: 'مشاركة المختارة'
    },
    en: {
      back: 'Back',
      regularGift: 'Regular Gift',
      notUpgraded: 'Not Upgraded',
      price: 'Price',
      change24h: '24h Change',
      supply: 'Supply',
      multiplier: 'Multiplier',
      stars: 'Stars',
      shareToTelegram: 'Share to Telegram',
      saveImage: 'Save Image',
      loading: 'Loading...',
      notFound: 'Gift not found',
      lastUpdated: 'Last Updated',
      confidence: 'Match Confidence',
      selectToShare: 'Select gifts to share',
      selected: 'selected',
      shareSelected: 'Share Selected'
    }
  };

  const text = t[language] || t.en;

  const fetchGiftData = useCallback(async (giftName: string) => {
    try {
      setLoading(true);
      const authHeaders = await getAuthHeaders();
      
      // Remove [Regular] prefix if present
      const cleanName = giftName.replace('[Regular] ', '').replace('%5BRegular%5D%20', '');
      
      const response = await fetch(`https://www.channelsseller.site/api/regular-gift/${encodeURIComponent(cleanName)}`, {
        headers: {
          'Accept': 'application/json',
          ...authHeaders
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch gift data');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setGiftData(result.data);
      } else if (result.is_upgraded === true) {
        // Redirect to upgraded gift page
        navigate(`/gift/${encodeURIComponent(cleanName)}`, { replace: true });
        return;
      } else {
        toast.error(result.error || text.notFound);
      }
    } catch (error) {
      toast.error(text.notFound);
    } finally {
      setLoading(false);
    }
  }, [navigate, text.notFound]);

  useEffect(() => {
    if (name) {
      fetchGiftData(decodeURIComponent(name));
    }
  }, [name, fetchGiftData]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatSupply = (supply: number) => {
    if (supply >= 1000000) return `${(supply / 1000000).toFixed(1)}M`;
    if (supply >= 1000) return `${(supply / 1000).toFixed(0)}K`;
    return supply.toLocaleString();
  };

  const handleShareToTelegram = async () => {
    if (!giftData) return;
    
    const message = language === 'ar' 
      ? `🎁 ${giftData.gift_name}\n💰 السعر: ${formatNumber(giftData.price_ton)} TON ($${formatNumber(giftData.price_usd)})\n⭐ ${giftData.price_stars} نجمة\n📊 التغير: ${giftData.change_24h >= 0 ? '+' : ''}${giftData.change_24h.toFixed(2)}%\n📦 الكمية: ${giftData.supply_text || formatSupply(giftData.supply)}\n\n🔗 via @NovaGiftsBot`
      : `🎁 ${giftData.gift_name}\n💰 Price: ${formatNumber(giftData.price_ton)} TON ($${formatNumber(giftData.price_usd)})\n⭐ ${giftData.price_stars} Stars\n📊 Change: ${giftData.change_24h >= 0 ? '+' : ''}${giftData.change_24h.toFixed(2)}%\n📦 Supply: ${giftData.supply_text || formatSupply(giftData.supply)}\n\n🔗 via @NovaGiftsBot`;
    
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(giftData.image_url)}&text=${encodeURIComponent(message)}`;
    
    if (window.Telegram?.WebApp) {
      (window.Telegram.WebApp as any).openTelegramLink?.(telegramUrl) || window.open(telegramUrl, '_blank');
    } else {
      window.open(telegramUrl, '_blank');
    }
  };

  const handleSaveImage = async () => {
    if (!giftData) return;
    
    try {
      const response = await fetch(giftData.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${giftData.gift_name}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(language === 'ar' ? 'تم حفظ الصورة' : 'Image saved');
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل حفظ الصورة' : 'Failed to save image');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
          <p className="text-muted-foreground">{text.loading}</p>
        </div>
      </div>
    );
  }

  if (!giftData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-muted-foreground">{text.notFound}</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {text.back}
        </Button>
      </div>
    );
  }

  const isPositive = giftData.change_24h >= 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-amber-500/20">
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-amber-500/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm font-medium px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
              {text.notUpgraded}
            </span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Gift Image & Name */}
        <Card className="overflow-hidden bg-gradient-to-br from-amber-950/30 to-amber-900/10 border-amber-500/20">
          <div className="relative">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-600/10" />
            
            {/* Image Container */}
            <div className="relative flex justify-center py-8">
              <div className="relative w-48 h-48">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-amber-500/5 rounded-2xl">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  </div>
                )}
                <img
                  src={giftData.image_url}
                  alt={giftData.gift_name}
                  className={`w-full h-full object-contain drop-shadow-2xl transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                />
              </div>
            </div>

            {/* Gift Name */}
            <div className="text-center pb-6 px-4">
              <h1 className="text-2xl font-bold text-amber-100 mb-2">{giftData.gift_name}</h1>
              <p className="text-amber-400/60 text-sm">{text.regularGift}</p>
            </div>
          </div>
        </Card>

        {/* Price Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* TON Price */}
          <Card className="p-4 bg-gradient-to-br from-amber-950/20 to-amber-900/10 border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TonIcon className="w-5 h-5 text-amber-500" />
              <span className="text-amber-400/60 text-sm">TON</span>
            </div>
            <p className="text-2xl font-bold text-amber-100">{formatNumber(giftData.price_ton)}</p>
          </Card>

          {/* USD Price */}
          <Card className="p-4 bg-gradient-to-br from-green-950/20 to-green-900/10 border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-500 text-lg">$</span>
              <span className="text-green-400/60 text-sm">USD</span>
            </div>
            <p className="text-2xl font-bold text-green-100">{formatNumber(giftData.price_usd)}</p>
          </Card>

          {/* Stars */}
          <Card className="p-4 bg-gradient-to-br from-yellow-950/20 to-yellow-900/10 border-yellow-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="text-yellow-400/60 text-sm">{text.stars}</span>
            </div>
            <p className="text-2xl font-bold text-yellow-100">{giftData.price_stars.toLocaleString()}</p>
          </Card>

          {/* 24h Change */}
          <Card className={`p-4 bg-gradient-to-br ${isPositive ? 'from-green-950/20 to-green-900/10 border-green-500/20' : 'from-red-950/20 to-red-900/10 border-red-500/20'}`}>
            <div className="flex items-center gap-2 mb-2">
              {isPositive ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <span className={`text-sm ${isPositive ? 'text-green-400/60' : 'text-red-400/60'}`}>{text.change24h}</span>
            </div>
            <p className={`text-2xl font-bold ${isPositive ? 'text-green-100' : 'text-red-100'}`}>
              {isPositive ? '+' : ''}{giftData.change_24h.toFixed(2)}%
            </p>
          </Card>
        </div>

        {/* Additional Info */}
        <Card className="p-4 bg-gradient-to-br from-amber-950/20 to-amber-900/10 border-amber-500/20 space-y-4">
          {/* Supply */}
          <div className="flex items-center justify-between">
            <span className="text-amber-400/60">{text.supply}</span>
            <span className="text-amber-100 font-semibold">
              {giftData.supply_text || formatSupply(giftData.supply)}
            </span>
          </div>

          {/* Multiplier */}
          {giftData.multiplier && (
            <div className="flex items-center justify-between">
              <span className="text-amber-400/60">{text.multiplier}</span>
              <span className="text-green-400 font-semibold">{giftData.multiplier}</span>
            </div>
          )}

          {/* Confidence */}
          {giftData.match_confidence > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-amber-400/60">{text.confidence}</span>
              <span className="text-amber-100 font-semibold">{giftData.match_confidence.toFixed(1)}%</span>
            </div>
          )}

          {/* Last Updated */}
          {giftData.last_updated && (
            <div className="flex items-center justify-between">
              <span className="text-amber-400/60">{text.lastUpdated}</span>
              <span className="text-amber-100/60 text-sm">
                {new Date(giftData.last_updated).toLocaleDateString()}
              </span>
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleShareToTelegram}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white h-12"
          >
            <Send className="w-5 h-5 mr-2" />
            {text.shareToTelegram}
          </Button>
          
          <Button
            onClick={handleSaveImage}
            variant="outline"
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 h-12"
          >
            <Download className="w-5 h-5 mr-2" />
            {text.saveImage}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegularGiftDetail;
