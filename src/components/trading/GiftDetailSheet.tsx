import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import TonIcon from '@/components/TonIcon';
import type { TradingGift } from '@/services/tradingService';
import { getAuthHeaders } from '@/lib/telegramAuth';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const BASE_URL = 'https://channelsseller.site';

interface GiftModel {
  model_number: number;
  name?: string;
  backdrop_color?: string;
  pattern_color?: string;
  symbol_color?: string;
  rarity?: string;
  price_ton?: number;
  price_usd?: number;
  change_24h_percent?: number;
  image_url?: string;
}

interface GiftDetailData {
  gift_info: any;
  market_data: any;
  chart_data: any[];
}

interface GiftDetailSheetProps {
  gift: TradingGift | null;
  isOpen: boolean;
  onClose: () => void;
  onBuy: (giftName: string, quantity: number, modelNumber?: number, modelName?: string, modelImageUrl?: string) => Promise<void>;
  isBuying: boolean;
  isRTL: boolean;
}

export function GiftDetailSheet({ gift, isOpen, onClose, onBuy, isBuying, isRTL }: GiftDetailSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<GiftDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);

  useEffect(() => {
    if (gift && isOpen) {
      // Reset detail data when opening a new gift
      setDetailData(null);
      fetchGiftDetails(gift.name);
    }
  }, [gift?.name, isOpen]);

  const fetchGiftDetails = async (giftName: string) => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BASE_URL}/api/trading/gift/${encodeURIComponent(giftName)}/details`, {
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDetailData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch gift details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!gift) return;
    
    // Find selected model data if a model is selected
    let modelName = undefined;
    let modelImageUrl = undefined;
    if (selectedModel !== null && models.length > 0) {
      const selectedModelData = models.find(m => m.model_number === selectedModel);
      if (selectedModelData) {
        modelName = `Model #${selectedModel}`;
        modelImageUrl = selectedModelData.image_url;
      }
    }
    
    await onBuy(gift.name, quantity, selectedModel ?? undefined, modelName, modelImageUrl);
    setQuantity(1);
    setSelectedModel(null);
    onClose();
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatPercent = (num: number | undefined | null) => {
    const value = num ?? 0;
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '/placeholder.svg';
    if (imageUrl.startsWith('/api/')) {
      return `${BASE_URL}${imageUrl}`;
    }
    return imageUrl;
  };

  if (!gift) return null;

  const changePercent = gift.change_24h_ton_percent ?? 0;
  const isPositive = changePercent >= 0;
  const totalCostTon = (gift.priceTon ?? 0) * quantity;
  const totalCostUsd = (gift.priceUsd ?? 0) * quantity;

  // Get models from detail data - API returns array of models
  const models: GiftModel[] = detailData?.gift_info?.models || [];
  
  // Get market data for current prices
  const marketData = detailData?.market_data || {};
  const currentPriceTon = marketData.priceTon || gift.priceTon || 0;
  const currentPriceUsd = marketData.priceUsd || gift.priceUsd || 0;
  const currentChange = marketData.change_24h_ton_percent ?? gift.change_24h_ton_percent ?? 0;

  // Prepare chart data
  const chartData = (detailData?.chart_data || []).map((item: any) => {
    const dateStr = item.date || item.timestamp;
    let formattedDate = '';
    
    try {
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      }
    } catch (e) {
      console.error('Error formatting date:', e);
    }
    
    return {
      date: formattedDate || 'N/A',
      price: parseFloat(item.price) || 0,
    };
  }).filter(item => item.date !== 'N/A' && item.price > 0).slice(-30); // Last 30 days

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="glass-effect border-t border-border/50 rounded-t-3xl h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className={cn("flex items-center gap-3 pb-4 border-b border-border/30", isRTL && "flex-row-reverse")}>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
          </Button>
          <h2 className="text-lg font-bold flex-1">{gift.name}</h2>
        </div>

        <div className="space-y-4 py-4">
          {/* Gift Info Card */}
          <div className="glass-effect rounded-xl p-4">
            <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
              <img
                src={getImageUrl(gift.image_url)}
                alt={gift.name}
                className="w-20 h-20 rounded-xl object-cover bg-muted"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              <div className={cn("flex-1", isRTL && "text-right")}>
                <div className={cn("flex items-center gap-2 mb-1", isRTL && "flex-row-reverse justify-end")}>
                  <TonIcon className="w-6 h-6" />
                  <span className="text-2xl font-bold">{formatNumber(gift.priceTon ?? 0)}</span>
                </div>
                <p className="text-muted-foreground">${formatNumber(gift.priceUsd ?? 0)} USD</p>
                <div className={cn(
                  "flex items-center gap-1 mt-2",
                  isPositive ? "text-success" : "text-destructive",
                  isRTL && "flex-row-reverse justify-end"
                )}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="font-semibold">{formatPercent(changePercent)}</span>
                  <span className="text-xs text-muted-foreground ml-1">24h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Price Chart */}
          <div className="glass-effect rounded-xl p-4">
            <h3 className={cn("text-sm font-semibold mb-3 text-muted-foreground", isRTL && "text-right")}>
              {isRTL ? 'تاريخ السعر (30 يوم)' : 'Price History (30 days)'}
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#888', fontSize: 10 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    />
                    <YAxis 
                      tick={{ fill: '#888', fontSize: 10 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)} TON`, 'Price']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                {isRTL ? 'لا توجد بيانات للرسم البياني' : 'No chart data available'}
              </div>
            )}
          </div>

          {/* Model Selector */}
          {models.length > 0 && (
            <div className="glass-effect rounded-xl p-4">
              <h3 className={cn("text-sm font-semibold mb-3 text-muted-foreground", isRTL && "text-right")}>
                {isRTL ? 'اختر الموديل' : 'Select Model'}
              </h3>
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors",
                  isRTL && "flex-row-reverse"
                )}
              >
                <span>
                  {selectedModel !== null 
                    ? `${isRTL ? 'موديل' : 'Model'} #${selectedModel}`
                    : (isRTL ? 'أي موديل (عشوائي)' : 'Any Model (Random)')
                  }
                </span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", showModelSelector && "rotate-180")} />
              </button>
              
              {showModelSelector && (
                <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                  <button
                    onClick={() => { setSelectedModel(null); setShowModelSelector(false); }}
                    className={cn(
                      "w-full p-3 rounded-lg transition-colors border",
                      selectedModel === null ? "bg-primary/20 text-primary border-primary" : "hover:bg-muted/30 border-transparent",
                      isRTL && "text-right"
                    )}
                  >
                    {isRTL ? 'أي موديل (عشوائي)' : 'Any Model (Random)'}
                  </button>
                  {models.map((model) => {
                    const modelPrice = model.price_ton || currentPriceTon;
                    const modelChange = model.change_24h_percent ?? currentChange;
                    const isModelPositive = modelChange >= 0;
                    const modelName = model.name || `Model #${model.model_number}`;
                    
                    return (
                      <button
                        key={model.model_number}
                        onClick={() => { setSelectedModel(model.model_number); setShowModelSelector(false); }}
                        className={cn(
                          "w-full p-3 rounded-lg transition-colors border",
                          selectedModel === model.model_number ? "bg-primary/20 text-primary border-primary" : "hover:bg-muted/30 border-transparent",
                        )}
                      >
                        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                          {/* Model Image */}
                          <div className="relative shrink-0">
                            {model.image_url ? (
                              <img
                                src={model.image_url}
                                alt={modelName}
                                className="w-14 h-14 rounded-lg object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (model.backdrop_color) {
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      const div = document.createElement('div');
                                      div.className = 'w-14 h-14 rounded-lg border-2 flex items-center justify-center text-xs font-bold';
                                      div.style.backgroundColor = model.backdrop_color || '#666';
                                      div.textContent = `#${model.model_number}`;
                                      parent.appendChild(div);
                                    }
                                  } else {
                                    target.src = '/placeholder.svg';
                                  }
                                }}
                              />
                            ) : (
                              <div 
                                className="w-14 h-14 rounded-lg border-2 flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: model.backdrop_color || '#666' }}
                              >
                                #{model.model_number}
                              </div>
                            )}
                          </div>
                          
                          {/* Model Info */}
                          <div className={cn("flex-1 text-left", isRTL && "text-right")}>
                            <p className="font-semibold text-sm">
                              {modelName}
                            </p>
                            {model.rarity && (
                              <p className="text-xs text-muted-foreground capitalize">
                                {model.rarity}
                              </p>
                            )}
                            <div className={cn("flex items-center gap-1 text-xs mt-1", isRTL && "flex-row-reverse justify-end")}>
                              <TonIcon className="w-3 h-3" />
                              <span className="font-semibold">{formatNumber(modelPrice)}</span>
                            </div>
                          </div>
                          
                          {/* Model Change */}
                          <div className={cn(
                            "flex items-center gap-1 text-xs font-semibold",
                            isModelPositive ? "text-success" : "text-destructive",
                            isRTL && "flex-row-reverse"
                          )}>
                            {isModelPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{formatPercent(modelChange)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Quantity Selector */}
          <div className="glass-effect rounded-xl p-4">
            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <span className="text-sm text-muted-foreground">
                {isRTL ? 'الكمية' : 'Quantity'}
              </span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="w-10 text-center font-bold text-lg">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => setQuantity(q => Math.min(100, q + 1))}
                  disabled={quantity >= 100}
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          {/* Total Cost */}
          <div className="glass-effect rounded-xl p-4">
            <p className={cn("text-sm text-muted-foreground mb-1", isRTL && "text-right")}>
              {isRTL ? 'التكلفة الإجمالية' : 'Total Cost'}
            </p>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
              <TonIcon className="w-5 h-5" />
              <span className="text-2xl font-bold">{formatNumber(totalCostTon)}</span>
              <span className="text-muted-foreground">TON</span>
            </div>
            <p className={cn("text-sm text-muted-foreground", isRTL && "text-right")}>
              ${formatNumber(totalCostUsd)} USD
            </p>
          </div>

          {/* Buy Button */}
          <Button
            onClick={handleBuy}
            disabled={isBuying}
            className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90"
          >
            {isBuying ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              isRTL ? 'شراء الآن' : 'Buy Now'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
