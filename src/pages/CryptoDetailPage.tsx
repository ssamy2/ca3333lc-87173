/**
 * CryptoDetailPage - Detailed Crypto Chart View
 * @novachartsbot - Binance-style design
 * Opens when user clicks on a coin from the main crypto list
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Share2, Loader2, Download } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchCryptoChart, fetchCoinDetails, formatPrice, formatMarketCap, CryptoChartData } from '@/services/cryptoService';
import { 
  fetchBinanceChartData, 
  fetchBinanceCryptoData, 
  fetchBinanceTicker,
  fetchBinanceOrderBook,
  BinanceCryptoData,
  BinanceChartData,
  formatBinancePrice,
  formatBinancePercentage,
  formatBinanceVolume,
  getBinanceInterval,
  getBinanceLimit
} from '@/services/binanceService';
import { 
  fetchHybridCryptoData,
  fetchHybridChartData,
  HybridCryptoData,
  HybridChartData,
  formatHybridPrice,
  formatHybridPercentage,
  formatHybridVolume,
  coinIdToCryptoCompareSymbol
} from '@/services/hybridCryptoService';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type TimeFrame = '1H' | '1D' | '1W' | '1M' | '1Y';

const timeFrameConfig: Record<TimeFrame, { days: number; label: string; labelAr: string }> = {
  '1H': { days: 1, label: '1H', labelAr: '1س' },
  '1D': { days: 1, label: '24H', labelAr: '24س' },
  '1W': { days: 7, label: '7D', labelAr: '7أ' },
  '1M': { days: 30, label: '30D', labelAr: '30ي' },
  '1Y': { days: 365, label: '1Y', labelAr: '1س' }
};

const CryptoDetailPage: React.FC = () => {
  const { coinId } = useParams<{ coinId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [coinDetails, setCoinDetails] = useState<any>(null);
  const [binanceData, setBinanceData] = useState<BinanceCryptoData | null>(null);
  const [hybridData, setHybridData] = useState<HybridCryptoData | null>(null);
  const [chartData, setChartData] = useState<HybridChartData | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1W');
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Load coin details
  useEffect(() => {
    const loadCoinDetails = async () => {
      if (!coinId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Get symbol for Hybrid API
        const symbol = coinIdToCryptoCompareSymbol(coinId);
        
        // Fetch all data sources
        const [details, binance, hybrid] = await Promise.all([
          fetchCoinDetails(coinId),
          fetchBinanceCryptoData(coinId),
          fetchHybridCryptoData(coinId, symbol)
        ]);
        
        setCoinDetails(details);
        setBinanceData(binance);
        setHybridData(hybrid);
      } catch (err) {
        console.error('[CryptoDetail] Error loading details:', err);
        setError(isRTL ? 'فشل في تحميل البيانات' : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadCoinDetails();
  }, [coinId, isRTL]);

  // Load chart data when timeframe changes
  useEffect(() => {
    const loadChartData = async () => {
      if (!coinId) return;
      
      setChartLoading(true);
      
      try {
        // Use Hybrid API for chart data (CryptoCompare)
        const symbol = coinIdToCryptoCompareSymbol(coinId);
        const data = await fetchHybridChartData(symbol, timeFrame);
        setChartData(data);
      } catch (err) {
        console.error('[CryptoDetail] Error loading chart:', err);
      } finally {
        setChartLoading(false);
      }
    };

    loadChartData();
  }, [coinId, timeFrame]);

  // Calculate price change for period
  const calculatePeriodChange = () => {
    if (!chartData?.prices || chartData.prices.length < 2) {
      return { value: 0, percentage: 0 };
    }
    
    const firstPrice = chartData.prices[0];
    const lastPrice = chartData.prices[chartData.prices.length - 1];
    const change = lastPrice - firstPrice;
    const percentage = (change / firstPrice) * 100;
    
    return { value: change, percentage };
  };

  const periodChange = calculatePeriodChange();
  const isPositive = periodChange.percentage >= 0;

  // Format chart data for Chart.js
  const formatChartDataForDisplay = () => {
    if (!chartData?.prices) {
      return { labels: [], datasets: [] };
    }

    const labels = chartData.times.map((timestamp) => {
      const date = new Date(timestamp);
      if (timeFrame === '1H' || timeFrame === '1D') {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (timeFrame === '1W') {
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    });

    const prices = chartData.prices;

    return {
      labels,
      datasets: [
        {
          label: coinDetails?.symbol?.toUpperCase() || '',
          data: prices,
          fill: true,
          borderColor: isPositive ? '#00C853' : '#FF5252',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height);
            if (isPositive) {
              gradient.addColorStop(0, 'rgba(0, 200, 83, 0.2)');
              gradient.addColorStop(1, 'rgba(0, 200, 83, 0)');
            } else {
              gradient.addColorStop(0, 'rgba(255, 82, 82, 0.2)');
              gradient.addColorStop(1, 'rgba(255, 82, 82, 0)');
            }
            return gradient;
          },
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: isPositive ? '#00C853' : '#FF5252',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          tension: 0.4
        }
      ]
    };
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        titleFont: { family: 'Inter, sans-serif', weight: 'bold' },
        bodyFont: { family: 'Inter, sans-serif' },
        borderColor: isPositive ? '#00C853' : '#FF5252',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => formatBinancePrice(context.parsed.y)
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: {
          color: 'rgba(156, 163, 175, 0.6)',
          font: { size: 10, family: 'Inter, sans-serif' },
          maxRotation: 0,
          maxTicksLimit: 6
        },
        border: { display: false }
      },
      y: {
        display: true,
        position: 'right',
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
        ticks: {
          color: 'rgba(156, 163, 175, 0.6)',
          font: { size: 10, family: 'Inter, sans-serif' },
          callback: (value) => formatBinancePrice(value as number),
          maxTicksLimit: 5
        },
        border: { display: false }
      }
    }
  };

  // Share to Telegram
  const handleShare = async () => {
    if (!chartContainerRef.current || isCapturing) return;
    
    setIsCapturing(true);
    
    try {
      const canvas = await html2canvas(chartContainerRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error(isRTL ? 'فشل في إنشاء الصورة' : 'Failed to create image');
          setIsCapturing(false);
          return;
        }

        // Check if Telegram WebApp is available
        if (window.Telegram?.WebApp) {
          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            // Send to Telegram - using type assertion to bypass TypeScript error
            (window.Telegram.WebApp as any).sendData(JSON.stringify({
              type: 'crypto_chart',
              coinId: coinId,
              coinName: coinDetails?.name,
              image: base64
            }));
            toast.success(isRTL ? 'تم إرسال الصورة' : 'Image sent!');
          };
          reader.readAsDataURL(blob);
        } else {
          // Fallback: Download image
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${coinId}-chart.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success(isRTL ? 'تم تحميل الصورة' : 'Image downloaded!');
        }
        
        setIsCapturing(false);
      }, 'image/png');
    } catch (err) {
      console.error('[CryptoDetail] Share error:', err);
      toast.error(isRTL ? 'فشل في المشاركة' : 'Failed to share');
      setIsCapturing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !coinDetails) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || 'Coin not found'}</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isRTL ? 'رجوع' : 'Go Back'}
        </Button>
      </div>
    );
  }

  // Use Hybrid data with priority: Hybrid > Binance > CoinGecko
  const currentPrice = hybridData?.currentPrice || binanceData?.currentPrice || coinDetails.market_data?.current_price?.usd || 0;
  const priceChange24h = hybridData?.priceChangePercent || binanceData?.priceChangePercent || coinDetails.market_data?.price_change_percentage_24h || 0;
  const marketCap = coinDetails.market_data?.market_cap?.usd || 0; // Only from CoinGecko
  const volume24h = hybridData?.volume || binanceData?.volume || coinDetails.market_data?.total_volume?.usd || 0;
  const high24h = hybridData?.highPrice || binanceData?.highPrice || coinDetails.market_data?.high_24h?.usd || 0;
  const low24h = hybridData?.lowPrice || binanceData?.lowPrice || coinDetails.market_data?.low_24h?.usd || 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className={cn(
          "flex items-center gap-3 p-4 max-w-2xl mx-auto",
          isRTL && "flex-row-reverse"
        )}>
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
          </button>
          
          <img
            src={coinDetails.image?.large || coinDetails.image?.small}
            alt={coinDetails.name}
            className="w-10 h-10 rounded-full"
          />
          
          <div className={cn("flex-1", isRTL && "text-right")}>
            <h1 className="font-bold text-lg">{coinDetails.name}</h1>
            <p className="text-xs text-muted-foreground uppercase">{coinDetails.symbol}</p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={isCapturing}
            className="gap-2"
          >
            {isCapturing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            {!isCapturing && (isRTL ? 'مشاركة' : 'Share')}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Price Section */}
        <div ref={chartContainerRef} className="space-y-4">
          <div className={cn("flex items-end gap-3", isRTL && "flex-row-reverse")}>
            <span className="text-3xl font-bold font-mono">{formatBinancePrice(currentPrice)}</span>
            <span className={cn(
              "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-md",
              priceChange24h >= 0 ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
            )}>
              {priceChange24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
            </span>
          </div>

          {/* Timeframe Selector */}
          <div className={cn("flex gap-1 p-1 bg-muted/20 rounded-lg w-fit", isRTL && "flex-row-reverse")}>
            {(Object.keys(timeFrameConfig) as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFrame(tf)}
                className={cn(
                  "px-4 py-2 rounded-md text-xs font-semibold transition-all",
                  timeFrame === tf
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                {isRTL ? timeFrameConfig[tf].labelAr : timeFrameConfig[tf].label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="relative h-[300px] bg-card/30 rounded-xl p-4 border border-border/20">
            {chartLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <Line data={formatChartDataForDisplay()} options={chartOptions} />
            )}
            
            {/* Watermark */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <span className="text-[10px] text-muted-foreground/30 font-medium">@novachartsbot</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card/30 rounded-xl p-3 border border-border/20">
            <p className="text-[10px] text-muted-foreground mb-1">
              {isRTL ? 'القيمة السوقية' : 'Market Cap'}
            </p>
            <p className="font-semibold text-sm">{formatMarketCap(marketCap)}</p>
          </div>
          <div className="bg-card/30 rounded-xl p-3 border border-border/20">
            <p className="text-[10px] text-muted-foreground mb-1">
              {isRTL ? 'حجم التداول 24س' : '24h Volume'}
            </p>
            <p className="font-semibold text-sm">{formatMarketCap(volume24h)}</p>
          </div>
          <div className="bg-card/30 rounded-xl p-3 border border-border/20">
            <p className="text-[10px] text-muted-foreground mb-1">
              {isRTL ? 'أعلى سعر 24س' : '24h High'}
            </p>
            <p className="font-semibold text-sm text-green-500">{formatBinancePrice(high24h)}</p>
          </div>
          <div className="bg-card/30 rounded-xl p-3 border border-border/20">
            <p className="text-[10px] text-muted-foreground mb-1">
              {isRTL ? 'أدنى سعر 24س' : '24h Low'}
            </p>
            <p className="font-semibold text-sm text-red-500">{formatBinancePrice(low24h)}</p>
          </div>
        </div>

        {/* Period Stats */}
        {chartData && (
          <div className="bg-card/30 rounded-xl p-4 border border-border/20">
            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <span className="text-sm text-muted-foreground">
                {isRTL ? `تغيير ${timeFrameConfig[timeFrame].labelAr}` : `${timeFrameConfig[timeFrame].label} Change`}
              </span>
              <span className={cn(
                "font-bold",
                isPositive ? "text-green-500" : "text-red-500"
              )}>
                {isPositive ? '+' : ''}{periodChange.percentage.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {/* Data Source */}
        {hybridData && (
          <div className="text-center py-2">
            <span className="text-[10px] text-muted-foreground/50">
              {isRTL ? 'بيانات من Binance + CryptoCompare' : 'Data from Binance + CryptoCompare'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoDetailPage;
