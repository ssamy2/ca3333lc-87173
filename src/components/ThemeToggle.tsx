import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, isLight, isDark } = useTheme();

  const getIcon = () => {
    if (theme === 'light') return <Sun className="w-4 h-4" />;
    if (theme === 'dark') return <Moon className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const getThemeLabel = () => {
    if (theme === 'light') return 'Light';
    if (theme === 'dark') return 'Dark';
    return 'System';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 gap-2 rounded-xl border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-300 shadow-sm"
        >
          {getIcon()}
          <span className="text-xs font-medium">{getThemeLabel()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 rounded-xl border-border/50 shadow-lg">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className={`gap-2 rounded-lg cursor-pointer ${theme === 'light' ? 'bg-primary/10 text-primary font-medium' : ''}`}
        >
          <Sun className="w-4 h-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className={`gap-2 rounded-lg cursor-pointer ${theme === 'dark' ? 'bg-primary/10 text-primary font-medium' : ''}`}
        >
          <Moon className="w-4 h-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className={`gap-2 rounded-lg cursor-pointer ${theme === 'system' ? 'bg-primary/10 text-primary font-medium' : ''}`}
        >
          <Monitor className="w-4 h-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;