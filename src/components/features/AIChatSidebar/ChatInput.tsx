/**
 * ChatInput - Input component for AI chat
 * Handles message input with send button and keyboard shortcuts
 */

import React, { useCallback, useState } from 'react';
import { Send, Square, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// ============================================================================
// Types
// ============================================================================

interface ChatInputProps {
  onSend: (message: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ChatInput({
  onSend,
  onCancel,
  isLoading = false,
  disabled = false,
  placeholder = 'Ask a question...',
  className,
}: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();

      if (isLoading && onCancel) {
        onCancel();
        return;
      }

      const trimmed = input.trim();
      if (!trimmed || disabled) return;

      onSend(trimmed);
      setInput('');
    },
    [input, isLoading, disabled, onSend, onCancel]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex items-end gap-2 p-3 border-t bg-background', className)}
    >
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        rows={1}
        className={cn(
          'min-h-[40px] max-h-[120px] resize-none',
          'focus-visible:ring-1 focus-visible:ring-offset-0'
        )}
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || (!isLoading && !input.trim())}
        variant={isLoading ? 'destructive' : 'default'}
        className="flex-shrink-0 h-10 w-10"
      >
        {isLoading ? (
          onCancel ? (
            <Square className="h-4 w-4" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}

export default ChatInput;
