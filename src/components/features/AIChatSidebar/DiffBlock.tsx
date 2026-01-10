/**
 * DiffBlock - Inline diff visualization component
 * Shows before/after changes with Apply/Dismiss buttons
 * Agent-style chat component for displaying data change suggestions
 */

import React from 'react';
import { Check, X, FileEdit, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { AISuggestion } from '@/core/types/ai';
import { computeValueDiff, formatPath, formatPathLeaf, type DiffLine } from '@/core/utils/diff-utils';

// ============================================================================
// Types
// ============================================================================

interface DiffBlockProps {
  suggestion: AISuggestion;
  onApply: () => void;
  onDismiss: () => void;
  isApplied?: boolean;
  className?: string;
}

// ============================================================================
// Confidence Bar
// ============================================================================

interface ConfidenceBarProps {
  confidence: number;
  className?: string;
}

function ConfidenceBar({ confidence, className }: ConfidenceBarProps) {
  const percent = Math.round(confidence * 100);
  const segments = 10;
  const filled = Math.round(confidence * segments);

  const getColor = () => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-1.5', className)}>
            <div className="flex gap-0.5">
              {Array.from({ length: segments }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1.5 h-3 rounded-sm',
                    i < filled ? getColor() : 'bg-muted-foreground/20'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {percent}%
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">AI Confidence: {percent}%</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// Diff Line Component
// ============================================================================

interface DiffLineRowProps {
  line: DiffLine;
}

function DiffLineRow({ line }: DiffLineRowProps) {
  const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';

  return (
    <div
      className={cn(
        'px-3 py-0.5 font-mono text-xs leading-relaxed',
        line.type === 'add' && 'bg-green-500/10 text-green-700 dark:text-green-400',
        line.type === 'remove' && 'bg-red-500/10 text-red-700 dark:text-red-400',
        line.type === 'context' && 'text-muted-foreground'
      )}
    >
      <span className="select-none opacity-50 mr-2">{prefix}</span>
      <span className={cn(line.type === 'remove' && 'line-through opacity-70')}>
        {line.content}
      </span>
    </div>
  );
}

// ============================================================================
// Applied Badge
// ============================================================================

function AppliedBadge() {
  return (
    <Badge variant="outline\" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30">
      <Check className="w-3 h-3 mr-1" />
      Applied
    </Badge>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DiffBlock({
  suggestion,
  onApply,
  onDismiss,
  isApplied = false,
  className,
}: DiffBlockProps) {
  const diff = computeValueDiff(suggestion.currentValue, suggestion.suggestedValue);

  // If applied, show collapsed state
  if (isApplied) {
    return (
      <div className={cn('my-2 px-3 py-2 bg-green-500/5 rounded-md border border-green-500/20', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <code className="text-xs text-muted-foreground">{formatPathLeaf(suggestion.path)}</code>
          </div>
          <AppliedBadge />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'my-3 rounded-md border overflow-hidden bg-card',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b">
        <FileEdit className="w-3.5 h-3.5 text-primary" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <code className="text-xs text-muted-foreground truncate max-w-[200px]">
                {formatPathLeaf(suggestion.path)}
              </code>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs font-mono">{formatPath(suggestion.path)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {!diff.hasChanges && (
          <Badge variant="secondary" className="text-[10px] ml-auto">
            No changes
          </Badge>
        )}
      </div>

      {/* Diff Lines */}
      <div className="py-1 bg-background">
        {diff.lines.map((line, i) => (
          <DiffLineRow key={i} line={line} />
        ))}
      </div>

      {/* Rationale (if provided) */}
      {suggestion.rationale && (
        <div className="px-3 py-2 border-t bg-muted/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {suggestion.rationale}
            </p>
          </div>
        </div>
      )}

      {/* Footer with confidence and actions */}
      <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/50">
        <ConfidenceBar confidence={suggestion.confidence} />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={onDismiss}
          >
            <X className="w-3 h-3 mr-1" />
            Dismiss
          </Button>
          <Button
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={onApply}
          >
            <Check className="w-3 h-3 mr-1" />
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Compact Diff Block (for multiple changes summary)
// ============================================================================

interface CompactDiffBlockProps {
  suggestion: AISuggestion;
  onApply: () => void;
  onDismiss: () => void;
  isApplied?: boolean;
}

export function CompactDiffBlock({
  suggestion,
  onApply,
  onDismiss,
  isApplied = false,
}: CompactDiffBlockProps) {
  const diff = computeValueDiff(suggestion.currentValue, suggestion.suggestedValue);
  const percent = Math.round(suggestion.confidence * 100);

  if (isApplied) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 bg-green-500/5 rounded text-xs">
        <Check className="w-3 h-3 text-green-600" />
        <code className="text-muted-foreground">{formatPathLeaf(suggestion.path)}</code>
        <span className="text-green-600 ml-auto">Applied</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/30 rounded text-xs group">
      <FileEdit className="w-3 h-3 text-primary" />
      <code className="text-muted-foreground truncate flex-1">
        {formatPathLeaf(suggestion.path)}
      </code>
      <span className="text-muted-foreground tabular-nums">{percent}%</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={onDismiss}>
          <X className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={onApply}>
          <Check className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default DiffBlock;
