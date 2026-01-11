/**
 * AICopilotSidebar - Main AI chat sidebar component
 * Resizable panel for desktop, Sheet for mobile
 * Supports context-aware prompts for market analysis
 * Includes Assumption Debate Mode for challenging assumptions
 */

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Bot, MessageSquare, Trash2, X, Sparkles, Scale, FileText, History } from 'lucide-react';
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
import { AgentMessageList } from './AgentMessageBlock';
import { PendingChangesBar } from './PendingChangesBar';
import { ChatInput } from './ChatInput';
import { InlineQuickActions } from './MarketAIQuickActions';
import { InlineBusinessQuickActions } from './BusinessAIQuickActions';
import { buildMarketSystemPrompt, type QuickActionPrompt } from '@/core/services/market-ai-context';
import { buildBusinessSystemPrompt, type BusinessQuickActionPrompt } from '@/core/services/business-ai-context';
import { WebSearchPanel } from './WebSearchPanel';
import { DebatePanel } from './DebatePanel';
import { EvidenceTrailPanel } from './EvidenceTrailPanel';
import { ChatHistoryPanel } from './ChatHistoryPanel';
import { APIKeySettings } from './APIKeySettings';
import { useBusinessData } from '@/core/contexts/hooks/useBusinessData';

// ============================================================================
// Types
// ============================================================================

type SidebarMode = 'chat' | 'debate' | 'evidence' | 'history';

interface AICopilotSidebarProps {
  className?: string;
  showMarketContext?: boolean;
  showBusinessContext?: boolean;
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
  estimatedCost: string;
  promptTokens: number;
  completionTokens: number;
  showMarketBadge?: boolean;
}

function SidebarHeader({
  onClose,
  onClear,
  selectedModel,
  onModelChange,
  availableModels,
  totalTokens,
  estimatedCost,
  promptTokens,
  completionTokens,
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
              <div className="flex items-center gap-1.5 mr-2 cursor-default">
                <span className="text-xs text-muted-foreground">
                  {totalTokens.toLocaleString()} tokens
                </span>
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  {estimatedCost}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <div className="space-y-1">
                <p className="font-medium">Token Usage</p>
                <p>Prompt: {promptTokens.toLocaleString()}</p>
                <p>Completion: {completionTokens.toLocaleString()}</p>
                <p>Total: {totalTokens.toLocaleString()}</p>
                <p className="pt-1 border-t">Estimated cost: {estimatedCost}</p>
              </div>
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

        <APIKeySettings />

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
  historyCount: number;
  isDebating: boolean;
}

function ModeTabs({ mode, onModeChange, evidenceCount, historyCount, isDebating }: ModeTabsProps) {
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
      <button
        className={cn(
          'flex-1 py-2 px-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
          mode === 'history'
            ? 'border-b-2 border-primary text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onModeChange('history')}
      >
        <History className="w-3.5 h-3.5" />
        Log
        {historyCount > 0 && (
          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
            {historyCount}
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
  showBusinessContext?: boolean;
}

export function SidebarContent({ showMarketContext = false, showBusinessContext = false }: SidebarContentProps) {
  const [mode, setMode] = useState<SidebarMode>('chat');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
    contextType,
    hasApiKey,
    // Suggestion management
    pendingSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    acceptAllSuggestions,
    rejectAllSuggestions,
    // Token/cost tracking
    tokenUsage,
    // Chat history
    getChatHistory,
    getChatHistoryStats,
    clearChatHistory,
    exportChatHistory,
  } = useAI();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        // Use requestAnimationFrame to ensure smooth scrolling without layout jumps
        requestAnimationFrame(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        });
      }
    }
  }, [state.messages.length, state.messages[state.messages.length - 1]?.content]);

  // Get debate state
  const { state: debateState, isDebating } = useDebate();

  // Get market data for context-aware prompts
  const { data: marketData } = useMarketData();

  // Get business data for context-aware prompts
  const { data: businessData } = useBusinessData();

  // Update system prompt when data changes (for context-aware modes)
  useEffect(() => {
    if (showMarketContext && marketData) {
      const marketPrompt = buildMarketSystemPrompt(marketData);
      setSystemPrompt(marketPrompt);
    } else if (showBusinessContext && businessData) {
      const businessPrompt = buildBusinessSystemPrompt(businessData);
      setSystemPrompt(businessPrompt);
    }
  }, [showMarketContext, showBusinessContext, marketData, businessData, setSystemPrompt]);

  // Handle quick action selection (market)
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

  // Handle quick action selection (business)
  const handleBusinessQuickAction = useCallback((action: BusinessQuickActionPrompt) => {
    if (businessData) {
      const businessPrompt = buildBusinessSystemPrompt(businessData);
      sendMessageWithPrompt(action.prompt, businessPrompt);
    } else {
      sendMessage(action.prompt);
    }
  }, [businessData, sendMessage, sendMessageWithPrompt]);

  // Handle suggestion approval (applies value via DataContext)
  const handleAcceptSuggestion = useCallback((suggestionId: string) => {
    const suggestion = acceptSuggestion(suggestionId);
    if (suggestion) {
      // The actual value application would be done by the parent component
      // via the DataContext's updateBusinessAssumption or updateMarketAssumption
      console.log('Accepted suggestion:', suggestion.path, suggestion.suggestedValue);
    }
  }, [acceptSuggestion]);

  const handleAcceptAll = useCallback(() => {
    const accepted = acceptAllSuggestions();
    console.log('Accepted all suggestions:', accepted.length);
  }, [acceptAllSuggestions]);

  const showQuickActions = showMarketContext && state.messages.length === 0 && mode === 'chat' && hasApiKey;
  const showBusinessQuickActions = showBusinessContext && state.messages.length === 0 && mode === 'chat' && hasApiKey;
  const contextBadge = showMarketContext ? 'Market' : showBusinessContext ? 'Business' : null;

  // Get history stats for badge
  const historyStats = getChatHistoryStats();

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      <SidebarHeader
        onClose={() => setIsOpen(false)}
        onClear={clearMessages}
        selectedModel={state.selectedModel}
        onModelChange={setModel}
        availableModels={availableModels}
        totalTokens={tokenUsage.totalTokens}
        estimatedCost={tokenUsage.estimatedCostFormatted}
        promptTokens={tokenUsage.promptTokens}
        completionTokens={tokenUsage.completionTokens}
        showMarketBadge={!!contextBadge}
      />

      {/* Mode Tabs */}
      <ModeTabs
        mode={mode}
        onModeChange={setMode}
        evidenceCount={debateState.evidenceTrail.length}
        historyCount={historyStats.totalEntries}
        isDebating={isDebating}
      />

      {/* Content based on mode */}
      {mode === 'chat' && (
        <>
          <ScrollArea className="flex-1 overflow-hidden" ref={scrollAreaRef}>
            {!hasApiKey ? (
              <div className="p-4 space-y-4">
                <div className="text-center py-6">
                  <Sparkles className="h-12 w-12 mx-auto text-amber-500/50 mb-3" />
                  <h3 className="font-medium text-lg">API Key Required</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please configure your LiteLLM API key to use AI features.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Click the key icon above to get started.
                  </p>
                </div>
              </div>
            ) : showQuickActions ? (
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
            ) : showBusinessQuickActions ? (
              <div className="p-4 space-y-4">
                <div className="text-center py-6">
                  <Sparkles className="h-12 w-12 mx-auto text-primary/50 mb-3" />
                  <h3 className="font-medium text-lg">Business Case AI</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    I can help you validate assumptions, analyze costs, and stress-test your financial model.
                  </p>
                </div>
                <InlineBusinessQuickActions onSelectAction={handleBusinessQuickAction} />
              </div>
            ) : (
              <AgentMessageList
                messages={state.messages}
                suggestions={pendingSuggestions}
                onApplySuggestion={handleAcceptSuggestion}
                onDismissSuggestion={rejectSuggestion}
                appliedSuggestionIds={new Set()} 
                isStreaming={state.isStreaming}
              />
            )}
          </ScrollArea>

          {!showQuickActions && !showBusinessQuickActions && showMarketContext && (
            <div className="px-3 pt-2 border-t border-border/50">
              <InlineQuickActions onSelectAction={handleQuickAction} />
            </div>
          )}

          {!showQuickActions && !showBusinessQuickActions && showBusinessContext && (
            <div className="px-3 pt-2 border-t border-border/50">
              <InlineBusinessQuickActions onSelectAction={handleBusinessQuickAction} />
            </div>
          )}

          {/* Pending Changes Bar - sticky at bottom */}
          <PendingChangesBar
            suggestions={pendingSuggestions}
            appliedIds={new Set()}
            onApplyAll={handleAcceptAll}
            onDismissAll={rejectAllSuggestions}
          />

          <WebSearchPanel />

          <ChatInput
            onSend={(msg) => {
              if (showMarketContext && marketData) {
                const marketPrompt = buildMarketSystemPrompt(marketData);
                sendMessageWithPrompt(msg, marketPrompt);
              } else if (showBusinessContext && businessData) {
                const businessPrompt = buildBusinessSystemPrompt(businessData);
                sendMessageWithPrompt(msg, businessPrompt);
              } else {
                sendMessage(msg);
              }
            }}
            onCancel={cancelStream}
            isLoading={state.isStreaming}
            disabled={!hasApiKey}
            placeholder={!hasApiKey ? "Configure API key to chat..." : showMarketContext ? "Ask about market analysis..." : showBusinessContext ? "Ask about your business case..." : "Ask a question..."}
          />
        </>
      )}

      {mode === 'debate' && (
        <DebatePanel className="flex-1" />
      )}

      {mode === 'evidence' && (
        <EvidenceTrailPanel className="flex-1" />
      )}

      {mode === 'history' && (
        <ChatHistoryPanel
          history={getChatHistory()}
          stats={historyStats}
          onClear={clearChatHistory}
          onExport={exportChatHistory}
          className="flex-1"
        />
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
  showBusinessContext?: boolean;
}

function DesktopSidebar({ className, showMarketContext, showBusinessContext }: DesktopSidebarProps) {
  const { isOpen } = useAI();

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'w-[380px] min-w-[320px] max-w-[500px] border-l bg-background h-full',
        className
      )}
    >
      <SidebarContent showMarketContext={showMarketContext} showBusinessContext={showBusinessContext} />
    </div>
  );
}

// ============================================================================
// Mobile Sidebar (Sheet)
// ============================================================================

interface MobileSidebarProps {
  showMarketContext?: boolean;
  showBusinessContext?: boolean;
}

function MobileSidebar({ showMarketContext, showBusinessContext }: MobileSidebarProps) {
  const { isOpen, setIsOpen } = useAI();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>AI Assistant</SheetTitle>
        </SheetHeader>
        <SidebarContent showMarketContext={showMarketContext} showBusinessContext={showBusinessContext} />
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

export function AICopilotSidebar({ className, showMarketContext, showBusinessContext }: AICopilotSidebarProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileSidebar showMarketContext={showMarketContext} showBusinessContext={showBusinessContext} />;
  }

  return <DesktopSidebar className={className} showMarketContext={showMarketContext} showBusinessContext={showBusinessContext} />;
}

export default AICopilotSidebar;
