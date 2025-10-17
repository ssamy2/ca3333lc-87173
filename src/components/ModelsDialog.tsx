import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import TonIcon from '@/components/TonIcon';
import { toast } from 'sonner';

interface GiftModel {
  name: string;
  image: string;
  priceTon: number;
  priceUsd: number;
  change24h: number;
  supply: number;
}

interface ModelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ModelsDialog: React.FC<ModelsDialogProps> = ({ open, onOpenChange }) => {
  const [models, setModels] = useState<GiftModel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && models.length === 0) {
      fetchModels();
    }
  }, [open]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://channelsseller.site/api/gifts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error('Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const formatSupplyPercentage = (supply: number, totalSupply: number = 1000000) => {
    return ((supply / totalSupply) * 100).toFixed(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Models</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {models.map((model) => {
              const isPositive = model.change24h >= 0;
              
              return (
                <div
                  key={model.name}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer"
                  onClick={() => {
                    window.location.href = `/gift/${encodeURIComponent(model.name)}`;
                  }}
                >
                  {/* Image */}
                  <img
                    src={`https://channelsseller.site/api/image/${model.image}`}
                    alt={model.name}
                    className="w-12 h-12 rounded-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/48x48?text=NFT';
                    }}
                  />

                  {/* Name and Supply % */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{model.name}</h3>
                    <p className="text-xs text-primary">
                      {formatSupplyPercentage(model.supply)}%
                    </p>
                  </div>

                  {/* Price and Change */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 font-semibold text-foreground">
                      <TonIcon className="w-4 h-4" />
                      {model.priceTon.toFixed(2)}
                    </div>
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
                      {model.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModelsDialog;
