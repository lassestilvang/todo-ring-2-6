'use client';

import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { History, User, Trash2, Plus, CheckCircle2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

async function fetchTaskHistory(taskId: string) {
  const res = await fetch(`/api/history?taskId=${taskId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch history');
  return json.data;
}

interface TaskHistoryProps {
  taskId: string;
  open?: boolean;
  compact?: boolean;
}

const ACTION_ICONS: Record<string, any> = {
  'created': Plus,
  'completed': CheckCircle2,
  'reopened': RefreshCw,
  'deleted': Trash2,
  'updated': User,
};

const ACTION_COLORS: Record<string, string> = {
  'created': 'text-emerald-500',
  'completed': 'text-emerald-500',
  'reopened': 'text-amber-500',
  'deleted': 'text-red-500',
  'updated': 'text-blue-500',
};

export function TaskHistory({ taskId, open = true, compact = false }: TaskHistoryProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['task-history', taskId],
    queryFn: () => fetchTaskHistory(taskId),
    enabled: open && !!taskId,
  });

  if (!open) return null;

  return (
    <div className={cn(
      "rounded-xl border border-border/50",
      compact ? 'bg-muted/20' : 'bg-card/50 p-4'
    )}>
      {!compact && (
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4" />
          <h3 className="font-bold">Activity History</h3>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(compact ? 3 : 5)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground/50">
          <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No activity recorded yet</p>
        </div>
      ) : (
        <div className={cn(
          "space-y-3 overflow-y-auto",
          compact ? 'max-h-48' : 'max-h-96'
        )}>
          <AnimatePresence>
            {history.map((item: any, index: number) => {
              const Icon = ACTION_ICONS[item.action] || User;
              const color = ACTION_COLORS[item.action] || 'text-muted-foreground';

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/20"
                >
                  <div className={cn('p-1.5 rounded-full', color)}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{item.action}</span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {formatDistanceToNow(new Date(item.performedAt), { addSuffix: true })}
                      </span>
                    </div>
                    {item.fieldChanged && (
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {item.fieldChanged}: {item.oldValue} → {item.newValue}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}