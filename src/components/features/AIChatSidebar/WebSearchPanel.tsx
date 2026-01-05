/**
 * WebSearchPanel - Expandable panel for displaying web search results
 * Shows search results with source citations and trust indicators
 */

import React, { useCallback, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Globe,
  Loader2,
  Search,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  webSearchService,
  TRUSTED_DOMAINS,
  type SearchResult,
  type SearchResponse,
} from '@/core/services/web-search-service';

// ============================================================================
// Types
// ============================================================================

interface WebSearchPanelProps {
  className?: string;
  onResultsFound?: (results: SearchResult[]) => void;
  initialQuery?: string;
}

// ============================================================================
// Search Result Item
// ============================================================================

interface SearchResultItemProps {
  result: SearchResult;
  index: number;
}

function SearchResultItem({ result, index }: SearchResultItemProps) {
  const trustedDomain = TRUSTED_DOMAINS.find(
    (d) => result.domain === d.domain || result.domain.endsWith(`.${d.domain}`)
  );

  return (
    <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-2">
        <span className="text-xs text-muted-foreground font-mono mt-1">
          [{index + 1}]
        </span>
        <div className="flex-1 min-w-0">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            <span className="truncate">{result.title}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>

          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>{result.domain}</span>
            </div>

            {result.isTrusted ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="secondary"
                      className="h-5 gap-1 text-green-600 bg-green-50 dark:bg-green-900/20"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      <span className="text-[10px]">Trusted</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {trustedDomain?.name || result.domain} -{' '}
                      {trustedDomain?.category || 'Verified source'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="h-5 gap-1">
                      <Shield className="h-3 w-3" />
                      <span className="text-[10px]">Unverified</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Source not in trusted allowlist</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {result.publishedDate && (
              <span className="text-[10px] text-muted-foreground">
                {result.publishedDate}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {result.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function WebSearchPanel({
  className,
  onResultsFound,
  initialQuery = '',
}: WebSearchPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEnabled = webSearchService.isSearchEnabled();

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await webSearchService.search(query, {
        count: 10,
        freshness: 'year',
      });
      setResults(response);
      onResultsFound?.(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults(null);
    } finally {
      setIsSearching(false);
    }
  }, [query, isSearching, onResultsFound]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch]
  );

  if (!isEnabled) {
    return null;
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn('border-t', className)}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-3 h-auto"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="text-sm font-medium">Web Research</span>
            {results && (
              <Badge variant="secondary" className="h-5">
                {results.trustedCount}/{results.totalResults} trusted
              </Badge>
            )}
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="p-3 pt-0 space-y-3">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search market data..."
              className="h-9 text-sm"
              disabled={isSearching}
            />
            <Button
              size="sm"
              onClick={handleSearch}
              disabled={!query.trim() || isSearching}
              className="h-9 px-3"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Quick Search Buttons */}
          <div className="flex flex-wrap gap-1">
            {['Market size', 'Industry report', 'Competitors', 'Pricing'].map(
              (term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => setQuery(term)}
                >
                  {term}
                </Button>
              )
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}

          {/* Results */}
          {results && results.results.length > 0 && (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-3">
                {results.results.map((result, idx) => (
                  <SearchResultItem key={result.url} result={result} index={idx} />
                ))}
              </div>
            </ScrollArea>
          )}

          {/* No Results */}
          {results && results.results.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No results found for "{results.query}"
            </div>
          )}

          {/* Trusted Sources Info */}
          {!results && !error && (
            <div className="text-[10px] text-muted-foreground">
              <span className="font-medium">Trusted sources:</span>{' '}
              {TRUSTED_DOMAINS.slice(0, 5)
                .map((d) => d.name)
                .join(', ')}
              , and {TRUSTED_DOMAINS.length - 5} more
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default WebSearchPanel;
