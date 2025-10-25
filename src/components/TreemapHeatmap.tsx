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
  upgradedSupply: number;
  preSale?: boolean;
}

interface TreemapDataPoint {
  name: string;
  percentChange: number;
  size: number;
  imageName: string;
  price: number;
  marketCap: number;
}

interface TreemapHeatmapProps {
  data: GiftItem[];
  chartType: 'change' | 'marketCap';
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
      <span onClick={() => setIsOpen(true)} className="w-full flex justify-center">
        {trigger}
      </span>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-secondaryTransparent rounded-xl shadow-xl p-6 w-full lg:w-5/6 max-w-md">
            <div className="w-full mt-2 flex flex-col items-center">
              <h1 className="flex flex-row items-center mb-5 gap-x-1 text-lg font-bold">
                <Download size={50} className="text-primary" />
              </h1>
              <p className="mb-3 text-center">Image will be sent to you soon</p>
              <button
                onClick={() => {
                  onDownload();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 bg-primary rounded-xl"
              >
                Ok
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
        img.src = item.imageName; // Use full URL
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
  chartType: 'change' | 'marketCap',
  timeGap: '24h' | '1w' | '1m',
  currency: 'ton' | 'usd'
): TreemapDataPoint[] => {
  return data.map(item => {
    const currentPrice = currency === 'ton' ? item.priceTon : item.priceUsd;
    let previousPrice = 0;

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
    const marketCap = currentPrice * (item.upgradedSupply || 0);
    
    const size = chartType === 'change' 
      ? 2 * Math.pow(Math.abs(percentChange) + 1, 1.5)
      : Math.max(marketCap / 1000, 1);

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
    img.src = item.imageName; // Use full URL
    imageMap.set(item.imageName, img);
  });
  
  return imageMap;
};

const createImagePlugin = (
  chartType: 'change' | 'marketCap',
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

        const color = item.percentChange > 0 ? '#018f35' 
          : item.percentChange < 0 ? '#dc2626' 
          : '#8F9779';

        ctx.fillStyle = color;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = borderWidth / zoomLevel;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 0);
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
        const spacing = Math.min(Math.max(minDimension / 40, 0), 8) * scale;
        
        const totalTextHeight = imageHeight + (2 * titleFontSize + valueFontSize) + 3 * spacing;
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
        ctx.font = `bold ${titleFontSize}px sans-serif`;
        ctx.fillText(item.name, centerX, textStartY + imageHeight + titleFontSize + spacing);

        ctx.font = `${titleFontSize}px sans-serif`;
        
        const valueText = chartType === 'change'
          ? `${item.percentChange >= 0 ? '+' : ''}${item.percentChange}%`
          : item.marketCap / 1000 >= 1000
            ? `${(item.marketCap / 1000000).toFixed(1)}M`
            : `${(item.marketCap / 1000).toFixed(1)}K`;

        const valueTextWidth = ctx.measureText(valueText).width;
        const coinSize = 1 * titleFontSize;
        const coinOffsetX = -0.1 * titleFontSize;
        const textOffsetX = -0.05 * titleFontSize;

        if (chartType === 'marketCap' && currency === 'ton' && toncoinImage.complete && toncoinImage.naturalWidth > 0) {
          try {
            ctx.drawImage(
              toncoinImage,
              centerX - valueTextWidth / 2 - coinSize - coinOffsetX,
              textStartY + imageHeight + 2 * titleFontSize + 2 * spacing - 0.8 * coinSize,
              coinSize,
              coinSize
            );
            ctx.fillText(valueText, centerX + coinSize / 2 + coinOffsetX, textStartY + imageHeight + 2 * titleFontSize + 2 * spacing);
          } catch (error) {
            console.error('Error drawing toncoin image for valueText:', error);
            ctx.fillText(`💎 ${valueText}`, centerX, textStartY + imageHeight + 2 * titleFontSize + 2 * spacing);
          }
        } else if (chartType === 'marketCap' && currency === 'ton') {
          ctx.fillText(`💎 ${valueText}`, centerX, textStartY + imageHeight + 2 * titleFontSize + 2 * spacing);
        } else if (currency === 'usd') {
          const dollarWidth = ctx.measureText('$').width;
          ctx.fillText('$', centerX - valueTextWidth / 2 - textOffsetX - dollarWidth / 2, textStartY + imageHeight + 2 * titleFontSize + 2 * spacing);
          ctx.fillText(valueText, centerX + dollarWidth / 2 + textOffsetX, textStartY + imageHeight + 2 * titleFontSize + 2 * spacing);
        } else {
          ctx.fillText(valueText, centerX, textStartY + imageHeight + 2 * titleFontSize + 2 * spacing);
        }

        ctx.font = `${valueFontSize}px sans-serif`;
        
        const bottomText = chartType === 'change'
          ? `${item.price.toFixed(2)}`
          : `${item.percentChange >= 0 ? '+' : ''}${item.percentChange}%`;

        const bottomTextWidth = ctx.measureText(bottomText).width;
        const bottomCoinSize = 1 * valueFontSize;
        const bottomCoinOffsetX = -0.1 * valueFontSize;
        const bottomTextOffsetX = -0.05 * valueFontSize;

        if (chartType === 'change' && currency === 'ton' && toncoinImage.complete && toncoinImage.naturalWidth > 0) {
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
        } else if (chartType === 'change' && currency === 'ton') {
          ctx.fillText(`💎 ${bottomText}`, centerX, textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing);
        } else if (chartType === 'change' && currency === 'usd') {
          const dollarWidth = ctx.measureText('$').width;
          ctx.fillText('$', centerX - bottomTextWidth / 2 - bottomTextOffsetX - dollarWidth / 2, textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing);
          ctx.fillText(bottomText, centerX + dollarWidth / 2 + bottomTextOffsetX, textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing);
        } else {
          ctx.fillText(bottomText, centerX, textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing);
        }

        if (index === 0) {
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.textAlign = 'right';
          ctx.fillText('@gift_charts', x + width - 5, y + height - 5);
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
    canvas.width = 1920;
    canvas.height = 1080;
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
      plugins: [createImagePlugin(chartType, currency, 35, 1, 1.2, 1)]
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
        }

        const blob = await (await fetch(imageUrl)).blob();
        const formData = new FormData();
        formData.append('file', blob, `heatmap-${Date.now()}.jpeg`);
        formData.append('chatId', userId.toString());
        formData.append('content', 'Here is a 1920x1080 image of a Heatmap chart!');

        await fetch('https://giftcharts-api.onrender.com/telegram/send-image', {
          method: 'POST',
          body: formData
        });

        tempChart.destroy();
      } catch (error) {
        console.error('Error sending image:', error);
        tempChart.destroy();
      }
    }, 0);
  };

  useEffect(() => {
    const filteredData = data.filter(item => !item.preSale);
    const transformed = transformGiftData(filteredData, chartType, timeGap, currency);
    setDisplayData(transformed);
    setIsLoading(false);
  }, [data, chartType, timeGap, currency]);

  const chartData: ChartData<'treemap'> = {
    datasets: [{
      data: [],
      tree: displayData,
      key: 'size',
      imageMap: preloadImages(displayData),
      backgroundColor: 'transparent'
    } as any]
  };

  const chartOptions: ChartOptions<'treemap'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      zoom: {
        zoom: {
          wheel: { enabled: false },
          pinch: { enabled: false },
          mode: 'xy'
        },
        pan: {
          enabled: false,
          mode: 'xy',
          onPan: (context: any) => {
            updateInteractivity(context.chart);
          }
        }
      }
    },
    events: []
  };

  const handleResetZoom = () => {
    const chart = chartRef.current;
    if (chart) {
      (chart as any).resetZoom();
      chart.update('none');
      updateInteractivity(chart);
    }
    handleHapticFeedback();
  };

  const handleZoomOut = () => {
    const chart = chartRef.current;
    if (chart) {
      const zoomLevel = (chart as any).getZoomLevel?.() || 1;
      const newZoom = Math.max(1, zoomLevel - 0.5);
      
      if (newZoom === 1) {
        (chart as any).resetZoom();
      } else {
        (chart as any).zoom(newZoom / zoomLevel);
      }
      
      chart.update('none');
      updateInteractivity(chart);
    }
    handleHapticFeedback();
  };

  const handleZoomIn = () => {
    const chart = chartRef.current;
    if (chart) {
      const zoomLevel = (chart as any).getZoomLevel?.() || 1;
      const newZoom = Math.min(10, zoomLevel + 0.3);
      (chart as any).zoom(newZoom / zoomLevel);
      chart.update('none');
      updateInteractivity(chart);
    }
    handleHapticFeedback();
  };

  if (isLoading) {
    return (
      <div className="w-full pt-0 pb-24 flex flex-col items-center overflow-visible">
        <div className="w-full flex flex-col items-center px-3 gap-y-3 mb-3">
          <div className="w-full lg:w-5/6 flex flex-row justify-between items-center gap-x-3">
            <button className="w-fit flex flex-row items-center text-lg font-bold">
              <ArrowLeft />
              Go Back
            </button>
          </div>
        </div>
        <div className="flex justify-center items-center mt-5">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full lg:w-5/6 mb-3 px-3 flex gap-2">
        <button
          className="w-full flex flex-row items-center justify-center gap-x-1 text-sm h-8 rounded-xl bg-secondaryTransparent"
          onClick={handleResetZoom}
        >
          <RotateCcw size={16} />
          Reset Zoom
        </button>
        
        <div className="w-full flex flex-row gap-x-2">
          <button
            className="w-full flex items-center justify-center h-8 rounded-xl bg-secondaryTransparent"
            onClick={handleZoomOut}
          >
            <ZoomOut size={16} />
          </button>
          <button
            className="w-full flex items-center justify-center h-8 rounded-xl bg-secondaryTransparent"
            onClick={handleZoomIn}
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      <DownloadHeatmapModal
        trigger={
          <button className="w-full lg:w-5/6 flex flex-row items-center justify-center gap-x-1 text-sm h-8 rounded-t-lg bg-secondaryTransparent">
            <Download size={16} />
            Download Heatmap as Image
          </button>
        }
        onDownload={downloadImage}
      />

      <div className="w-full lg:w-5/6 min-h-[600px]">
        <Chart
          ref={chartRef}
          type="treemap"
          data={chartData}
          options={chartOptions}
          plugins={[createImagePlugin(chartType, currency)]}
        />
      </div>
    </div>
  );
};

export default TreemapHeatmap;