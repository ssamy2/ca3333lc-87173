import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface MarketCapData {
  date: string;
  totalMarketCap: number;
  totalMarketCapUSD: number;
  change24h?: number;
  change7d?: number;
  change30d?: number;
}

const MarketStatsPage: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = {
    ar: {
      title: 'إحصائيات السوق',
      subtitle: 'تتبع القيمة السوقية الإجمالية',
      back: 'رجوع',
      totalMarketCap: 'القيمة السوقية الإجمالية',
      change24h: 'التغير 24 ساعة',
      change7d: 'التغير 7 أيام',
      change30d: 'التغير 30 يوم',
      loading: 'جاري التحميل...',
      error: 'حدث خطأ في تحميل البيانات',
      retry: 'إعادة المحاولة',
      ton: 'TON',
      usd: 'USD'
    },
    en: {
      title: 'Market Stats',
      subtitle: 'Track total market capitalization',
      back: 'Back',
      totalMarketCap: 'Total Market Cap',
      change24h: '24h Change',
      change7d: '7d Change',
      change30d: '30d Change',
      loading: 'Loading...',
      error: 'Error loading data',
      retry: 'Retry',
      ton: 'TON',
      usd: 'USD'
    }
  };

  const text = t[language] || t.en;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://www.channelsseller.site/api/market-cap-changes');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(text.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(decimals) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(decimals) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(decimals) + 'K';
    return num.toFixed(decimals);
  };

  const formatPercent = (num: number) => {
    const formatted = num.toFixed(2);
    return num >= 0 ? `+${formatted}%` : `${formatted}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
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

  // Extract latest data point
  const latestData = data?.data?.[data.data.length - 1] || {};
  const previousData = data?.data?.[data.data.length - 2] || {};
  
  const currentMarketCap = latestData.totalMarketCap || 0;
  const currentMarketCapUSD = latestData.totalMarketCapUSD || currentMarketCap * 2.16;
  
  // Calculate changes
  const dayAgoData = data?.data?.[Math.max(0, data.data.length - 2)] || {};
  const weekAgoData = data?.data?.[Math.max(0, data.data.length - 8)] || {};
  const monthAgoData = data?.data?.[0] || {};
  
  const change24h = dayAgoData.totalMarketCap 
    ? ((currentMarketCap - dayAgoData.totalMarketCap) / dayAgoData.totalMarketCap) * 100 
    : 0;
  const change7d = weekAgoData.totalMarketCap 
    ? ((currentMarketCap - weekAgoData.totalMarketCap) / weekAgoData.totalMarketCap) * 100 
    : 0;
  const change30d = monthAgoData.totalMarketCap 
    ? ((currentMarketCap - monthAgoData.totalMarketCap) / monthAgoData.totalMarketCap) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">{text.back}</span>
          </button>
          <h1 className="text-lg font-bold text-white">{text.title}</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Total Market Cap Card */}
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">{text.totalMarketCap}</p>
              <p className="text-2xl font-bold text-white">
                {formatNumber(currentMarketCap)} TON
              </p>
              <p className="text-slate-400 text-sm">
                ≈ ${formatNumber(currentMarketCapUSD)}
              </p>
            </div>
          </div>
        </div>

        {/* Change Cards */}
        <div className="grid grid-cols-3 gap-3">
          {/* 24h Change */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/10">
            <p className="text-slate-400 text-xs mb-2">{text.change24h}</p>
            <div className={`flex items-center gap-1 ${change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-bold">{formatPercent(change24h)}</span>
            </div>
          </div>

          {/* 7d Change */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/10">
            <p className="text-slate-400 text-xs mb-2">{text.change7d}</p>
            <div className={`flex items-center gap-1 ${change7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change7d >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-bold">{formatPercent(change7d)}</span>
            </div>
          </div>

          {/* 30d Change */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/10">
            <p className="text-slate-400 text-xs mb-2">{text.change30d}</p>
            <div className={`flex items-center gap-1 ${change30d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change30d >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-bold">{formatPercent(change30d)}</span>
            </div>
          </div>
        </div>

        {/* Historical Data */}
        {data?.data && data.data.length > 0 && (
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/10">
            <h3 className="text-white font-semibold mb-4">
              {language === 'ar' ? 'البيانات التاريخية' : 'Historical Data'}
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...data.data].reverse().slice(0, 10).map((item: any, index: number) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <span className="text-slate-400 text-sm">
                    {new Date(item.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="text-white font-medium">
                    {formatNumber(item.totalMarketCap)} TON
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketStatsPage;
