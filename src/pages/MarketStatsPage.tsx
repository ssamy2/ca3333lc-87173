import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, BarChart3, Calendar } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#0f1729] to-[#0f1729] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0f1729]/90 backdrop-blur-lg border-b border-slate-700/30">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-white">{text.title}</h1>
            <p className="text-xs text-slate-400">{text.subtitle}</p>
          </div>
          <div className="w-7" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Current Value Card */}
        {stats && (
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-5 border border-slate-700/30">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">{text.totalMarketCap}</p>
                <p className="text-3xl font-bold text-white">
                  {currency === 'ton' ? '◎ ' : '$ '}{formatNumber(stats.current)}
                </p>
              </div>
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                stats.change >= 0 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {stats.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {formatPercent(stats.change)}
              </div>
            </div>
            
            {/* Mini Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">{text.high}</p>
                <p className="text-white font-semibold text-sm">{formatNumber(stats.high)}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">{text.low}</p>
                <p className="text-white font-semibold text-sm">{formatNumber(stats.low)}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">{text.avg}</p>
                <p className="text-white font-semibold text-sm">{formatNumber(stats.avg)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Time Range & Currency Toggle */}
        <div className="flex gap-2">
          {/* Time Range */}
          <div className="flex-1 flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/30">
            {(['24h', '7d', '30d', 'all'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  timeRange === range
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range === '24h' ? text.day : range === '7d' ? text.week : range === '30d' ? text.month : text.all}
              </button>
            ))}
          </div>
          
          {/* Currency Toggle */}
          <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/30">
            <button
              onClick={() => setCurrency('ton')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                currency === 'ton'
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              TON
            </button>
            <button
              onClick={() => setCurrency('usd')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                currency === 'usd'
                  ? 'bg-green-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              USD
            </button>
          </div>
        </div>

        {/* Chart */}
        {chartData && (
          <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700/30">
            <div className="h-64">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Change Cards */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
              <p className="text-slate-400 text-xs mb-2">{text.change24h}</p>
              <div className={`flex items-center gap-1 ${stats.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-bold">{formatPercent(stats.change24h)}</span>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
              <p className="text-slate-400 text-xs mb-2">{text.change7d}</p>
              <div className={`flex items-center gap-1 ${stats.change7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.change7d >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-bold">{formatPercent(stats.change7d)}</span>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
              <p className="text-slate-400 text-xs mb-2">{text.change30d}</p>
              <div className={`flex items-center gap-1 ${stats.change30d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.change30d >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-bold">{formatPercent(stats.change30d)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Data Info */}
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
          <Calendar className="w-3 h-3" />
          <span>{filteredData.length} {language === 'ar' ? 'نقطة بيانات' : 'data points'}</span>
        </div>
      </div>
    </div>
  );
};

export default MarketStatsPage;
