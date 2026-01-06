/**
 * CryptoChart - Interactive Chart.js Component with Timeframe Selectors
 * @novachartsbot - Crypto Gift Center
 */

import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { cn } from '@/lib/utils';
import { CryptoChartData, fetchCryptoChart, formatPrice } from '@/services/cryptoService';
import { Loader2 } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CryptoChartProps {
  coinId: string;
  coinName: string;
  coinSymbol: string;
  currentPrice: number;
  priceChange24h: number;
}

type TimeFrame = '1D' | '1W' | '1M' | '1Y';

const timeFrameConfig: Record<TimeFrame, { days: number; label: string }> = {
  '1D': { days: 1, label: '24H' },
  '1W': { days: 7, label: '7D' },
  '1M': { days: 30, label: '30D' },
  '1Y': { days: 365, label: '1Y' }
};

const CryptoChart: React.FC<CryptoChartProps> = memo(({
  coinId,
  coinName,
  coinSymbol,
  currentPrice,
  priceChange24h
}) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1W');
  const [chartData, setChartData] = useState<CryptoChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<ChartJS<'line'>>(null);

  // Fetch chart data when timeframe or coin changes
  useEffect(() => {
    const loadChartData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchCryptoChart(coinId, timeFrameConfig[timeFrame].days);
        setChartData(data);
      } catch (err) {
        console.error('[CryptoChart] Error loading chart:', err);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [coinId, timeFrame]);

  // Calculate price change for selected period
  const calculatePeriodChange = (): { value: number; percentage: number } => {
    if (!chartData?.prices || chartData.prices.length < 2) {
      return { value: 0, percentage: 0 };
    }
    
    const firstPrice = chartData.prices[0][1];
    const lastPrice = chartData.prices[chartData.prices.length - 1][1];
    const change = lastPrice - firstPrice;
    const percentage = (change / firstPrice) * 100;
    
    return { value: change, percentage };
  };

  const periodChange = calculatePeriodChange();
  const isPositive = periodChange.percentage >= 0;

  // Format chart data
  const formatChartData = (): ChartData<'line'> => {
    if (!chartData?.prices) {
      return { labels: [], datasets: [] };
    }

    const labels = chartData.prices.map(([timestamp]) => {
      const date = new Date(timestamp);
      if (timeFrame === '1D') {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (timeFrame === '1W') {
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    });

    const prices = chartData.prices.map(([, price]) => price);

    return {
      labels,
      datasets: [
        {
          label: `${coinSymbol.toUpperCase()} Price`,
          data: prices,
          fill: true,
          borderColor: isPositive ? '#22c55e' : '#ef4444',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height);
            if (isPositive) {
              gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
              gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
            } else {
              gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
              gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
            }
            return gradient;
          },
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: isPositive ? '#22c55e' : '#ef4444',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          tension: 0.4
        }
      ]
    };
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: isPositive ? '#22c55e' : '#ef4444',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (items) => {
            if (items.length > 0) {
              return items[0].label;
            }
            return '';
          },
          label: (context) => {
            return `${formatPrice(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.7)',
          font: {
            size: 10,
            family: 'Inter, sans-serif'
          },
          maxRotation: 0,
          maxTicksLimit: 6
        },
        border: {
          display: false
        }
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.7)',
          font: {
            size: 10,
            family: 'Inter, sans-serif'
          },
          callback: (value) => formatPrice(value as number),
          maxTicksLimit: 5
        },
        border: {
          display: false
        }
      }
    }
  };

  return (
    <div className={cn(
      "relative flex flex-col",
      "bg-card/80 dark:bg-card/60 backdrop-blur-xl",
      "rounded-2xl border border-border/30 dark:border-border/20",
      "shadow-lg shadow-black/5 dark:shadow-black/30",
      "overflow-hidden"
    )}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-border/20">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-foreground">{coinName}</h3>
            <span className="text-muted-foreground text-sm bg-muted/50 px-2 py-0.5 rounded">
              {coinSymbol.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-bold text-2xl text-foreground font-mono">
              {formatPrice(currentPrice)}
            </span>
            <span className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-medium",
              isPositive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
            )}>
              {isPositive ? '+' : ''}{periodChange.percentage.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
          {(Object.keys(timeFrameConfig) as TimeFrame[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                timeFrame === tf
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {timeFrameConfig[tf].label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative h-[300px] sm:h-[350px] p-4">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        ) : (
          <Line ref={chartRef} data={formatChartData()} options={chartOptions} />
        )}

        {/* Watermark */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="text-[10px] text-muted-foreground/40 font-medium tracking-wider">
            @novachartsbot
          </span>
        </div>
      </div>

      {/* Stats Footer */}
      {chartData && (
        <div className="grid grid-cols-3 gap-2 p-4 pt-0">
          <div className="flex flex-col items-center p-2 bg-muted/20 rounded-lg">
            <span className="text-[10px] text-muted-foreground">High</span>
            <span className="text-xs font-semibold text-foreground">
              {formatPrice(Math.max(...(chartData.prices?.map(p => p[1]) || [0])))}
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted/20 rounded-lg">
            <span className="text-[10px] text-muted-foreground">Low</span>
            <span className="text-xs font-semibold text-foreground">
              {formatPrice(Math.min(...(chartData.prices?.map(p => p[1]) || [0])))}
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted/20 rounded-lg">
            <span className="text-[10px] text-muted-foreground">Change</span>
            <span className={cn(
              "text-xs font-semibold",
              isPositive ? "text-green-500" : "text-red-500"
            )}>
              {formatPrice(Math.abs(periodChange.value))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

CryptoChart.displayName = 'CryptoChart';

export default CryptoChart;
