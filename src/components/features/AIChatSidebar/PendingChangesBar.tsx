/**
 * PendingChangesBar - Sticky bar showing pending AI suggestions
 * Displays count of pending changes with Apply All / Dismiss All actions
 */

import React from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { AISuggestion } from '@/core/types/ai';

interface PendingChangesBarProps {
  suggestions: readonly AISuggestion[];
  appliedIds: Set<string>;
  onApplyAll: () => void;
  onDismissAll: () => void;
  className?: string;
}

export function PendingChangesBar({
  suggestions,
  appliedIds,
  onApplyAll,
  onDismissAll,
  className,
}: PendingChangesBarProps) {
  // Filter to only show pending (not yet applied/dismissed) suggestions
  const pendingCount = suggestions.filter(
    (s) => s.status === 'pending' && !appliedIds.has(s.id)
  ).length;

  // Don't render if no pending changes
  if (pendingCount === 0) {
    return null;
  }

  // Calculate aggregate confidence
  const avgConfidence =
    suggestions
      .filter((s) => s.status === 'pending' && !appliedIds.has(s.id))
      .reduce((sum, s) => sum + s.confidence, 0) / pendingCount;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-2.5',
        'bg-primary/5 border-t border-primary/20',
        'sticky bottom-0 z-10',
        className
      )}
    >
      {/* Left: Status indicator */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="relative">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
        </div>
        <span className="text-sm font-medium">
          {pendingCount} pending {pendingCount === 1 ? 'change' : 'changes'}
        </span>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          ({Math.round(avgConfidence * 100)}% avg confidence)
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismissAll}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Dismiss All
        </Button>
        <Button
          size="sm"
          onClick={onApplyAll}
          className="h-7 px-3 text-xs"
        >
          <Check className="w-3.5 h-3.5 mr-1" />
          Apply All
        </Button>
      </div>
    </div>
  );
}

/**
 * Compact version for smaller sidebars
 */
export function CompactPendingChangesBar({
  suggestions,
  appliedIds,
  onApplyAll,
  onDismissAll,
  className,
}: PendingChangesBarProps) {
  const pendingCount = suggestions.filter(
    (s) => s.status === 'pending' && !appliedIds.has(s.id)
  ).length;

  if (pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 px-3 py-2',
        'bg-primary/10 border-t border-primary/20',
        className
      )}
    >
      <span className="text-xs font-medium text-primary">
        {pendingCount} pending
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={onDismissAll}
          className="p-1 rounded hover:bg-muted transition-colors"
          title="Dismiss All"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={onApplyAll}
          className="p-1 rounded hover:bg-primary/20 transition-colors"
          title="Apply All"
        >
          <Check className="w-3.5 h-3.5 text-primary" />
        </button>
      </div>
    </div>
  );
}

export default PendingChangesBar;
