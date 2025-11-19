import React from 'react';
import { User, Gift } from 'lucide-react';

interface ModeToggleProps {
  mode: 'user' | 'gift';
  onModeChange: (mode: 'user' | 'gift') => void;
  userLabel: string;
  giftLabel: string;
}

export const ModeToggle = React.memo(({
  mode,
  onModeChange,
  userLabel,
  giftLabel
}: ModeToggleProps) => {
  return (
    <div className="flex gap-2 bg-background/50 p-1.5 rounded-xl border border-border">
      <button
        onClick={() => onModeChange('user')}
        className={`flex-1 py-2.5 px-4 rounded-lg transition-all duration-300 font-medium ${
          mode === 'user'
            ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <User className="w-4 h-4 inline-block mr-2" />
        {userLabel}
      </button>
      <button
        onClick={() => onModeChange('gift')}
        className={`flex-1 py-2.5 px-4 rounded-lg transition-all duration-300 font-medium ${
          mode === 'gift'
            ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Gift className="w-4 h-4 inline-block mr-2" />
        {giftLabel}
      </button>
    </div>
  );
});

ModeToggle.displayName = 'ModeToggle';
