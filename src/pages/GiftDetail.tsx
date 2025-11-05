import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, CandlestickChart, Sparkles, LineChart } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Rectangle } from 'recharts';
import { toast } from 'sonner';
import TonIcon from '@/components/TonIcon';
import GiftModelsDialog from '@/components/GiftModelsDialog';
import GiftImage from '@/components/GiftImage';
import { getCachedData } from '@/services/marketCache';

interface GiftInfo {
  name: string;
  image: string;
  image_url?: string;
  supply: number;
  upgradedSupply: number;
  priceTon: number;
  priceUsd: number;
}

interface BlackFloorItem {
  gift_name: string;
  short_name: string;
  black_price: number;
  recorded_at: string;
  change_24h_percent?: number;
  change_1w_percent?: number;
  change_1m_percent?: number;
  change_3m_percent?: number;
  change_1y_percent?: number;
  available_periods?: string[];
  oldest_available_date?: string;
}

interface Model {
  _id: string;
  image: string;
  name: string;
  priceTon: number;
  priceUsd: number;
  rarity: number;
  tonPrice24hAgo: number;
  usdPrice24hAgo: number;
}

interface ChartData {
  date: string;
  priceTon: number;
  priceUsd: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

interface GiftDetailData {
  info: GiftInfo;
  life_chart: ChartData[];
  week_chart?: Array<{
    date: string;
    time: string;
    priceTon: number;
    priceUsd: number;
    amountOnSale: number;
    salesCount: number;
    volume: number;
  }>;
  models?: Model[];
}

type TimeRange = 'all' | '3m' | '1m' | '1w' | '3d' | '24h';
type ChartType = 'candlestick' | 'line';
type Currency = 'usd' | 'ton';
type DataSource = 'market' | 'black';

const GiftDetail = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [giftData, setGiftData] = useState<GiftDetailData | null>(null);
  const [blackFloorData, setBlackFloorData] = useState<BlackFloorItem[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>('market');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [currency, setCurrency] = useState<Currency>('ton');
  const [showModels, setShowModels] = useState(false);

  useEffect(() => {
    if (name) {
      fetchGiftData(name);
      fetchBlackFloorData(name);
    }
  }, [name]);

  const fetchGiftData = async (giftName: string) => {
    try {
      setLoading(true);
      const response = await fetch(`https://channelsseller.site/api/gift-data?name=${encodeURIComponent(giftName)}`);
      
      if (!response.ok) {
        console.error('Gift data fetch failed:', response.status);
        throw new Error('Failed to fetch gift data');
      }
      
      const data = await response.json();
      console.log('Gift data received:', data);
      setGiftData(data);
    } catch (error) {
      console.error('Error fetching gift data:', error);
      toast.error('Failed to load gift details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlackFloorData = async (giftName: string) => {
    try {
      const response = await fetch('https://channelsseller.site/api/black-floor');
      const data: BlackFloorItem[] = await response.json();
      
      // Filter for this specific gift
      const giftRecords = data.filter(item => item.gift_name === giftName);
      
      // Sort by recorded_at descending
      giftRecords.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
      
      // Calculate time period changes if we have enough data
      if (giftRecords.length > 0) {
        const latestPrice = giftRecords[0].black_price;
        const currentTime = new Date(giftRecords[0].recorded_at).getTime();
        
        const available_periods: string[] = [];
        
        // Helper function to find closest record to a target date
        const findClosestRecord = (targetTime: number) => {
          return giftRecords
            .filter(r => new Date(r.recorded_at).getTime() <= targetTime)
            .sort((a, b) => 
              Math.abs(new Date(a.recorded_at).getTime() - targetTime) - 
              Math.abs(new Date(b.recorded_at).getTime() - targetTime)
            )[0];
        };
        
        // Helper function to calculate change
        const calculateChange = (oldPrice: number) => {
          if (oldPrice > 0) {
            return ((latestPrice - oldPrice) / oldPrice) * 100;
          }
          return 0;
        };
        
        // Calculate 24h change
        const dayAgo = currentTime - 24 * 60 * 60 * 1000;
        const record24h = findClosestRecord(dayAgo);
        if (record24h && new Date(record24h.recorded_at).getTime() <= dayAgo) {
          giftRecords[0].change_24h_percent = calculateChange(record24h.black_price);
          available_periods.push('24h');
        }
        
        // Calculate 1w change
        const weekAgo = currentTime - 7 * 24 * 60 * 60 * 1000;
        const record1w = findClosestRecord(weekAgo);
        if (record1w && new Date(record1w.recorded_at).getTime() <= weekAgo) {
          giftRecords[0].change_1w_percent = calculateChange(record1w.black_price);
          available_periods.push('1w');
        }
        
        // Calculate 1m change
        const monthAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
        const record1m = findClosestRecord(monthAgo);
        if (record1m && new Date(record1m.recorded_at).getTime() <= monthAgo) {
          giftRecords[0].change_1m_percent = calculateChange(record1m.black_price);
          available_periods.push('1m');
        }
        
        // Calculate 3m change
        const threeMonthsAgo = currentTime - 90 * 24 * 60 * 60 * 1000;
        const record3m = findClosestRecord(threeMonthsAgo);
        if (record3m && new Date(record3m.recorded_at).getTime() <= threeMonthsAgo) {
          giftRecords[0].change_3m_percent = calculateChange(record3m.black_price);
          available_periods.push('3m');
        }
        
        // Calculate 1y change
        const yearAgo = currentTime - 365 * 24 * 60 * 60 * 1000;
        const record1y = findClosestRecord(yearAgo);
        if (record1y && new Date(record1y.recorded_at).getTime() <= yearAgo) {
          giftRecords[0].change_1y_percent = calculateChange(record1y.black_price);
          available_periods.push('1y');
        }
        
        giftRecords[0].available_periods = available_periods;
      }
      
      setBlackFloorData(giftRecords);
    } catch (error) {
      console.error('Error fetching black floor data:', error);
    }
  };

  const getChartData = () => {
    // If Black mode is selected, show black floor data
    if (dataSource === 'black') {
      if (blackFloorData.length === 0) return [];
      
      // Filter data based on time range
      let filteredData = blackFloorData;
      const now = new Date(blackFloorData[0].recorded_at);
      
      if (timeRange === '24h') {
        const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        filteredData = blackFloorData.filter(item => new Date(item.recorded_at) >= cutoff);
      } else if (timeRange === '1w') {
        const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredData = blackFloorData.filter(item => new Date(item.recorded_at) >= cutoff);
      } else if (timeRange === '1m') {
        const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredData = blackFloorData.filter(item => new Date(item.recorded_at) >= cutoff);
      }
      
      // Map black floor data to chart format with candlestick data
      return filteredData.map((item, index, arr) => {
        const price = item.black_price;
        const prevPrice = index > 0 ? arr[index - 1].black_price : price;
        const nextPrice = index < arr.length - 1 ? arr[index + 1].black_price : price;
        
        return {
          date: new Date(item.recorded_at).toLocaleDateString(),
          priceTon: price,
          priceUsd: price * 2.16,
          price: price,
          open: prevPrice,
          high: Math.max(price, prevPrice, nextPrice),
          low: Math.min(price, prevPrice, nextPrice),
          close: price,
          label: new Date(item.recorded_at).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
        };
      }).reverse(); // Reverse to show chronological order
    }
    
    // Market data (original logic)
    if (!giftData) return [];
    
    // For 24h, 3d, and 1w, use week_chart (half-hour data) if available
    if (giftData.week_chart && giftData.week_chart.length > 0) {
      if (timeRange === '24h') {
        // Last 48 entries (24 hours with half-hour intervals)
        const recentData = giftData.week_chart.slice(-48);
        return recentData.map((item, index, arr) => {
          const price = currency === 'ton' ? item.priceTon : item.priceUsd;
          const prevPrice = index > 0 ? (currency === 'ton' ? arr[index - 1].priceTon : arr[index - 1].priceUsd) : price;
          const nextPrice = index < arr.length - 1 ? (currency === 'ton' ? arr[index + 1].priceTon : arr[index + 1].priceUsd) : price;
          
          return {
            date: item.date,
            priceTon: item.priceTon,
            priceUsd: item.priceUsd,
            price: price,
            open: prevPrice,
            high: Math.max(price, prevPrice, nextPrice),
            low: Math.min(price, prevPrice, nextPrice),
            close: price,
            label: item.time,
          };
        });
      } else if (timeRange === '3d') {
        // Last 144 entries (3 days × 48 readings per day)
        const recentData = giftData.week_chart.slice(-144);
        return recentData.map((item, index, arr) => {
          const price = currency === 'ton' ? item.priceTon : item.priceUsd;
          const prevPrice = index > 0 ? (currency === 'ton' ? arr[index - 1].priceTon : arr[index - 1].priceUsd) : price;
          const nextPrice = index < arr.length - 1 ? (currency === 'ton' ? arr[index + 1].priceTon : arr[index + 1].priceUsd) : price;
          
          return {
            date: item.date,
            priceTon: item.priceTon,
            priceUsd: item.priceUsd,
            price: price,
            open: prevPrice,
            high: Math.max(price, prevPrice, nextPrice),
            low: Math.min(price, prevPrice, nextPrice),
            close: price,
            label: item.time,
          };
        });
      } else if (timeRange === '1w') {
        // Last 336 entries (7 days × 48 readings per day)
        const recentData = giftData.week_chart.slice(-336);
        return recentData.map((item, index, arr) => {
          const price = currency === 'ton' ? item.priceTon : item.priceUsd;
          const prevPrice = index > 0 ? (currency === 'ton' ? arr[index - 1].priceTon : arr[index - 1].priceUsd) : price;
          const nextPrice = index < arr.length - 1 ? (currency === 'ton' ? arr[index + 1].priceTon : arr[index + 1].priceUsd) : price;
          
          return {
            date: item.date,
            priceTon: item.priceTon,
            priceUsd: item.priceUsd,
            price: price,
            open: prevPrice,
            high: Math.max(price, prevPrice, nextPrice),
            low: Math.min(price, prevPrice, nextPrice),
            close: price,
            label: item.time,
          };
        });
      }
    }
    
    // For other time ranges, use life_chart (daily data)
    if (!Array.isArray(giftData.life_chart)) return [];
    
    const lifeChart = giftData.life_chart;
    let data: ChartData[] = [];
    
    switch (timeRange) {
      case '1m':
        data = lifeChart.slice(-30);
        break;
      case '3m':
        data = lifeChart.slice(-90);
        break;
      case 'all':
      default:
        data = lifeChart;
        break;
    }
    
    return data.map((item, index, arr) => {
      const price = currency === 'ton' ? item.priceTon : item.priceUsd;
      const prevPrice = index > 0 ? (currency === 'ton' ? arr[index - 1].priceTon : arr[index - 1].priceUsd) : price;
      const nextPrice = index < arr.length - 1 ? (currency === 'ton' ? arr[index + 1].priceTon : arr[index + 1].priceUsd) : price;
      
      return {
        ...item,
        price: price,
        open: prevPrice,
        high: Math.max(price, prevPrice, nextPrice),
        low: Math.min(price, prevPrice, nextPrice),
        close: price,
        label: item.date,
      };
    });
  };

  const calculatePriceChange = () => {
    // If Black mode is selected, calculate from black floor data based on time range
    if (dataSource === 'black' && blackFloorData.length > 0) {
      const latestRecord = blackFloorData[0]; // Already sorted by recorded_at descending
      
      if (timeRange === '24h' && latestRecord.change_24h_percent !== undefined) {
        return latestRecord.change_24h_percent;
      } else if (timeRange === '1w' && latestRecord.change_1w_percent !== undefined) {
        return latestRecord.change_1w_percent;
      } else if (timeRange === '1m' && latestRecord.change_1m_percent !== undefined) {
        return latestRecord.change_1m_percent;
      }
      
      // Fallback: calculate from chart data
      const chartData = getChartData();
      if (chartData.length > 0) {
        const firstPrice = chartData[0].price;
        const lastPrice = chartData[chartData.length - 1].price;
        if (firstPrice === 0) return 0;
        return ((lastPrice - firstPrice) / firstPrice) * 100;
      }
      return 0;
    }
    
    // Market data (original logic)
    const chartData = getChartData();
    
    if (!chartData || chartData.length === 0) return 0;
    
    // Use first and last prices from the current chart view
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    
    if (firstPrice === 0) return 0;
    return ((lastPrice - firstPrice) / firstPrice) * 100;
  };


  // Custom candlestick component
  const Candlestick = (props: any) => {
    const { x, y, width, payload } = props;
    
    if (!payload || payload.open === undefined || payload.close === undefined) {
      return null;
    }
    
    const { open, high, low, close } = payload;
    const isGreen = close >= open;
    const color = isGreen ? '#10b981' : '#ef4444';
    
    // Calculate Y positions
    const maxPrice = Math.max(high, open, close, low);
    const minPrice = Math.min(high, open, close, low);
    const priceRange = maxPrice - minPrice;
    
    if (priceRange === 0) return null;
    
    const chartHeight = 400;
    const yScale = chartHeight / priceRange;
    
    // Wick positions
    const highY = y;
    const lowY = y + chartHeight;
    const wickX = x + width / 2;
    
    // Body positions
    const bodyTop = isGreen ? close : open;
    const bodyBottom = isGreen ? open : close;
    const bodyHeight = Math.abs(close - open) * yScale || 1;
    const bodyY = y + ((maxPrice - bodyTop) * yScale);
    
    return (
      <g>
        {/* Upper wick */}
        <line
          x1={wickX}
          y1={y + ((maxPrice - high) * yScale)}
          x2={wickX}
          y2={bodyY}
          stroke={color}
          strokeWidth={1.5}
        />
        {/* Lower wick */}
        <line
          x1={wickX}
          y1={bodyY + bodyHeight}
          x2={wickX}
          y2={y + ((maxPrice - low) * yScale)}
          stroke={color}
          strokeWidth={1.5}
        />
        {/* Body */}
        <rect
          x={x + 1}
          y={bodyY}
          width={Math.max(width - 2, 2)}
          height={Math.max(bodyHeight, 1)}
          fill={color}
          stroke={color}
          strokeWidth={0.5}
        />
      </g>
    );
  };

  const renderChart = () => {
    const data = getChartData();
    
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          لا توجد بيانات متاحة
        </div>
      );
    }
    
    const color = calculatePriceChange() >= 0 ? '#10b981' : '#ef4444';
    
    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="label" 
              stroke="rgba(255,255,255,0.3)"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.3)"
              tick={{ fontSize: 11 }}
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
              orientation="right"
              width={35}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(10, 15, 26, 0.95)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={color}
              strokeWidth={2}
              fill="url(#colorPrice)"
              connectNulls
              isAnimationActive={false}
            >
              {data.map((entry, index) => {
                if (index === 0) return null;
                const currentPrice = entry.price;
                const previousPrice = data[index - 1].price;
                const segmentColor = currentPrice >= previousPrice ? '#10b981' : '#ef4444';
                
                return (
                  <stop key={index} offset={index / (data.length - 1)} stopColor={segmentColor} />
                );
              })}
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    
    if (chartType === 'candlestick') {
      // Process data for candlestick rendering
      const processedData = data.map((item, index) => {
        return {
          ...item,
          index: index
        };
      });
      
      return (
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={processedData} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="label" 
              stroke="rgba(255,255,255,0.3)"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              stroke="rgba(255,255,255,0.3)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              orientation="right"
              width={35}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const change = data.close - data.open;
                  const changePercent = ((change / data.open) * 100).toFixed(2);
                  const isPositive = change >= 0;
                  
                  return (
                    <div className="bg-[rgba(10,15,26,0.95)] border border-white/10 rounded-lg p-3 text-white backdrop-blur">
                      <p className="text-xs text-muted-foreground mb-2">{data.label}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">O:</span>
                          <span className="font-mono">{data.open?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">H:</span>
                          <span className="font-mono text-green-400">{data.high?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">L:</span>
                          <span className="font-mono text-red-400">{data.low?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">C:</span>
                          <span className="font-mono font-bold">{data.close?.toFixed(2)}</span>
                        </div>
                        <div className={`flex justify-between gap-4 pt-1 border-t border-white/10 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          <span>Change:</span>
                          <span className="font-mono">{isPositive ? '+' : ''}{changePercent}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="high"
              shape={(props: any) => <Candlestick {...props} />}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }
    
    // Bar chart (default)
    return (
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4}/>
              <stop offset="50%" stopColor={color} stopOpacity={0.2}/>
              <stop offset="100%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="label" 
            stroke="rgba(255,255,255,0.3)"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.3)"
            tick={{ fontSize: 11 }}
            domain={['auto', 'auto']}
            axisLine={false}
            tickLine={false}
            orientation="right"
            width={50}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(10, 15, 26, 0.95)', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke={color}
            strokeWidth={3.5}
            fill="url(#areaGradient)"
            fillOpacity={1}
            connectNulls
            isAnimationActive={false}
          >
            {data.map((entry, index) => {
              if (index === 0) return null;
              const currentPrice = entry.price;
              const previousPrice = data[index - 1].price;
              const segmentColor = currentPrice >= previousPrice ? '#10b981' : '#ef4444';
              
              return (
                <stop key={index} offset={index / (data.length - 1)} stopColor={segmentColor} />
              );
            })}
          </Area>
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!giftData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        <p className="text-muted-foreground mb-4">Gift not found</p>
        <Button onClick={() => navigate('/chart')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const priceChange = calculatePriceChange();
  const isPositive = priceChange >= 0;

  // Get correct image_url from giftData or fallback to market cache
  const getCorrectImageUrl = () => {
    // Priority 1: Use image_url from gift data if available
    if (giftData.info.image_url) {
      return giftData.info.image_url;
    }
    
    // Priority 2: Try to get from cached market data
    const cachedMarketData = getCachedData('market-data');
    if (cachedMarketData && cachedMarketData[giftData.info.name]) {
      const marketImageUrl = cachedMarketData[giftData.info.name].image_url;
      if (marketImageUrl) {
        return marketImageUrl;
      }
    }
    
    // Priority 3: Fallback to constructed URL
    return `https://channelsseller.site/api/image/${giftData.info.image}`;
  };

  const imageUrl = getCorrectImageUrl();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-4">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/chart')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <div className="text-xs text-muted-foreground">
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' })}
          </div>
        </div>

        {/* Gift Header */}
        <Card className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left Side: Image, Name, Supply */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                <GiftImage
                  imageUrl={imageUrl}
                  name={giftData.info.name}
                  size="lg"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground mb-0.5">{giftData.info.name}</h1>
                <p className="text-sm text-muted-foreground">{(giftData.info.supply / 1000).toFixed(1)}K</p>
              </div>
            </div>

            {/* Right Side: Price, Change */}
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5 text-2xl font-bold text-foreground mb-0.5">
                {dataSource === 'black' && blackFloorData.length > 0 ? (
                  // Show black floor price
                  <>
                    <TonIcon className="w-5 h-5" />
                    {blackFloorData[0].black_price.toFixed(2)}
                  </>
                ) : (
                  // Show market price
                  currency === 'ton' ? (
                    <>
                      <TonIcon className="w-5 h-5" />
                      {giftData.info.priceTon.toFixed(2)}
                    </>
                  ) : (
                    <>$ {giftData.info.priceUsd.toFixed(2)}</>
                  )
                )}
              </div>
              <div className={`text-base font-semibold flex items-center justify-end gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </div>
            </div>
          </div>
        </Card>

        {/* Chart */}
        <Card className="p-3 bg-card/50 backdrop-blur">
          {renderChart()}
        </Card>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2">
          {/* Data Source Toggle - White/Gray style */}
          <div className="flex rounded-full bg-muted/80 p-1 gap-1">
            <Button
              onClick={() => setDataSource('market')}
              variant="ghost"
              size="sm"
              className={`px-5 h-9 rounded-full font-medium transition-all ${
                dataSource === 'market' 
                  ? 'bg-white text-black shadow-sm hover:bg-white' 
                  : 'text-muted-foreground hover:bg-transparent hover:text-foreground'
              }`}
            >
              Normal
            </Button>
            <Button
              onClick={() => setDataSource('black')}
              variant="ghost"
              size="sm"
              className={`px-5 h-9 rounded-full font-medium transition-all ${
                dataSource === 'black' 
                  ? 'bg-gray-700 text-white shadow-sm hover:bg-gray-700' 
                  : 'text-muted-foreground hover:bg-transparent hover:text-foreground'
              }`}
            >
              Black
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Chart Type Toggle */}
            <Button
              onClick={() => setChartType(chartType === 'candlestick' ? 'line' : 'candlestick')}
              variant="ghost"
              size="icon"
              className="rounded-full bg-gray-800 h-10 w-10 hover:bg-gray-700"
            >
              {chartType === 'candlestick' ? <LineChart className="w-5 h-5" /> : <CandlestickChart className="w-5 h-5" />}
            </Button>

            {/* Currency Toggle - Only for Market data */}
            {dataSource === 'market' && (
              <div className="flex rounded-full bg-gray-800/50 p-1 gap-1">
                <Button
                  onClick={() => setCurrency('ton')}
                  variant="ghost"
                  size="sm"
                  className={`px-4 h-9 gap-1.5 rounded-full font-medium transition-all ${
                    currency === 'ton' 
                      ? 'bg-gray-700 text-white shadow-sm hover:bg-gray-700' 
                      : 'text-gray-400 hover:bg-transparent hover:text-foreground'
                  }`}
                >
                  <TonIcon className="w-4 h-4" />
                  ton
                </Button>
                <Button
                  onClick={() => setCurrency('usd')}
                  variant="ghost"
                  size="sm"
                  className={`px-4 h-9 rounded-full font-medium transition-all ${
                    currency === 'usd' 
                      ? 'bg-gray-700 text-white shadow-sm hover:bg-gray-700' 
                      : 'text-gray-400 hover:bg-transparent hover:text-foreground'
                  }`}
                >
                  usd
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Time Range Toggle - Blue style */}
        {dataSource === 'market' ? (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['24h', '3d', '1w', '1m', '3m', 'all'] as TimeRange[]).map((range) => (
              <Button
                key={range}
                onClick={() => setTimeRange(range)}
                variant="ghost"
                size="sm"
                className={`rounded-full px-5 h-10 whitespace-nowrap font-semibold transition-all ${
                  timeRange === range 
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' 
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                {range === 'all' ? 'All' : range.toUpperCase()}
              </Button>
            ))}
          </div>
        ) : blackFloorData.length > 0 && blackFloorData[0].available_periods ? (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {blackFloorData[0].available_periods.includes('24h') && (
              <Button
                onClick={() => setTimeRange('24h')}
                variant="ghost"
                size="sm"
                className={`rounded-full px-5 h-10 whitespace-nowrap font-semibold transition-all ${
                  timeRange === '24h' 
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' 
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                24H
              </Button>
            )}
            {blackFloorData[0].available_periods.includes('3d') && (
              <Button
                onClick={() => setTimeRange('3d')}
                variant="ghost"
                size="sm"
                className={`rounded-full px-5 h-10 whitespace-nowrap font-semibold transition-all ${
                  timeRange === '3d' 
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' 
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                3D
              </Button>
            )}
            {blackFloorData[0].available_periods.includes('1w') && (
              <Button
                onClick={() => setTimeRange('1w')}
                variant="ghost"
                size="sm"
                className={`rounded-full px-5 h-10 whitespace-nowrap font-semibold transition-all ${
                  timeRange === '1w' 
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' 
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                1W
              </Button>
            )}
            {blackFloorData[0].available_periods.includes('1m') && (
              <Button
                onClick={() => setTimeRange('1m')}
                variant="ghost"
                size="sm"
                className={`rounded-full px-5 h-10 whitespace-nowrap font-semibold transition-all ${
                  timeRange === '1m' 
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' 
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                1M
              </Button>
            )}
            {blackFloorData[0].available_periods.includes('3m') && (
              <Button
                onClick={() => setTimeRange('3m')}
                variant="ghost"
                size="sm"
                className={`rounded-full px-5 h-10 whitespace-nowrap font-semibold transition-all ${
                  timeRange === '3m' 
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' 
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                3M
              </Button>
            )}
            <Button
              onClick={() => setTimeRange('all')}
              variant="ghost"
              size="sm"
              className={`rounded-full px-5 h-10 whitespace-nowrap font-semibold transition-all ${
                timeRange === 'all' 
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' 
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              All
            </Button>
          </div>
        ) : null}

        {/* View Models Button */}
        <Button
          variant="outline"
          onClick={() => setShowModels(true)}
          className="w-full gap-2"
          disabled={!giftData?.models || giftData.models.length === 0}
        >
          <Sparkles className="w-4 h-4" />
          View Models {giftData?.models && `(${giftData.models.length})`}
        </Button>

        {/* Black Floor Price Changes */}
        {dataSource === 'black' && blackFloorData.length > 0 && blackFloorData[0].available_periods && blackFloorData[0].available_periods.length > 0 && (
          <Card className="p-4 bg-card/50 backdrop-blur">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Price Changes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {blackFloorData[0].available_periods.includes('24h') && (
                <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground mb-1">24h</span>
                  <span className={`text-base font-bold ${
                    blackFloorData[0].change_24h_percent! > 0 ? 'text-green-500' : 
                    blackFloorData[0].change_24h_percent! < 0 ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    {blackFloorData[0].change_24h_percent! > 0 ? '+' : ''}
                    {blackFloorData[0].change_24h_percent!.toFixed(2)}%
                  </span>
                </div>
              )}
              {blackFloorData[0].available_periods.includes('1w') && (
                <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground mb-1">1 Week</span>
                  <span className={`text-base font-bold ${
                    blackFloorData[0].change_1w_percent! > 0 ? 'text-green-500' : 
                    blackFloorData[0].change_1w_percent! < 0 ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    {blackFloorData[0].change_1w_percent! > 0 ? '+' : ''}
                    {blackFloorData[0].change_1w_percent!.toFixed(2)}%
                  </span>
                </div>
              )}
              {blackFloorData[0].available_periods.includes('1m') && (
                <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground mb-1">1 Month</span>
                  <span className={`text-base font-bold ${
                    blackFloorData[0].change_1m_percent! > 0 ? 'text-green-500' : 
                    blackFloorData[0].change_1m_percent! < 0 ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    {blackFloorData[0].change_1m_percent! > 0 ? '+' : ''}
                    {blackFloorData[0].change_1m_percent!.toFixed(2)}%
                  </span>
                </div>
              )}
              {blackFloorData[0].available_periods.includes('3m') && (
                <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground mb-1">3 Months</span>
                  <span className={`text-base font-bold ${
                    blackFloorData[0].change_3m_percent! > 0 ? 'text-green-500' : 
                    blackFloorData[0].change_3m_percent! < 0 ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    {blackFloorData[0].change_3m_percent! > 0 ? '+' : ''}
                    {blackFloorData[0].change_3m_percent!.toFixed(2)}%
                  </span>
                </div>
              )}
              {blackFloorData[0].available_periods.includes('1y') && (
                <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground mb-1">1 Year</span>
                  <span className={`text-base font-bold ${
                    blackFloorData[0].change_1y_percent! > 0 ? 'text-green-500' : 
                    blackFloorData[0].change_1y_percent! < 0 ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    {blackFloorData[0].change_1y_percent! > 0 ? '+' : ''}
                    {blackFloorData[0].change_1y_percent!.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
            {blackFloorData[0].oldest_available_date && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Data available since: {new Date(blackFloorData[0].oldest_available_date).toLocaleDateString()}
              </p>
            )}
          </Card>
        )}

        {giftData?.models && (
          <GiftModelsDialog 
            open={showModels} 
            onOpenChange={setShowModels}
            models={giftData.models}
            giftName={giftData.info.name}
          />
        )}

      </div>
    </div>
  );
};



export default GiftDetail;
