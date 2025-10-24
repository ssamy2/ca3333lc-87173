import React, { useMemo } from 'react';
import { ResponsiveContainer, Treemap } from 'recharts';

interface GiftItem {
  name: string;
  size: number;
  change: number;
  price: number;
  imageUrl?: string;
  currency?: string;
}

interface HeatmapProps {
  data: GiftItem[];
  currency?: string;
}

interface ContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  change: number;
  price: number;
  imageUrl?: string;
  color: string;
}

const TreeMapContent: React.FC<any> = (props) => {
  const {
    x,
    y,
    width,
    height,
    color: colorProp,
  } = props;

  if (!width || !height) return null;

  const payload = (props as any)?.payload ?? {};
  const name = (props as any).name ?? payload.name ?? '';
  const change = Number.isFinite((props as any).change)
    ? (props as any).change
    : (Number.isFinite(payload.change) ? payload.change : 0);
  const price = Number.isFinite((props as any).price)
    ? (props as any).price
    : (Number.isFinite(payload.price) ? payload.price : 0);
  const imageUrl = (props as any).imageUrl ?? payload.imageUrl;
  const color = colorProp ?? payload.color ?? '#888';
  const currency = (props as any).currency ?? payload.currency ?? 'ton';

  const area = width * height;
  const minDimension = Math.min(width, height);
  const fontSizeBase = Math.sqrt(area) / 14;

  const visibility = {
    image: area > 700,
    name: area > 1200,
    price: area > 900,
    change: area > 400
  };

  const imageSize = Math.min(minDimension * 0.22, 35);
  const imageYPosition = y + height * 0.12;
  const textShadow = '0 1px 3px rgba(0,0,0,0.8)';

  const safeChange = Number.isFinite(change) ? change : 0;
  const safePrice = Number.isFinite(price) ? price : 0;

  return (
    <g>
      {/* Background Rectangle */}
      <rect
        x={x + 2}
        y={y + 2}
        width={width - 4}
        height={height - 4}
        rx={8}
        fill={color}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth={1.5}
        style={{ shapeRendering: 'crispEdges' }}
      />

      {/* Product Image */}
      {visibility.image && imageUrl && (
        <image
          href={imageUrl}
          x={x + width / 2 - imageSize / 2}
          y={imageYPosition}
          width={imageSize}
          height={imageSize}
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}
        />
      )}

      {/* Product Name */}
      {visibility.name && (
        <text
          x={x + width / 2}
          y={y + height * 0.36}
          textAnchor="middle"
          fill="white"
          fontSize={Math.min(fontSizeBase * 1.17, 13)}
          fontWeight="600"
          style={{ textShadow }}
        >
          {name}
        </text>
      )}

      {/* Percentage Change */}
      {visibility.change && (
        <text
          x={x + width / 2}
          y={y + height * (visibility.name ? 0.55 : 0.48)}
          textAnchor="middle"
          fill="white"
          fontSize={Math.min(fontSizeBase * 1.445, 12)}
          fontWeight="800"
          style={{ textShadow }}
        >
          {safeChange >= 0 ? '+' : ''}{safeChange.toFixed(2)}%
        </text>
      )}

      {/* Price */}
      {visibility.price && (
        <text
          x={x + width / 2}
          y={y + height * 0.84}
          textAnchor="middle"
          fill="rgba(255,255,255,0.9)"
          fontSize={Math.min(fontSizeBase * 1.5, 18)}
          fontWeight="600"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
        >
          {safePrice.toFixed(2)} {currency === 'usd' ? 'USD' : 'TON'}
        </text>
      )}
    </g>
  );
};

const HeatmapTreemap: React.FC<HeatmapProps> = ({ data, currency = 'ton' }) => {
  const processedData = useMemo(() => {
    return data.map((item, index) => {
      const isPositiveChange = item.change > 0;
      const changeMagnitude = Math.min(Math.abs(item.change) * 0.4, 15);
      const lightness = 45 - changeMagnitude;
      
      const color = isPositiveChange 
        ? `hsl(145, 60%, ${lightness}%)`
        : `hsl(0, 65%, ${lightness}%)`;

      // تقليل الفرق بين المربعات الكبيرة والصغيرة بشكل أكبر
      const normalizedSize = Math.pow(item.size, 0.6);

      return {
        ...item,
        size: normalizedSize,
        color,
        id: `${item.name}-${index}`,
        currency
      };
    });
  }, [data]);

  return (
    <div className="w-full h-full bg-zinc-950 rounded-2xl overflow-hidden relative" style={{ imageRendering: 'crisp-edges', minHeight: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={processedData}
          dataKey="size"
          aspectRatio={16 / 9}
          stroke="rgba(0,0,0,0.1)"
          fill="#999"
          content={<TreeMapContent />}
          isAnimationActive={false}
        />
      </ResponsiveContainer>
      
      <div className="absolute bottom-2 left-4 text-[10px] text-gray-400 select-none">
        © Gift Heatmap — stable mode
      </div>
    </div>
  );
};

export default HeatmapTreemap;
