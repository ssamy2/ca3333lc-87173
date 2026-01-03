import { useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Loader2, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import TonIcon from '@/components/TonIcon';
import type { LeaderboardData, LeaderboardUser } from '@/services/tradingService';

interface LeaderboardTabProps {
  leaderboard: LeaderboardData | null;
  isLoading: boolean;
  isRTL: boolean;
}

export function LeaderboardTab({ leaderboard, isLoading, isRTL }: LeaderboardTabProps) {
  const [viewMode, setViewMode] = useState<'winners' | 'losers'>('winners');
  const [sortBy, setSortBy] = useState<'percent' | 'ton'>('percent');

  const formatPercent = (num: number | undefined | null) => {
    const value = num ?? 0;
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatTon = (num: number | undefined | null) => {
    const value = num ?? 0;
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
  };

  const renderUser = (user: LeaderboardUser, isWinner: boolean) => (
    <div
      key={user.user_id}
      className={cn(
        "glass-effect rounded-xl p-3 transition-all duration-200",
        "hover:bg-muted/30"
      )}
    >
      <div className={cn(
        "flex items-center gap-3",
        isRTL && "flex-row-reverse"
      )}>
        {/* Rank */}
        <div className="flex-shrink-0">
          {getRankIcon(user.rank)}
        </div>

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {user.profile_image ? (
            <img
              src={user.profile_image}
              alt={user.username || user.full_name}
              className="w-10 h-10 rounded-full object-cover border-2 border-border"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || user.full_name || 'User')}&background=random`;
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-border">
              <span className="text-sm font-bold text-primary">
                {(user.username || user.full_name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
          <h4 className="font-semibold text-foreground truncate">
            {user.full_name || user.username || `User${user.user_id}`}
          </h4>
          {user.username && (
            <p className="text-xs text-muted-foreground truncate">
              @{user.username}
            </p>
          )}
        </div>

        {/* Profit/Loss Info */}
        <div className={cn("text-right", isRTL && "text-left")}>
          {/* PnL in TON */}
          <div className={cn(
            "flex items-center gap-1 font-bold text-sm",
            isWinner ? "text-success" : "text-destructive",
            isRTL && "flex-row-reverse justify-start"
          )}>
            {isWinner ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <TonIcon className="w-3 h-3" />
            <span>{formatTon(user.total_pnl_ton)}</span>
          </div>
          {/* Return Percent */}
          <p className={cn(
            "text-xs",
            isWinner ? "text-success/80" : "text-destructive/80"
          )}>
            {formatPercent(user.return_percent)}
          </p>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!leaderboard) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        {isRTL ? 'لا توجد بيانات' : 'No data available'}
      </div>
    );
  }

  // Sort users based on selected criteria
  let users = viewMode === 'winners' 
    ? [...(leaderboard.top_winners || [])] 
    : [...(leaderboard.top_losers || [])];
  
  // Apply sorting
  if (sortBy === 'percent') {
    users.sort((a, b) => Math.abs(b.return_percent || 0) - Math.abs(a.return_percent || 0));
  } else {
    users.sort((a, b) => Math.abs(b.total_pnl_ton || 0) - Math.abs(a.total_pnl_ton || 0));
  }

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className={cn(
        "flex gap-1 p-1 glass-effect rounded-xl",
        isRTL && "flex-row-reverse"
      )}>
        <button
          onClick={() => setViewMode('winners')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
            viewMode === 'winners'
              ? "bg-success text-white shadow-lg"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            isRTL && "flex-row-reverse"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          {isRTL ? 'الرابحون' : 'Top Gainers'}
        </button>
        <button
          onClick={() => setViewMode('losers')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
            viewMode === 'losers'
              ? "bg-destructive text-white shadow-lg"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            isRTL && "flex-row-reverse"
          )}
        >
          <TrendingDown className="w-4 h-4" />
          {isRTL ? 'الخاسرون' : 'Top Losers'}
        </button>
      </div>

      {/* Stats & Sort */}
      <div className="space-y-2">
        <div className={cn(
          "flex items-center justify-between text-sm text-muted-foreground px-1",
          isRTL && "flex-row-reverse"
        )}>
          <span>
            {isRTL ? 'إجمالي المتداولين' : 'Total Traders'}: {leaderboard.total_users}
          </span>
          <span className="text-xs">
            {isRTL ? 'آخر تحديث' : 'Updated'}: {new Date(leaderboard.updated_at).toLocaleTimeString()}
          </span>
        </div>
        
        {/* Sort Options */}
        <div className={cn(
          "flex gap-2 items-center text-xs",
          isRTL && "flex-row-reverse"
        )}>
          <span className="text-muted-foreground">
            {isRTL ? 'ترتيب حسب:' : 'Sort by:'}
          </span>
          <button
            onClick={() => setSortBy('percent')}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all",
              sortBy === 'percent'
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/70 text-muted-foreground"
            )}
          >
            {isRTL ? 'النسبة المئوية' : 'Percentage'}
          </button>
          <button
            onClick={() => setSortBy('ton')}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
              sortBy === 'ton'
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/70 text-muted-foreground",
              isRTL && "flex-row-reverse"
            )}
          >
            <TonIcon className="w-3 h-3" />
            {isRTL ? 'TON' : 'TON'}
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {users.map((user) => renderUser(user, viewMode === 'winners'))}
        
        {users.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>
              {isRTL 
                ? 'لا يوجد متداولون بعد' 
                : 'No traders yet'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
