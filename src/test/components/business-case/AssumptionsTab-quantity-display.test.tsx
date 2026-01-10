import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { AssumptionsTab } from '@/modules/business-case/components/AssumptionsTab';
import { useBusinessData } from '@/core/contexts';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock the context
vi.mock('@/core/contexts');
const mockUseBusinessData = vi.mocked(useBusinessData);

// Test data with geom_growth pattern structure (like the Ad-Free Content Subscription case)
const mockDataWithGeomGrowthPattern = {
  schema_version: "1.0",
  meta: {
    title: "Ad-Free Content Subscription Business Case",
    description: "Subscription-based service delivering ad-free content",
    business_model: "recurring",
    currency: "EUR",
    periods: 60,
    frequency: "monthly"
  },
  assumptions: {
    pricing: {
      avg_unit_price: { 
        value: 10.0, 
        unit: "EUR_per_unit", 
        rationale: "Monthly subscription fee of €10 per customer" 
      }
    },
    financial: {
      interest_rate: { value: 0.10, unit: "ratio", rationale: "10% discount rate for NPV calculations" }
    },
    customers: {
      churn_pct: { value: 0.02, unit: "ratio_per_month", rationale: "2% monthly churn rate" },
      segments: [
        {
          id: "consumers_b2c",
          label: "Consumer Subscriptions",
          name: "Consumer Subscriptions",
          rationale: "Primary paying customers seeking ad-free browsing",
          volume: {
            type: "pattern",
            pattern_type: "geom_growth",
            series: [
              { 
                period: 1, 
                value: 10000, 
                unit: "accounts", 
                rationale: "Initial base of 10,000 paying customers at launch" 
              }
            ],
            yearly_adjustments: {
              volume_factors: [
                { year: 1, factor: 1.0, rationale: "Year 1 establishes base adoption" },
                { year: 2, factor: 1.5, rationale: "50% YoY growth via referrals and marketing" }
              ]
            }
          }
        }
      ]
    },
    unit_economics: {
      cogs_pct: { value: 0.05, unit: "ratio", rationale: "5% COGS for server costs and payment processing" },
      cac: { value: 50.0, unit: "EUR", rationale: "€50 CAC for online ads and referral incentives" }
    },
    opex: [
      { 
        name: "Sales & Marketing", 
        value: { 
          value: 41666.0, 
          unit: "EUR_per_month", 
          rationale: "€0.5M annual marketing budget" 
        } 
      }
    ],
    growth_settings: {
      geom_growth: {
        start: { value: 10000, unit: "accounts", rationale: "Starting subscriber base" },
        monthly_growth: { 
          value: 0.035, 
          unit: "ratio_per_month", 
          rationale: "3.5% monthly growth (≈50% annual)" 
        }
      }
    }
  },
  drivers: []
} as any;

describe('AssumptionsTab - Quantity Display with Geom Growth Pattern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display customer volume information for geom_growth pattern data', () => {
    mockUseBusinessData.mockReturnValue({
      data: mockDataWithGeomGrowthPattern,
      updateData: vi.fn(),
      updateAssumption: vi.fn(),
      updateDriver: vi.fn(),
      addDriver: vi.fn(),
      removeDriver: vi.fn(),
      updateDriverRange: vi.fn(),
      exportData: vi.fn()
    });

    render(<TooltipProvider><AssumptionsTab /></TooltipProvider>);

    // Check that customer segment volume information is displayed
    expect(screen.getByText(/Consumer Subscriptions - Base Volume/)).toBeInTheDocument();
    
    // These should be present now that the fix is working
    // The test should verify that base volume from series[0].value is shown
    expect(screen.getByText(/Base Volume/)).toBeInTheDocument();
    expect(screen.getAllByText(/10,000/)).toHaveLength(2); // Value and in rationale
    
    // Growth rate should be extracted from growth_settings.geom_growth
    expect(screen.getByText(/Growth Rate/)).toBeInTheDocument();
    expect(screen.getAllByText(/3.5%/).length).toBeGreaterThan(0); // from monthly_growth.value, appears in multiple places
  });

  it('should display growth pattern type for pattern-based volume data', () => {
    mockUseBusinessData.mockReturnValue({
      data: mockDataWithGeomGrowthPattern,
      updateData: vi.fn(),
      updateAssumption: vi.fn(),
      updateDriver: vi.fn(),
      addDriver: vi.fn(),
      removeDriver: vi.fn(),
      updateDriverRange: vi.fn(),
      exportData: vi.fn()
    });

    render(<TooltipProvider><AssumptionsTab /></TooltipProvider>);

    // Should show the pattern type
    expect(screen.getByText(/Growth Pattern/)).toBeInTheDocument();
    expect(screen.getByText(/geom growth/)).toBeInTheDocument();
  });

  it('should handle volume data from growth_settings when not in direct volume object', () => {
    mockUseBusinessData.mockReturnValue({
      data: mockDataWithGeomGrowthPattern,
      updateData: vi.fn(),
      updateAssumption: vi.fn(),
      updateDriver: vi.fn(),
      addDriver: vi.fn(),
      removeDriver: vi.fn(),
      updateDriverRange: vi.fn(),
      exportData: vi.fn()
    });

    render(<TooltipProvider><AssumptionsTab /></TooltipProvider>);

    // Base volume should come from growth_settings.geom_growth.start.value when series is present
    // Should find multiple instances (value and rationale)
    expect(screen.getAllByText(/10,000/)).toHaveLength(2);
    
    // Monthly growth rate should come from growth_settings.geom_growth.monthly_growth.value
    expect(screen.getAllByText(/3.5%/).length).toBeGreaterThan(0);
  });

  it('should display rationale for volume assumptions from series data', () => {
    mockUseBusinessData.mockReturnValue({
      data: mockDataWithGeomGrowthPattern,
      updateData: vi.fn(),
      updateAssumption: vi.fn(),
      updateDriver: vi.fn(),
      addDriver: vi.fn(),
      removeDriver: vi.fn(),
      updateDriverRange: vi.fn(),
      exportData: vi.fn()
    });

    render(<TooltipProvider><AssumptionsTab /></TooltipProvider>);

    // Check that rationale from series[0] is displayed
    expect(screen.getByText(/Initial base of 10,000 paying customers at launch/)).toBeInTheDocument();
  });

  it('should display volume units correctly for pattern-based data', () => {
    mockUseBusinessData.mockReturnValue({
      data: mockDataWithGeomGrowthPattern,
      updateData: vi.fn(),
      updateAssumption: vi.fn(),
      updateDriver: vi.fn(),
      addDriver: vi.fn(),
      removeDriver: vi.fn(),
      updateDriverRange: vi.fn(),
      exportData: vi.fn()
    });

    render(<TooltipProvider><AssumptionsTab /></TooltipProvider>);

    // Check that units are displayed correctly
    expect(screen.getByText(/accounts/)).toBeInTheDocument(); // from series[0].unit
    expect(screen.getAllByText(/ratio/).length).toBeGreaterThan(0); // Multiple ratio badges expected
  });

  it('should maintain backward compatibility with direct volume structure', () => {
    const legacyData = {
      ...mockDataWithGeomGrowthPattern,
      assumptions: {
        ...mockDataWithGeomGrowthPattern.assumptions,
        customers: {
          ...mockDataWithGeomGrowthPattern.assumptions.customers,
          segments: [
            {
              id: "legacy_segment",
              label: "Legacy Segment",
              name: "Legacy Segment",
              volume: {
                base_value: 5000,
                growth_rate: 0.02,
                unit: "units_per_month",
                rationale: "Legacy direct volume structure"
              }
            }
          ]
        }
      }
    } as any;

    mockUseBusinessData.mockReturnValue({
      data: legacyData,
      updateData: vi.fn(),
      updateAssumption: vi.fn(),
      updateDriver: vi.fn(),
      addDriver: vi.fn(),
      removeDriver: vi.fn(),
      updateDriverRange: vi.fn(),
      exportData: vi.fn()
    });

    render(<TooltipProvider><AssumptionsTab /></TooltipProvider>);

    // Should still work with legacy structure - expect multiple matches
    expect(screen.getAllByText(/Legacy Segment/).length).toBeGreaterThan(0);
    expect(screen.getByText(/5,000/)).toBeInTheDocument();
    // Growth rate should be displayed - the value 0.02 should be converted to 2%
    expect(screen.getAllByText(text => text.includes('2') && text.includes('%')).length).toBeGreaterThan(0);
  });
});
