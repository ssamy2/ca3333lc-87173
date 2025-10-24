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
    const baseFontSize = Math.sqrt(area) / 10;
    // Lower thresholds so elements show in smaller cells
    const showImage = area > 1200;
    const showName = area > 2000 && name;
    const showPrice = area > 3500;
    
    // Image sizing - smaller and more proportional
    const imageSize = Math.min(minDimension * 0.18, 35);
    const imageY = y + height * 0.12;

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
            y={y + height * 0.35}
            textAnchor="middle"
            fill="white"
            fontSize={Math.min(baseFontSize * 0.9, width / (name.length * 0.5), 12)}
            fontWeight="600"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
          >
            {name}
          </text>
        )}
        
        {/* Change Percentage */}
        <text
          x={x + width / 2}
          y={y + height * (showName ? 0.55 : showImage ? 0.52 : 0.5)}
          textAnchor="middle"
          fill="white"
          fontSize={Math.min(baseFontSize * 1.8, width / 3.5, minDimension * 0.22, 20)}
          fontWeight="800"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
        >
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </text>
        
        {/* Price */}
        {showPrice && (
          <text
            x={x + width / 2}
            y={y + height * 0.85}
            textAnchor="middle"
            fill="white"
            fontSize={Math.min(baseFontSize * 0.85, width / 7, 10)}
            fontWeight="600"
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
