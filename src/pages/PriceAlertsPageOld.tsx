import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Plus, Trash2, TrendingUp, TrendingDown, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { createPriceAlert, getUserPriceAlerts, deletePriceAlert, PriceAlert } from '@/services/apiService';
import { useLanguage } from '@/contexts/LanguageContext';

const PriceAlertsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [giftName, setGiftName] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  // Load alerts on mount
  useEffect(() => {
    loadAlerts();
  }, []);

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
    if (!giftName || !targetPrice) {
      toast({
        title: isRTL ? 'بيانات ناقصة' : 'Missing Data',
        description: isRTL ? 'يرجى إدخال اسم الهدية والسعر المستهدف' : 'Please enter gift name and target price',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);
      await createPriceAlert(giftName, parseFloat(targetPrice), condition);
      
      toast({
        title: isRTL ? 'تم بنجاح' : 'Success',
        description: isRTL ? 'تم إنشاء التنبيه بنجاح' : 'Price alert created successfully',
      });

      // Reset form and reload
      setGiftName('');
      setTargetPrice('');
      loadAlerts();
    } catch (error) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل إنشاء التنبيه' : 'Failed to create alert',
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
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                {isRTL ? 'اسم الهدية' : 'Gift Name'}
              </label>
              <Input
                placeholder="e.g. Red Star"
                value={giftName}
                onChange={(e) => setGiftName(e.target.value)}
                className="bg-background/50"
              />
            </div>

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
                  placeholder="0.00"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>

            <Button 
              onClick={handleCreateAlert} 
              disabled={isCreating || !giftName || !targetPrice}
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
              {alerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className="group flex items-center justify-between p-4 bg-card/40 border border-border/50 rounded-xl hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      alert.condition === 'ABOVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {alert.condition === 'ABOVE' ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{alert.gift_name}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        {isRTL ? 'الهدف:' : 'Target:'} 
                        <span className="text-foreground font-medium">{alert.target_price_ton} TON</span>
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAlert(alert.alert_id)}
                    className="opacity-50 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceAlertsPage;
