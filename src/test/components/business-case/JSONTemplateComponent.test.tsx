import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JSONTemplateComponent } from '@/modules/business-case/components/JSONTemplateComponent';

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

describe('JSONTemplateComponent', () => {
  let originalClipboard: Clipboard;

  beforeAll(() => {
    // Store original clipboard
    originalClipboard = navigator.clipboard;
    
    // Mock clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });
  });

  afterAll(() => {
    // Restore original clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
  });

  beforeEach(() => {
    mockToast.mockClear();
    vi.mocked(navigator.clipboard.writeText).mockClear();
  });

  it('renders copy template button', () => {
    render(<JSONTemplateComponent />);
    
    const copyButton = screen.getByRole('button', { name: /copy template/i });
    expect(copyButton).toBeInTheDocument();
    expect(copyButton).toHaveTextContent('Copy Template');
  });

  it('shows success feedback after clicking', async () => {
    render(<JSONTemplateComponent />);
    
    const copyButton = screen.getByRole('button', { name: /copy template/i });
    
    // Simulate click without userEvent to avoid conflicts
    await copyButton.click();
    
    // Wait for success state to appear
    await waitFor(() => {
      expect(screen.getByText('🎉 Copied!')).toBeInTheDocument();
    });
    
    // Verify toast notification was called with success message
    expect(mockToast).toHaveBeenCalledWith({
      title: "🚀 Template Copied Successfully!",
      description: "Business case template is ready! Use it with AI to create compelling financial analysis.",
      variant: "default",
      duration: 4000,
    });
  });

  it('applies correct styling for success state', async () => {
    render(<JSONTemplateComponent />);
    
    const copyButton = screen.getByRole('button', { name: /copy template/i });
    await copyButton.click();
    
    await waitFor(() => {
      expect(copyButton).toHaveClass('bg-green-50');
    });
  });
});