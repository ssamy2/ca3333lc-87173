import React from 'react';
import { Button } from '@/components/ui/button';
import TonIcon from './TonIcon';
import novaLogo from '@/assets/nova-logo.png';

interface EmptyStateProps {
  onSearch: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onSearch }) => {
  return (
    <div className="telegram-card p-8 text-center animate-fade-in">
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center overflow-hidden">
          <img src={novaLogo} alt="Nova Logo" className="w-full h-full object-cover" />
        </div>
        <h3 className="text-xl font-bold mb-2">Welcome to Nova!</h3>
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
        <img src={novaLogo} alt="Nova" className="w-4 h-4 mr-2 rounded" />
        Start Exploring
      </Button>
    </div>
  );
};

export default EmptyState;