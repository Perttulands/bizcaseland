import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DataProvider, AIProvider } from '@/core/contexts';
import { ThemeProvider } from '@/core/contexts/ThemeProvider';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="test-ui-theme">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <DataProvider>
              <AIProvider>
                {children}
              </AIProvider>
            </DataProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Utility to create isolated providers for specific tests
export const renderWithProviders = (
  ui: ReactElement,
  {
    preloadedState = {},
    // Automatically create a store instance if no store was passed in
    ...renderOptions
  }: {
    preloadedState?: any;
  } & Omit<RenderOptions, 'wrapper'> = {}
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children?: React.ReactNode }) => {
    return (
      <BrowserRouter>
        <ThemeProvider defaultTheme="light" storageKey="test-ui-theme">
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <DataProvider>
                <AIProvider>
                  {children}
                </AIProvider>
              </DataProvider>
            </TooltipProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};

// Mock localStorage for tests
export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {};
  
  const mockStorage = {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });

  return mockStorage;
};

// Mock window.matchMedia for responsive hook tests
export const mockMatchMedia = (matches = false) => {
  const mockMatchMedia = vi.fn().mockImplementation(query => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
  });

  return mockMatchMedia;
};

// Mock URL for file download tests
export const mockURL = () => {
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: vi.fn(() => 'mocked-blob-url'),
  });

  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    value: vi.fn(),
  });
};

// Mock clipboard for copy tests
export const mockClipboard = () => {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
    writable: true,
  });
};
