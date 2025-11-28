import React from 'react';
import TonIcon from './TonIcon';

const LoadingState: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Loading Header */}
      <div className="telegram-card p-6 text-center">
        <TonIcon className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-muted-foreground">Fetching NFT gifts...</p>
      </div>

      {/* Loading Skeletons */}
      <div className="telegram-card p-4">
        <div className="loading-skeleton h-6 w-32 mb-3" />
        <div className="loading-skeleton h-4 w-24 mb-4" />
        
        <div className="grid grid-cols-2 gap-3">
          <div className="loading-skeleton h-16 rounded-lg" />
          <div className="loading-skeleton h-16 rounded-lg" />
        </div>
      </div>

      {/* NFT Grid Skeleton */}
      <div className="nft-grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="telegram-card p-4">
            <div className="loading-skeleton aspect-square rounded-lg mb-3" />
            <div className="loading-skeleton h-4 w-full mb-2" />
            <div className="loading-skeleton h-3 w-3/4 mb-2" />
            <div className="space-y-1">
              <div className="loading-skeleton h-3 w-full" />
              <div className="loading-skeleton h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingState;