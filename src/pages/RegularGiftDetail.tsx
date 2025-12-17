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
    six_hourly_last_month: HistoryItem[];
  };
}

type TimeRange = '24h' | '7d' | '30d';
type Currency = 'usd' | 'ton';

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
  const [currency, setCurrency] = useState<Currency>('usd'); // USD as default for unupgraded
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

  // Get chart data based on time range and currency
  const chartData = useMemo(() => {
    if (!giftData?.history) return [];
    
    let historyData: HistoryItem[] = [];
    
    if (timeRange === '24h') {
      historyData = giftData.history.hourly_last_day || [];
    } else if (timeRange === '7d') {
      historyData = giftData.history.half_hourly_last_week || [];
    } else {
      historyData = giftData.history.six_hourly_last_month || [];
    }
    
    return historyData.map(item => ({
      timestamp: item.timestamp,
      price: currency === 'usd' ? item.price_usd : item.price_ton,
      price_ton: item.price_ton,
      price_usd: item.price_usd,
      label: new Date(item.timestamp).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: timeRange === '24h' ? '2-digit' : undefined
      })
    }));
  }, [giftData?.history, timeRange, currency]);
  
  const hasDataForRange = useMemo(() => {
    return chartData.length >= 2;
  }, [chartData]);
  
  // Get price change based on time range and currency
  const priceChange = useMemo(() => {
    if (!giftData?.changes) return 0;
    
    const change = currency === 'usd' 
      ? giftData.changes[timeRange]?.usd 
      : giftData.changes[timeRange]?.ton;
    return change ?? 0;
  }, [giftData?.changes, timeRange, currency]);

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

    // USD Price (Primary for unupgraded)
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillText(`$${formatNumber(giftData.price_usd)}`, 30, 100);

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

    // Footer - Changed to @NovaChartBot
    ctx.fillStyle = '#94a3b880';
    ctx.font = '10px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('@NovaChartBot', width / 2, height - 12);

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
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
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
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-4">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {text.back}
          </Button>
          <div className="text-xs text-muted-foreground">
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' })}
          </div>
        </div>

        {/* Gift Header Card - Matching GiftDetail design */}
        <Card className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left Side: Image, Name */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={giftData.image_url}
                  alt={giftData.gift_name}
                  className="w-full h-full object-cover"
                  onLoad={() => setImageLoaded(true)}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground mb-0.5">{giftData.gift_name}</h1>
                <p className="text-sm text-muted-foreground">{text.notUpgraded}</p>
              </div>
            </div>

            {/* Right Side: Price, Change */}
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5 text-2xl font-bold text-foreground mb-0.5">
                {currency === 'usd' ? (
                  <>$ {formatNumber(giftData.price_usd)}</>
                ) : (
                  <>
                    <TonIcon className="w-5 h-5" />
                    {formatNumber(giftData.price_ton)}
                  </>
                )}
              </div>
              <div className={`text-base font-semibold flex items-center justify-end gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </div>
            </div>
          </div>
        </Card>

        {/* Chart Card */}
        <Card className="p-3 bg-card/50 backdrop-blur relative">
          <div className="relative">
            {hasDataForRange ? (
              <ResponsiveContainer width="100%" height={250}>
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
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10, 15, 26, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: number) => [
                      currency === 'usd' ? `$${formatNumber(value)}` : `${formatNumber(value)} TON`, 
                      'Price'
                    ]}
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
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-muted-foreground text-sm mb-2">{text.noHistory}</div>
                  <div className="text-muted-foreground/60 text-xs">
                    {language === 'ar' ? 'لا توجد بيانات كافية لهذه الفترة' : 'Not enough data for this period'}
                  </div>
                </div>
              </div>
            )}
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-lg font-bold text-white/15 tracking-wider">@NovaChartBot</div>
            </div>
          </div>
        </Card>

        {/* Currency Toggle */}
        <div className="flex rounded-xl bg-muted/50 p-1 gap-1 shadow-lg w-full">
          <Button
            onClick={() => setCurrency('usd')}
            variant="ghost"
            size="sm"
            className={`flex-1 h-10 gap-2 rounded-lg font-semibold text-xs uppercase transition-all ${
              currency === 'usd' 
                ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 scale-105' 
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <span className="text-sm font-bold">$</span>
            <span>USD</span>
          </Button>
          <Button
            onClick={() => setCurrency('ton')}
            variant="ghost"
            size="sm"
            className={`flex-1 h-10 gap-2 rounded-lg font-semibold text-xs uppercase transition-all ${
              currency === 'ton' 
                ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 scale-105' 
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <TonIcon className="w-4 h-4" />
            <span>TON</span>
          </Button>
        </div>

        {/* Time Range Toggle */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
            <Button
              key={range}
              onClick={() => setTimeRange(range)}
              variant="ghost"
              size="sm"
              className={`rounded-xl px-5 h-10 whitespace-nowrap font-bold text-xs uppercase transition-all ${
                timeRange === range 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg scale-105' 
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground shadow-md'
              }`}
            >
              {range.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Bot Branding - Changed to @NovaChartBot without logo */}
        <div className="text-center py-2">
          <span className="text-muted-foreground text-sm">@NovaChartBot</span>
        </div>

        {/* Send to Telegram Button */}
        <Button
          onClick={handleSendToTelegram}
          disabled={sending || !userId}
          className="w-full gap-2"
        >
          {sending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {text.sending}
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {text.sendToTelegram}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default RegularGiftDetail;
