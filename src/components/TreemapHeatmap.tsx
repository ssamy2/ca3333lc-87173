import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { ImageSendDialog } from '@/components/ImageSendDialog';
import { imageCache } from '@/services/imageCache';
import { 
  getCachedChartImages, 
  setCachedChartImages, 
  generateChartCacheKey, 
  generateDataHash 
} from '@/services/chartCache';
import { useLanguage } from '@/contexts/LanguageContext';
import { sendHeatmapImage } from '@/utils/heatmapImageSender';
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
  chartType: 'change' | 'marketcap';
  timeGap: '24h' | '1w' | '1m';
  currency: 'ton' | 'usd';
}


const preloadImagesAsync = async (data: TreemapDataPoint[]): Promise<Map<string, HTMLImageElement>> => {
  const imageMap = new Map<string, HTMLImageElement>();
  
  await Promise.all(
    data.map(item => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.crossOrigin = 'anonymous';
        img.src = item.imageName; // Use full URL
        imageMap.set(item.imageName, img);
      });
    })
  );
  
  return imageMap;
};

// updateInteractivity removed - zoom is now disabled

const transformGiftData = (
  data: GiftItem[], 
  chartType: 'change' | 'marketcap', 
  timeGap: '24h' | '1w' | '1m',
  currency: 'ton' | 'usd'
): TreemapDataPoint[] => {
  return data.map(item => {
    const currentPrice = currency === 'ton' ? item.priceTon : item.priceUsd;

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
    
    // Size calculation: zero change = minimum size, actual change = larger
    // If percentChange is 0, size = 1 (minimum)
    // If percentChange > 0, size increases with the change
    const size = Math.abs(percentChange) === 0 
      ? 1  // Minimum size for zero change
      : 2 * Math.pow(Math.abs(percentChange) + 1, 1.5);

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

const preloadImages = (data: TreemapDataPoint[], cacheKey: string): Map<string, HTMLImageElement> => {
  // Check if we have cached images for this chart configuration
  const cachedImages = getCachedChartImages(cacheKey);
  if (cachedImages) {
    console.log('✅ Using cached chart images from chartCache');
    return cachedImages;
  }
  
  const imageMap = new Map<string, HTMLImageElement>();
  let cachedCount = 0;
  let uncachedCount = 0;
  
  data.forEach(item => {
    // First try to get from image cache
    const cachedBase64 = imageCache.getImageFromCache(item.imageName);
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    if (cachedBase64) {
      // Use cached base64 image - already loaded
      img.src = cachedBase64;
      cachedCount++;
      console.log('✅ Using cached image:', item.imageName);
    } else {
      // Image not in cache - need to load from URL
      img.src = item.imageName;
      uncachedCount++;
      console.log('⏳ Loading image from URL:', item.imageName);
      
      // Cache the image when it loads
      img.onload = () => {
        imageCache.preloadImage(item.imageName).catch(console.error);
        console.log('✅ Image loaded and cached:', item.imageName);
      };
      img.onerror = () => {
        console.error('❌ Failed to load image:', item.imageName);
      };
    }
    
    imageMap.set(item.imageName, img);
  });
  
  console.log(`📊 Treemap images: ${cachedCount} from cache, ${uncachedCount} loading from URL`);
  
  // Cache the image map for this chart configuration
  setCachedChartImages(cacheKey, imageMap);
  
  return imageMap;
};

// Font cache for performance optimization
const fontCache = new Map<string, { width: number; height: number }>();

// Helper functions for dynamic sizing - more flexible
const calculateFontSize = (minDimension: number, scale: number = 1) => {
  // More aggressive scaling - allow smaller fonts for tiny boxes
  const titleFontSize = Math.min(Math.max(minDimension / 10, 6), 18) * scale;
  const valueFontSize = 0.8 * titleFontSize;
  const marketCapFontSize = 0.65 * titleFontSize;
  
  return { titleFontSize, valueFontSize, marketCapFontSize };
};

const calculateSpacing = (minDimension: number, scale: number = 1) => {
  const spacing = Math.min(Math.max(minDimension / 40, 2), 8) * scale;
  return spacing;
};

const shouldDrawText = (width: number, height: number, minSize: number = 40, scale: number = 1) => {
  // For high-resolution exports, use smaller threshold
  const threshold = minSize / scale;
  return width > threshold && height > threshold;
};

const handleTextOverflow = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number) => {
  ctx.font = `${fontSize}px sans-serif`;
  const textWidth = ctx.measureText(text).width;
  
  if (textWidth <= maxWidth) return text;
  
  // تقصير النص مع إضافة ...
  let shortened = text;
  while (shortened.length > 3 && ctx.measureText(shortened + '...').width > maxWidth) {
    shortened = shortened.slice(0, -1);
  }
  return shortened.length > 3 ? shortened + '...' : text.slice(0, 3);
};

const calculateTotalTextHeight = (
  chartType: 'change' | 'marketcap',
  imageHeight: number,
  fontSizes: { titleFontSize: number; valueFontSize: number; marketCapFontSize: number },
  spacing: number
) => {
  const { titleFontSize, valueFontSize, marketCapFontSize } = fontSizes;
  
  return chartType === 'marketcap'
    ? imageHeight + (2 * titleFontSize) + 3 * spacing
    : imageHeight + (2 * titleFontSize + valueFontSize + marketCapFontSize) + 4 * spacing;
};

const createImagePlugin = (
  chartType: 'change' | 'marketcap',
  currency: 'ton' | 'usd',
  fontSize: number = 15,
  scale: number = 1,
  textScale: number = 1,
  borderWidth: number = 1
): Plugin<'treemap'> => {
  return {
    id: 'treemapImages',
    afterDatasetDraw(chart) {
      try {
        const { ctx, data } = chart;
        const dataset = data.datasets[0] as any;
        const imageMap = dataset.imageMap as Map<string, HTMLImageElement>;
        // Removed zoomLevel - no longer using zoom plugin
        
        const toncoinImage = imageMap.get('toncoin') || new Image();
        if (!imageMap.has('toncoin')) {
          toncoinImage.src = tonIconSrc;
          imageMap.set('toncoin', toncoinImage);
        }

        ctx.save();
        // Removed ctx.scale - no zoom
        
        dataset.tree.forEach((item: TreemapDataPoint, index: number) => {
          const element = chart.getDatasetMeta(0).data[index] as any;
          if (!element) return;

          const x = element.x;
          const y = element.y;
          const width = element.width;
          const height = element.height;

        if (width <= 0 || height <= 0) return;

        // Colors based on percent change
        const color = item.percentChange > 0 ? '#018f35' 
          : item.percentChange < 0 ? '#dc2626' 
          : '#8F9779';

        // Draw rectangle with adaptive border
        ctx.fillStyle = color;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = Math.max(borderWidth, 0.5);
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, Math.min(width, height) * 0.02);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        // Always draw content - no minimum size check
        const minDimension = Math.min(width, height);

        const image = imageMap.get(item.imageName);
        // Don't skip if image not loaded - show text anyway
        const hasImage = image?.complete && image.naturalWidth > 0;

        // Dynamic font sizing based on element size - more aggressive scaling
        const fontSizes = calculateFontSize(minDimension, scale);
        const spacing = calculateSpacing(minDimension, scale);
        
        // Adaptive image sizing - larger for bigger elements
        const imageRatio = Math.min(0.4, Math.max(0.15, minDimension / 200));
        const imageSize = minDimension * imageRatio * textScale;
        
        let imageWidth = 0;
        let imageHeight = 0;
        
        if (hasImage) {
          const aspectRatio = image.width / image.height;
          imageWidth = imageSize;
          imageHeight = imageSize / aspectRatio;
          
          if (imageHeight > imageSize) {
            imageHeight = imageSize;
            imageWidth = imageSize * aspectRatio;
          }
        }

        // Calculate available space for text
        const availableWidth = width * 0.9; // 90% of width for text
        const totalTextHeight = calculateTotalTextHeight(chartType, imageHeight, fontSizes, spacing);
        
        // Check if content fits
        if (totalTextHeight > height * 0.9) {
          // Scale down everything proportionally
          const scaleFactor = (height * 0.9) / totalTextHeight;
          fontSizes.titleFontSize *= scaleFactor;
          fontSizes.valueFontSize *= scaleFactor;
          fontSizes.marketCapFontSize *= scaleFactor;
          imageWidth *= scaleFactor;
          imageHeight *= scaleFactor;
        }
        
        const finalTotalHeight = calculateTotalTextHeight(chartType, imageHeight, fontSizes, spacing);
        const textStartY = y + (height - finalTotalHeight) / 2;
        const centerX = x + width / 2;

        // Draw image with better centering (only if image exists)
        if (hasImage) {
          const imageX = x + (width - imageWidth) / 2;
          const imageY = textStartY;
          
          try {
            ctx.drawImage(image, imageX, imageY, imageWidth, imageHeight);
          } catch (error) {
            console.error('[Treemap] Error drawing image:', error);
          }
        }

        // Enhanced text rendering with better contrast
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Title with overflow handling
        ctx.font = `bold ${fontSizes.titleFontSize}px sans-serif`;
        const truncatedName = handleTextOverflow(ctx, item.name, availableWidth, fontSizes.titleFontSize);
        ctx.fillText(truncatedName, centerX, textStartY + imageHeight + fontSizes.titleFontSize/2 + spacing);

        if (chartType === 'change') {
          // Show percentage change
          ctx.font = `${fontSizes.titleFontSize}px sans-serif`;
          const valueText = `${item.percentChange >= 0 ? '+' : ''}${item.percentChange}%`;
          const truncatedValue = handleTextOverflow(ctx, valueText, availableWidth, fontSizes.titleFontSize);
          ctx.fillText(truncatedValue, centerX, textStartY + imageHeight + fontSizes.titleFontSize * 1.5 + 2 * spacing);

          // Price with currency
          ctx.font = `${fontSizes.valueFontSize}px sans-serif`;
          const bottomText = `${item.price.toFixed(2)}`;
          const priceY = textStartY + imageHeight + fontSizes.titleFontSize * 2 + fontSizes.valueFontSize/2 + 3 * spacing;

          if (currency === 'ton' && toncoinImage.complete && toncoinImage.naturalWidth > 0) {
            try {
              const coinSize = fontSizes.valueFontSize * 0.8;
              const textWidth = ctx.measureText(bottomText).width;
              const totalWidth = coinSize + textWidth + 2;
              
              // Draw coin icon
              ctx.drawImage(
                toncoinImage,
                centerX - totalWidth/2,
                priceY - coinSize/2,
                coinSize,
                coinSize
              );
              
              // Draw price text
              ctx.fillText(bottomText, centerX + coinSize/2 + 2, priceY);
            } catch (error) {
              console.error('Error drawing toncoin image:', error);
              ctx.fillText(`💎 ${bottomText}`, centerX, priceY);
            }
          } else if (currency === 'ton') {
            ctx.fillText(`💎 ${bottomText}`, centerX, priceY);
          } else if (currency === 'usd') {
            ctx.fillText(`$${bottomText}`, centerX, priceY);
          } else {
            ctx.fillText(bottomText, centerX, priceY);
          }

          // Market Cap with better visibility
          if (minDimension > 60) { // Only show for larger elements
            ctx.font = `${fontSizes.marketCapFontSize}px sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            const marketCapText = `MC: ${item.marketCap}`;
            const truncatedMC = handleTextOverflow(ctx, marketCapText, availableWidth, fontSizes.marketCapFontSize);
            ctx.fillText(truncatedMC, centerX, textStartY + imageHeight + fontSizes.titleFontSize * 2 + fontSizes.valueFontSize + fontSizes.marketCapFontSize/2 + 4 * spacing);
          }
        } else {
          // Market Cap mode - show market cap prominently
          ctx.font = `bold ${fontSizes.titleFontSize}px sans-serif`;
          ctx.fillStyle = 'white';
          const marketCapText = `MC: ${item.marketCap}`;
          const truncatedMC = handleTextOverflow(ctx, marketCapText, availableWidth, fontSizes.titleFontSize);
          ctx.fillText(truncatedMC, centerX, textStartY + imageHeight + fontSizes.titleFontSize + 2 * spacing);
        }
      });

      // Enhanced watermark positioning - always visible
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.font = `${Math.max(fontSize, 12)}px sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      
      // Position watermark at bottom-right of chart area
      const chartArea = chart.chartArea;
      if (chartArea) {
        ctx.fillText('@Novachartbot', chartArea.right - 10, chartArea.bottom - 10);
      }

      ctx.restore();
    } catch (error) {
      console.error('[Treemap Plugin] Error in afterDatasetDraw:', error);
      // Don't throw - just log and continue
    }
  }
  };
};

export interface TreemapHeatmapHandle {
  downloadImage: () => Promise<void>;
}

export const TreemapHeatmap = React.forwardRef<TreemapHeatmapHandle, TreemapHeatmapProps>(({
  data,
  chartType,
  timeGap,
  currency
}, ref) => {
  const chartRef = useRef<ChartJS>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayData, setDisplayData] = useState<TreemapDataPoint[]>([]);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [imageLoadTrigger, setImageLoadTrigger] = useState(0);
  const { language } = useLanguage();

  const handleHapticFeedback = useCallback(() => {
    if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    } else if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  const [isDownloading, setIsDownloading] = React.useState(false);

  const downloadImage = useCallback(async () => {
    // Prevent multiple simultaneous downloads
    if (isDownloading) {
      console.log('Download already in progress');
      return;
    }
    
    try {
      setIsDownloading(true);
      handleHapticFeedback();
      
      const telegramWebApp = (window as any).Telegram?.WebApp;
      const isTelegram = !!telegramWebApp;
      
      // Show dialog for Telegram users
      if (isTelegram) {
        setShowSendDialog(true);
      }
      
      const chart = chartRef.current;
      if (!chart) {
        console.error('Chart reference not found');
        setIsDownloading(false);
        return;
      }

      // Create high-resolution canvas for export (2x for PNG compression)
      const canvas = document.createElement('canvas');
      canvas.width = 1628;  // 814 * 2
      canvas.height = 1500; // 750 * 2
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas context');
        return;
      }

      // Transform data and preload images
      const transformedData = transformGiftData(data, chartType, timeGap, currency);
      const imageMap = await preloadImagesAsync(transformedData);

      // Create temporary chart for export with safe configuration
      let tempChart: ChartJS | null = null;
      try {
        // CRITICAL: Completely disable ALL event handling to prevent _positionChanged errors
        const tempChartOptions: ChartOptions<'treemap'> = {
          responsive: false,
          maintainAspectRatio: false,
          animation: false,
          layout: {
            padding: 0
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          },
          events: [], // NO DOM EVENTS
          interaction: {
            mode: undefined as any, // COMPLETELY disable interactions
            intersect: false
          },
          // Additional safety: disable all callbacks
          onHover: undefined,
          onClick: undefined,
          onResize: undefined
        };

        tempChart = new ChartJS(ctx, {
        type: 'treemap',
        data: {
          datasets: [{
            data: [],
            tree: transformedData,
            key: 'size',
            spacing: 0.5,
            borderWidth: 1,
            imageMap,
            backgroundColor: 'transparent'
          } as any]
        },
        options: tempChartOptions,
        plugins: [createImagePlugin(chartType, currency, 100, 2, 2, 2)]  // 2x scale for export
      });
      } catch (chartError) {
        console.error('[Treemap] Error creating temp chart:', chartError);
        setIsDownloading(false);
        return;
      }

      // Helper function to safely destroy chart
      const safeDestroyChart = () => {
        try {
          if (tempChart && typeof tempChart.destroy === 'function') {
            tempChart.destroy();
            console.log('[Treemap] Temp chart destroyed successfully');
          }
        } catch (destroyError) {
          console.error('[Treemap] Error destroying temp chart:', destroyError);
        }
      };

      // Force immediate render without animation
      try {
        if (tempChart && typeof tempChart.update === 'function') {
          tempChart.update('none');
        }
      } catch (updateError) {
        console.error('[Treemap] Error updating temp chart:', updateError);
      }

      // Process immediately after render
      requestAnimationFrame(async () => {
        try {
          if (!isTelegram) {
            // Download directly for non-Telegram users
            try {
              const imageUrl = canvas.toDataURL('image/jpeg', 1.0);
              const link = document.createElement('a');
              link.download = `nova-heatmap-${Date.now()}.jpeg`;
              link.href = imageUrl;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (downloadError) {
              console.error('[Treemap] Error downloading image:', downloadError);
            } finally {
              // Destroy chart IMMEDIATELY after download
              safeDestroyChart();
            }
            return;
          }

          // Telegram user flow
          const userId = telegramWebApp?.initDataUnsafe?.user?.id;
          if (!userId) {
            console.error('No Telegram user ID found');
            safeDestroyChart();
            return;
          }

          // Send image via Telegram
          if (typeof sendHeatmapImage === 'function') {
            await sendHeatmapImage({
              canvas,
              userId: userId.toString(),
              language,
              onSuccess: () => {
                console.log('Image sent successfully');
                safeDestroyChart();
              },
              onError: (error) => {
                console.error('Error sending image:', error);
                safeDestroyChart();
              }
            });
          } else {
            console.error('sendHeatmapImage function not available');
            safeDestroyChart();
          }
        } catch (error) {
          console.error('Error in image processing:', error);
          safeDestroyChart();
        }
      });
    } catch (error) {
      console.error('Error in downloadImage:', error);
      setIsDownloading(false);
    } finally {
      // Reset downloading state after a delay to allow completion
      setTimeout(() => {
        setIsDownloading(false);
      }, 2000);
    }
  }, [data, chartType, timeGap, currency, language, handleHapticFeedback, isDownloading]);

  // Expose downloadImage to parent components
  React.useImperativeHandle(ref, () => ({
    downloadImage
  }), [downloadImage]);

  useEffect(() => {
    try {
      console.log('[Treemap] useEffect triggered - chartType:', chartType, 'timeGap:', timeGap, 'currency:', currency);
      
      const filteredData = data.filter(item => !item.preSale);
      const transformed = transformGiftData(filteredData, chartType, timeGap, currency);
      
      console.log('[Treemap] Transformed data count:', transformed.length);
      
      // Always display data immediately - don't wait for images
      setDisplayData(transformed);
      
      // Check if all images are already cached
      const allImagesCached = transformed.every(item => {
        try {
          const cached = imageCache.getImageFromCache(item.imageName);
          const isCached = cached !== null;
          if (!isCached) {
            console.log('[Treemap] Image NOT in cache:', item.imageName);
          }
          return isCached;
        } catch (error) {
          console.error('[Treemap] Error checking cache for:', item.imageName, error);
          return false;
        }
      });
      
      console.log('[Treemap] All images cached:', allImagesCached, `(${transformed.length} total images)`);
      
      if (allImagesCached) {
        // All images are cached, no loading needed
        setIsLoading(false);
      } else {
        // Some images need loading - show chart but indicate loading
        setIsLoading(true);
        
        // Preload uncached images in background
        const imageUrls = transformed.map(item => item.imageName);
        
        imageCache.preloadUncachedImages(imageUrls)
          .then(() => {
            console.log('[Treemap] Images preloaded successfully');
            setIsLoading(false);
            
            // Trigger re-render to update chart with loaded images
            setImageLoadTrigger(prev => prev + 1);
          })
          .catch((error) => {
            console.error('[Treemap] Error preloading images:', error);
            setIsLoading(false);
          });
      }
    } catch (error) {
      console.error('[Treemap] Critical error in useEffect:', error);
      setIsLoading(false);
      // Don't crash - just log and continue
    }
  }, [data, chartType, timeGap, currency]);

  const chartData: ChartData<'treemap'> = {
    datasets: [{
      data: [],
      tree: displayData,
      key: 'size',
      spacing: 0.5,
      borderWidth: 1,
      imageMap: preloadImages(displayData, generateChartCacheKey(chartType, timeGap, currency, generateDataHash(displayData))),
      backgroundColor: 'transparent'
    } as any]
  };

  const chartOptions: ChartOptions<'treemap'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 0
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    events: ['mousemove', 'click', 'touchstart', 'touchmove', 'touchend'],
    // Wrap chart operations in try-catch for safety
    onResize: (chart: any) => {
      try {
        if (chart && chart.update) {
          chart.update('none');
        }
      } catch (error) {
        console.error('[Treemap] Error in onResize:', error);
      }
    }
  };

  // Zoom functions removed - zoom is now disabled

  return (
    <>
      <ImageSendDialog isOpen={showSendDialog} onClose={() => setShowSendDialog(false)} />
      
      <div className="w-full flex flex-col items-center gap-3 px-3">
        {/* Loading indicator - small and non-intrusive */}
        {isLoading && (
          <div className="w-full flex items-center justify-center gap-2 py-2 bg-secondary/50 rounded-lg animate-in fade-in">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-xs text-muted-foreground">Loading images...</span>
          </div>
        )}
        
        {/* Chart - Wrapped in error boundary */}
        <div className="w-full h-[calc(100vh-200px)] min-h-[600px] rounded-xl overflow-hidden bg-card border border-border">
          {(() => {
            try {
              return (
                <Chart
                  ref={chartRef}
                  type="treemap"
                  data={chartData}
                  options={chartOptions}
                  plugins={[createImagePlugin(chartType, currency)]}
                />
              );
            } catch (error) {
              console.error('[Treemap] Error rendering chart:', error);
              return (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground">Failed to render chart</p>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="text-primary hover:underline text-sm"
                    >
                      Reload page
                    </button>
                  </div>
                </div>
              );
            }
          })()}
        </div>
      </div>
    </>
  );
});

TreemapHeatmap.displayName = 'TreemapHeatmap';

export default TreemapHeatmap;
