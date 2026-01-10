/**
 * Editable Value Cell Component
 * Reusable component for inline editing of numerical values
 */

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { parseValue, formatEditValue, validateValue, isEditableUnit } from '@/core/engine';

export interface EditableValueCellProps {
  value: any;
  unit: string;
  dataPath: string | null;
  formatValue: (value: any, unit: string) => string;
  onUpdate: (path: string, value: any) => void;
  onValueChanged?: (path: string) => void;
  className?: string;
  disabled?: boolean;
}

export function EditableValueCell({
  value,
  unit,
  dataPath,
  formatValue,
  onUpdate,
  onValueChanged,
  className,
  disabled = false,
}: EditableValueCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const editable = dataPath !== null && isEditableUnit(unit) && !disabled;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!editable) return;
    setIsEditing(true);
    setEditValue(formatEditValue(value, unit));
    setError(null);
  };

  const handleSave = () => {
    if (!dataPath) return;

    try {
      const parsedValue = parseValue(editValue, unit);
      const validation = validateValue(parsedValue, unit);

      if (!validation.isValid) {
        setError(validation.error || 'Invalid value');
        return;
      }

      onUpdate(dataPath, parsedValue);
      
      if (onValueChanged) {
        onValueChanged(dataPath);
      }

      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid value');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
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
    const isPercentage = unit.includes('percentage') || unit.includes('ratio') || unit.includes('pct');
    let placeholder = 'Enter value';
    if (isPercentage) {
      placeholder = 'e.g., 10 for 10%';
    } else if (unit.includes('EUR') || unit.includes('USD')) {
      placeholder = 'Enter amount';
    }

    return (
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn('h-8 text-sm', error && 'border-red-500')}
        />
        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-500 whitespace-nowrap">
            {error}
          </div>
        )}
      </div>
    );
  }

  const displayValue = formatValue(value, unit);

  return (
    <div
      onClick={handleClick}
      className={cn(
        'px-2 py-1 rounded text-right transition-all',
        editable && 'cursor-text hover:bg-muted/30 hover:ring-1 hover:ring-primary/20',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      title={editable ? 'Click to edit' : undefined}
    >
      {displayValue}
    </div>
  );
}
