/**
 * AIBadge - Visual indicator for AI-generated values
 * Shows when a value was suggested by AI with optional confidence score
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================================
// Types
// ============================================================================

interface AIBadgeProps {
  /** Whether to show the badge */
  show?: boolean;
  /** AI confidence score (0-1) */
  confidence?: number;
  /** Additional CSS classes */
  className?: string;
  /** Compact variant for inline display */
  variant?: 'default' | 'compact' | 'inline';
  /** Custom tooltip content */
  tooltip?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getConfidenceColor(confidence?: number): string {
  if (confidence === undefined) return 'text-primary';
  if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
  if (confidence >= 0.6) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getConfidenceLabel(confidence?: number): string {
  if (confidence === undefined) return 'AI Generated';
  if (confidence >= 0.8) return `AI Generated (High Confidence: ${Math.round(confidence * 100)}%)`;
  if (confidence >= 0.6) return `AI Generated (Medium Confidence: ${Math.round(confidence * 100)}%)`;
  return `AI Generated (Low Confidence: ${Math.round(confidence * 100)}%)`;
}

// ============================================================================
// Main Component
// ============================================================================

export function AIBadge({
  show = true,
  confidence,
  className,
  variant = 'default',
  tooltip,
}: AIBadgeProps) {
  if (!show) return null;

  const tooltipText = tooltip || getConfidenceLabel(confidence);
  const colorClass = getConfidenceColor(confidence);

  // Inline variant - just the icon
  if (variant === 'inline') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Sparkles className={cn('h-3 w-3 inline-block ml-1', colorClass, className)} />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Compact variant - small pill
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                'bg-primary/10',
                colorClass,
                className
              )}
            >
              <Sparkles className="h-2.5 w-2.5" />
              AI
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default variant - full badge
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
              'bg-primary/10 border border-primary/20',
              colorClass,
              className
            )}
          >
            <Sparkles className="h-3 w-3" />
            <span>AI</span>
            {confidence !== undefined && (
              <span className="text-muted-foreground">
                {Math.round(confidence * 100)}%
              </span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// Utility Component - Wrap any value with AI indicator
// ============================================================================

interface AIValueWrapperProps {
  children: React.ReactNode;
  aiGenerated?: boolean;
  aiConfidence?: number;
  className?: string;
}

export function AIValueWrapper({
  children,
  aiGenerated,
  aiConfidence,
  className,
}: AIValueWrapperProps) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {children}
      <AIBadge show={aiGenerated} confidence={aiConfidence} variant="inline" />
    </span>
  );
}

export default AIBadge;
