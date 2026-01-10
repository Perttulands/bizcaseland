/**
 * SuggestionApprovalPanel - UI for reviewing and accepting/rejecting AI suggestions
 * Displays pending suggestions with rationale, confidence scores, and action buttons
 */

import React from 'react';
import { Check, X, ChevronDown, ChevronUp, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { AISuggestion } from '@/core/types/ai';

// ============================================================================
// Types
// ============================================================================

interface SuggestionApprovalPanelProps {
  suggestions: readonly AISuggestion[];
  onAccept: (suggestionId: string) => void;
  onReject: (suggestionId: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  className?: string;
}

interface SuggestionCardProps {
  suggestion: AISuggestion;
  onAccept: () => void;
  onReject: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatPath(path: string): string {
  return path
    .split('.')
    .map(part => part.replace(/_/g, ' '))
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' → ');
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'Not set';
  if (typeof value === 'number') {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toLocaleString();
  }
  if (typeof value === 'object') {
    // Handle ValueWithRationale objects
    const obj = value as Record<string, unknown>;
    if ('value' in obj) return formatValue(obj.value);
    return JSON.stringify(value);
  }
  return String(value);
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-500/20 text-green-700 dark:text-green-400';
  if (confidence >= 0.6) return 'bg-amber-500/20 text-amber-700 dark:text-amber-400';
  return 'bg-red-500/20 text-red-700 dark:text-red-400';
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.6) return 'Medium';
  return 'Low';
}

// ============================================================================
// Suggestion Card Component
// ============================================================================

function SuggestionCard({ suggestion, onAccept, onReject }: SuggestionCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg bg-card overflow-hidden">
        {/* Header */}
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium truncate">
                {formatPath(suggestion.path)}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge 
                variant="secondary" 
                className={cn('text-xs', getConfidenceColor(suggestion.confidence))}
              >
                {getConfidenceLabel(suggestion.confidence)} ({Math.round(suggestion.confidence * 100)}%)
              </Badge>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t">
            {/* Value Comparison */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Current</span>
                <div className="text-sm font-mono bg-muted/50 rounded px-2 py-1">
                  {formatValue(suggestion.currentValue)}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-primary">Suggested</span>
                <div className="text-sm font-mono bg-primary/10 rounded px-2 py-1 text-primary">
                  {formatValue(suggestion.suggestedValue)}
                </div>
              </div>
            </div>

            {/* Rationale */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Rationale</span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {suggestion.rationale}
              </p>
            </div>

            {/* Research References */}
            {suggestion.researchRefs.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  Sources ({suggestion.researchRefs.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {suggestion.researchRefs.map((ref, i) => (
                    <Badge key={ref} variant="outline" className="text-xs">
                      Source {i + 1}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="default"
                className="flex-1 gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept();
                }}
              >
                <Check className="h-3.5 w-3.5" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onReject();
                }}
              >
                <X className="h-3.5 w-3.5" />
                Reject
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SuggestionApprovalPanel({
  suggestions,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
  className,
}: SuggestionApprovalPanelProps) {
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  if (pendingSuggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn('border-t bg-muted/30', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {pendingSuggestions.length} Pending Suggestion{pendingSuggestions.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-xs gap-1"
                  onClick={onAcceptAll}
                >
                  <Check className="h-3 w-3" />
                  All
                </Button>
              </TooltipTrigger>
              <TooltipContent>Accept all suggestions</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-xs gap-1"
                  onClick={onRejectAll}
                >
                  <X className="h-3 w-3" />
                  All
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reject all suggestions</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Suggestions List */}
      <ScrollArea className="max-h-[300px]">
        <div className="p-3 space-y-2">
          {pendingSuggestions.map(suggestion => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={() => onAccept(suggestion.id)}
              onReject={() => onReject(suggestion.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default SuggestionApprovalPanel;
