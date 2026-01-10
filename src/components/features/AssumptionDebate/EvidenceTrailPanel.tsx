/**
 * EvidenceTrailPanel - Displays the history of assumption debates and decisions
 * Shows how values have been challenged and adjusted over time
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  History,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Trash2,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getEvidenceTrail,
  clearEvidenceTrail,
  type DebateResult,
} from '@/core/services/debate-prompts';

// ============================================================================
// Types
// ============================================================================

interface EvidenceTrailPanelProps {
  className?: string;
  filterAssumption?: string;
}

// ============================================================================
// Helper Components
// ============================================================================

function DebateHistoryItem({ debate }: { debate: DebateResult }) {
  const positionIcon = {
    bull: <TrendingUp className="h-4 w-4 text-green-500" />,
    bear: <TrendingDown className="h-4 w-4 text-red-500" />,
    original: <History className="h-4 w-4 text-blue-500" />,
    custom: <ArrowRight className="h-4 w-4 text-purple-500" />,
  };

  const positionColor = {
    bull: 'text-green-600 bg-green-50 dark:bg-green-950',
    bear: 'text-red-600 bg-red-50 dark:bg-red-950',
    original: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
    custom: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
  };

  const decision = debate.userDecision;
  const timestamp = new Date(debate.timestamp).toLocaleString();

  return (
    <AccordionItem value={debate.timestamp} className="border rounded-lg mb-2">
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex items-center gap-3 w-full">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm truncate flex-1 text-left">
            {debate.assumption.assumptionLabel}
          </span>
          {decision && (
            <Badge
              variant="outline"
              className={cn('text-xs', positionColor[decision.selectedPosition])}
            >
              {positionIcon[decision.selectedPosition]}
              <span className="ml-1 capitalize">{decision.selectedPosition}</span>
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-4">
          {/* Original Value */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Original:</span>
            <span className="font-medium">
              {debate.assumption.currentValue} {debate.assumption.unit}
            </span>
            {decision?.newValue !== undefined && (
              <>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-primary">
                  {decision.newValue} {debate.assumption.unit}
                </span>
              </>
            )}
          </div>

          {/* Bull Arguments */}
          {debate.bullCase.arguments.length > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-green-600 mb-2">
                <TrendingUp className="h-4 w-4" />
                Bull Case Arguments
              </div>
              <ul className="text-sm space-y-1">
                {debate.bullCase.arguments.map((arg, i) => (
                  <li key={i} className="text-muted-foreground">
                    • {arg}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bear Arguments */}
          {debate.bearCase.arguments.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-red-600 mb-2">
                <TrendingDown className="h-4 w-4" />
                Bear Case Arguments
              </div>
              <ul className="text-sm space-y-1">
                {debate.bearCase.arguments.map((arg, i) => (
                  <li key={i} className="text-muted-foreground">
                    • {arg}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* User Reasoning */}
          {decision?.reasoning && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">Your Reasoning:</div>
              <p className="text-sm text-muted-foreground">{decision.reasoning}</p>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EvidenceTrailPanel({ className, filterAssumption }: EvidenceTrailPanelProps) {
  const [trail, setTrail] = React.useState<DebateResult[]>([]);

  // Load trail on mount
  React.useEffect(() => {
    setTrail(getEvidenceTrail());
  }, []);

  // Filter trail if filterAssumption is provided
  const filteredTrail = useMemo(() => {
    if (!filterAssumption) return trail;
    return trail.filter((d) => d.assumption.assumptionLabel === filterAssumption);
  }, [trail, filterAssumption]);

  // Handle clear
  const handleClear = () => {
    clearEvidenceTrail();
    setTrail([]);
  };

  if (filteredTrail.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <History className="h-12 w-12 text-muted-foreground opacity-50" />
          <div className="text-center">
            <h3 className="font-medium">No Evidence Trail</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Challenge assumptions to build your evidence trail
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-5 w-5" />
            Evidence Trail
            <Badge variant="secondary" className="ml-2">
              {filteredTrail.length} debate{filteredTrail.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[400px]">
          <Accordion type="single" collapsible className="w-full">
            {filteredTrail
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((debate) => (
                <DebateHistoryItem key={debate.timestamp} debate={debate} />
              ))}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default EvidenceTrailPanel;
