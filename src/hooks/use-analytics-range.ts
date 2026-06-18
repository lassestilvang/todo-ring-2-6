import { useState, useCallback } from 'react';
import { format, subDays, subWeeks, subMonths, subQuarters, subYears } from 'date-fns';

export type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

export function useAnalyticsRange() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const getDateRange = useCallback((): DateRange => {
    const today = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'day':
        startDate = today;
        break;
      case 'week':
        startDate = subDays(today, 6);
        break;
      case 'month':
        startDate = subDays(today, 29);
        break;
      case 'quarter':
        startDate = subDays(today, 89);
        break;
      case 'year':
        startDate = subDays(today, 364);
        break;
      default:
        startDate = subDays(today, 6);
    }

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd'),
      label: timeRange.charAt(0).toUpperCase() + timeRange.slice(1),
    };
  }, [timeRange]);

  const handleRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  return {
    timeRange,
    setTimeRange: handleRangeChange,
    dateRange: getDateRange(),
  };
}