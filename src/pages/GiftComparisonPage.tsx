import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Loader2, TrendingUp, TrendingDown, Send, Gift, BarChart3, Table } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAuthHeaders } from '@/lib/telegramAuth';
import { DEV_MODE } from '@/config/devMode';
import GiftImage from '@/components/GiftImage';
import TonIcon from '@/components/TonIcon';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';

// Gift data interface
interface GiftData {
  name: string;
  priceTon: number;
  priceUsd: number;
  image_url?: string;
  change_24h?: number;
  change_7d?: number;
  change_30d?: number;
}

// Chart data interface
interface ChartDataPoint {
  date: string;
  label: string;
  [key: string]: string | number;
}

// Selected gift with chart data
interface SelectedGift {
  name: string;
  image_url: string;
  priceTon: number;
  priceUsd: number;
  color: string;
  chartData: Array<{
    date: string;
    priceTon: number;
    priceUsd: number;
  }>;
  change_24h?: number;
  change_7d?: number;
  change_30d?: number;
}

type TimeRange = 'all' | '3m' | '1m' | '1w' | '24h';
type Currency = 'usd' | 'ton';
type ViewMode = 'chart' | 'table';

// Predefined colors for chart lines
const CHART_COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

const GiftComparisonPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const { isLight } = useTheme();
  const isRTL = language === 'ar';
  const chartRef = useRef<HTMLDivElement>(null);

  // State
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [selectedGifts, setSelectedGifts] = useState<SelectedGift[]>([]);
  const [loadingChart, setLoadingChart] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');
  const [currency, setCurrency] = useState<Currency>('ton');
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [isSending, setIsSending] = useState(false);
  const [giftToAdd, setGiftToAdd] = useState<string>('');

  // Translations
  const t = {
    ar: {
      title: 'مقارنة الهدايا',
      subtitle: 'قارن أداء الهدايا المطورة',
      selectGift: 'اختر هدية للمقارنة',
      addGift: 'إضافة هدية',
      remove: 'إزالة',
      noGifts: 'لم يتم اختيار أي هدايا بعد',
      selectAtLeast: 'اختر هديتين على الأقل للمقارنة',
      loading: 'جاري التحميل...',
      sendToBot: 'إرسال عبر البوت',
      sending: 'جاري الإرسال...',
      sent: 'تم الإرسال بنجاح',
      sendError: 'فشل الإرسال',
      price: 'السعر',
      change24h: 'التغير 24س',
      change7d: 'التغير 7 أيام',
      change30d: 'التغير 30 يوم',
      timeRange: 'الفترة الزمنية',
      currency: 'العملة',
      all: 'الكل',
      threeMonths: '3 أشهر',
      oneMonth: 'شهر',
      oneWeek: 'أسبوع',
      oneDay: '24 ساعة',
      ton: 'TON',
      usd: 'USD',
      chartView: 'رسم بياني',
      tableView: 'جدول',
      giftName: 'اسم الهدية',
      currentPrice: 'السعر الحالي',
      maxGifts: 'الحد الأقصى 5 هدايا',
      noData: 'لا توجد بيانات',
    },
    en: {
      title: 'Gift Comparison',
      subtitle: 'Compare upgraded gift performance',
      selectGift: 'Select a gift to compare',
      addGift: 'Add Gift',
      remove: 'Remove',
      noGifts: 'No gifts selected yet',
      selectAtLeast: 'Select at least 2 gifts to compare',
      loading: 'Loading...',
      sendToBot: 'Send via Bot',
      sending: 'Sending...',
      sent: 'Sent successfully',
      sendError: 'Failed to send',
      price: 'Price',
      change24h: '24h Change',
      change7d: '7d Change',
      change30d: '30d Change',
      timeRange: 'Time Range',
      currency: 'Currency',
      all: 'All',
      threeMonths: '3 Months',
      oneMonth: '1 Month',
      oneWeek: '1 Week',
      oneDay: '24 Hours',
      ton: 'TON',
      usd: 'USD',
      chartView: 'Chart',
      tableView: 'Table',
      giftName: 'Gift Name',
      currentPrice: 'Current Price',
      maxGifts: 'Maximum 5 gifts',
      noData: 'No data available',
    },
  };

  const text = t[language] || t.en;

  // Load available gifts
  useEffect(() => {
    loadGifts();
  }, []);

  const loadGifts = async () => {
    try {
      setLoadingGifts(true);
      const authHeaders = await getAuthHeaders();
      const baseUrl = DEV_MODE ? 'http://localhost:5002' : 'https://www.channelsseller.site';
      const response = await fetch(`${baseUrl}/api/market-data`, {
        headers: {
          'Accept': 'application/json',
          ...authHeaders,
        },
      });

      if (!response.ok) throw new Error('Failed to load gifts');

      const data = await response.json();
      const giftsArray: GiftData[] = Object.entries(data).map(([name, giftData]: [string, any]) => ({
        name,
        priceTon: giftData.priceTon || 0,
        priceUsd: giftData.priceUsd || 0,
        image_url: giftData.image_url || '',
        change_24h: giftData.change_24h || 0,
        change_7d: giftData.change_7d || 0,
        change_30d: giftData.change_30d || 0,
      }));

      setGifts(giftsArray.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Failed to load gifts:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل تحميل الهدايا' : 'Failed to load gifts',
        variant: 'destructive',
      });
    } finally {
      setLoadingGifts(false);
    }
  };

  // Fetch chart data for a gift
  const fetchGiftChartData = async (giftName: string): Promise<any[]> => {
    try {
      const authHeaders = await getAuthHeaders();
      const baseUrl = DEV_MODE ? 'http://localhost:5002' : 'https://www.channelsseller.site';
      const response = await fetch(
        `${baseUrl}/api/gift/${encodeURIComponent(giftName)}/data`,
        {
          headers: {
            Accept: 'application/json',
            ...authHeaders,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch chart data');

      const rawData = await response.json();
      
      // Handle new API format
      if (rawData.success && rawData.data) {
        return rawData.data.life_chart || [];
      }
      
      // Old format
      return rawData.life_chart || [];
    } catch (error) {
      console.error(`Failed to fetch chart data for ${giftName}:`, error);
      return [];
    }
  };

  // Add a gift to comparison
  const addGift = async (giftName: string) => {
    if (!giftName) return;
    if (selectedGifts.length >= 5) {
      toast({
        title: isRTL ? 'تنبيه' : 'Notice',
        description: text.maxGifts,
        variant: 'default',
      });
      return;
    }

    if (selectedGifts.find((g) => g.name === giftName)) {
      toast({
        title: isRTL ? 'تنبيه' : 'Notice',
        description: isRTL ? 'هذه الهدية مضافة مسبقاً' : 'This gift is already added',
        variant: 'default',
      });
      return;
    }

    const gift = gifts.find((g) => g.name === giftName);
    if (!gift) return;

    setLoadingChart(giftName);

    try {
      const chartData = await fetchGiftChartData(giftName);
      const colorIndex = selectedGifts.length % CHART_COLORS.length;

      setSelectedGifts((prev) => [
        ...prev,
        {
          name: giftName,
          image_url: gift.image_url || '',
          priceTon: gift.priceTon,
          priceUsd: gift.priceUsd,
          color: CHART_COLORS[colorIndex],
          chartData,
          change_24h: gift.change_24h,
          change_7d: gift.change_7d,
          change_30d: gift.change_30d,
        },
      ]);
      setGiftToAdd('');
    } catch (error) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل تحميل بيانات الهدية' : 'Failed to load gift data',
        variant: 'destructive',
      });
    } finally {
      setLoadingChart(null);
    }
  };

  // Remove a gift from comparison
  const removeGift = (giftName: string) => {
    setSelectedGifts((prev) => prev.filter((g) => g.name !== giftName));
  };

  // Process chart data for comparison
  const combinedChartData = useMemo(() => {
    if (selectedGifts.length === 0) return [];

    // Get all unique dates
    const allDates = new Set<string>();
    selectedGifts.forEach((gift) => {
      gift.chartData.forEach((point) => {
        if (point.date) allDates.add(point.date);
      });
    });

    const sortedDates = Array.from(allDates).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    // Filter by time range
    let filteredDates = sortedDates;
    const now = new Date();
    
    switch (timeRange) {
      case '24h':
        filteredDates = sortedDates.slice(-1);
        break;
      case '1w':
        filteredDates = sortedDates.slice(-7);
        break;
      case '1m':
        filteredDates = sortedDates.slice(-30);
        break;
      case '3m':
        filteredDates = sortedDates.slice(-90);
        break;
      case 'all':
      default:
        break;
    }

    // Build combined data
    return filteredDates.map((date) => {
      const point: ChartDataPoint = {
        date,
        label: new Date(date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
          month: 'short',
          day: 'numeric',
        }),
      };

      selectedGifts.forEach((gift) => {
        const giftPoint = gift.chartData.find((p) => p.date === date);
        if (giftPoint) {
          point[gift.name] = currency === 'ton' ? giftPoint.priceTon : giftPoint.priceUsd;
        }
      });

      return point;
    });
  }, [selectedGifts, timeRange, currency, isRTL]);

  // Send comparison image via bot
  const sendViaBot = useCallback(async () => {
    if (!chartRef.current || selectedGifts.length < 2) return;

    setIsSending(true);

    try {
      // Dynamic import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      // Create canvas from the chart container
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: isLight ? '#ffffff' : '#0a0a0f',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      // Convert to base64
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const base64Data = imageDataUrl.split(',')[1];

      // Get user ID from Telegram WebApp
      const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || '';
      
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Send to API
      const authHeaders = await getAuthHeaders();
      const response = await fetch('https://www.channelsseller.site/api/send-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          id: userId,
          image: base64Data,
        }),
      });

      if (response.ok) {
        toast({
          title: text.sent,
          description: isRTL ? 'تم إرسال المقارنة للبوت' : 'Comparison sent to bot',
        });
      } else {
        throw new Error('Failed to send');
      }
    } catch (error: any) {
      console.error('Send error:', error);
      toast({
        title: text.sendError,
        description: error.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  }, [selectedGifts, isLight, text, isRTL]);

  // Get filtered gifts (not already selected)
  const availableGifts = gifts.filter(
    (g) => !selectedGifts.find((sg) => sg.name === g.name)
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className={cn('flex items-center gap-3 p-4', isRTL && 'flex-row-reverse')}>
          <Button variant="ghost" size="icon" onClick={() => navigate('/tools')}>
            <ArrowLeft className={cn('w-5 h-5', isRTL && 'rotate-180')} />
          </Button>
          <div className={cn('flex-1', isRTL && 'text-right')}>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {text.title}
            </h1>
            <p className="text-xs text-muted-foreground">{text.subtitle}</p>
          </div>
          {selectedGifts.length >= 2 && (
            <Button
              size="sm"
              onClick={sendViaBot}
              disabled={isSending}
              className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{isSending ? text.sending : text.sendToBot}</span>
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto space-y-4">
        {/* Gift Selection Card */}
        <Card className="p-4 space-y-4 border-primary/20 bg-card/50 backdrop-blur-sm">
          <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">{text.selectGift}</h3>
            <span className="text-xs text-muted-foreground ml-auto">
              ({selectedGifts.length}/5)
            </span>
          </div>

          {/* Gift Selector */}
          <div className={cn('flex gap-2', isRTL && 'flex-row-reverse')}>
            <Select
              value={giftToAdd}
              onValueChange={setGiftToAdd}
              disabled={loadingGifts || selectedGifts.length >= 5}
            >
              <SelectTrigger className="flex-1 bg-background/50">
                <SelectValue placeholder={loadingGifts ? text.loading : text.selectGift} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {availableGifts.map((gift) => (
                  <SelectItem key={gift.name} value={gift.name} className="py-2">
                    <div className={cn('flex items-center gap-2 w-full', isRTL && 'flex-row-reverse')}>
                      {gift.image_url ? (
                        <img
                          src={gift.image_url}
                          alt={gift.name}
                          className="w-6 h-6 rounded object-contain flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-6 h-6 rounded bg-muted/50 flex items-center justify-center flex-shrink-0">
                          <Gift className="w-3 h-3 text-muted-foreground/50" />
                        </div>
                      )}
                      <span className="flex-1 truncate">{gift.name}</span>
                      <span className="text-muted-foreground text-xs flex-shrink-0">
                        {gift.priceTon.toFixed(2)} TON
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => addGift(giftToAdd)}
              disabled={!giftToAdd || loadingChart !== null}
              className="gap-2"
            >
              {loadingChart ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {text.addGift}
            </Button>
          </div>

          {/* Selected Gifts Pills */}
          {selectedGifts.length > 0 && (
            <div className={cn('flex flex-wrap gap-2', isRTL && 'flex-row-reverse')}>
              {selectedGifts.map((gift) => (
                <div
                  key={gift.name}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 border"
                  style={{ borderColor: gift.color }}
                >
                  {gift.image_url && (
                    <img
                      src={gift.image_url}
                      alt={gift.name}
                      className="w-5 h-5 rounded object-contain"
                    />
                  )}
                  <span className="text-sm font-medium">{gift.name}</span>
                  <button
                    onClick={() => removeGift(gift.name)}
                    className="p-0.5 hover:bg-destructive/20 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Controls */}
        {selectedGifts.length >= 2 && (
          <div className={cn('flex flex-wrap gap-3 items-center', isRTL && 'flex-row-reverse')}>
            {/* Time Range */}
            <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
              <span className="text-sm text-muted-foreground">{text.timeRange}:</span>
              <div className="flex rounded-lg overflow-hidden border border-border/50">
                {[
                  { value: '24h', label: text.oneDay },
                  { value: '1w', label: text.oneWeek },
                  { value: '1m', label: text.oneMonth },
                  { value: '3m', label: text.threeMonths },
                  { value: 'all', label: text.all },
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value as TimeRange)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium transition-colors',
                      timeRange === range.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted'
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency */}
            <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
              <span className="text-sm text-muted-foreground">{text.currency}:</span>
              <div className="flex rounded-lg overflow-hidden border border-border/50">
                <button
                  onClick={() => setCurrency('ton')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1',
                    currency === 'ton'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  )}
                >
                  <TonIcon className="w-3 h-3" />
                  TON
                </button>
                <button
                  onClick={() => setCurrency('usd')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors',
                    currency === 'usd'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  )}
                >
                  $ USD
                </button>
              </div>
            </div>

            {/* View Mode */}
            <div className={cn('flex items-center gap-2 ml-auto', isRTL && 'ml-0 mr-auto')}>
              <div className="flex rounded-lg overflow-hidden border border-border/50">
                <button
                  onClick={() => setViewMode('chart')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1',
                    viewMode === 'chart'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  )}
                >
                  <BarChart3 className="w-3 h-3" />
                  {text.chartView}
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1',
                    viewMode === 'table'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  )}
                >
                  <Table className="w-3 h-3" />
                  {text.tableView}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chart/Table Container */}
        <div ref={chartRef}>
          {selectedGifts.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Gift className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{text.noGifts}</p>
              <p className="text-sm text-muted-foreground/70 mt-1">{text.selectAtLeast}</p>
            </Card>
          ) : selectedGifts.length === 1 ? (
            <Card className="p-8 text-center border-dashed">
              <p className="text-muted-foreground">{text.selectAtLeast}</p>
            </Card>
          ) : viewMode === 'chart' ? (
            <Card className="p-4 overflow-hidden">
              {/* Chart Header */}
              <div className={cn('flex items-center justify-between mb-4 pb-3 border-b border-border/50', isRTL && 'flex-row-reverse')}>
                <h3 className="font-semibold text-sm">
                  {isRTL ? 'مقارنة الأسعار' : 'Price Comparison'}
                </h3>
                <div className="text-xs text-muted-foreground">
                  @NovaChartBot
                </div>
              </div>

              {/* Chart */}
              {combinedChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={combinedChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      {selectedGifts.map((gift) => (
                        <linearGradient
                          key={`gradient-${gift.name}`}
                          id={`gradient-${gift.name.replace(/\s+/g, '-')}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor={gift.color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={gift.color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      stroke={isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.3)'}
                      tick={{ fontSize: 10, fill: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.5)' }}
                      interval="preserveStartEnd"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.3)'}
                      tick={{ fontSize: 10, fill: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.5)' }}
                      domain={['auto', 'auto']}
                      axisLine={false}
                      tickLine={false}
                      orientation="right"
                      width={50}
                      tickFormatter={(value) =>
                        currency === 'ton' ? `${value.toFixed(1)}` : `$${value.toFixed(0)}`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(10, 15, 26, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: isLight ? '#000' : '#fff',
                        padding: '12px',
                      }}
                      formatter={(value: number, name: string) => [
                        currency === 'ton' ? `${value.toFixed(4)} TON` : `$${value.toFixed(2)}`,
                        name,
                      ]}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value) => (
                        <span className="text-xs font-medium">{value}</span>
                      )}
                    />
                    {selectedGifts.map((gift) => (
                      <Area
                        key={gift.name}
                        type="monotone"
                        dataKey={gift.name}
                        stroke={gift.color}
                        strokeWidth={2}
                        fill={`url(#gradient-${gift.name.replace(/\s+/g, '-')})`}
                        connectNulls
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2 }}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                  {text.noData}
                </div>
              )}

              {/* Branding Footer */}
              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>Powered by</span>
                <span className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Nova Gift Analytics
                </span>
              </div>
            </Card>
          ) : (
            /* Table View */
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className={cn('px-4 py-3 text-sm font-semibold', isRTL ? 'text-right' : 'text-left')}>
                        {text.giftName}
                      </th>
                      <th className={cn('px-4 py-3 text-sm font-semibold', isRTL ? 'text-right' : 'text-left')}>
                        {text.currentPrice}
                      </th>
                      <th className={cn('px-4 py-3 text-sm font-semibold', isRTL ? 'text-right' : 'text-left')}>
                        {text.change24h}
                      </th>
                      <th className={cn('px-4 py-3 text-sm font-semibold', isRTL ? 'text-right' : 'text-left')}>
                        {text.change7d}
                      </th>
                      <th className={cn('px-4 py-3 text-sm font-semibold', isRTL ? 'text-right' : 'text-left')}>
                        {text.change30d}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGifts.map((gift, index) => (
                      <tr
                        key={gift.name}
                        className={cn(
                          'border-t border-border/30 hover:bg-muted/20 transition-colors',
                          index % 2 === 0 && 'bg-muted/5'
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
                            <div
                              className="w-1 h-8 rounded-full"
                              style={{ backgroundColor: gift.color }}
                            />
                            {gift.image_url && (
                              <img
                                src={gift.image_url}
                                alt={gift.name}
                                className="w-8 h-8 rounded object-contain"
                              />
                            )}
                            <span className="font-medium">{gift.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
                            {currency === 'ton' ? (
                              <>
                                <TonIcon className="w-4 h-4" />
                                <span className="font-semibold">{gift.priceTon.toFixed(4)}</span>
                              </>
                            ) : (
                              <span className="font-semibold">${gift.priceUsd.toFixed(2)}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-sm font-medium',
                              (gift.change_24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                            )}
                          >
                            {(gift.change_24h || 0) >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {Math.abs(gift.change_24h || 0).toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-sm font-medium',
                              (gift.change_7d || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                            )}
                          >
                            {(gift.change_7d || 0) >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {Math.abs(gift.change_7d || 0).toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-sm font-medium',
                              (gift.change_30d || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                            )}
                          >
                            {(gift.change_30d || 0) >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {Math.abs(gift.change_30d || 0).toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Branding Footer */}
              <div className="p-3 border-t border-border/50 flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/10">
                <span>Powered by</span>
                <span className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Nova Gift Analytics
                </span>
                <span className="ml-2">@NovaChartBot</span>
              </div>
            </Card>
          )}
        </div>

        {/* Support Link */}
        <div className="mt-6 pt-6 border-t border-border/30">
          <a
            href="https://t.me/Nova_Gifts"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full p-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl transition-all group"
          >
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
            </svg>
            <span className="font-semibold text-primary group-hover:underline">
              {isRTL ? 'انضم لقناة نوفا' : 'Join Nova Channel'}
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default GiftComparisonPage;
