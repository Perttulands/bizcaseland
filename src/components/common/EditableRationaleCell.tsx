/**
 * Editable Rationale Cell Component
 * Reusable component for inline editing of rationale text
 */

import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface EditableRationaleCellProps {
  value: string;
  dataPath: string | null;
  onUpdate: (path: string, value: string) => void;
  needsUpdate?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  rows?: number;
}

export function EditableRationaleCell({
  value,
  dataPath,
  onUpdate,
  needsUpdate = false,
  placeholder = 'No rationale provided',
  className,
  disabled = false,
  rows = 2,
}: EditableRationaleCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const editable = dataPath !== null && !disabled;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!editable) return;
    setIsEditing(true);
    setEditValue(value || '');
  };

  const handleSave = () => {
    if (!dataPath) return;

    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== value) {
      onUpdate(dataPath, trimmedValue);
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
    // Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (isEditing) {
        handleSave();
      }
    }, 100);
  };

  if (isEditing) {
    return (
      <Textarea
        ref={textareaRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn('min-h-[60px] text-sm resize-none', className)}
        rows={rows}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'px-2 py-1 rounded transition-all max-w-md',
        editable && 'cursor-text hover:bg-muted/30 hover:ring-1 hover:ring-muted-foreground/20',
        needsUpdate && 'text-red-600 dark:text-red-400 font-medium',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      title={editable ? 'Click to edit (Ctrl+Enter to save)' : undefined}
    >
      <div className={cn('truncate text-sm', needsUpdate && 'italic')}>
        {value || placeholder}
        {needsUpdate && ' (update needed)'}
      </div>
    </div>
  );
}
