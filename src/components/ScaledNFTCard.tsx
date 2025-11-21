import { useState, useEffect, useRef, ReactNode } from 'react';

interface ScaledNFTCardProps {
  children: ReactNode;
}

export default function ScaledNFTCard({ children }: ScaledNFTCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const resize = () => {
      if (!ref.current) return;
      const w = ref.current.offsetWidth;
      setScale(w / 202);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div ref={ref} className="aspect-[1/1.99] w-full max-w-[202px] relative">
      <div className="absolute inset-0" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <div style={{ width: 202, height: 403 }}>{children}</div>
      </div>
    </div>
  );
}
