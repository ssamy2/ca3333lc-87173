import { Home, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: 'home' | 'chart';
  onTabChange: (tab: 'home' | 'chart') => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        <button
          onClick={() => onTabChange('home')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all",
            activeTab === 'home'
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className={cn(
            "w-6 h-6 transition-all",
            activeTab === 'home' && "scale-110"
          )} />
          <span className="text-xs font-medium">Home</span>
          {activeTab === 'home' && (
            <div className="absolute bottom-0 left-1/4 w-1/2 h-1 bg-primary rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => onTabChange('chart')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all",
            activeTab === 'chart'
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <TrendingUp className={cn(
            "w-6 h-6 transition-all",
            activeTab === 'chart' && "scale-110"
          )} />
          <span className="text-xs font-medium">Charts</span>
          {activeTab === 'chart' && (
            <div className="absolute bottom-0 right-1/4 w-1/2 h-1 bg-primary rounded-t-full" />
          )}
        </button>
      </div>
    </div>
  );
};

export default BottomNav;