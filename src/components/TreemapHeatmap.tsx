import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  isRegularMode?: boolean;
  isAllMode?: boolean;
}


const normalizeUrl = (u: string) => {
  try { return new URL(u, window.location.href).href; } catch { return u; }
};

const awaitCreateImageBitmapSafe = async (img: HTMLImageElement): Promise<ImageBitmap | null> => {
  try {
    if (img.naturalWidth === 0 || img.naturalHeight === 0) return null;
    const bitmap = await createImageBitmap(img);
    return bitmap;
  } catch {
    return null;
  }
};

const preloadImagesAsync = async (data: TreemapDataPoint[], timeoutMs = 15000): Promise<Map<string, HTMLImageElement>> => {
  const imageMapResult = new Map<string, HTMLImageElement>();
  let cachedCount = 0;
  let loadedCount = 0;
  let failedCount = 0;
  
  // Process images in batches to avoid overwhelming the browser
  const batchSize = 10;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const promises = batch.map(async item => {
      try {
        const url = normalizeUrl(item.imageName);
        if (imageMapResult.has(url)) return;
        
        // Check if image is cached first
        const cachedBase64 = imageCache.getImageFromCache(url);
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        const loadPromise = new Promise<void>((resolve) => {
          let settled = false;
          const safeResolve = () => { 
            if (!settled) { 
              settled = true; 
              resolve(); 
            } 
          };
          
          img.onload = () => {
            // Wait a bit to ensure image is fully decoded
            setTimeout(() => safeResolve(), 50);
          };
          img.onerror = () => {
            failedCount++;
            console.warn(`⚠️ Image load error for ${item.name}: ${url}`);
            safeResolve();
          };
          
          // Use cached base64 if available, otherwise load from URL
          if (cachedBase64 && cachedBase64.startsWith('data:')) {
            img.src = cachedBase64;
            cachedCount++;
          } else {
            // Try to load from URL with fallback handling
            img.src = url;
            loadedCount++;
          }
        });
        
        const timer = new Promise<void>((r) => setTimeout(r, timeoutMs));
        await Promise.race([loadPromise, timer]);
        
        // Verify image loaded successfully
        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
          imageMapResult.set(url, img);
        } else {
          // Try alternative URL formats if the original fails
          const alternativeUrls = [
            url.replace('https://', 'http://'),
            url.replace('http://', 'https://'),
            `https://cdn.changes.tg/gifts/originals/${encodeURIComponent(item.name)}/Original.png`
          ];
          
          for (const altUrl of alternativeUrls) {
            try {
              const altImg = new Image();
              altImg.crossOrigin = 'anonymous';
              
              await new Promise<void>((resolve) => {
                const timeout = setTimeout(() => resolve(), 2000);
                altImg.onload = () => {
                  clearTimeout(timeout);
                  resolve();
                };
                altImg.onerror = () => {
                  clearTimeout(timeout);
                  resolve();
                };
                altImg.src = altUrl;
              });
              
              if (altImg.complete && altImg.naturalWidth > 0) {
                imageMapResult.set(url, altImg);
                console.log(`✅ Loaded alternative image for ${item.name}`);
                break;
              }
            } catch {
              // Continue to next alternative
            }
          }
          
          if (!imageMapResult.has(url)) {
            console.warn(`⚠️ All image sources failed for: ${item.name}`);
          }
        }
      } catch (error) {
        console.error(`❌ Exception loading image for ${item.name}:`, error);
        failedCount++;
      }
    });
    
    await Promise.all(promises);
  }
  
  console.log(`📊 Images: ${imageMapResult.size}/${data.length} loaded (${cachedCount} cached, ${loadedCount} network, ${failedCount} failed)`);
  return imageMapResult;
};

// updateInteractivity removed - zoom is now disabled

const transformGiftData = (
  data: GiftItem[], 
  chartType: 'change' | 'marketcap', 
  timeGap: '24h' | '1w' | '1m',
  currency: 'ton' | 'usd',
  isRegularMode: boolean = false,
  isAllMode: boolean = false
): TreemapDataPoint[] => {
  return data.map(item => {
    const currentPrice = currency === 'ton' ? item.priceTon : item.priceUsd;
    const isRegularGift = item.name.startsWith('[Regular]');
    
    // Format display name: 
    // - In "all" mode: show "(R) Name" for regular gifts
    // - Otherwise: just remove the [Regular] prefix
    let displayName = item.name.replace('[Regular] ', '');
    if (isAllMode && isRegularGift) {
      displayName = `(R) ${displayName}`;
    }

    // Regular mode - size based on price (no market cap for regular gifts)
    if (isRegularMode) {
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
      
      // Log unupgraded gift change data
      console.log(`📊 [Regular Gift] ${displayName}: currentPrice=${currentPrice}, previousPrice=${previousPrice}, change=${percentChange.toFixed(2)}%, timeGap=${timeGap}`);
      
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

const preloadImages = (data: TreemapDataPoint[], cacheKey: string): Map<string, HTMLImageElement> => {
  const cached = getCachedChartImages(cacheKey);
  if (cached) return cached;

  const imageMap = new Map<string, HTMLImageElement>();
  
  data.forEach(item => {
    const url = normalizeUrl(item.imageName);
    if (imageMap.has(url)) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const cachedBase64 = imageCache.getImageFromCache(url);
    if (cachedBase64) {
      img.src = cachedBase64;
      
      (async () => {
        try {
          await img.decode();
        } catch {}
      })();
    } else {
      img.src = url;
      img.onload = async () => {
        try {
          await img.decode();
        } catch {}
        imageCache.preloadImage(url).catch(() => {});
      };
    }

    imageMap.set(url, img);
  });

  setCachedChartImages(cacheKey, imageMap);
  return imageMap;
};

// Font cache for performance optimization
const fontCache = new Map<string, { width: number; height: number }>();

// Helper functions for dynamic sizing - ultra flexible
const calculateFontSize = (minDimension: number, scale: number = 1) => {
  // Ultra dynamic scaling - works for any box size
  // Minimum 4px for tiny boxes, maximum 24px for huge boxes
  const titleFontSize = Math.min(Math.max(minDimension / 8, 4), 24) * scale;
  const valueFontSize = 0.75 * titleFontSize;
  const marketCapFontSize = 0.6 * titleFontSize;
  
  return { titleFontSize, valueFontSize, marketCapFontSize };
};

const calculateSpacing = (minDimension: number, scale: number = 1) => {
  // Ultra flexible spacing - works for any size
  const spacing = Math.min(Math.max(minDimension / 50, 1), 10) * scale;
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
  
  // Smart text wrapping - try to fit full text by reducing font size first
  // If still doesn't fit, then truncate
  let shortened = text;
  while (shortened.length > 1 && ctx.measureText(shortened + '...').width > maxWidth) {
    shortened = shortened.slice(0, -1);
  }
  return shortened.length > 1 ? shortened + '...' : text.charAt(0);
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
        
        const toncoinImage = imageMap.get('toncoin') || new Image();
        if (!imageMap.has('toncoin')) {
          toncoinImage.src = tonIconSrc;
          imageMap.set('toncoin', toncoinImage);
        }
        
        dataset.tree.forEach((item: TreemapDataPoint, index: number) => {
          ctx.save();

          const element = chart.getDatasetMeta(0).data[index] as any;
          if (!element) {
            ctx.restore();
            return;
          }

          const x = element.x;
          const y = element.y;
          const width = element.width;
          const height = element.height;

          if (width <= 0 || height <= 0) {
            ctx.restore();
            return;
          }

          // Colors based on percent change
          const color = item.percentChange > 0 ? '#018f35' 
            : item.percentChange < 0 ? '#dc2626' 
            : '#8F9779';

          // Draw rectangle with adaptive border
          ctx.fillStyle = color;
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = Math.max(borderWidth, 0.5);
          ctx.beginPath();
          ctx.roundRect(x, y, width, height, 6);
          ctx.fill();
          ctx.stroke();
          ctx.closePath();

          // Always draw content - no minimum size check
          const minDimension = Math.min(width, height);

          const rawImage = imageMap.get(normalizeUrl(item.imageName)) || imageMap.get(item.imageName);
          let drawImage: HTMLImageElement | ImageBitmap | null = null;
          let hasImage = false;
          
          if (rawImage) {
            try {
              if (rawImage.naturalWidth > 0 && rawImage.naturalHeight > 0) {
                drawImage = rawImage;
                hasImage = true;
              }
            } catch {}
          }

          console.log('[TREEMAP BLOCK]', {
            name: item.name,
            size: item.size,
            percentChange: item.percentChange,
            width,
            height,
            minDimension,
            imageReady: rawImage?.naturalWidth > 0 && rawImage?.naturalHeight > 0,
            naturalWidth: rawImage?.naturalWidth,
            naturalHeight: rawImage?.naturalHeight
          });

          // Dynamic font sizing based on element size with export scaling
          const fontSizes = calculateFontSize(minDimension, scale);
          const spacing = calculateSpacing(minDimension, scale);
          
          // Reduce text size for export to prevent overflow
          if (scale > 1) {
            fontSizes.titleFontSize = Math.max(fontSizes.titleFontSize * 0.85, 8);
            fontSizes.valueFontSize = Math.max(fontSizes.valueFontSize * 0.85, 6);
            fontSizes.marketCapFontSize = Math.max(fontSizes.marketCapFontSize * 0.85, 5);
          }
          
          const imageSize = Math.max(minDimension * 0.3, 22);
          
          const aspectRatio = (hasImage && drawImage && drawImage.width && drawImage.height) 
            ? (drawImage.width / drawImage.height) 
            : 1;
          
          let imageWidth = imageSize;
          let imageHeight = imageSize / aspectRatio;
          
          if (!isFinite(imageWidth) || !isFinite(imageHeight) || imageWidth <= 0 || imageHeight <= 0) {
            imageWidth = imageSize;
            imageHeight = imageSize;
          }
          
          if (imageHeight > imageSize) {
            imageHeight = imageSize;
            imageWidth = imageSize * aspectRatio;
          }

          // Calculate available space for text
          const availableWidth = width * 0.95;
          const totalTextHeight = calculateTotalTextHeight(chartType, imageHeight, fontSizes, spacing);
          
          // Smart scaling - ensure everything fits perfectly
          if (totalTextHeight > height * 0.95) {
            const scaleFactor = (height * 0.95) / totalTextHeight;
            fontSizes.titleFontSize = Math.max(fontSizes.titleFontSize * scaleFactor, 4);
            fontSizes.valueFontSize = Math.max(fontSizes.valueFontSize * scaleFactor, 3);
            fontSizes.marketCapFontSize = Math.max(fontSizes.marketCapFontSize * scaleFactor, 3);
            imageWidth *= scaleFactor;
            imageHeight *= scaleFactor;
          }
          
          const finalTotalHeight = calculateTotalTextHeight(chartType, imageHeight, fontSizes, spacing);
          const textStartY = y + (height - finalTotalHeight) / 2;
          const centerX = x + width / 2;

          // Add vertical padding offsets
          const imagePaddingOffset = minDimension * 0.02;
          const textPaddingOffset = minDimension * 0.05;

          const imageX = x + (width - imageWidth) / 2;
          const imageY = textStartY + imagePaddingOffset;
          
          console.log('[TREEMAP BLOCK] Image dimensions:', {
            name: item.name,
            finalImageWidth: imageWidth,
            finalImageHeight: imageHeight,
            willDraw: hasImage && drawImage && width >= 20 && height >= 20
          });
          
          // Draw image with robust error handling
          if (hasImage && drawImage && width >= 20 && height >= 20) {
            try {
              // Ensure image is within bounds
              const safeImageX = Math.max(x, Math.min(imageX, x + width - imageWidth));
              const safeImageY = Math.max(y, Math.min(imageY, y + height - imageHeight));
              const safeImageWidth = Math.min(imageWidth, width * 0.9);
              const safeImageHeight = Math.min(imageHeight, height * 0.4);
              
              // Additional validation before drawing
              if (safeImageWidth > 0 && safeImageHeight > 0 && 
                  safeImageX >= x && safeImageY >= y &&
                  safeImageX + safeImageWidth <= x + width &&
                  safeImageY + safeImageHeight <= y + height) {
                
                if ((drawImage as ImageBitmap).close) {
                  ctx.drawImage(drawImage as ImageBitmap, safeImageX, safeImageY, safeImageWidth, safeImageHeight);
                } else if (drawImage instanceof HTMLImageElement && drawImage.complete) {
                  ctx.drawImage(drawImage, safeImageX, safeImageY, safeImageWidth, safeImageHeight);
                }
                console.log('✅ Drew image:', item.name);
              }
            } catch (err) {
              console.warn('[TREEMAP] Image draw failed for', item.name, '- continuing without image');
              // Continue rendering without the image - don't break the entire chart
            }
          } else if (!hasImage && width >= 30 && height >= 30) {
            // Draw placeholder for missing images
            try {
              ctx.save();
              ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
              ctx.lineWidth = 1;
              const placeholderSize = Math.min(imageWidth * 0.8, imageHeight * 0.8, 30);
              const placeholderX = x + (width - placeholderSize) / 2;
              const placeholderY = textStartY + imagePaddingOffset;
              ctx.beginPath();
              ctx.roundRect(placeholderX, placeholderY, placeholderSize, placeholderSize, 4);
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            } catch {
              // Ignore placeholder errors
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

          // Title with overflow handling - more aggressive truncation
          ctx.font = `bold ${fontSizes.titleFontSize}px sans-serif`;
          const maxTitleWidth = availableWidth * 0.9; // Use 90% of available width
          const truncatedName = handleTextOverflow(ctx, item.name, maxTitleWidth, fontSizes.titleFontSize);
          ctx.fillText(truncatedName, centerX, textStartY + imagePaddingOffset + imageHeight + textPaddingOffset + fontSizes.titleFontSize / 2 + spacing);

          if (chartType === 'change') {
            // Show percentage change ONLY if not zero
            let percentChangeHeight = 0;
            if (item.percentChange !== 0) {
              ctx.font = `${fontSizes.titleFontSize}px sans-serif`;
              const valueText = `${item.percentChange >= 0 ? '+' : ''}${item.percentChange}%`;
              const truncatedValue = handleTextOverflow(ctx, valueText, availableWidth, fontSizes.titleFontSize);
              const percentY = textStartY + imagePaddingOffset + imageHeight + textPaddingOffset + fontSizes.titleFontSize * 1.5 + 2 * spacing;
              ctx.fillText(truncatedValue, centerX, percentY);
              percentChangeHeight = fontSizes.titleFontSize + spacing;
            }

            // Price with currency
            ctx.font = `${fontSizes.valueFontSize}px sans-serif`;
            const bottomText = `${item.price.toFixed(2)}`;
            const priceY = textStartY + imagePaddingOffset + imageHeight + textPaddingOffset + fontSizes.titleFontSize + percentChangeHeight + fontSizes.valueFontSize / 2 + 3 * spacing;

            if (currency === 'ton' && toncoinImage.complete && toncoinImage.naturalWidth > 0) {
              try {
                const coinSize = fontSizes.valueFontSize * 0.8;
                const textWidth = ctx.measureText(bottomText).width;
                const totalWidth = coinSize + textWidth + 2;
                
                // Draw coin icon
                ctx.drawImage(
                  toncoinImage,
                  centerX - totalWidth / 2,
                  priceY - coinSize / 2,
                  coinSize,
                  coinSize
                );
                
                // Draw price text
                ctx.fillText(bottomText, centerX + coinSize / 2 + 2, priceY);
              } catch {
                ctx.fillText(`💎 ${bottomText}`, centerX, priceY);
              }
            } else if (currency === 'ton') {
              ctx.fillText(`💎 ${bottomText}`, centerX, priceY);
            } else if (currency === 'usd') {
              ctx.fillText(`$${bottomText}`, centerX, priceY);
            } else {
              ctx.fillText(bottomText, centerX, priceY);
            }

            // Market Cap - positioned below price with safe spacing (only for upgraded gifts)
            if (minDimension > 60 && item.marketCap !== '-') {
              const mcSpacing = fontSizes.valueFontSize + spacing * 2;
              const mcY = priceY + mcSpacing;
              
              // Only draw if there's enough space (not overlapping bottom edge)
              if (mcY + fontSizes.marketCapFontSize < y + height - spacing * 2) {
                ctx.font = `${fontSizes.marketCapFontSize}px sans-serif`;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                const marketCapText = `MC: ${item.marketCap}`;
                const truncatedMC = handleTextOverflow(ctx, marketCapText, availableWidth, fontSizes.marketCapFontSize);
                ctx.fillText(truncatedMC, centerX, mcY);
              }
            }
          } else {
            // Market Cap mode - moved inside from edge
            ctx.font = `bold ${fontSizes.titleFontSize}px sans-serif`;
            ctx.fillStyle = 'white';
            const marketCapText = `MC: ${item.marketCap}`;
            const truncatedMC = handleTextOverflow(ctx, marketCapText, availableWidth, fontSizes.titleFontSize);
            const mcY = y + height - (fontSizes.titleFontSize * 1.4 + spacing * 1.8);
            ctx.fillText(truncatedMC, centerX, mcY);
          }

          ctx.restore();
        });

        // Enhanced watermark positioning - always visible, isolated context
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.font = `${Math.max(fontSize, 12)}px sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        
        const chartArea = chart.chartArea;
        if (chartArea) {
          ctx.fillText('@Novachartbot', chartArea.right - 10, chartArea.bottom - 10);
        }
        ctx.restore();
      } catch {
        // ignore plugin errors to avoid breaking chart
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
  currency,
  isRegularMode = false,
  isAllMode = false
}, ref) => {
  const chartRef = useRef<ChartJS>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayData, setDisplayData] = useState<TreemapDataPoint[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const { language } = useLanguage();
  const { toast } = useToast();
  
  // Memoize preloaded images to prevent re-fetching on every render
  const preloadedImages = useMemo(() => {
    if (displayData.length === 0) return new Map<string, HTMLImageElement>();
    const cacheKey = generateChartCacheKey(chartType, timeGap, currency, generateDataHash(displayData));
    return preloadImages(displayData, cacheKey);
  }, [displayData, chartType, timeGap, currency]);

  const handleHapticFeedback = useCallback(() => {
    if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    } else if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  const downloadImage = useCallback(async () => {
    if (isDownloading) return;
    
    try {
      setIsDownloading(true);
      handleHapticFeedback();
      
      if (!chartRef.current) {
        setIsDownloading(false);
        return;
      }
      
      const telegramWebApp = (window as any).Telegram?.WebApp;
      const isTelegram = !!telegramWebApp;

      const canvas = document.createElement('canvas');
      // High quality export dimensions
      let exportWidth = 4800;
      let exportHeight = 2700;
      
      // Use lower resolution for mobile/Telegram
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isTelegram || isMobile) {
        exportWidth = 3000;
        exportHeight = 1688;
      }
      
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setIsDownloading(false);
        return;
      }

      const transformedData = transformGiftData(data, chartType, timeGap, currency, isRegularMode, isAllMode);
      
      console.log('🎨 Starting image preload for export...', transformedData.length, 'items');
      
      // Preload all images with extended timeout for export quality
      const imageMap = await preloadImagesAsync(transformedData, 20000);
      
      console.log('✅ Image preload complete:', imageMap.size, 'images loaded');

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
              spacing: 0.3,
              borderWidth: 2,
              imageMap,
              backgroundColor: 'transparent'
            } as any]
          },
          options: tempChartOptions,
          plugins: [createImagePlugin(chartType, currency, 100, 1.5, 1.5, 3)]
        });
      } catch {
        setIsDownloading(false);
        return;
      }

      // Force render with multiple update cycles to ensure all images are drawn
      if (tempChart?.update) {
        try {
          tempChart.update('none');
          // Give browser time to process all images
          await new Promise(resolve => setTimeout(resolve, 500));
          tempChart.update('none');
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch {}
      }

      console.log('🎨 Chart rendering complete, preparing download...');

      // Wait a bit more before download to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Download/send with comprehensive error handling
      try {
        console.log('📥 [EXPORT] Starting download/send process...');
        
        if (!isTelegram) {
          // PC: Direct download with JPEG compression
          console.log('💻 [EXPORT] PC mode - downloading...');
          try {
            const imageUrl = canvas.toDataURL('image/jpeg', 0.95);
            const link = document.createElement('a');
            link.download = `nova-heatmap-${Date.now()}.jpeg`;
            link.href = imageUrl;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
              try {
                document.body.removeChild(link);
              } catch {}
            }, 100);
            console.log('✅ [EXPORT] Download triggered successfully');
          } catch (downloadError) {
            console.error('❌ [EXPORT] Download failed:', downloadError);
            throw downloadError;
          }
        } else {
          // Mobile/Telegram: Send to API
          console.log('📱 [EXPORT] Telegram mode - sending to API...');
          const userId = telegramWebApp?.initDataUnsafe?.user?.id;
          
          if (!userId) {
            console.error('❌ [EXPORT] User ID not found');
            throw new Error('User ID not available');
          }
          
          if (typeof sendHeatmapImage !== 'function') {
            console.error('❌ [EXPORT] sendHeatmapImage function not available');
            throw new Error('Send function not available');
          }
          
          console.log('📤 [EXPORT] Sending image for user:', userId);
          
          // Show dialog immediately
          try {
            setShowSendDialog(true);
            console.log('✅ [EXPORT] Dialog shown');
          } catch (dialogError) {
            console.warn('⚠️ [EXPORT] Failed to show dialog:', dialogError);
          }
          
          // Send image with proper error handling
          try {
            await sendHeatmapImage({
              canvas,
              userId: userId.toString(),
              language,
              onSuccess: () => {
                console.log('🎉 [EXPORT] Image sent successfully!');
                try {
                  // Show success toast
                  if (typeof toast === 'function') {
                    toast({
                      title: "Success!",
                      description: "Heatmap image sent successfully",
                    });
                  }
                } catch (toastError) {
                  console.warn('⚠️ [EXPORT] Toast error:', toastError);
                }
              },
              onError: (error: Error) => {
                console.error('❌ [EXPORT] Send error:', error);
                try {
                  // Show error toast
                  if (typeof toast === 'function') {
                    toast({
                      title: "Error",
                      description: "Failed to send image. Downloaded locally instead.",
                      variant: "destructive",
                    });
                  }
                } catch (toastError) {
                  console.warn('⚠️ [EXPORT] Toast error:', toastError);
                }
              }
            });
            console.log('✅ [EXPORT] Send process completed');
          } catch (sendError) {
            console.error('❌ [EXPORT] Send failed, attempting fallback download...', sendError);
            
            // Fallback: Download locally
            try {
              const fallbackUrl = canvas.toDataURL('image/jpeg', 0.8);
              const link = document.createElement('a');
              link.download = `nova-heatmap-fallback-${Date.now()}.jpeg`;
              link.href = fallbackUrl;
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              setTimeout(() => {
                try {
                  document.body.removeChild(link);
                } catch {}
              }, 100);
              console.log('✅ [EXPORT] Fallback download triggered');
            } catch (fallbackError) {
              console.error('❌ [EXPORT] Fallback download also failed:', fallbackError);
            }
          }
        }
      } catch (exportError) {
        console.error('❌ [EXPORT] Critical error in export process:', exportError);
      } finally {
        // Always destroy temp chart
        console.log('🧹 [EXPORT] Cleaning up...');
        try {
          if (tempChart) {
            tempChart.destroy();
            console.log('✅ [EXPORT] Temp chart destroyed');
          }
        } catch (destroyError) {
          console.warn('⚠️ [EXPORT] Failed to destroy chart:', destroyError);
        }
      }
    } catch {
      // ignore download errors to avoid breaking UI
    } finally {
      setTimeout(() => setIsDownloading(false), 1000);
    }
  }, [data, chartType, timeGap, currency, language, handleHapticFeedback, isDownloading]);

  // Expose downloadImage to parent components
  React.useImperativeHandle(ref, () => ({
    downloadImage
  }), [downloadImage]);

  useEffect(() => {
    try {
      const filteredData = data.filter(item => !item.preSale);
      const transformed = transformGiftData(filteredData, chartType, timeGap, currency, isRegularMode, isAllMode);
      
      // Always display data immediately - don't wait for images
      setDisplayData(transformed);
      
      // Check if all images are already cached
      const allImagesCached = transformed.every(item => {
        try {
          const cached = imageCache.getImageFromCache(item.imageName);
          return cached !== null;
        } catch {
          return false;
        }
      });
      
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
            setIsLoading(false);
            
            // Force chart update without triggering re-render
            if (chartRef.current) {
              try {
                chartRef.current.update('none'); // 'none' mode prevents animation and is faster
              } catch {}
            }
          })
          .catch(() => {
            setIsLoading(false);
          });
      }
    } catch {
      setIsLoading(false);
    }
  }, [data, chartType, timeGap, currency, isRegularMode, isAllMode]);

  const chartData: ChartData<'treemap'> = useMemo(() => ({
    datasets: [{
      data: [],
      tree: displayData,
      key: 'size',
      spacing: 0,
      borderWidth: 1,
      imageMap: preloadedImages,
      backgroundColor: 'transparent'
    } as any]
  }), [displayData, preloadedImages]);

  const chartOptions: ChartOptions<'treemap'> = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 2,
    layout: {
      padding: 0
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    // CRITICAL: Disable ALL events to prevent _positionChanged errors
    events: [],
    interaction: {
      mode: undefined as any,
      intersect: false
    },
    // Disable all callbacks
    onHover: undefined,
    onClick: undefined,
    onResize: undefined
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
        
        {/* Chart - Full height container */}
        <div className="w-full h-[calc(100vh-140px)] rounded-xl overflow-hidden bg-card border border-border">
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
