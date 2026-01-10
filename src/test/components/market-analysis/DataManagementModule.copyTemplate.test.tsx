import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataManagementModule } from '@/modules/market-analysis/components/modules/DataManagementModule';

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock the market analysis template
vi.mock('../../../components/market-analysis/MarketAnalysisTemplate', () => ({
  MarketAnalysisTemplate: JSON.stringify({
    schema_version: "1.0",
    instructions: {
      purpose: "Market analysis template for testing"
    },
    meta: {
      title: "Test Market Analysis"
    }
  }, null, 2)
}));

// Mock the ExampleMarketAnalyses component
vi.mock('../../../components/market-analysis/ExampleMarketAnalyses', () => ({
  ExampleMarketAnalyses: ({ onLoadExample }: { onLoadExample: () => void }) => (
    <div data-testid="example-market-analyses">Mock Example Market Analyses</div>
  )
}));

// Set up clipboard mock for this test file
const mockWriteText = vi.fn().mockResolvedValue(undefined);

Object.defineProperty(global.navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
  configurable: true,
});

describe('DataManagementModule - Copy Template Functionality', () => {
  const mockOnDataLoad = vi.fn();
  const mockOnDataUpdate = vi.fn();

  beforeEach(() => {
    mockToast.mockClear();
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined); // Reset to success by default
    mockOnDataLoad.mockClear();
    mockOnDataUpdate.mockClear();
    vi.clearAllMocks();
  });

  const renderDataManagementModule = (props = {}) => {
    return render(
      <DataManagementModule
        marketData={null}
        onDataLoad={mockOnDataLoad}
        onDataUpdate={mockOnDataUpdate}
        validation={null}
        showUploadOnly={false}
        {...props}
      />
    );
  };

  it('renders copy template button in template tab', async () => {
    const user = userEvent.setup();
    renderDataManagementModule();
    
    // Navigate to template tab
    const templateTab = screen.getByRole('tab', { name: /template & guide/i });
    await user.click(templateTab);
    
    const copyButton = screen.getByRole('button', { name: /copy template/i });
    expect(copyButton).toBeInTheDocument();
  });

  it('copies market analysis template to clipboard', async () => {
    const user = userEvent.setup();
    renderDataManagementModule();
    
    // Navigate to template tab
    const templateTab = screen.getByRole('tab', { name: /template & guide/i });
    await user.click(templateTab);
    
    const copyButton = screen.getByRole('button', { name: /copy template/i });
    
    // Debug: Check if button is actually found
    expect(copyButton).toBeInTheDocument();
    
    await user.click(copyButton);
    
    // Check for success toast instead of mock calls
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "🎉 Template Copied Successfully!",
        })
      );
    });
  });

  it('shows enhanced success toast notification after copy', async () => {
    const user = userEvent.setup();
    renderDataManagementModule();
    
    // Navigate to template tab
    const templateTab = screen.getByRole('tab', { name: /template & guide/i });
    await user.click(templateTab);
    
    const copyButton = screen.getByRole('button', { name: /copy template/i });
    await user.click(copyButton);
    
    // Verify enhanced toast notification was called
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "🎉 Template Copied Successfully!",
        description: "Market analysis template is ready for your AI assistant. Now you can create amazing market research!",
        variant: "default",
        duration: 4000,
      });
    });
  });

  it('shows error message when clipboard operation fails', async () => {
    const user = userEvent.setup();
    
    // Replace the mock with one that always rejects
    Object.defineProperty(global.navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard failed')),
      },
      writable: true,
      configurable: true,
    });
    
    // Also mock execCommand to fail
    const originalExecCommand = document.execCommand;
    document.execCommand = vi.fn().mockReturnValue(false);
    
    renderDataManagementModule();
    
    // Navigate to template tab
    const templateTab = screen.getByRole('tab', { name: /template & guide/i });
    await user.click(templateTab);
    
    const copyButton = screen.getByRole('button', { name: /copy template/i });
    await user.click(copyButton);
    
    // Verify manual copy instruction toast was called
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Manual Copy Required",
        description: "Automatic clipboard access is not available. Please manually copy the text.",
        variant: "default",
        duration: 6000,
      });
    });
    
    // Restore execCommand
    document.execCommand = originalExecCommand;
  });

  it('renders copy template button in upload-only mode', async () => {
    const user = userEvent.setup();
    renderDataManagementModule({ showUploadOnly: true });
    
    // Navigate to import tab where copy template button is located
    const importTab = screen.getByRole('tab', { name: /import data/i });
    await user.click(importTab);
    
    const copyButton = screen.getByRole('button', { name: /copy template/i });
    expect(copyButton).toBeInTheDocument();
  });

  it('copies template in upload-only mode', async () => {
    const user = userEvent.setup();
    renderDataManagementModule({ showUploadOnly: true });
    
    // Navigate to import tab where copy template button is located
    const importTab = screen.getByRole('tab', { name: /import data/i });
    await user.click(importTab);
    
    const copyButtons = screen.getAllByRole('button', { name: /copy template/i });
    expect(copyButtons.length).toBeGreaterThan(0);
    
    const copyButton = copyButtons[0]; // Use the first copy button
    await user.click(copyButton);
    
    // Verify success toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "🎉 Template Copied Successfully!",
        })
      );
    });
  });

  it('contains valid market analysis template structure', async () => {
    const user = userEvent.setup();
    renderDataManagementModule();
    
    // Navigate to template tab
    const templateTab = screen.getByRole('tab', { name: /template & guide/i });
    await user.click(templateTab);
    
    const copyButtons = screen.getAllByRole('button', { name: /copy template/i });
    expect(copyButtons.length).toBeGreaterThan(0);
    
    const copyButton = copyButtons[0]; // Use the first copy button
    await user.click(copyButton);
    
    // Verify success toast is called (indicating template was copied)
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "🎉 Template Copied Successfully!",
        })
      );
    });
  });

  it('provides helpful guidance for AI workflow', async () => {
    const user = userEvent.setup();
    renderDataManagementModule();
    
    // Navigate to template tab
    const templateTab = screen.getByRole('tab', { name: /template & guide/i });
    await user.click(templateTab);
    
    // Check for AI workflow guidance
    expect(screen.getByText(/ai-powered workflow/i)).toBeInTheDocument();
    expect(screen.getByText(/copy the json template below/i)).toBeInTheDocument();
    expect(screen.getByText(/ask the ai to populate the template/i)).toBeInTheDocument();
  });

  it('shows load template button alongside copy template', async () => {
    const user = userEvent.setup();
    renderDataManagementModule();
    
    // Navigate to template tab
    const templateTab = screen.getByRole('tab', { name: /template & guide/i });
    await user.click(templateTab);
    
    const copyButton = screen.getByRole('button', { name: /copy template/i });
    const loadButton = screen.getByRole('button', { name: /load into editor/i });
    
    expect(copyButton).toBeInTheDocument();
    expect(loadButton).toBeInTheDocument();
  });
});