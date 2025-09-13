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
      <div className="relative">
        <Switch
          checked={!isLight}
          onCheckedChange={handleToggle}
          className="relative h-8 w-16 bg-gradient-to-r from-blue-400 via-purple-500 to-purple-600 data-[state=unchecked]:from-yellow-300 data-[state=unchecked]:via-orange-400 data-[state=unchecked]:to-yellow-500 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
        />
        <div className={`absolute top-1 transition-all duration-300 ${isLight ? 'left-1' : 'left-9'} w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center pointer-events-none`}>
          {isLight ? (
            <Sun className="w-4 h-4 text-yellow-600" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeToggle;