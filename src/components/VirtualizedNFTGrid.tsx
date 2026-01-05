/**
 * ============================================================================
 * VIRTUALIZED NFT GRID - Performance Optimized for Weak Devices
 * Protocol: CODE_DIRECT_REFACTOR_IMAGE_CACHE_2026
 * Features:
 * - Virtual scrolling for large lists
 * - GPU-accelerated transforms
 * - Lazy loading of items
 * - Memory-efficient rendering
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import NFTCard from './NFTCard';
import { WidgetErrorBoundary } from './ErrorBoundary';

interface NFTGift {
  count: number;
  name: string;
  model: string;
  floor_price: number;
  avg_price: number;
  image?: string;
  title?: string;
  backdrop?: string;
  backdrop_rarity?: string;
  symbol?: string;
  symbol_rarity?: string;
  model_rarity?: string;
  quantity_issued?: number;
  quantity_total?: number;
  quantity_raw?: string;
  description?: string;
  tg_deeplink?: string;
  details?: {
    links?: string[];
  };
}

interface VirtualizedNFTGridProps {
  nfts: NFTGift[];
  itemHeight?: number;
  overscan?: number;
}

const VirtualizedNFTGrid: React.FC<VirtualizedNFTGridProps> = ({
  nfts,
  itemHeight = 280,
  overscan = 3
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [columns, setColumns] = useState(2);

  // Calculate columns based on screen width
  const updateColumns = useCallback(() => {
    const width = window.innerWidth;
    if (width >= 1536) setColumns(6);      // 2xl
    else if (width >= 1280) setColumns(5); // xl
    else if (width >= 1024) setColumns(4); // lg
    else if (width >= 640) setColumns(3);  // sm
    else setColumns(2);                     // mobile
  }, []);

  // Update container height and columns on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerHeight(window.innerHeight);
      }
      updateColumns();
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateColumns]);

  // Handle scroll with throttling
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollTop(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate visible items
  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    const rowHeight = itemHeight + 16; // item height + gap
    const totalRows = Math.ceil(nfts.length / columns);
    const totalHeight = totalRows * rowHeight;

    // Get container offset from top of page
    const containerOffset = containerRef.current?.offsetTop || 0;
    const relativeScrollTop = Math.max(0, scrollTop - containerOffset);

    // Calculate visible range
    const startRow = Math.floor(relativeScrollTop / rowHeight);
    const visibleRows = Math.ceil(containerHeight / rowHeight);
    
    const startIndex = Math.max(0, (startRow - overscan) * columns);
    const endIndex = Math.min(nfts.length, (startRow + visibleRows + overscan) * columns);
    
    const visibleItems = nfts.slice(startIndex, endIndex).map((nft, i) => ({
      nft,
      index: startIndex + i
    }));

    const offsetY = Math.max(0, startRow - overscan) * rowHeight;

    return { visibleItems, totalHeight, offsetY };
  }, [nfts, scrollTop, containerHeight, columns, itemHeight, overscan]);

  // Memoize the grid items to prevent unnecessary re-renders
  // Wrapped in WidgetErrorBoundary for resilience
  const gridItems = useMemo(() => (
    visibleItems.map(({ nft, index }) => (
      <WidgetErrorBoundary 
        key={`${nft.name}-${nft.model}-${index}-${nft.floor_price}`}
        className="min-h-[200px]"
      >
        <NFTCard nft={nft} />
      </WidgetErrorBoundary>
    ))
  ), [visibleItems]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full"
      // GPU acceleration hint
      style={{ 
        willChange: 'transform',
        contain: 'layout style paint',
      }}
    >
      {/* Spacer for total height */}
      <div style={{ height: totalHeight }}>
        {/* Positioned container for visible items - GPU accelerated */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4"
          style={{
            // GPU-accelerated transform for 60fps scrolling
            transform: `translate3d(0, ${offsetY}px, 0)`,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        >
          {gridItems}
        </div>
      </div>
    </div>
  );
};

export default React.memo(VirtualizedNFTGrid);
