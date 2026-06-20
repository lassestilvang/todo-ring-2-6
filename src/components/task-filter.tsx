'use client';

import { useQuery } from '@tanstack/react-query';
import { Filter, Calendar, Flag, Tag, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { Label } from '@/types/index';

export interface FilterState {
  priorities: ('high' | 'medium' | 'low' | 'none')[];
  statuses: ('pending' | 'in_progress' | 'completed' | 'cancelled')[];
  labels: string[];
  dateFrom: string;
  dateTo: string;
  minEstimate: string;
  maxEstimate: string;
}

interface TaskFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClear: () => void;
}

async function fetchLabels() {
  const res = await fetch('/api/labels');
  const json = await res.json();
  if (!json.success) throw new Error('Failed to fetch labels');
  return json.data;
}

export function TaskFilter({ filters, onFiltersChange, onClear }: TaskFilterProps) {
  const { data: labels = [] } = useQuery({
    queryKey: ['labels-filter'],
    queryFn: fetchLabels,
  });

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const activeFilterCount =
    filters.priorities.length +
    filters.statuses.length +
    filters.labels.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 border-dashed transition-all',
            activeFilterCount > 0 && 'border-primary bg-primary/5'
          )}
        >
          <Filter className="w-3.5 h-3.5 mr-2" />
          <span className="text-sm font-medium">Filter</span>
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-2 h-5 px-2 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 sm:w-80 bg-card/95 backdrop-blur-xl border shadow-lg" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wider">Filters</h3>
            <Button variant="ghost" size="sm" onClick={onClear} className="text-xs h-6">
              Clear All
            </Button>
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Flag className="w-3.5 h-3.5" />
              <span>Priority</span>
            </div>
            <div className="space-y-1.5">
              {(['high', 'medium', 'low', 'none'] as const).map((priority) => (
                <div key={priority} className="flex items-center space-x-2">
                  <Checkbox
                    id={`priority-${priority}`}
                    checked={filters.priorities.includes(priority)}
                    onCheckedChange={(checked) => {
                      const newPriorities = checked
                        ? [...filters.priorities, priority]
                        : filters.priorities.filter(p => p !== priority);
                      updateFilter('priorities', newPriorities);
                    }}
                  />
                  <label htmlFor={`priority-${priority}`} className="text-sm cursor-pointer flex items-center gap-2">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      priority === 'high' ? 'bg-red-500' :
                      priority === 'medium' ? 'bg-amber-500' :
                      priority === 'low' ? 'bg-blue-500' : 'bg-muted-foreground'
                    )} />
                    {priority === 'none' ? 'No Priority' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Status</span>
            </div>
            <div className="space-y-1.5">
              {(['pending', 'in_progress', 'completed', 'cancelled'] as const).map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.statuses.includes(status)}
                    onCheckedChange={(checked) => {
                      const newStatuses = checked
                        ? [...filters.statuses, status]
                        : filters.statuses.filter(s => s !== status);
                      updateFilter('statuses', newStatuses);
                    }}
                  />
                  <label htmlFor={`status-${status}`} className="text-sm cursor-pointer capitalize">
                    {status.replace('_', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Labels Filter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Tag className="w-3.5 h-3.5" />
              <span>Labels</span>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {labels.map((label: Label) => (
                <div key={label.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`label-${label.id}`}
                    checked={filters.labels.includes(label.id)}
                    onCheckedChange={(checked) => {
                      const newLabels = checked
                        ? [...filters.labels, label.id]
                        : filters.labels.filter(l => l !== label.id);
                      updateFilter('labels', newLabels);
                    }}
                  />
                  <label htmlFor={`label-${label.id}`} className="text-sm cursor-pointer flex items-center gap-1.5">
                    <span style={{ color: label.color }}>{label.icon}</span>
                    {label.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>Date Range</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground">From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  className="w-full h-7 text-sm rounded border bg-background px-2"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                  className="w-full h-7 text-sm rounded border bg-background px-2"
                />
              </div>
            </div>
          </div>

          {/* Time Estimate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Time Estimate (hours)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground">Min</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={filters.minEstimate}
                  onChange={(e) => updateFilter('minEstimate', e.target.value)}
                  className="w-full h-7 text-sm rounded border bg-background px-2"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Max</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={filters.maxEstimate}
                  onChange={(e) => updateFilter('maxEstimate', e.target.value)}
                  className="w-full h-7 text-sm rounded border bg-background px-2"
                  placeholder="Any"
                />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}