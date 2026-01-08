import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Plus, Trash2, Loader2, Heart, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAuthHeaders } from '@/lib/telegramAuth';
import { DEV_MODE } from '@/config/devMode';
import GiftImage from '@/components/GiftImage';
import TonIcon from '@/components/TonIcon';
import { cn } from '@/lib/utils';

interface GiftData {
  name: string;
  priceTon: number;
  priceUsd: number;
  change_24h_ton_percent?: number;
  image_url?: string;
}

const FavoritesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [favorites, setFavorites] = useState<Record<string, GiftData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [allGifts, setAllGifts] = useState<GiftData[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedGift, setSelectedGift] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFavorites();
    loadAllGifts();
  }, []);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const authHeaders = await getAuthHeaders();
      const baseUrl = DEV_MODE ? 'http://localhost:5002' : 'https://www.channelsseller.site';
      
      const response = await fetch(`${baseUrl}/api/favorites/list`, {
        headers: {
          'Accept': 'application/json',
          ...authHeaders
        }
      });
      
      if (!response.ok) throw new Error('Failed to load favorites');
      
      const data = await response.json();
      if (data.success) {
        setFavorites(data.favorites || {});
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل تحميل المفضلة' : 'Failed to load favorites',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllGifts = async () => {
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
      
      const giftsArray: GiftData[] = Object.entries(data).map(([name, giftData]: [string, any]) => ({
        name: name,
        priceTon: giftData.priceTon || 0,
        priceUsd: giftData.priceUsd || 0,
        change_24h_ton_percent: giftData.change_24h_ton_percent,
        image_url: giftData.image_url || giftData.image || ''
      }));
      
      setAllGifts(giftsArray);
    } catch (error) {
      console.error('Failed to load gifts:', error);
    } finally {
      setLoadingGifts(false);
    }
  };

  const handleAddFavorite = async () => {
    if (!selectedGift) {
      toast({
        title: isRTL ? 'بيانات ناقصة' : 'Missing Data',
        description: isRTL ? 'يرجى اختيار الهدية' : 'Please select a gift',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsAdding(true);
      const authHeaders = await getAuthHeaders();
      const baseUrl = DEV_MODE ? 'http://localhost:5002' : 'https://www.channelsseller.site';
      
      const response = await fetch(`${baseUrl}/api/favorites/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({ gift_name: selectedGift })
      });
      
      if (response.status === 409) {
        toast({
          title: isRTL ? 'تحذير' : 'Warning',
          description: isRTL ? 'الهدية موجودة بالفعل في المفضلة' : 'Gift already in favorites',
          variant: 'default',
        });
        return;
      }
      
      if (!response.ok) throw new Error('Failed to add favorite');
      
      toast({
        title: isRTL ? 'نجح' : 'Success',
        description: isRTL ? 'تمت إضافة الهدية للمفضلة' : 'Gift added to favorites',
      });
      
      setSelectedGift('');
      setShowAddDialog(false);
      loadFavorites();
    } catch (error) {
      console.error('Failed to add favorite:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل إضافة الهدية' : 'Failed to add gift',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveFavorite = async (giftName: string) => {
    try {
      const authHeaders = await getAuthHeaders();
      const baseUrl = DEV_MODE ? 'http://localhost:5002' : 'https://www.channelsseller.site';
      
      const response = await fetch(`${baseUrl}/api/favorites/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({ gift_name: giftName })
      });
      
      if (!response.ok) throw new Error('Failed to remove favorite');
      
      toast({
        title: isRTL ? 'نجح' : 'Success',
        description: isRTL ? 'تمت إزالة الهدية من المفضلة' : 'Gift removed from favorites',
      });
      
      loadFavorites();
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل إزالة الهدية' : 'Failed to remove gift',
        variant: 'destructive',
      });
    }
  };

  const filteredGifts = allGifts.filter(gift => 
    gift.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoritesList = Object.entries(favorites);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-4 p-4 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full hover:bg-primary/10"
          >
            <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <Heart className="w-5 h-5 text-primary fill-primary" />
            <h1 className="text-xl font-bold">
              {isRTL ? 'المفضلة' : 'Favorites'}
            </h1>
          </div>
          <Button
            onClick={() => setShowAddDialog(!showAddDialog)}
            size="sm"
            className="rounded-full"
          >
            <Plus className="w-4 h-4 mr-1" />
            {isRTL ? 'إضافة' : 'Add'}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Add Gift Dialog */}
        {showAddDialog && (
          <Card className="p-4 space-y-4 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                {isRTL ? 'إضافة هدية للمفضلة' : 'Add Gift to Favorites'}
              </h3>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={isRTL ? 'ابحث عن هدية...' : 'Search for a gift...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
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
                  <SelectValue placeholder={isRTL ? 'اختر هدية...' : 'Choose a gift...'} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {filteredGifts.map((gift) => (
                    <SelectItem key={gift.name} value={gift.name}>
                      <div className="flex items-center gap-3 py-1">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-muted/50 to-muted flex-shrink-0">
                          <img
                            src={gift.image_url}
                            alt={gift.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/32x32?text=G';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{gift.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {gift.priceTon.toFixed(4)} TON
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleAddFavorite}
                disabled={isAdding || !selectedGift}
                className="flex-1"
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    {isRTL ? 'إضافة' : 'Add'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setSelectedGift('');
                  setSearchQuery('');
                }}
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : favoritesList.length === 0 ? (
          /* Empty State */
          <Card className="p-8 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {isRTL ? 'لا توجد هدايا مفضلة' : 'No Favorite Gifts'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isRTL ? 'ابدأ بإضافة الهدايا المفضلة لديك' : 'Start adding your favorite gifts'}
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              {isRTL ? 'إضافة هدية' : 'Add Gift'}
            </Button>
          </Card>
        ) : (
          /* Favorites Grid */
          <div className="grid grid-cols-1 gap-3">
            {favoritesList.map(([name, gift]) => {
              const change = gift.change_24h_ton_percent || 0;
              const isPositive = change >= 0;
              
              return (
                <Card
                  key={name}
                  className="p-4 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/gift/${encodeURIComponent(name)}`)}
                >
                  <div className="flex items-center gap-4">
                    {/* Gift Image */}
                    <GiftImage
                      imageUrl={gift.image_url || ''}
                      name={name}
                      size="lg"
                      className="flex-shrink-0"
                    />
                    
                    {/* Gift Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate mb-1">{name}</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <TonIcon className="w-4 h-4" />
                          <span className="font-bold text-lg">
                            {gift.priceTon.toFixed(4)}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ${gift.priceUsd.toFixed(2)}
                        </span>
                      </div>
                      {change !== 0 && (
                        <div className={cn(
                          "text-xs font-semibold mt-1",
                          isPositive ? "text-success" : "text-destructive"
                        )}>
                          {isPositive ? '+' : ''}{change.toFixed(2)}% (24h)
                        </div>
                      )}
                    </div>
                    
                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(name);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
