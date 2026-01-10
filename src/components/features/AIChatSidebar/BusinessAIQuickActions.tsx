/**
 * BusinessAIQuickActions - Quick action buttons for business case AI assistant
 * Similar to MarketAIQuickActions but tailored for business case analysis
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Package,
  Scissors,
  Calculator,
  Crosshair,
  Landmark,
  Percent,
  Wallet,
  Activity,
  SlidersHorizontal,
  ShieldAlert,
  Rocket,
  CheckCircle,
  Zap,
  Users,
  Presentation,
} from 'lucide-react';
import {
  BUSINESS_QUICK_ACTIONS,
  type BusinessQuickActionPrompt,
} from '@/core/services/business-ai-context';

// ============================================================================
// Types
// ============================================================================

interface BusinessAIQuickActionsProps {
  onSelectAction: (action: BusinessQuickActionPrompt) => void;
  className?: string;
}

// ============================================================================
// Icon Mapping
// ============================================================================

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'dollar-sign': DollarSign,
  'trending-up': TrendingUp,
  'bar-chart': BarChart3,
  'pie-chart': PieChart,
  'package': Package,
  'scissors': Scissors,
  'calculator': Calculator,
  'crosshair': Crosshair,
  'landmark': Landmark,
  'percent': Percent,
  'wallet': Wallet,
  'activity': Activity,
  'sliders': SlidersHorizontal,
  'shield-alert': ShieldAlert,
  'rocket': Rocket,
  'check-circle': CheckCircle,
  'zap': Zap,
  'users': Users,
  'presentation': Presentation,
};

// ============================================================================
// Category Labels
// ============================================================================

const CATEGORY_LABELS: Record<BusinessQuickActionPrompt['category'], string> = {
  revenue: 'Revenue',
  costs: 'Costs',
  investment: 'Investment',
  analysis: 'Analysis',
  validation: 'Validation',
};

const CATEGORY_ORDER: BusinessQuickActionPrompt['category'][] = [
  'revenue',
  'costs',
  'investment',
  'analysis',
  'validation',
];

// ============================================================================
// Quick Action Button
// ============================================================================

interface QuickActionButtonProps {
  action: BusinessQuickActionPrompt;
  onClick: () => void;
}

function QuickActionButton({ action, onClick }: QuickActionButtonProps) {
  const IconComponent = ICON_MAP[action.icon] || DollarSign;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 gap-1.5 whitespace-nowrap shrink-0"
            onClick={onClick}
          >
            <IconComponent className="h-3.5 w-3.5" />
            <span className="text-xs">{action.label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <p className="text-xs">{action.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// Inline Quick Actions (horizontal scroll)
// ============================================================================

interface InlineBusinessQuickActionsProps {
  onSelectAction: (action: BusinessQuickActionPrompt) => void;
  className?: string;
}

export function InlineBusinessQuickActions({
  onSelectAction,
  className,
}: InlineBusinessQuickActionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<BusinessQuickActionPrompt['category']>('revenue');

  const filteredActions = BUSINESS_QUICK_ACTIONS.filter(
    action => action.category === selectedCategory
  );

  return (
    <div className={cn('space-y-2', className)}>
      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {CATEGORY_ORDER.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs shrink-0"
            onClick={() => setSelectedCategory(category)}
          >
            {CATEGORY_LABELS[category]}
          </Button>
        ))}
      </div>

      {/* Actions for selected category */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {filteredActions.map(action => (
            <QuickActionButton
              key={action.id}
              action={action}
              onClick={() => onSelectAction(action)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// Grid Quick Actions (for empty state)
// ============================================================================

export function BusinessAIQuickActions({
  onSelectAction,
  className,
}: BusinessAIQuickActionsProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {CATEGORY_ORDER.map(category => {
        const actions = BUSINESS_QUICK_ACTIONS.filter(a => a.category === category);
        if (actions.length === 0) return null;

        return (
          <div key={category} className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {CATEGORY_LABELS[category]}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {actions.slice(0, 4).map(action => {
                const IconComponent = ICON_MAP[action.icon] || DollarSign;
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    className="h-auto py-2 px-3 justify-start gap-2 text-left"
                    onClick={() => onSelectAction(action)}
                  >
                    <IconComponent className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-xs truncate">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BusinessAIQuickActions;
