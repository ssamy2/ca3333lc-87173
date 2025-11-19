import React from 'react';

interface HistoryListProps {
  history: string[];
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
  onClearAll: () => void;
  recentLabel: string;
  clearLabel: string;
}

export const HistoryList = React.memo(({
  history,
  onSelect,
  onRemove,
  onClearAll,
  recentLabel,
  clearLabel
}: HistoryListProps) => {
  if (history.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">{recentLabel}</p>
        <button
          onClick={onClearAll}
          className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {clearLabel}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {history.map((term, index) => (
          <div key={index} className="relative group">
            <button
              onClick={() => onSelect(term)}
              className="pl-3 pr-7 py-1.5 bg-secondary/70 text-secondary-foreground rounded-full text-xs hover:bg-secondary transition-colors border border-border/30"
            >
              @{term}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(term);
              }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
              aria-label="Remove"
            >
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

HistoryList.displayName = 'HistoryList';
