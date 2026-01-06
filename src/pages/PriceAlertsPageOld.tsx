import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Plus, Trash2, TrendingUp, TrendingDown, Loader2, AlertCircle, Gift, Percent } from 'lucide-react';
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

interface MarketGift {
  name: string;
  priceTon: number;
  priceUsd: number;
  image_url?: string;
}

const PriceAlertsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [marketGifts, setMarketGifts] = useState<MarketGift[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(false);

  // Form state
  const [selectedGift, setSelectedGift] = useState('');
  const [alertType, setAlertType] = useState<'PRICE_TARGET' | 'PERCENTAGE_CHANGE'>('PRICE_TARGET');
  const [targetPrice, setTargetPrice] = useState('');
  const [percentageChange, setPercentageChange] = useState('');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  // Load alerts and market data on mount
  useEffect(() => {
    loadAlerts();
    loadMarketGifts();
  }, []);

  const loadMarketGifts = async () => {
    try {
      setLoadingGifts(true);
      const authHeaders = await getAuthHeaders();
      const baseUrl = DEV_MODE ? 'http://localhost:5002' : 'https://www.channelsseller.site';
      const response = await fetch(`${baseUrl}/api/market-data`, {
        headers: { 'Accept': 'application/json', ...authHeaders }
      });
      
      if (!response.ok) throw new Error('Failed to load gifts');
      const data = await response.json();
      
      const giftsArray: MarketGift[] = Object.entries(data).map(([name, giftData]: [string, any]) => ({
        name,
        priceTon: giftData.priceTon || 0,
        priceUsd: giftData.priceUsd || 0,
        image_url: giftData.image_url || ''
      })).sort((a, b) => a.name.localeCompare(b.name));
      
      setMarketGifts(giftsArray);
    } catch (error) {
      console.error('Failed to load market gifts:', error);
    } finally {
      setLoadingGifts(false);
    }
  };

  const getSelectedGiftData = () => marketGifts.find(g => g.name === selectedGift);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const data = await getUserPriceAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل تحميل التنبيهات' : 'Failed to load alerts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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
    const currentPrice = giftData?.priceTon || 0;

    try {
      setIsCreating(true);
      
      const apiUrl = DEV_MODE ? 'http://localhost:5002' : 'https://www.channelsseller.site';
      const authHeaders = await getAuthHeaders();
      
      const requestBody: any = {
        gift_name: selectedGift,
        alert_type: alertType,
        condition: condition,
        current_price_ton: currentPrice
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
      
      toast({
        title: isRTL ? 'تم بنجاح' : 'Success',
        description: isRTL ? 'تم إنشاء التنبيه بنجاح' : 'Price alert created successfully',
      });

      // Reset form and reload
      setSelectedGift('');
      setTargetPrice('');
      setPercentageChange('');
      loadAlerts();
    } catch (error: any) {
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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tools')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Price Alerts</h1>
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
            {/* Gift Selection with Thumbnail */}
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
                  <SelectValue placeholder={loadingGifts ? 'Loading...' : (isRTL ? 'اختر هدية' : 'Choose a gift')} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {marketGifts.map((gift) => (
                    <SelectItem key={gift.name} value={gift.name}>
                      <div className="flex items-center gap-2">
                        <GiftImage
                          imageUrl={gift.image_url || ''}
                          name={gift.name}
                          size="sm"
                          className="flex-shrink-0"
                        />
                        <span className="flex-1 truncate">{gift.name}</span>
                        <span className="text-muted-foreground text-xs flex-shrink-0">({gift.priceTon.toFixed(4)} TON)</span>
                      </div>
                    </SelectItem>
                  ))}
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

            {/* Alert Type Selection */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                {isRTL ? 'نوع التنبيه' : 'Alert Type'}
              </label>
              <Select
                value={alertType}
                onValueChange={(v: 'PRICE_TARGET' | 'PERCENTAGE_CHANGE') => {
                  setAlertType(v);
                  setTargetPrice('');
                  setPercentageChange('');
                }}
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
                    placeholder="0.00"
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
              disabled={isCreating || !selectedGift || (alertType === 'PRICE_TARGET' && !targetPrice) || (alertType === 'PERCENTAGE_CHANGE' && !percentageChange)}
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
                const giftData = marketGifts.find(g => g.name === alert.gift_name);
                const imageUrl = alert.image_url || giftData?.image_url;
                const currentPrice = alert.current_price_ton || giftData?.priceTon || 0;
                
                return (
                  <div
                    key={alert.alert_id}
                    className="group flex items-center justify-between p-4 bg-card/40 border border-border/50 rounded-xl hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Gift Thumbnail */}
                      <GiftImage
                        imageUrl={imageUrl || ''}
                        name={alert.gift_name}
                        size="md"
                        className="flex-shrink-0"
                      />
                      
                      {/* Alert Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md ${
                            alert.condition === 'ABOVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {alert.condition === 'ABOVE' ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                          </div>
                          <h4 className="font-semibold truncate">{alert.gift_name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          {isRTL ? 'الهدف:' : 'Target:'} 
                          <span className="text-foreground font-medium">{alert.target_price_ton.toFixed(4)} TON</span>
                        </p>
                      </div>
                      
                      {/* Current Price on Right */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">{isRTL ? 'الحالي' : 'Current'}</p>
                        <p className="font-semibold text-primary">{currentPrice.toFixed(4)} TON</p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAlert(alert.alert_id)}
                      className="opacity-50 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 flex-shrink-0 ml-2"
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
