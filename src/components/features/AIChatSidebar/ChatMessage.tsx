/**
 * ChatMessage - Individual chat message bubble component
 * Renders user and AI messages with appropriate styling
 */

import React from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/core/types/ai';

// ============================================================================
// Types
// ============================================================================

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Format timestamp
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-lg',
        isUser && 'bg-primary/10 ml-6',
        isAssistant && 'bg-muted mr-6'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser && 'bg-primary text-primary-foreground',
          isAssistant && 'bg-secondary text-secondary-foreground'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          <span className="text-xs text-muted-foreground">{time}</span>
          {message.tokenCount !== undefined && message.tokenCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({message.tokenCount} tokens)
            </span>
          )}
        </div>

        <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
          {message.content || (isStreaming && <StreamingCursor />)}
          {isStreaming && message.content && <StreamingCursor />}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Streaming Cursor
// ============================================================================

function StreamingCursor() {
  return (
    <span className="inline-block w-2 h-4 bg-foreground/50 animate-pulse ml-0.5" />
  );
}

// ============================================================================
// Message List Component
// ============================================================================

interface ChatMessageListProps {
  messages: ChatMessageType[];
  isStreaming?: boolean;
  className?: string;
}

export function ChatMessageList({
  messages,
  isStreaming = false,
  className,
}: ChatMessageListProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={cn('flex-1 flex items-center justify-center p-6', className)}>
        <div className="text-center text-muted-foreground">
          <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Start a conversation with the AI assistant</p>
          <p className="text-xs mt-1">
            Ask about business cases, market analysis, or data insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2 p-3', className)}>
      {messages.map((message, index) => (
        <ChatMessage
          key={message.id}
          message={message}
          isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatMessage;
