/**
 * AICopilotSidebar - Main AI chat sidebar component
 * Resizable panel for desktop, Sheet for mobile
 */

import React from 'react';
import { Bot, MessageSquare, Settings, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAI } from '@/core/contexts/AIContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { WebSearchPanel } from './WebSearchPanel';

// ============================================================================
// Types
// ============================================================================

interface AICopilotSidebarProps {
  className?: string;
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
}

function SidebarHeader({
  onClose,
  onClear,
  selectedModel,
  onModelChange,
  availableModels,
  totalTokens,
}: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-primary" />
        <span className="font-semibold">AI Assistant</span>
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
// Sidebar Content
// ============================================================================

function SidebarContent() {
  const { state, sendMessage, cancelStream, clearMessages, setModel, availableModels, setIsOpen } =
    useAI();

  return (
    <div className="flex flex-col h-full">
      <SidebarHeader
        onClose={() => setIsOpen(false)}
        onClear={clearMessages}
        selectedModel={state.selectedModel}
        onModelChange={setModel}
        availableModels={availableModels}
        totalTokens={state.totalTokensUsed}
      />

      <ScrollArea className="flex-1">
        <ChatMessageList messages={state.messages} isStreaming={state.isStreaming} />
      </ScrollArea>

      <WebSearchPanel />

      <ChatInput
        onSend={sendMessage}
        onCancel={cancelStream}
        isLoading={state.isStreaming}
        placeholder="Ask about your business case..."
      />
    </div>
  );
}

// ============================================================================
// Desktop Sidebar (inline)
// ============================================================================

interface DesktopSidebarProps {
  className?: string;
}

function DesktopSidebar({ className }: DesktopSidebarProps) {
  const { isOpen } = useAI();

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'w-[380px] min-w-[320px] max-w-[500px] border-l bg-background h-full',
        className
      )}
    >
      <SidebarContent />
    </div>
  );
}

// ============================================================================
// Mobile Sidebar (Sheet)
// ============================================================================

function MobileSidebar() {
  const { isOpen, setIsOpen } = useAI();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>AI Assistant</SheetTitle>
        </SheetHeader>
        <SidebarContent />
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

export function AICopilotSidebar({ className }: AICopilotSidebarProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileSidebar />;
  }

  return <DesktopSidebar className={className} />;
}

export default AICopilotSidebar;
