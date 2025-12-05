import { Home, TrendingUp, Wrench, Bitcoin, Settings } from 'lucide-react';
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
    { id: 'home' as const, icon: Home, label: t('home') },
    { id: 'chart' as const, icon: TrendingUp, label: t('chart') },
    { id: 'tools' as const, icon: Wrench, label: language === 'ar' ? 'أدوات' : 'Tools' },
    { id: 'crypto' as const, icon: Bitcoin, label: language === 'ar' ? 'كريبتو' : 'Crypto' },
    { id: 'settings' as const, icon: Settings, label: t('settings') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glass effect background */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410]/95 via-[#1a1410]/80 to-transparent backdrop-blur-xl" />
      
      {/* Main nav container */}
      <div className="relative mx-2 mb-2">
        <div className="bg-gradient-to-r from-[#1a1410]/95 via-[#211a14]/95 to-[#1a1410]/95 rounded-2xl border border-amber-900/30 shadow-2xl shadow-black/50">
          <div className={cn(
            "flex items-center justify-around h-16 max-w-lg mx-auto px-2",
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
                    "relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-all duration-300",
                    isActive 
                      ? "text-amber-100" 
                      : "text-amber-100/50 hover:text-amber-100/80"
                  )}
                >
                  {/* Active indicator glow */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent rounded-xl" />
                  )}
                  
                  {/* Icon container */}
                  <div className={cn(
                    "relative p-1.5 rounded-lg transition-all duration-300",
                    isActive && "bg-amber-500/20"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5 transition-all duration-300",
                      isActive && "text-amber-400 drop-shadow-[0_0_8px_rgba(217,169,79,0.5)]"
                    )} />
                  </div>
                  
                  {/* Label */}
                  <span className={cn(
                    "text-[10px] font-medium transition-all duration-300",
                    isActive && "text-amber-400"
                  )}>
                    {item.label}
                  </span>
                  
                  {/* Active dot indicator */}
                  {isActive && (
                    <div className="absolute -bottom-0.5 w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_6px_rgba(217,169,79,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;