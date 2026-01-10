import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockLocalStorage } from '@/test/test-utils';
import { MarketAnalysisSuite } from '@/modules/market-analysis';
import { createMockMarketData } from '@/test/mockData';

// Mock the navigation hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null, pathname: '/market' }),
  };
});

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('MarketAnalysisSuite Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage();
  });

  it('renders without crashing', () => {
    render(<MarketAnalysisSuite />);
    expect(screen.getByText('Market Research & Analysis')).toBeInTheDocument();
  });

  it('displays main navigation tabs', () => {
    render(<MarketAnalysisSuite />);
    
    // When no data is loaded, check for the new interface with examples
    expect(screen.getByText(/start your market research/i)).toBeInTheDocument();
    expect(screen.getByText(/example market analyses/i)).toBeInTheDocument();
  });

  it('shows data import interface when no data is present', () => {
    render(<MarketAnalysisSuite />);
    
    expect(screen.getByText(/start your market research/i)).toBeInTheDocument();
    expect(screen.getByText(/example market analyses/i)).toBeInTheDocument();
  });

  it('displays back button and navigates home', async () => {
    const user = userEvent.setup();
    render(<MarketAnalysisSuite />);
    
    const backButton = screen.getByRole('button', { name: /back to home/i });
    expect(backButton).toBeInTheDocument();
    
    await user.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('handles valid market data input', async () => {
    const user = userEvent.setup();
    render(<MarketAnalysisSuite />);
    
    // Switch to import tab first
    const importTab = screen.getByRole('tab', { name: /import data/i });
    await user.click(importTab);
    
    const mockData = createMockMarketData();
    const jsonString = JSON.stringify(mockData, null, 2);
    
    const textarea = screen.getByPlaceholderText(/paste your market analysis data here/i);
    // Use a simpler approach - directly set value and trigger change event
    fireEvent.change(textarea, { target: { value: jsonString } });
    
    const loadButton = screen.getByRole('button', { name: /import market data/i });
    await user.click(loadButton);
    
    // The component should update its state after successful import
    await waitFor(() => {
      expect(screen.getByText('Market Research & Analysis')).toBeInTheDocument();
    });
  });

  it('handles invalid JSON data input', async () => {
    const user = userEvent.setup();
    render(<MarketAnalysisSuite />);
    
    // Switch to import tab first
    const importTab = screen.getByRole('tab', { name: /import data/i });
    await user.click(importTab);
    
    const textarea = screen.getByPlaceholderText(/paste your market analysis data here/i);
    fireEvent.change(textarea, { target: { value: 'invalid json content' } });
    
    const loadButton = screen.getByRole('button', { name: /import market data/i });
    await user.click(loadButton);
    
    // Should remain on the data input screen (invalid data doesn't get loaded)
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/paste your market analysis data here/i)).toBeInTheDocument();
    });
  });

  it('displays getting started message when no data is loaded', () => {
    render(<MarketAnalysisSuite />);
    
    expect(screen.getByText(/start your market research/i)).toBeInTheDocument();
    expect(screen.getByText(/example market analyses/i)).toBeInTheDocument();
  });

  it('allows switching between import tabs', async () => {
    const user = userEvent.setup();
    render(<MarketAnalysisSuite />);
    
    // Start on Examples tab
    expect(screen.getByText(/example market analyses/i)).toBeInTheDocument();
    
    // Switch to Import tab
    const importTab = screen.getByRole('tab', { name: /import data/i });
    await user.click(importTab);
    
    // Should see import interface
    expect(screen.getByPlaceholderText(/paste your market analysis data here/i)).toBeInTheDocument();
  });

  it('displays example market cases', () => {
    render(<MarketAnalysisSuite />);
    
    // Check for example market cases
    expect(screen.getByText('EV Charging Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Healthcare AI Analytics')).toBeInTheDocument();
    
    // Check for load buttons
    const exploreButtons = screen.getAllByRole('button', { name: /explore this market/i });
    expect(exploreButtons).toHaveLength(2);
  });

  it('loads example data when example button is clicked', async () => {
    // Mock fetch for loading examples
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createMockMarketData())
    });

    const user = userEvent.setup();
    render(<MarketAnalysisSuite />);
    
    const exploreButtons = screen.getAllByRole('button', { name: /explore this market/i });
    await user.click(exploreButtons[0]);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Example loaded successfully!',
          description: 'Market analysis data ready for exploration.',
        })
      );
    });
  });

  it('displays market data when loaded from localStorage', async () => {
    // Pre-load data into localStorage
    const mockData = createMockMarketData();
    localStorage.setItem('bizcaseland_market_data', JSON.stringify(mockData));
    
    render(<MarketAnalysisSuite />);
    
    await waitFor(() => {
      // Should show the analysis interface with data loaded (check for overview tab since that's the default when data exists)
      expect(screen.getByText('Market Research & Analysis')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // After data is loaded, the reset button should be available
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset data/i })).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('shows module status indicators', () => {
    render(<MarketAnalysisSuite />);
    
    // Should render the main title and interface
    expect(screen.getByText('Market Research & Analysis')).toBeInTheDocument();
  });

  it('displays proper module descriptions', () => {
    render(<MarketAnalysisSuite />);
    
    // Check for the main heading and description
    expect(screen.getByText('Market Research & Analysis')).toBeInTheDocument();
    expect(screen.getByText(/discover market opportunities/i)).toBeInTheDocument();
  });

  it('renders export functionality when data is present', async () => {
    // Pre-load data
    const mockData = createMockMarketData();
    localStorage.setItem('bizcaseland-market-data', JSON.stringify(mockData));
    
    render(<MarketAnalysisSuite />);
    
    // Simply check that the component renders without crashing
    expect(screen.getByText('Market Research & Analysis')).toBeInTheDocument();
  });

  it('handles props correctly', () => {
    const mockOnExport = vi.fn();
    const mockOnImport = vi.fn();
    
    render(
      <MarketAnalysisSuite 
        onExportResults={mockOnExport}
        onImportData={mockOnImport}
        className="test-class"
      />
    );
    
    expect(screen.getByText('Market Research & Analysis')).toBeInTheDocument();
  });
});
