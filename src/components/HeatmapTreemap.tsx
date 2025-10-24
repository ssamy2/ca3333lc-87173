import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, Treemap } from 'recharts';
import { motion } from 'framer-motion';

interface GiftItem {
  name: string;
  size: number;
  change: number;
  price: number;
  imageUrl?: string;
  id?: string;
}

interface HeatmapProps {
  data: GiftItem[];
}

const HeatmapTreemap: React.FC<HeatmapProps> = ({ data }) => {
  const [hovered, setHovered] = useState<string | null>(null);

  const processed = useMemo(() => {
    return data.map((d, i) => {
      const color = d.change > 0
        ? `hsl(145, 60%, ${45 - Math.min(d.change * 0.5, 20)}%)`
        : `hsl(0, 70%, ${45 - Math.min(Math.abs(d.change) * 0.5, 20)}%)`;
      return { ...d, color, id: d.id || `${d.name}-${i}` };
    });
  }, [data]);

  const Content = (props: any) => {
    const { x, y, width, height, name, change, price, imageUrl, color, id } = props;
    if (!width || !height) return null;

    const area = width * height;
    const minDim = Math.min(width, height);
    const hoveredCell = hovered === id;

    const baseFont = Math.sqrt(area) / 14;
    const imgSize = Math.min(minDim * 0.25, 40);
    const fade = hoveredCell ? 1 : 0.85;
    const glow = hoveredCell ? '0 0 15px rgba(255,255,255,0.35)' : 'none';
    const border = hoveredCell ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.15)';

    const showImage = area > 900;
    const showName = area > 2000;
    const showPrice = area > 3200;

    return (
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onMouseEnter={() => setHovered(id)}
        onMouseLeave={() => setHovered(null)}
      >
        <motion.rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={8}
          fill={color}
          stroke={border}
          strokeWidth={hoveredCell ? 2 : 1.5}
          style={{
            filter: glow,
            transition: 'all 0.25s ease-out',
            opacity: fade,
          }}
        />

        {showImage && imageUrl && (
          <motion.image
            href={imageUrl}
            x={x + width / 2 - imgSize / 2}
            y={y + height * 0.1}
            width={imgSize}
            height={imgSize}
            animate={{
              scale: hoveredCell ? 1.1 : 1,
              transition: { duration: 0.3 },
            }}
            style={{
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))',
            }}
          />
        )}

        {showName && (
          <text
            x={x + width / 2}
            y={y + height * 0.38}
            textAnchor="middle"
            fill="white"
            fontSize={Math.min(baseFont * 0.9, 11)}
            fontWeight="600"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              pointerEvents: 'none',
            }}
          >
            {name}
          </text>
        )}

        <text
          x={x + width / 2}
          y={y + height * 0.55}
          textAnchor="middle"
          fill="white"
          fontSize={Math.min(baseFont * 2, 16)}
          fontWeight="800"
          style={{
            textShadow: '0 2px 5px rgba(0,0,0,0.9)',
            pointerEvents: 'none',
          }}
        >
          {change >= 0 ? '+' : ''}
          {change.toFixed(2)}%
        </text>

        {showPrice && (
          <text
            x={x + width / 2}
            y={y + height * 0.84}
            textAnchor="middle"
            fill="rgba(255,255,255,0.85)"
            fontSize={Math.min(baseFont * 0.7, 9)}
            fontWeight="500"
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.7)',
              pointerEvents: 'none',
            }}
          >
            {price.toFixed(2)} TON
          </text>
        )}
      </motion.g>
    );
  };

  const TitleOverlay = () => (
    <div className="absolute top-4 left-4 z-10 bg-black/30 text-white px-3 py-1.5 rounded-xl backdrop-blur-md text-sm font-semibold select-none">
      <span className="opacity-80">Market Heatmap</span>
      <span className="text-green-400 ml-2">LIVE</span>
    </div>
  );

  const HoverCard = useMemo(() => {
    if (!hovered) return null;
    const h = processed.find((x) => x.id === hovered);
    if (!h) return null;
    return (
      <motion.div
        className="absolute bottom-6 right-6 bg-zinc-900/85 text-white px-4 py-3 rounded-xl shadow-lg backdrop-blur-lg border border-white/10 w-64"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          {h.imageUrl && <img src={h.imageUrl} alt={h.name} className="w-10 h-10 rounded-md" />}
          <div>
            <div className="font-semibold text-sm">{h.name}</div>
            <div className="text-xs opacity-80">{h.price.toFixed(2)} TON</div>
          </div>
        </div>
        <div
          className={`mt-2 text-lg font-bold ${
            h.change > 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {h.change >= 0 ? '+' : ''}
          {h.change.toFixed(2)}%
        </div>
      </motion.div>
    );
  }, [hovered, processed]);

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-zinc-950 to-zinc-900 rounded-2xl overflow-hidden">
      <TitleOverlay />
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={processed}
          dataKey="size"
          aspectRatio={16 / 9}
          stroke="none"
          content={<Content />}
        />
      </ResponsiveContainer>
      {HoverCard}
      <div className="absolute bottom-3 left-4 text-xs text-zinc-500 font-medium select-none">
        Powered by Recharts + Framer Motion
      </div>
    </div>
  );
};

export default HeatmapTreemap;
