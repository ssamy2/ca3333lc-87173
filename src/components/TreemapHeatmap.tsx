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
import zoomPlugin from 'chartjs-plugin-zoom';
import {
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';

ChartJS.register(
  TreemapController, 
  TreemapElement, 
  zoomPlugin,
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

interface DownloadHeatmapModalProps {
  trigger: React.ReactNode;
  onDownload: () => void;
}

const DownloadHeatmapModal: React.FC<DownloadHeatmapModalProps> = ({ trigger, onDownload }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <span onClick={() => setIsOpen(true)} className="w-full flex justify-center cursor-pointer hover:opacity-80 transition-opacity">
        {trigger}
      </span>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md" onClick={() => setIsOpen(false)} />
          <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 w-full lg:w-5/6 max-w-md border border-gray-700">
            <div className="w-full mt-2 flex flex-col items-center">
              <h1 className="flex flex-row items-center mb-5 gap-x-2 text-xl font-bold text-white">
                <Download size={50} className="text-blue-400" />
                Download Heatmap
              </h1>
              <p className="mb-4 text-center text-gray-300">The image will be sent to you shortly.</p>
              <button
                onClick={() => {
                  onDownload();
                  setIsOpen(false);
                }}
                className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-semibold text-white transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const preloadImagesAsync = async (data: TreemapDataPoint[]): Promise<Map<string, HTMLImageElement>> => {
  const imageMap = new Map<string, HTMLImageElement>();
  
  await Promise.all(
    data.map(item => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.crossOrigin = 'anonymous';
        img.src = item.imageName;
        imageMap.set(item.imageName, img);
      });
    })
  );
  
  return imageMap;
};

const updateInteractivity = (chart: ChartJS) => {
  const zoomLevel = (chart as any).getZoomLevel?.() || 1;
  chart.options.plugins!.zoom!.pan!.enabled = zoomLevel > 1;
  (chart.options as any).events = zoomLevel > 1 
    ? ['mousemove', 'click', 'touchstart', 'touchmove', 'touchend'] 
    : [];
  
  const canvas = chart.canvas;
  if (canvas) {
    canvas.style.cursor = zoomLevel > 1 ? 'pointer' : 'default';
  }
  
  chart.update('none');
};

const transformGiftData = (
  data: GiftItem[], 
  chartType: 'change' | 'marketcap', 
  timeGap: '24h' | '1w' | '1m',
  currency: 'ton' | 'usd'
): TreemapDataPoint[] => {
  return data.map(item => {
    const currentPrice = currency === 'ton' ? item.priceTon : item.priceUsd;

    if (chartType === 'marketcap') {
      const marketCapStr = currency === 'ton' 
        ? (item.marketCapTon || '0')
        : (item.marketCapUsd || '0');
      
      const parseMarketCap = (str: string): number => {
        const num = parseFloat(str.replace(/[KM,]/g, ''));
        if (str.includes('M')) return num * 1000000;
        if (str.includes('K')) return num * 1000;
        return num;
      };
      
      const marketCapValue = parseMarketCap(marketCapStr);
      const size = Math.sqrt(marketCapValue) / 100;

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
        percentChange: Number(percentChange.toFixed(2)),
        size,
        imageName: item.image,
        price: currentPrice,
        marketCap: marketCapStr
      };
    }

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
    
    const size = 2 * Math.pow(Math.abs(percentChange) + 1, 1.5);

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

const preloadImages = (data: TreemapDataPoint[]): Map<string, HTMLImageElement> => {
  const imageMap = new Map<string, HTMLImageElement>();
  
  data.forEach(item => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = item.imageName;
    imageMap.set(item.imageName, img);
  });
  
  return imageMap;
};

const createImagePlugin = (
  chartType: 'change' | 'marketcap',
  currency: 'ton' | 'usd',
  fontSize: number = 15,
  scale: number = 1,
  textScale: number = 1,
  borderWidth: number = 0
): Plugin<'treemap'> => {
  return {
    id: 'treemapImages',
    afterDatasetDraw(chart) {
      const { ctx, data } = chart;
      const dataset = data.datasets[0] as any;
      const imageMap = dataset.imageMap as Map<string, HTMLImageElement>;
      const zoomLevel = (chart as any).getZoomLevel?.() || 1;
      
      const toncoinImage = imageMap.get('toncoin') || new Image();
      if (!imageMap.has('toncoin')) {
        toncoinImage.crossOrigin = 'anonymous';
        toncoinImage.src = 'https://channelsseller.site/api/image/toncoin';
        imageMap.set('toncoin', toncoinImage);
      }

      ctx.save();
      ctx.scale(zoomLevel, zoomLevel);
      
      dataset.tree.forEach((item: TreemapDataPoint, index: number) => {
        const element = chart.getDatasetMeta(0).data[index] as any;
        if (!element) return;

        const x = element.x / zoomLevel;
        const y = element.y / zoomLevel;
        const width = element.width / zoomLevel;
        const height = element.height / zoomLevel;

        if (width <= 0 || height <= 0) return;

        const color = item.percentChange > 0 ? '#10b981' 
          : item.percentChange < 0 ? '#ef4444' 
          : '#6b7280';

        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '80');

        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = borderWidth / zoomLevel;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 8);
        ctx.fill();
        if (borderWidth > 0) ctx.stroke();
        ctx.closePath();

        const image = imageMap.get(item.imageName);
        if (!image?.complete || image.naturalWidth === 0) return;

        const minDimension = Math.min(width, height);
        const imageSize = Math.min(Math.max(minDimension / 4, 5), 1000) * textScale;
        const aspectRatio = image.width / image.height;
        
        let imageWidth = imageSize;
        let imageHeight = imageSize / aspectRatio;
        
        if (imageHeight > imageSize) {
          imageHeight = imageSize;
          imageWidth = imageSize * aspectRatio;
        }

        const titleFontSize = Math.min(Math.max(minDimension / 10, 1), 18) * scale;
        const valueFontSize = 0.8 * titleFontSize;
        const marketCapFontSize = 0.65 * titleFontSize;
        const spacing = Math.min(Math.max(minDimension / 40, 0), 8) * scale;
        
        const totalTextHeight = chartType === 'marketcap'
          ? imageHeight + (2 * titleFontSize) + 3 * spacing
          : imageHeight + (2 * titleFontSize + valueFontSize + marketCapFontSize) + 4 * spacing;
        const textStartY = y + (height - totalTextHeight) / 2;
        const centerX = x + width / 2;

        ctx.drawImage(
          image,
          x + (width - imageWidth) / 2,
          textStartY,
          imageWidth,
          imageHeight
        );

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'transparent';
        ctx.lineWidth = 0;
        ctx.font = `bold ${titleFontSize}px 'Inter', sans-serif`;
        ctx.fillText(item.name, centerX, textStartY + imageHeight + titleFontSize + spacing);

        if (chartType === 'change') {
          ctx.font = `${titleFontSize}px sans-serif`;
          const valueText = `${item.percentChange >= 0 ? '+' : ''}${item.percentChange}%`;
          ctx.fillText(valueText, centerX, textStartY + imageHeight + 2 * titleFontSize + 2 * spacing);

          ctx.font = `${valueFontSize}px sans-serif`;
          
          const bottomText = `${item.price.toFixed(2)}`;
          const bottomTextWidth = ctx.measureText(bottomText).width;
          const bottomCoinSize = 1 * valueFontSize;
          const bottomCoinOffsetX = -0.1 * valueFontSize;
          const bottomTextOffsetX = -0.05 * valueFontSize;

          if (currency === 'ton' && toncoinImage.complete && toncoinImage.naturalWidth > 0) {
            try {
              ctx.drawImage(
                toncoinImage,
                centerX - bottomTextWidth / 2 - bottomCoinSize - bottomCoinOffsetX,
                textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing - 0.8 * bottomCoinSize,
                bottomCoinSize,
                bottomCoinSize
              );
              ctx.fillText(bottomText, centerX + bottomCoinSize / 2 + bottomCoinOffsetX, textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing);
            } catch (error) {
              console.error('Error drawing toncoin image for bottomText:', error);
              ctx.fillText(`💎 ${bottomText}`, centerX, textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing);
            }
          } else if (currency === 'ton') {
            ctx.fillText(`💎 ${bottomText}`, centerX, textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing);
          } else if (currency === 'usd') {
            const dollarWidth = ctx.measureText('$').width;
            ctx.fillText('$', centerX - bottomTextWidth / 2 - bottomTextOffsetX - dollarWidth / 2, textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing);
            ctx.fillText(bottomText, centerX + dollarWidth / 2 + bottomTextOffsetX, textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing);
          } else {
            ctx.fillText(bottomText, centerX, textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing);
          }

          ctx.font = `${marketCapFontSize}px sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          const marketCapText = `MC: ${item.marketCap}`;
          ctx.fillText(marketCapText, centerX, textStartY + imageHeight + 2 * titleFontSize + valueFontSize + marketCapFontSize + 4 * spacing);
        } else {
          ctx.font = `bold ${titleFontSize}px sans-serif`;
          ctx.fillStyle = 'white';
          const marketCapText = `MC: ${item.marketCap}`;
          ctx.fillText(marketCapText, centerX, textStartY + imageHeight + titleFontSize + 2 * spacing);
        }

        if (index === 0) {
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.textAlign = 'right';
          ctx.fillText('@Novachartbot', x + width - 5, y + height - 5);
        }
      });

      ctx.restore();
    }
  };
};

export const TreemapHeatmap: React.FC<TreemapHeatmapProps> = ({
  data,
  chartType,
  timeGap,
  currency
}) => {
  const chartRef = useRef<ChartJS>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayData, setDisplayData] = useState<TreemapDataPoint[]>([]);

  const handleHapticFeedback = useCallback(() => {
    if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    } else if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  const downloadImage = async () => {
    handleHapticFeedback();
    
    const chart = chartRef.current;
    if (!chart) return;

    const canvas = document.createElement('canvas');
    canvas.width = 3840;
    canvas.height = 2160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const transformedData = transformGiftData(data, chartType, timeGap, currency);
    const imageMap = await preloadImagesAsync(transformedData);

    const tempChart = new ChartJS(ctx, {
      type: 'treemap',
      data: {
        datasets: [{
          data: [],
          tree: transformedData,
          key: 'size',
          imageMap,
          backgroundColor: 'transparent'
        } as any]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      },
      plugins: [createImagePlugin(chartType, currency, 70, 2, 2.4, 2)]
    });

    setTimeout(async () => {
      try {
        const imageUrl = canvas.toDataURL('image/jpeg', 1);
        const telegramWebApp = (window as any).Telegram?.WebApp;
        const isTelegram = !!telegramWebApp;
        
        if (!isTelegram) {
          const link = document.createElement('a');
          link.download = `heatmap-${Date.now()}.jpeg`;
          link.href = imageUrl;
          link.click();
          tempChart.destroy();
          return;
        }

        const userId = telegramWebApp.initDataUnsafe?.user?.id;
        if (!userId) {
          console.error('No user ID found');
          tempChart.destroy();
          return;
