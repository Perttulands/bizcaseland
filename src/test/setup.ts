import '@testing-library/jest-dom';
import { vi, beforeAll } from 'vitest';

// Mock ResizeObserver for chart components
beforeAll(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock Clipboard API
  const mockClipboard = {
    writeText: vi.fn().mockResolvedValue(undefined),
  };

  Object.defineProperty(navigator, 'clipboard', {
    value: mockClipboard,
    writable: true,
    configurable: true,
  });

  // Mock window.isSecureContext for clipboard tests
  Object.defineProperty(window, 'isSecureContext', {
    value: true,
    writable: true,
    configurable: true,
  });

  // Mock document.execCommand for fallback clipboard tests
  const originalExecCommand = document.execCommand;
  document.execCommand = vi.fn().mockImplementation((command) => {
    if (command === 'copy') {
      return true; // Simulate successful copy
    }
    return originalExecCommand?.call(document, command) || false;
  });

  // Mock document.queryCommandSupported
  document.queryCommandSupported = vi.fn().mockImplementation((command) => {
    if (command === 'copy') {
      return true;
    }
    return false;
  });
});
