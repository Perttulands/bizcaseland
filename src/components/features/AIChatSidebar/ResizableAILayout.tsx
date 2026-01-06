/**
 * ResizableAILayout - Wrapper component that provides resizable sidebar layout
 * Uses react-resizable-panels for desktop, Sheet for mobile
 */

import React, { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAI } from '@/core/contexts/AIContext';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { SidebarContent } from './AICopilotSidebar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// ============================================================================
// Types
// ============================================================================

interface ResizableAILayoutProps {
  children: React.ReactNode;
  className?: string;
  showMarketContext?: boolean;
  defaultSidebarSize?: number;
  minSidebarSize?: number;
  maxSidebarSize?: number;
  storageKey?: string;
}

// ============================================================================
// Mobile breakpoint hook
// ============================================================================

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

// ============================================================================
// Mobile Sheet Sidebar
// ============================================================================

interface MobileSheetProps {
  showMarketContext?: boolean;
}

function MobileSheet({ showMarketContext }: MobileSheetProps) {
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
// Main Component
// ============================================================================

export function ResizableAILayout({
  children,
  className,
  showMarketContext = false,
  defaultSidebarSize = 25,
  minSidebarSize = 15,
  maxSidebarSize = 40,
  storageKey = 'ai-sidebar-size',
}: ResizableAILayoutProps) {
  const isMobile = useIsMobile();
  const { isOpen } = useAI();

  // Load saved size from localStorage
  const [sidebarSize, setSidebarSize] = useState(() => {
    if (typeof window === 'undefined') return defaultSidebarSize;
    const saved = localStorage.getItem(storageKey);
    return saved ? parseFloat(saved) : defaultSidebarSize;
  });

  // Save size to localStorage when it changes
  const handleResize = useCallback(
    (sizes: number[]) => {
      const newSize = sizes[1];
      if (newSize !== undefined) {
        setSidebarSize(newSize);
        localStorage.setItem(storageKey, newSize.toString());
      }
    },
    [storageKey]
  );

  // Mobile: render sheet overlay
  if (isMobile) {
    return (
      <div className={cn('flex h-screen overflow-hidden', className)}>
        <div className="flex-1 overflow-auto">{children}</div>
        <MobileSheet showMarketContext={showMarketContext} />
      </div>
    );
  }

  // Desktop: render resizable panels
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className={cn('h-screen', className)}
      onLayout={handleResize}
    >
      {/* Main content panel */}
      <ResizablePanel defaultSize={isOpen ? 100 - sidebarSize : 100} minSize={50}>
        <div className="h-full overflow-auto">{children}</div>
      </ResizablePanel>

      {/* Sidebar panel - only render when open */}
      {isOpen && (
        <>
          <ResizableHandle withHandle className="bg-border hover:bg-primary/20 transition-colors" />
          <ResizablePanel
            defaultSize={sidebarSize}
            minSize={minSidebarSize}
            maxSize={maxSidebarSize}
            className="border-l bg-background"
          >
            <SidebarContent showMarketContext={showMarketContext} />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}

export default ResizableAILayout;
