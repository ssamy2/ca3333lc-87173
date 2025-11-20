import React from 'react';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, label, value, subValue }) => {
  return (
    <div className="bg-secondary/30 border border-border/50 rounded-lg p-3 flex flex-col items-center justify-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        <div className="flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="font-bold text-sm text-center">{value}</p>
      {subValue && (
        <p className="text-xs text-muted-foreground text-center">{subValue}</p>
      )}
    </div>
  );
};

export default StatsCard;