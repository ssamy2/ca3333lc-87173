import os

# Read the backup file to get the full original implementation
with open('src/components/TreemapHeatmap.bak', 'r', encoding='utf-8') as f:
    original_content = f.read()

# Find where the component implementation starts
impl_start = original_content.find('const getColorForChange')
if impl_start == -1:
    impl_start = original_content.find('const TreemapHeatmap')
    
# Get the implementation part
implementation = original_content[impl_start:] if impl_start != -1 else ""

# Create the complete fixed file
fixed_content = '''import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  Plugin,
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { TreemapController, TreemapElement } from 'chartjs-chart-treemap';
import { Chart } from 'react-chartjs-2';
import { imageCache } from '@/services/imageCache';
import { ImageSendDialog } from '@/components/ImageSendDialog';
import { 
  getCachedChartImages, 
  setCachedChartImages, 
  generateChartCacheKey, 
  generateDataHash 
} from '@/services/chartCache';
import { useLanguage } from '@/contexts/LanguageContext';
import { sendHeatmapImage } from '@/utils/heatmapImageSender';
import { useToast } from '@/hooks/use-toast';
import { useMarketData } from '@/hooks/useMarketData';
import tonIconSrc from '@/assets/ton-icon.png';

ChartJS.register(
  TreemapController, 
  TreemapElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend
);

interface GiftItem {
  name: string;
  image: string;
  priceTon: number;
  priceUsd: number;
  tonPrice24hAgo?: number;
  usdPrice24hAgo?: number;
  tonPriceWeekAgo?: number;
  usdPriceWeekAgo?: number;
  tonPriceMonthAgo?: number;
  usdPriceMonthAgo?: number;
  marketCapTon?: string;
  marketCapUsd?: string;
  upgradedSupply: number;
  preSale?: boolean;
}

interface TreemapDataPoint {
  name: string;
  percentChange: number;
  size: number;
  imageName: string;
  price: number;
  marketCap: string;
}

interface TreemapHeatmapProps {
  data: GiftItem[];
  allData?: GiftItem[];  // Add optional allData prop for finding corresponding upgraded gifts
  chartType: 'change' | 'marketcap';
  timeGap: '24h' | '1w' | '1m';
  currency: 'ton' | 'usd';
  isRegularMode?: boolean;
  isAllMode?: boolean;
}

const normalizeUrl = (u: string) => {
  try { return new URL(u, window.location.href).href; } catch { return u; }
};

const transformGiftData = (
  data: GiftItem[], 
  allMarketData: any, // Full market data for finding corresponding upgraded gifts
  chartType: 'change' | 'marketcap', 
  timeGap: '24h' | '1w' | '1m',
  currency: 'ton' | 'usd',
  isRegularMode: boolean = false,
  isAllMode: boolean = false
): TreemapDataPoint[] => {
  return data.map(item => {
    const currentPrice = currency === 'ton' ? item.priceTon : item.priceUsd;
    const isRegularGift = item.name.startsWith('[Regular]');
    
    // Format display name
    let displayName = item.name.replace('[Regular] ', '');
    if (isAllMode && isRegularGift) {
      displayName = `(R) ${displayName}`;
    }

    // Regular mode - size based on price (no market cap for regular gifts)
    if (isRegularMode && isRegularGift) {
      // For regular gifts, we need to get the percentage from the upgraded version
      const cleanName = item.name.replace('[Regular] ', '');
      
      // Find the corresponding upgraded gift in the full market data
      let percentChange = 0;
      
      if (allMarketData && allMarketData[cleanName]) {
        const upgradedGift = allMarketData[cleanName];
        // Use the upgraded gift's price history for percentage calculation
        let upgradedCurrentPrice = currency === 'ton' ? 
          (upgradedGift.priceTon || upgradedGift.price_ton) : 
          (upgradedGift.priceUsd || upgradedGift.price_usd);
        let upgradedPreviousPrice = upgradedCurrentPrice;
        
        switch (timeGap) {
          case '24h':
            upgradedPreviousPrice = currency === 'ton'
              ? (upgradedGift.tonPrice24hAgo || upgradedCurrentPrice)
              : (upgradedGift.usdPrice24hAgo || upgradedCurrentPrice);
            break;
          case '1w':
            upgradedPreviousPrice = currency === 'ton'
              ? (upgradedGift.tonPriceWeekAgo || upgradedCurrentPrice)
              : (upgradedGift.usdPriceWeekAgo || upgradedCurrentPrice);
            break;
          case '1m':
            upgradedPreviousPrice = currency === 'ton'
              ? (upgradedGift.tonPriceMonthAgo || upgradedCurrentPrice)
              : (upgradedGift.usdPriceMonthAgo || upgradedCurrentPrice);
            break;
        }
        
        percentChange = upgradedPreviousPrice === 0 ? 0 : ((upgradedCurrentPrice - upgradedPreviousPrice) / upgradedPreviousPrice) * 100;
        console.log(`📊 [Regular Gift] ${displayName}: Using upgraded gift percentage: ${percentChange.toFixed(2)}%`);
      } else {
        // If no matching upgraded gift found, use regular gift's own history
        let previousPrice = currentPrice;
        
        switch (timeGap) {
          case '24h':
            previousPrice = currency === 'ton'
              ? (item.tonPrice24hAgo || currentPrice)
              : (item.usdPrice24hAgo || currentPrice);
            break;
          case '1w':
            previousPrice = currency === 'ton'
              ? (item.tonPriceWeekAgo || currentPrice)
              : (item.usdPriceWeekAgo || currentPrice);
            break;
          case '1m':
            previousPrice = currency === 'ton'
              ? (item.tonPriceMonthAgo || currentPrice)
              : (item.usdPriceMonthAgo || currentPrice);
            break;
        }
        
        percentChange = previousPrice === 0 ? 0 : ((currentPrice - previousPrice) / previousPrice) * 100;
        console.log(`📊 [Regular Gift] ${displayName}: currentPrice=${currentPrice}, previousPrice=${previousPrice}, change=${percentChange.toFixed(2)}%, timeGap=${timeGap}`);
      }
      
      // Size based on price for regular gifts
      const size = Math.max(10, Math.sqrt(currentPrice) * 5);

      return {
        name: displayName,
        percentChange: Number(percentChange.toFixed(2)),
        size,
        imageName: item.image,
        price: currentPrice,
        marketCap: '-'
      };
    }

    if (chartType === 'marketcap') {
      // Market Cap mode - size based on market cap value
      const marketCapStr = currency === 'ton' 
        ? (item.marketCapTon || '0')
        : (item.marketCapUsd || '0');
      
      // Parse market cap string (e.g., "203.07K" -> 203070)
      const parseMarketCap = (str: string): number => {
        const num = parseFloat(str.replace(/[KM,]/g, ''));
        if (str.includes('M')) return num * 1000000;
        if (str.includes('K')) return num * 1000;
        return num;
      };
      
      const marketCapValue = parseMarketCap(marketCapStr);
      const size = Math.sqrt(marketCapValue) / 100; // Scale for reasonable sizes

      // Calculate percentChange for colors even in marketcap mode
      let previousPrice = currentPrice;
      
      switch (timeGap) {
        case '24h':
          previousPrice = currency === 'ton'
            ? (item.tonPrice24hAgo || currentPrice)
            : (item.usdPrice24hAgo || currentPrice);
          break;
        case '1w':
          previousPrice = currency === 'ton'
            ? (item.tonPriceWeekAgo || currentPrice)
            : (item.usdPriceWeekAgo || currentPrice);
          break;
        case '1m':
          previousPrice = currency === 'ton'
            ? (item.tonPriceMonthAgo || currentPrice)
            : (item.usdPriceMonthAgo || currentPrice);
          break;
        default:
          previousPrice = currentPrice;
      }

      const percentChange = previousPrice === 0 ? 0 : ((currentPrice - previousPrice) / previousPrice) * 100;

      return {
        name: item.name,
        percentChange: Number(percentChange.toFixed(2)), // Use actual change for colors
        size,
        imageName: item.image,
        price: currentPrice,
        marketCap: marketCapStr
      };
    }

    // Change mode - existing logic
    let previousPrice = currentPrice;
    
    switch (timeGap) {
      case '24h':
        previousPrice = currency === 'ton'
          ? (item.tonPrice24hAgo || currentPrice)
          : (item.usdPrice24hAgo || currentPrice);
        break;
      case '1w':
        previousPrice = currency === 'ton'
          ? (item.tonPriceWeekAgo || currentPrice)
          : (item.usdPriceWeekAgo || currentPrice);
        break;
      case '1m':
        previousPrice = currency === 'ton'
          ? (item.tonPriceMonthAgo || currentPrice)
          : (item.usdPriceMonthAgo || currentPrice);
        break;
      default:
        previousPrice = currentPrice;
    }

    const percentChange = previousPrice === 0 ? 0 : ((currentPrice - previousPrice) / previousPrice) * 100;
    
    const marketCap = currency === 'ton' 
      ? (item.marketCapTon || '0')
      : (item.marketCapUsd || '0');
    
    const size = Math.max(
      6,
      Math.abs(percentChange) < 4
        ? 12
        : 3 * Math.pow(Math.abs(percentChange) + 1, 1.4)
    );

    return {
      name: item.name,
      percentChange: Number(percentChange.toFixed(2)),
      size,
      imageName: item.image,
      price: currentPrice,
      marketCap
    };
  });
};

''' + implementation

# Write the fixed content
with open('src/components/TreemapHeatmap.tsx', 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print("✅ TreemapHeatmap.tsx has been successfully updated with complete implementation!")
