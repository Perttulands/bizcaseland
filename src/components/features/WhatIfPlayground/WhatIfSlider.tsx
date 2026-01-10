/**
 * WhatIfSlider Component
 * Individual slider for manipulating model variables
 */

import React, { useCallback, useMemo } from 'react';
import { TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PlaygroundSlider } from './types';

// ============================================================================
// Types
// ============================================================================

export interface WhatIfSliderProps {
  slider: PlaygroundSlider;
  onChange: (value: number) => void;
  onReset: () => void;
  className?: string;
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function WhatIfSlider({
  slider,
  onChange,
  onReset,
  className,
  disabled = false,
}: WhatIfSliderProps) {
  const { driver, currentValue, displayValue, step } = slider;
  const [min, max] = driver.range;

  // Calculate percentage change from baseline
  const baseline = (min + max) / 2;  // Assume middle is baseline
  const percentChange = useMemo(() => {
    if (baseline === 0) return 0;
    return ((currentValue - baseline) / baseline) * 100;
  }, [currentValue, baseline]);

  const isChanged = Math.abs(percentChange) > 0.1;
  const isPositive = percentChange > 0;

  const handleSliderChange = useCallback((values: number[]) => {
    onChange(values[0]);
  }, [onChange]);

  // Format the min/max labels
  const formatRange = (value: number) => {
    if (driver.unit?.includes('%')) {
      return `${value}%`;
    }
    if (driver.unit?.includes('EUR') || driver.unit?.includes('USD')) {
      if (Math.abs(value) >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      }
      if (Math.abs(value) >= 1000) {
        return `${(value / 1000).toFixed(0)}K`;
      }
    }
    return value.toLocaleString();
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{driver.label}</span>
          {isChanged && (
            <Badge
              variant={isPositive ? 'default' : 'secondary'}
              className={cn(
                'text-xs',
                isPositive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {isPositive ? '+' : ''}{percentChange.toFixed(1)}%
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">{displayValue}</span>
          {isChanged && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={onReset}
                    disabled={disabled}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset to baseline</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Slider */}
      <div className="px-1">
        <Slider
          value={[currentValue]}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            'cursor-pointer',
            isChanged && isPositive && '[&>span:first-child]:bg-green-500',
            isChanged && !isPositive && '[&>span:first-child]:bg-red-500'
          )}
        />
      </div>

      {/* Range labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatRange(min)}</span>
        <span>{formatRange(max)}</span>
      </div>

      {/* Rationale (if available) */}
      {driver.rationale && (
        <p className="text-xs text-muted-foreground line-clamp-1">
          {driver.rationale}
        </p>
      )}
    </div>
  );
}

export default WhatIfSlider;
