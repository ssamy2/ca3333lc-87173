import React from 'react';

interface TonIconProps {
  className?: string;
  style?: React.CSSProperties;
}

const TonIcon: React.FC<TonIconProps> = ({ className = "w-5 h-5", style }) => {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Official TON Logo Circle */}
      <circle cx="28" cy="28" r="28" fill="#0098EA"/>
      {/* Official TON Logo Symbol */}
      <path 
        d="M37.7257 15.6277H18.604C15.0882 15.6277 12.8599 19.4202 14.6286 22.4861L26.4298 42.9409C27.1999 44.2765 29.1298 44.2765 29.8999 42.9409L41.7035 22.4861C43.4699 19.4251 41.2415 15.6277 37.7281 15.6277H37.7257ZM26.4202 36.8068L23.8501 31.8327L17.6487 20.7414C17.2396 20.0315 17.7449 19.1218 18.6016 19.1218H26.4178V36.8092L26.4202 36.8068ZM38.6762 20.739L32.4772 31.8351L29.9071 36.8068V19.1194H37.7233C38.58 19.1194 39.0853 20.0291 38.6762 20.739Z" 
        fill="white"
      />
    </svg>
  );
};

export default TonIcon;