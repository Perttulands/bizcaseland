/**
 * EvidenceTrailPanel - Displays history of debate decisions
 * Shows user's reasoning and choices from Assumption Debate Mode
 */

import React from 'react';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Scale,
  Clock,
  ArrowRight,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebate } from '@/core/contexts/DebateContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { EvidenceTrailEntry } from '@/core/types/ai';

// ============================================================================
// Types
// ============================================================================

interface EvidenceTrailPanelProps {
  className?: string;
  onClose?: () => void;
}

// ============================================================================
// Evidence Entry Card
// ============================================================================

interface EvidenceEntryProps {
  entry: EvidenceTrailEntry;
}

function EvidenceEntry({ entry }: EvidenceEntryProps) {
  const verdictConfig = {
    bull: {
      icon: TrendingUp,
      label: 'Chose Bull Case',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    bear: {
      icon: TrendingDown,
      label: 'Chose Bear Case',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
    },
    neutral: {
      icon: Scale,
      label: 'Stayed Neutral',
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-100 dark:bg-gray-900/30',
    },
  };

  const config = verdictConfig[entry.verdict];
  const Icon = config.icon;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="border rounded-lg p-3 space-y-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded', config.bg)}>
            <Icon className={cn('w-3.5 h-3.5', config.color)} />
          </div>
          <div>
            <Badge variant="outline" className={cn('text-xs', config.color)}>
              {config.label}
            </Badge>
          </div>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTimestamp(entry.timestamp)}
        </span>
      </div>

      {/* Assumption */}
      <p className="text-sm font-medium">{entry.assumption}</p>

      {/* Value Change */}
      {entry.originalValue !== undefined && entry.finalValue !== undefined && entry.originalValue !== entry.finalValue && (
        <div className="flex items-center gap-2 text-xs bg-muted/50 rounded p-2">
          <span className="font-mono text-muted-foreground">{String(entry.originalValue)}</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="font-mono font-medium">{String(entry.finalValue)}</span>
        </div>
      )}

      {/* Reasoning */}
      {entry.reasoning && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
          <span className="font-medium">Reasoning: </span>
          {entry.reasoning}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
      <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <h3 className="font-medium text-muted-foreground">No Evidence Yet</h3>
      <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">
        Your debate decisions and reasoning will appear here as you challenge assumptions.
      </p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EvidenceTrailPanel({ className, onClose }: EvidenceTrailPanelProps) {
  const { state, clearEvidenceTrail } = useDebate();

  const sortedEvidence = [...state.evidenceTrail].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Stats
  const bullCount = sortedEvidence.filter((e) => e.verdict === 'bull').length;
  const bearCount = sortedEvidence.filter((e) => e.verdict === 'bear').length;
  const neutralCount = sortedEvidence.filter((e) => e.verdict === 'neutral').length;

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-semibold">Evidence Trail</span>
            <Badge variant="secondary" className="text-xs">
              {sortedEvidence.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {sortedEvidence.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Evidence Trail?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {sortedEvidence.length} recorded decisions. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearEvidenceTrail}>
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        {sortedEvidence.length > 0 && (
          <div className="flex gap-3 mt-2 text-xs">
            <span className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-3 h-3" />
              {bullCount} Bull
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <TrendingDown className="w-3 h-3" />
              {bearCount} Bear
            </span>
            <span className="flex items-center gap-1 text-gray-600">
              <Scale className="w-3 h-3" />
              {neutralCount} Neutral
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {sortedEvidence.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="p-3 space-y-3">
            {sortedEvidence.map((entry) => (
              <EvidenceEntry key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default EvidenceTrailPanel;
