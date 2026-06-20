'use client';

import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { SortableTaskCard } from './task-detail-dialog';
import type { Task } from '@/types/index';

interface VirtualTaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (task: Task) => void;
  isLoading: boolean;
  selectedTasks: Set<string>;
  selectionMode: boolean;
}

export function VirtualTaskList({
  tasks,
  onToggle,
  onDelete,
  onSelect,
  isLoading,
  selectedTasks,
  selectionMode,
}: VirtualTaskListProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Average task card height
    overscan: 5,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse border border-border/50"
            style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-[600px] overflow-y-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <AnimatePresence>
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const task = tasks[virtualItem.index];
            if (!task) return null;

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <SortableTaskCard
                    task={task}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onSelect={onSelect}
                    isSelected={selectedTasks.has(task.id)}
                    selectionMode={selectionMode}
                  />
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
