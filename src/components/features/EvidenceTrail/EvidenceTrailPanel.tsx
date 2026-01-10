/**
 * EvidenceTrailPanel Component
 * Full panel UI for viewing the evidence trail of a cell value
 * The core differentiator from Excel - transparent provenance
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  ExternalLink,
  FileText,
  Clock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { EvidenceTrailTree } from './EvidenceTrailTree';
import {
  EvidenceTrail,
  calculateOverallConfidence,
  countSources,
  getAllSources,
  hasAIContent,
} from './types';
import type { ResearchSource } from '@/core/types/ai';

// ============================================================================
// Source List Component
// ============================================================================

interface SourceListProps {
  sources: ResearchSource[];
}

function SourceList({ sources }: SourceListProps) {
  if (sources.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No external sources referenced
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {sources.map((source, index) => (
        <li key={`${source.url}-${index}`} className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <ExternalLink className="h-4 w-4 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sm hover:underline text-primary block truncate"
              title={source.title}
            >
              {source.title}
            </a>
            <span className="text-xs text-muted-foreground">{source.domain}</span>
            {source.snippet && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">
                "{source.snippet}"
              </p>
            )}
            <span className="text-xs text-muted-foreground">
              Accessed: {new Date(source.accessedAt).toLocaleDateString()}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ============================================================================
// Stats Summary Component
// ============================================================================

interface StatsSummaryProps {
  trail: EvidenceTrail;
}

function StatsSummary({ trail }: StatsSummaryProps) {
  const stats = useMemo(() => {
    const confidence = trail.overallConfidence ?? calculateOverallConfidence(trail.root);
    const sourceCount = countSources(trail.root);
    const isAI = trail.aiGenerated || hasAIContent(trail.root);

    return { confidence, sourceCount, isAI };
  }, [trail]);

  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
      <div className="text-center">
        <p className="text-2xl font-bold">{Math.round(stats.confidence * 100)}%</p>
        <p className="text-xs text-muted-foreground">Confidence</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold">{stats.sourceCount}</p>
        <p className="text-xs text-muted-foreground">Sources</p>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          {stats.isAI ? (
            <Badge variant="default" className="text-lg px-3 py-1">
              <Sparkles className="h-4 w-4 mr-1" />
              AI
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Manual
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Origin</p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Panel Component
// ============================================================================

export interface EvidenceTrailPanelProps {
  trail: EvidenceTrail;
  onClose?: () => void;
  className?: string;
}

export function EvidenceTrailPanel({
  trail,
  onClose,
  className,
}: EvidenceTrailPanelProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('tree');

  const sources = useMemo(() => getAllSources(trail.root), [trail.root]);

  const handleCopyPath = async () => {
    await navigator.clipboard.writeText(trail.cellPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format current value
  const displayValue = useMemo(() => {
    if (typeof trail.currentValue === 'number') {
      const formatted = trail.currentValue.toLocaleString('en-US', {
        maximumFractionDigits: 2,
      });
      return trail.unit ? `${formatted} ${trail.unit}` : formatted;
    }
    return String(trail.currentValue);
  }, [trail.currentValue, trail.unit]);

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <CardHeader className="flex-none border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Evidence Trail</CardTitle>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{trail.cellLabel}</span>
              <Badge variant="outline" className="font-mono text-xs">
                {displayValue}
              </Badge>
            </div>
            <button
              onClick={handleCopyPath}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <code className="truncate max-w-[200px]">{trail.cellPath}</code>
            </button>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Stats */}
        <div className="flex-none p-4">
          <StatsSummary trail={trail} />
        </div>

        <Separator />

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="flex-none mx-4 mt-4">
            <TabsTrigger value="tree" className="flex-1 gap-2">
              <GitBranch className="h-4 w-4" />
              Provenance Tree
            </TabsTrigger>
            <TabsTrigger value="sources" className="flex-1 gap-2">
              <ExternalLink className="h-4 w-4" />
              Sources ({sources.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="tree" className="h-full m-0 p-4">
              <ScrollArea className="h-full">
                <EvidenceTrailTree
                  root={trail.root}
                  expandByDefault={false}
                  maxDepth={6}
                />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="sources" className="h-full m-0 p-4">
              <ScrollArea className="h-full">
                <SourceList sources={sources} />
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="flex-none border-t p-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last updated: {new Date(trail.lastUpdated).toLocaleString()}
          </div>
          {trail.aiGenerated && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Generated
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

export default EvidenceTrailPanel;
