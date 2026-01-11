/**
 * AgentMessageBlock - Agent-style message rendering
 * Full-width blocks replacing chat bubbles, with support for
 * tool calls, thinking blocks, and inline diffs
 */

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  User,
  ChevronRight,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Search,
  Database,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage, AISuggestion } from '@/core/types/ai';
import { DiffBlock } from './DiffBlock';

// ============================================================================
// Types
// ============================================================================

export type MessageBlockType =
  | 'text'
  | 'tool_call'
  | 'tool_result'
  | 'suggestion'
  | 'thinking'
  | 'error';

export interface MessageBlock {
  type: MessageBlockType;
  content: string;
  metadata?: Record<string, unknown>;
}

interface AgentMessageBlockProps {
  message: ChatMessage;
  suggestions?: readonly AISuggestion[];
  onApplySuggestion?: (id: string) => void;
  onDismissSuggestion?: (id: string) => void;
  appliedSuggestionIds?: Set<string>;
  isStreaming?: boolean;
  className?: string;
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Message header with role and timestamp
 */
interface MessageHeaderProps {
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  tokenCount?: number;
}

function MessageHeader({ role, timestamp, tokenCount }: MessageHeaderProps) {
  const isUser = role === 'user';
  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs text-muted-foreground">
        {isUser ? '▸ You' : '▸ Agent'}
      </span>
      <span className="text-xs text-muted-foreground/60">{time}</span>
      {tokenCount !== undefined && tokenCount > 0 && (
        <span className="text-xs text-muted-foreground/40 ml-auto">
          {tokenCount} tokens
        </span>
      )}
    </div>
  );
}

/**
 * Tool call indicator block
 */
interface ToolCallBlockProps {
  tool: string;
  status: 'running' | 'done' | 'error';
  result?: string;
}

export function ToolCallBlock({ tool, status, result }: ToolCallBlockProps) {
  const [expanded, setExpanded] = useState(false);

  const getIcon = () => {
    if (tool.includes('search') || tool.includes('web')) {
      return <Search className="w-3.5 h-3.5" />;
    }
    if (tool.includes('data') || tool.includes('read')) {
      return <Database className="w-3.5 h-3.5" />;
    }
    return <Sparkles className="w-3.5 h-3.5" />;
  };

  return (
    <div className="my-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-xs w-full text-left',
          'bg-muted/50 hover:bg-muted transition-colors',
          status === 'error' && 'bg-red-500/10'
        )}
      >
        {status === 'running' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
        ) : status === 'error' ? (
          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        )}
        {getIcon()}
        <span className="text-muted-foreground">
          {status === 'running' ? 'Running' : status === 'error' ? 'Failed' : 'Completed'}:
        </span>
        <code className="text-foreground">{tool}</code>
        {result && (
          <span className="ml-auto">
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </span>
        )}
      </button>
      {expanded && result && (
        <div className="mt-1 ml-4 pl-3 border-l-2 border-muted text-xs text-muted-foreground font-mono whitespace-pre-wrap">
          {result}
        </div>
      )}
    </div>
  );
}

/**
 * Thinking/reasoning block (collapsible)
 */
interface ThinkingBlockProps {
  content: string;
  defaultExpanded?: boolean;
}

export function ThinkingBlock({ content, defaultExpanded = false }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="my-2 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <span className="italic">Thinking...</span>
      </button>
      {expanded && (
        <div className="mt-2 ml-4 pl-3 border-l-2 border-muted text-muted-foreground leading-relaxed">
          {content}
        </div>
      )}
    </div>
  );
}

/**
 * Error block
 */
interface ErrorBlockProps {
  message: string;
}

export function ErrorBlock({ message }: ErrorBlockProps) {
  return (
    <div className="my-2 px-3 py-2 bg-red-500/10 rounded-md border border-red-500/20">
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Error</span>
      </div>
      <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">{message}</p>
    </div>
  );
}

/**
 * Streaming cursor
 */
function StreamingCursor() {
  return (
    <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-0.5" />
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AgentMessageBlock({
  message,
  suggestions = [],
  onApplySuggestion,
  onDismissSuggestion,
  appliedSuggestionIds = new Set(),
  isStreaming = false,
  className,
}: AgentMessageBlockProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Get suggestions associated with this message
  const messageSuggestions = message.suggestions || suggestions;

  return (
    <div className={cn('border-b border-border/50 py-4 px-4', className)}>
      <MessageHeader
        role={message.role}
        timestamp={message.timestamp}
        tokenCount={message.tokenCount}
      />

      {/* Message content */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {/* Main text content */}
        {message.content && (
          <div className="text-sm leading-relaxed">
            <ReactMarkdown
              components={{
                // Style links
                a: ({ node, ...props }) => (
                  <a {...props} className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer" />
                ),
                // Ensure code blocks are styled
                code: ({ node, className, children, ...props }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="px-1 py-0.5 bg-muted rounded text-xs font-mono" {...props}>{children}</code>
                  ) : (
                    <code className={className} {...props}>{children}</code>
                  );
                },
                // Style pre blocks
                pre: ({ node, ...props }) => (
                  <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs" {...props} />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
            {isStreaming && <StreamingCursor />}
          </div>
        )}

        {/* Empty streaming state */}
        {!message.content && isStreaming && (
          <div className="text-sm text-muted-foreground">
            <StreamingCursor />
          </div>
        )}
      </div>

      {/* Inline diff blocks for suggestions */}
      {isAssistant && messageSuggestions.length > 0 && (
        <div className="mt-3">
          {messageSuggestions.map((suggestion) => (
            <DiffBlock
              key={suggestion.id}
              suggestion={suggestion}
              isApplied={appliedSuggestionIds.has(suggestion.id)}
              onApply={() => onApplySuggestion?.(suggestion.id)}
              onDismiss={() => onDismissSuggestion?.(suggestion.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Message List
// ============================================================================

interface AgentMessageListProps {
  messages: ChatMessage[];
  suggestions?: readonly AISuggestion[];
  onApplySuggestion?: (id: string) => void;
  onDismissSuggestion?: (id: string) => void;
  appliedSuggestionIds?: Set<string>;
  isStreaming?: boolean;
  className?: string;
}

export function AgentMessageList({
  messages,
  suggestions = [],
  onApplySuggestion,
  onDismissSuggestion,
  appliedSuggestionIds = new Set(),
  isStreaming = false,
  className,
}: AgentMessageListProps) {
  // No auto-scrolling - user has full control of scroll position

  if (messages.length === 0) {
    return (
      <div className={cn('flex-1 flex items-center justify-center p-6', className)}>
        <div className="text-center text-muted-foreground">
          <Bot className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Start a conversation</p>
          <p className="text-xs mt-1 opacity-70">
            The agent can analyze and suggest changes to your data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {messages.map((message, index) => (
        <AgentMessageBlock
          key={message.id}
          message={message}
          suggestions={index === messages.length - 1 ? suggestions : []}
          onApplySuggestion={onApplySuggestion}
          onDismissSuggestion={onDismissSuggestion}
          appliedSuggestionIds={appliedSuggestionIds}
          isStreaming={
            isStreaming && index === messages.length - 1 && message.role === 'assistant'
          }
        />
      ))}
    </div>
  );
}

export default AgentMessageBlock;
