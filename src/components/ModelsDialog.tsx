import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import TonIcon from '@/components/TonIcon';
import { toast } from 'sonner';
import { proxyImageUrl } from '@/lib/imageProxy';

interface GiftModel {
  name: string;
  image_url: string;
  price_ton: number;
  price_usd: number;
  'change_24h_ton_%': number;
  'change_24h_usd_%': number;
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
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const proxyUrl = `${SUPABASE_URL}/functions/v1/api-proxy?endpoint=${encodeURIComponent('/api/market-data')}`;
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      
      const data = await response.json();
      
      // Convert object to array and sort by price
      const modelsArray = Object.entries(data).map(([name, modelData]: [string, any]) => ({
        name,
        image_url: modelData.image_url,
        price_ton: modelData.price_ton,
        price_usd: modelData.price_usd,
        'change_24h_ton_%': modelData['change_24h_ton_%'],
        'change_24h_usd_%': modelData['change_24h_usd_%'],
      }));
      
      // Sort by price descending
      modelsArray.sort((a, b) => b.price_ton - a.price_ton);
      
      setModels(modelsArray);
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error('Failed to load models');
    } finally {
      setLoading(false);
    }
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
              const isPositive = model['change_24h_ton_%'] >= 0;
              
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
                    src={proxyImageUrl(model.image_url)}
                    alt={model.name}
                    className="w-12 h-12 rounded-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/48x48?text=NFT';
                    }}
                  />

                  {/* Name and Change % */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{model.name}</h3>
                    <p className={`text-xs font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}{model['change_24h_ton_%'].toFixed(1)}%
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 font-semibold text-foreground">
                      <TonIcon className="w-4 h-4" />
                      {model.price_ton.toFixed(2)}
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
