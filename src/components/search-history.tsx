'use client';

import * as React from 'react';
import { Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchHistoryProps {
  onSearchSelect: (query: string) => void;
  onClearHistory: () => void;
}

export function SearchHistory({ onSearchSelect, onClearHistory }: SearchHistoryProps) {
  const [history, setHistory] = React.useState<string[]>([]);

  React.useEffect(() => {
    const stored = localStorage.getItem('taskplanner-search-history');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  const removeFromHistory = (query: string) => {
    const newHistory = history.filter(h => h !== query);
    setHistory(newHistory);
    localStorage.setItem('taskplanner-search-history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('taskplanner-search-history');
    onClearHistory();
  };

  if (history.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Recent Searches
        </span>
        <Button variant="ghost" size="sm" onClick={clearHistory} className="text-[10px] h-5 px-2">
          Clear
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {history.map((query) => (
          <button
            key={query}
            onClick={() => onSearchSelect(query)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-full bg-muted/50 hover:bg-muted/70 transition-colors"
          >
            <Clock className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{query}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFromHistory(query);
              }}
              className="hover:text-destructive"
            >
              <X className="w-3 h-3" />
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}