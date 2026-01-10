import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { parseValue, formatEditValue, validateValue, isEditableUnit } from '@/core/engine';

interface EditableValueCellProps {
  value: any;
  unit: string;
  dataPath: string | null;
  formatValue: (value: any, unit: string) => string;
  onUpdate: (path: string, value: any) => void;
  onValueChanged?: (path: string) => void;
}

export function EditableValueCell({
  value,
  unit,
  dataPath,
  formatValue,
  onUpdate,
  onValueChanged
}: EditableValueCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const editable = dataPath !== null && isEditableUnit(unit);

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
      
      // Notify parent that value was changed
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
    // Generate helpful placeholder based on unit
    const isPercentage = unit.includes('percentage') || unit.includes('ratio') || unit.includes('pct');
    let placeholder = 'Enter value';
    if (isPercentage) {
      placeholder = 'e.g., 10 for 10%';
    } else if (unit.includes('EUR') || unit.includes('USD')) {
      placeholder = 'Enter amount';
    }

    return (
      <div className="relative">
        <div className="relative flex items-center">
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={cn(
              'h-8 text-sm font-mono',
              error && 'border-red-500 focus-visible:ring-red-500',
              isPercentage && 'pr-8'
            )}
            type="text"
          />
          {isPercentage && (
            <span className="absolute right-2 text-xs text-muted-foreground pointer-events-none">
              %
            </span>
          )}
        </div>
        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-500 whitespace-nowrap z-10">
            {error}
          </div>
        )}
        {isPercentage && !error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-muted-foreground whitespace-nowrap z-10">
            Enter as whole number (10 = 10%)
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'px-2 py-1 rounded transition-all',
        editable && 'cursor-text hover:bg-muted/30 hover:ring-1 hover:ring-muted-foreground/20'
      )}
    >
      <span className="font-mono text-sm font-medium">
        {formatValue(value, unit)}
      </span>
    </div>
  );
}
