/**
 * MarketAIQuickActions - Quick action buttons for market analysis AI prompts
 * Provides one-click access to common market analysis AI queries
 */

import React from 'react';
import {
  Target,
  Layers,
  PieChart,
  CheckCircle,
  Users,
  Crosshair,
  Grid3X3 as Grid,
  BarChart3 as BarChart,
  User,
  Rocket,
  TrendingUp,
  Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  MARKET_QUICK_ACTIONS,
  getQuickActionsByCategory,
  type QuickActionPrompt
} from '@/core/services/market-ai-context';

// ============================================================================
// Types
// ============================================================================

interface MarketAIQuickActionsProps {
  onSelectAction: (action: QuickActionPrompt) => void;
  className?: string;
  compact?: boolean;
}

// ============================================================================
// Icon Mapping
// ============================================================================

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'target': Target,
  'layers': Layers,
  'pie-chart': PieChart,
  'check-circle': CheckCircle,
  'users': Users,
  'crosshair': Crosshair,
  'grid': Grid,
  'bar-chart': BarChart,
  'user': User,
  'rocket': Rocket,
  'trending-up': TrendingUp,
  'navigation': Navigation,
};

function getIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return ICON_MAP[iconName] || Target;
}

// ============================================================================
// Quick Action Button
// ============================================================================

interface QuickActionButtonProps {
  action: QuickActionPrompt;
  onClick: () => void;
  compact?: boolean;
}

function QuickActionButton({ action, onClick, compact }: QuickActionButtonProps) {
  const Icon = getIcon(action.icon);

  if (compact) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        className="flex items-center gap-2 h-8 text-xs"
        title={action.description}
      >
        <Icon className="h-3 w-3" />
        {action.label}
      </Button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-lg text-left transition-colors',
        'hover:bg-accent/50 border border-transparent hover:border-border',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{action.label}</div>
          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {action.description}
          </div>
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// Category Section
// ============================================================================

interface CategorySectionProps {
  category: QuickActionPrompt['category'];
  actions: QuickActionPrompt[];
  onSelect: (action: QuickActionPrompt) => void;
  compact?: boolean;
}

function CategorySection({ category, actions, onSelect, compact }: CategorySectionProps) {
  const categoryLabels: Record<QuickActionPrompt['category'], string> = {
    sizing: 'Market Sizing',
    competitive: 'Competitive Analysis',
    customer: 'Customer Analysis',
    strategy: 'Strategy',
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <QuickActionButton
            key={action.id}
            action={action}
            onClick={() => onSelect(action)}
            compact
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {actions.map((action) => (
        <QuickActionButton
          key={action.id}
          action={action}
          onClick={() => onSelect(action)}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Main Component - Tabbed View
// ============================================================================

export function MarketAIQuickActions({ onSelectAction, className, compact }: MarketAIQuickActionsProps) {
  const categories: QuickActionPrompt['category'][] = ['sizing', 'competitive', 'customer', 'strategy'];

  const categoryConfig = {
    sizing: { label: 'Sizing', icon: Target },
    competitive: { label: 'Compete', icon: Users },
    customer: { label: 'Customer', icon: User },
    strategy: { label: 'Strategy', icon: Rocket },
  };

  if (compact) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="text-xs font-medium text-muted-foreground">Quick Actions</div>
        <div className="flex flex-wrap gap-2">
          {MARKET_QUICK_ACTIONS.slice(0, 6).map((action) => (
            <QuickActionButton
              key={action.id}
              action={action}
              onClick={() => onSelectAction(action)}
              compact
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      <Tabs defaultValue="sizing" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-9">
          {categories.map((cat) => {
            const config = categoryConfig[cat];
            const Icon = config.icon;
            return (
              <TabsTrigger key={cat} value={cat} className="text-xs px-2">
                <Icon className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{config.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-3">
            <ScrollArea className="h-[200px]">
              <CategorySection
                category={cat}
                actions={getQuickActionsByCategory(cat)}
                onSelect={onSelectAction}
              />
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// ============================================================================
// Inline Quick Actions (for showing above chat input)
// ============================================================================

interface InlineQuickActionsProps {
  onSelectAction: (action: QuickActionPrompt) => void;
  className?: string;
}

export function InlineQuickActions({ onSelectAction, className }: InlineQuickActionsProps) {
  // Show just the most useful quick actions inline
  const primaryActions = MARKET_QUICK_ACTIONS.filter(a =>
    ['suggest-tam', 'identify-competitors', 'suggest-segments', 'entry-strategy'].includes(a.id)
  );

  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto pb-2', className)}>
      <span className="text-xs text-muted-foreground whitespace-nowrap">Try:</span>
      {primaryActions.map((action) => {
        const Icon = getIcon(action.icon);
        return (
          <Button
            key={action.id}
            variant="ghost"
            size="sm"
            onClick={() => onSelectAction(action)}
            className="h-7 px-2 text-xs whitespace-nowrap"
          >
            <Icon className="h-3 w-3 mr-1" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

export default MarketAIQuickActions;
