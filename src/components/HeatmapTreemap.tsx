import React from 'react';
import { ResponsiveContainer, Treemap } from 'recharts';

export interface TreemapItem {
  name: string;
  size: number;
  change: number;
  price: number;
  imageUrl?: string;
  color: string;
}

interface HeatmapTreemapProps {
  data: TreemapItem[];
}

const HeatmapTreemap: React.FC<HeatmapTreemapProps> = ({ data }) => {
  const Content = (props: any) => {
    const x = props.x || 0;
    const y = props.y || 0;
    const width = props.width || 0;
    const height = props.height || 0;
    const name = props.name || '';
    const change = props.change ?? 0;
    const price = props.price ?? 0;
    const color = props.color || '#888';

    if (!width || !height) return null;

    const area = width * height;
    const fontSize = Math.sqrt(area) / 8;
    const showName = area > 2000 && name;
    const showPrice = area > 5000;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: color,
            stroke: 'rgba(0,0,0,0.15)',
            strokeWidth: 1,
          }}
        />
        {showName && (
          <text
            x={x + width / 2}
            y={y + height * 0.45}
            textAnchor="middle"
            fill="white"
            fontSize={Math.min(fontSize * 0.7, width / (name.length * 0.6))}
            fontWeight="bold"
            style={{ textShadow: '0 2px 3px rgba(0,0,0,0.6)' }}
          >
            {name}
          </text>
        )}
        <text
          x={x + width / 2}
          y={y + height * (showName ? 0.65 : 0.55)}
          textAnchor="middle"
          fill="white"
          fontSize={Math.min(fontSize * 1.2, width / 3)}
          fontWeight="900"
          style={{ textShadow: '0 2px 3px rgba(0,0,0,0.6)' }}
        >
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </text>
        {showPrice && (
          <text
            x={x + width / 2}
            y={y + height * 0.8}
            textAnchor="middle"
            fill="white"
            fontSize={fontSize * 0.6}
            fontWeight="700"
            style={{ textShadow: '0 2px 3px rgba(0,0,0,0.6)' }}
          >
            {price.toFixed(2)} TON
          </text>
        )}
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap
        data={data}
        dataKey="size"
        aspectRatio={16 / 9}
        stroke="rgba(0,0,0,0.15)"
        fill="#8884d8"
        content={<Content />}
      />
    </ResponsiveContainer>
  );
};

export default HeatmapTreemap;
