/**
 * EvidenceTrailCell Component
 * Wrapper component that makes any cell clickable to show its evidence trail
 * "Click any cell to see a visual chain of every source, calculation, and assumption"
 */

import React, { useState, useCallback } from 'react';
import { GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EvidenceTrailPanel } from './EvidenceTrailPanel';
import { useEvidenceTrail } from './useEvidenceTrail';
import { hasAIContent } from './types';

// ============================================================================
// Types
// ============================================================================

export interface EvidenceTrailCellProps {
  /** Path to the data in the model (e.g., 'assumptions.pricing.avg_unit_price') */
  dataPath: string;
  /** Human-readable label for the cell */
  label?: string;
  /** The actual cell content to render */
  children: React.ReactNode;
  /** Display mode: 'sheet' opens a side panel, 'popover' shows inline */
  displayMode?: 'sheet' | 'popover';
  /** Additional class names for the wrapper */
  className?: string;
  /** Disable the evidence trail feature */
  disabled?: boolean;
  /** Show a subtle indicator that evidence trail is available */
  showIndicator?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export function EvidenceTrailCell({
  dataPath,
  label,
  children,
  displayMode = 'sheet',
  className,
  disabled = false,
  showIndicator = true,
}: EvidenceTrailCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { trail, isLoading, error } = useEvidenceTrail({ path: dataPath, label });

  const handleOpen = useCallback(() => {
    if (!disabled && trail) {
      setIsOpen(true);
    }
  }, [disabled, trail]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // If disabled or no trail, just render children
  if (disabled || (!trail && !isLoading)) {
    return <>{children}</>;
  }

  const hasAI = trail ? hasAIContent(trail.root) : false;

  // Sheet display mode (side panel)
  if (displayMode === 'sheet') {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onClick={handleOpen}
                className={cn(
                  'relative cursor-pointer group',
                  'hover:ring-2 hover:ring-primary/30 hover:rounded-sm transition-all',
                  className
                )}
              >
                {children}

                {/* Subtle evidence trail indicator */}
                {showIndicator && trail && (
                  <div
                    className={cn(
                      'absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity',
                      'p-0.5 rounded-full',
                      hasAI ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
                    )}
                  >
                    <GitBranch className="h-3 w-3" />
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                Click to view evidence trail
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent className="w-[500px] sm:w-[540px] p-0" side="right">
            {trail && (
              <EvidenceTrailPanel trail={trail} onClose={handleClose} />
            )}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Popover display mode (inline)
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'relative cursor-pointer group',
            'hover:ring-2 hover:ring-primary/30 hover:rounded-sm transition-all',
            className
          )}
        >
          {children}

          {/* Subtle evidence trail indicator */}
          {showIndicator && trail && (
            <div
              className={cn(
                'absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity',
                'p-0.5 rounded-full',
                hasAI ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
              )}
            >
              <GitBranch className="h-3 w-3" />
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-0" align="start">
        {trail && (
          <EvidenceTrailPanel trail={trail} onClose={handleClose} className="max-h-[600px]" />
        )}
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Standalone Evidence Trail Button
// ============================================================================

export interface EvidenceTrailButtonProps {
  dataPath: string;
  label?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
  className?: string;
}

/**
 * Standalone button to open evidence trail for a specific data path
 * Useful when you want explicit control over the trigger
 */
export function EvidenceTrailButton({
  dataPath,
  label,
  variant = 'ghost',
  size = 'sm',
  className,
}: EvidenceTrailButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { trail } = useEvidenceTrail({ path: dataPath, label });

  if (!trail) {
    return null;
  }

  const hasAI = hasAIContent(trail.root);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={() => setIsOpen(true)}
              className={cn(
                'gap-1',
                hasAI && 'text-primary',
                className
              )}
            >
              <GitBranch className="h-4 w-4" />
              {size !== 'icon' && 'Evidence'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View evidence trail for this value</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-[500px] sm:w-[540px] p-0" side="right">
          <EvidenceTrailPanel trail={trail} onClose={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

export default EvidenceTrailCell;
