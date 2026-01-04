import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Plus, Trash2, Target, TrendingUp, Loader2, AlertCircle, ChevronDown, Gift } from 'lucide-react';
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

interface GiftData {
  name: string;
  priceTon: number;
  priceUsd: number;
  models: GiftModel[];
  image?: string;
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
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(false);

  // Form state
  const [selectedGift, setSelectedGift] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [targetPrice, setTargetPrice] = useState('');
  const [alertType, setAlertType] = useState<'PRICE_TARGET' | 'PERCENTAGE_CHANGE'>('PRICE_TARGET');
  const [percentageChange, setPercentageChange] = useState('');

  // Load alerts on mount
  useEffect(() => {
    loadAlerts();
    loadGifts();
  }, []);

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
      const giftsArray: GiftData[] = Object.entries(data).map(([name, giftData]: [string, any]) => ({
        name: name,
        priceTon: giftData.priceTon || 0,
        priceUsd: giftData.priceUsd || 0,
        models: giftData.models || [],
        image_url: giftData.image_url || giftData.image || ''
      }));
      
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
    if (!selectedGift || !targetPrice) {
      toast({
        title: isRTL ? 'بيانات ناقصة' : 'Missing Data',
        description: isRTL ? 'يرجى إدخال الهدية والسعر' : 'Please enter gift and price',
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

    try {
      setIsCreating(true);
      const result = await createPriceAlert(
        selectedGift,
        parseFloat(targetPrice),
        alertType,
        selectedModel === '__floor__' ? null : (selectedModel || null),
        percentageChange ? parseFloat(percentageChange) : null
      );
      
      if (result && result.success) {
        toast({
          title: isRTL ? 'تم بنجاح' : 'Success',
          description: isRTL ? 'تم إنشاء التنبيه بنجاح' : 'Price alert created successfully',
        });

        // Reset form and reload
        setSelectedGift('');
        setSelectedModel('');
        setTargetPrice('');
        setPercentageChange('');
        loadAlerts();
      } else {
        throw new Error('Invalid response');
      }
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
                      <Target className="w-4 h-4" />
                      {isRTL ? 'سعر مستهدف' : 'Price Target'}
                    </div>
                  </SelectItem>
                  <SelectItem value="PERCENTAGE_CHANGE">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {isRTL ? 'مراقبة التغيير %' : 'Percentage Change Monitor'}
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
                  {gifts.map((gift) => (
                    <SelectItem key={gift.name} value={gift.name}>
                      {gift.name} ({gift.priceTon.toFixed(4)} TON)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model Selection (if gift has models) */}
            {selectedGiftData && selectedGiftData.models.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {isRTL ? 'اختر النموذج (اختياري)' : 'Select Model (Optional)'}
                </label>
                <Select
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder={isRTL ? 'السعر العام (Floor)' : 'Floor Price'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    <SelectItem value="__floor__">
                      {isRTL ? '🏢 السعر العام (Floor)' : '🏢 Floor Price'} - {selectedGiftData.priceTon.toFixed(4)} TON
                    </SelectItem>
                    {selectedGiftData.models.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        {model.name} - {model.priceTon.toFixed(4)} TON
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Price/Percentage Input */}
            {alertType === 'PRICE_TARGET' ? (
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
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    {isRTL ? 'السعر الحالي' : 'Current Price'}
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
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    {isRTL ? 'نسبة التغيير %' : 'Change %'}
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="±5.0"
                    value={percentageChange}
                    onChange={(e) => setPercentageChange(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>
            )}

            <Button 
              onClick={handleCreateAlert} 
              disabled={isCreating || !selectedGift || !targetPrice}
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
                      {imageUrl ? (
                        <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-muted/50">
                          <GiftImage
                            imageUrl={imageUrl}
                            name={alert.gift_name}
                            shortName={alert.gift_name}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-muted/50 flex items-center justify-center">
                          <Gift className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">
                          {alert.gift_name}
                          {alert.model_name && <span className="text-xs text-muted-foreground ml-1">({alert.model_name})</span>}
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
