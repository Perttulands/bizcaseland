/**
 * ChatHistoryPanel - View and export LLM call history
 * Shows all logged LLM calls with full details
 */

import React, { useState, useCallback } from 'react';
import {
  Clock,
  Download,
  Trash2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Copy,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { useToast } from '@/hooks/use-toast';
import type { ChatHistoryEntry, ChatHistoryStats } from '@/core/services/chat-history-service';

// ============================================================================
// Types
// ============================================================================

interface ChatHistoryPanelProps {
  history: ChatHistoryEntry[];
  stats: ChatHistoryStats;
  onClear: () => void;
  onExport: (format: 'json' | 'csv') => string;
  className?: string;
}

// ============================================================================
// History Entry Component
// ============================================================================

interface HistoryEntryProps {
  entry: ChatHistoryEntry;
}

function HistoryEntry({ entry }: HistoryEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copied to clipboard` });
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  }, [toast]);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'w-full text-left p-3 hover:bg-muted/50 transition-colors border-b',
            !entry.success && 'bg-red-500/5'
          )}
        >
          <div className="flex items-start gap-2">
            {/* Status icon */}
            {entry.success ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* User message preview */}
              <p className="text-sm truncate">
                {entry.userMessage.substring(0, 60)}
                {entry.userMessage.length > 60 && '...'}
              </p>

              {/* Meta row */}
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>{formatDate(entry.timestamp)}</span>
                <span>{formatTime(entry.timestamp)}</span>
                <span>·</span>
                <span>{entry.modelName}</span>
                <span>·</span>
                <span>{entry.tokens.total.toLocaleString()} tokens</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {entry.costFormatted}
                </span>
              </div>
            </div>

            {/* Expand icon */}
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="p-3 bg-muted/30 border-b space-y-3">
          {/* Token breakdown */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-background p-2 rounded">
              <span className="text-muted-foreground">Prompt</span>
              <p className="font-medium">{entry.tokens.prompt.toLocaleString()}</p>
            </div>
            <div className="bg-background p-2 rounded">
              <span className="text-muted-foreground">Completion</span>
              <p className="font-medium">{entry.tokens.completion.toLocaleString()}</p>
            </div>
            <div className="bg-background p-2 rounded">
              <span className="text-muted-foreground">Duration</span>
              <p className="font-medium">{(entry.durationMs / 1000).toFixed(1)}s</p>
            </div>
          </div>

          {/* User message */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">User Message</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(entry.userMessage, 'User message')}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <div className="bg-background p-2 rounded text-xs font-mono whitespace-pre-wrap max-h-32 overflow-auto">
              {entry.userMessage}
            </div>
          </div>

          {/* Response */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">
                Response {entry.responseTruncated && '(truncated)'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(entry.response, 'Response')}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <div className="bg-background p-2 rounded text-xs font-mono whitespace-pre-wrap max-h-48 overflow-auto">
              {entry.response || <span className="text-muted-foreground italic">No response</span>}
            </div>
          </div>

          {/* Error (if any) */}
          {entry.error && (
            <div className="bg-red-500/10 p-2 rounded text-xs text-red-600 dark:text-red-400">
              <span className="font-medium">Error:</span> {entry.error}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ChatHistoryPanel({
  history,
  stats,
  onClear,
  onExport,
  className,
}: ChatHistoryPanelProps) {
  const { toast } = useToast();

  const handleExport = useCallback(
    (format: 'json' | 'csv') => {
      const content = onExport(format);
      const blob = new Blob([content], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-history-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: `Exported as ${format.toUpperCase()}` });
    },
    [onExport, toast]
  );

  if (history.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-6 text-center', className)}>
        <Clock className="w-10 h-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No history yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          LLM calls will be logged here
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Stats header */}
      <div className="p-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">{stats.totalEntries}</span> calls ·{' '}
            <span className="font-medium">{stats.totalTokens.toLocaleString()}</span> tokens ·{' '}
            <span className="font-medium text-green-600 dark:text-green-400">
              {stats.totalCostFormatted}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => handleExport('json')}
              title="Export as JSON"
            >
              <FileJson className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => handleExport('csv')}
              title="Export as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-red-500 hover:text-red-600"
                  title="Clear history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {stats.totalEntries} logged LLM calls.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onClear}>Clear All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* History list */}
      <ScrollArea className="flex-1">
        {history.map((entry) => (
          <HistoryEntry key={entry.id} entry={entry} />
        ))}
      </ScrollArea>
    </div>
  );
}

export default ChatHistoryPanel;
