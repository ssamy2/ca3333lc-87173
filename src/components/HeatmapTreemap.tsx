import React, { useMemo, useRef, useState } from 'react';
import { ResponsiveContainer, Treemap } from 'recharts';

type GiftItem = {
  name: string;
  size: number;
  change: number;
  price: number;
  imageUrl?: string;
  id?: string;
};

type Thresholds = {
  imageArea: number;
  nameArea: number;
  priceArea: number;
  changeArea: number;
};

type HeatmapProps = {
  data: GiftItem[];
  thresholds?: Partial<Thresholds>;
  colorFactor?: number;
  normalizeSizes?: boolean;
  aspectRatio?: number;
};

const defaultThresholds: Thresholds = {
  imageArea: 700,
  nameArea: 1200,
  priceArea: 900,
  changeArea: 400,
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const computeColor = (change: number | undefined, factor = 0.45) => {
  if (change === undefined || Number.isNaN(change)) return '#777777';
  const magnitude = clamp(Math.abs(change) * factor, 0, 20);
  const lightness = clamp(45 - magnitude, 20, 60);
  if (change > 0) return `hsl(145, 60%, ${lightness}%)`;
  if (change < 0) return `hsl(0, 65%, ${lightness}%)`;
  return '#777777';
};

const formatNumber = (n: number | undefined, digits = 2) =>
  Number.isFinite(n) ? n.toFixed(digits) : (0).toFixed(digits);

const TreeMapContent: React.FC<any> = (props) => {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    name = '',
    change = 0,
    price = 0,
    imageUrl = '',
    color = '#777',
  } = props;
  if (!width || !height) return null;
  const area = width * height;
  const minDimension = Math.min(width, height);
  const fontSizeBase = Math.sqrt(area) / 14;
  const imageVisible = area > 700;
  const nameVisible = area > 1200;
  const priceVisible = area > 900;
  const changeVisible = area > 400;
  const imageSize = Math.min(minDimension * 0.22, 34);
  const imageY = y + height * 0.12;
  return (
    <g>
      <rect
        x={x + 2}
        y={y + 2}
        width={Math.max(0, width - 4)}
        height={Math.max(0, height - 4)}
        rx={8}
        fill={color}
        stroke="rgba(0,0,0,0.12)"
        strokeWidth={1.2}
        style={{ shapeRendering: 'crispEdges' }}
      />
      {imageVisible && imageUrl && (
        <image
          href={imageUrl}
          x={x + width / 2 - imageSize / 2}
          y={imageY}
          width={imageSize}
          height={imageSize}
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))' }}
        />
      )}
      {nameVisible && (
        <text
          x={x + width / 2}
          y={y + height * 0.36}
          textAnchor="middle"
          fill="white"
          fontSize={Math.min(fontSizeBase * 1.17, 13)}
          fontWeight={600}
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.85)' }}
        >
          {name}
        </text>
      )}
      {changeVisible && (
        <text
          x={x + width / 2}
          y={y + height * (nameVisible ? 0.55 : 0.48)}
          textAnchor="middle"
          fill="white"
          fontSize={Math.min(fontSizeBase * 1.445, 12)}
          fontWeight={800}
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.85)' }}
        >
          {typeof change === 'number' ? `${change >= 0 ? '+' : ''}${formatNumber(change, 2)}` : '+0.00'}%
        </text>
      )}
      {priceVisible && (
        <text
          x={x + width / 2}
          y={y + height * 0.84}
          textAnchor="middle"
          fill="rgba(255,255,255,0.95)"
          fontSize={Math.min(fontSizeBase * 1.5, 18)}
          fontWeight={600}
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
        >
          {typeof price === 'number' ? `${formatNumber(price, 2)} TON` : '0.00 TON'}
        </text>
      )}
    </g>
  );
};

const HeatmapTreemap: React.FC<HeatmapProps> = ({
  data,
  thresholds,
  colorFactor = 0.45,
  normalizeSizes = false,
  aspectRatio = 16 / 9,
}) => {
  const t = { ...defaultThresholds, ...(thresholds || {}) };
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const processed = useMemo(() => {
    const arr = (data || []).map((d, i) => {
      const safeSize = Number.isFinite(d.size) && d.size > 0 ? d.size : 0.000001;
      const safeChange = Number.isFinite(d.change) ? d.change : 0;
      const safePrice = Number.isFinite(d.price) ? d.price : 0;
      const color = computeColor(safeChange, colorFactor);
      return {
        ...d,
        size: normalizeSizes ? Math.pow(safeSize, 0.6) : safeSize,
        change: safeChange,
        price: safePrice,
        color,
        id: d.id || `${d.name}-${i}`,
      };
    });
    return arr;
  }, [data, colorFactor, normalizeSizes]);

  const hoverData = useMemo(() => {
    if (!hoveredId) return null;
    return processed.find((p) => p.id === hoveredId) || null;
  }, [hoveredId, processed]);

  const onCellEnter = (id?: string) => {
    if (!id) return;
    setHoveredId(id);
  };

  const onCellLeave = () => {
    setHoveredId(null);
  };


  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'linear-gradient(180deg,#0b0e12 0%, #0f1114 100%)',
        minHeight: '400px'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 20,
          color: 'white',
          background: 'rgba(0,0,0,0.25)',
          padding: '6px 10px',
          borderRadius: 12,
          fontSize: 13,
          backdropFilter: 'blur(6px)',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <span style={{ opacity: 0.85 }}>Market Heatmap</span>
        <span style={{ color: '#4ade80', fontWeight: 700, marginLeft: 6 }}>LIVE</span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={processed}
          dataKey="size"
          aspectRatio={aspectRatio}
          stroke="rgba(0,0,0,0.08)"
          fill="#999"
          content={<TreeMapContent />}
          isAnimationActive={false}
        />
      </ResponsiveContainer>

      {hoverData && (
        <div
          style={{
            position: 'absolute',
            zIndex: 30,
            right: 12,
            bottom: 12,
            width: 260,
            background: 'rgba(17,17,19,0.92)',
            color: 'white',
            borderRadius: 12,
            padding: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.04)',
            fontSize: 13,
            backdropFilter: 'blur(6px)',
          }}
          onMouseEnter={() => onCellEnter(hoverData.id)}
          onMouseLeave={() => onCellLeave()}
        >
          <div style={{ width: 48, height: 48, flex: '0 0 48px' }}>
            {hoverData.imageUrl ? (
              <img
                src={hoverData.imageUrl}
                alt={hoverData.name}
                style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 12,
                }}
              >
                IMG
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{hoverData.name}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
              {`${formatNumber(hoverData.price, 2)} TON`}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 16,
                fontWeight: 800,
                color: hoverData.change > 0 ? '#4ade80' : '#fb7185',
              }}
            >
              {`${hoverData.change >= 0 ? '+' : ''}${formatNumber(hoverData.change, 2)}%`}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: 12,
          bottom: 10,
          fontSize: 11,
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        © Gift Heatmap — stable mode
      </div>
    </div>
  );
};

export default HeatmapTreemap;
