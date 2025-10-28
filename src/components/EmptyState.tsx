import React from 'react';
import { Button } from '@/components/ui/button';
import { Search, Gift, TrendingUp } from 'lucide-react';
import novaLogo from '@/assets/nova-logo.png';
import statsLogo from '@/assets/stats-logo.png';

interface EmptyStateProps {
  onSearch: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onSearch }) => {
  return (
    <div className="relative overflow-hidden telegram-card p-8 text-center animate-fade-in border border-border/50 shadow-[var(--shadow-card)]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent rounded-full blur-3xl"></div>
      </div>

      <div className="relative">
        {/* Logo Section */}
        <div className="mb-6">
          <div className="relative w-24 h-24 mx-auto mb-5">
            <div className="w-full h-full rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10 overflow-hidden">
              <img src={novaLogo} alt="Nova Logo" className="w-16 h-16 object-contain" />
            </div>
            {/* Stats Badge */}
            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--black-gold))] to-[hsl(var(--black-copper))] p-2 shadow-lg border-2 border-background">
              <img src={statsLogo} alt="Stats" className="w-full h-full object-contain opacity-90" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold mb-2 text-gradient">Welcome to Nova!</h3>
          <p className="text-muted-foreground text-base max-w-sm mx-auto leading-relaxed">
            Discover amazing NFT collections from Telegram users. Enter a username above to start exploring.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-3 mb-6 max-w-sm mx-auto">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-foreground">Search any Telegram username</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-md">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-foreground">View NFT collections & pricing</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-foreground">Track market trends & values</span>
          </div>
        </div>

        {/* CTA Button */}
        <Button 
          onClick={onSearch} 
          className="relative h-12 px-8 rounded-xl bg-gradient-to-r from-primary via-primary/90 to-accent hover:from-primary/90 hover:via-primary hover:to-accent/90 text-white font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 group border-0"
        >
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            <span>Start Exploring</span>
          </div>
          {/* Button Shine Effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700 ease-in-out"></div>
        </Button>
      </div>
    </div>
  );
};

export default EmptyState;