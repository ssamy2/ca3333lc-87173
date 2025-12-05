import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  Loader2,
  AlertCircle,
  BarChart3,
  Package
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchPortfolioAnalysis } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';

interface PortfolioData {
  success: boolean;
  username: string;
  user_id?: number;
  total_gifts: number;
  total_upgraded: number;
  total_regular: number;
  portfolio_value: {
    total_ton: number;
    total_usd: number;
    upgraded_ton: number;
    upgraded_usd: number;
    regular_ton: number;
    regular_usd: number;
  };
  portfolio_changes: {
    change_24h_ton: number;
    change_24h_usd: number;
    change_24h_percent: number;
    change_week_ton: number;
    change_week_usd: number;
    change_week_percent: number;
    change_month_ton: number;
    change_month_usd: number;
    change_month_percent: number;
  };
  analytics: {
    most_volatile_24h: {
      name: string;
      change_percent: number;
      image_url: string;
      type: string;
    };
    most_volatile_week: {
      name: string;
      change_percent: number;
      image_url: string;
      type: string;
    };
    most_volatile_month: {
      name: string;
      change_percent: number;
      image_url: string;
      type: string;
    };
    most_profitable_ton: {
      name: string;
      profit_ton: number;
      change_percent: number;
      image_url: string;
      type: string;
    };
    most_profitable_usd: {
      name: string;
      profit_usd: number;
      change_percent: number;
      image_url: string;
      type: string;
    };
    most_loss_ton: {
      name: string;
      loss_ton: number;
      change_percent: number;
      image_url: string;
      type: string;
    };
    most_loss_usd: {
      name: string;
      loss_usd: number;
      change_percent: number;
      image_url: string;
      type: string;
    };
    most_valuable_ton: {
      name: string;
      value_ton: number;
      quantity: number;
      image_url: string;
      type: string;
    };
    most_valuable_usd: {
      name: string;
      value_usd: number;
      quantity: number;
      image_url: string;
      type: string;
    };
  };
}

const PortfolioTrackerPage: React.FC = () => {
  const { language } = useLanguage();
  const { userId } = useAuth();
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchUsername, setSearchUsername] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');

  const t = {
    ar: {
      title: 'متتبع المحفظة',
      subtitle: 'تحليل شامل لمحفظة هداياك',
      searchPlaceholder: 'ابحث عن مستخدم آخر...',
      search: 'بحث',
      loading: 'جاري التحليل...',
      error: 'حدث خطأ',
      retry: 'إعادة المحاولة',
      portfolioValue: 'قيمة المحفظة',
      totalValue: 'القيمة الإجمالية',
      upgradedGifts: 'الهدايا المطورة',
      regularGifts: 'الهدايا العادية',
      performance: 'الأداء',
      day: '24 ساعة',
      week: 'أسبوع',
      month: 'شهر',
      analytics: 'التحليلات',
      mostVolatile: 'الأكثر تقلباً',
      mostProfitable: 'الأكثر ربحاً',
      biggestLoss: 'الأكبر خسارة',
      mostValuable: 'الأكثر قيمة',
      profit: 'ربح',
      loss: 'خسارة',
      quantity: 'الكمية',
      noData: 'لا توجد بيانات',
      noGifts: 'لا توجد هدايا في المحفظة'
    },
    en: {
      title: 'Portfolio Tracker',
      subtitle: 'Comprehensive analysis of your gift portfolio',
      searchPlaceholder: 'Search for another user...',
      search: 'Search',
      loading: 'Analyzing...',
      error: 'An error occurred',
      retry: 'Retry',
      portfolioValue: 'Portfolio Value',
      totalValue: 'Total Value',
      upgradedGifts: 'Upgraded Gifts',
      regularGifts: 'Regular Gifts',
      performance: 'Performance',
      day: '24 Hours',
      week: 'Week',
      month: 'Month',
      analytics: 'Analytics',
      mostVolatile: 'Most Volatile',
      mostProfitable: 'Most Profitable',
      biggestLoss: 'Biggest Loss',
      mostValuable: 'Most Valuable',
      profit: 'Profit',
      loss: 'Loss',
      quantity: 'Quantity',
      noData: 'No data available',
      noGifts: 'No gifts in portfolio'
    }
  };

  const text = t[language] || t.en;

  useEffect(() => {
    if (userId) {
      setCurrentUsername(userId);
      loadPortfolio(userId);
    }
  }, [userId]);

  const loadPortfolio = async (username: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPortfolioAnalysis(username);
      setPortfolioData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchUsername.trim()) {
      setCurrentUsername(searchUsername.trim());
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatPercent = (num: number) => {
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1729] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">{text.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1729] flex items-center justify-center p-4">
        <Card className="bg-slate-800/50 border-slate-700/30 p-6 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">{text.error}</h3>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => loadPortfolio(currentUsername)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            {text.retry}
          </button>
        </Card>
      </div>
    );
  }

  if (!portfolioData || portfolioData.total_gifts === 0) {
    return (
      <div className="min-h-screen bg-[#0f1729] flex items-center justify-center p-4">
        <Card className="bg-slate-800/50 border-slate-700/30 p-6 text-center max-w-md">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">{text.noGifts}</h3>
          <p className="text-slate-400 text-sm">{text.noData}</p>
        </Card>
      </div>
    );
  }

  const { portfolio_value, portfolio_changes, analytics } = portfolioData;

  return (
    <div className="min-h-screen bg-[#0f1729] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0f1729]/90 backdrop-blur-lg border-b border-slate-700/30">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{text.title}</h1>
              <p className="text-xs text-slate-400">{text.subtitle}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={text.searchPlaceholder}
              className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">{text.search}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Portfolio Value Cards */}
        <div className="grid grid-cols-1 gap-4">
          {/* Total Value */}
          <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-slate-700/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-400" />
                <span className="text-slate-300 text-sm">{text.totalValue}</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {formatNumber(portfolio_value.total_ton)} TON
                </div>
                <div className="text-sm text-slate-400">
                  ${formatNumber(portfolio_value.total_usd)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700/30">
              <div className="flex-1">
                <div className="text-xs text-slate-400">{text.upgradedGifts}</div>
                <div className="text-sm font-semibold text-white">
                  {formatNumber(portfolio_value.upgraded_ton)} TON
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400">{text.regularGifts}</div>
                <div className="text-sm font-semibold text-white">
                  {formatNumber(portfolio_value.regular_ton)} TON
                </div>
              </div>
            </div>
          </Card>

          {/* Performance Cards */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: text.day, change: portfolio_changes.change_24h_ton, percent: portfolio_changes.change_24h_percent },
              { label: text.week, change: portfolio_changes.change_week_ton, percent: portfolio_changes.change_week_percent },
              { label: text.month, change: portfolio_changes.change_month_ton, percent: portfolio_changes.change_month_percent }
            ].map((period, idx) => (
              <Card key={idx} className="bg-slate-800/50 border-slate-700/30 p-3">
                <div className="text-xs text-slate-400 mb-1">{period.label}</div>
                <div className={`text-sm font-bold ${period.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {period.change >= 0 ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
                  {formatPercent(period.percent)}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {formatNumber(Math.abs(period.change))} TON
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Analytics Section */}
        <div>
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            {text.analytics}
          </h2>

          <div className="space-y-3">
            {/* Most Volatile */}
            <Card className="bg-slate-800/50 border-slate-700/30 p-4">
              <div className="flex items-center gap-3">
                {analytics.most_volatile_24h.image_url && (
                  <img
                    src={analytics.most_volatile_24h.image_url}
                    alt={analytics.most_volatile_24h.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="text-xs text-slate-400">{text.mostVolatile} (24h)</div>
                  <div className="text-white font-semibold">{analytics.most_volatile_24h.name}</div>
                  <div className={`text-sm ${analytics.most_volatile_24h.change_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercent(analytics.most_volatile_24h.change_percent)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Most Profitable */}
            <Card className="bg-slate-800/50 border-slate-700/30 p-4">
              <div className="flex items-center gap-3">
                {analytics.most_profitable_ton.image_url && (
                  <img
                    src={analytics.most_profitable_ton.image_url}
                    alt={analytics.most_profitable_ton.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="text-xs text-slate-400">{text.mostProfitable}</div>
                  <div className="text-white font-semibold">{analytics.most_profitable_ton.name}</div>
                  <div className="text-sm text-green-400">
                    +{formatNumber(analytics.most_profitable_ton.profit_ton)} TON ({formatPercent(analytics.most_profitable_ton.change_percent)})
                  </div>
                </div>
              </div>
            </Card>

            {/* Biggest Loss */}
            {analytics.most_loss_ton.loss_ton < 0 && (
              <Card className="bg-slate-800/50 border-slate-700/30 p-4">
                <div className="flex items-center gap-3">
                  {analytics.most_loss_ton.image_url && (
                    <img
                      src={analytics.most_loss_ton.image_url}
                      alt={analytics.most_loss_ton.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="text-xs text-slate-400">{text.biggestLoss}</div>
                    <div className="text-white font-semibold">{analytics.most_loss_ton.name}</div>
                    <div className="text-sm text-red-400">
                      {formatNumber(analytics.most_loss_ton.loss_ton)} TON ({formatPercent(analytics.most_loss_ton.change_percent)})
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Most Valuable */}
            <Card className="bg-slate-800/50 border-slate-700/30 p-4">
              <div className="flex items-center gap-3">
                {analytics.most_valuable_ton.image_url && (
                  <img
                    src={analytics.most_valuable_ton.image_url}
                    alt={analytics.most_valuable_ton.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="text-xs text-slate-400">{text.mostValuable}</div>
                  <div className="text-white font-semibold">{analytics.most_valuable_ton.name}</div>
                  <div className="text-sm text-blue-400">
                    {formatNumber(analytics.most_valuable_ton.value_ton)} TON
                  </div>
                  <div className="text-xs text-slate-500">
                    {text.quantity}: {analytics.most_valuable_ton.quantity}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioTrackerPage;
