'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Calendar, X, Plus, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface RecurringException {
  id: string;
  exceptionDate: string;
  reason?: string;
}

interface RecurringExceptionsManagerProps {
  taskId: string;
  exceptions: RecurringException[];
  onAddException?: (date: string, reason?: string) => void;
  onRemoveException?: (id: string) => void;
}

export function RecurringExceptionsManager({
  taskId,
  exceptions = [],
  onAddException,
  onRemoveException,
}: RecurringExceptionsManagerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [reason, setReason] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [localExceptions, setLocalExceptions] = useState<RecurringException[]>(exceptions);

  useEffect(() => {
    setLocalExceptions(exceptions);
  }, [exceptions]);

  const handleAddException = async () => {
    if (!selectedDate || !onAddException) return;

    setIsAdding(true);
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      await onAddException(dateString, reason);
      setReason('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveException = async (id: string) => {
    if (!onRemoveException) return;
    await onRemoveException(id);
  };

  const isExceptionDate = (date: Date): boolean => {
    return localExceptions.some(e => e.exceptionDate === format(date, 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-500" />
          Recurring Exceptions
        </h4>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="w-3 h-3 mr-1" />
              Skip Date
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4">
            <div className="space-y-3">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => isExceptionDate(date)}
              />
              <Textarea
                placeholder="Reason (optional)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
              <Button size="sm" onClick={handleAddException} disabled={isAdding}>
                {isAdding ? 'Adding...' : 'Add Exception'}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {localExceptions.length === 0 ? (
        <div className="text-sm text-muted-foreground/60">
          No exceptions scheduled. Add dates to skip this recurring task.
        </div>
      ) : (
        <div className="space-y-2">
          {localExceptions.map((exception) => (
            <div
              key={exception.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">
                    {format(new Date(exception.exceptionDate), 'EEE, MMM d, yyyy')}
                  </p>
                  {exception.reason && (
                    <p className="text-xs text-muted-foreground">{exception.reason}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveException(exception.id)}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}