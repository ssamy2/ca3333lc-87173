/**
 * ============================================================================
 * NOVA THEME TOGGLE - Premium Theme Switcher
 * Protocol: CODE_DIRECT_REFACTOR_IMAGE_CACHE_2026
 * ============================================================================
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Monitor, Sparkles } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, isLight, isDark } = useTheme();

  const getIcon = () => {
    if (theme === 'light') return <Sun className="w-4 h-4" />;
    if (theme === 'dark') return <Moon className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const getThemeLabel = () => {
    if (theme === 'light') return 'Arctic';
    if (theme === 'dark') return 'Obsidian';
    return 'System';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn(
            "h-10 gap-2.5 px-4 rounded-xl",
            "bg-card/50 backdrop-blur-sm",
            "border border-border/40 hover:border-primary/40",
            "hover:bg-primary/10 hover:text-primary",
            "transition-all duration-300",
            "shadow-sm hover:shadow-md hover:shadow-primary/10"
          )}
        >
          <div className={cn(
            "p-1 rounded-lg",
            isDark ? "bg-primary/20" : "bg-warning/20"
          )}>
            {getIcon()}
          </div>
          <span className="text-xs font-semibold">{getThemeLabel()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={cn(
          "w-44 p-2 rounded-xl",
          "bg-card/95 backdrop-blur-xl",
          "border border-border/40",
          "shadow-xl shadow-black/10 dark:shadow-black/40"
        )}
      >
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className={cn(
            "gap-3 rounded-lg cursor-pointer px-3 py-2.5 transition-all duration-200",
            theme === 'light' 
              ? 'bg-gradient-to-r from-warning/20 to-warning/10 text-warning font-semibold' 
              : 'hover:bg-muted'
          )}
        >
          <div className={cn(
            "p-1.5 rounded-lg",
            theme === 'light' ? "bg-warning/20" : "bg-muted"
          )}>
            <Sun className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm">Arctic Light</span>
            <span className="text-[10px] text-muted-foreground">Pure & Clean</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className={cn(
            "gap-3 rounded-lg cursor-pointer px-3 py-2.5 transition-all duration-200",
            theme === 'dark' 
              ? 'bg-gradient-to-r from-primary/20 to-accent/10 text-primary font-semibold' 
              : 'hover:bg-muted'
          )}
        >
          <div className={cn(
            "p-1.5 rounded-lg",
            theme === 'dark' ? "bg-primary/20" : "bg-muted"
          )}>
            <Moon className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm">Obsidian Dark</span>
            <span className="text-[10px] text-muted-foreground">Deep & Premium</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className={cn(
            "gap-3 rounded-lg cursor-pointer px-3 py-2.5 transition-all duration-200",
            theme === 'system' 
              ? 'bg-gradient-to-r from-muted to-muted/50 text-foreground font-semibold' 
              : 'hover:bg-muted'
          )}
        >
          <div className={cn(
            "p-1.5 rounded-lg",
            theme === 'system' ? "bg-muted" : "bg-muted/50"
          )}>
            <Monitor className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm">System</span>
            <span className="text-[10px] text-muted-foreground">Match device</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;