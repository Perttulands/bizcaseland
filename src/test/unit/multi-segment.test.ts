import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateBusinessMetrics,
  calculateTotalVolumeForMonth,
  calculateSegmentVolumeForMonth,
  generateMonthlyData,
  MonthlyData,
  CalculatedMetrics
} from '@/core/engine/calculators/business-calculator-full';
import { BusinessData } from '@/core/types';

describe('Multi-Segment Customer Support', () => {
  let multiSegmentBusinessData: any; // Using any to bypass strict typing for testing

  beforeEach(() => {
    // Create test data with multiple customer segments based on SaaS platform structure
    multiSegmentBusinessData = {
      schema_version: "1.0",
      meta: {
        title: "Multi-Segment SaaS Platform Test",
        description: "Test case for multiple customer segments",
        business_model: "recurring",
        currency: "EUR",
        periods: 12,
        frequency: "monthly"
      },
      assumptions: {
        pricing: {
          avg_unit_price: { 
            value: 99.0, 
            unit: "EUR_per_month", 
            rationale: "Standard pricing across segments" 
          },
          yearly_adjustments: {
            pricing_factors: [
              { year: 1, factor: 1.0, rationale: "Base year pricing" }
            ],
            price_overrides: []
          }
        },
        financial: {
          interest_rate: { 
            value: 0.12, 
            unit: "ratio", 
            rationale: "12% discount rate" 
          }
        },
        customers: {
          churn_pct: { 
            value: 0.05, 
            unit: "monthly_churn_rate", 
            rationale: "5% monthly churn rate" 
          },
          segments: [
            {
              id: "small_business",
              label: "Small Business (1-50 employees)",
              rationale: "50 new small business customers per month",
              volume: {
                base_value: 50,
                unit: "customers_per_month",
                rationale: "50 new small business customers per month",
                pattern_type: "geometric_growth",
                growth_rate: 0.15,
                growth_rationale: "15% monthly growth through digital marketing"
              }
            },
            {
              id: "medium_business",
              label: "Medium Business (51-200 employees)", 
              rationale: "25 medium business customers monthly",
              volume: {
                base_value: 25,
                unit: "customers_per_month",
                rationale: "25 medium business customers monthly",
                pattern_type: "linear_growth",
                growth_rate: 5,
                growth_rationale: "Linear growth of 5 additional customers per month"
              }
            },
            {
              id: "enterprise",
              label: "Enterprise (200+ employees)",
              rationale: "10 enterprise customers through direct sales",
              volume: {
                base_value: 10,
                unit: "customers_per_month", 
                rationale: "10 enterprise customers through direct sales",
                pattern_type: "seasonal_growth",
                seasonal_pattern: [1.0, 0.8, 1.2, 0.9, 1.1, 1.3, 0.7, 1.0, 1.4, 1.1, 0.6, 1.5],
                growth_rate: 0.08,
                growth_rationale: "8% growth with quarterly sales cycles"
              }
            }
          ]
        },
        unit_economics: {
          cogs_pct: { 
            value: 0.20, 
            unit: "percentage_of_revenue", 
            rationale: "20% COGS" 
          },
          cac: { 
            value: 150.0, 
            unit: "EUR_per_customer", 
            rationale: "Customer acquisition cost" 
          }
        },
        opex: [
          { 
            name: "Sales & Marketing", 
            value: { 
              value: 25000.0, 
              unit: "EUR_per_month", 
              rationale: "Marketing spend" 
            } 
          },
          { 
            name: "R&D", 
            value: { 
              value: 40000.0, 
              unit: "EUR_per_month", 
              rationale: "Development costs" 
            } 
          },
          { 
            name: "G&A", 
            value: { 
              value: 15000.0, 
              unit: "EUR_per_month", 
              rationale: "Administrative overhead" 
            } 
          }
        ],
        capex: []
      }
    };
  });

  describe('Volume Calculations', () => {
    it('should calculate total volume as sum of all segments for month 1', () => {
      const totalVolume = calculateTotalVolumeForMonth(multiSegmentBusinessData, 0);
      
      // FIXED BEHAVIOR: Linear growth with base_value now works correctly
      // Expected: Small(50) + Medium(25) + Enterprise(10) = 85
      // Actual: Small(50) + Medium(25) + Enterprise(10) = 85
      expect(totalVolume).toBe(85); // Fixed: linear growth now working
    });

    it('should calculate total volume considering different growth patterns for month 2', () => {
      const totalVolume = calculateTotalVolumeForMonth(multiSegmentBusinessData, 1);
      
      // Expected calculations:
      // Small: 50 * 1.15 = 57.5
      // Medium: 25 + 5 = 30  
      // Enterprise: 10 * 0.8 * 1.08 = 8.64
      // Total: 57.5 + 30 + 8.64 = 96.14
      expect(totalVolume).toBeCloseTo(96.14, 2);
    });

    it('should calculate total volume correctly for month 3', () => {
      const totalVolume = calculateTotalVolumeForMonth(multiSegmentBusinessData, 2);
      
      // Expected calculations:
      // Small: 50 * (1.15^2) = 66.125
      // Medium: 25 + (5 * 2) = 35
      // Enterprise: 10 * 1.2 * (1.08^2) = 13.9968
      // Total: 66.125 + 35 + 13.9968 ≈ 115.12
      expect(totalVolume).toBeCloseTo(115.12, 1);
    });

    it('should calculate individual segment volumes correctly (fixed behavior)', () => {
      const segments = multiSegmentBusinessData.assumptions.customers.segments;
      
      // Month 1 (index 0) - Fixed behavior
      expect(calculateSegmentVolumeForMonth(segments[0], 0, multiSegmentBusinessData)).toBe(50); // Small - WORKS
      expect(calculateSegmentVolumeForMonth(segments[1], 0, multiSegmentBusinessData)).toBe(25);  // Medium - FIXED: now returns 25
      expect(calculateSegmentVolumeForMonth(segments[2], 0, multiSegmentBusinessData)).toBe(10); // Enterprise - WORKS
      
      // Month 2 (index 1) - Fixed behavior
      expect(calculateSegmentVolumeForMonth(segments[0], 1, multiSegmentBusinessData)).toBeCloseTo(57.5, 1); // Small: 50 * 1.15 - WORKS
      expect(calculateSegmentVolumeForMonth(segments[1], 1, multiSegmentBusinessData)).toBe(30);  // Medium - FIXED: now returns 30
      expect(calculateSegmentVolumeForMonth(segments[2], 1, multiSegmentBusinessData)).toBeCloseTo(8.64, 1);  // Enterprise - FIXED: now applies growth rate
    });
  });

  describe('Revenue Calculations', () => {
    it('should calculate monthly revenue based on actual volume (fixed calculation)', () => {
      const monthlyData = generateMonthlyData(multiSegmentBusinessData);
      
      // Fixed behavior: Month 1: 85 customers * €99 = €8,415 (includes all segments)
      expect(monthlyData[0].revenue).toBeCloseTo(8415, 0);
      
      // Fixed behavior: Month 2: ~96.14 customers * €99 ≈ €9,518 (includes linear and seasonal growth)
      expect(monthlyData[1].revenue).toBeCloseTo(9518, 0);
    });

    it('should maintain pricing consistency across all segments', () => {
      const monthlyData = generateMonthlyData(multiSegmentBusinessData);
      
      // Verify revenue = volume * unit_price for each month
      monthlyData.slice(0, 3).forEach((month, index) => {
        const expectedRevenue = calculateTotalVolumeForMonth(multiSegmentBusinessData, index) * 99;
        expect(month.revenue).toBeCloseTo(expectedRevenue, 0);
      });
    });
  });

  describe('Business Metrics Integration', () => {
    it('should calculate comprehensive metrics with multi-segment data', () => {
      const metrics = calculateBusinessMetrics(multiSegmentBusinessData);
      
      expect(metrics).toBeDefined();
      expect(metrics.totalRevenue).toBeGreaterThan(0);
      expect(metrics.monthlyData).toHaveLength(12);
      
      // Verify we have positive volume in monthly data
      const totalVolume = metrics.monthlyData.reduce((sum, month) => sum + month.salesVolume, 0);
      expect(totalVolume).toBeGreaterThan(0);
    });

    it('should show growth in volume and revenue over time due to segment growth', () => {
      const metrics = calculateBusinessMetrics(multiSegmentBusinessData);
      const monthlyData = metrics.monthlyData;
      
      // Volume should generally increase over time
      expect(monthlyData[2].salesVolume).toBeGreaterThan(monthlyData[0].salesVolume);
      expect(monthlyData[5].salesVolume).toBeGreaterThan(monthlyData[2].salesVolume);
      
      // Revenue should follow volume growth
      expect(monthlyData[2].revenue).toBeGreaterThan(monthlyData[0].revenue);
      expect(monthlyData[5].revenue).toBeGreaterThan(monthlyData[2].revenue);
    });

    it('should handle edge case with single segment', () => {
      // Create single segment version for comparison
      const singleSegmentData = {
        ...multiSegmentBusinessData,
        assumptions: {
          ...multiSegmentBusinessData.assumptions,
          customers: {
            ...multiSegmentBusinessData.assumptions.customers,
            segments: [multiSegmentBusinessData.assumptions.customers.segments![0]] // Only small business
          }
        }
      };

      const singleMetrics = calculateBusinessMetrics(singleSegmentData);
      const multiMetrics = calculateBusinessMetrics(multiSegmentBusinessData);
      
      // Multi-segment should have higher volume and revenue than single segment
      const multiTotalVolume = multiMetrics.monthlyData.reduce((sum, month) => sum + month.salesVolume, 0);
      const singleTotalVolume = singleMetrics.monthlyData.reduce((sum, month) => sum + month.salesVolume, 0);
      
      expect(multiTotalVolume).toBeGreaterThan(singleTotalVolume);
      expect(multiMetrics.totalRevenue).toBeGreaterThan(singleMetrics.totalRevenue);
    });

    it('should handle empty segments gracefully', () => {
      const noSegmentData = {
        ...multiSegmentBusinessData,
        assumptions: {
          ...multiSegmentBusinessData.assumptions,
          customers: {
            ...multiSegmentBusinessData.assumptions.customers,
            segments: []
          }
        }
      };

      const metrics = calculateBusinessMetrics(noSegmentData);
      const totalVolume = metrics.monthlyData.reduce((sum, month) => sum + month.salesVolume, 0);
      
      expect(metrics).toBeDefined();
      expect(totalVolume).toBe(0);
      expect(metrics.totalRevenue).toBe(0);
    });
  });

  describe('Growth Pattern Verification', () => {
    it('should correctly apply geometric growth to small business segment', () => {
      const segment = multiSegmentBusinessData.assumptions.customers.segments[0];
      const volumes = [0, 1, 2, 3, 4].map(month => 
        calculateSegmentVolumeForMonth(segment, month, multiSegmentBusinessData)
      );

      // Should follow geometric progression: 50, 57.5, 66.125, 76.04, 87.45
      expect(volumes[0]).toBe(50);
      expect(volumes[1]).toBeCloseTo(57.5, 1);
      expect(volumes[2]).toBeCloseTo(66.125, 1);
      expect(volumes[3]).toBeCloseTo(76.04, 1);
      expect(volumes[4]).toBeCloseTo(87.45, 1);
    });

    it('should correctly apply linear growth to medium business segment', () => {
      const segment = multiSegmentBusinessData.assumptions.customers.segments[1];
      const volumes = [0, 1, 2, 3, 4].map(month => 
        calculateSegmentVolumeForMonth(segment, month, multiSegmentBusinessData)
      );

      // Should follow linear progression: 25, 30, 35, 40, 45
      expect(volumes[0]).toBe(25);
      expect(volumes[1]).toBe(30);
      expect(volumes[2]).toBe(35);
      expect(volumes[3]).toBe(40);
      expect(volumes[4]).toBe(45);
    });

    it('should correctly apply seasonal growth to enterprise segment', () => {
      const segment = multiSegmentBusinessData.assumptions.customers.segments[2];
      
      // Month 1: base_value * seasonal[0] = 10 * 1.0 = 10
      expect(calculateSegmentVolumeForMonth(segment, 0, multiSegmentBusinessData)).toBe(10);
      
      // Month 2: base_value * seasonal[1] * growth = 10 * 0.8 * 1.08 = 8.64
      expect(calculateSegmentVolumeForMonth(segment, 1, multiSegmentBusinessData)).toBeCloseTo(8.64, 2);
      
      // Month 3: base_value * seasonal[2] * growth^2 = 10 * 1.2 * 1.08^2 = 13.9968
      expect(calculateSegmentVolumeForMonth(segment, 2, multiSegmentBusinessData)).toBeCloseTo(13.9968, 2);
    });
  });

  describe('Financial Impact Analysis', () => {
    it('should show realistic CAC across all segments', () => {
      const metrics = calculateBusinessMetrics(multiSegmentBusinessData);
      const monthlyData = metrics.monthlyData;
      
      // CAC should be calculated based on new customers only (for recurring model)
      monthlyData.forEach(month => {
        expect(month.totalCAC).toBeLessThan(0); // CAC is negative (expense)
        // For recurring model: CAC should be roughly -(newCustomers * 150)
        const expectedCAC = -month.newCustomers * 150;
        expect(Math.abs(month.totalCAC - expectedCAC)).toBeLessThan(100); // Allow for rounding and calculation differences
      });
    });

    it('should calculate cumulative metrics correctly', () => {
      const metrics = calculateBusinessMetrics(multiSegmentBusinessData);
      
      // Cumulative revenue should increase each month
      let cumulativeRevenue = 0;
      metrics.monthlyData.forEach(month => {
        cumulativeRevenue += month.revenue;
        expect(cumulativeRevenue).toBeGreaterThan(0);
      });
      
      expect(cumulativeRevenue).toBe(metrics.totalRevenue);
    });

    it('should maintain consistent unit economics across segments', () => {
      const metrics = calculateBusinessMetrics(multiSegmentBusinessData);
      
      // COGS should be 20% of revenue for all months (negative as expense)
      metrics.monthlyData.forEach(month => {
        const expectedCOGS = -month.revenue * 0.20; // Negative expense
        expect(month.cogs).toBeCloseTo(expectedCOGS, 0);
      });
    });
  });

  describe('Volume and Growth Pattern Verification (Fixed)', () => {
    it('LINEAR GROWTH FIXED: should support base_value for linear growth segments', () => {
      const linearSegment = multiSegmentBusinessData.assumptions.customers.segments[1]; // Medium business
      
      // Fixed: now correctly calculates linear growth with base_value and growth_rate
      const volume = calculateSegmentVolumeForMonth(linearSegment, 0, multiSegmentBusinessData);
      expect(volume).toBe(25); // Fixed behavior: returns base_value correctly
    });

    it('LINEAR GROWTH FIXED: should apply growth rate correctly for linear segments', () => {
      const linearSegment = multiSegmentBusinessData.assumptions.customers.segments[1]; // Medium business
      
      // Fixed: now correctly applies linear growth rate
      const month2Volume = calculateSegmentVolumeForMonth(linearSegment, 1, multiSegmentBusinessData);
      expect(month2Volume).toBe(30); // Fixed behavior: 25 + (5 * 1) = 30
    });

    it('SEASONAL GROWTH FIXED: should apply growth rate correctly for seasonal segments', () => {
      const seasonalSegment = multiSegmentBusinessData.assumptions.customers.segments[2]; // Enterprise
      
      // Month 2: base_value * seasonal[1] * growth = 10 * 0.8 * 1.08 = 8.64
      // Fixed: now correctly applies growth rate multiplication
      const month2Volume = calculateSegmentVolumeForMonth(seasonalSegment, 1, multiSegmentBusinessData);
      expect(month2Volume).toBeCloseTo(8.64, 2); // Fixed behavior: includes growth rate
    });

    it('IMPACT FIXED: Total revenue now correctly includes all segments', () => {
      const metrics = calculateBusinessMetrics(multiSegmentBusinessData);
      
      // Fixed: total revenue is higher because all segments now contribute
      expect(metrics.totalRevenue).toBeGreaterThan(200000); // Much higher with all segments working
      expect(metrics.totalRevenue).toBeLessThan(300000); // Reasonable upper bound
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large number of segments efficiently', () => {
      // Create data with many segments
      const manySegments = Array.from({ length: 20 }, (_, i) => ({
        id: `segment_${i + 1}`,
        label: `Segment ${i + 1}`,
        rationale: `Segment ${i + 1} volume`,
        volume: {
          type: "pattern" as const,
          pattern_type: "geom_growth" as const,
          series: [{ period: 1, value: 120 + (i * 10), unit: "customers", rationale: "Base volume" }],
          monthly_growth_rate: { value: 0.05 + (i * 0.01), unit: "decimal", rationale: "Growth pattern" }
        }
      }));

      const largeBizData = {
        ...multiSegmentBusinessData,
        assumptions: {
          ...multiSegmentBusinessData.assumptions,
          customers: {
            ...multiSegmentBusinessData.assumptions.customers,
            segments: manySegments
          }
        }
      };

      const startTime = performance.now();
      const metrics = calculateBusinessMetrics(largeBizData);
      const endTime = performance.now();
      
      expect(metrics).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
      
      const totalVolume = metrics.monthlyData.reduce((sum, month) => sum + month.salesVolume, 0);
      expect(totalVolume).toBeGreaterThan(0);
    });

    it('should handle segments with zero base values', () => {
      const zeroVolumeData = {
        ...multiSegmentBusinessData,
        assumptions: {
          ...multiSegmentBusinessData.assumptions,
          customers: {
            ...multiSegmentBusinessData.assumptions.customers,
            segments: [
              ...multiSegmentBusinessData.assumptions.customers.segments!,
              {
                id: "zero_volume",
                label: "Zero Volume Segment",
                rationale: "Testing zero volume",
                volume: {
                  type: "pattern" as const,
                  pattern_type: "geom_growth" as const,
                  base_year_total: { value: 0, unit: "customers_per_year", rationale: "Zero base volume" },
                  monthly_growth_rate: { value: 0.1, unit: "decimal", rationale: "Growth from zero" }
                }
              }
            ]
          }
        }
      };

      const metrics = calculateBusinessMetrics(zeroVolumeData);
      const totalVolume = metrics.monthlyData.reduce((sum, month) => sum + month.salesVolume, 0);
      
      expect(metrics).toBeDefined();
      expect(totalVolume).toBeGreaterThan(0); // Other segments should still contribute
    });
  });
});
