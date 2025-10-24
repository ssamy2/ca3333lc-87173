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
    const imageUrl = props.imageUrl || '';

    if (!width || !height) return null;

    const area = width * height;
    const minDimension = Math.min(width, height);
    
    // Better font sizing based on area and dimensions
    const baseFontSize = Math.sqrt(area) / 8;
    const showImage = area > 1500;
    const showName = area > 3000 && name;
    const showPrice = area > 6000;
    
    // Image sizing - proportional to cell size
    const imageSize = Math.min(minDimension * 0.25, 50);
    const imageY = showName ? y + height * 0.12 : y + height * 0.15;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: color,
            stroke: 'rgba(0,0,0,0.2)',
            strokeWidth: 2,
          }}
        />
        
        {/* Gift Image/Logo */}
        {showImage && imageUrl && (
          <image
            href={imageUrl}
            x={x + width / 2 - imageSize / 2}
            y={imageY}
            width={imageSize}
            height={imageSize}
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            }}
          />
        )}
        
        {/* Gift Name */}
        {showName && (
          <text
            x={x + width / 2}
            y={y + height * 0.4}
            textAnchor="middle"
            fill="white"
            fontSize={Math.min(baseFontSize * 0.7, width / (name.length * 0.55), 14)}
            fontWeight="bold"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
          >
            {name}
          </text>
        )}
        
        {/* Change Percentage */}
        <text
          x={x + width / 2}
          y={y + height * (showName ? 0.6 : showImage ? 0.58 : 0.55)}
          textAnchor="middle"
          fill="white"
          fontSize={Math.min(baseFontSize * 1.3, width / 4, minDimension * 0.2)}
          fontWeight="900"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
        >
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </text>
        
        {/* Price */}
        {showPrice && (
          <text
            x={x + width / 2}
            y={y + height * 0.88}
            textAnchor="middle"
            fill="white"
            fontSize={Math.min(baseFontSize * 0.65, width / 7, 12)}
            fontWeight="700"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
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
