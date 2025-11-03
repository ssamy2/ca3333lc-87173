import React, { useState, useEffect, useRef, useCallback } from 'react'
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
} from 'chart.js'
import { TreemapController, TreemapElement } from 'chartjs-chart-treemap'
import { Chart } from 'react-chartjs-2'
import zoomPlugin from 'chartjs-plugin-zoom'
import {
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Diamond,
  RefreshCcw
} from 'lucide-react'

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
)

interface GiftItem {
  name: string
  image: string
  priceTon: number
  priceUsd: number
  tonPrice24hAgo?: number
  usdPrice24hAgo?: number
  tonPriceWeekAgo?: number
  usdPriceWeekAgo?: number
  tonPriceMonthAgo?: number
  usdPriceMonthAgo?: number
  marketCapTon?: string
  marketCapUsd?: string
  upgradedSupply: number
  preSale?: boolean
}

interface TreemapDataPoint {
  name: string
  percentChange: number
  size: number
  imageName: string
  price: number
  marketCap: string
}

interface TreemapHeatmapProps {
  data: GiftItem[]
  chartType: 'change' | 'marketcap'
  timeGap: '24h' | '1w' | '1m'
  currency: 'ton' | 'usd'
}

const preloadImages = (data: TreemapDataPoint[]): Map<string, HTMLImageElement> => {
  const map = new Map<string, HTMLImageElement>()
  data.forEach(item => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = item.imageName
    map.set(item.imageName, img)
  })
  return map
}

const createImagePlugin = (chartType: 'change' | 'marketcap', currency: 'ton' | 'usd'): Plugin<'treemap'> => ({
  id: 'treemapImages',
  afterDatasetDraw(chart) {
    const { ctx, data } = chart
    const dataset = data.datasets[0] as any
    const imageMap = dataset.imageMap as Map<string, HTMLImageElement>
    ctx.save()
    dataset.tree.forEach((item: TreemapDataPoint, i: number) => {
      const e = chart.getDatasetMeta(0).data[i] as any
      if (!e) return
      const x = e.x, y = e.y, w = e.width, h = e.height
      const color = item.percentChange > 0 ? '#018f35' : item.percentChange < 0 ? '#dc2626' : '#8F9779'
      ctx.fillStyle = color
      ctx.fillRect(x, y, w, h)
    })
    ctx.restore()
  }
})

export const TreemapHeatmap: React.FC<TreemapHeatmapProps> = ({
  data,
  chartType,
  timeGap,
  currency
}) => {
  const chartRef = useRef<ChartJS>(null)
  const [metric, setMetric] = useState<'change' | 'marketcap'>(chartType)
  const [time, setTime] = useState<'24h' | '1w' | '1m'>(timeGap)
  const [mode, setMode] = useState<'normal' | 'black'>('black')
  const [cur, setCur] = useState<'ton' | 'usd'>(currency)

  const handleClick = (set: any, val: any) => () => set(val)

  const chartData: ChartData<'treemap'> = {
    datasets: [
      {
        data: [],
        tree: [],
        key: 'size',
        imageMap: preloadImages([]),
        backgroundColor: 'transparent'
      } as any
    ]
  }

  const chartOptions: ChartOptions<'treemap'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    events: []
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full px-3">

      <div className="w-full flex justify-center gap-2">
        <button
          onClick={handleClick(setMetric, 'change')}
          className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
            metric === 'change'
              ? 'bg-gray-700 text-white'
              : 'bg-gray-800/60 text-gray-400'
          }`}
        >
          change
        </button>
        <button
          onClick={handleClick(setMetric, 'marketcap')}
          className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
            metric === 'marketcap'
              ? 'bg-gray-700 text-white'
              : 'bg-gray-800/60 text-gray-400'
          }`}
        >
          Market Cap
        </button>
      </div>

      <div className="w-full flex flex-wrap justify-center items-center gap-2">
        {['24h', '1w', '1m'].map(t => (
          <button
            key={t}
            onClick={handleClick(setTime, t)}
            className={`px-3 py-2 rounded-full text-xs font-semibold ${
              time === t
                ? 'bg-blue-500 text-white'
                : 'bg-blue-600/40 text-white/80'
            }`}
          >
            {t}
          </button>
        ))}

        {['Top 50', 'Top 30', 'Top 15'].map((label, i) => (
          <button
            key={i}
            className="px-4 py-2 rounded-full bg-blue-600/50 text-white text-xs font-semibold"
          >
            {label}
          </button>
        ))}

        <button className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-700/40 backdrop-blur-sm">
          <div className="w-3 h-3 rounded-full bg-red-500 absolute"></div>
          <div className="w-3 h-3 rounded-full bg-green-500 relative left-1 top-1"></div>
        </button>
      </div>

      <div className="w-full flex items-center justify-between gap-2">
        <div className="flex gap-2 flex-1">
          <button
            onClick={handleClick(setMode, 'normal')}
            className={`flex-1 py-2 rounded-full text-sm font-medium ${
              mode === 'normal'
                ? 'bg-gray-500/30 text-white'
                : 'bg-gray-800/60 text-gray-400'
            }`}
          >
            Normal
          </button>
          <button
            onClick={handleClick(setMode, 'black')}
            className={`flex-1 py-2 rounded-full text-sm font-medium ${
              mode === 'black'
                ? 'bg-black text-white border border-gray-700'
                : 'bg-gray-700/60 text-gray-300'
            }`}
          >
            Black
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleClick(setCur, 'ton')}
            className={`px-4 py-2 flex items-center gap-1 rounded-full text-sm font-semibold ${
              cur === 'ton'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700/60 text-gray-300'
            }`}
          >
            <Diamond size={14} /> ton
          </button>
          <button
            onClick={handleClick(setCur, 'usd')}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              cur === 'usd'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-700/60 text-gray-400'
            }`}
          >
            usd
          </button>
        </div>

        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black">
          <RefreshCcw size={18} />
        </button>
      </div>

      <button className="w-full mt-3 py-3 flex items-center justify-center gap-2 rounded-xl bg-blue-500 text-white font-semibold">
        <Download size={18} /> Download Heatmap as Image
      </button>

      <div className="w-full min-h-[600px] rounded-xl overflow-hidden bg-card border border-border mt-2">
        <Chart
          ref={chartRef}
          type="treemap"
          data={chartData}
          options={chartOptions}
          plugins={[createImagePlugin(metric, cur)]}
        />
      </div>
    </div>
  )
}

export default TreemapHeatmap
