/**
 * ChatInput - Terminal-style input for agent chat
 * Features a › prompt prefix and minimal styling like VS Code/Cursor
 */

import React, { useCallback, useState } from 'react';
import { Send, Square, Loader2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

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
      // Reset height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
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
      className={cn(
        'flex items-end gap-2 p-3 border-t bg-muted/30',
        className
      )}
    >
      {/* Terminal prompt prefix */}
      <div className="flex-shrink-0 flex items-center self-start pt-2.5">
        <ChevronRight className="w-4 h-4 text-primary" />
      </div>

      {/* Input area */}
      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={1}
          className={cn(
            'w-full resize-none bg-transparent border-none',
            'text-sm leading-relaxed',
            'focus:outline-none focus:ring-0',
            'placeholder:text-muted-foreground/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-[24px] max-h-[120px] py-2'
          )}
        />
      </div>

      {/* Send/Cancel button */}
      <Button
        type="submit"
        size="sm"
        disabled={disabled || (!isLoading && !input.trim())}
        variant={isLoading ? 'destructive' : 'ghost'}
        className={cn(
          'flex-shrink-0 h-8 px-2',
          !isLoading && 'hover:bg-primary/10'
        )}
      >
        {isLoading ? (
          onCancel ? (
            <>
              <Square className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Stop</span>
            </>
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )
        ) : (
          <>
            <Send className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Send</span>
          </>
        )}
      </Button>
    </form>
  );
}

export default ChatInput;
