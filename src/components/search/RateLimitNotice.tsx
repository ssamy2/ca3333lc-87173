import React from 'react';
import TonIcon from '@/components/TonIcon';

interface RateLimitNoticeProps {
  countdown: number;
  limitedLabel: string;
  waitLabel: string;
}

export const RateLimitNotice = React.memo(({
  countdown,
  limitedLabel,
  waitLabel
}: RateLimitNoticeProps) => {
  if (countdown <= 0) return null;

  return (
    <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <TonIcon className="w-5 h-5 text-warning animate-pulse" />
        <span className="text-sm font-medium text-warning">{limitedLabel}</span>
      </div>
      <p className="text-xs text-warning/80">
        {waitLabel.replace('{seconds}', countdown.toString())}
      </p>
      <div className="mt-2 w-full bg-warning/20 rounded-full h-1">
        <div
          className="bg-warning h-1 rounded-full transition-all duration-1000"
          style={{ width: `${100 - (countdown / 60) * 100}%` }}
        />
      </div>
    </div>
  );
});

RateLimitNotice.displayName = 'RateLimitNotice';
