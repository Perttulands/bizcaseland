import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sliders, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SensitivityDriverBadgeProps {
  path: string;
  currentRange?: number[];
  onUpdateRange: (range: number[]) => void;
  onRemove: () => void;
  unit?: string;
}

export function SensitivityDriverBadge({
  path,
  currentRange = [0, 0, 0, 0, 0],
  onUpdateRange,
  onRemove,
  unit
}: SensitivityDriverBadgeProps) {
  // Check if this is a percentage-based value
  const isPercentage = unit === '%' || unit === 'ratio' || unit === 'pct' || unit?.includes('pct') || unit?.includes('percentage') || unit?.includes('churn');
  
  // Convert stored values to display values (for percentages: 0.05 -> 5)
  const toDisplayValue = (value: number): number => {
    return isPercentage ? value * 100 : value;
  };
  
  // Convert display values to storage values (for percentages: 5 -> 0.05)
  const toStorageValue = (value: number): number => {
    return isPercentage ? value / 100 : value;
  };

  // Normalize currentRange to always be an array of 5 numbers
  const normalizeRange = (range: any): number[] => {
    // If range is null or undefined, use default
    if (!range) {
      return [0, 0, 0, 0, 0];
    }
    
    // If range is an array, ensure it has 5 elements
    if (Array.isArray(range)) {
      if (range.length >= 5) {
        return range.slice(0, 5);
      } else if (range.length === 2) {
        // If it's a [min, max] tuple, interpolate to 5 values
        const [min, max] = range;
        const step = (max - min) / 4;
        return [min, min + step, min + 2 * step, min + 3 * step, max];
      } else {
        // Pad with zeros
        return [...range, ...Array(5 - range.length).fill(0)];
      }
    }
    
    // If range is an object with min/max properties
    if (typeof range === 'object' && 'min' in range && 'max' in range) {
      const min = range.min;
      const max = range.max;
      const step = (max - min) / 4;
      return [min, min + step, min + 2 * step, min + 3 * step, max];
    }
    
    // Fallback to default
    return [0, 0, 0, 0, 0];
  };
  
  const [range, setRange] = useState<number[]>(normalizeRange(currentRange).map(toDisplayValue));
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    // Convert display values back to storage format before saving
    const storageRange = range.map(toStorageValue);
    onUpdateRange(storageRange);
    setIsOpen(false);
  };

  const handleRangeChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newRange = [...range];
    newRange[index] = numValue;
    setRange(newRange);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
        >
          <Sliders className="h-3 w-3" />
          <span className="text-xs font-medium">S</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Sensitivity Driver Range</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Define 5 values for sensitivity analysis. These will be used to test different scenarios.
            {isPercentage && <span className="block mt-1 text-financial-primary font-medium">Enter values as percentages (e.g., 5 = 5%)</span>}
          </p>

          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className="flex items-center gap-2">
                <Label className="text-xs w-16">Value {index + 1}:</Label>
                <div className="flex-1 flex items-center gap-1">
                  <Input
                    type="number"
                    value={range[index]}
                    onChange={(e) => handleRangeChange(index, e.target.value)}
                    className="h-8 text-sm"
                    step="any"
                  />
                  {isPercentage && <span className="text-xs text-muted-foreground whitespace-nowrap">%</span>}
                  {!isPercentage && unit && <span className="text-xs text-muted-foreground whitespace-nowrap">{unit}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
            >
              Save Range
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
