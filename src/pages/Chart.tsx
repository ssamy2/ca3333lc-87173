import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { getCachedData } from '@/services/marketCache';

type TimeFrame = 'all' | '3m' | '2m' | '1m' | '2w';
type ChartType = 'candlestick' | 'bar' | 'line';

interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const Chart = () => {
  const navigate = useNavigate();
  const { name } = useParams();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('all');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration - replace with real API data
  const generateChartData = (): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    let basePrice = 5000;
    const dataPoints = timeFrame === 'all' ? 100 : timeFrame === '3m' ? 90 : timeFrame === '2m' ? 60 : timeFrame === '1m' ? 30 : 14;
    
    for (let i = 0; i < dataPoints; i++) {
      const volatility = 200;
      const trend = (Math.random() - 0.48) * 50;
      basePrice += trend;
      
      const open = basePrice + (Math.random() - 0.5) * volatility;
      const close = basePrice + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility;
      const low = Math.min(open, close) - Math.random() * volatility;
      
      data.push({
        date: `${i + 1}-06`,
        open: Math.max(0, open),
        high: Math.max(0, high),
        low: Math.max(0, low),
        close: Math.max(0, close),
        volume: Math.random() * 1000000
      });
    }
    
    return data;
  };

  const chartData = generateChartData();
  const currentPrice = chartData[chartData.length - 1]?.close || 5790.99;
  const firstPrice = chartData[0]?.close || 5000;
  const priceChange = ((currentPrice - firstPrice) / firstPrice) * 100;
  const isPositive = priceChange >= 0;

  // Custom Candlestick component
  const CandlestickBar = (props: any) => {
    const { x, y, width, payload } = props;
    const isUp = payload.close >= payload.open;
    const color = isUp ? 'hsl(180, 70%, 60%)' : 'hsl(340, 75%, 60%)';
    
    const bodyHeight = Math.abs((payload.close - payload.open) / payload.high * 100);
    const bodyY = isUp ? y + (payload.high - payload.close) / payload.high * 100 : y + (payload.high - payload.open) / payload.high * 100;
    
    return (
      <g>
        {/* Wick */}
        <line
          x1={x + width / 2}
          y1={y}
          x2={x + width / 2}
          y2={y + 100}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={x}
          y={bodyY}
          width={width}
          height={Math.max(bodyHeight, 1)}
          fill={color}
          stroke={color}
          strokeWidth={0}
        />
      </g>
    );
  };

  const timeFrameButtons: { label: string; value: TimeFrame }[] = [
    { label: 'All', value: 'all' },
    { label: '3m', value: '3m' },
    { label: '2m', value: '2m' },
    { label: '1m', value: '1m' },
    { label: '2w', value: '2w' },
  ];




  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Go Back</span>
        </button>
        <div className="text-sm text-white/60">
          02:00 UTC+1
        </div>
      </div>

      {/* NFT Info */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
            🐸
          </div>
          <div>
            <h1 className="text-xl font-bold">Plush Pepe</h1>
            <p className="text-sm text-white/60">2.8K</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-2xl font-bold">
            <span className="text-[#0098ea] text-lg">◆</span>
            <span>{currentPrice.toFixed(2)}</span>
          </div>
          <div className={`text-sm font-medium ${isPositive ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Currency & Chart Type Controls */}
      <div className="px-4 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 bg-[#252b3b] rounded-lg px-3 py-2">
          <span className="text-sm font-medium">ton</span>
          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChartType('line')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'line' ? 'bg-[#0098ea]' : 'bg-[#252b3b]'}`}
          >
            <TrendingUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => setChartType('candlestick')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'candlestick' ? 'bg-[#0098ea]' : 'bg-[#252b3b]'}`}
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'bar' ? 'bg-[#0098ea]' : 'bg-[#252b3b]'}`}
          >
            <Activity className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 mb-4">
        <div className="bg-[#0f1419] rounded-2xl p-4" style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'candlestick' ? (
              <ComposedChart data={chartData}>
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff20"
                  tick={{ fill: '#ffffff40', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff10' }}
                />
                <YAxis 
                  stroke="#ffffff20"
                  tick={{ fill: '#ffffff40', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff10' }}
                  domain={['dataMin - 500', 'dataMax + 500']}
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1f2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: any) => value.toFixed(2)}
                />
                <Bar
                  dataKey="high"
                  fill="transparent"
                  shape={<CandlestickBar />}
                />
              </ComposedChart>
            ) : chartType === 'line' ? (
              <ComposedChart data={chartData}>
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff20"
                  tick={{ fill: '#ffffff40', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff10' }}
                />
                <YAxis 
                  stroke="#ffffff20"
                  tick={{ fill: '#ffffff40', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff10' }}
                  domain={['dataMin - 500', 'dataMax + 500']}
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1f2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: any) => value.toFixed(2)}
                />
                <Line 
                  type="monotone" 
                  dataKey="close" 
                  stroke="hsl(180, 70%, 60%)" 
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            ) : (
              <ComposedChart data={chartData}>
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff20"
                  tick={{ fill: '#ffffff40', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff10' }}
                />
                <YAxis 
                  stroke="#ffffff20"
                  tick={{ fill: '#ffffff40', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff10' }}
                  domain={['dataMin - 500', 'dataMax + 500']}
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1f2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: any) => value.toFixed(2)}
                />
                <Bar 
                  dataKey="volume" 
                  fill="hsl(180, 70%, 60%)"
                  opacity={0.5}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time Frame Buttons */}
      <div className="px-4">
        <div className="flex items-center gap-2 bg-[#252b3b] rounded-full p-1">
          {timeFrameButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setTimeFrame(btn.value)}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
                timeFrame === btn.value
                  ? 'bg-[#0f1419] text-white shadow-lg'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chart;
