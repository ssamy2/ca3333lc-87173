import React, { useState } from 'react';

interface LightBulbToggleProps {
  isLight: boolean;
  onToggle: () => void;
}

const LightBulbToggle: React.FC<LightBulbToggleProps> = ({ isLight, onToggle }) => {
  const [isPulling, setIsPulling] = useState(false);

  const handleMouseDown = () => {
    setIsPulling(true);
  };

  const handleMouseUp = () => {
    if (isPulling) {
      onToggle();
      setIsPulling(false);
    }
  };

  return (
    <div className="flex justify-end mr-4">
      <div 
        className="relative cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsPulling(false)}
      >
        <svg
          width="80"
          height="100" 
          viewBox="0 0 80 100"
          className={`transition-all duration-200 ${isPulling ? 'scale-105' : 'hover:scale-102'}`}
        >
          {/* الحبل الطويل */}
          <line
            x1="40"
            y1="5"
            x2="40"
            y2={isPulling ? "35" : "28"}
            stroke="#8B4513"
            strokeWidth="3"
            className="transition-all duration-200"
          />
          
          {/* حلقة الحبل للسحب */}
          <ellipse
            cx="40"
            cy="5"
            rx="4"
            ry="6"
            fill="none"
            stroke="#8B4513"
            strokeWidth="3"
            className={`transition-all duration-200 ${isPulling ? 'stroke-red-600' : 'hover:stroke-red-500'}`}
          />
          
          {/* قاعدة اللمبة المعدنية */}
          <rect
            x="30"
            y={isPulling ? "35" : "28"}
            width="20"
            height="12"
            rx="3"
            fill="#C0C0C0"
            stroke="#A0A0A0"
            strokeWidth="1"
            className="transition-all duration-200"
          />
          
          {/* خطوط قاعدة اللمبة */}
          <line x1="32" y1={isPulling ? "37" : "30"} x2="48" y2={isPulling ? "37" : "30"} stroke="#A0A0A0" strokeWidth="0.5" />
          <line x1="32" y1={isPulling ? "40" : "33"} x2="48" y2={isPulling ? "40" : "33"} stroke="#A0A0A0" strokeWidth="0.5" />
          <line x1="32" y1={isPulling ? "43" : "36"} x2="48" y2={isPulling ? "43" : "36"} stroke="#A0A0A0" strokeWidth="0.5" />
          
          {/* جسم اللمبة الزجاجية */}
          <path
            d={`M 40 ${isPulling ? "47" : "40"} 
               C 25 ${isPulling ? "50" : "43"} 25 ${isPulling ? "70" : "63"} 40 ${isPulling ? "85" : "78"}
               C 55 ${isPulling ? "70" : "63"} 55 ${isPulling ? "50" : "43"} 40 ${isPulling ? "47" : "40"} Z`}
            fill={isLight ? "#FFF8DC" : "#404040"}
            stroke={isLight ? "#FFD700" : "#606060"}
            strokeWidth="2"
            className="transition-all duration-300"
          />
          
          {/* الفتيل الداخلي */}
          <path
            d={`M 30 ${isPulling ? "60" : "53"} Q 40 ${isPulling ? "55" : "48"} 50 ${isPulling ? "60" : "53"}`}
            stroke={isLight ? "#FF8C00" : "#555"}
            strokeWidth="2"
            fill="none"
            className="transition-all duration-300"
          />
          <path
            d={`M 30 ${isPulling ? "65" : "58"} Q 40 ${isPulling ? "70" : "63"} 50 ${isPulling ? "65" : "58"}`}
            stroke={isLight ? "#FF8C00" : "#555"}
            strokeWidth="2"
            fill="none"
            className="transition-all duration-300"
          />
          
          {/* نقطة الإضاءة المركزية */}
          {isLight && (
            <circle
              cx="40"
              cy={isPulling ? "62" : "55"}
              r="3"
              fill="#FFFF00"
              className="animate-pulse transition-all duration-200"
            />
          )}
          
          {/* توهج اللمبة عند الإضاءة */}
          {isLight && (
            <>
              <circle
                cx="40"
                cy={isPulling ? "66" : "59"}
                r="25"
                fill="url(#lightGlow)"
                opacity="0.3"
                className="transition-all duration-200"
              />
              <circle
                cx="40" 
                cy={isPulling ? "66" : "59"}
                r="35"
                fill="url(#lightGlow2)"
                opacity="0.1"
                className="transition-all duration-200"
              />
            </>
          )}
          
          <defs>
            <radialGradient id="lightGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#FFFF00" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#FFD700" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFA500" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="lightGlow2" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#FFFF88" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
        
        {/* نص إرشادي */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-70">
          اسحب لأسفل
        </div>
      </div>
    </div>
  );
};

export default LightBulbToggle;