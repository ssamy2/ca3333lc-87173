import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Send } from 'lucide-react';
import { toast } from 'sonner';
import TonIcon from '@/components/TonIcon';
import { getAuthHeaders } from '@/lib/telegramAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid
} from 'recharts';

interface PriceChanges {
  '24h': { ton: number | null; usd: number | null };
  '7d': { ton: number | null; usd: number | null };
  '30d': { ton: number | null; usd: number | null };
}

interface HistoryItem {
  timestamp: string;
  price_ton: number;
  price_usd: number;
  'change_ton_%': number;
  'change_usd_%': number;
}

interface RegularGiftData {
  gift_id: string;
  gift_name: string;
  price_ton: number;
  price_usd: number;
  last_updated: string;
  image_url: string;
  is_unupgraded: boolean;
  changes: PriceChanges;
  history: {
    hourly_last_day: HistoryItem[];
    half_hourly_last_week: HistoryItem[];
  };
}

type TimeRange = '24h' | '7d' | '30d';

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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [giftData, setGiftData] = useState<RegularGiftData | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const giftImageRef = useRef<HTMLImageElement | null>(null);

  const t = {
    ar: {
      back: 'رجوع',
      regularGift: 'هدية عادية',
      notUpgraded: 'غير مطورة',
      price: 'السعر',
      sendToTelegram: 'إرسال للخاص',
      sending: 'جاري الإرسال...',
      sent: 'تم الإرسال!',
      sendError: 'فشل الإرسال',
      loading: 'جاري التحميل...',
      notFound: 'الهدية غير موجودة',
      noHistory: 'لا يوجد تاريخ أسعار'
    },
    en: {
      back: 'Back',
      regularGift: 'Regular Gift',
      notUpgraded: 'Not Upgraded',
      price: 'Price',
      sendToTelegram: 'Send to DM',
      sending: 'Sending...',
      sent: 'Sent!',
      sendError: 'Failed to send',
      loading: 'Loading...',
      notFound: 'Gift not found',
      noHistory: 'No price history'
    }
  };

  const text = t[language] || t.en;

  const fetchGiftData = useCallback(async (giftIdentifier: string) => {
    try {
      setLoading(true);
      const authHeaders = await getAuthHeaders();
      
      const isId = /^\d+$/.test(giftIdentifier);
      const cleanIdentifier = isId 
        ? giftIdentifier 
        : giftIdentifier.replace('[Regular] ', '').replace('%5BRegular%5D%20', '');
      
      const response = await fetch(`https://www.channelsseller.site/api/regular-gift/${encodeURIComponent(cleanIdentifier)}`, {
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
        navigate(`/gift/${encodeURIComponent(cleanIdentifier)}`, { replace: true });
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
    if (id) {
      fetchGiftData(decodeURIComponent(id));
    }
  }, [id, fetchGiftData]);

  // Get chart data based on time range
  const chartData = useMemo(() => {
    if (!giftData?.history) return [];
    
    let historyData: HistoryItem[] = [];
    
    if (timeRange === '24h') {
      historyData = giftData.history.hourly_last_day || [];
    } else if (timeRange === '7d') {
      historyData = giftData.history.half_hourly_last_week || [];
    } else {
      // For 30d, use weekly data if available, otherwise use 7d data
      historyData = giftData.history.half_hourly_last_week || [];
    }
    
    return historyData.map(item => ({
      timestamp: item.timestamp,
      price: item.price_ton,
      price_usd: item.price_usd,
      label: new Date(item.timestamp).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: timeRange === '24h' ? '2-digit' : undefined
      })
    }));
  }, [giftData?.history, timeRange]);
  
  const hasDataForRange = useMemo(() => {
    return chartData.length >= 2;
  }, [chartData]);
  
  // Get price change based on time range
  const priceChange = useMemo(() => {
    if (!giftData?.changes) return 0;
    
    const change = giftData.changes[timeRange]?.ton;
    return change ?? 0;
  }, [giftData?.changes, timeRange]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  // Create professional canvas image
  const createGiftCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!giftData || !giftImageRef.current) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const width = 400;
    const height = 280;
    canvas.width = width;
    canvas.height = height;

    // Background gradient
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

    // Draw gift image
    const img = giftImageRef.current;
    const imgSize = 80;
    const imgX = width - imgSize - 35;
    const imgY = 35;
    
    ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
    ctx.shadowBlur = 15;
    ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
    ctx.shadowBlur = 0;

    // Small icon
    ctx.drawImage(img, 30, 30, 36, 36);

    // Gift name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(giftData.gift_name, 75, 55);

    // TON Price
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillText(`◈ ${formatNumber(giftData.price_ton)}`, 30, 100);

    // Change badge
    const changeValue = priceChange;
    const isPos = changeValue >= 0;
    ctx.fillStyle = isPos ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
    roundRect(ctx, 30, 112, 85, 26, 13);
    ctx.fill();
    ctx.fillStyle = isPos ? '#10b981' : '#ef4444';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText(`${isPos ? '▲' : '▼'} ${Math.abs(changeValue).toFixed(1)}%`, 48, 130);

    // Draw mini chart area
    const chartX = 30;
    const chartY = 150;
    const chartW = width - 60;
    const chartH = 80;
    
    ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
    roundRect(ctx, chartX, chartY, chartW, chartH, 10);
    ctx.fill();
    
    if (chartData.length >= 2) {
      const prices = chartData.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice || 1;
      
      const chartColor = isPos ? '#10b981' : '#ef4444';
      
      const gradientFill = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
      gradientFill.addColorStop(0, isPos ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)');
      gradientFill.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.beginPath();
      ctx.moveTo(chartX + 10, chartY + chartH - 10);
      
      chartData.forEach((point, i) => {
        const x = chartX + 10 + (i / (chartData.length - 1)) * (chartW - 20);
        const y = chartY + chartH - 10 - ((point.price - minPrice) / priceRange) * (chartH - 20);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      
      ctx.lineTo(chartX + chartW - 10, chartY + chartH - 10);
      ctx.lineTo(chartX + 10, chartY + chartH - 10);
      ctx.closePath();
      ctx.fillStyle = gradientFill;
      ctx.fill();
      
      ctx.beginPath();
      chartData.forEach((point, i) => {
        const x = chartX + 10 + (i / (chartData.length - 1)) * (chartW - 20);
        const y = chartY + chartH - 10 - ((point.price - minPrice) / priceRange) * (chartH - 20);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = chartColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    
    // Watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◎ Nova Gifts', chartX + chartW / 2, chartY + chartH / 2 + 8);

    // Footer
    ctx.fillStyle = '#94a3b880';
    ctx.font = '10px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('@NovaGiftsBot', width / 2, height - 12);

    return canvas;
  }, [giftData, chartData, priceChange]);

  const handleSendToTelegram = async () => {
    if (!giftData || !userId) {
      toast.error(text.sendError);
      return;
    }

    setSending(true);
    
    try {
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

      const imageDataUrl = canvas.toDataURL('image/png');
      const base64Data = imageDataUrl.split(',')[1];

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

  const isPositive = priceChange >= 0;
  const chartColor = isPositive ? '#10b981' : '#ef4444';

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
        {/* Main Card */}
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

                {/* USD Price */}
                <div className="text-white/60 text-sm mb-2">
                  ${formatNumber(giftData.price_usd)}
                </div>

                {/* Change Badge */}
                <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${
                  isPositive 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {isPositive ? '+' : ''}{priceChange.toFixed(1)}%
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
            <div className="mt-6">
              {/* Time Range Selector */}
              <div className="flex items-center gap-2 mb-4">
                {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      timeRange === range
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {/* Chart */}
              {hasDataForRange ? (
                <div className="h-[200px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPriceRegular" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="label" 
                        stroke="rgba(255,255,255,0.3)"
                        tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                        interval="preserveStartEnd"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.3)"
                        tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
                        domain={['auto', 'auto']}
                        axisLine={false}
                        tickLine={false}
                        orientation="right"
                        width={35}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(10, 15, 26, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: number) => [`${formatNumber(value)} TON`, 'Price']}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={chartColor}
                        strokeWidth={2}
                        fill="url(#colorPriceRegular)"
                        connectNulls
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  {/* Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white mb-1">◎</div>
                      <div className="text-lg font-bold text-white tracking-wider">Nova Gifts</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-white/30 text-sm mb-2">{text.noHistory}</div>
                    <div className="text-white/20 text-xs">
                      {language === 'ar' ? 'لا توجد بيانات كافية لهذه الفترة' : 'Not enough data for this period'}
                    </div>
                  </div>
                </div>
              )}
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
