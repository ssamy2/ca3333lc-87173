import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Star, Send } from 'lucide-react';
import { toast } from 'sonner';
import TonIcon from '@/components/TonIcon';
import { getAuthHeaders } from '@/lib/telegramAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

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
  const { language } = useLanguage();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [giftData, setGiftData] = useState<RegularGiftData | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const giftImageRef = useRef<HTMLImageElement | null>(null);

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
      sendToTelegram: 'إرسال للخاص',
      sending: 'جاري الإرسال...',
      sent: 'تم الإرسال!',
      sendError: 'فشل الإرسال',
      loading: 'جاري التحميل...',
      notFound: 'الهدية غير موجودة',
      lastUpdated: 'آخر تحديث',
      confidence: 'دقة المطابقة'
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
      sendToTelegram: 'Send to DM',
      sending: 'Sending...',
      sent: 'Sent!',
      sendError: 'Failed to send',
      loading: 'Loading...',
      notFound: 'Gift not found',
      lastUpdated: 'Last Updated',
      confidence: 'Match Confidence'
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

  // Create professional canvas image
  const createGiftCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!giftData || !giftImageRef.current) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Canvas size - compact and professional
    const width = 400;
    const height = 320;
    canvas.width = width;
    canvas.height = height;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f0f23');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative border
    ctx.strokeStyle = '#f59e0b40';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // Inner glow effect
    const innerGlow = ctx.createRadialGradient(width/2, 100, 0, width/2, 100, 150);
    innerGlow.addColorStop(0, '#f59e0b15');
    innerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = innerGlow;
    ctx.fillRect(0, 0, width, height);

    // Draw gift image (centered, smaller)
    const img = giftImageRef.current;
    const imgSize = 100;
    const imgX = (width - imgSize) / 2;
    const imgY = 25;
    
    // Image shadow
    ctx.shadowColor = '#f59e0b40';
    ctx.shadowBlur = 20;
    ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
    ctx.shadowBlur = 0;

    // Gift name
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(giftData.gift_name, width / 2, 150);

    // "Regular Gift" badge
    ctx.fillStyle = '#f59e0b30';
    const badgeText = language === 'ar' ? 'هدية عادية' : 'Regular Gift';
    const badgeWidth = ctx.measureText(badgeText).width + 20;
    ctx.fillRect((width - badgeWidth) / 2, 158, badgeWidth, 22);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText(badgeText, width / 2, 173);

    // Price section - horizontal layout
    const priceY = 200;
    
    // TON Price
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${formatNumber(giftData.price_ton)} TON`, width / 2, priceY);

    // USD Price
    ctx.fillStyle = '#22c55e';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText(`$${formatNumber(giftData.price_usd)}`, width / 2, priceY + 25);

    // Stats row
    const statsY = 255;
    const isPositive = giftData.change_24h >= 0;
    
    // 24h Change
    ctx.fillStyle = isPositive ? '#22c55e' : '#ef4444';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.textAlign = 'left';
    const changeText = `${isPositive ? '▲' : '▼'} ${Math.abs(giftData.change_24h).toFixed(2)}%`;
    ctx.fillText(changeText, 30, statsY);

    // Stars
    ctx.fillStyle = '#eab308';
    ctx.textAlign = 'center';
    ctx.fillText(`⭐ ${giftData.price_stars.toLocaleString()}`, width / 2, statsY);

    // Supply
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    const supplyText = giftData.supply_text || formatSupply(giftData.supply);
    ctx.fillText(`📦 ${supplyText}`, width - 30, statsY);

    // Footer - Nova branding
    ctx.fillStyle = '#64748b50';
    ctx.fillRect(0, height - 35, width, 35);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Powered by Nova Calculator • @NovaGiftsBot', width / 2, height - 14);

    return canvas;
  }, [giftData, language, formatNumber, formatSupply]);

  // Send image to Telegram DM
  const handleSendToTelegram = async () => {
    if (!giftData || !userId) {
      toast.error(text.sendError);
      return;
    }

    setSending(true);
    
    try {
      // Wait for image to load if not already
      if (!giftImageRef.current) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            giftImageRef.current = img;
            resolve();
          };
          img.onerror = reject;
          img.src = giftData.image_url;
        });
      }

      const canvas = await createGiftCanvas();
      if (!canvas) {
        throw new Error('Failed to create canvas');
      }

      // Convert to base64
      const imageDataUrl = canvas.toDataURL('image/png');
      const base64Data = imageDataUrl.split(',')[1];

      // Send to API
      const authHeaders = await getAuthHeaders();
      const response = await fetch('https://www.channelsseller.site/api/send-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          id: userId,
          image: base64Data
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send');
      }

      toast.success(text.sent);
    } catch (error) {
      console.error('Send error:', error);
      toast.error(text.sendError);
    } finally {
      setSending(false);
    }
  };

  // Preload gift image when data is available
  useEffect(() => {
    if (giftData?.image_url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        giftImageRef.current = img;
      };
      img.src = giftData.image_url;
    }
  }, [giftData?.image_url]);

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

        {/* Send to Telegram Button */}
        <Button
          onClick={handleSendToTelegram}
          disabled={sending || !userId}
          className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white h-14 text-lg font-semibold shadow-lg shadow-amber-500/20"
        >
          {sending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {text.sending}
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              {text.sendToTelegram}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default RegularGiftDetail;
