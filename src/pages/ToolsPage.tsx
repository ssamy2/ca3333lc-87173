import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Grid3X3, BarChart3, ChevronRight, Wrench, TrendingUp, User, Bell, Calculator, Wallet, Scale, GitCompare } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPortfolioAnalysis } from '@/services/apiService';
import { cn } from '@/lib/utils';

interface ToolsPageProps {
  onGoToHome?: () => void;
}

const ToolsPage: React.FC<ToolsPageProps> = ({ onGoToHome }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { username } = useAuth();

  // Prefetch portfolio data when entering Tools page
  useEffect(() => {
    if (username) {
      console.log('🔄 Prefetching portfolio data for:', username);
      fetchPortfolioAnalysis(username).catch(() => {
        // Silently fail prefetch
      });
    }
  }, [username]);

  const t = {
    ar: {
      tools: 'الأدوات',
      toolsDesc: 'أدوات تحليل وتتبع الهدايا',
      giftCalculator: 'حاسبة هدايا المستخدم',
      giftCalculatorDesc: 'احسب قيمة هدايا أي مستخدم',
      nftProfit: 'أرباح الهدايا',
      nftProfitDesc: 'تتبع أرباح وخسائر هداياك',
      heatmap: 'خريطة الحرارة',
      heatmapDesc: 'عرض تغيرات أسعار الهدايا بشكل مرئي',
      marketStats: 'إحصائيات السوق',
      marketStatsDesc: 'تتبع القيمة السوقية الإجمالية',
      analytics: 'تحليلات متقدمة',
      analyticsDesc: 'إحصائيات وتحليلات مفصلة',
      priceAlerts: 'تنبيهات الأسعار',
      priceAlertsDesc: 'تنبيهات فورية عند وصول الهدايا لسعر معين',
      priceComparison: 'مقارنة الأسعار',
      priceComparisonDesc: 'قارن أسعار الهدايا بين الأسواق المختلفة',
      giftComparison: 'مقارنة الهدايا',
      giftComparisonDesc: 'قارن أداء الهدايا المطورة بالرسم البياني والجداول',
      tryNow: 'جرب الآن',
      comingSoon: 'قريباً'
    },
    en: {
      tools: 'Tools',
      toolsDesc: 'Gift analysis and tracking tools',
      giftCalculator: 'User Gift Calculator',
      giftCalculatorDesc: 'Calculate any user\'s gift value',
      nftProfit: 'NFT Profit',
      nftProfitDesc: 'Track your gifts profit & loss',
      heatmap: 'Heatmap',
      heatmapDesc: 'Visualize gift price changes',
      marketStats: 'Market Stats',
      marketStatsDesc: 'Track total market capitalization',
      analytics: 'Advanced Analytics',
      analyticsDesc: 'Detailed statistics and analytics',
      priceAlerts: 'Price Alerts',
      priceAlertsDesc: 'Instant notifications when gifts reach target price',
      priceComparison: 'Price Comparison',
      priceComparisonDesc: 'Compare gift prices across different markets',
      giftComparison: 'Gift Comparison',
      giftComparisonDesc: 'Compare upgraded gift performance with charts and tables',
      tryNow: 'Try Now',
      comingSoon: 'Coming Soon'
    }
  };

  const text = t[language] || t.en;
  const isRTL = language === 'ar';

  const tools = [
    {
      id: 'priceComparison',
      name: text.priceComparison,
      description: text.priceComparisonDesc,
      icon: Scale,
      gradient: 'from-teal-400 to-cyan-600',
      shadowColor: 'shadow-teal-500/20',
      available: true,
      route: '/price-comparison'
    },
    {
      id: 'giftComparison',
      name: text.giftComparison,
      description: text.giftComparisonDesc,
      icon: GitCompare,
      gradient: 'from-indigo-400 to-purple-600',
      shadowColor: 'shadow-indigo-500/20',
      available: true,
      route: '/gift-comparison'
    },
    {
      id: 'giftCalculator',
      name: text.giftCalculator,
      description: text.giftCalculatorDesc,
      icon: User,
      gradient: 'from-pink-500 to-rose-500',
      shadowColor: 'shadow-pink-500/20',
      available: true,
      route: '/user-gift-calculator',
      action: null
    },
    {
      id: 'nftProfit',
      name: text.nftProfit,
      description: text.nftProfitDesc,
      icon: Wallet,
      gradient: 'from-purple-500 to-violet-600',
      shadowColor: 'shadow-purple-500/20',
      available: true,
      route: '/nft-profit'
    },
    {
      id: 'priceAlerts',
      name: text.priceAlerts,
      description: text.priceAlertsDesc,
      icon: Bell,
      gradient: 'from-amber-400 to-orange-500',
      shadowColor: 'shadow-amber-500/20',
      available: true,
      route: '/price-alerts'
    },
    {
      id: 'heatmap',
      name: text.heatmap,
      description: text.heatmapDesc,
      icon: Grid3X3,
      gradient: 'from-emerald-400 to-green-600',
      shadowColor: 'shadow-emerald-500/20',
      available: true,
      route: '/heatmap'
    },
    {
      id: 'marketStats',
      name: text.marketStats,
      description: text.marketStatsDesc,
      icon: TrendingUp,
      gradient: 'from-blue-400 to-indigo-600',
      shadowColor: 'shadow-blue-500/20',
      available: true,
      route: '/market-stats'
    },
    {
      id: 'analytics',
      name: text.analytics,
      description: text.analyticsDesc,
      icon: BarChart3,
      gradient: 'from-cyan-400 to-blue-500',
      shadowColor: 'shadow-cyan-500/20',
      available: false,
      route: null
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24 font-sans">
      {/* Header with Glassmorphism */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className={cn(
          "flex items-center gap-4 p-4 max-w-5xl mx-auto",
          isRTL && "flex-row-reverse"
        )}>
          <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <div className={cn("flex flex-col", isRTL && "items-end")}>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {text.tools}
            </h1>
            <p className="text-xs text-muted-foreground font-medium">{text.toolsDesc}</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-5xl mx-auto space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  if (!tool.available) return;
                  if (tool.action) {
                    tool.action();
                  } else if (tool.route) {
                    navigate(tool.route);
                  }
                }}
                disabled={!tool.available}
                className={cn(
                  "group relative w-full text-left overflow-hidden",
                  "bg-card hover:bg-card-elevated border border-border/50 rounded-2xl p-5",
                  "transition-all duration-300 ease-out",
                  tool.available
                    ? "hover:scale-[1.02] hover:shadow-lg hover:border-primary/30 cursor-pointer"
                    : "opacity-60 cursor-not-allowed grayscale-[0.5]"
                )}
              >
                {/* Hover Gradient Glow */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500",
                  `bg-gradient-to-br ${tool.gradient}`
                )} />

                <div className={cn(
                  "relative flex items-center gap-5",
                  isRTL && "flex-row-reverse text-right"
                )}>
                  {/* Icon Container */}
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                    "bg-gradient-to-br shadow-md transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                    tool.gradient,
                    tool.shadowColor
                  )}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "flex items-center gap-2 mb-1.5",
                      isRTL && "flex-row-reverse"
                    )}>
                      <h3 className="text-foreground font-bold text-lg tracking-tight group-hover:text-primary transition-colors">
                        {tool.name}
                      </h3>
                      {!tool.available && (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider rounded-full border border-amber-500/20">
                          {text.comingSoon}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  {tool.available && (
                    <div className={cn(
                      "w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center",
                      "text-muted-foreground group-hover:text-primary group-hover:bg-primary/10",
                      "transition-all duration-300",
                      isRTL && "rotate-180"
                    )}>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ToolsPage;
