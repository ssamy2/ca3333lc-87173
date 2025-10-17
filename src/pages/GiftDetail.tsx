import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, BarChart3, LineChart, CandlestickChart, ExternalLink, Sparkles } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import TonIcon from '@/components/TonIcon';
import YearlyPerformance from '@/components/YearlyPerformance';
import GiftModelsDialog from '@/components/GiftModelsDialog';

interface GiftInfo {
  name: string;
  image: string;
  supply: number;
  upgradedSupply: number;
  priceTon: number;
  priceUsd: number;
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
}

interface GiftDetailData {
  info: GiftInfo;
  life_chart: ChartData[];
  models?: Model[];
}

type TimeRange = 'all' | '3m' | '1m' | '1w' | '3d' | '24h';
type ChartType = 'line' | 'candlestick' | 'bar';
type Currency = 'usd' | 'ton';

const GiftDetail = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [giftData, setGiftData] = useState<GiftDetailData | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1w');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [currency, setCurrency] = useState<Currency>('ton');
  const [showModels, setShowModels] = useState(false);

  useEffect(() => {
    if (name) {
      fetchGiftData(name);
    }
  }, [name]);

  const fetchGiftData = async (giftName: string) => {
    try {
      setLoading(true);
      const response = await fetch(`https://channelsseller.site/api/gift-data?name=${encodeURIComponent(giftName)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch gift data');
      }
      
      const data = await response.json();
      setGiftData(data);
    } catch (error) {
      console.error('Error fetching gift data:', error);
      toast.error('Failed to load gift details');
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!giftData || !Array.isArray(giftData.life_chart)) return [];
    
    const lifeChart = giftData.life_chart;
    let data: ChartData[] = [];
    
    switch (timeRange) {
      case '24h':
        data = lifeChart.slice(-2);
        break;
      case '3d':
        data = lifeChart.slice(-3);
        break;
      case '1w':
        data = lifeChart.slice(-7);
        break;
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
    
    return data.map(item => ({
      ...item,
      price: currency === 'ton' ? item.priceTon : item.priceUsd,
      label: item.date,
    }));
  };

  const calculatePriceChange = () => {
    if (!giftData || !Array.isArray(giftData.life_chart) || giftData.life_chart.length === 0) return 0;
    
    const currentPrice = currency === 'ton' ? giftData.info.priceTon : giftData.info.priceUsd;
    const oldestPrice = currency === 'ton' ? giftData.life_chart[0].priceTon : giftData.life_chart[0].priceUsd;
    
    if (oldestPrice === 0) return 0;
    return ((currentPrice - oldestPrice) / oldestPrice) * 100;
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
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="label" 
              stroke="rgba(255,255,255,0.5)"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="rgba(255,255,255,0.5)"
              tick={{ fontSize: 12 }}
              domain={['auto', 'auto']}
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
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    
    if (chartType === 'candlestick') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <RechartsLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="label" 
              stroke="rgba(255,255,255,0.5)"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="rgba(255,255,255,0.5)"
              tick={{ fontSize: 12 }}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(10, 15, 26, 0.95)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Line 
              type="step" 
              dataKey="price" 
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      );
    }
    
    // Bar chart (default)
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="label" 
            stroke="rgba(255,255,255,0.5)"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="rgba(255,255,255,0.5)"
            tick={{ fontSize: 12 }}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(10, 15, 26, 0.95)', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Bar dataKey="price" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
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
          <div className="flex items-center gap-4">
            <img 
              src={`https://channelsseller.site/api/image/${giftData.info.image}`}
              alt={giftData.info.name}
              className="w-16 h-16 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/64x64?text=NFT';
              }}
            />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{giftData.info.name}</h1>
              <p className="text-sm text-muted-foreground">{(giftData.info.supply / 1000).toFixed(1)}K</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-xl font-bold text-foreground">
                {currency === 'ton' ? (
                  <>
                    <TonIcon className="w-5 h-5" />
                    {giftData.info.priceTon.toFixed(2)}
                  </>
                ) : (
                  <>$ {giftData.info.priceUsd.toFixed(2)}</>
                )}
              </div>
              <div className={`text-sm font-semibold flex items-center gap-1 justify-end ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </div>
            </div>
          </div>
        </Card>

        {/* Currency Toggle */}
        <div className="flex gap-2">
          <Button
            onClick={() => setCurrency('ton')}
            variant={currency === 'ton' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 gap-1"
          >
            <TonIcon className="w-4 h-4" />
            ton
          </Button>
          <Button
            onClick={() => setCurrency('usd')}
            variant={currency === 'usd' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
          >
            usd
          </Button>
        </div>

        {/* Chart Type Toggle */}
        <div className="flex gap-2 justify-center">
          <Button
            onClick={() => setChartType('line')}
            variant={chartType === 'line' ? 'default' : 'ghost'}
            size="icon"
          >
            <LineChart className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => setChartType('candlestick')}
            variant={chartType === 'candlestick' ? 'default' : 'ghost'}
            size="icon"
          >
            <CandlestickChart className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => setChartType('bar')}
            variant={chartType === 'bar' ? 'default' : 'ghost'}
            size="icon"
          >
            <BarChart3 className="w-5 h-5" />
          </Button>
        </div>

        {/* Chart */}
        <Card className="p-4">
          {renderChart()}
        </Card>

        {/* Time Range Toggle */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', '3m', '1m', '1w', '3d', '24h'] as TimeRange[]).map((range) => (
            <Button
              key={range}
              onClick={() => setTimeRange(range)}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              className="whitespace-nowrap"
            >
              {range === 'all' ? 'All' : range.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            className="bg-red-500 hover:bg-red-600 text-white"
            size="lg"
          >
            Sell <ExternalLink className="w-4 h-4 ml-1" />
          </Button>
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white"
            size="lg"
          >
            Buy <ExternalLink className="w-4 h-4 ml-1" />
          </Button>
        </div>

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

        {giftData?.models && (
          <GiftModelsDialog 
            open={showModels} 
            onOpenChange={setShowModels}
            models={giftData.models}
            giftName={giftData.info.name}
          />
        )}

        {/* Yearly Performance */}
        {giftData && (
          <YearlyPerformance 
            data={giftData.life_chart} 
            currency={currency}
          />
        )}

      </div>
    </div>
  );
};



export default GiftDetail;
