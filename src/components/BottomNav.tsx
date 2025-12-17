import { TrendingUp, Wrench, Bitcoin, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/i18n/translations';

interface BottomNavProps {
  activeTab: 'home' | 'chart' | 'tools' | 'crypto' | 'settings';
  onTabChange: (tab: 'home' | 'chart' | 'tools' | 'crypto' | 'settings') => void;
}

const BottomNav = ({
  activeTab,
  onTabChange
}: BottomNavProps) => {
  const { language } = useLanguage();
  const t = (key: keyof typeof import('@/i18n/translations').translations.en) => 
    getTranslation(language, key);
  const isRTL = language === 'ar';

  const navItems = [
    { id: 'chart' as const, icon: TrendingUp, label: t('chart') },
    { id: 'tools' as const, icon: Wrench, label: language === 'ar' ? 'أدوات' : 'Tools' },
    { id: 'crypto' as const, icon: Bitcoin, label: language === 'ar' ? 'كريبتو' : 'Crypto' },
    { id: 'settings' as const, icon: Settings, label: t('settings') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent">
      <nav className="bg-card/90 backdrop-blur-md rounded-2xl border border-border/40 shadow-lg">
        <div className={cn(
          "flex items-center justify-around h-14",
          isRTL && "flex-row-reverse"
        )}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5",
                  isActive && "text-primary"
                )} />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "text-primary"
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
