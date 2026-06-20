'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { FixedSizeList as List, VariableSizeList } from 'react-window';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number | ((item: T) => number);
  containerHeight: number;
  gap?: number;
  onEndReached?: () => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  gap = 8,
  onEndReached,
  isLoading = false,
  emptyState,
}: VirtualListProps<T>) {
  const [outerHeight, setOuterHeight] = useState(containerHeight);

  // Use react-window for efficient virtualization
  const itemKey = useCallback((index: number) => {
    return index;
  }, []);

  const getItemSize = useCallback((index: number) => {
    const item = items[index];
    return typeof itemHeight === 'function' ? itemHeight(item) : itemHeight;
  }, [items, itemHeight]);

  // Infinite scroll
  useEffect(() => {
    if (isLoading && onEndReached) {
      onEndReached();
    }
  }, [isLoading, onEndReached]);

  if (items.length === 0 && !isLoading) {
    return emptyState || null;
  }

  return (
    <List
      height={outerHeight}
      itemCount={items.length}
      itemSize={getItemSize}
      itemKey={itemKey}
      gap={gap}
    >
      {({ index, style }) => (
        <div style={style}>
          {renderItem(items[index], index)}
        </div>
      )}
    </List>
  );
}

/**
 * Virtual Kanban Board
 */
export function VirtualKanbanBoard({
  tasks,
  columns,
  renderColumn,
}: {
  tasks: any[];
  columns: string[];
  renderColumn: (columnId: string, tasks: any[]) => React.ReactNode;
}) {
  const columnWidth = 320;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((columnId) => {
        const columnTasks = tasks.filter(t => t.columnId === columnId);
        return renderColumn(columnId, columnTasks);
      })}
    </div>
  );
}

/**
 * Virtual Calendar
 */
export function VirtualCalendar({
  days,
  renderDay,
}: {
  days: Date[];
  renderDay: (date: Date) => React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((date, index) => (
        <div key={index}>
          {renderDay(date)}
        </div>
      ))}
    </div>
  );
}