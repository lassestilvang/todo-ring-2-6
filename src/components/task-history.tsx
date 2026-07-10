import { useeffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, User, Trash2, Plus, CheckCircle2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFocusTrap, useLiveRegion, SkipLink } from '@/hooks/useAccessibility';

/**
 * Accessible task history component
 */
export function TaskHistory({ taskId, open = true, compact = false }: { taskId: string, open?: boolean, compact?: boolean }) {
  const container = useFocusTrap();
  const announcement = useLiveRegion().announce;

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
    )};

    {!compact && (
      <div className="focus:visible focus:absolute focus:top-4 focus:left-4 focus:z-50"
        role="navigation"
        aria-label="Skip to task history actions"
      >
        <SkipLink/>
      </div>
    )}

    {isLoading ? (
      <div className="space-y-3"
        role="status"
        aria-live="polite"
      >
        {[...Array(compact ? 3 : 5)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}>
          )})
      </div>
    ) : history.length === 0 ? (
      <div className="text-center py-8 text-muted-foreground/50"
        role="region"
        aria-label="No task history available"
      >
        <History className="w-8 h-8 mx-auto mb-2 opacity-30"
          aria-label="No activity recorded"
        />
        <p className="text-sm">No activity recorded yet</p>
      </div>
    ) : (
      <div className={cn(
        "space-y-3 overflow-y-auto",
        compact ? 'max-h-48' : 'max-h-96'
      )};

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
              aria-label="{item.action} action on {formatDistanceToNow(new Date(item.performedAt), {addSuffix: true})}"
            >

              <div className={cn('p-1.5 rounded-full', color)};
                <Icon className="w-3 h-3"
                  aria-label="{item.action} action indicator"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize"
                    aria-label="{item.action} action description"
                  >{item.action}</span>

                  <span className="text-[10px] text-muted-foreground/60"
                    aria-label="{formatDistanceToNow(new Date(item.performedAt), {addSuffix: true})}"
                  >
                    {formatDistanceToNow(new Date(item.performedAt), {addSuffix: true})}
                  </span>
                </div>

                {item.fieldChanged && (
                  <p className="text-xs text-muted-foreground/60 mt-1"
                    aria-label="{item.fieldChanged} changed from {item.oldValue} to {item.newValue}"
                  >
                    {item.fieldChanged}: {item.oldValue} → {item.newValue}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    )}
  );
}