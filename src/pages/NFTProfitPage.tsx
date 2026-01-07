import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown, 
  Loader2, 
  ArrowLeft, 
  Search,
  RefreshCw,
  Wallet,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import TonIcon from '@/components/TonIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface NFTProfitGift {
  id: string | null;
  gift_name: string;
  model: string | null;
  backdrop: string | null;
  rarity: number | null;
  mint: number | null;
  quantity: number;
  image: string | null;
  link: string | null;
  is_upgraded: boolean;
  current_price_ton: number;
  current_price_usd: number;
  current_value_ton: number;
  current_value_usd: number;
  change_24h_percent: number | null;
  change_7d_percent: number | null;
  change_30d_percent: number | null;
  change_90d_percent: number | null;
  change_365d_percent: number | null;
  max_history_change_percent: number | null;
  pnl_ton: number | null;
  pnl_percent: number | null;
}

interface NFTProfitData {
  username: string;
  user_id: number | null;
  profile_information: {
    full_name?: string;
    profile_image?: string;
  } | null;
  total_current_value_ton: number;
  total_current_value_usd: number;
  total_profit_loss_ton: number | null;
  total_profit_loss_usd: number | null;
  total_return_percent: number | null;
  daily_change_percent: number | null;
  weekly_change_percent: number | null;
  monthly_change_percent: number | null;
  quarterly_change_percent: number | null;
  yearly_change_percent: number | null;
  max_history_change_percent: number | null;
  total_upgraded_count: number;
  total_regular_count: number;
  total_gifts_count: number;
  upgraded_value_ton: number;
  upgraded_value_usd: number;
  regular_value_ton: number;
  regular_value_usd: number;
  gifts: NFTProfitGift[];
  ton_usd_rate: number;
  last_updated: string;
}

const NFTProfitPage = () => {
  const { language } = useLanguage();
  const { username: authUsername, authToken } = useAuth();
  const navigate = useNavigate();
  const isRTL = language === 'ar';
  
  const [username, setUsername] = useState(authUsername || '');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<NFTProfitData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllGifts, setShowAllGifts] = useState(false);

  const formatNumber = (num: number | undefined | null) => {
    const value = num ?? 0;
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatPercent = (num: number | undefined | null) => {
    if (num === null || num === undefined) return '—';
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return '/placeholder.svg';
    if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('/api/')) {
      return `${API_BASE_URL}${imageUrl}`;
    }
    return imageUrl;
  };

  const fetchNFTProfit = async () => {
    if (!username.trim()) {
      toast.error(isRTL ? 'الرجاء إدخال اسم المستخدم' : 'Please enter a username');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${username.trim()}/nft-profit`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        toast.success(
          isRTL 
            ? `تم تحميل بيانات ${result.data.total_gifts_count} هدية` 
            : `Loaded ${result.data.total_gifts_count} gifts data`
        );
      } else {
        setError(result.error || (isRTL ? 'فشل في تحميل البيانات' : 'Failed to load data'));
        toast.error(result.error || (isRTL ? 'فشل في تحميل البيانات' : 'Failed to load data'));
      }
    } catch (err) {
      console.error('NFT Profit fetch error:', err);
      setError(isRTL ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
      toast.error(isRTL ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const sortedGifts = useMemo(() => {
    if (!data?.gifts) return [];
    return [...data.gifts].sort((a, b) => {
      const valueA = a.current_value_ton || 0;
      const valueB = b.current_value_ton || 0;
      return valueB - valueA;
    });
  }, [data?.gifts]);

  const displayedGifts = showAllGifts ? sortedGifts : sortedGifts.slice(0, 6);

  const isPositivePnl = (data?.total_profit_loss_ton ?? 0) >= 0;
  const isDailyPositive = (data?.daily_change_percent ?? 0) >= 0;

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50 -mx-4 px-4 py-3 mb-4">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20"
            >
              <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
            </button>
            <div className={isRTL ? "text-right" : ""}>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {isRTL ? 'أرباح الهدايا' : 'NFT Profit'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isRTL ? 'تتبع أرباح وخسائر هداياك' : 'Track your gifts profit & loss'}
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="glass-effect rounded-2xl p-4 mb-4">
          <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
            <Input
              type="text"
              placeholder={isRTL ? 'أدخل اسم المستخدم...' : 'Enter username...'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchNFTProfit()}
              className={cn("flex-1", isRTL && "text-right")}
              dir={isRTL ? "rtl" : "ltr"}
            />
            <Button onClick={fetchNFTProfit} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="glass-effect rounded-2xl p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={fetchNFTProfit}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {isRTL ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div className="space-y-4">
            {/* Daily Return Card */}
            {data.daily_change_percent !== null && (
              <div className={cn(
                "glass-effect rounded-xl p-3 border",
                isDailyPositive ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"
              )}>
                <div className={cn(
                  "flex items-center justify-between",
                  isRTL && "flex-row-reverse"
                )}>
                  <span className="text-xs text-muted-foreground">
                    {isRTL ? 'التغير اليومي' : "Today's Change"}
                  </span>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-bold",
                    isDailyPositive ? "text-success" : "text-destructive"
                  )}>
                    {isDailyPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {formatPercent(data.daily_change_percent)}
                  </div>
                </div>
              </div>
            )}

            {/* Total Value Card */}
            <div className={cn(
              "glass-effect rounded-2xl p-4 border-2",
              isPositivePnl 
                ? "border-success/30 bg-success/5" 
                : "border-destructive/30 bg-destructive/5"
            )}>
              <div className={cn(
                "flex items-center justify-between mb-3",
                isRTL && "flex-row-reverse"
              )}>
                <span className="text-sm text-muted-foreground">
                  {isRTL ? 'إجمالي القيمة' : 'Total Portfolio Value'}
                </span>
                {data.total_return_percent !== null && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium",
                    isPositivePnl ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                  )}>
                    {isPositivePnl ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {formatPercent(data.total_return_percent)}
                  </div>
                )}
              </div>
              
              <div className={cn(
                "flex items-center gap-2 mb-2",
                isRTL && "flex-row-reverse justify-end"
              )}>
                <TonIcon className="w-6 h-6" />
                <span className="text-2xl font-bold text-foreground">
                  {formatNumber(data.total_current_value_ton)}
                </span>
              </div>
              
              <div className={cn(
                "flex items-center justify-between text-sm",
                isRTL && "flex-row-reverse"
              )}>
                <span className="text-muted-foreground">
                  ≈ ${formatNumber(data.total_current_value_usd)}
                </span>
                {data.total_profit_loss_ton !== null && (
                  <span className={cn(
                    "font-medium",
                    isPositivePnl ? "text-success" : "text-destructive"
                  )}>
                    {isPositivePnl ? '+' : ''}{formatNumber(data.total_profit_loss_ton)} TON
                  </span>
                )}
              </div>
            </div>

            {/* Period Changes Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* 7D Change */}
              {data.weekly_change_percent !== null && (
                <div className="glass-effect rounded-xl p-3">
                  <div className={cn("flex items-center gap-2 mb-1", isRTL && "flex-row-reverse")}>
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {isRTL ? '7 أيام' : '7 Days'}
                    </span>
                  </div>
                  <div className={cn(
                    "text-sm font-bold",
                    (data.weekly_change_percent ?? 0) >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {formatPercent(data.weekly_change_percent)}
                  </div>
                </div>
              )}
              
              {/* 30D Change */}
              {data.monthly_change_percent !== null && (
                <div className="glass-effect rounded-xl p-3">
                  <div className={cn("flex items-center gap-2 mb-1", isRTL && "flex-row-reverse")}>
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {isRTL ? '30 يوم' : '30 Days'}
                    </span>
                  </div>
                  <div className={cn(
                    "text-sm font-bold",
                    (data.monthly_change_percent ?? 0) >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {formatPercent(data.monthly_change_percent)}
                  </div>
                </div>
              )}
              
              {/* 90D Change */}
              {data.quarterly_change_percent !== null && (
                <div className="glass-effect rounded-xl p-3">
                  <div className={cn("flex items-center gap-2 mb-1", isRTL && "flex-row-reverse")}>
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {isRTL ? '3 أشهر' : '3 Months'}
                    </span>
                  </div>
                  <div className={cn(
                    "text-sm font-bold",
                    (data.quarterly_change_percent ?? 0) >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {formatPercent(data.quarterly_change_percent)}
                  </div>
                </div>
              )}
              
              {/* Max History Change */}
              {data.max_history_change_percent !== null && (
                <div className="glass-effect rounded-xl p-3">
                  <div className={cn("flex items-center gap-2 mb-1", isRTL && "flex-row-reverse")}>
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {isRTL ? 'منذ البداية' : 'All Time'}
                    </span>
                  </div>
                  <div className={cn(
                    "text-sm font-bold",
                    (data.max_history_change_percent ?? 0) >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {formatPercent(data.max_history_change_percent)}
                  </div>
                </div>
              )}
            </div>

            {/* Value Breakdown */}
            <div className="glass-effect rounded-xl p-3">
              <div className={cn("flex items-center gap-2 mb-3", isRTL && "flex-row-reverse")}>
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  {isRTL ? 'تفاصيل القيمة' : 'Value Breakdown'}
                </span>
              </div>
              <div className="space-y-2">
                <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                  <span className="text-muted-foreground">
                    {isRTL ? 'الهدايا المطورة' : 'Upgraded Gifts'} ({data.total_upgraded_count})
                  </span>
                  <span className="font-medium">{formatNumber(data.upgraded_value_ton)} TON</span>
                </div>
                <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                  <span className="text-muted-foreground">
                    {isRTL ? 'الهدايا العادية' : 'Regular Gifts'} ({data.total_regular_count})
                  </span>
                  <span className="font-medium">{formatNumber(data.regular_value_ton)} TON</span>
                </div>
              </div>
            </div>

            {/* Active Gifts */}
            <div>
              <h3 className={cn(
                "text-sm font-medium text-muted-foreground mb-3",
                isRTL && "text-right"
              )}>
                {isRTL ? 'الهدايا النشطة' : 'Active Gifts'} ({data.total_gifts_count})
              </h3>
              
              <div className="space-y-2">
                {displayedGifts.map((gift, index) => {
                  const pnlPositive = (gift.pnl_percent || 0) >= 0;
                  
                  return (
                    <div
                      key={`${gift.gift_name}-${gift.mint || index}`}
                      className="glass-effect rounded-xl p-3"
                    >
                      <div className={cn(
                        "flex items-center gap-3",
                        isRTL && "flex-row-reverse"
                      )}>
                        {gift.image && (
                          <img
                            src={getImageUrl(gift.image)}
                            alt={gift.model || gift.gift_name}
                            className="w-12 h-12 rounded-lg object-cover bg-muted"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                          />
                        )}
                        
                        <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground truncate">
                              {gift.gift_name}
                            </h4>
                            {gift.quantity > 1 && (
                              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                x{gift.quantity}
                              </span>
                            )}
                          </div>
                          {gift.model && (
                            <p className="text-xs text-primary/80 truncate">
                              {gift.model}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground">
                            <p>
                              {isRTL ? 'السعر: ' : 'Price: '}
                              {formatNumber(gift.current_price_ton)} TON
                              {gift.quantity > 1 && (
                                <span className="text-muted-foreground/70">
                                  {' '}({formatNumber(gift.current_value_ton)} TON {isRTL ? 'إجمالي' : 'total'})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className={cn("text-right", isRTL && "text-left")}>
                          {gift.pnl_ton !== null && (
                            <div className={cn(
                              "text-sm font-medium",
                              pnlPositive ? "text-success" : "text-destructive"
                            )}>
                              {pnlPositive ? '+' : ''}{formatNumber(gift.pnl_ton)} TON
                            </div>
                          )}
                          {gift.pnl_percent !== null && (
                            <div className={cn(
                              "text-xs",
                              pnlPositive ? "text-success" : "text-destructive"
                            )}>
                              {formatPercent(gift.pnl_percent)}
                            </div>
                          )}
                          {gift.pnl_percent === null && gift.pnl_ton === null && (
                            <div className="text-xs text-muted-foreground">—</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {sortedGifts.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    {isRTL ? 'لا توجد هدايا' : 'No gifts found'}
                  </div>
                )}
              </div>

              {/* Show More/Less Button */}
              {sortedGifts.length > 6 && (
                <Button
                  variant="ghost"
                  onClick={() => setShowAllGifts(!showAllGifts)}
                  className={cn(
                    "w-full mt-3 flex items-center justify-center gap-2",
                    isRTL && "flex-row-reverse"
                  )}
                >
                  {showAllGifts ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      {isRTL ? 'عرض أقل' : 'Show Less'}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      {isRTL ? `عرض الكل (${sortedGifts.length})` : `Show All (${sortedGifts.length})`}
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Last Updated */}
            <div className={cn("text-xs text-muted-foreground text-center", isRTL && "text-center")}>
              {isRTL ? 'آخر تحديث: ' : 'Last updated: '}
              {new Date(data.last_updated).toLocaleString(isRTL ? 'ar' : 'en')}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!data && !loading && !error && (
          <div className="glass-effect rounded-2xl p-8 text-center">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {isRTL ? 'تتبع أرباح هداياك' : 'Track Your Gift Profits'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isRTL 
                ? 'أدخل اسم المستخدم لمشاهدة تحليل الأرباح والخسائر لهداياك' 
                : 'Enter a username to see profit/loss analysis for their gifts'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTProfitPage;
