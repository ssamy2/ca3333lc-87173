import React from 'react';
import { Button } from '@/components/ui/button';

interface LightBulbToggleProps {
  isLight: boolean;
  onToggle: () => void;
}

const LightBulbToggle: React.FC<LightBulbToggleProps> = ({ isLight, onToggle }) => {
  return (
    <div className="flex justify-end mr-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="relative w-16 h-20 p-0 bg-transparent hover:bg-transparent group"
      >
        <svg
          width="64"
          height="80"
          viewBox="0 0 64 80"
          className="transition-all duration-300 hover:scale-105"
        >
          {/* الحبل */}
          <line
            x1="32"
            y1="8"
            x2="32"
            y2="22"
            stroke={isLight ? "#8B5A2B" : "#5A5A5A"}
            strokeWidth="2"
            className="transition-colors duration-300"
          />
          
          {/* حلقة الحبل */}
          <circle
            cx="32"
            cy="8"
            r="3"
            fill={isLight ? "#8B5A2B" : "#5A5A5A"}
            className="transition-colors duration-300"
          />
          
          {/* قاعدة اللمبة */}
          <rect
            x="26"
            y="22"
            width="12"
            height="8"
            rx="2"
            fill={isLight ? "#E5E5E5" : "#404040"}
            className="transition-colors duration-300"
          />
          
          {/* جسم اللمبة */}
          <ellipse
            cx="32"
            cy="45"
            rx="16"
            ry="20"
            fill={isLight ? "#FFF9C4" : "#2A2A2A"}
            stroke={isLight ? "#FFD700" : "#404040"}
            strokeWidth="2"
            className="transition-all duration-300"
          />
          
          {/* خيوط اللمبة الداخلية */}
          {isLight && (
            <>
              <path
                d="M20 40 Q32 35 44 40"
                stroke="#FFB800"
                strokeWidth="1"
                fill="none"
                className="animate-pulse"
              />
              <path
                d="M20 45 Q32 50 44 45"
                stroke="#FFB800"
                strokeWidth="1"
                fill="none"
                className="animate-pulse"
              />
              <path
                d="M20 50 Q32 45 44 50"
                stroke="#FFB800"
                strokeWidth="1"
                fill="none"
                className="animate-pulse"
              />
            </>
          )}
          
          {/* توهج اللمبة */}
          {isLight && (
            <ellipse
              cx="32"
              cy="45"
              rx="20"
              ry="24"
              fill="url(#lightGlow)"
              className="opacity-50"
            />
          )}
          
          <defs>
            <radialGradient id="lightGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#FFF700" stopOpacity="0.3" />
              <stop offset="70%" stopColor="#FFD700" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
        
        {/* تأثير الضوء المنتشر */}
        {isLight && (
          <div className="absolute inset-0 rounded-full bg-yellow-200 opacity-20 blur-md scale-150 pointer-events-none" />
        )}
      </Button>
    </div>
  );
};

export default LightBulbToggle;