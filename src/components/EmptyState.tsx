import React from 'react';
import { Button } from '@/components/ui/button';
import TonIcon from './TonIcon';

interface EmptyStateProps {
  onSearch: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onSearch }) => {
  return (
    <div className="telegram-card p-8 text-center animate-fade-in">
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
          <TonIcon className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2">Welcome to NFT Gifts!</h3>
        <p className="text-muted-foreground">
          Discover amazing NFT collections from Telegram users. Enter a username above to start exploring.
        </p>
      </div>

      <div className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <TonIcon className="w-4 h-4" />
          <span>Search for any Telegram username</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <TonIcon className="w-4 h-4" />
          <span>View NFT collections and pricing</span>
        </div>
      </div>

      <Button onClick={onSearch} className="telegram-button mt-6">
        <TonIcon className="w-4 h-4 mr-2" />
        Start Exploring
      </Button>
    </div>
  );
};

export default EmptyState;