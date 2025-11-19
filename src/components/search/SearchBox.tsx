import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface SearchBoxProps {
  mode: 'user' | 'gift';
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export const SearchBox = React.memo(({
  mode,
  value,
  placeholder,
  disabled,
  onChange,
  onSearch
}: SearchBoxProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      onSearch();
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
        disabled={disabled}
      />
      <Button
        onClick={onSearch}
        disabled={disabled || !value.trim()}
        className="h-12 px-5 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
      >
        <Search className="w-5 h-5" />
      </Button>
    </div>
  );
});

SearchBox.displayName = 'SearchBox';
