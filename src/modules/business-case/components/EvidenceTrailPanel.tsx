/**
 * Evidence Trail Panel
 * Interactive tree visualization showing the provenance of calculated values
 * Click any metric to see the chain of sources, calculations, and assumptions
 */

import React, { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronRight,
  ChevronDown,
  Calculator,
  FileInput,
  Settings2,
  ExternalLink,
  Sparkles,
  Target,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { useBusinessData } from '@/core/contexts';
import { calculateBusinessMetrics, buildEvidenceTrail, formatEvidenceValue } from '@/core/engine';
import type { EvidenceNode, EvidenceContext } from '@/core/types';

interface EvidenceTrailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  context: EvidenceContext | null;
}

/**
 * Recursive tree node component
 */
function TreeNode({
  node,
  depth = 0,
  currency
}: {
  node: EvidenceNode;
  depth?: number;
  currency?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  const getNodeIcon = () => {
    switch (node.type) {
      case 'calculated':
        return <Calculator className="h-4 w-4 text-financial-primary" />;
      case 'assumption':
        return <Settings2 className="h-4 w-4 text-financial-warning" />;
      case 'input':
        return <FileInput className="h-4 w-4 text-financial-success" />;
      case 'formula':
        return <Target className="h-4 w-4 text-muted-foreground" />;
      case 'driver':
        return <Sparkles className="h-4 w-4 text-financial-info" />;
      case 'external':
        return <ExternalLink className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNodeTypeLabel = () => {
    switch (node.type) {
      case 'calculated':
        return 'Calculated';
      case 'assumption':
        return 'Assumption';
      case 'input':
        return 'Input';
      case 'formula':
        return 'Formula';
      case 'driver':
        return 'Driver';
      case 'external':
        return 'External';
      default:
        return node.type;
    }
  };

  const getNodeTypeColor = () => {
    switch (node.type) {
      case 'calculated':
        return 'bg-financial-primary/10 text-financial-primary border-financial-primary/20';
      case 'assumption':
        return 'bg-financial-warning/10 text-financial-warning border-financial-warning/20';
      case 'input':
        return 'bg-financial-success/10 text-financial-success border-financial-success/20';
      case 'driver':
        return 'bg-financial-info/10 text-financial-info border-financial-info/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="relative">
      {/* Connection line */}
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 border-l-2 border-border"
          style={{ left: `${(depth - 1) * 24 + 11}px` }}
        />
      )}

      <div
        className={`
          relative flex items-start gap-2 py-2 px-2 rounded-lg
          transition-colors hover:bg-muted/50
          ${node.isDriver ? 'ring-1 ring-financial-info/50 bg-financial-info/5' : ''}
        `}
        style={{ marginLeft: `${depth * 24}px` }}
      >
        {/* Expand/collapse button */}
        <button
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
          className={`
            flex-shrink-0 w-5 h-5 flex items-center justify-center
            rounded hover:bg-muted transition-colors
            ${!hasChildren ? 'invisible' : ''}
          `}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Node icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNodeIcon()}
        </div>

        {/* Node content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{node.label}</span>
            <Badge variant="outline" className={`text-xs ${getNodeTypeColor()}`}>
              {getNodeTypeLabel()}
            </Badge>
            {node.isDriver && (
              <Badge variant="outline" className="text-xs bg-financial-info/10 text-financial-info">
                Sensitivity Driver
              </Badge>
            )}
            {node.aiGenerated && (
              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500">
                AI Suggested
              </Badge>
            )}
          </div>

          {/* Value display */}
          {node.value !== undefined && (
            <div className="mt-1 font-mono text-sm text-foreground">
              {formatEvidenceValue(node.value, node.unit, currency)}
            </div>
          )}

          {/* Formula display */}
          {node.formula && (
            <div className="mt-1 text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
              {node.formula}
            </div>
          )}

          {/* Rationale display */}
          {node.rationale && (
            <div className="mt-1 text-xs text-muted-foreground italic">
              {node.rationale}
            </div>
          )}

          {/* External link */}
          {node.link && (
            <a
              href={node.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-xs text-financial-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              View source
            </a>
          )}

          {/* Path display for debugging/transparency */}
          {node.path && (
            <div className="mt-1 text-xs text-muted-foreground/50 font-mono truncate">
              {node.path}
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="relative">
          {node.children.map((child, idx) => (
            <TreeNode
              key={child.id || idx}
              node={child}
              depth={depth + 1}
              currency={currency}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function EvidenceTrailPanel({ isOpen, onClose, context }: EvidenceTrailPanelProps) {
  const { data: businessData } = useBusinessData();
  const [copied, setCopied] = useState(false);

  const evidenceTrail = useMemo(() => {
    if (!businessData || !context) return null;

    const metrics = calculateBusinessMetrics(businessData);
    return buildEvidenceTrail(businessData, metrics.monthlyData, context);
  }, [businessData, context]);

  const handleCopyPath = () => {
    if (context) {
      navigator.clipboard.writeText(context.metricKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!context || !evidenceTrail) {
    return (
      <Sheet open={isOpen} onOpenChange={() => onClose()}>
        <SheetContent side="right" className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>Evidence Trail</SheetTitle>
            <SheetDescription>
              Click on a metric to see its calculation breakdown
            </SheetDescription>
          </SheetHeader>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mr-2" />
            No metric selected
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={() => onClose()}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-financial-primary" />
                  Evidence Trail
                </SheetTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPath}
                  className="h-8"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-financial-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <SheetDescription>
                Tracing the provenance of{' '}
                <span className="font-semibold text-foreground">
                  {context.metricLabel}
                </span>
                {context.month && ` (Month ${context.month})`}
              </SheetDescription>
            </SheetHeader>

            {/* Summary card */}
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Calculated Value</div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatEvidenceValue(context.value, context.currency, context.currency)}
                  </div>
                </div>
                <Calculator className="h-10 w-10 text-financial-primary/30" />
              </div>
            </div>
          </div>

          {/* Tree content */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-1">
              <TreeNode
                node={evidenceTrail.root}
                currency={context.currency}
              />
            </div>
          </ScrollArea>

          {/* Footer legend */}
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="text-xs text-muted-foreground mb-2">Legend</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs bg-financial-primary/10 text-financial-primary">
                <Calculator className="h-3 w-3 mr-1" />
                Calculated
              </Badge>
              <Badge variant="outline" className="text-xs bg-financial-warning/10 text-financial-warning">
                <Settings2 className="h-3 w-3 mr-1" />
                Assumption
              </Badge>
              <Badge variant="outline" className="text-xs bg-financial-success/10 text-financial-success">
                <FileInput className="h-3 w-3 mr-1" />
                Input
              </Badge>
              <Badge variant="outline" className="text-xs bg-financial-info/10 text-financial-info">
                <Sparkles className="h-3 w-3 mr-1" />
                Driver
              </Badge>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default EvidenceTrailPanel;
