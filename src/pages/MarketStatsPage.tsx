import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, BarChart3, Calendar, Send, ArrowUpRight, ArrowDownRight, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import TonIcon from '@/components/TonIcon';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAuthHeaders } from '@/lib/telegramAuth';
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
} from 'chart.js';
import { Line } from 'react-chartjs-2';

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

interface MarketCapDataPoint {
  _id: string;
  indexId: string;
  date: string;
  time: string;
  priceTon: number;
  priceUsd: number;
  createdAt: string;
}

type TimeRange = '24h' | '7d' | '30d' | 'all';

const MarketStatsPage: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState<MarketCapDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [currency, setCurrency] = useState<'ton' | 'usd'>('ton');
  const [sending, setSending] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const t = {
    ar: {
      title: 'إحصائيات السوق',
      subtitle: 'القيمة السوقية الإجمالية للهدايا',
      back: 'رجوع',
      totalMarketCap: 'القيمة السوقية',
      change24h: 'التغير 24س',
      change7d: 'التغير 7 أيام',
      change30d: 'التغير 30 يوم',
      loading: 'جاري التحميل...',
      error: 'حدث خطأ في تحميل البيانات',
      retry: 'إعادة المحاولة',
      day: '24 ساعة',
      week: '7 أيام',
      month: '30 يوم',
      all: 'الكل',
      high: 'أعلى',
      low: 'أدنى',
      avg: 'المتوسط'
    },
    en: {
      title: 'Market Stats',
      subtitle: 'Total Gift Market Capitalization',
      back: 'Back',
      totalMarketCap: 'Market Cap',
      change24h: '24h Change',
      change7d: '7d Change',
      change30d: '30d Change',
      loading: 'Loading...',
      error: 'Error loading data',
      retry: 'Retry',
      day: '24H',
      week: '7D',
      month: '30D',
      all: 'All',
      high: 'High',
      low: 'Low',
      avg: 'Avg'
    }
  };

  const text = t[language] || t.en;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch('https://www.channelsseller.site/api/market-cap-changes', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...authHeaders
        }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      // Data comes as array directly
      if (Array.isArray(result)) {
        setData(result);
      } else {
        setData([]);
      }
    } catch (err) {
      setError(text.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (!data.length) return [];

    const now = new Date();
    let cutoffDate: Date;

    switch (timeRange) {
      case '24h':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return data;
    }

    return data.filter(item => new Date(item.createdAt) >= cutoffDate);
  }, [data, timeRange]);

  const stats = useMemo(() => {
    if (!filteredData.length) return null;

    const prices = filteredData.map(d => currency === 'ton' ? d.priceTon : d.priceUsd);
    const current = prices[prices.length - 1];
    const first = prices[0];
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const change = first > 0 ? ((current - first) / first) * 100 : 0;

    // Calculate 24h, 7d, 30d changes
    const now = new Date();
    const day24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const day7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const findClosest = (targetDate: Date) => {
      let closest = data[0];
      let minDiff = Math.abs(new Date(data[0].createdAt).getTime() - targetDate.getTime());

      for (const item of data) {
        const diff = Math.abs(new Date(item.createdAt).getTime() - targetDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closest = item;
        }
      }
      return closest;
    };

    const price24hAgo = currency === 'ton' ? findClosest(day24Ago).priceTon : findClosest(day24Ago).priceUsd;
    const price7dAgo = currency === 'ton' ? findClosest(day7Ago).priceTon : findClosest(day7Ago).priceUsd;
    const price30dAgo = currency === 'ton' ? findClosest(day30Ago).priceTon : findClosest(day30Ago).priceUsd;

    const change24h = price24hAgo > 0 ? ((current - price24hAgo) / price24hAgo) * 100 : 0;
    const change7d = price7dAgo > 0 ? ((current - price7dAgo) / price7dAgo) * 100 : 0;
    const change30d = price30dAgo > 0 ? ((current - price30dAgo) / price30dAgo) * 100 : 0;

    return { current, high, low, avg, change, change24h, change7d, change30d };
  }, [filteredData, currency, data]);

  const chartData = useMemo(() => {
    if (!filteredData.length) return null;

    // Sample data for better performance
    const maxPoints = timeRange === '24h' ? 48 : timeRange === '7d' ? 84 : timeRange === '30d' ? 120 : 200;
    const step = Math.max(1, Math.floor(filteredData.length / maxPoints));
    const sampledData = filteredData.filter((_, i) => i % step === 0 || i === filteredData.length - 1);

    const labels = sampledData.map(d => {
      const date = new Date(d.createdAt);
      if (timeRange === '24h') {
        return date.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
    });

    const prices = sampledData.map(d => currency === 'ton' ? d.priceTon : d.priceUsd);
    const isPositive = prices[prices.length - 1] >= prices[0];

    return {
      labels,
      datasets: [
        {
          label: currency === 'ton' ? 'TON' : 'USD',
          data: prices,
          borderColor: isPositive ? '#22c55e' : '#ef4444',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            if (isPositive) {
              gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
              gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
            } else {
              gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
              gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
            }
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: isPositive ? '#22c55e' : '#ef4444',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          borderWidth: 2,
        },
      ],
    };
  }, [filteredData, currency, timeRange, language]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#fff',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return `${currency === 'ton' ? '◎' : '$'} ${formatNumber(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          maxTicksLimit: 6,
          font: {
            size: 10,
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        display: true,
        position: 'right' as const,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#64748b',
          callback: (value: any) => formatCompact(value),
          font: {
            size: 10,
          },
        },
        border: {
          display: false,
        },
      },
    },
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatCompact = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(0) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toFixed(0);
  };

  const formatPercent = (num: number) => {
    const formatted = Math.abs(num).toFixed(2);
    return num >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  const handleSendToTelegram = async () => {
    if (!chartContainerRef.current || !stats) return;

    // Get Telegram user ID
    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
    if (!userId) {
      toast.error(language === 'ar' ? 'يجب فتح التطبيق من تليجرام' : 'Please open from Telegram');
      return;
    }

    setSending(true);
    try {
      const html2canvas = (await import('html2canvas')).default;

      // Capture the page content
      const pageContent = document.querySelector('.min-h-screen') as HTMLElement;
      if (!pageContent) throw new Error('Page content not found');

      const canvas = await html2canvas(pageContent, {
        backgroundColor: '#0f1729',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        height: Math.min(pageContent.scrollHeight, 1200),
        windowHeight: 1200,
      });

      // Convert to base64 and extract data part only
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const parts = imageDataUrl.split(',');
      if (parts.length !== 2) throw new Error('Invalid image format');
      const base64Data = parts[1];

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
        toast.success(language === 'ar' ? 'تم الإرسال بنجاح!' : 'Sent successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to send');
      }
    } catch (error: any) {
      console.error('Send error:', error);
      toast.error(language === 'ar' ? 'فشل في الإرسال' : error.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#0f1729] to-[#0f1729] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-slate-400 text-sm">{text.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#0f1729] to-[#0f1729] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            {text.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between p-4 max-w-5xl mx-auto">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{text.title}</h1>
            <p className="text-xs text-muted-foreground font-medium">{text.subtitle}</p>
          </div>
          <button
            onClick={handleSendToTelegram}
            disabled={sending || !chartData}
            className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-300 disabled:opacity-50 disabled:hover:bg-primary/10 shadow-sm"
            title={language === 'ar' ? 'إرسال للتليجرام' : 'Send to Telegram'}
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-5xl mx-auto relative z-10">
        {/* Current Value Card */}
        {stats && (
          <>
            {/* Modular Grid Layout */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="col-span-2 bg-card/40 backdrop-blur-md rounded-xl p-5 border border-white/10 shadow-lg flex flex-col justify-between group hover:bg-card/50 transition-all duration-300">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">{text.totalMarketCap}</p>
                  <div className="flex items-center gap-2.5">
                    {currency === 'ton' && <TonIcon className="w-8 h-8 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />}
                    <p className="text-3xl font-bold text-foreground tracking-tight">
                      {currency === 'usd' ? '$ ' : ''}{formatNumber(stats.current)}
                    </p>
                  </div>
                </div>
                <div className={`mt-4 flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-sm ${stats.change >= 0
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  }`}>
                  {stats.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {formatPercent(stats.change)}
                </div>
              </div>

              <div className="bg-card/40 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-lg flex flex-col justify-center items-center text-center hover:bg-card/50 transition-all duration-300">
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-2">{text.high}</p>
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-full bg-emerald-500/10">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <p className="text-foreground font-bold text-lg">{formatNumber(stats.high)}</p>
                </div>
              </div>

              <div className="bg-card/40 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-lg flex flex-col justify-center items-center text-center hover:bg-card/50 transition-all duration-300">
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-2">{text.low}</p>
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-full bg-rose-500/10">
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <p className="text-foreground font-bold text-lg">{formatNumber(stats.low)}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Chart */}
        {chartData && (
          <div ref={chartContainerRef} className="bg-card/40 backdrop-blur-md rounded-xl p-5 border border-white/10 shadow-lg relative min-h-[300px]">
            <div className="h-[280px] relative w-full">
              <Line data={chartData} options={chartOptions} />
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0">
                <span className="text-xl font-bold text-muted-foreground/10 tracking-widest uppercase">Nova Analytics</span>
              </div>
            </div>
          </div>
        )}

        {/* Time Range & Currency Toggle */}
        <div className="flex gap-3">
          {/* Time Range */}
          <div className="flex-1 flex bg-secondary/30 backdrop-blur-sm rounded-xl p-1 border border-white/5">
            {(['24h', '7d', '30d', 'all'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${timeRange === range
                  ? 'bg-background shadow-md text-primary scale-[1.02]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
              >
                {range === '24h' ? text.day : range === '7d' ? text.week : range === '30d' ? text.month : text.all}
              </button>
            ))}
          </div>

          {/* Currency Toggle */}
          <div className="flex bg-secondary/30 backdrop-blur-sm rounded-xl p-1 border border-white/5">
            <button
              onClick={() => setCurrency('ton')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${currency === 'ton'
                ? 'bg-background shadow-md text-blue-500 scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
            >
              TON
            </button>
            <button
              onClick={() => setCurrency('usd')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${currency === 'usd'
                ? 'bg-background shadow-md text-emerald-500 scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
            >
              USD
            </button>
          </div>
        </div>

        {/* Change Cards */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card/40 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-sm hover:shadow-md transition-all">
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-2">{text.change24h}</p>
              <div className={`flex items-center gap-1 text-sm ${stats.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stats.change24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span className="font-bold">{formatPercent(stats.change24h)}</span>
              </div>
            </div>

            <div className="bg-card/40 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-sm hover:shadow-md transition-all">
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-2">{text.change7d}</p>
              <div className={`flex items-center gap-1 text-sm ${stats.change7d >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stats.change7d >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span className="font-bold">{formatPercent(stats.change7d)}</span>
              </div>
            </div>

            <div className="bg-card/40 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-sm hover:shadow-md transition-all">
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-2">{text.change30d}</p>
              <div className={`flex items-center gap-1 text-sm ${stats.change30d >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stats.change30d >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span className="font-bold">{formatPercent(stats.change30d)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Data Info */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground/60 text-[10px] uppercase tracking-widest pt-2">
          <Calendar className="w-3 h-3" />
          <span>{filteredData.length} {language === 'ar' ? 'نقطة بيانات' : 'DATA POINTS'}</span>
        </div>
      </div>
    </div >
  );
};

export default MarketStatsPage;
