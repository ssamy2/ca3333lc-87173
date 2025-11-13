import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Legend,
} from "chart.js";
import { TreemapController, TreemapElement } from "chartjs-chart-treemap";
import { Chart } from "react-chartjs-2";
import zoomPlugin from "chartjs-plugin-zoom";
import { Download, ZoomIn, ZoomOut, RotateCcw, RefreshCw, Diamond } from "lucide-react";
import { sendHeatmapImage } from '@/utils/heatmapImageSender';
import { useLanguage } from '@/contexts/LanguageContext';
import tonIconSrc from '@/assets/ton-icon.png';

ChartJS.register(
  TreemapController,
  TreemapElement,
  zoomPlugin,
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
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
  chartType: "change" | "marketcap";
  timeGap: "24h" | "1w" | "1m";
  currency: "ton" | "usd";
  dataSource: "normal" | "black";
  onChartTypeChange: (type: "change" | "marketcap") => void;
  onTimeGapChange: (gap: "24h" | "1w" | "1m") => void;
  onCurrencyChange: (currency: "ton" | "usd") => void;
  onDataSourceChange: (source: "normal" | "black") => void;
  onRefresh: () => void;
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
    data.map((item) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.crossOrigin = "anonymous";
        img.src = item.imageName;
        imageMap.set(item.imageName, img);
      });
    }),
  );

  return imageMap;
};

const updateInteractivity = (chart: ChartJS) => {
  const zoomLevel = (chart as any).getZoomLevel?.() || 1;
  chart.options.plugins!.zoom!.pan!.enabled = zoomLevel > 1;
  (chart.options as any).events = zoomLevel > 1 ? ["mousemove", "click", "touchstart", "touchmove", "touchend"] : [];

  const canvas = chart.canvas;
  if (canvas) {
    canvas.style.cursor = zoomLevel > 1 ? "pointer" : "default";
  }

  chart.update("none");
};

const transformGiftData = (
  data: GiftItem[],
  chartType: "change" | "marketcap",
  timeGap: "24h" | "1w" | "1m",
  currency: "ton" | "usd",
): TreemapDataPoint[] => {
  return data.map((item) => {
    const currentPrice = currency === "ton" ? item.priceTon : item.priceUsd;

    if (chartType === "marketcap") {
      const marketCapStr = currency === "ton" ? item.marketCapTon || "0" : item.marketCapUsd || "0";

      const parseMarketCap = (str: string): number => {
        const num = parseFloat(str.replace(/[KM,]/g, ""));
        if (str.includes("M")) return num * 1000000;
        if (str.includes("K")) return num * 1000;
        return num;
      };

      const marketCapValue = parseMarketCap(marketCapStr);
      const size = Math.sqrt(marketCapValue) / 100;

      let previousPrice = currentPrice;

      switch (timeGap) {
        case "24h":
          previousPrice =
            currency === "ton" ? item.tonPrice24hAgo || currentPrice : item.usdPrice24hAgo || currentPrice;
          break;
        case "1w":
          previousPrice =
            currency === "ton" ? item.tonPriceWeekAgo || currentPrice : item.usdPriceWeekAgo || currentPrice;
          break;
        case "1m":
          previousPrice =
            currency === "ton" ? item.tonPriceMonthAgo || currentPrice : item.usdPriceMonthAgo || currentPrice;
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
        marketCap: marketCapStr,
      };
    }

    let previousPrice = currentPrice;

    switch (timeGap) {
      case "24h":
        previousPrice = currency === "ton" ? item.tonPrice24hAgo || currentPrice : item.usdPrice24hAgo || currentPrice;
        break;
      case "1w":
        previousPrice =
          currency === "ton" ? item.tonPriceWeekAgo || currentPrice : item.usdPriceWeekAgo || currentPrice;
        break;
      case "1m":
        previousPrice =
          currency === "ton" ? item.tonPriceMonthAgo || currentPrice : item.usdPriceMonthAgo || currentPrice;
        break;
      default:
        previousPrice = currentPrice;
    }

    const percentChange = previousPrice === 0 ? 0 : ((currentPrice - previousPrice) / previousPrice) * 100;

    const marketCap = currency === "ton" ? item.marketCapTon || "0" : item.marketCapUsd || "0";

    const size = 2 * Math.pow(Math.abs(percentChange) + 1, 1.5);

    return {
      name: item.name,
      percentChange: Number(percentChange.toFixed(2)),
      size,
      imageName: item.image,
      price: currentPrice,
      marketCap,
    };
  });
};

const preloadImages = (data: TreemapDataPoint[]): Map<string, HTMLImageElement> => {
  const imageMap = new Map<string, HTMLImageElement>();

  data.forEach((item) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = item.imageName;
    imageMap.set(item.imageName, img);
  });

  return imageMap;
};

const createImagePlugin = (
  chartType: "change" | "marketcap",
  currency: "ton" | "usd",
  fontSize: number = 15,
  scale: number = 1,
  textScale: number = 1,
  borderWidth: number = 0,
): Plugin<"treemap"> => {
  return {
    id: "treemapImages",
    afterDatasetDraw(chart) {
      const { ctx, data } = chart;
      const dataset = data.datasets[0] as any;
      const imageMap = dataset.imageMap as Map<string, HTMLImageElement>;
      const zoomLevel = (chart as any).getZoomLevel?.() || 1;

      const toncoinImage = imageMap.get("toncoin") || new Image();
      if (!imageMap.has("toncoin")) {
        toncoinImage.src = tonIconSrc;
        imageMap.set("toncoin", toncoinImage);
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

        const color = item.percentChange > 0 ? "#018f35" : item.percentChange < 0 ? "#dc2626" : "#8F9779";

        ctx.fillStyle = color;
        ctx.strokeStyle = "#1e293b";
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
        const marketCapFontSize = 0.65 * titleFontSize;
        const spacing = Math.min(Math.max(minDimension / 40, 0), 8) * scale;

        const totalTextHeight =
          chartType === "marketcap"
            ? imageHeight + 2 * titleFontSize + 3 * spacing
            : imageHeight + (2 * titleFontSize + valueFontSize + marketCapFontSize) + 4 * spacing;
        const textStartY = y + (height - totalTextHeight) / 2;
        const centerX = x + width / 2;

        ctx.drawImage(image, x + (width - imageWidth) / 2, textStartY, imageWidth, imageHeight);

        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.strokeStyle = "transparent";
        ctx.lineWidth = 0;
        ctx.font = `bold ${titleFontSize}px sans-serif`;
        ctx.fillText(item.name, centerX, textStartY + imageHeight + titleFontSize + spacing);

        if (chartType === "change") {
          ctx.font = `${titleFontSize}px sans-serif`;
          const valueText = `${item.percentChange >= 0 ? "+" : ""}${item.percentChange}%`;
          ctx.fillText(valueText, centerX, textStartY + imageHeight + 2 * titleFontSize + 2 * spacing);

          ctx.font = `${valueFontSize}px sans-serif`;

          const bottomText = `${item.price.toFixed(2)}`;
          const bottomTextWidth = ctx.measureText(bottomText).width;
          const bottomCoinSize = 1 * valueFontSize;
          const bottomCoinOffsetX = -0.1 * valueFontSize;
          const bottomTextOffsetX = -0.05 * valueFontSize;

          if (currency === "ton" && toncoinImage.complete && toncoinImage.naturalWidth > 0) {
            try {
              ctx.drawImage(
                toncoinImage,
                centerX - bottomTextWidth / 2 - bottomCoinSize - bottomCoinOffsetX,
                textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing - 0.8 * bottomCoinSize,
                bottomCoinSize,
                bottomCoinSize,
              );
              ctx.fillText(
                bottomText,
                centerX + bottomCoinSize / 2 + bottomCoinOffsetX,
                textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing,
              );
            } catch (error) {
              console.error("Error drawing toncoin image for bottomText:", error);
              ctx.fillText(
                `💎 ${bottomText}`,
                centerX,
                textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing,
              );
            }
          } else if (currency === "ton") {
            ctx.fillText(
              `💎 ${bottomText}`,
              centerX,
              textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing,
            );
          } else if (currency === "usd") {
            const dollarWidth = ctx.measureText("$").width;
            ctx.fillText(
              "$",
              centerX - bottomTextWidth / 2 - bottomTextOffsetX - dollarWidth / 2,
              textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing,
            );
            ctx.fillText(
              bottomText,
              centerX + dollarWidth / 2 + bottomTextOffsetX,
              textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing,
            );
          } else {
            ctx.fillText(
              bottomText,
              centerX,
              textStartY + imageHeight + 2 * titleFontSize + valueFontSize + 3 * spacing,
            );
          }

          ctx.font = `${marketCapFontSize}px sans-serif`;
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          const marketCapText = `MC: ${item.marketCap}`;
          ctx.fillText(
            marketCapText,
            centerX,
            textStartY + imageHeight + 2 * titleFontSize + valueFontSize + marketCapFontSize + 4 * spacing,
          );
        } else {
          ctx.font = `bold ${titleFontSize}px sans-serif`;
          ctx.fillStyle = "white";
          const marketCapText = `MC: ${item.marketCap}`;
          ctx.fillText(marketCapText, centerX, textStartY + imageHeight + titleFontSize + 2 * spacing);
        }

        if (index === 0) {
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = "rgba(255,255,255,0.6)";
          ctx.textAlign = "right";
          ctx.fillText("@Novachartbot", x + width - 5, y + height - 5);
        }
      });

      ctx.restore();
    },
  };
};

export const TreemapHeatmap: React.FC<TreemapHeatmapProps> = ({
  data,
  chartType,
  timeGap,
  currency,
  dataSource,
  onChartTypeChange,
  onTimeGapChange,
  onCurrencyChange,
  onDataSourceChange,
  onRefresh,
}) => {
  const chartRef = useRef<ChartJS>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayData, setDisplayData] = useState<TreemapDataPoint[]>([]);
  const { language } = useLanguage();

  const handleHapticFeedback = useCallback(() => {
    if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred("light");
    } else if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  const downloadImage = async () => {
    handleHapticFeedback();

    const chart = chartRef.current;
    if (!chart) return;

    const canvas = document.createElement("canvas");
    canvas.width = 3840;
    canvas.height = 2160;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const transformedData = transformGiftData(data, chartType, timeGap, currency);
    const imageMap = await preloadImagesAsync(transformedData);

    const tempChart = new ChartJS(ctx, {
      type: "treemap",
      data: {
        datasets: [
          {
            data: [],
            tree: transformedData,
            key: "size",
            imageMap,
            backgroundColor: "transparent",
          } as any,
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      },
      plugins: [createImagePlugin(chartType, currency, 70, 2, 2.4, 2)],
    });

    setTimeout(async () => {
      try {
        const telegramWebApp = (window as any).Telegram?.WebApp;
        const isTelegram = !!telegramWebApp;

        if (!isTelegram) {
          const imageUrl = canvas.toDataURL("image/jpeg", 1);
          const link = document.createElement("a");
          link.download = `heatmap-${Date.now()}.jpeg`;
          link.href = imageUrl;
          link.click();
          tempChart.destroy();
          return;
        }

        const userId = telegramWebApp.initDataUnsafe?.user?.id;
        if (!userId) {
          console.error("No user ID found");
          tempChart.destroy();
          return;
        }

        // Use the old method from heatmapImageSender
        await sendHeatmapImage({
          canvas,
          userId: userId.toString(),
          language,
          onSuccess: () => {
            tempChart.destroy();
          },
          onError: (error) => {
            console.error('Error sending image:', error);
            tempChart.destroy();
          }
        });
      } catch (error) {
        console.error("Error in downloadImage:", error);
        tempChart.destroy();
      }
    }, 0);
  };

  useEffect(() => {
    const filteredData = data.filter((item) => !item.preSale);
    const transformed = transformGiftData(filteredData, chartType, timeGap, currency);
    setDisplayData(transformed);
    setIsLoading(false);
  }, [data, chartType, timeGap, currency]);

  const chartData: ChartData<"treemap"> = {
    datasets: [
      {
        data: [],
        tree: displayData,
        key: "size",
        imageMap: preloadImages(displayData),
        backgroundColor: "transparent",
      } as any,
    ],
  };

  const chartOptions: ChartOptions<"treemap"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      zoom: {
        zoom: {
          wheel: { enabled: false },
          pinch: { enabled: false },
          mode: "xy",
        },
        pan: {
          enabled: false,
          mode: "xy",
          onPan: (context: any) => {
            updateInteractivity(context.chart);
          },
        },
      },
    },
    events: [],
  };

  const handleResetZoom = () => {
    const chart = chartRef.current;
    if (chart) {
      (chart as any).resetZoom();
      chart.update("none");
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

      chart.update("none");
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
      chart.update("none");
      updateInteractivity(chart);
    }
    handleHapticFeedback();
  };

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-4 px-4">
      {/* Data Source & Currency */}
      <div className="w-full flex items-center justify-between gap-4">
        {/* Data Source */}
        <div className="flex gap-1 bg-gray-200/50 p-1 rounded-2xl">
          <button
            onClick={() => onDataSourceChange("normal")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              dataSource === "normal" ? "bg-gray-300 text-gray-800 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => onDataSourceChange("black")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              dataSource === "black" ? "bg-black text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Black
          </button>
        </div>

        {/* Currency & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-200/50 p-1 rounded-2xl">
            <button
              onClick={() => onCurrencyChange("ton")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                currency === "ton" ? "bg-blue-500 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Diamond size={14} />
              TON
            </button>
            <button
              onClick={() => onCurrencyChange("usd")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currency === "usd" ? "bg-blue-500 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              USD
            </button>
          </div>

          <button
            onClick={onRefresh}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white border shadow-sm hover:scale-105 transition-transform"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="w-full flex gap-2">
        <button
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-card border border-border text-foreground font-medium hover:bg-accent transition-colors"
          onClick={handleResetZoom}
        >
          <RotateCcw size={18} />
          Reset Zoom
        </button>

        <button
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-card border border-border hover:bg-accent transition-colors"
          onClick={handleZoomOut}
        >
          <ZoomOut size={20} />
        </button>

        <button
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-card border border-border hover:bg-accent transition-colors"
          onClick={handleZoomIn}
        >
          <ZoomIn size={20} />
        </button>
      </div>

      {/* Download Button */}
      <DownloadHeatmapModal
        trigger={
          <button className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
            <Download size={18} />
            Download Heatmap as Image
          </button>
        }
        onDownload={downloadImage}
      />

      {/* Chart */}
      <div className="w-full min-h-[600px] rounded-xl overflow-hidden bg-card border border-border shadow-sm">
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
