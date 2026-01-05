/**
 * ResearchDocPanel
 * Expandable panel component for viewing research document backing
 * Shows sources, rationale, and confidence for AI-generated data points
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ResearchDocument, ResearchSource } from '@/core/types/ai';

// ============================================================================
// Types
// ============================================================================

interface ResearchDocPanelProps {
  documents: ResearchDocument[];
  className?: string;
  defaultExpanded?: boolean;
}

interface SingleDocViewProps {
  document: ResearchDocument;
  defaultExpanded?: boolean;
}

interface SourceItemProps {
  source: ResearchSource;
}

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Confidence badge showing AI confidence level
 */
function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);

  let variant: 'default' | 'secondary' | 'destructive' = 'default';
  if (confidence < 0.5) {
    variant = 'destructive';
  } else if (confidence < 0.75) {
    variant = 'secondary';
  }

  return (
    <Badge variant={variant} className="text-xs">
      {percentage}% confidence
    </Badge>
  );
}

/**
 * Individual source item with link
 */
function SourceItem({ source }: SourceItemProps) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline truncate block"
          title={source.title}
        >
          {source.title}
        </a>
        <span className="text-xs text-muted-foreground">
          {source.domain}
        </span>
        {source.snippet && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            "{source.snippet}"
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * Single research document view (expandable)
 */
function SingleDocView({ document, defaultExpanded = false }: SingleDocViewProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  const formattedDate = new Date(document.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center gap-2 p-3 rounded-lg transition-colors',
            'hover:bg-accent/50 text-left',
            isOpen && 'bg-accent/30'
          )}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm font-medium truncate">
            {document.query || 'Research Document'}
          </span>
          <ConfidenceBadge confidence={document.confidence} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-10 pr-3 pb-3 space-y-4">
          {/* Rationale */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Rationale
            </h4>
            <p className="text-sm">{document.rationale}</p>
          </div>

          {/* Sources */}
          {document.sources.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Sources ({document.sources.length})
              </h4>
              <ul className="space-y-2">
                {document.sources.map((source, index) => (
                  <SourceItem key={`${source.url}-${index}`} source={source} />
                ))}
              </ul>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <span>Created: {formattedDate}</span>
            {document.modelId && <span>Model: {document.modelId}</span>}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Panel displaying research documents backing a data point
 * Supports multiple documents with expandable detail views
 */
export function ResearchDocPanel({
  documents,
  className,
  defaultExpanded = false,
}: ResearchDocPanelProps) {
  if (documents.length === 0) {
    return null;
  }

  return (
    <Card className={cn('bg-muted/30', className)}>
      <CardContent className="p-2">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            AI Research Backing ({documents.length})
          </span>
        </div>
        <div className="divide-y divide-border/30">
          {documents.map((doc) => (
            <SingleDocView
              key={doc.id}
              document={doc}
              defaultExpanded={defaultExpanded && documents.length === 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Compact Variant
// ============================================================================

interface ResearchBadgeProps {
  documents: ResearchDocument[];
  onClick?: () => void;
  className?: string;
}

/**
 * Compact badge indicating AI backing with document count
 * Useful for inline display with tooltips or click-to-expand
 */
export function ResearchBadge({
  documents,
  onClick,
  className,
}: ResearchBadgeProps) {
  if (documents.length === 0) {
    return null;
  }

  const avgConfidence = documents.reduce((sum, d) => sum + d.confidence, 0) / documents.length;

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'text-xs font-medium bg-primary/10 text-primary',
        'hover:bg-primary/20 transition-colors',
        className
      )}
      title={`${documents.length} research document(s) - ${Math.round(avgConfidence * 100)}% avg confidence`}
    >
      <Sparkles className="h-3 w-3" />
      <span>AI</span>
    </button>
  );
}

// ============================================================================
// Hook for fetching research docs
// ============================================================================

import { useData } from '@/core/contexts/DataContext';

/**
 * Hook to get research documents by IDs from context
 */
export function useResearchDocuments(researchIds: string[] | undefined): ResearchDocument[] {
  const { getResearchDocuments } = useData();

  if (!researchIds || researchIds.length === 0) {
    return [];
  }

  return getResearchDocuments(researchIds);
}

export default ResearchDocPanel;
