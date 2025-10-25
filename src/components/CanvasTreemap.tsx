import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import { toast } from 'sonner';

interface TreemapData {
  name: string;
  size: number;
  change: number;
  price: number;
  imageUrl: string;
}

interface CanvasTreemapProps {
  data: TreemapData[];
  currency: 'ton' | 'usd';
}

const CanvasTreemap: React.FC<CanvasTreemapProps> = ({ data, currency }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const drawTreemap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Simple treemap layout - just a grid for now
    const totalSize = data.reduce((sum, item) => sum + item.size, 0);
    const cols = Math.ceil(Math.sqrt(data.length));
    const cellWidth = canvas.width / cols / zoom;
    const cellHeight = canvas.height / Math.ceil(data.length / cols) / zoom;

    data.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * cellWidth;
      const y = row * cellHeight;

      // Draw background
      const bgColor = item.change > 0 ? '#018f35' : item.change < 0 ? '#dc2626' : '#8F9779';
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, cellWidth - 2, cellHeight - 2);

      // Draw text
      ctx.fillStyle = 'white';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.name, x + cellWidth / 2, y + cellHeight / 2 - 20);

      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`${item.change >= 0 ? '+' : ''}${item.change.toFixed(2)}%`, x + cellWidth / 2, y + cellHeight / 2);

      ctx.font = '14px sans-serif';
      ctx.fillText(`${item.price.toFixed(2)} TON`, x + cellWidth / 2, y + cellHeight / 2 + 20);
    });

    ctx.restore();
  };

  useEffect(() => {
    drawTreemap();
  }, [data, zoom, pan]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `heatmap-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    toast.success('Downloaded!');
  };

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div className="w-full flex gap-2">
        <Button onClick={handleReset} variant="outline" size="sm" className="flex-1">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button onClick={handleZoomOut} variant="outline" size="sm">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button onClick={handleZoomIn} variant="outline" size="sm">
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>

      <Button onClick={handleDownload} variant="default" size="sm" className="w-full">
        <Download className="w-4 h-4 mr-2" />
        Download
      </Button>

      <div className="w-full relative bg-card rounded-lg overflow-hidden" style={{ height: '600px' }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
};

export default CanvasTreemap;
