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

  // Custom Candlestick component with proper scaling
  const CandlestickShape = (props: any) => {
    const { x, y, width, height, payload } = props;
    
    if (!payload || !height) return null;
    
    const { open, high, low, close } = payload;
    const isUp = close >= open;
    const color = isUp ? '#26d0ce' : '#ef4565';
    
    // Calculate positions (y-axis is inverted in SVG)
    const range = high - low;
    if (range === 0) return null;
    
    const yHigh = y;
    const yLow = y + height;
    const yOpen = y + ((high - open) / range) * height;
    const yClose = y + ((high - close) / range) * height;
    
    const bodyTop = Math.min(yOpen, yClose);
    const bodyBottom = Math.max(yOpen, yClose);
    const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
    
    const wickX = x + width / 2;
    
    return (
      <g>
        {/* Wick (high-low line) */}
        <line
          x1={wickX}
          y1={yHigh}
          x2={wickX}
          y2={yLow}
          stroke={color}
          strokeWidth={1}
          opacity={0.8}
        />
        {/* Body */}
        <rect
          x={x + 1}
          y={bodyTop}
          width={Math.max(width - 2, 2)}
          height={bodyHeight}
          fill={color}
          stroke="none"
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
    <div className="min-h-screen bg-[#0d1421] text-white pb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Go Back</span>
        </button>
        <div className="text-xs text-white/40">
          02:00 UTC+1
        </div>
      </div>

      {/* NFT Info - Compact */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
            🐸
          </div>
          <div>
            <h1 className="text-base font-bold">Plush Pepe</h1>
            <p className="text-xs text-white/40">2.8K</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-xl font-bold">
            <span className="text-[#0098ea] text-sm">◆</span>
            <span>{currentPrice.toFixed(2)}</span>
          </div>
          <div className={`text-xs font-semibold ${isPositive ? 'text-[#26d0ce]' : 'text-[#ef4565]'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Currency & Chart Type Controls */}
      <div className="px-4 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 bg-[#1a2332] rounded-lg px-3 py-1.5">
          <span className="text-sm font-medium">ton</span>
          <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setChartType('line')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'line' ? 'bg-[#2e5bff]' : 'bg-[#1a2332]'}`}
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('candlestick')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'candlestick' ? 'bg-[#2e5bff]' : 'bg-[#1a2332]'}`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'bar' ? 'bg-[#2e5bff]' : 'bg-[#1a2332]'}`}
          >
            <Activity className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart - Full Width */}
      <div className="w-full" style={{ height: '450px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'candlestick' ? (
            <ComposedChart 
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                stroke="transparent"
                tick={{ fill: '#ffffff15', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis 
                stroke="transparent"
                tick={{ fill: '#ffffff25', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(value) => value.toFixed(1)}
                orientation="right"
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a2332',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px'
                }}
                formatter={(value: any) => [value.toFixed(2), '']}
                labelStyle={{ color: '#ffffff60' }}
              />
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="100%" height="50" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="100%" y2="0" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="1"/>
                </pattern>
              </defs>
              <Bar
                dataKey="high"
                fill="transparent"
                shape={<CandlestickShape />}
                isAnimationActive={false}
              />
            </ComposedChart>
          ) : chartType === 'line' ? (
            <ComposedChart 
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <XAxis 
                dataKey="date" 
                stroke="transparent"
                tick={{ fill: '#ffffff15', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="transparent"
                tick={{ fill: '#ffffff25', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(value) => value.toFixed(1)}
                orientation="right"
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a2332',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: any) => value.toFixed(2)}
              />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#26d0ce" 
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          ) : (
            <ComposedChart 
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <XAxis 
                dataKey="date" 
                stroke="transparent"
                tick={{ fill: '#ffffff15', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="transparent"
                tick={{ fill: '#ffffff25', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toFixed(0)}
                orientation="right"
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a2332',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: any) => value.toFixed(0)}
              />
              <Bar 
                dataKey="volume" 
                fill="#26d0ce"
                opacity={0.3}
                isAnimationActive={false}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Time Frame Buttons */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-0 bg-[#1a2332] rounded-full p-0.5">
          {timeFrameButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setTimeFrame(btn.value)}
              className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all ${
                timeFrame === btn.value
                  ? 'bg-[#0d1421] text-white'
                  : 'text-white/40 hover:text-white/70'
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
