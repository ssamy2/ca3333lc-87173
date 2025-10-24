import React from 'react';
import { ResponsiveContainer, Treemap } from 'recharts';

export interface TreemapItem {
  name: string;
  size: number;
  change: number;
  price: number;
  imageUrl?: string;
}

interface HeatmapTreemapProps {
  data: TreemapItem[];
}

const HeatmapTreemap: React.FC<HeatmapTreemapProps> = ({ data }) => {
  const getColor = (change: number) => {
    const intensity = Math.min(Math.abs(change) * 10, 100);
    if (change > 0) return `hsl(140, 65%, ${45 - intensity * 0.1}%)`;
    if (change < 0) return `hsl(0, 65%, ${45 - intensity * 0.1}%)`;
    return '#777';
  };

  const Content = (props: any) => {
    const { x, y, width, height, name, change, price, imageUrl } = props;
    if (!width || !height) return null;
    const area = width * height;
    const minDim = Math.min(width, height);
    const color = getColor(change);

    const showImage = area > 800;
    const showName = area > 1600;
    const showPrice = area > 2800;

    const fontBase = Math.sqrt(area) / 12;
    const imgSize = Math.min(minDim * 0.18, 28);
    const imgY = y + height * 0.1;

    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={color} stroke="rgba(0,0,0,0.15)" strokeWidth={1.5} />
        {showImage && imageUrl && (
          <image
            href={imageUrl}
            x={x + width / 2 - imgSize / 2}
            y={imgY}
            width={imgSize}
            height={imgSize}
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
          />
        )}
        {showName && (
          <text
            x={x + width / 2}
            y={y + height * 0.33}
            textAnchor="middle"
            fill="white"
            fontSize={Math.min(fontBase * 0.8, 10)}
            fontWeight="600"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
          >
            {name}
          </text>
        )}
        <text
          x={x + width / 2}
          y={y + height * (showName ? 0.52 : 0.48)}
          textAnchor="middle"
          fill="white"
          fontSize={Math.min(fontBase * 1.6, 14)}
          fontWeight="700"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
        >
          {change >= 0 ? '+' : ''}
          {change.toFixed(2)}%
        </text>
        {showPrice && (
          <text
            x={x + width / 2}
            y={y + height * 0.82}
            textAnchor="middle"
            fill="white"
            fontSize={Math.min(fontBase * 0.75, 9)}
            fontWeight="500"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
          >
            {price.toFixed(2)} TON
          </text>
        )}
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap data={data} dataKey="size" aspectRatio={16 / 9} stroke="rgba(0,0,0,0.1)" fill="#888" content={<Content />} />
    </ResponsiveContainer>
  );
};

export default HeatmapTreemap;
