import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';
import TonIcon from '@/components/TonIcon';

interface Model {
  _id: string;
  image: string;
  name: string;
  priceTon: number;
  priceUsd: number;
  rarity: number;
  tonPrice24hAgo: number;
  usdPrice24hAgo: number;
}

interface GiftModelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  models: Model[];
  giftName: string;
}

const GiftModelsDialog: React.FC<GiftModelsDialogProps> = ({ 
  open, 
  onOpenChange, 
  models,
  giftName 
}) => {
  // Rarity is now a percentage value (e.g., 2.6, 15, 50)
  const getRarityColor = (rarity: number) => {
    if (rarity >= 50) return 'text-gray-300';       // Common (50%+)
    if (rarity >= 25) return 'text-green-500';      // Uncommon (25-50%)
    if (rarity >= 10) return 'text-blue-500';       // Rare (10-25%)
    if (rarity >= 5) return 'text-purple-500';      // Epic (5-10%)
    return 'text-yellow-500';                       // Legendary (<5%)
  };

  const getRarityBgColor = (rarity: number) => {
    if (rarity >= 50) return 'bg-gray-500/20';
    if (rarity >= 25) return 'bg-green-500/20';
    if (rarity >= 10) return 'bg-blue-500/20';
    if (rarity >= 5) return 'bg-purple-500/20';
    return 'bg-yellow-500/20';
  };

  const getRarityPercent = (rarity: number) => {
    return `${rarity.toFixed(1)}%`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{giftName} Models</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {models.map((model) => {
            try {
              // Log model data for debugging
              console.log('Rendering model:', model.name, {
                priceTon: model.priceTon,
                tonPrice24hAgo: model.tonPrice24hAgo
              });
              
              // Skip models with null prices
              if (!model.priceTon || model.priceTon === null) {
                console.log('Skipping model with null price:', model.name);
                return null;
              }
              
              const change24h = (model.tonPrice24hAgo && model.tonPrice24hAgo > 0) 
                ? ((model.priceTon - model.tonPrice24hAgo) / model.tonPrice24hAgo) * 100 
                : 0;
              const isPositive = change24h >= 0;
            
            return (
              <div
                key={model._id}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
              >
                {/* Image */}
                <img
                  src={model.image}
                  alt={model.name}
                  className="w-12 h-12 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/48x48?text=Model';
                  }}
                />

                {/* Name and Rarity */}
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{model.name}</h3>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getRarityColor(model.rarity)} ${getRarityBgColor(model.rarity)}`}>
                    <Star className="w-3 h-3" fill="currentColor" />
                    {getRarityPercent(model.rarity)}
                  </div>
                </div>

                {/* Price and Change */}
                <div className="text-right">
                  <div className="flex items-center gap-1 font-semibold text-foreground">
                    <TonIcon className="w-4 h-4" />
                    {(model.priceTon || 0).toFixed(0)}
                  </div>
                  {change24h !== 0 && (
                    <div
                      className={`text-xs font-semibold flex items-center gap-1 justify-end ${
                        isPositive ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {isPositive ? '+' : ''}
                      {change24h.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            );
            } catch (error) {
              console.error('Error rendering model:', model.name, error);
              return null;
            }
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GiftModelsDialog;
