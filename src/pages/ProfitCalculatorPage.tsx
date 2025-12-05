import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, TrendingUp, TrendingDown, DollarSign, Coins } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useMarketData } from '@/hooks/useMarketData';
import TonIcon from '@/components/TonIcon';

interface GiftOption {
  name: string;
  priceTon: number;
  priceUsd: number;
  change24h: number;
  image: string;
}

const ProfitCalculatorPage: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: marketData = {} } = useMarketData();
  
  const [selectedGift, setSelectedGift] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [searchGift, setSearchGift] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const t = {
    ar: {
      title: 'حاسبة الأرباح',
      subtitle: 'احسب أرباحك المتوقعة من الهدايا',
      back: 'رجوع',
      selectGift: 'اختر الهدية',
      searchGift: 'ابحث عن هدية...',
      quantity: 'الكمية',
      buyPrice: 'سعر الشراء (TON)',
      currentPrice: 'السعر الحالي',
      totalInvestment: 'إجمالي الاستثمار',
      currentValue: 'القيمة الحالية',
      profitLoss: 'الربح / الخسارة',
      profitPercent: 'نسبة الربح',
      change24h: 'التغير 24 ساعة',
      noGiftSelected: 'اختر هدية للبدء',
      profit: 'ربح',
      loss: 'خسارة'
    },
    en: {
      title: 'Profit Calculator',
      subtitle: 'Calculate your expected profits from gifts',
      back: 'Back',
      selectGift: 'Select Gift',
      searchGift: 'Search gift...',
      quantity: 'Quantity',
      buyPrice: 'Buy Price (TON)',
      currentPrice: 'Current Price',
      totalInvestment: 'Total Investment',
      currentValue: 'Current Value',
      profitLoss: 'Profit / Loss',
      profitPercent: 'Profit %',
      change24h: '24h Change',
      noGiftSelected: 'Select a gift to start',
      profit: 'Profit',
      loss: 'Loss'
    }
  };

  const text = t[language] || t.en;

  // Get gift options from market data
  const giftOptions: GiftOption[] = React.useMemo(() => {
    if (!marketData) return [];
    return Object.entries(marketData)
      .filter(([name]) => !name.startsWith('[Regular]'))
      .map(([name, data]: [string, any]) => ({
        name,
        priceTon: data.priceTon || data.price_ton || 0,
        priceUsd: data.priceUsd || data.price_usd || 0,
        change24h: data['change_24h_ton_%'] || 0,
        image: data.image_url || ''
      }))
      .sort((a, b) => b.priceTon - a.priceTon);
  }, [marketData]);

  // Filter gifts by search
  const filteredGifts = giftOptions.filter(gift =>
    gift.name.toLowerCase().includes(searchGift.toLowerCase())
  );

  // Get selected gift data
  const selectedGiftData = giftOptions.find(g => g.name === selectedGift);

  // Calculate profit/loss
  const qty = parseInt(quantity) || 0;
  const buyPriceNum = parseFloat(buyPrice) || 0;
  const totalInvestment = buyPriceNum * qty;
  const currentValue = selectedGiftData ? selectedGiftData.priceTon * qty : 0;
  const profitLoss = currentValue - totalInvestment;
  const profitPercent = totalInvestment > 0 ? ((profitLoss / totalInvestment) * 100) : 0;

  const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-[#0f1729] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0f1729]/90 backdrop-blur-lg border-b border-slate-700/30">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="p-2 bg-amber-500/20 rounded-xl">
            <Calculator className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{text.title}</h1>
            <p className="text-xs text-slate-400">{text.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Gift Selection */}
        <div className="bg-slate-800/50 border border-slate-700/30 rounded-2xl p-4">
          <label className="text-sm text-slate-400 mb-2 block">{text.selectGift}</label>
          <div className="relative">
            <input
              type="text"
              value={searchGift}
              onChange={(e) => {
                setSearchGift(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder={text.searchGift}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
            
            {showDropdown && filteredGifts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700/30 rounded-xl max-h-60 overflow-y-auto z-50">
                {filteredGifts.slice(0, 10).map((gift) => (
                  <button
                    key={gift.name}
                    onClick={() => {
                      setSelectedGift(gift.name);
                      setSearchGift(gift.name);
                      setShowDropdown(false);
                      if (!buyPrice) setBuyPrice(gift.priceTon.toString());
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors text-left"
                  >
                    {gift.image && (
                      <img src={gift.image} alt={gift.name} className="w-8 h-8 rounded-lg object-cover" />
                    )}
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{gift.name}</div>
                      <div className="text-slate-400 text-xs">{formatNumber(gift.priceTon)} TON</div>
                    </div>
                    <div className={`text-xs ${gift.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {gift.change24h >= 0 ? '+' : ''}{formatNumber(gift.change24h)}%
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quantity & Buy Price */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 border border-slate-700/30 rounded-2xl p-4">
            <label className="text-sm text-slate-400 mb-2 block">{text.quantity}</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/30 rounded-xl text-white text-center text-lg font-bold focus:outline-none focus:border-amber-500/50"
            />
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/30 rounded-2xl p-4">
            <label className="text-sm text-slate-400 mb-2 block">{text.buyPrice}</label>
            <input
              type="number"
              step="0.01"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/30 rounded-xl text-white text-center text-lg font-bold focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Current Price */}
        {selectedGiftData && (
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">{text.currentPrice}</span>
              <div className="text-right">
                <div className="text-white font-bold text-lg flex items-center gap-1">
                  <TonIcon className="w-4 h-4" />
                  {formatNumber(selectedGiftData.priceTon)}
                </div>
                <div className="text-slate-400 text-sm">${formatNumber(selectedGiftData.priceUsd)}</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/30">
              <span className="text-slate-400 text-sm">{text.change24h}</span>
              <span className={`font-medium ${selectedGiftData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {selectedGiftData.change24h >= 0 ? '+' : ''}{formatNumber(selectedGiftData.change24h)}%
              </span>
            </div>
          </div>
        )}

        {/* Results */}
        {selectedGiftData && buyPriceNum > 0 && qty > 0 && (
          <div className="space-y-3">
            {/* Investment vs Current Value */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 border border-slate-700/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400 text-sm">{text.totalInvestment}</span>
                </div>
                <div className="text-white font-bold text-xl">
                  {formatNumber(totalInvestment)} TON
                </div>
              </div>
              
              <div className="bg-slate-800/50 border border-slate-700/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400 text-sm">{text.currentValue}</span>
                </div>
                <div className="text-white font-bold text-xl">
                  {formatNumber(currentValue)} TON
                </div>
              </div>
            </div>

            {/* Profit/Loss Card */}
            <div className={`rounded-2xl p-5 ${
              profitLoss >= 0 
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30' 
                : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {profitLoss >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                  <span className="text-slate-300">{text.profitLoss}</span>
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  profitLoss >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {profitLoss >= 0 ? text.profit : text.loss}
                </span>
              </div>
              
              <div className={`text-3xl font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {profitLoss >= 0 ? '+' : ''}{formatNumber(profitLoss)} TON
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/30">
                <span className="text-slate-400 text-sm">{text.profitPercent}</span>
                <span className={`text-lg font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {profitLoss >= 0 ? '+' : ''}{formatNumber(profitPercent)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* No Gift Selected */}
        {!selectedGiftData && (
          <div className="bg-slate-800/30 border border-slate-700/20 rounded-2xl p-8 text-center">
            <Calculator className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">{text.noGiftSelected}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfitCalculatorPage;
