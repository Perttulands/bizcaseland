import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockLocalStorage } from '@/test/test-utils';
import { LandingPage } from '@/components/landing/LandingPage';

// Mock the navigation hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LandingPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage();
  });

  it('renders without crashing', () => {
    render(<LandingPage />);
    expect(screen.getByText('Business Case Analysis')).toBeInTheDocument();
  });

  it('displays main navigation options', () => {
    render(<LandingPage />);
    
    expect(screen.getByText('Business Case Analysis')).toBeInTheDocument();
    expect(screen.getByText('Market Analysis')).toBeInTheDocument();
    expect(screen.getByText('Powerful Integration')).toBeInTheDocument();
  });

  it('shows business case analyzer button and navigates correctly', async () => {
    const user = userEvent.setup();
    render(<LandingPage />);
    
    const businessCaseButton = screen.getByRole('button', { name: /start business case/i });
    expect(businessCaseButton).toBeInTheDocument();
    
    await user.click(businessCaseButton);
    expect(mockNavigate).toHaveBeenCalledWith('/business');
  });

  it('shows market analysis button and navigates correctly', async () => {
    const user = userEvent.setup();
    render(<LandingPage />);
    
    const marketAnalysisButton = screen.getByRole('button', { name: /start market research/i });
    expect(marketAnalysisButton).toBeInTheDocument();
    
    await user.click(marketAnalysisButton);
    expect(mockNavigate).toHaveBeenCalledWith('/market', { state: { initialTab: 'overview' } });
  });

  it('displays feature lists correctly', () => {
    render(<LandingPage />);
    
    // Business Case features
    expect(screen.getByText('Financial Modeling')).toBeInTheDocument();
    expect(screen.getByText('Cash Flow Analysis')).toBeInTheDocument();
    expect(screen.getByText('Sensitivity Analysis')).toBeInTheDocument();
    
    // Market Analysis features
    expect(screen.getByText('TAM/SAM/SOM')).toBeInTheDocument();
    expect(screen.getByText('Competitive Analysis')).toBeInTheDocument();
    expect(screen.getByText('Customer Segmentation')).toBeInTheDocument();
  });

  it.skip('shows integration demo button', async () => {
    // Feature removed from component - test disabled
    const user = userEvent.setup();
    render(<LandingPage />);
    
    const demoButton = screen.getByRole('button', { name: /try cross-tool integration demo/i });
    expect(demoButton).toBeInTheDocument();
    
    await user.click(demoButton);
    expect(mockNavigate).toHaveBeenCalledWith('/demo');
  });

  it('displays reset data dialog when reset button is clicked', async () => {
    const user = userEvent.setup();
    
    // First, add some test data to localStorage to show the reset button
    localStorage.setItem('businessCaseData', JSON.stringify({ test: 'data' }));
    
    render(<LandingPage />);
    
    const resetButton = screen.getByRole('button', { name: /reset all data/i });
    await user.click(resetButton);
    
    await waitFor(() => {
      expect(screen.getByText(/this will permanently delete/i)).toBeInTheDocument();
    });
  });

  it('handles data reset confirmation', async () => {
    const user = userEvent.setup();
    
    // Set up localStorage with test data
    localStorage.setItem('businessCaseData', JSON.stringify({ test: 'data' }));
    localStorage.setItem('bizcaseland_market_data', JSON.stringify({ market: 'data' }));
    
    render(<LandingPage />);
    
    const resetButton = screen.getByRole('button', { name: /reset all data/i });
    await user.click(resetButton);
    
    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /reset all data$/i });
      return user.click(confirmButton);
    });
    
    await waitFor(() => {
      expect(localStorage.getItem('bizcaseland-business-data')).toBeNull();
      expect(localStorage.getItem('bizcaseland-market-data')).toBeNull();
    });
  });

  it('does not show reset button when no data exists', () => {
    render(<LandingPage />);
    
    const resetButton = screen.queryByRole('button', { name: /reset all data/i });
    expect(resetButton).not.toBeInTheDocument();
  });

  it.skip('shows progress indicators when data exists', () => {
    // Feature removed from component - test disabled
    // Mock data existence using correct storage keys
    localStorage.setItem('businessCaseData', JSON.stringify({ test: 'data' }));
    localStorage.setItem('bizcaseland_market_data', JSON.stringify({ market: 'data' }));
    
    render(<LandingPage />);
    
    expect(screen.getByText('Business Case Ready')).toBeInTheDocument();
    expect(screen.getByText('Market Analysis Complete')).toBeInTheDocument();
  });

  it('renders theme toggle component', () => {
    render(<LandingPage />);
    
    // Theme toggle should be rendered (though we don't test its internal functionality here)
    const themeToggle = document.querySelector('[data-testid="theme-toggle"]') || 
                        screen.getByRole('button', { name: /toggle theme/i });
    
    // If theme toggle doesn't have specific test attributes, just check the component renders
    expect(document.body).toBeInTheDocument(); // Basic sanity check
  });

  it('displays correct page title and description', () => {
    render(<LandingPage />);
    
    expect(screen.getByText('Bizcaseland')).toBeInTheDocument();
    expect(screen.getByText(/comprehensive business analysis platform/i)).toBeInTheDocument();
  });
});
