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
  _id: string;
  number?: number;
  name?: string;
  backdrop_color?: string;
  pattern_color?: string;
  symbol_color?: string;
  rarity?: number;
  priceTon?: number;
  priceUsd?: number;
  tonPrice24hAgo?: number;
  usdPrice24hAgo?: number;
  image?: string;
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
  onBuy: (giftName: string, quantity: number, modelId?: string, modelName?: string, modelImageUrl?: string) => Promise<void>;
  isBuying: boolean;
  isRTL: boolean;
}

export function GiftDetailSheet({ gift, isOpen, onClose, onBuy, isBuying, isRTL }: GiftDetailSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
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
      // Use the same API as GiftDetail page for better chart data
      const response = await fetch(`https://www.channelsseller.site/api/gift/${encodeURIComponent(giftName)}/data`, {
        headers: {
          'Accept': 'application/json',
          ...headers,
        },
      });
      if (response.ok) {
        const rawData = await response.json();
        // Transform to expected format
        const transformedData: GiftDetailData = {
          gift_info: rawData.info || {},
          market_data: rawData.info || {},
          chart_data: rawData.life_chart || rawData.week_chart || [],
        };
        // Add models if available - models come at root level, not inside info
        if (rawData.models && rawData.models.length > 0) {
          transformedData.gift_info.models = rawData.models;
        } else if (rawData.info?.models) {
          transformedData.gift_info.models = rawData.info.models;
        }
        setDetailData(transformedData);
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
    let modelId = undefined;
    let modelName = undefined;
    let modelImageUrl = undefined;
    if (selectedModel !== null && models.length > 0) {
      const selectedModelData = models.find(m => m._id === selectedModel);
      if (selectedModelData) {
        modelId = selectedModelData._id;
        modelName = selectedModelData.name || `Model #${selectedModelData.number || ''}`;
        modelImageUrl = selectedModelData.image;
      }
    }
    
    await onBuy(gift.name, quantity, modelId, modelName, modelImageUrl);
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

  // Get models from detail data - API returns array of models
  const models: GiftModel[] = detailData?.gift_info?.models || [];
  
  // Get market data for current prices
  const marketData = detailData?.market_data || {};
  const currentPriceTon = marketData.priceTon || gift.priceTon || 0;
  const currentPriceUsd = marketData.priceUsd || gift.priceUsd || 0;
  const currentChange = marketData.change_24h_ton_percent ?? gift.change_24h_ton_percent ?? 0;
  
  // Get selected model price if a model is selected
  const selectedModelData = selectedModel !== null ? models.find(m => m._id === selectedModel) : null;
  const displayPriceTon = selectedModelData?.priceTon ?? currentPriceTon;
  const displayPriceUsd = selectedModelData?.priceUsd ?? currentPriceUsd;
  const displayChange = selectedModelData ? 
    (selectedModelData.tonPrice24hAgo && selectedModelData.tonPrice24hAgo > 0 && selectedModelData.priceTon ? 
      ((selectedModelData.priceTon - selectedModelData.tonPrice24hAgo) / selectedModelData.tonPrice24hAgo) * 100 : 0) 
    : currentChange;
  
  const changePercent = displayChange;
  const isPositive = changePercent >= 0;
  const totalCostTon = displayPriceTon * quantity;
  const totalCostUsd = displayPriceUsd * quantity;

  // Prepare chart data - handle life_chart format from API
  const chartData = (detailData?.chart_data || []).map((item: any) => {
    let formattedDate = '';
    
    try {
      // Handle different date formats
      const dateStr = item.date || item.timestamp;
      if (dateStr) {
        // Try parsing DD-MM-YYYY format first
        const parts = dateStr.split('-');
        let date: Date;
        if (parts.length === 3 && parts[0].length <= 2) {
          // DD-MM-YYYY format
          date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          date = new Date(dateStr);
        }
        if (!isNaN(date.getTime())) {
          formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      }
    } catch (e) {
      console.error('Error formatting date:', e);
    }
    
    // Handle both priceTon and price formats
    const price = item.priceTon ?? item.price ?? item.price_ton ?? 0;
    
    return {
      date: formattedDate || 'N/A',
      price: parseFloat(String(price)) || 0,
    };
  }).filter((item: any) => item.date !== 'N/A' && item.price > 0).slice(-50); // Last 50 data points

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="glass-effect border-t border-border/50 rounded-t-3xl h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className={cn("flex items-center gap-3 pb-4 border-b border-border/30 shrink-0", isRTL && "flex-row-reverse")}>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
          </Button>
          <h2 className="text-lg font-bold flex-1">{gift.name}</h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
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
                  "w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors",
                  isRTL && "flex-row-reverse"
                )}
              >
                {selectedModel !== null && selectedModelData ? (
                  <>
                    {/* Model Image */}
                    <div className="relative shrink-0">
                      {selectedModelData.image ? (
                        <img
                          src={selectedModelData.image}
                          alt={selectedModelData.name || `Model #${selectedModelData.number || ''}`}
                          className="w-12 h-12 rounded-lg object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (selectedModelData.backdrop_color) {
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const div = document.createElement('div');
                                div.className = 'w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xs font-bold';
                                div.style.backgroundColor = selectedModelData.backdrop_color || '#666';
                                div.textContent = selectedModelData.name || `#${selectedModelData.number || ''}`;
                                parent.appendChild(div);
                              }
                            } else {
                              target.src = 'https://placehold.co/48x48?text=M';
                            }
                          }}
                        />
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: selectedModelData.backdrop_color || '#666' }}
                        >
                          {selectedModelData.name || `#${selectedModelData.number || ''}`}
                        </div>
                      )}
                    </div>
                    
                    {/* Model Info */}
                    <div className={cn("flex-1 text-left", isRTL && "text-right")}>
                      <p className="font-semibold text-sm">
                        {selectedModelData.name || `Model #${selectedModelData.number || ''}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1">
                          <TonIcon className="w-3 h-3" />
                          <span className="text-sm font-semibold">{formatNumber(selectedModelData.priceTon || 0)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ${formatNumber(selectedModelData.priceUsd || 0)}
                        </span>
                      </div>
                    </div>
                    
                    <ChevronDown className={cn("w-4 h-4 transition-transform shrink-0", showModelSelector && "rotate-180")} />
                  </>
                ) : (
                  <>
                    <span className="flex-1">
                      {isRTL ? 'أي موديل (عشوائي)' : 'Any Model (Random)'}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showModelSelector && "rotate-180")} />
                  </>
                )}
              </button>
              
              {showModelSelector && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  <button
                    onClick={() => { setSelectedModel(null); setShowModelSelector(false); }}
                    className={cn(
                      "col-span-full p-2 rounded-lg transition-colors border text-center text-sm",
                      selectedModel === null ? "bg-primary/20 text-primary border-primary" : "hover:bg-muted/30 border-border/50 bg-secondary/30",
                    )}
                  >
                    {isRTL ? 'أي موديل' : 'Any Model'}
                  </button>
                  {models.map((model: any, index: number) => {
                    if (!model.priceTon || model.priceTon === null) return null;
                    
                    const modelPrice = model.priceTon || 0;
                    const price24hAgo = model.tonPrice24hAgo;
                    const modelChange = (price24hAgo && price24hAgo > 0 && modelPrice > 0)
                      ? ((modelPrice - price24hAgo) / price24hAgo) * 100 
                      : 0;
                    const isModelPositive = modelChange >= 0;
                    const modelName = model.name || `Model #${index + 1}`;
                    const modelId = model._id || `model-${index}`;
                    
                    const getRarityPercent = (rarity: number) => {
                      switch (rarity) {
                        case 1: return '50%';
                        case 2: return '25%';
                        case 3: return '15%';
                        case 4: return '7%';
                        case 5: return '3%';
                        default: return '50%';
                      }
                    };
                    
                    const getRarityColor = (rarity: number) => {
                      switch (rarity) {
                        case 1: return 'text-gray-400';
                        case 2: return 'text-green-500';
                        case 3: return 'text-blue-500';
                        case 4: return 'text-purple-500';
                        case 5: return 'text-yellow-500';
                        default: return 'text-gray-400';
                      }
                    };
                    
                    return (
                      <button
                        key={modelId}
                        onClick={() => { setSelectedModel(modelId); setShowModelSelector(false); }}
                        className={cn(
                          "p-2 rounded-lg transition-colors border flex flex-col items-center gap-1",
                          selectedModel === modelId ? "bg-primary/20 text-primary border-primary" : "hover:bg-muted/30 border-border/50 bg-secondary/30",
                        )}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
                          <img
                            src={model.image}
                            alt={modelName}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=M';
                            }}
                          />
                        </div>
                        
                        <p className="font-medium text-[10px] text-foreground truncate w-full text-center leading-tight">
                          {modelName}
                        </p>
                        <span className={cn("text-[10px] font-semibold", getRarityColor(Math.round(model.rarity || 1)))}>
                          {getRarityPercent(Math.round(model.rarity || 1))}
                        </span>
                        
                        <div className="flex items-center gap-0.5 font-semibold text-foreground">
                          <TonIcon className="w-2.5 h-2.5" />
                          <span className="text-[10px]">{modelPrice.toFixed(1)}</span>
                        </div>
                        {modelChange !== 0 && (
                          <div className={cn(
                            "flex items-center gap-0.5 text-[9px] font-semibold",
                            isModelPositive ? "text-success" : "text-destructive"
                          )}>
                            {isModelPositive ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                            <span>{isModelPositive ? '+' : ''}{modelChange.toFixed(1)}%</span>
                          </div>
                        )}
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
        </div>

        {/* Fixed Buy Button at Bottom */}
        <div className="shrink-0 pt-4 border-t border-border/30">
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
