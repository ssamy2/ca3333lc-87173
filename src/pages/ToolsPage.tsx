import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Grid3X3, BarChart3, ChevronRight, Wrench, TrendingUp, User, Bell, Calculator, Wallet, Scale } from 'lucide-react';
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
          "flex items-center gap-3 p-4 max-w-6xl mx-auto",
          isRTL && "flex-row-reverse"
        )}>
          <div className="p-2 bg-primary/10 rounded-lg ring-1 ring-primary/20">
            <Wrench className="w-4 h-4 text-primary" />
          </div>
          <div className={cn("flex flex-col", isRTL && "items-end")}>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {text.tools}
            </h1>
            <p className="text-xs text-muted-foreground">{text.toolsDesc}</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto space-y-4">
        {/* Tools Grid - 3 columns on desktop, 2 on tablet, 1 on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                  "bg-card/60 hover:bg-card border border-border/40 rounded-xl p-3.5",
                  "transition-all duration-300 ease-out",
                  tool.available
                    ? "hover:scale-[1.03] hover:shadow-md hover:border-primary/40 cursor-pointer"
                    : "opacity-50 cursor-not-allowed grayscale-[0.6]"
                )}
              >
                {/* Hover Gradient Glow */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500",
                  `bg-gradient-to-br ${tool.gradient}`
                )} />

                <div className={cn(
                  "relative flex items-start gap-3",
                  isRTL && "flex-row-reverse text-right"
                )}>
                  {/* Icon Container - Smaller */}
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    "bg-gradient-to-br shadow-sm transition-transform duration-300 group-hover:scale-105",
                    tool.gradient,
                    tool.shadowColor
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "flex items-center gap-1.5 mb-0.5",
                      isRTL && "flex-row-reverse"
                    )}>
                      <h3 className="text-foreground font-semibold text-sm tracking-tight group-hover:text-primary transition-colors truncate">
                        {tool.name}
                      </h3>
                      {!tool.available && (
                        <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-500 text-[9px] font-bold uppercase tracking-wider rounded-full border border-amber-500/30 flex-shrink-0">
                          {text.comingSoon}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs leading-snug line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  {/* Arrow - Smaller */}
                  {tool.available && (
                    <div className={cn(
                      "w-6 h-6 rounded-full bg-secondary/40 flex items-center justify-center flex-shrink-0",
                      "text-muted-foreground group-hover:text-primary group-hover:bg-primary/15",
                      "transition-all duration-300",
                      isRTL && "rotate-180"
                    )}>
                      <ChevronRight className="w-4 h-4" />
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
