import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import TonIcon from './TonIcon';

interface StatsCardProps {
  nftData: any;
}

const StatsCard: React.FC<StatsCardProps> = ({ nftData }) => {
  if (!nftData?.prices) return null;

  const { floor_price, avg_price } = nftData.prices;

  const formatTON = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Floor Price */}
      <div className="bg-card/50 border border-border/50 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Floor Price</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <TonIcon className="w-5 h-5 text-primary" />
            <span className="text-xl font-bold text-foreground">{formatTON(floor_price.TON)}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 font-medium">
            ${formatTON(floor_price.USD)}
          </div>
        </div>
      </div>

      {/* Avg Price */}
      <div className="bg-card/50 border border-border/50 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
          <DollarSign className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Avg Price</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <TonIcon className="w-5 h-5 text-accent" />
            <span className="text-xl font-bold text-foreground">{formatTON(avg_price.TON)}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 font-medium">
            ${formatTON(avg_price.USD)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;