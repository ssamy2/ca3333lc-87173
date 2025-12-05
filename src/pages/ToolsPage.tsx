import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Grid3X3, Download, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TreemapHeatmap, TreemapHeatmapHandle } from '@/components/TreemapHeatmap';
import { useMarketData } from '@/hooks/useMarketData';
import { Button } from '@/components/ui/button';

const ToolsPage: React.FC = () => {
  const { language } = useLanguage();
  const { data: marketData, isLoading, error } = useMarketData();
  const [chartType, setChartType] = useState<'change' | 'marketcap'>('change');
  const [timeGap, setTimeGap] = useState<'24h' | '1w' | '1m'>('24h');
  const [currency, setCurrency] = useState<'ton' | 'usd'>('ton');
  const [giftMode, setGiftMode] = useState<'upgraded' | 'regular'>('upgraded');
  const heatmapRef = useRef<TreemapHeatmapHandle>(null);

  const t = {
    ar: {
      tools: 'الأدوات',
      heatmap: 'خريطة الحرارة',
      heatmapDesc: 'عرض تغيرات أسعار الهدايا بشكل مرئي',
      upgraded: 'مطورة',
      regular: 'عادية',
      change: 'التغير',
      marketCap: 'القيمة السوقية',
      day: '24س',
      week: 'أسبوع',
      month: 'شهر',
      ton: 'TON',
      usd: 'USD',
      download: 'تحميل',
      loading: 'جاري التحميل...',
      noData: 'لا توجد بيانات',
      comingSoon: 'قريباً...'
    },
    en: {
      tools: 'Tools',
      heatmap: 'Heatmap',
      heatmapDesc: 'Visualize gift price changes',
      upgraded: 'Upgraded',
      regular: 'Regular',
      change: 'Change',
      marketCap: 'Market Cap',
      day: '24h',
      week: '1W',
      month: '1M',
      ton: 'TON',
      usd: 'USD',
      download: 'Download',
      loading: 'Loading...',
      noData: 'No data available',
      comingSoon: 'Coming Soon...'
    }
  };

  const text = t[language] || t.en;

  // Transform market data for heatmap
  const transformedData = React.useMemo(() => {
    if (!marketData) return [];
    
    // Handle both old format (flat) and new format (upgraded/unupgraded)
    let gifts: [string, any][] = [];
    
    if (giftMode === 'upgraded') {
      // Check if data has 'upgraded' key (new format) or is flat (old format)
      const upgradedData = marketData.upgraded || marketData;
      gifts = Object.entries(upgradedData).filter(([key]) => 
        !key.startsWith('[Regular]') && key !== 'unupgraded' && key !== 'upgraded'
      );
    } else {
      // Regular/unupgraded gifts
      const unupgradedData = marketData.unupgraded || marketData.unupgraded_gifts || {};
      gifts = Object.entries(unupgradedData);
    }

    return gifts.map(([name, data]: [string, any]) => {
      const currentPriceTon = data.priceTon || data.price_ton || 0;
      const currentPriceUsd = data.priceUsd || data.price_usd || 0;
      
      // For regular gifts, calculate previous price from change_24h if available
      let tonPrice24hAgo = data.tonPrice24hAgo;
      let usdPrice24hAgo = data.usdPrice24hAgo;
      
      // If no 24h ago price but we have change_24h, calculate it
      if (!tonPrice24hAgo && data.change_24h !== undefined && data.change_24h !== 0) {
        // change_24h = ((current - old) / old) * 100
        // old = current / (1 + change_24h/100)
        tonPrice24hAgo = currentPriceTon / (1 + data.change_24h / 100);
        usdPrice24hAgo = currentPriceUsd / (1 + data.change_24h / 100);
      } else if (!tonPrice24hAgo) {
        tonPrice24hAgo = currentPriceTon;
        usdPrice24hAgo = currentPriceUsd;
      }
      
      return {
        name: name.replace('[Regular] ', ''),
        image: data.image_url || data.image || '',
        priceTon: currentPriceTon,
        priceUsd: currentPriceUsd,
        tonPrice24hAgo,
        usdPrice24hAgo,
        tonPriceWeekAgo: data.tonPriceWeekAgo,
        usdPriceWeekAgo: data.usdPriceWeekAgo,
        tonPriceMonthAgo: data.tonPriceMonthAgo,
        usdPriceMonthAgo: data.usdPriceMonthAgo,
        marketCapTon: data.market_cap_ton || data.marketCapTon || '0',
        marketCapUsd: data.market_cap_usd || data.marketCapUsd || '0',
        upgradedSupply: data.upgradedSupply || data.supply || 0,
        preSale: data.preSale || false,
        change_24h: data.change_24h || data['change_24h_ton_%'] || 0
      };
    });
  }, [marketData, giftMode]);

  const handleDownload = async () => {
    if (heatmapRef.current) {
      await heatmapRef.current.downloadImage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Grid3X3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{text.tools}</h1>
              <p className="text-xs text-slate-400">{text.heatmapDesc}</p>
            </div>
          </div>
          <Button
            onClick={handleDownload}
            size="sm"
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
          >
            <Download className="w-4 h-4 mr-1" />
            {text.download}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Heatmap Card */}
        <Card className="overflow-hidden bg-slate-800/50 border-white/10 rounded-2xl">
          <div className="p-4 space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap gap-2">
              {/* Gift Mode Toggle */}
              <div className="flex bg-slate-700/50 rounded-lg p-1">
                <button
                  onClick={() => setGiftMode('upgraded')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    giftMode === 'upgraded'
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {text.upgraded}
                </button>
                <button
                  onClick={() => setGiftMode('regular')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    giftMode === 'regular'
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {text.regular}
                </button>
              </div>

              {/* Chart Type Toggle */}
              <div className="flex bg-slate-700/50 rounded-lg p-1">
                <button
                  onClick={() => setChartType('change')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    chartType === 'change'
                      ? 'bg-green-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {text.change}
                </button>
                <button
                  onClick={() => setChartType('marketcap')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    chartType === 'marketcap'
                      ? 'bg-green-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {text.marketCap}
                </button>
              </div>

              {/* Time Gap Toggle */}
              <div className="flex bg-slate-700/50 rounded-lg p-1">
                {(['24h', '1w', '1m'] as const).map((time) => (
                  <button
                    key={time}
                    onClick={() => setTimeGap(time)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      timeGap === time
                        ? 'bg-purple-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {time === '24h' ? text.day : time === '1w' ? text.week : text.month}
                  </button>
                ))}
              </div>

              {/* Currency Toggle */}
              <div className="flex bg-slate-700/50 rounded-lg p-1">
                <button
                  onClick={() => setCurrency('ton')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    currency === 'ton'
                      ? 'bg-amber-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {text.ton}
                </button>
                <button
                  onClick={() => setCurrency('usd')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    currency === 'usd'
                      ? 'bg-amber-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {text.usd}
                </button>
              </div>
            </div>

            {/* Heatmap */}
            <div className="relative min-h-[400px] rounded-xl overflow-hidden bg-slate-900/50">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                </div>
              ) : transformedData.length > 0 ? (
                <TreemapHeatmap
                  ref={heatmapRef}
                  data={transformedData}
                  chartType={chartType}
                  timeGap={timeGap}
                  currency={currency}
                  isRegularMode={giftMode === 'regular'}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  {text.noData}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ToolsPage;
