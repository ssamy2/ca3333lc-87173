import { cn } from '@/lib/utils';
import { BarChart3, Briefcase, Trophy } from 'lucide-react';

type TabType = 'market' | 'portfolio' | 'leaderboard';

interface TradingTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isRTL: boolean;
}

export function TradingTabs({ activeTab, onTabChange, isRTL }: TradingTabsProps) {
  const tabs: { id: TabType; label: string; labelAr: string; icon: React.ReactNode }[] = [
    { 
      id: 'market', 
      label: 'Market', 
      labelAr: 'السوق',
      icon: <BarChart3 className="w-4 h-4" />
    },
    { 
      id: 'portfolio', 
      label: 'Portfolio', 
      labelAr: 'محفظتي',
      icon: <Briefcase className="w-4 h-4" />
    },
    { 
      id: 'leaderboard', 
      label: 'Leaderboard', 
      labelAr: 'المتصدرين',
      icon: <Trophy className="w-4 h-4" />
    },
  ];

  return (
    <div className={cn(
      "flex gap-1 p-1 glass-effect rounded-xl mb-4",
      isRTL && "flex-row-reverse"
    )}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200",
            activeTab === tab.id
              ? "bg-primary text-primary-foreground shadow-lg"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            isRTL && "flex-row-reverse"
          )}
        >
          {tab.icon}
          <span className="hidden sm:inline">
            {isRTL ? tab.labelAr : tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
