/**
 * AICopilotSidebar - Main AI chat sidebar component
 * Resizable panel for desktop, Sheet for mobile
 * Supports context-aware prompts for market analysis
 * Includes Assumption Debate Mode for challenging assumptions
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Bot, MessageSquare, Settings, Trash2, X, Sparkles, Scale, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAI } from '@/core/contexts/AIContext';
import { useMarketData, useDebate } from '@/core/contexts';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChatMessageList } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { InlineQuickActions } from './MarketAIQuickActions';
import { buildMarketSystemPrompt, type QuickActionPrompt } from '@/core/services/market-ai-context';
import { WebSearchPanel } from './WebSearchPanel';
import { DebatePanel } from './DebatePanel';
import { EvidenceTrailPanel } from './EvidenceTrailPanel';

// ============================================================================
// Types
// ============================================================================

type SidebarMode = 'chat' | 'debate' | 'evidence';

interface AICopilotSidebarProps {
  className?: string;
  showMarketContext?: boolean;
}

// ============================================================================
// Mobile breakpoint hook
// ============================================================================

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

// ============================================================================
// Sidebar Header
// ============================================================================

interface SidebarHeaderProps {
  onClose?: () => void;
  onClear: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: readonly { id: string; name: string; description: string }[];
  totalTokens: number;
  showMarketBadge?: boolean;
}

function SidebarHeader({
  onClose,
  onClear,
  selectedModel,
  onModelChange,
  availableModels,
  totalTokens,
  showMarketBadge,
}: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-primary" />
        <span className="font-semibold">AI Assistant</span>
        {showMarketBadge && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Market
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground mr-2">
                {totalTokens.toLocaleString()} tokens
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total tokens used this session</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((model) => (
              <SelectItem key={model.id} value={model.id} className="text-xs">
                <span>{model.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear conversation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {onClose && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Mode Tabs Component
// ============================================================================

interface ModeTabsProps {
  mode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
  evidenceCount: number;
  isDebating: boolean;
}

function ModeTabs({ mode, onModeChange, evidenceCount, isDebating }: ModeTabsProps) {
  return (
    <div className="flex border-b">
      <button
        className={cn(
          'flex-1 py-2 px-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
          mode === 'chat'
            ? 'border-b-2 border-primary text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onModeChange('chat')}
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Chat
      </button>
      <button
        className={cn(
          'flex-1 py-2 px-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
          mode === 'debate'
            ? 'border-b-2 border-primary text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onModeChange('debate')}
      >
        <Scale className="w-3.5 h-3.5" />
        Debate
        {isDebating && <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />}
      </button>
      <button
        className={cn(
          'flex-1 py-2 px-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
          mode === 'evidence'
            ? 'border-b-2 border-primary text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onModeChange('evidence')}
      >
        <FileText className="w-3.5 h-3.5" />
        Evidence
        {evidenceCount > 0 && (
          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
            {evidenceCount}
          </Badge>
        )}
      </button>
    </div>
  );
}

// ============================================================================
// Sidebar Content
// ============================================================================

interface SidebarContentProps {
  showMarketContext?: boolean;
}

function SidebarContent({ showMarketContext = false }: SidebarContentProps) {
  const [mode, setMode] = useState<SidebarMode>('chat');

  const {
    state,
    sendMessage,
    sendMessageWithPrompt,
    cancelStream,
    clearMessages,
    setModel,
    setSystemPrompt,
    availableModels,
    setIsOpen,
    contextType
  } = useAI();

  // Get debate state
  const { state: debateState, isDebating } = useDebate();

  // Get market data for context-aware prompts
  const { data: marketData } = useMarketData();

  // Update system prompt when market data changes (for market analysis context)
  useEffect(() => {
    if (showMarketContext && marketData) {
      const marketPrompt = buildMarketSystemPrompt(marketData);
      setSystemPrompt(marketPrompt);
    }
  }, [showMarketContext, marketData, setSystemPrompt]);

  // Handle quick action selection
  const handleQuickAction = useCallback((action: QuickActionPrompt) => {
    // Handle special debate actions
    if (action.id === 'debate-assumption' || action.id === 'debate-market-size' || action.id === 'debate-growth-rate') {
      setMode('debate');
      return;
    }
    if (action.id === 'view-evidence-trail') {
      setMode('evidence');
      return;
    }

    if (marketData) {
      const marketPrompt = buildMarketSystemPrompt(marketData);
      sendMessageWithPrompt(action.prompt, marketPrompt);
    } else {
      sendMessage(action.prompt);
    }
  }, [marketData, sendMessage, sendMessageWithPrompt]);

  const showQuickActions = showMarketContext && state.messages.length === 0 && mode === 'chat';

  return (
    <div className="flex flex-col h-full">
      <SidebarHeader
        onClose={() => setIsOpen(false)}
        onClear={clearMessages}
        selectedModel={state.selectedModel}
        onModelChange={setModel}
        availableModels={availableModels}
        totalTokens={state.totalTokensUsed}
        showMarketBadge={showMarketContext}
      />

      {/* Mode Tabs */}
      <ModeTabs
        mode={mode}
        onModeChange={setMode}
        evidenceCount={debateState.evidenceTrail.length}
        isDebating={isDebating}
      />

      {/* Content based on mode */}
      {mode === 'chat' && (
        <>
          <ScrollArea className="flex-1">
            {showQuickActions ? (
              <div className="p-4 space-y-4">
                <div className="text-center py-6">
                  <Sparkles className="h-12 w-12 mx-auto text-primary/50 mb-3" />
                  <h3 className="font-medium text-lg">Market Analysis AI</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    I can help you analyze markets, identify competitors, and build customer segments.
                  </p>
                </div>
                <InlineQuickActions onSelectAction={handleQuickAction} />
              </div>
            ) : (
              <ChatMessageList messages={state.messages} isStreaming={state.isStreaming} />
            )}
          </ScrollArea>

          {!showQuickActions && showMarketContext && (
            <div className="px-3 pt-2 border-t border-border/50">
              <InlineQuickActions onSelectAction={handleQuickAction} />
            </div>
          )}

          <WebSearchPanel />

          <ChatInput
            onSend={(msg) => {
              if (showMarketContext && marketData) {
                const marketPrompt = buildMarketSystemPrompt(marketData);
                sendMessageWithPrompt(msg, marketPrompt);
              } else {
                sendMessage(msg);
              }
            }}
            onCancel={cancelStream}
            isLoading={state.isStreaming}
            placeholder={showMarketContext ? "Ask about market analysis..." : "Ask about your business case..."}
          />
        </>
      )}

      {mode === 'debate' && (
        <DebatePanel className="flex-1" />
      )}

      {mode === 'evidence' && (
        <EvidenceTrailPanel className="flex-1" />
      )}
    </div>
  );
}

// ============================================================================
// Desktop Sidebar (inline)
// ============================================================================

interface DesktopSidebarProps {
  className?: string;
  showMarketContext?: boolean;
}

function DesktopSidebar({ className, showMarketContext }: DesktopSidebarProps) {
  const { isOpen } = useAI();

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'w-[380px] min-w-[320px] max-w-[500px] border-l bg-background h-full',
        className
      )}
    >
      <SidebarContent showMarketContext={showMarketContext} />
    </div>
  );
}

// ============================================================================
// Mobile Sidebar (Sheet)
// ============================================================================

interface MobileSidebarProps {
  showMarketContext?: boolean;
}

function MobileSidebar({ showMarketContext }: MobileSidebarProps) {
  const { isOpen, setIsOpen } = useAI();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>AI Assistant</SheetTitle>
        </SheetHeader>
        <SidebarContent showMarketContext={showMarketContext} />
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// Toggle Button
// ============================================================================

export function AICopilotToggle({ className }: { className?: string }) {
  const { isOpen, setIsOpen, state } = useAI();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isOpen ? 'default' : 'outline'}
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className={cn('relative', className)}
          >
            <MessageSquare className="h-5 w-5" />
            {state.messages.length > 0 && !isOpen && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AICopilotSidebar({ className, showMarketContext }: AICopilotSidebarProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileSidebar showMarketContext={showMarketContext} />;
  }

  return <DesktopSidebar className={className} showMarketContext={showMarketContext} />;
}

export default AICopilotSidebar;
