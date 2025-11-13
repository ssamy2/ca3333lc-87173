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
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { sendHeatmapImage } from "@/utils/heatmapImageSender";
import { ImageSendDialog } from "@/components/ImageSendDialog";
import { imageCache } from "@/services/imageCache";
import { useLanguage } from "@/contexts/LanguageContext";
import tonIconSrc from "@/assets/ton-icon.png";

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
}

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
  borderWidth: number = 1,
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
        ctx.stroke();
        ctx.closePath();

        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 2, y + 2, width - 4, height - 4);
        ctx.clip();

        const image = imageMap.get(item.imageName);
        if (!image?.complete || image.naturalWidth === 0) {
          ctx.restore();
          return;
        }

        const T = Math.min(width, height);

        const imageSize = (T / 6) * textScale;
        const aspectRatio = image.width / image.height;

        let imageWidth = imageSize;
        let imageHeight = imageSize / aspectRatio;

        if (imageHeight > imageSize) {
          imageHeight = imageSize;
          imageWidth = imageSize * aspectRatio;
        }

        const baseFontSize = Math.max(Math.min(T / 8, 16), 6);
        const titleFontSize = baseFontSize * scale;
        const valueFontSize = baseFontSize * 0.7 * scale;
        const marketCapFontSize = baseFontSize * 0.55 * scale;
        const spacing = Math.max(Math.min(T / 60, 5), 1) * scale;

        const totalTextHeight =
          chartType === "marketcap"
            ? imageHeight + titleFontSize + 2 * spacing
            : imageHeight + (titleFontSize + valueFontSize + marketCapFontSize) + 3 * spacing;
        const textStartY = y + (height - totalTextHeight) / 2;
        const centerX = x + width / 2;

        ctx.drawImage(image, x + (width - imageWidth) / 2, textStartY, imageWidth, imageHeight);

        ctx.shadowColor = "#1e293b";
        ctx.shadowBlur = 1.5;
        ctx.shadowOffsetX = 0.5;
        ctx.shadowOffsetY = 0.5;

        ctx.fillStyle = "white";
        ctx.textAlign = "center";

        if (chartType === "change") {
          ctx.font = `bold ${titleFontSize}px sans-serif`;
          const nameY = textStartY + imageHeight + titleFontSize + spacing;
          ctx.fillText(item.name, centerX, nameY);

          ctx.font = `${valueFontSize}px sans-serif`;
          const valueText = `${item.percentChange >= 0 ? "+" : ""}${item.percentChange}%`;
          const valueY = nameY + valueFontSize + spacing;
          ctx.fillText(valueText, centerX, valueY);

          ctx.font = `${valueFontSize}px sans-serif`;

          const bottomText = `${item.price.toFixed(2)}`;
          const bottomTextWidth = ctx.measureText(bottomText).width;
          const bottomCoinSize = 0.9 * valueFontSize;
          const bottomCoinOffsetX = -0.1 * valueFontSize;
          const bottomTextOffsetX = -0.05 * valueFontSize;

          const bottomY = valueY + valueFontSize + spacing;

          if (currency === "ton" && toncoinImage.complete && toncoinImage.naturalWidth > 0) {
            try {
              ctx.drawImage(
                toncoinImage,
                centerX - bottomTextWidth / 2 - bottomCoinSize - bottomCoinOffsetX,
                bottomY - 0.8 * bottomCoinSize,
                bottomCoinSize,
                bottomCoinSize,
              );
              ctx.fillText(bottomText, centerX + bottomCoinSize / 2 + bottomCoinOffsetX, bottomY);
            } catch (error) {
              ctx.fillText(`💎 ${bottomText}`, centerX, bottomY);
            }
          } else if (currency === "ton") {
            ctx.fillText(`💎 ${bottomText}`, centerX, bottomY);
          } else if (currency === "usd") {
            const dollarWidth = ctx.measureText("$").width;
            ctx.fillText("$", centerX - bottomTextWidth / 2 - bottomTextOffsetX - dollarWidth / 2, bottomY);
            ctx.fillText(bottomText, centerX + dollarWidth / 2 + bottomTextOffsetX, bottomY);
          } else {
            ctx.fillText(bottomText, centerX, bottomY);
          }

          ctx.font = `${marketCapFontSize}px sans-serif`;
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          const marketCapText = `MC: ${item.marketCap}`;
          ctx.fillText(marketCapText, centerX, bottomY + marketCapFontSize + spacing);
        } else {
          ctx.font = `bold ${titleFontSize}px sans-serif`;
          ctx.fillStyle = "white";
          const nameY = textStartY + imageHeight + titleFontSize + spacing;
          ctx.fillText(item.name, centerX, nameY);

          const marketCapText = `MC: ${item.marketCap}`;
          ctx.fillText(marketCapText, centerX, nameY + titleFontSize + spacing);
        }

        if (index === 0) {
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
          ctx.textAlign = "right";
          ctx.fillText("@Novachartbot", x + width - 5, y + height - 5);
        }

        ctx.restore();
      });

      ctx.restore();
    },
  };
};

export interface TreemapHeatmapHandle {
  downloadImage: () => Promise<void>;
}

export const TreemapHeatmap = React.forwardRef<TreemapHeatmapHandle, TreemapHeatmapProps>(
  ({ data, chartType, timeGap, currency }, ref) => {
    const chartRef = useRef<ChartJS>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [displayData, setDisplayData] = useState<TreemapDataPoint[]>([]);
    const [showSendDialog, setShowSendDialog] = useState(false);
    const { language } = useLanguage();

    const handleHapticFeedback = useCallback(() => {
      if ((window as any).Telegram?.WebApp) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred("light");
      } else if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }
    }, []);

    const downloadImage = useCallback(async () => {
      handleHapticFeedback();

      const telegramWebApp = (window as any).Telegram?.WebApp;
      const isTelegram = !!telegramWebApp;

      if (isTelegram) {
        setShowSendDialog(true);
      }

      const chart = chartRef.current;
      if (!chart) return;

      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 1080;
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
        plugins: [createImagePlugin(chartType, currency, 50, 1.5, 1.8, 1)],
      });

      setTimeout(async () => {
        try {
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

          await sendHeatmapImage({
            canvas,
            userId: userId.toString(),
            language,
            onSuccess: () => {
              tempChart.destroy();
            },
            onError: () => {
              tempChart.destroy();
            },
          });
        } catch (error) {
          console.error("Error processing image:", error);
          tempChart.destroy();
        }
      }, 0);
    }, [data, chartType, timeGap, currency, handleHapticFeedback]);

    React.useImperativeHandle(
      ref,
      () => ({
        downloadImage,
      }),
      [downloadImage],
    );

    useEffect(() => {
      const filteredData = data.filter((item) => !item.preSale);
      const transformed = transformGiftData(filteredData, chartType, timeGap, currency);

      const allImagesCached = transformed.every((item) => {
        const cached = imageCache.getImageFromCache(item.imageName);
        return cached !== null;
      });

      if (allImagesCached) {
        setDisplayData(transformed);
        setIsLoading(false);
      } else {
        setIsLoading(true);
        setDisplayData(transformed);

        const imageUrls = transformed.map((item) => item.imageName);
        imageCache
          .preloadUncachedImages(imageUrls)
          .then(() => {
            setIsLoading(false);
          })
          .catch((error) => {
            console.error("Error preloading images:", error);
            setIsLoading(false);
          });
      }
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
      <>
        <ImageSendDialog isOpen={showSendDialog} onClose={() => setShowSendDialog(false)} />

        <div className="w-full flex flex-col items-center gap-3 px-3">
          <div className="w-full flex gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-card border border-border text-foreground font-medium"
              onClick={handleResetZoom}
            >
              <RotateCcw size={18} />
              Reset Zoom
            </button>

            <button
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-card border border-border"
              onClick={handleZoomOut}
            >
              <ZoomOut size={20} />
            </button>

            <button
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-card border border-border"
              onClick={handleZoomIn}
            >
              <ZoomIn size={20} />
            </button>
          </div>

          <div className="w-full min-h-[600px] rounded-xl overflow-hidden bg-card border border-border">
            <Chart
              ref={chartRef}
              type="treemap"
              data={chartData}
              options={chartOptions}
              plugins={[createImagePlugin(chartType, currency)]}
            />
          </div>
        </div>
      </>
    );
  },
);

TreemapHeatmap.displayName = "TreemapHeatmap";

export default TreemapHeatmap;
