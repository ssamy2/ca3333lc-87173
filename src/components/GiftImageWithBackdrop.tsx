import React, { useEffect, useRef, useState } from 'react';
import backdropData from '@/assets/backdrobd.json';

interface GiftImageWithBackdropProps {
  imageUrl: string;
  backdropName?: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: (e: any) => void;
}

interface BackdropColors {
  centerColor: string;
  edgeColor: string;
  patternColor: string;
  textColor: string;
}

const GiftImageWithBackdrop: React.FC<GiftImageWithBackdropProps> = ({
  imageUrl,
  backdropName,
  alt,
  className = '',
  onLoad,
  onError
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const size = 512;
    canvas.width = size;
    canvas.height = size;

    // Find backdrop colors
    let backdropColors: BackdropColors | null = null;
    if (backdropName) {
      const backdrop = backdropData.find(
        (b: any) => b.name.toLowerCase() === backdropName.toLowerCase()
      );
      if (backdrop && backdrop.hex) {
        backdropColors = {
          centerColor: backdrop.hex.centerColor,
          edgeColor: backdrop.hex.edgeColor,
          patternColor: backdrop.hex.patternColor,
          textColor: backdrop.hex.textColor
        };
      }
    }

    // Draw backdrop if available
    if (backdropColors) {
      // Create radial gradient from center to edge
      const gradient = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2
      );
      gradient.addColorStop(0, backdropColors.centerColor);
      gradient.addColorStop(0.7, backdropColors.edgeColor);
      gradient.addColorStop(1, backdropColors.patternColor);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    } else {
      // Default gradient if no backdrop
      const gradient = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2
      );
      gradient.addColorStop(0, '#1a2332');
      gradient.addColorStop(1, '#0f1419');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }

    // Load and draw image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Calculate dimensions to fit image in canvas
      const scale = Math.min(size / img.width, size / img.height) * 0.9;
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (size - scaledWidth) / 2;
      const y = (size - scaledHeight) / 2;

      // Draw image centered
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      setIsLoading(false);
      setError(false);
      if (onLoad) onLoad();
    };

    img.onerror = (e) => {
      console.error('Failed to load gift image:', imageUrl);
      setIsLoading(false);
      setError(true);
      if (onError) onError(e);
    };

    img.src = imageUrl;
  }, [imageUrl, backdropName, onLoad, onError]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{ display: error ? 'none' : 'block' }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0098EA]/10 to-[#8B5CF6]/10 flex items-center justify-center backdrop-blur-sm">
          <div className="animate-spin w-8 h-8 border-3 border-[#0098EA]/20 border-t-[#0098EA] rounded-full"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0098EA]/5 to-[#8B5CF6]/5">
          <div className="w-12 h-12 bg-[#0098EA]/10 rounded-full flex items-center justify-center mb-2">
            <span className="text-2xl">🎁</span>
          </div>
          <p className="text-xs text-gray-400 font-medium">NFT Gift</p>
        </div>
      )}
    </div>
  );
};

export default GiftImageWithBackdrop;
