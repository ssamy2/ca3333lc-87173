/**
 * ============================================================================
 * NOVA BOTTOM NAV - Premium Mobile Navigation
 * Protocol: CODE_DIRECT_REFACTOR_IMAGE_CACHE_2026
 * ============================================================================
 */

import { TrendingUp, Flame, Bitcoin, Settings, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/i18n/translations';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const t = (key: keyof typeof import('@/i18n/translations').translations.en) =>
    getTranslation(language, key);
  const isRTL = language === 'ar';

  const navItems = [
    { id: 'chart', icon: TrendingUp, label: t('chart'), path: '/chart' },
    { id: 'trade', icon: LineChart, label: language === 'ar' ? 'تداول' : 'Trade', path: '/trade' },
    { id: 'heatmap', icon: Flame, label: language === 'ar' ? 'خريطة' : 'Heatmap', path: '/heatmap' },
    { id: 'crypto', icon: Bitcoin, label: language === 'ar' ? 'كريبتو' : 'Crypto', path: '/crypto' },
    { id: 'settings', icon: Settings, label: t('settings'), path: '/settings' },
  ];

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '/chart') return 'chart';
    if (path.startsWith('/trade')) return 'trade';
    if (path.startsWith('/heatmap')) return 'heatmap';
    if (path.startsWith('/crypto')) return 'crypto';
    if (path.startsWith('/settings')) return 'settings';
    return '';
  };

  const activeTab = getActiveTab();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-2 pointer-events-none md:hidden">
      {/* Gradient fade effect */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent -z-10" />

      <nav className={cn(
        "relative bg-card/80 backdrop-blur-2xl rounded-2xl",
        "border border-border/30 shadow-xl shadow-black/10",
        "dark:bg-card/60 dark:border-border/20 dark:shadow-black/40",
        "pointer-events-auto overflow-hidden"
      )}>
        {/* Glassmorphism inner glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-50 pointer-events-none" />

        <div className={cn(
          "relative flex items-center justify-around h-16",
          isRTL && "flex-row-reverse"
        )}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 flex-1 h-full",
                  "transition-all duration-300 ease-out",
                  "active:scale-95",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Active indicator pill */}
                {isActive && (
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-primary to-accent" />
                )}

                {/* Icon with glow effect when active */}
                <div className={cn(
                  "relative p-1.5 rounded-xl transition-all duration-300",
                  isActive && "bg-primary/10"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive && "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                  )} />
                </div>

                {/* Label */}
                <span className={cn(
                  "text-[10px] font-semibold tracking-wide transition-all duration-300",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;
