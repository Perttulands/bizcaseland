/**
 * AssumptionDebateDialog - AI-powered bull/bear case analysis for assumptions
 * Presents both optimistic and pessimistic perspectives to help users make informed decisions
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  Check,
  Sparkles,
  History,
  AlertCircle,
  ArrowRight,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiService } from '@/core/services/ai-service';
import {
  buildDebateSystemPrompt,
  buildDebateUserPrompt,
  parseDebateResponse,
  saveDebateToTrail,
  type DebateContext,
  type DebateCase,
  type DebateResult,
} from '@/core/services/debate-prompts';

// ============================================================================
// Types
// ============================================================================

interface AssumptionDebateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assumption: {
    label: string;
    value: number | string;
    unit: string;
    rationale: string;
    category: string;
    dataPath?: string;
  } | null;
  onValueUpdate?: (newValue: number | string, reasoning: string) => void;
}

type DebateState = 'idle' | 'loading' | 'ready' | 'error';
type SelectedPosition = 'bull' | 'bear' | 'original' | 'custom' | null;

// ============================================================================
// Component
// ============================================================================

export function AssumptionDebateDialog({
  open,
  onOpenChange,
  assumption,
  onValueUpdate,
}: AssumptionDebateDialogProps) {
  const [debateState, setDebateState] = useState<DebateState>('idle');
  const [bullCase, setBullCase] = useState<DebateCase | null>(null);
  const [bearCase, setBearCase] = useState<DebateCase | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<SelectedPosition>(null);
  const [customValue, setCustomValue] = useState<string>('');
  const [reasoning, setReasoning] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setDebateState('idle');
      setBullCase(null);
      setBearCase(null);
      setSelectedPosition(null);
      setCustomValue('');
      setReasoning('');
      setError(null);
    }
  }, [open]);

  // Start the debate analysis
  const startDebate = useCallback(async () => {
    if (!assumption) return;

    setDebateState('loading');
    setError(null);

    const context: DebateContext = {
      assumptionLabel: assumption.label,
      currentValue: assumption.value,
      unit: assumption.unit,
      rationale: assumption.rationale,
      category: assumption.category,
    };

    try {
      const systemPrompt = buildDebateSystemPrompt(context);
      const userPrompt = buildDebateUserPrompt(context);

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userPrompt },
      ];

      const response = await aiService.chat(messages, {
        temperature: 0.7,
        maxTokens: 2048,
      });

      const parsed = parseDebateResponse(response.content);

      if (parsed) {
        setBullCase(parsed.bullCase);
        setBearCase(parsed.bearCase);
        setDebateState('ready');
      } else {
        // Try to extract arguments from plain text response
        setBullCase({
          position: 'bull',
          arguments: ['AI provided analysis but in unexpected format. Please review manually.'],
          confidence: 'medium',
        });
        setBearCase({
          position: 'bear',
          arguments: ['AI provided analysis but in unexpected format. Please review manually.'],
          confidence: 'medium',
        });
        setDebateState('ready');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze assumption');
      setDebateState('error');
    }
  }, [assumption]);

  // Apply the selected position
  const applyDecision = useCallback(() => {
    if (!assumption || !selectedPosition) return;

    let newValue: number | string = assumption.value;
    let decisionReasoning = reasoning;

    if (selectedPosition === 'bull' && bullCase?.suggestedValue !== undefined) {
      newValue = bullCase.suggestedValue;
      decisionReasoning = decisionReasoning || `Adopted bullish perspective based on AI analysis`;
    } else if (selectedPosition === 'bear' && bearCase?.suggestedValue !== undefined) {
      newValue = bearCase.suggestedValue;
      decisionReasoning = decisionReasoning || `Adopted bearish perspective based on AI analysis`;
    } else if (selectedPosition === 'custom' && customValue) {
      newValue = parseFloat(customValue) || customValue;
      decisionReasoning = decisionReasoning || `Custom value based on debate analysis`;
    }

    // Save to evidence trail
    const result: DebateResult = {
      assumption: {
        assumptionLabel: assumption.label,
        currentValue: assumption.value,
        unit: assumption.unit,
        rationale: assumption.rationale,
        category: assumption.category,
      },
      bullCase: bullCase || { position: 'bull', arguments: [], confidence: 'medium' },
      bearCase: bearCase || { position: 'bear', arguments: [], confidence: 'medium' },
      timestamp: new Date().toISOString(),
      userDecision: {
        selectedPosition,
        newValue: selectedPosition === 'original' ? undefined : newValue,
        reasoning: decisionReasoning,
      },
    };
    saveDebateToTrail(result);

    // Call the update callback if value changed
    if (selectedPosition !== 'original' && onValueUpdate) {
      onValueUpdate(newValue, decisionReasoning);
    }

    onOpenChange(false);
  }, [assumption, selectedPosition, customValue, reasoning, bullCase, bearCase, onValueUpdate, onOpenChange]);

  if (!assumption) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Challenge Assumption
          </DialogTitle>
          <DialogDescription>
            AI analyzes both bullish and bearish perspectives to help you make an informed decision.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full max-h-[60vh]">
            {/* Current Assumption Display */}
            <Card className="mb-4">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Current Assumption
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-medium">{assumption.label}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Value:</span>
                    <span className="ml-2 font-medium">
                      {assumption.value} {assumption.unit}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Rationale:</span>
                    <span className="ml-2">{assumption.rationale}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Start Analysis Button */}
            {debateState === 'idle' && (
              <div className="flex justify-center py-8">
                <Button onClick={startDebate} size="lg" className="gap-2">
                  <Sparkles className="h-5 w-5" />
                  Analyze with AI
                </Button>
              </div>
            )}

            {/* Loading State */}
            {debateState === 'loading' && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  Analyzing assumption from multiple perspectives...
                </p>
              </div>
            )}

            {/* Error State */}
            {debateState === 'error' && (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-destructive">{error}</p>
                <Button onClick={startDebate} variant="outline">
                  Try Again
                </Button>
              </div>
            )}

            {/* Debate Results */}
            {debateState === 'ready' && bullCase && bearCase && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Bull Case */}
                  <Card
                    className={cn(
                      'cursor-pointer transition-all border-2',
                      selectedPosition === 'bull'
                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                        : 'border-transparent hover:border-green-200'
                    )}
                    onClick={() => setSelectedPosition('bull')}
                  >
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        Bull Case (Optimistic)
                        <Badge variant="outline" className="ml-auto text-xs">
                          {bullCase.confidence} confidence
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <ul className="space-y-2 text-sm">
                        {bullCase.arguments.map((arg, i) => (
                          <li key={i} className="flex gap-2">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{arg}</span>
                          </li>
                        ))}
                      </ul>
                      {bullCase.suggestedValue !== undefined && (
                        <div className="mt-4 p-2 bg-green-100 dark:bg-green-900 rounded text-sm">
                          <span className="text-muted-foreground">Suggested value:</span>
                          <span className="ml-2 font-medium text-green-700 dark:text-green-300">
                            {bullCase.suggestedValue} {assumption.unit}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Bear Case */}
                  <Card
                    className={cn(
                      'cursor-pointer transition-all border-2',
                      selectedPosition === 'bear'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950'
                        : 'border-transparent hover:border-red-200'
                    )}
                    onClick={() => setSelectedPosition('bear')}
                  >
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                        <TrendingDown className="h-4 w-4" />
                        Bear Case (Pessimistic)
                        <Badge variant="outline" className="ml-auto text-xs">
                          {bearCase.confidence} confidence
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <ul className="space-y-2 text-sm">
                        {bearCase.arguments.map((arg, i) => (
                          <li key={i} className="flex gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <span>{arg}</span>
                          </li>
                        ))}
                      </ul>
                      {bearCase.suggestedValue !== undefined && (
                        <div className="mt-4 p-2 bg-red-100 dark:bg-red-900 rounded text-sm">
                          <span className="text-muted-foreground">Suggested value:</span>
                          <span className="ml-2 font-medium text-red-700 dark:text-red-300">
                            {bearCase.suggestedValue} {assumption.unit}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Options */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Keep Original */}
                  <Card
                    className={cn(
                      'cursor-pointer transition-all border-2',
                      selectedPosition === 'original'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-transparent hover:border-blue-200'
                    )}
                    onClick={() => setSelectedPosition('original')}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Keep Original Value</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Maintain {assumption.value} {assumption.unit}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Custom Value */}
                  <Card
                    className={cn(
                      'cursor-pointer transition-all border-2',
                      selectedPosition === 'custom'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                        : 'border-transparent hover:border-purple-200'
                    )}
                    onClick={() => setSelectedPosition('custom')}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowRight className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">Enter Custom Value</span>
                      </div>
                      <Input
                        type="number"
                        placeholder={`Enter value in ${assumption.unit}`}
                        value={customValue}
                        onChange={(e) => {
                          setCustomValue(e.target.value);
                          setSelectedPosition('custom');
                        }}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Reasoning Input */}
                {selectedPosition && (
                  <Card className="mt-4">
                    <CardContent className="py-4">
                      <label className="text-sm font-medium mb-2 block">
                        Your reasoning (optional):
                      </label>
                      <Textarea
                        placeholder="Explain why you chose this value..."
                        value={reasoning}
                        onChange={(e) => setReasoning(e.target.value)}
                        rows={2}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {debateState === 'ready' && (
            <Button onClick={applyDecision} disabled={!selectedPosition}>
              Apply Decision
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AssumptionDebateDialog;
