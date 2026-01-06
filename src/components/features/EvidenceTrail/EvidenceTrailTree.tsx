/**
 * EvidenceTrailTree Component
 * Interactive tree visualization of provenance chain for a cell value
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Database,
  Calculator,
  FileText,
  ExternalLink,
  Sparkles,
  Gauge,
  Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ProvenanceNode, ProvenanceNodeType } from './types';

// ============================================================================
// Node Icon Component
// ============================================================================

const nodeIcons: Record<ProvenanceNodeType, typeof Database> = {
  value: Edit3,
  assumption: Gauge,
  calculation: Calculator,
  source: ExternalLink,
  research: Sparkles,
  benchmark: Database,
};

const nodeColors: Record<ProvenanceNodeType, string> = {
  value: 'text-blue-500 bg-blue-500/10',
  assumption: 'text-amber-500 bg-amber-500/10',
  calculation: 'text-green-500 bg-green-500/10',
  source: 'text-purple-500 bg-purple-500/10',
  research: 'text-primary bg-primary/10',
  benchmark: 'text-cyan-500 bg-cyan-500/10',
};

interface NodeIconProps {
  type: ProvenanceNodeType;
  className?: string;
}

function NodeIcon({ type, className }: NodeIconProps) {
  const Icon = nodeIcons[type];
  const colorClass = nodeColors[type];

  return (
    <div className={cn('p-1.5 rounded-md', colorClass, className)}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

// ============================================================================
// Confidence Indicator
// ============================================================================

interface ConfidenceIndicatorProps {
  confidence: number;
  size?: 'sm' | 'md';
}

function ConfidenceIndicator({ confidence, size = 'sm' }: ConfidenceIndicatorProps) {
  const percentage = Math.round(confidence * 100);

  let colorClass = 'bg-green-500';
  if (confidence < 0.5) {
    colorClass = 'bg-red-500';
  } else if (confidence < 0.75) {
    colorClass = 'bg-amber-500';
  }

  const barWidth = size === 'sm' ? 'w-12' : 'w-16';
  const barHeight = size === 'sm' ? 'h-1' : 'h-1.5';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-1.5', size === 'sm' ? 'text-xs' : 'text-sm')}>
            <div className={cn('rounded-full bg-muted overflow-hidden', barWidth, barHeight)}>
              <div
                className={cn('h-full rounded-full transition-all', colorClass)}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-muted-foreground">{percentage}%</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Confidence: {percentage}%</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// Tree Node Component
// ============================================================================

interface TreeNodeProps {
  node: ProvenanceNode;
  depth: number;
  maxDepth?: number;
  isLast?: boolean;
  expandByDefault?: boolean;
}

function TreeNode({
  node,
  depth,
  maxDepth = 5,
  isLast = false,
  expandByDefault = false,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(expandByDefault || depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isMaxDepth = depth >= maxDepth;

  // Format value display
  const displayValue = useMemo(() => {
    if (node.value === undefined) return null;
    if (typeof node.value === 'number') {
      const formatted = node.value.toLocaleString('en-US', {
        maximumFractionDigits: 2,
      });
      return node.unit ? `${formatted} ${node.unit}` : formatted;
    }
    return String(node.value);
  }, [node.value, node.unit]);

  return (
    <div className="relative">
      {/* Connection line */}
      {depth > 0 && (
        <div
          className={cn(
            'absolute left-0 top-0 w-5 border-l-2 border-b-2 border-border rounded-bl-lg',
            isLast ? 'h-5' : 'h-full'
          )}
          style={{ left: '-12px' }}
        />
      )}

      {/* Node content */}
      <div className="group">
        <div
          className={cn(
            'flex items-start gap-2 py-1.5 px-2 rounded-lg transition-colors',
            hasChildren && !isMaxDepth && 'cursor-pointer hover:bg-accent/50',
            node.type === 'research' && 'bg-primary/5'
          )}
          onClick={() => hasChildren && !isMaxDepth && setIsExpanded(!isExpanded)}
        >
          {/* Expand/collapse toggle */}
          {hasChildren && !isMaxDepth ? (
            <button className="p-0.5 hover:bg-accent rounded">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          {/* Node icon */}
          <NodeIcon type={node.type} />

          {/* Node content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{node.label}</span>
              {displayValue && (
                <Badge variant="secondary" className="text-xs font-mono">
                  {displayValue}
                </Badge>
              )}
              {node.type === 'research' && (
                <Badge variant="default" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              )}
            </div>

            {node.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {node.description}
              </p>
            )}

            {node.formula && (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                {node.formula}
              </code>
            )}

            {/* Source link */}
            {node.source && (
              <a
                href={node.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                {node.source.domain}
              </a>
            )}
          </div>

          {/* Confidence indicator */}
          {node.confidence !== undefined && (
            <ConfidenceIndicator confidence={node.confidence} />
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && !isMaxDepth && (
          <div className="ml-6 pl-3 mt-1 relative">
            {/* Vertical connector line */}
            <div className="absolute left-0 top-0 bottom-4 w-px bg-border" />

            {node.children!.map((child, index) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                maxDepth={maxDepth}
                isLast={index === node.children!.length - 1}
                expandByDefault={expandByDefault}
              />
            ))}
          </div>
        )}

        {/* Max depth indicator */}
        {hasChildren && isMaxDepth && (
          <div className="ml-11 text-xs text-muted-foreground py-1">
            + {node.children!.length} more nodes...
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface EvidenceTrailTreeProps {
  root: ProvenanceNode;
  maxDepth?: number;
  expandByDefault?: boolean;
  className?: string;
}

export function EvidenceTrailTree({
  root,
  maxDepth = 5,
  expandByDefault = false,
  className,
}: EvidenceTrailTreeProps) {
  return (
    <div className={cn('py-2', className)}>
      <TreeNode
        node={root}
        depth={0}
        maxDepth={maxDepth}
        expandByDefault={expandByDefault}
      />
    </div>
  );
}

export default EvidenceTrailTree;
