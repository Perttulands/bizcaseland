/**
 * Value with Rationale Display Component
 * Shows a value with its rationale in a consistent format
 * Supports AI research backing display
 */

import React, { useState } from 'react';
import { Info, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ResearchDocPanel, useResearchDocuments } from '@/components/features/ResearchDocPanel';

export interface ValueWithRationaleDisplayProps {
  value: string | number;
  unit?: string;
  rationale?: string;
  label?: string;
  className?: string;
  valueClassName?: string;
  showRationaleIcon?: boolean;
  // AI backing fields
  researchIds?: readonly string[];
  aiGenerated?: boolean;
  aiConfidence?: number;
  showResearchBadge?: boolean;
}

export function ValueWithRationaleDisplay({
  value,
  unit,
  rationale,
  label,
  className,
  valueClassName,
  showRationaleIcon = true,
  researchIds,
  aiGenerated,
  aiConfidence,
  showResearchBadge = true,
}: ValueWithRationaleDisplayProps) {
  const displayValue = unit ? `${value} ${unit}` : value;
  const researchDocs = useResearchDocuments(researchIds as string[] | undefined);
  const hasResearch = researchDocs.length > 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && (
        <span className="text-sm text-muted-foreground">{label}:</span>
      )}
      <span className={cn('font-medium', valueClassName)}>{displayValue}</span>

      {/* AI Badge with Research Popover */}
      {showResearchBadge && (aiGenerated || hasResearch) && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full',
                'text-xs font-medium bg-primary/10 text-primary',
                'hover:bg-primary/20 transition-colors cursor-pointer'
              )}
              title={aiConfidence ? `AI generated - ${Math.round(aiConfidence * 100)}% confidence` : 'AI generated'}
            >
              <Sparkles className="h-3 w-3" />
              <span>AI</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="start">
            {hasResearch ? (
              <ResearchDocPanel documents={researchDocs} defaultExpanded />
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">AI Generated Value</span>
                </div>
                {aiConfidence !== undefined && (
                  <p>Confidence: {Math.round(aiConfidence * 100)}%</p>
                )}
                {rationale && <p className="mt-2">{rationale}</p>}
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}

      {/* Regular rationale icon (when not AI generated) */}
      {rationale && showRationaleIcon && !aiGenerated && !hasResearch && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-sm">{rationale}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

/**
 * Rationale Badge Component
 * Shows rationale in a badge format
 */
export interface RationaleBadgeProps {
  rationale: string;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

export function RationaleBadge({
  rationale,
  variant = 'secondary',
  className,
}: RationaleBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs cursor-help',
              variant === 'default' && 'bg-primary text-primary-foreground',
              variant === 'outline' && 'border border-input bg-background',
              variant === 'secondary' && 'bg-secondary text-secondary-foreground',
              className
            )}
          >
            <Info className="h-3 w-3" />
            <span className="truncate max-w-[200px]">{rationale}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <p className="text-sm">{rationale}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
