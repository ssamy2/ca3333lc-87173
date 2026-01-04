/**
 * ============================================================================
 * NOVA LOADING STATE - Premium Loading Experience
 * Protocol: CODE_DIRECT_REFACTOR_IMAGE_CACHE_2026
 * ============================================================================
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const LoadingState: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Loading Header */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl p-8",
        "bg-card/80 backdrop-blur-xl",
        "border border-border/30",
        "shadow-lg shadow-black/5 dark:shadow-black/20"
      )}>
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 animate-gradient" />
        
        <div className="relative flex flex-col items-center">
          {/* Animated logo */}
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-primary/30 animate-ping" />
          </div>
          
          <p className="text-sm font-medium text-muted-foreground">Loading your data...</p>
          
          {/* Progress bar */}
          <div className="w-48 h-1 mt-4 bg-muted/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full animate-shimmer" 
                 style={{ width: '60%', animationDuration: '1.5s' }} />
          </div>
        </div>
      </div>

      {/* Loading Skeletons */}
      <div className={cn(
        "rounded-2xl p-5",
        "bg-card/60 backdrop-blur-xl",
        "border border-border/20"
      )}>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 bg-muted/50 rounded-lg animate-pulse" />
            <div className="h-3 w-24 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 animate-pulse" />
          <div className="h-20 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 animate-pulse" />
        </div>
      </div>

      {/* NFT Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "rounded-2xl p-4",
              "bg-card/40 backdrop-blur-xl",
              "border border-border/20",
              "animate-pulse"
            )}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="aspect-square rounded-xl bg-muted/30 mb-3" />
            <div className="h-4 w-3/4 bg-muted/40 rounded-lg mb-2" />
            <div className="h-3 w-1/2 bg-muted/30 rounded mb-3" />
            <div className="flex justify-between items-center pt-2 border-t border-border/20">
              <div className="h-3 w-12 bg-muted/30 rounded" />
              <div className="h-6 w-16 bg-primary/20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingState;