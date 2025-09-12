import React from 'react';

interface NvaIconProps {
  className?: string;
}

const NvaIcon: React.FC<NvaIconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="nvaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      
      {/* Main N shape */}
      <path
        d="M3 20V4H6L15 14V4H18V20H15L6 10V20H3Z"
        fill="url(#nvaGradient)"
      />
      
      {/* Analytics chart elements */}
      <path
        d="M20 8L22 6V18L20 16V8Z"
        fill="currentColor"
        opacity="0.6"
      />
      
      {/* Data points */}
      <circle cx="8" cy="7" r="1" fill="currentColor" opacity="0.8" />
      <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.8" />
      <circle cx="16" cy="9" r="1" fill="currentColor" opacity="0.8" />
      
      {/* Connection lines */}
      <path
        d="M8 7L12 12M12 12L16 9"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.4"
      />
    </svg>
  );
};

export default NvaIcon;