'use client';

import * as React from 'react';
import { useState, useCallback, useMemo, memo } from 'react';
import {FixedSizeList as VirtualList, VariableSizeList} from 'react-window';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number, item: T) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  itemCount?: number;
  itemKey?: (item: T, index: number) => string;
  className?: string;
  containerClassName?: string;
  overscanCount?: number;
  onEndReached?: () => void;
  isLoading?: boolean;
  loadingComponent?: React.ReactNode;
}

const DEFAULT_ITEM_HEIGHT = 60;
const DEFAULT_OVERSCAN = 5;

export const VirtualList = memo(<T,>({
  items,
  itemHeight,
  renderItem,
  itemCount,
  itemKey,
  className,
  containerClassName,
  overscanCount = DEFAULT_OVERSCAN,
  onEndReached,
  isLoading,
  loadingComponent,
}: VirtualListProps<T>) => {
  const [listRef, setListRef] = useState<VariableSizeList | FixedSizeList | null>(null);
  const { ref: observerRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '100px',
  });

  // Call onEndReached when bottom approaches
  React.useEffect(() => {
    if (isIntersecting && onEndReached && !isLoading) {
      onEndReached();
    }
  }, [isIntersecting, onEndReached, isLoading]);

  const getItemSize = useCallback((index: number) => {
    if (typeof itemHeight === 'function') {
      return itemHeight(index, items[index]);
    }
    return itemHeight;
  }, [itemHeight, items]);

  const rowRenderer = useCallback(({ index, style, isScrolling, visibleStopIndex, visibleStartIndex }: any) => {
    const item = items[index];
    const key = itemKey ? itemKey(item, index) : `${index}-${isScrolling ? 'scrolling' : 'static'}`;

    return (
      <div
        key={key}
        style={style}
        className={cn('relative', isScrolling && 'transition-none')}
        ref={index === items.length - 1 ? observerRef : null}
      >
        {renderItem(item, index)}
      </div>
    );
  }, [items, itemKey, renderItem, observerRef]);

  const totalItems = itemCount || items.length;

  return (
    <div className={cn('virtual-list-container', containerClassName)}>
      <VirtualList
        ref={setListRef}
        height={600}
        itemCount={totalItems}
        itemSize={getItemSize}
        overscanCount={overscanCount}
        itemKey={itemKey}
      >
        {rowRenderer}
      </VirtualList>
      {isLoading && loadingComponent}
    </div>
  );
});

VirtualList.displayName = 'VirtualList';

// Optimized list item component
export const VirtualListItem = memo(({
  children,
  isSelected,
  isHovered,
  onClick,
  className,
}: {
  children: React.ReactNode;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'rounded-lg transition-all duration-200 cursor-pointer',
        isSelected && 'bg-primary/10 border border-primary/20',
        isHovered && 'bg-muted/50',
        className
      )}
      onClick={onClick}
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
    >
      {children}
    </div>
  );
});

VirtualListItem.displayName = 'VirtualListItem';

// Infinite scroll hook
export function useInfiniteScroll<T>(
  items: T[],
  pageSize: number = 50
): {
  visibleItems: T[];
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
} {
  const [page, setPage] = useState(0);

  const visibleItems = useMemo(() => {
    const start = page * pageSize;
    return items.slice(0, start + pageSize);
  }, [items, page, pageSize]);

  const hasMore = useMemo(() => {
    return visibleItems.length < items.length;
  }, [visibleItems.length, items.length]);

  const loadMore = useCallback(() => {
    if (hasMore) {
      setPage(p => p + 1);
    }
  }, [hasMore]);

  const reset = useCallback(() => {
    setPage(0);
  }, []);

  return { visibleItems, hasMore, loadMore, reset };
}