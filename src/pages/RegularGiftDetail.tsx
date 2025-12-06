import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Send, Gift } from 'lucide-react';
import { toast } from 'sonner';
import TonIcon from '@/components/TonIcon';
import { getAuthHeaders } from '@/lib/telegramAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface RegularGiftData {
  gift_id: string;
  gift_name: string;
  image_url: string;
  price_ton: number;
  price_usd: number;
  price_stars: number;
  change_24h: number;
  tonPrice24hAgo?: number;
  usdPrice24hAgo?: number;
  tonPriceWeekAgo?: number;
  usdPriceWeekAgo?: number;
  tonPriceMonthAgo?: number;
  usdPriceMonthAgo?: number;
  price_history?: PriceHistoryData[];
  multiplier: string;
  supply: number;
  supply_text: string;
  value: string;
  match_confidence: number;
  last_updated: string;
}

interface PriceHistoryData {
  price_ton: number;
  price_usd: number;
  recorded_at: string;
}

interface PriceChanges {
  daily: { change_ton_percent: number; old_price_ton: number } | null;
  weekly: { change_ton_percent: number; old_price_ton: number } | null;
  monthly: { change_ton_percent: number; old_price_ton: number } | null;
  three_months: { change_ton_percent: number; old_price_ton: number } | null;
  yearly: { change_ton_percent: number; old_price_ton: number } | null;
}

type ChartPeriod = 'daily' | 'weekly' | 'monthly';

// Helper function for rounded rectangles in canvas
const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const RegularGiftDetail: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [giftData, setGiftData] = useState<RegularGiftData | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryData[]>([]);
  const [priceChanges, setPriceChanges] = useState<PriceChanges | null>(null);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('weekly');
  const [historyLoading, setHistoryLoading] = useState(false);
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
      confidence: 'دقة المطابقة',
      firstPrice: 'السعر الأول',
      gifts: 'الهدايا',
      daily: 'يومي',
      weekly: 'أسبوعي',
      monthly: 'شهري',
      priceChart: 'الرسم البياني',
      noHistory: 'لا يوجد تاريخ أسعار'
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
      confidence: 'Match Confidence',
      firstPrice: 'First Price',
      gifts: 'Gifts',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      priceChart: 'Price Chart',
      noHistory: 'No price history'
    }
  };

  const text = t[language] || t.en;

  // Fetch price history for chart
  const fetchPriceHistory = useCallback(async (giftId: string) => {
    try {
      setHistoryLoading(true);
      const response = await fetch(`https://www.channelsseller.site/api/unupgraded-price-history/${giftId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.price_history) {
          setPriceHistory(result.price_history);
          setPriceChanges(result.changes);
        }
      }
    } catch (error) {
      console.error('Failed to fetch price history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

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
        
        // Use price_history from response if available, otherwise fetch separately
        if (result.data.price_history && result.data.price_history.length > 0) {
          setPriceHistory(result.data.price_history);
          // Calculate changes from historical prices
          if (result.data.tonPrice24hAgo || result.data.tonPriceWeekAgo || result.data.tonPriceMonthAgo) {
            const currentTon = result.data.price_ton;
            const changes: PriceChanges = {
              daily: result.data.tonPrice24hAgo && result.data.tonPrice24hAgo !== currentTon ? {
                change_ton_percent: ((currentTon - result.data.tonPrice24hAgo) / result.data.tonPrice24hAgo) * 100,
                old_price_ton: result.data.tonPrice24hAgo
              } : null,
              weekly: result.data.tonPriceWeekAgo && result.data.tonPriceWeekAgo !== currentTon ? {
                change_ton_percent: ((currentTon - result.data.tonPriceWeekAgo) / result.data.tonPriceWeekAgo) * 100,
                old_price_ton: result.data.tonPriceWeekAgo
              } : null,
              monthly: result.data.tonPriceMonthAgo && result.data.tonPriceMonthAgo !== currentTon ? {
                change_ton_percent: ((currentTon - result.data.tonPriceMonthAgo) / result.data.tonPriceMonthAgo) * 100,
                old_price_ton: result.data.tonPriceMonthAgo
              } : null,
              three_months: null,
              yearly: null
            };
            setPriceChanges(changes);
          }
        } else if (result.data.gift_id) {
          // Fallback: fetch price history separately
          fetchPriceHistory(result.data.gift_id);
        }
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
  }, [navigate, text.notFound, fetchPriceHistory]);

  useEffect(() => {
    if (name) {
      fetchGiftData(decodeURIComponent(name));
    }
  }, [name, fetchGiftData]);

  // Filter chart data based on period
  const getChartData = useCallback(() => {
    if (!priceHistory.length) return [];
    
    const now = new Date();
    let filterDate: Date;
    
    switch (chartPeriod) {
      case 'daily':
        filterDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    return priceHistory
      .filter(item => new Date(item.recorded_at) >= filterDate)
      .reverse()
      .map(item => ({
        ...item,
        date: new Date(item.recorded_at).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: chartPeriod === 'daily' ? '2-digit' : undefined
        })
      }));
  }, [priceHistory, chartPeriod]);

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

  // Create professional canvas image - Nova style
  const createGiftCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!giftData || !giftImageRef.current) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Canvas size
    const width = 400;
    const height = 280;
    canvas.width = width;
    canvas.height = height;

    // Background gradient - blue theme
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a1628');
    gradient.addColorStop(0.5, '#0d1f3c');
    gradient.addColorStop(1, '#0a1628');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Main card background
    ctx.fillStyle = 'rgba(26, 58, 92, 0.6)';
    roundRect(ctx, 15, 15, width - 30, height - 30, 20);
    ctx.fill();

    // Draw gift image (right side)
    const img = giftImageRef.current;
    const imgSize = 100;
    const imgX = width - imgSize - 35;
    const imgY = 40;
    
    ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
    ctx.shadowBlur = 20;
    ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
    ctx.shadowBlur = 0;

    // Small icon (left side)
    ctx.drawImage(img, 30, 35, 40, 40);

    // Gift name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(giftData.gift_name, 80, 62);

    // TON Price
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillText(`◈ ${formatNumber(giftData.price_ton)}`, 30, 110);

    // Change badge
    const isPositive = giftData.change_24h >= 0;
    ctx.fillStyle = isPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    roundRect(ctx, 30, 120, 80, 24, 12);
    ctx.fill();
    ctx.fillStyle = isPositive ? '#22c55e' : '#ef4444';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText(`${isPositive ? '▲' : '▼'} ${Math.abs(giftData.change_24h).toFixed(1)}%`, 45, 137);

    // Bottom stats
    const statsY = 200;
    
    // First Price
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    roundRect(ctx, 30, statsY - 5, 100, 50, 8);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Arial, sans-serif';
    ctx.fillText(language === 'ar' ? 'السعر الأول:' : 'First Price:', 40, statsY + 12);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText(`⭐ ${giftData.price_stars?.toLocaleString() || '—'}`, 40, statsY + 32);

    // Gifts count
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    roundRect(ctx, 145, statsY - 5, 100, 50, 8);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Arial, sans-serif';
    ctx.fillText(language === 'ar' ? 'الهدايا' : 'Gifts', 155, statsY + 12);
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 14px Arial, sans-serif';
    const supplyText = giftData.supply_text || formatSupply(giftData.supply);
    ctx.fillText(`🎁 ${supplyText}`, 155, statsY + 32);

    // Footer - Nova branding
    ctx.fillStyle = '#64748b80';
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
  const chartData = getChartData();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a1628]/90 backdrop-blur-lg">
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-blue-500/10 text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Main Card - Like the image design */}
        <Card className="overflow-hidden bg-gradient-to-br from-[#1a3a5c]/80 to-[#0d2847]/80 border-blue-500/20 rounded-3xl backdrop-blur-xl">
          <div className="p-5">
            {/* Top Section: Gift Info + Image */}
            <div className="flex items-start justify-between gap-4">
              {/* Left: Gift Info */}
              <div className="flex-1">
                {/* Gift Name with Icon */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-blue-500/20 flex-shrink-0">
                    <img
                      src={giftData.image_url}
                      alt={giftData.gift_name}
                      className="w-full h-full object-cover"
                      onLoad={() => setImageLoaded(true)}
                    />
                  </div>
                  <h1 className="text-xl font-bold text-white">{giftData.gift_name}</h1>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2 mb-2">
                  <TonIcon className="w-6 h-6 text-blue-400" />
                  <span className="text-3xl font-bold text-white">{formatNumber(giftData.price_ton)}</span>
                </div>

                {/* Change Badge */}
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                  isPositive 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {isPositive ? '+' : ''}{giftData.change_24h.toFixed(1)}%
                </div>
              </div>

              {/* Right: Large Gift Image */}
              <div className="w-32 h-32 flex-shrink-0">
                {!imageLoaded && (
                  <div className="w-full h-full flex items-center justify-center bg-blue-500/10 rounded-2xl">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
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

            {/* Price Chart */}
            <div className="mt-4">
              {/* Period Selector */}
              <div className="flex items-center gap-2 mb-3">
                {(['daily', 'weekly', 'monthly'] as ChartPeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      chartPeriod === period
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'
                    }`}
                  >
                    {text[period]}
                  </button>
                ))}
              </div>

              {/* Chart */}
              {historyLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-32 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis hide domain={['dataMin', 'dataMax']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: number) => [`${formatNumber(value)} TON`, 'Price']}
                      />
                      <Area
                        type="monotone"
                        dataKey="price_ton"
                        stroke="#a855f7"
                        strokeWidth={2}
                        fill="url(#priceGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  {/* Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white/20 mb-1">◎</div>
                      <div className="text-sm font-bold text-white/20 tracking-wider">Nova Gifts</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-blue-400/60 text-sm">
                  {text.noHistory}
                </div>
              )}
            </div>

            {/* Bottom Stats */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-500/20">
              {/* First Price */}
              <div className="text-center">
                <div className="flex items-center gap-1 text-blue-300 text-xs mb-1">
                  <span className="px-2 py-0.5 bg-blue-500/20 rounded text-[10px] font-medium">{text.firstPrice}:</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 text-lg">⭐</span>
                  <span className="text-white font-bold">{giftData.price_stars?.toLocaleString() || '—'}</span>
                </div>
              </div>

              {/* Gifts Count */}
              <div className="text-center">
                <div className="text-blue-300 text-xs mb-1">{text.gifts}</div>
                <div className="flex items-center gap-1">
                  <Gift className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-bold">{giftData.supply_text || formatSupply(giftData.supply)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Nova Branding */}
        <div className="text-center py-2">
          <span className="text-blue-400/60 text-sm">@ Nova</span>
        </div>

        {/* Send to Telegram Button */}
        <Button
          onClick={handleSendToTelegram}
          disabled={sending || !userId}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white h-12 text-base font-semibold shadow-lg shadow-blue-500/20 rounded-xl"
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
