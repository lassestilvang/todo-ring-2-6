'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps {
  defaultValue?: number[];
  value?: number[];
  onValueChange?: (value: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, ...props }, ref) => {
    const {
      defaultValue = [50],
      value = defaultValue,
      onValueChange,
      max = 100,
      min = 0,
      step = 1,
      disabled = false,
    } = props;

    const percentage = ((value[0] - min) / (max - min)) * 100;

    const handleChange = (newVal: number) => {
      if (disabled || !onValueChange) return;
      const clamped = Math.min(Math.max(newVal, min), max);
      onValueChange([clamped]);
    };

    const handleClick = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !onValueChange || !ref) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = ((value[0] - min) / (max - min)) * (rect.width - 40);
      const newValue = min + (clickX / (rect.width - 40)) * (max - min);
      handleChange(newValue);
    }, [disabled, onValueChange, value, min, max, ref]);

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex items-center w-full cursor-pointer',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        onClick={handleClick}
      >
        <div className="absolute left-0 right-0 h-2 bg-muted rounded-full">
          <div
            className="h-2 bg-brand-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div
          className="absolute w-4 h-4 bg-background border-2 border-brand-500 rounded-full cursor-pointer"
          style={{
            left: `${percentage}%`,
            transform: 'translate(-50%, 0)',
          }}
        />
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };