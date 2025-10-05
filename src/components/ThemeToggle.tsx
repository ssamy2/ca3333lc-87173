import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const ThemeToggle: React.FC = () => {
  const { isLight, setTheme } = useTheme();

  const handleToggle = () => {
    setTheme(isLight ? 'dark' : 'light');
  };

  return (
    <div className="flex items-center justify-end mr-4">
      <div className="relative p-1 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/20 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
        <Switch
          checked={!isLight}
          onCheckedChange={handleToggle}
          className="relative h-9 w-[72px] bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 data-[state=unchecked]:from-yellow-400 data-[state=unchecked]:via-orange-500 data-[state=unchecked]:to-amber-500 border-0 shadow-inner transition-all duration-300"
        />
        <div className={`absolute top-2 transition-all duration-300 ${isLight ? 'left-2' : 'left-[42px]'} w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-none ring-2 ring-white/50`}>
          {isLight ? (
            <Sun className="w-4 h-4 text-yellow-600 animate-pulse" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeToggle;