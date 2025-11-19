import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserHeaderProps {
  username: string;
  fullName?: string;
  photoUrl?: string;
  onRefresh: () => void;
  disabled: boolean;
}

export const UserHeader = React.memo(({
  username,
  fullName,
  photoUrl,
  onRefresh,
  disabled
}: UserHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {photoUrl && (
          <img
            src={photoUrl}
            alt={fullName || username}
            className="w-12 h-12 rounded-full border-2 border-primary/20"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <div>
          <h2 className="text-lg font-semibold">@{username}</h2>
          {fullName && <p className="text-sm text-muted-foreground">{fullName}</p>}
        </div>
      </div>
      <Button
        onClick={onRefresh}
        disabled={disabled}
        variant="outline"
        size="icon"
        className="rounded-full"
      >
        <RefreshCw className={`w-4 h-4 ${disabled ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
});

UserHeader.displayName = 'UserHeader';
