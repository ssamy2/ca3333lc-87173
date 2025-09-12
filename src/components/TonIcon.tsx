import React from 'react';

interface TonIconProps {
  className?: string;
}

const TonIcon: React.FC<TonIconProps> = ({ className = "w-5 h-5" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="tonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0088CC" />
          <stop offset="100%" stopColor="#229ED9" />
        </linearGradient>
      </defs>
      {/* TON Crystal Shape */}
      <path
        d="M12 2L4 6L4 18L12 22L20 18L20 6L12 2Z"
        fill="url(#tonGradient)"
        stroke="#0088CC"
        strokeWidth="0.5"
      />
      {/* Inner crystal lines */}
      <path
        d="M12 2L12 22M4 6L20 18M20 6L4 18"
        stroke="#ffffff"
        strokeWidth="1"
        strokeOpacity="0.3"
      />
      {/* Center highlight */}
      <circle cx="12" cy="12" r="2" fill="#ffffff" fillOpacity="0.4"/>
    </svg>
  );
};

export default TonIcon;