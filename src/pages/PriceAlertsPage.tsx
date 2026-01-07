import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Plus, Trash2, Target, TrendingUp, TrendingDown, Loader2, AlertCircle, ChevronDown, Gift, Percent } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { createPriceAlert, getUserPriceAlerts, deletePriceAlert, PriceAlert } from '@/services/apiService';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAuthHeaders } from '@/lib/telegramAuth';
import { DEV_MODE } from '@/config/devMode';
import GiftImage from '@/components/GiftImage';
import { imageCache } from '@/services/imageCache';

interface GiftModel {
  name: string;
  priceTon: number;
  priceUsd: number;
  rarity: number;
}

interface BackdropOption {
  name: string;
  price_ton: number;
  last_updated?: string;
}

interface ModelOption {
  name: string;
  price_ton: number;
  last_updated?: string;
}

interface GiftData {
  name: string;
  priceTon: number;
  priceUsd: number;
  models: GiftModel[];
  image?: string;
  image_url?: string;
}

type FilterMode = 'floor' | 'backdrop' | 'model';

const PriceAlertsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(false);

  // Form state
  const [selectedGift, setSelectedGift] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedBackdrop, setSelectedBackdrop] = useState<string>('');
  const [filterMode, setFilterMode] = useState<FilterMode>('floor');
  const [targetPrice, setTargetPrice] = useState('');
  const [alertType, setAlertType] = useState<'PRICE_TARGET' | 'PERCENTAGE_CHANGE'>('PRICE_TARGET');
  const [percentageChange, setPercentageChange] = useState('');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  
  // Available options for selected gift
  const [availableBackdrops, setAvailableBackdrops] = useState<BackdropOption[]>([]);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Load alerts on mount
  useEffect(() => {
    loadAlerts();
    loadGifts();
  }, []);
  
  // Load available options when gift is selected
  useEffect(() => {
    if (selectedGift) {
      loadGiftOptions(selectedGift);
    } else {
      setAvailableBackdrops([]);
      setAvailableModels([]);
    }
  }, [selectedGift]);
  
  const loadGiftOptions = async (giftName: string) => {
    try {
      setLoadingOptions(true);
      const authHeaders = await getAuthHeaders();
      const baseUrl = DEV_MODE ? 'http://localhost:5002' : 'https://www.channelsseller.site';
      const response = await fetch(`${baseUrl}/api/alerts/gift-options/${encodeURIComponent(giftName)}`, {
        headers: {
          'Accept': 'application/json',
          ...authHeaders
        }
      });
      
      if (!response.ok) {
        console.error('Failed to load gift options');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setAvailableBackdrops(data.backdrops || []);
        setAvailableModels(data.models || []);
        console.log(`[PriceAlerts] Loaded ${data.backdrops?.length || 0} backdrops and ${data.models?.length || 0} models for ${giftName}`);
      }
    } catch (error) {
      console.error('Failed to load gift options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const loadGifts = async () => {
    try {
      setLoadingGifts(true);
      const authHeaders = await getAuthHeaders();
      const baseUrl = DEV_MODE ? 'http://localhost:5002' : 'https://www.channelsseller.site';
      const response = await fetch(`${baseUrl}/api/market-data`, {
        headers: {
          'Accept': 'application/json',
          ...authHeaders
        }
      });
      
      if (!response.ok) throw new Error('Failed to load gifts');
      
      const data = await response.json();
      
      // Convert market data to array with image URLs
      const giftsArray: GiftData[] = Object.entries(data).map(([name, giftData]: [string, any]) => {
        const imageUrl = giftData.image_url || giftData.image || '';
        console.log(`[PriceAlerts] Gift: ${name}, image_url: ${imageUrl}`);
        return {
          name: name,
          priceTon: giftData.priceTon || 0,
          priceUsd: giftData.priceUsd || 0,
          models: giftData.models || [],
          image_url: imageUrl
        };
      });
      
      console.log(`[PriceAlerts] Loaded ${giftsArray.length} gifts`);
      console.log('[PriceAlerts] Sample gifts:', giftsArray.slice(0, 3));
      
      setGifts(giftsArray);
    } catch (error) {
      console.error('Failed to load gifts:', error);
      toast({
        title: isRTL ? 'تحذير' : 'Warning',
        description: isRTL ? 'فشل تحميل الهدايا - سيتم استخدام القائمة الفارغة' : 'Failed to load gifts - using empty list',
        variant: 'default',
      });
    } finally {
      setLoadingGifts(false);
    }
  };

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const data = await getUserPriceAlerts();
      if (Array.isArray(data)) {
        setAlerts(data);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedGiftData = () => {
    return gifts.find(g => g.name === selectedGift);
  };

  const handleCreateAlert = async () => {
    if (!selectedGift) {
      toast({
        title: isRTL ? 'بيانات ناقصة' : 'Missing Data',
        description: isRTL ? 'يرجى اختيار الهدية' : 'Please select a gift',
        variant: 'destructive',
      });
      return;
    }

    if (alertType === 'PRICE_TARGET' && !targetPrice) {
      toast({
        title: isRTL ? 'بيانات ناقصة' : 'Missing Data',
        description: isRTL ? 'يرجى إدخال السعر المستهدف' : 'Please enter target price',
        variant: 'destructive',
      });
      return;
    }

    if (alertType === 'PERCENTAGE_CHANGE' && !percentageChange) {
      toast({
        title: isRTL ? 'بيانات ناقصة' : 'Missing Data',
        description: isRTL ? 'يرجى إدخال نسبة التغيير' : 'Please enter percentage change',
        variant: 'destructive',
      });
      return;
    }

    const giftData = getSelectedGiftData();
    
    // Determine current price based on filter mode
    let currentPrice = giftData?.priceTon || 0;
    if (filterMode === 'backdrop' && selectedBackdrop) {
      const backdrop = availableBackdrops.find(b => b.name === selectedBackdrop);
      if (backdrop) currentPrice = backdrop.price_ton;
    } else if (filterMode === 'model' && selectedModel) {
      const model = availableModels.find(m => m.name === selectedModel);
      if (model) currentPrice = model.price_ton;
    }

    try {
      setIsCreating(true);
      
      const apiUrl = DEV_MODE ? 'http://localhost:5002' : 'https://www.channelsseller.site';
      const authHeaders = await getAuthHeaders();
      
      const requestBody: any = {
        gift_name: selectedGift,
        alert_type: alertType,
        condition: condition,
        current_price_ton: currentPrice,
        model_name: filterMode === 'model' ? selectedModel : null,
        backdrop_name: filterMode === 'backdrop' ? selectedBackdrop : null
      };

      if (alertType === 'PRICE_TARGET') {
        requestBody.target_price_ton = parseFloat(targetPrice);
      } else {
        requestBody.percentage_change = parseFloat(percentageChange);
        requestBody.target_price_ton = 0;
      }

      const response = await fetch(`${apiUrl}/api/alerts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create alert');
      }
      
      const result = await response.json();
      
      toast({
        title: isRTL ? 'تم بنجاح' : 'Success',
        description: isRTL ? 'تم إنشاء التنبيه بنجاح' : 'Price alert created successfully',
      });

      // Reset form and reload
      setSelectedGift('');
      setSelectedModel('');
      setSelectedBackdrop('');
      setFilterMode('floor');
      setTargetPrice('');
      setPercentageChange('');
      loadAlerts();
    } catch (error: any) {
      console.error('Error creating alert:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: error?.message || (isRTL ? 'فشل إنشاء التنبيه' : 'Failed to create alert'),
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAlert = async (id: number) => {
    try {
      await deletePriceAlert(id);
      setAlerts(alerts.filter(a => a.alert_id !== id));
      toast({
        title: isRTL ? 'تم الحذف' : 'Deleted',
        description: isRTL ? 'تم حذف التنبيه' : 'Alert deleted successfully',
      });
    } catch (error) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل حذف التنبيه' : 'Failed to delete alert',
        variant: 'destructive',
      });
    }
  };

  const selectedGiftData = getSelectedGiftData();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tools')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{isRTL ? 'تنبيهات الأسعار' : 'Price Alerts'}</h1>
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'تنبيهات فورية لتغيرات الأسعار' : 'Instant notifications for price changes'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Create Alert Section */}
        <Card className="p-4 space-y-4 border-primary/20 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Bell className="w-5 h-5" />
            <h3>{isRTL ? 'إنشاء تنبيه جديد' : 'Create New Alert'}</h3>
          </div>

          <div className="grid gap-4">
            {/* Alert Type Selection */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                {isRTL ? 'نوع التنبيه' : 'Alert Type'}
              </label>
              <Select
                value={alertType}
                onValueChange={(v: 'PRICE_TARGET' | 'PERCENTAGE_CHANGE') => setAlertType(v)}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRICE_TARGET">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      {isRTL ? 'سعر محدد' : 'Price Target'}
                    </div>
                  </SelectItem>
                  <SelectItem value="PERCENTAGE_CHANGE">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      {isRTL ? 'نسبة مئوية' : 'Percentage Change'}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gift Selection */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                {isRTL ? 'اختر الهدية' : 'Select Gift'}
              </label>
              <Select
                value={selectedGift}
                onValueChange={setSelectedGift}
                disabled={loadingGifts}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder={loadingGifts ? 'Loading...' : 'Choose a gift'} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {gifts.map((gift) => {
                    console.log(`[PriceAlerts] Rendering gift: ${gift.name}, image: ${gift.image_url}`);
                    return (
                      <SelectItem key={gift.name} value={gift.name} className="py-2">
                        <div className="flex items-center gap-2 w-full">
                          {gift.image_url ? (
                            <img 
                              src={gift.image_url} 
                              alt={gift.name}
                              className="w-6 h-6 rounded object-contain flex-shrink-0"
                              onError={(e) => {
                                console.log(`[PriceAlerts] Image error for ${gift.name}:`, gift.image_url);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                              onLoad={() => console.log(`[PriceAlerts] Image loaded for ${gift.name}`)}
                            />
                          ) : (
                            <div className="w-6 h-6 rounded bg-muted/50 flex items-center justify-center flex-shrink-0">
                              <Gift className="w-3 h-3 text-muted-foreground/50" />
                            </div>
                          )}
                          <span className="flex-1 truncate">{gift.name}</span>
                          <span className="text-muted-foreground text-xs flex-shrink-0">({gift.priceTon.toFixed(4)} TON)</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
              {/* Selected Gift Preview */}
              {selectedGift && (() => {
                const giftData = getSelectedGiftData();
                return giftData ? (
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg mt-2">
                    <GiftImage
                      imageUrl={giftData.image_url || ''}
                      name={giftData.name}
                      size="md"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{giftData.name}</p>
                      <p className="text-sm text-primary font-semibold">
                        {isRTL ? 'السعر الحالي:' : 'Current Price:'} {giftData.priceTon.toFixed(4)} TON
                      </p>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Filter Mode Selection - Floor/Backdrop/Model */}
            {selectedGift && (availableBackdrops.length > 0 || availableModels.length > 0) && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {isRTL ? 'نوع السعر المراقب' : 'Price Filter Type'}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode('floor');
                      setSelectedModel('');
                      setSelectedBackdrop('');
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      filterMode === 'floor'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    🏢 {isRTL ? 'السعر العام' : 'Floor'}
                  </button>
                  {availableBackdrops.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterMode('backdrop');
                        setSelectedModel('');
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterMode === 'backdrop'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      🎨 {isRTL ? 'خلفية' : 'Backdrop'}
                    </button>
                  )}
                  {availableModels.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterMode('model');
                        setSelectedBackdrop('');
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterMode === 'model'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      ✨ {isRTL ? 'نموذج' : 'Model'}
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Backdrop Selection */}
            {filterMode === 'backdrop' && availableBackdrops.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {isRTL ? 'اختر الخلفية' : 'Select Backdrop'}
                </label>
                <Select
                  value={selectedBackdrop}
                  onValueChange={setSelectedBackdrop}
                  disabled={loadingOptions}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder={isRTL ? 'اختر خلفية...' : 'Choose backdrop...'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {availableBackdrops.map((backdrop) => (
                      <SelectItem key={backdrop.name} value={backdrop.name}>
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${
                            backdrop.name === 'Black' ? 'bg-black' :
                            backdrop.name === 'Onyx Black' ? 'bg-gray-900' :
                            backdrop.name === 'Midnight Blue' ? 'bg-blue-900' : 'bg-gray-500'
                          }`} />
                          <span>{backdrop.name}</span>
                          <span className="text-muted-foreground">- {backdrop.price_ton.toFixed(4)} TON</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Model Selection */}
            {filterMode === 'model' && availableModels.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {isRTL ? 'اختر النموذج' : 'Select Model'}
                </label>
                <Select
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                  disabled={loadingOptions}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder={isRTL ? 'اختر نموذج...' : 'Choose model...'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {availableModels.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        {model.name} - {model.price_ton.toFixed(4)} TON
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Price/Percentage Input */}
            {alertType === 'PRICE_TARGET' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    {isRTL ? 'الشرط' : 'Condition'}
                  </label>
                  <Select
                    value={condition}
                    onValueChange={(v: 'ABOVE' | 'BELOW') => setCondition(v)}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ABOVE">
                        <div className="flex items-center gap-2 text-green-500">
                          <TrendingUp className="w-4 h-4" />
                          {isRTL ? 'أعلى من' : 'Above'}
                        </div>
                      </SelectItem>
                      <SelectItem value="BELOW">
                        <div className="flex items-center gap-2 text-red-500">
                          <TrendingDown className="w-4 h-4" />
                          {isRTL ? 'أقل من' : 'Below'}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    {isRTL ? 'السعر المستهدف (TON)' : 'Target Price (TON)'}
                  </label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="0.0000"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {isRTL ? 'نسبة التغيير (%)' : 'Percentage Change (%)'}
                </label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={isRTL ? 'مثال: 10 للارتفاع 10%' : 'e.g., 10 for 10% increase'}
                  value={percentageChange}
                  onChange={(e) => setPercentageChange(e.target.value)}
                  className="bg-background/50"
                />
                <p className="text-xs text-muted-foreground">
                  {isRTL ? 'سيتم إشعارك عند تغير السعر بهذه النسبة (زيادة أو نقصان)' : 'You will be notified when price changes by this percentage (up or down)'}
                </p>
              </div>
            )}

            <Button 
              onClick={handleCreateAlert} 
              disabled={
                isCreating || 
                !selectedGift || 
                (alertType === 'PRICE_TARGET' && !targetPrice) || 
                (alertType === 'PERCENTAGE_CHANGE' && !percentageChange) ||
                (filterMode === 'backdrop' && !selectedBackdrop) ||
                (filterMode === 'model' && !selectedModel)
              }
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {isRTL ? 'إضافة تنبيه' : 'Set Alert'}
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Active Alerts List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground px-1">
            {isRTL ? 'التنبيهات النشطة' : 'Active Alerts'}
          </h3>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed border-muted">
              <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground text-sm">
                {isRTL ? 'لا توجد تنبيهات نشطة' : 'No active alerts'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {alerts.map((alert) => {
                const giftData = gifts.find(g => g.name === alert.gift_name);
                const imageUrl = giftData?.image_url || giftData?.image;
                
                return (
                  <div
                    key={alert.alert_id}
                    className="group flex items-center justify-between p-4 bg-card/40 border border-border/50 rounded-xl hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Gift Image */}
                      <GiftImage
                        imageUrl={imageUrl || ''}
                        name={alert.gift_name}
                        size="md"
                        className="flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">
                          {alert.gift_name}
                          {alert.model_name && <span className="text-xs text-muted-foreground ml-1">(Model: {alert.model_name})</span>}
                          {alert.backdrop_name && <span className="text-xs text-muted-foreground ml-1">(Backdrop: {alert.backdrop_name})</span>}
                        </h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          {alert.alert_type === 'PRICE_TARGET' ? (
                            <>
                              {isRTL ? 'الهدف:' : 'Target:'} 
                              <span className="text-foreground font-medium">{alert.target_price_ton.toFixed(4)} TON</span>
                            </>
                          ) : (
                            <>
                              {isRTL ? 'مراقبة:' : 'Monitoring:'} 
                              <span className="text-foreground font-medium">±{alert.percentage_change}%</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAlert(alert.alert_id)}
                      className="opacity-50 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceAlertsPage;
