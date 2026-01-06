/**
 * DebatePanel - Assumption Debate Mode UI
 * Displays bull/bear cases and allows users to make decisions
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebate } from '@/core/contexts/DebateContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { DebateArgument, DebateRound } from '@/core/types/ai';

// ============================================================================
// Types
// ============================================================================

interface DebatePanelProps {
  className?: string;
  onClose?: () => void;
}

// ============================================================================
// Argument Card
// ============================================================================

interface ArgumentCardProps {
  argument: DebateArgument;
  isSelected?: boolean;
  onSelect?: () => void;
}

function ArgumentCard({ argument, isSelected, onSelect }: ArgumentCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isBull = argument.type === 'bull';

  return (
    <div
      className={cn(
        'rounded-lg border-2 transition-all cursor-pointer',
        isBull ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30' : 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30',
        isSelected && (isBull ? 'ring-2 ring-green-500 border-green-500' : 'ring-2 ring-red-500 border-red-500')
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="p-3 flex items-start gap-2">
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            isBull ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
          )}
        >
          {isBull ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('font-semibold text-sm', isBull ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300')}>
              {isBull ? 'Bull Case' : 'Bear Case'}
            </span>
            <Badge variant="outline" className="text-xs">
              {Math.round(argument.confidence * 100)}% confidence
            </Badge>
            {isSelected && (
              <CheckCircle className={cn('w-4 h-4', isBull ? 'text-green-600' : 'text-red-600')} />
            )}
          </div>
          <p className="text-sm font-medium">{argument.headline}</p>
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </div>

      {/* Expanded Content */}
      <Collapsible open={isExpanded}>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3">
            {/* Reasoning */}
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {argument.reasoning}
            </div>

            {/* Evidence */}
            {argument.evidence.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Evidence:</p>
                <ul className="space-y-1">
                  {argument.evidence.map((item, index) => (
                    <li key={index} className="text-xs flex items-start gap-1.5">
                      <span className={cn('mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0', isBull ? 'bg-green-500' : 'bg-red-500')} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================================================
// Active Debate View
// ============================================================================

interface ActiveDebateViewProps {
  debate: DebateRound;
  onResolve: (verdict: 'bull' | 'bear' | 'neutral', reasoning: string, adjustedValue?: unknown) => void;
  onCancel: () => void;
}

function ActiveDebateView({ debate, onResolve, onCancel }: ActiveDebateViewProps) {
  const [selectedVerdict, setSelectedVerdict] = useState<'bull' | 'bear' | 'neutral' | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [adjustedValue, setAdjustedValue] = useState(
    debate.currentValue !== undefined ? String(debate.currentValue) : ''
  );

  const handleSubmit = () => {
    if (!selectedVerdict) return;

    const finalValue = adjustedValue.trim()
      ? isNaN(Number(adjustedValue)) ? adjustedValue : Number(adjustedValue)
      : undefined;

    onResolve(selectedVerdict, reasoning, finalValue);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <span className="font-semibold">Assumption Debate</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Assumption */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Challenging Assumption:</p>
            <p className="text-sm font-medium">{debate.assumption}</p>
            {debate.currentValue !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                Current value: <span className="font-mono">{String(debate.currentValue)}</span>
              </p>
            )}
          </div>

          {/* Arguments */}
          <div className="space-y-3">
            <ArgumentCard
              argument={debate.bullCase}
              isSelected={selectedVerdict === 'bull'}
              onSelect={() => setSelectedVerdict('bull')}
            />
            <ArgumentCard
              argument={debate.bearCase}
              isSelected={selectedVerdict === 'bear'}
              onSelect={() => setSelectedVerdict('bear')}
            />

            {/* Neutral Option */}
            <div
              className={cn(
                'rounded-lg border-2 p-3 cursor-pointer transition-all',
                'border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/30',
                selectedVerdict === 'neutral' && 'ring-2 ring-gray-500 border-gray-500'
              )}
              onClick={() => setSelectedVerdict('neutral')}
            >
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-gray-600" />
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Stay Neutral</span>
                {selectedVerdict === 'neutral' && <CheckCircle className="w-4 h-4 text-gray-600" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Keep the current assumption without changes
              </p>
            </div>
          </div>

          {/* User Input */}
          {selectedVerdict && (
            <div className="space-y-3 pt-2 border-t">
              {/* Value Adjustment */}
              {debate.currentValue !== undefined && selectedVerdict !== 'neutral' && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Adjust Value (optional)
                  </label>
                  <Input
                    type="text"
                    value={adjustedValue}
                    onChange={(e) => setAdjustedValue(e.target.value)}
                    placeholder="Enter new value..."
                    className="text-sm"
                  />
                </div>
              )}

              {/* Reasoning */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Your Reasoning
                </label>
                <Textarea
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  placeholder="Why did you make this choice? This will be saved to your evidence trail..."
                  className="text-sm min-h-[80px]"
                />
              </div>

              {/* Submit */}
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={!selectedVerdict}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Record Decision
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// Generating View
// ============================================================================

function GeneratingView({ assumption }: { assumption?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="font-medium">Generating Bull/Bear Analysis</p>
      {assumption && (
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
          Analyzing: "{assumption}"
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-4">
        The AI is preparing balanced arguments for both sides...
      </p>
    </div>
  );
}

// ============================================================================
// Start Debate View
// ============================================================================

interface StartDebateViewProps {
  onStartDebate: (assumption: string) => void;
}

function StartDebateView({ onStartDebate }: StartDebateViewProps) {
  const [assumption, setAssumption] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assumption.trim()) {
      onStartDebate(assumption.trim());
    }
  };

  const exampleAssumptions = [
    'The market will grow at 15% annually',
    'Customer acquisition cost will remain stable',
    'We can achieve 30% market share in 3 years',
    'Pricing can be increased by 10% without churn',
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <Scale className="w-10 h-10 mx-auto text-primary/50 mb-2" />
        <h3 className="font-medium">Challenge an Assumption</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enter any business assumption and get balanced bull/bear arguments to help you think critically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={assumption}
          onChange={(e) => setAssumption(e.target.value)}
          placeholder="Enter an assumption to debate..."
          className="min-h-[80px]"
        />
        <Button type="submit" className="w-full" disabled={!assumption.trim()}>
          <MessageSquare className="w-4 h-4 mr-2" />
          Start Debate
        </Button>
      </form>

      {/* Example Assumptions */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Try an example:</p>
        <div className="flex flex-wrap gap-1.5">
          {exampleAssumptions.map((example, index) => (
            <Badge
              key={index}
              variant="outline"
              className="cursor-pointer hover:bg-accent text-xs"
              onClick={() => setAssumption(example)}
            >
              {example}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DebatePanel({ className, onClose }: DebatePanelProps) {
  const { state, startDebate, resolveDebate, cancelDebate } = useDebate();

  const handleStartDebate = (assumption: string) => {
    startDebate(assumption);
  };

  // Show generating state
  if (state.isGenerating) {
    return (
      <div className={cn('flex flex-col h-full bg-background', className)}>
        <GeneratingView />
      </div>
    );
  }

  // Show active debate
  if (state.activeDebate) {
    return (
      <div className={cn('flex flex-col h-full bg-background', className)}>
        <ActiveDebateView
          debate={state.activeDebate}
          onResolve={resolveDebate}
          onCancel={cancelDebate}
        />
      </div>
    );
  }

  // Show start view
  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {onClose && (
        <div className="p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <span className="font-semibold">Debate Mode</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <ScrollArea className="flex-1">
        <StartDebateView onStartDebate={handleStartDebate} />
      </ScrollArea>
    </div>
  );
}

export default DebatePanel;
