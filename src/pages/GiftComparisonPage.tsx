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
  change_24h_ton_percent?: number;
  change_7d_ton_percent?: number;
  change_30d_ton_percent?: number;
  change_24h_usd_percent?: number;
  change_7d_usd_percent?: number;
  change_30d_usd_percent?: number;
  _id?: string; // Only upgraded gifts have _id
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
  change_24h_ton_percent?: number;
  change_7d_ton_percent?: number;
  change_30d_ton_percent?: number;
  change_24h_usd_percent?: number;
  change_7d_usd_percent?: number;
  change_30d_usd_percent?: number;
}

type TimeRange = 'all' | '3m' | '1m' | '1w';
type Currency = 'usd' | 'ton';
type ViewMode = 'chart' | 'table';

// Predefined colors for chart lines - maximally distinct colors for dark theme
const CHART_COLORS = [
  '#ff3366', // Vibrant Red-Pink
  '#33ff99', // Vibrant Green
  '#ffcc00', // Vibrant Yellow
  '#3366ff', // Vibrant Blue
  '#ff6600', // Vibrant Orange
  '#cc33ff', // Vibrant Purple
  '#00ffff', // Vibrant Cyan
  '#ff0099', // Vibrant Magenta
  '#66ff33', // Vibrant Lime
  '#ff9933', // Vibrant Peach
  '#9933ff', // Vibrant Violet
  '#00ff66', // Vibrant Mint
];

// Generate consistent color based on gift name (hash function)
const getColorForGift = (giftName: string, usedColors: string[]): string => {
  // Simple hash function to get a consistent index for a name
  let hash = 0;
  for (let i = 0; i < giftName.length; i++) {
    const char = giftName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Get base index from hash
  const baseIndex = Math.abs(hash) % CHART_COLORS.length;
  
  // Try to find an unused color starting from baseIndex
  for (let i = 0; i < CHART_COLORS.length; i++) {
    const colorIndex = (baseIndex + i) % CHART_COLORS.length;
    const color = CHART_COLORS[colorIndex];
    if (!usedColors.includes(color)) {
      return color;
    }
  }
  
  // If all colors are used, return based on hash
  return CHART_COLORS[baseIndex];
};

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
      const giftsArray: GiftData[] = Object.entries(data)
        .filter(([_, giftData]: [string, any]) => giftData._id) // Only upgraded gifts have _id
        .map(([name, giftData]: [string, any]) => ({
          name,
          priceTon: giftData.priceTon || 0,
          priceUsd: giftData.priceUsd || 0,
          image_url: giftData.image_url || '',
          change_24h_ton_percent: giftData.change_24h_ton_percent || 0,
          change_7d_ton_percent: giftData.change_7d_ton_percent || 0,
          change_30d_ton_percent: giftData.change_30d_ton_percent || 0,
          change_24h_usd_percent: giftData.change_24h_usd_percent || 0,
          change_7d_usd_percent: giftData.change_7d_usd_percent || 0,
          change_30d_usd_percent: giftData.change_30d_usd_percent || 0,
          _id: giftData._id,
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
      
      // Get used colors from currently selected gifts
      const usedColors = selectedGifts.map(g => g.color);
      const newColor = getColorForGift(giftName, usedColors);

      setSelectedGifts((prev) => [
        ...prev,
        {
          name: giftName,
          image_url: gift.image_url || '',
          priceTon: gift.priceTon,
          priceUsd: gift.priceUsd,
          color: newColor,
          chartData,
          change_24h_ton_percent: gift.change_24h_ton_percent,
          change_7d_ton_percent: gift.change_7d_ton_percent,
          change_30d_ton_percent: gift.change_30d_ton_percent,
          change_24h_usd_percent: gift.change_24h_usd_percent,
          change_7d_usd_percent: gift.change_7d_usd_percent,
          change_30d_usd_percent: gift.change_30d_usd_percent,
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

  // Helper function to parse DD-MM-YYYY date format
  const parseDateString = (dateStr: string): Date => {
    // Handle DD-MM-YYYY format from API
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    // Fallback to standard parsing
    return new Date(dateStr);
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

    // Sort dates correctly using custom parser for DD-MM-YYYY format
    const sortedDates = Array.from(allDates).sort((a, b) => {
      const dateA = parseDateString(a);
      const dateB = parseDateString(b);
      return dateA.getTime() - dateB.getTime();
    });

    // Filter by time range - use actual date comparison, not just slice
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today
    
    let filteredDates = sortedDates;
    
    switch (timeRange) {
      case '1w': {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filteredDates = sortedDates.filter(d => {
          const date = parseDateString(d);
          return date >= weekAgo && date <= now;
        });
        break;
      }
      case '1m': {
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);
        filteredDates = sortedDates.filter(d => {
          const date = parseDateString(d);
          return date >= monthAgo && date <= now;
        });
        break;
      }
      case '3m': {
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
        filteredDates = sortedDates.filter(d => {
          const date = parseDateString(d);
          return date >= threeMonthsAgo && date <= now;
        });
        break;
      }
      case 'all':
      default:
        break;
    }

    // Build combined data
    return filteredDates.map((date) => {
      // Parse date safely using our custom parser
      const dateObj = parseDateString(date);
      const isValidDate = !isNaN(dateObj.getTime());
      
      const point: ChartDataPoint = {
        date,
        label: isValidDate 
          ? dateObj.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
              month: 'short',
              day: 'numeric',
            })
          : date, // Fallback to original string
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

  // Generate professional chart image using Canvas API
  const generateComparisonImage = useCallback(async (): Promise<string> => {
    const WIDTH = 1200;
    const HEIGHT = 600;
    const PADDING = 40;
    const CHART_HEIGHT = 380;
    const CHART_TOP = 100;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d')!;
    
    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    bgGradient.addColorStop(0, '#0a0a1a');
    bgGradient.addColorStop(0.5, '#0f1629');
    bgGradient.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    // Add subtle grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < WIDTH; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i < HEIGHT; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(WIDTH, i);
      ctx.stroke();
    }
    
    // Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(isRTL ? 'مقارنة الهدايا' : 'Gift Comparison', PADDING, 50);
    
    // Bot watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('@NovaChartBot', WIDTH - PADDING, 50);
    ctx.textAlign = 'left';
    
    // Time range badge
    const timeLabel = timeRange === 'all' ? 'All Time' : timeRange === '3m' ? '3 Months' : timeRange === '1m' ? '1 Month' : '1 Week';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.beginPath();
    ctx.roundRect(PADDING, 65, 80, 24, 12);
    ctx.fill();
    ctx.fillStyle = '#3b82f6';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText(timeLabel, PADDING + 15, 82);
    
    // Currency badge
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.beginPath();
    ctx.roundRect(PADDING + 90, 65, 60, 24, 12);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.fillText(currency.toUpperCase(), PADDING + 105, 82);
    
    // Chart area
    const chartLeft = PADDING + 60;
    const chartRight = WIDTH - PADDING;
    const chartBottom = CHART_TOP + CHART_HEIGHT;
    const chartWidth = chartRight - chartLeft;
    
    // Get chart data
    const data = combinedChartData;
    if (data.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '16px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', WIDTH / 2, HEIGHT / 2);
      return canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
    }
    
    // Calculate min/max values
    let minVal = Infinity;
    let maxVal = -Infinity;
    selectedGifts.forEach(gift => {
      data.forEach(point => {
        const val = point[gift.name] as number;
        if (val !== undefined) {
          minVal = Math.min(minVal, val);
          maxVal = Math.max(maxVal, val);
        }
      });
    });
    
    // Add padding to range
    const range = maxVal - minVal || 1;
    minVal = minVal - range * 0.1;
    maxVal = maxVal + range * 0.1;
    
    // Draw Y-axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const val = minVal + (maxVal - minVal) * (1 - i / 5);
      const y = CHART_TOP + (CHART_HEIGHT * i / 5);
      const label = currency === 'ton' ? val.toFixed(2) : `$${val.toFixed(0)}`;
      ctx.fillText(label, chartLeft - 10, y + 4);
      
      // Grid line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();
    }
    
    // Draw X-axis labels
    ctx.textAlign = 'center';
    const labelStep = Math.ceil(data.length / 8);
    data.forEach((point, i) => {
      if (i % labelStep === 0 || i === data.length - 1) {
        const x = chartLeft + (chartWidth * i / (data.length - 1 || 1));
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText(point.label, x, chartBottom + 20);
      }
    });
    
    // Draw lines for each gift
    selectedGifts.forEach((gift, giftIndex) => {
      const points: Array<{x: number; y: number}> = [];
      
      data.forEach((point, i) => {
        const val = point[gift.name] as number;
        if (val !== undefined) {
          const x = chartLeft + (chartWidth * i / (data.length - 1 || 1));
          const y = CHART_TOP + CHART_HEIGHT * (1 - (val - minVal) / (maxVal - minVal));
          points.push({ x, y });
        }
      });
      
      if (points.length > 1) {
        // Draw gradient fill
        const gradient = ctx.createLinearGradient(0, CHART_TOP, 0, chartBottom);
        gradient.addColorStop(0, gift.color + '40');
        gradient.addColorStop(1, gift.color + '00');
        
        ctx.beginPath();
        ctx.moveTo(points[0].x, chartBottom);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, chartBottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = gift.color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    });
    
    // Legend
    const legendY = HEIGHT - 40;
    let legendX = PADDING;
    selectedGifts.forEach((gift, i) => {
      // Color dot
      ctx.beginPath();
      ctx.arc(legendX + 6, legendY, 6, 0, Math.PI * 2);
      ctx.fillStyle = gift.color;
      ctx.fill();
      
      // Name
      ctx.fillStyle = '#ffffff';
      ctx.font = '13px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(gift.name, legendX + 18, legendY + 4);
      
      // Price
      const priceText = currency === 'ton' ? `${gift.priceTon.toFixed(2)} TON` : `$${gift.priceUsd.toFixed(2)}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      const nameWidth = ctx.measureText(gift.name).width;
      ctx.fillText(priceText, legendX + 22 + nameWidth, legendY + 4);
      
      legendX += nameWidth + ctx.measureText(priceText).width + 50;
    });
    
    // Footer branding
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Nova Gift Analytics', WIDTH - PADDING, HEIGHT - 15);
    
    return canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
  }, [selectedGifts, combinedChartData, timeRange, currency, isRTL]);

  // Send comparison image via bot
  const sendViaBot = useCallback(async () => {
    if (selectedGifts.length < 2) return;

    setIsSending(true);

    try {
      // Generate professional chart image
      const base64Data = await generateComparisonImage();

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
  }, [selectedGifts, generateComparisonImage, text, isRTL]);

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

              {/* Custom Legend - Fixed Above Chart */}
              <div className="flex flex-wrap gap-3 mb-4 px-2">
                {selectedGifts.map((gift) => (
                  <div key={gift.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: gift.color }}
                    />
                    {gift.image_url && (
                      <img
                        src={gift.image_url}
                        alt={gift.name}
                        className="w-4 h-4 rounded object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <span className="text-xs font-medium">{gift.name}</span>
                  </div>
                ))}
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
              <div className="mt-4 pt-3 border-t border-border/50 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <span>Powered by</span>
                  <span className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Nova Gift Analytics
                  </span>
                </div>
                <span className="text-primary font-medium">@NovaChartBot</span>
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
                          {(() => {
                            const change = currency === 'ton' 
                              ? (gift.change_24h_ton_percent || 0) 
                              : (gift.change_24h_usd_percent || 0);
                            return (
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 text-sm font-medium',
                                  change >= 0 ? 'text-green-500' : 'text-red-500'
                                )}
                              >
                                {change >= 0 ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                {Math.abs(change).toFixed(2)}%
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const change = currency === 'ton' 
                              ? (gift.change_7d_ton_percent || 0) 
                              : (gift.change_7d_usd_percent || 0);
                            return (
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 text-sm font-medium',
                                  change >= 0 ? 'text-green-500' : 'text-red-500'
                                )}
                              >
                                {change >= 0 ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                {Math.abs(change).toFixed(2)}%
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const change = currency === 'ton' 
                              ? (gift.change_30d_ton_percent || 0) 
                              : (gift.change_30d_usd_percent || 0);
                            return (
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 text-sm font-medium',
                                  change >= 0 ? 'text-green-500' : 'text-red-500'
                                )}
                              >
                                {change >= 0 ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                {Math.abs(change).toFixed(2)}%
                              </span>
                            );
                          })()}
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
