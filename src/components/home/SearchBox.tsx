import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, User, Gift } from 'lucide-react';
import TonIcon from '@/components/TonIcon';

interface SearchBoxProps {
  searchMode: 'user' | 'gift';
  username: string;
  giftUrl: string;
  currentUser: string;
  loading: boolean;
  countdown: number;
  searchHistory: string[];
  onSearchModeChange: (mode: 'user' | 'gift') => void;
  onUsernameChange: (value: string) => void;
  onGiftUrlChange: (value: string) => void;
  onSearch: () => void;
  onHistorySelect: (term: string) => void;
  onHistoryRemove: (term: string) => void;
  onHistoryClear: () => void;
  t: (key: string) => string;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  searchMode,
  username,
  giftUrl,
  currentUser,
  loading,
  countdown,
  searchHistory,
  onSearchModeChange,
  onUsernameChange,
  onGiftUrlChange,
  onSearch,
  onHistorySelect,
  onHistoryRemove,
  onHistoryClear,
  t,
}) => {
  return (
    <div className="telegram-card p-5 animate-slide-up border border-border/50 shadow-[var(--shadow-card)]">
      {/* Search Mode Toggle */}
      <div className="mb-4">
        <div className="flex gap-2 bg-background/50 p-1.5 rounded-xl border border-border">
          <button
            onClick={() => onSearchModeChange('user')}
            className={`flex-1 py-2.5 px-4 rounded-lg transition-all duration-300 font-medium ${
              searchMode === 'user'
                ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4 inline-block mr-2" />
            {t('userProfile')}
          </button>
          <button
            onClick={() => onSearchModeChange('gift')}
            className={`flex-1 py-2.5 px-4 rounded-lg transition-all duration-300 font-medium ${
              searchMode === 'gift'
                ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Gift className="w-4 h-4 inline-block mr-2" />
            {t('singleGift')}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {searchMode === 'user' ? (
          <Input
            type="text"
            placeholder={currentUser ? `@${currentUser}` : t('enterUsername')}
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            className="flex-1 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
            disabled={loading || countdown > 0}
          />
        ) : (
          <Input
            type="text"
            placeholder={t('enterGiftUrl')}
            value={giftUrl}
            onChange={(e) => onGiftUrlChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            className="flex-1 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
            disabled={loading || countdown > 0}
          />
        )}
        <Button 
          onClick={onSearch}
          disabled={loading || countdown > 0 || (searchMode === 'user' ? !username.trim() : !giftUrl.trim())}
          className="h-12 px-5 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
        >
          <Search className="w-5 h-5" />
        </Button>
      </div>

      {/* Search History - Only for user mode */}
      {searchMode === 'user' && searchHistory.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">{t('recentSearches')}</p>
            <button
              onClick={onHistoryClear}
              className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('clearAll')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((term, index) => (
              <div
                key={index}
                className="relative group"
              >
                <button
                  onClick={() => onHistorySelect(term)}
                  className="pl-3 pr-7 py-1.5 bg-secondary/70 text-secondary-foreground rounded-full text-xs hover:bg-secondary transition-colors border border-border/30"
                >
                  @{term}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onHistoryRemove(term);
                  }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
                  aria-label="Remove"
                >
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Countdown Timer */}
      {countdown > 0 && (
        <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TonIcon className="w-5 h-5 text-warning animate-pulse" />
            <span className="text-sm font-medium text-warning">{t('rateLimited')}</span>
          </div>
          <p className="text-xs text-warning/80">
            {t('pleaseWait').replace('{seconds}', countdown.toString())}
          </p>
          <div className="mt-2 w-full bg-warning/20 rounded-full h-1">
            <div 
              className="bg-warning h-1 rounded-full transition-all duration-1000"
              style={{ width: `${100 - (countdown / 60) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBox;
