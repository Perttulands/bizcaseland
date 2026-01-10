import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateBusinessMetrics,
  calculateNPV,
  calculateIRR,
  calculateBreakEven,
  calculatePaybackPeriod,
  generateMonthlyData,
  calculateSeasonalGrowthVolume,
  calculateGeomGrowthVolume,
  calculateLinearGrowthVolume,
  calculateTimeSeriesVolume,
  calculateTotalVolumeForMonth,
  calculateSegmentVolumeForMonth,
  calculateSegmentSeasonalPattern,
  calculateSegmentGeometricGrowth,
  calculateCapexForMonth,
  calculateImplementationFactor,
  calculateBaselineCostsForMonth,
  calculateCostSavingsForMonth,
  calculateEfficiencyGainsForMonth,
  calculateTotalBenefitsForMonth,
  calculateDynamicUnitPrice,
  calculateDynamicSegmentVolume,
  calculateDynamicTotalVolumeForMonth,
  getPricingTrajectory,
  getVolumeTrajectory,
  formatCurrency,
  formatPercent,
  isIRRError,
  getIRRErrorMessage,
  calculateOpexForMonth,
  MonthlyData,
  CalculatedMetrics,
  IRR_ERROR_CODES
} from '@/core/engine/calculators/business-calculator-full';
import { BusinessData } from '@/core/types';
import { createMockBusinessData, createMockMonthlyData, createMockCostSavingsData } from '@/test/mockData';

describe('Calculations Engine', () => {
  let mockBusinessData: BusinessData;

  beforeEach(() => {
    mockBusinessData = createMockBusinessData();
  });

  describe('calculateBusinessMetrics', () => {
    it('should return default metrics when no data provided', () => {
      const result = calculateBusinessMetrics(null);
      expect(result).toEqual({
        totalRevenue: 0,
        netProfit: 0,
        npv: 0,
        irr: 0,
        paybackPeriod: 0,
        totalInvestmentRequired: 0,
        breakEvenMonth: 0,
        monthlyData: []
      });
    });

    it('should calculate correct metrics for valid business data', () => {
      const result = calculateBusinessMetrics(mockBusinessData);
      
      expect(result.totalRevenue).toBeGreaterThan(0);
      expect(result.monthlyData).toHaveLength(24);
      expect(result.npv).toBeDefined();
      expect(result.irr).toBeDefined();
      expect(result.netProfit).toBeDefined();
      expect(result.paybackPeriod).toBeGreaterThanOrEqual(0);
      expect(result.totalInvestmentRequired).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing assumptions gracefully', () => {
      const incompleteData = { meta: { periods: 12 } } as BusinessData;
      const result = calculateBusinessMetrics(incompleteData);
      
      expect(result.monthlyData).toHaveLength(12);
      expect(result.totalRevenue).toBe(0);
    });

    it('should limit periods to maximum of 60', () => {
      const dataWithLongPeriod = createMockBusinessData({
        meta: { 
          title: 'Long Period Test',
          description: 'Testing long periods',
          business_model: 'recurring',
          currency: 'EUR',
          periods: 120,
          frequency: 'monthly'
        }
      });
      const result = calculateBusinessMetrics(dataWithLongPeriod);
      
      expect(result.monthlyData).toHaveLength(60);
    });
  });

  describe('NPV Calculations', () => {
    it('should calculate NPV correctly with positive cash flows', () => {
      const monthlyData: MonthlyData[] = [
        { netCashFlow: -1000 } as MonthlyData,
        { netCashFlow: 500 } as MonthlyData,
        { netCashFlow: 600 } as MonthlyData,
        { netCashFlow: 700 } as MonthlyData
      ];
      const interestRate = 0.12;
      
      const npv = calculateNPV(monthlyData, interestRate);
      // Manual calculation: -1000 + 500/(1.01)^1 + 600/(1.01)^2 + 700/(1.01)^3
      // = -1000 + 495.0495... + 588.2365... + 679.5767... ≈ 755.089
      expect(npv).toBeCloseTo(755.09, 1);
    });

    it('should calculate NPV correctly with all negative cash flows', () => {
      const monthlyData: MonthlyData[] = [
        { netCashFlow: -1000 } as MonthlyData,
        { netCashFlow: -500 } as MonthlyData,
        { netCashFlow: -300 } as MonthlyData
      ];
      const interestRate = 0.12;
      
      const npv = calculateNPV(monthlyData, interestRate);
      expect(npv).toBeLessThan(0);
    });

    it('should handle zero interest rate', () => {
      const monthlyData: MonthlyData[] = [
        { netCashFlow: -1000 } as MonthlyData,
        { netCashFlow: 500 } as MonthlyData,
        { netCashFlow: 600 } as MonthlyData
      ];
      
      const npv = calculateNPV(monthlyData, 0);
      expect(npv).toBe(100); // Sum of cash flows
    });

    it('should handle empty monthly data', () => {
      const npv = calculateNPV([], 0.12);
      expect(npv).toBe(0);
    });
  });

  describe('IRR Calculations', () => {
    it('should calculate IRR for profitable investment', () => {
      const monthlyData: MonthlyData[] = [
        { netCashFlow: -1000 } as MonthlyData,
        { netCashFlow: 300 } as MonthlyData,
        { netCashFlow: 400 } as MonthlyData,
        { netCashFlow: 500 } as MonthlyData,
        { netCashFlow: 200 } as MonthlyData
      ];
      
      const irr = calculateIRR(monthlyData);
      expect(irr).toBeGreaterThan(0);
      expect(irr).toBeLessThan(5); // Allow for high but realistic returns
    });

    it('should return error code for all positive cash flows', () => {
      const monthlyData: MonthlyData[] = [
        { netCashFlow: 100 } as MonthlyData,
        { netCashFlow: 200 } as MonthlyData,
        { netCashFlow: 300 } as MonthlyData
      ];
      
      const irr = calculateIRR(monthlyData);
      expect(irr).toBe(IRR_ERROR_CODES.ALL_POSITIVE);
    });

    it('should return error code for all negative cash flows', () => {
      const monthlyData: MonthlyData[] = [
        { netCashFlow: -100 } as MonthlyData,
        { netCashFlow: -200 } as MonthlyData,
        { netCashFlow: -300 } as MonthlyData
      ];
      
      const irr = calculateIRR(monthlyData);
      expect(irr).toBe(IRR_ERROR_CODES.ALL_NEGATIVE);
    });

    it('should return error code for all same cash flows', () => {
      const monthlyData: MonthlyData[] = [
        { netCashFlow: 100 } as MonthlyData,
        { netCashFlow: 100 } as MonthlyData,
        { netCashFlow: 100 } as MonthlyData
      ];
      
      const irr = calculateIRR(monthlyData);
      expect(irr).toBe(IRR_ERROR_CODES.ALL_SAME);
    });

    it('should handle empty data', () => {
      const irr = calculateIRR([]);
      expect(irr).toBe(IRR_ERROR_CODES.NO_DATA);
    });

    it('should handle extreme rates and return invalid', () => {
      const monthlyData: MonthlyData[] = [
        { netCashFlow: -1000000 } as MonthlyData,
        { netCashFlow: 1 } as MonthlyData,
        { netCashFlow: 1 } as MonthlyData
      ];
      
      const irr = calculateIRR(monthlyData);
      expect(irr).toBeLessThan(0); // Should return an error code
    });
  });

  describe('Break-even Calculations', () => {
    it('should find break-even month when cash flow turns positive', () => {
      const monthlyData: MonthlyData[] = [
        { netCashFlow: -1000 } as MonthlyData,
        { netCashFlow: -500 } as MonthlyData,
        { netCashFlow: 200 } as MonthlyData,
        { netCashFlow: 400 } as MonthlyData
      ];
      
      const breakEven = calculateBreakEven(monthlyData);
      expect(breakEven).toBe(3);
    });

    it('should return 0 when break-even is never reached', () => {
      const monthlyData: MonthlyData[] = [
        { netCashFlow: -1000 } as MonthlyData,
        { netCashFlow: -500 } as MonthlyData,
        { netCashFlow: -200 } as MonthlyData
      ];
      
      const breakEven = calculateBreakEven(monthlyData);
      expect(breakEven).toBe(0);
    });

    it('should handle empty data', () => {
      const breakEven = calculateBreakEven([]);
      expect(breakEven).toBe(0);
    });

    it('should return 1 if first month is positive', () => {
      const monthlyData: MonthlyData[] = [
        { netCashFlow: 100 } as MonthlyData,
        { netCashFlow: 200 } as MonthlyData
      ];
      
      const breakEven = calculateBreakEven(monthlyData);
      expect(breakEven).toBe(1);
    });
  });

  describe('Payback Period Calculations', () => {
    it('should calculate payback period correctly', () => {
      const monthlyData: MonthlyData[] = [
        { netCashFlow: -1000 } as MonthlyData, // Cumulative: -1000
        { netCashFlow: -300 } as MonthlyData,  // Cumulative: -1300
        { netCashFlow: 500 } as MonthlyData,   // Cumulative: -800
        { netCashFlow: 1000 } as MonthlyData   // Cumulative: +200 (payback in month 4)
      ];
      
      const payback = calculatePaybackPeriod(monthlyData);
      expect(payback).toBe(4);
    });

    it('should return 0 when payback is never achieved', () => {
      const monthlyData: MonthlyData[] = [
        { netCashFlow: -1000 } as MonthlyData,
        { netCashFlow: -500 } as MonthlyData,
        { netCashFlow: -200 } as MonthlyData
      ];
      
      const payback = calculatePaybackPeriod(monthlyData);
      expect(payback).toBe(0);
    });

    it('should handle all positive cash flows', () => {
      const monthlyData: MonthlyData[] = [
        { netCashFlow: 100 } as MonthlyData,
        { netCashFlow: 200 } as MonthlyData
      ];
      
      const payback = calculatePaybackPeriod(monthlyData);
      expect(payback).toBe(1);
    });

    it('should handle empty data', () => {
      const payback = calculatePaybackPeriod([]);
      expect(payback).toBe(0);
    });
  });

  describe('Growth Pattern Calculations', () => {
    describe('Seasonal Growth', () => {
      it('should calculate seasonal growth volume correctly', () => {
        const volume = {
          base_year_total: { value: 1200 },
          seasonality_index_12: [1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3],
          yoy_growth: { value: 0.1 }
        };
        
        const monthlyVolume = calculateSeasonalGrowthVolume(volume, 0);
        expect(monthlyVolume).toBeCloseTo(120, 1); // 1200/12 * 1.2
        
        const secondYearVolume = calculateSeasonalGrowthVolume(volume, 12);
        expect(secondYearVolume).toBeCloseTo(132, 1); // 1200*1.1/12 * 1.2
      });

      it('should handle missing seasonality indices', () => {
        const volume = {
          base_year_total: { value: 1200 },
          yoy_growth: { value: 0.1 }
        };
        
        const monthlyVolume = calculateSeasonalGrowthVolume(volume, 0);
        expect(monthlyVolume).toBeCloseTo(100, 1); // 1200/12 * 1
      });

      it('should normalize seasonality indices', () => {
        const volume = {
          base_year_total: { value: 1200 },
          seasonality_index_12: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], // Sum = 24
          yoy_growth: { value: 0 }
        };
        
        const monthlyVolume = calculateSeasonalGrowthVolume(volume, 0);
        expect(monthlyVolume).toBeCloseTo(100, 1); // Should normalize to 1.0
      });

      it('should use fallback from businessData', () => {
        const volume = {};
        const businessData = createMockBusinessData();
        
        const monthlyVolume = calculateSeasonalGrowthVolume(volume, 0, businessData);
        expect(monthlyVolume).toBeGreaterThan(0);
      });
    });

    describe('Geometric Growth', () => {
      it('should calculate geometric growth correctly', () => {
        const volume = {
          series: [{ value: 100 }],
          monthly_growth_rate: { value: 0.05 }
        };
        
        const month0 = calculateGeomGrowthVolume(volume, 0);
        expect(month0).toBe(100);
        
        const month1 = calculateGeomGrowthVolume(volume, 1);
        expect(month1).toBeCloseTo(105, 1);
        
        const month12 = calculateGeomGrowthVolume(volume, 12);
        expect(month12).toBeCloseTo(179.59, 1);
      });

      it('should handle zero growth rate', () => {
        const volume = {
          series: [{ value: 100 }],
          monthly_growth_rate: { value: 0 }
        };
        
        const monthlyVolume = calculateGeomGrowthVolume(volume, 5);
        expect(monthlyVolume).toBe(100);
      });

      it('should use fallback from businessData', () => {
        const volume = {};
        const businessData = createMockBusinessData();
        
        const monthlyVolume = calculateGeomGrowthVolume(volume, 0, businessData);
        expect(monthlyVolume).toBe(100);
      });
    });

    describe('Linear Growth', () => {
      it('should calculate linear growth correctly', () => {
        const volume = {
          series: [{ value: 100 }],
          monthly_flat_increase: { value: 10 }
        };
        
        const month0 = calculateLinearGrowthVolume(volume, 0);
        expect(month0).toBe(100);
        
        const month1 = calculateLinearGrowthVolume(volume, 1);
        expect(month1).toBe(110);
        
        const month12 = calculateLinearGrowthVolume(volume, 12);
        expect(month12).toBe(220);
      });

      it('should handle zero increase', () => {
        const volume = {
          series: [{ value: 100 }],
          monthly_flat_increase: { value: 0 }
        };
        
        const monthlyVolume = calculateLinearGrowthVolume(volume, 5);
        expect(monthlyVolume).toBe(100);
      });

      it('should use fallback from businessData', () => {
        const volume = {};
        const businessData = createMockBusinessData();
        
        const monthlyVolume = calculateLinearGrowthVolume(volume, 0, businessData);
        expect(monthlyVolume).toBe(100);
      });
    });

    describe('Time Series', () => {
      it('should return correct value for time series', () => {
        const volume = {
          series: [
            { value: 100 },
            { value: 150 },
            { value: 200 }
          ]
        };
        
        expect(calculateTimeSeriesVolume(volume, 0)).toBe(100);
        expect(calculateTimeSeriesVolume(volume, 1)).toBe(150);
        expect(calculateTimeSeriesVolume(volume, 2)).toBe(200);
      });

      it('should extend last value when index exceeds series length', () => {
        const volume = {
          series: [
            { value: 100 },
            { value: 150 }
          ]
        };
        
        expect(calculateTimeSeriesVolume(volume, 5)).toBe(150);
      });

      it('should handle empty series', () => {
        const volume = { series: [] };
        expect(calculateTimeSeriesVolume(volume, 0)).toBe(0);
      });
    });
  });

  describe('Monthly Data Generation', () => {
    it('should generate correct number of months', () => {
      const data = generateMonthlyData(mockBusinessData);
      expect(data).toHaveLength(24);
    });

    it('should handle recurring business model correctly', () => {
      const recurringData = createMockBusinessData({
        meta: { 
          title: 'Recurring Test',
          description: 'Testing recurring model',
          business_model: 'recurring',
          currency: 'EUR',
          periods: 3,
          frequency: 'monthly'
        }
      });
      
      const monthlyData = generateMonthlyData(recurringData);
      
      // First month: all customers are new
      expect(monthlyData[0].newCustomers).toBeGreaterThan(0);
      expect(monthlyData[0].existingCustomers).toBe(0);
      
      // Second month: should have existing customers
      expect(monthlyData[1].existingCustomers).toBeGreaterThan(0);
    });

    it('should handle unit sales business model correctly', () => {
      const unitSalesData = createMockBusinessData({
        meta: { 
          title: 'Unit Sales Test',
          description: 'Testing unit sales model',
          business_model: 'unit_sales',
          currency: 'EUR',
          periods: 3,
          frequency: 'monthly'
        }
      });
      
      const monthlyData = generateMonthlyData(unitSalesData);
      
      // For unit sales: all volume is new each month
      monthlyData.forEach(month => {
        expect(month.existingCustomers).toBe(0);
        expect(month.newCustomers).toBeGreaterThan(0);
      });
    });

    it('should calculate revenue correctly', () => {
      const monthlyData = generateMonthlyData(mockBusinessData);
      
      monthlyData.forEach(month => {
        expect(month.revenue).toBe(month.salesVolume * month.unitPrice);
      });
    });

    it('should calculate COGS correctly', () => {
      const monthlyData = generateMonthlyData(mockBusinessData);
      
      monthlyData.forEach(month => {
        const expectedCogs = -Math.round(month.revenue * 0.3); // 30% COGS
        expect(month.cogs).toBe(expectedCogs);
      });
    });

    it('should calculate gross profit correctly', () => {
      const monthlyData = generateMonthlyData(mockBusinessData);
      
      monthlyData.forEach(month => {
        expect(month.grossProfit).toBe(month.revenue + month.cogs);
      });
    });

    it('should handle missing pricing gracefully', () => {
      const dataWithoutPricing = createMockBusinessData({
        assumptions: {
          pricing: {}
        }
      });
      
      const monthlyData = generateMonthlyData(dataWithoutPricing);
      expect(monthlyData[0].unitPrice).toBe(0);
      expect(monthlyData[0].revenue).toBe(0);
    });
  });

  describe('Segment Volume Calculations', () => {
    it('should calculate total volume from multiple segments', () => {
      const businessData = createMockBusinessData({
        assumptions: {
          customers: {
            segments: [
              {
                id: 'segment1',
                label: 'Segment 1',
                rationale: 'Primary segment',
                volume: {
                  type: 'pattern',
                  pattern_type: 'linear_growth',
                  series: [{ period: 1, value: 100, unit: 'customers', rationale: 'Initial' }],
                  monthly_flat_increase: { value: 10, unit: 'customers', rationale: 'Growth' }
                }
              },
              {
                id: 'segment2',
                label: 'Segment 2',
                rationale: 'Secondary segment',
                volume: {
                  type: 'pattern',
                  pattern_type: 'linear_growth',
                  series: [{ period: 1, value: 50, unit: 'customers', rationale: 'Initial' }],
                  monthly_flat_increase: { value: 5, unit: 'customers', rationale: 'Growth' }
                }
              }
            ]
          }
        }
      });
      
      const totalVolume = calculateTotalVolumeForMonth(businessData, 0);
      expect(totalVolume).toBe(150); // 100 + 50
      
      const totalVolumeMonth1 = calculateTotalVolumeForMonth(businessData, 1);
      expect(totalVolumeMonth1).toBe(165); // 110 + 55
    });

    it('should handle empty segments', () => {
      const businessData = createMockBusinessData({
        assumptions: {
          customers: {
            segments: []
          }
        }
      });
      
      const totalVolume = calculateTotalVolumeForMonth(businessData, 0);
      expect(totalVolume).toBe(0);
    });

    it('should auto-detect pattern type from growth_settings', () => {
      const segment = {
        volume: {
          type: 'pattern'
          // No pattern_type specified
        }
      };
      
      const businessData = createMockBusinessData();
      const volume = calculateSegmentVolumeForMonth(segment, 0, businessData);
      expect(volume).toBeGreaterThan(0);
    });
  });

  describe('Capex Calculations', () => {
    it('should calculate capex from time series', () => {
      const businessData = createMockBusinessData({
        assumptions: {
          capex: [
            {
              name: 'Equipment',
              timeline: {
                type: 'time_series',
                series: [
                  { period: 1, value: 10000, unit: 'EUR', rationale: 'Initial investment' },
                  { period: 3, value: 5000, unit: 'EUR', rationale: 'Expansion' }
                ]
              }
            }
          ]
        }
      });
      
      expect(calculateCapexForMonth(businessData, 0)).toBe(10000); // Month 1
      expect(calculateCapexForMonth(businessData, 1)).toBe(0);     // Month 2
      expect(calculateCapexForMonth(businessData, 2)).toBe(5000);  // Month 3
    });

    it('should handle empty capex', () => {
      const businessData = createMockBusinessData({
        assumptions: {
          capex: []
        }
      });
      
      expect(calculateCapexForMonth(businessData, 0)).toBe(0);
    });

    it('should calculate capex from patterns', () => {
      const businessData = createMockBusinessData({
        assumptions: {
          capex: [
            {
              name: 'Infrastructure',
              timeline: {
                type: 'pattern',
                pattern_type: 'linear_growth',
                series: [{ period: 1, value: 1000, unit: 'EUR', rationale: 'Base capex' }]
              }
            }
          ]
        }
      });
      
      expect(calculateCapexForMonth(businessData, 0)).toBe(1000); // Month 0: start value + 0 * increase
      expect(calculateCapexForMonth(businessData, 1)).toBe(1000); // Month 1: uses linear growth calculation
    });
  });

  describe('Utility Functions', () => {
    describe('formatCurrency', () => {
      it('should format currency correctly', () => {
        expect(formatCurrency(1000)).toBe('€1,000');
        expect(formatCurrency(1234567)).toBe('€1,234,567');
        expect(formatCurrency(-500)).toBe('-€500');
      });

      it('should handle different currencies', () => {
        expect(formatCurrency(1000, 'USD')).toBe('$1,000');
        expect(formatCurrency(1000, 'GBP')).toBe('£1,000');
      });

      it('should handle zero and small amounts', () => {
        expect(formatCurrency(0)).toBe('€0');
        expect(formatCurrency(0.99)).toBe('€1');
      });
    });

    describe('formatPercent', () => {
      it('should format percentages correctly', () => {
        expect(formatPercent(0.1)).toBe('10.0%');
        expect(formatPercent(0.156)).toBe('15.6%');
        expect(formatPercent(-0.05)).toBe('-5.0%');
        expect(formatPercent(0)).toBe('0.0%');
        expect(formatPercent(1)).toBe('100.0%');
      });
    });

    describe('IRR Error Handling', () => {
      it('should correctly identify IRR errors', () => {
        expect(isIRRError(IRR_ERROR_CODES.NO_DATA)).toBe(true);
        expect(isIRRError(IRR_ERROR_CODES.ALL_SAME)).toBe(true);
        expect(isIRRError(IRR_ERROR_CODES.ALL_POSITIVE)).toBe(true);
        expect(isIRRError(IRR_ERROR_CODES.ALL_NEGATIVE)).toBe(true);
        expect(isIRRError(IRR_ERROR_CODES.NO_CONVERGENCE)).toBe(true);
        expect(isIRRError(IRR_ERROR_CODES.EXTREME_RATE)).toBe(true);
        expect(isIRRError(0.05)).toBe(false); // Valid IRR
        expect(isIRRError(-0.01)).toBe(false); // Valid negative IRR
      });

      it('should provide meaningful error messages', () => {
        expect(getIRRErrorMessage(IRR_ERROR_CODES.NO_DATA)).toContain('No data available');
        expect(getIRRErrorMessage(IRR_ERROR_CODES.ALL_SAME)).toContain('identical');
        expect(getIRRErrorMessage(IRR_ERROR_CODES.ALL_POSITIVE)).toContain('infinite return');
        expect(getIRRErrorMessage(IRR_ERROR_CODES.ALL_NEGATIVE)).toContain('no return possible');
        expect(getIRRErrorMessage(IRR_ERROR_CODES.NO_CONVERGENCE)).toContain('did not converge');
        expect(getIRRErrorMessage(IRR_ERROR_CODES.EXTREME_RATE)).toContain('extreme rate');
        expect(getIRRErrorMessage(-1)).toBe('Unknown IRR error');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined gracefully in calculateBusinessMetrics', () => {
      expect(() => calculateBusinessMetrics(null)).not.toThrow();
      expect(() => calculateBusinessMetrics(undefined as any)).not.toThrow();
    });

    it('should handle malformed business data', () => {
      const malformedData = {
        meta: {},
        assumptions: null
      } as any;
      
      expect(() => calculateBusinessMetrics(malformedData)).not.toThrow();
      const result = calculateBusinessMetrics(malformedData);
      expect(result.monthlyData).toBeDefined();
    });

    it('should handle very large numbers', () => {
      const largeData = createMockBusinessData({
        assumptions: {
          pricing: {
            avg_unit_price: { value: 1000000, unit: 'EUR', rationale: 'Large price test' }
          },
          customers: {
            segments: [
              {
                id: 'large-segment',
                label: 'Large Segment',
                rationale: 'High volume test',
                volume: {
                  type: 'pattern',
                  pattern_type: 'linear_growth',
                  series: [{ period: 1, value: 1000000, unit: 'customers', rationale: 'Large volume' }],
                  monthly_flat_increase: { value: 100000, unit: 'customers', rationale: 'Large growth' }
                }
              }
            ]
          }
        }
      });
      
      expect(() => calculateBusinessMetrics(largeData)).not.toThrow();
    });

    it('should handle negative growth rates', () => {
      const negativeGrowthData = createMockBusinessData({
        assumptions: {
          customers: {
            segments: [
              {
                id: 'negative-growth',
                label: 'Declining Segment',
                rationale: 'Negative growth test',
                volume: {
                  type: 'pattern',
                  pattern_type: 'geom_growth',
                  series: [{ period: 1, value: 100, unit: 'customers', rationale: 'Initial volume' }],
                  monthly_growth_rate: { value: -0.1, unit: '%', rationale: 'Declining market' }
                }
              }
            ]
          }
        }
      });
      
      expect(() => calculateBusinessMetrics(negativeGrowthData)).not.toThrow();
      const result = calculateBusinessMetrics(negativeGrowthData);
      expect(result.monthlyData[0].salesVolume).toBeGreaterThan(0);
      expect(result.monthlyData[5].salesVolume).toBeLessThan(result.monthlyData[0].salesVolume);
    });
  });

  describe('Cost Savings Business Model', () => {
    let costSavingsData: BusinessData;

    beforeEach(() => {
      costSavingsData = createMockCostSavingsData();
    });

    describe('Implementation Factor Calculations', () => {
      it('should return 0 before start month', () => {
        const timeline = { start_month: 3, ramp_up_months: 6, full_implementation_month: 9 };
        expect(calculateImplementationFactor(0, timeline)).toBe(0);
        expect(calculateImplementationFactor(1, timeline)).toBe(0);
      });

      it('should return 1 after full implementation', () => {
        const timeline = { start_month: 3, ramp_up_months: 6, full_implementation_month: 9 };
        expect(calculateImplementationFactor(8, timeline)).toBe(1);
        expect(calculateImplementationFactor(10, timeline)).toBe(1);
      });

      it('should calculate ramp-up factor correctly', () => {
        const timeline = { start_month: 1, ramp_up_months: 4, full_implementation_month: 5 };
        expect(calculateImplementationFactor(0, timeline)).toBe(0.25); // Month 1: First month of implementation (1/4)
        expect(calculateImplementationFactor(1, timeline)).toBe(0.5);  // Month 2: Second month (2/4)
        expect(calculateImplementationFactor(2, timeline)).toBe(0.75); // Month 3: Third month (3/4)
        expect(calculateImplementationFactor(3, timeline)).toBe(1);    // Month 4: Fourth month (4/4)
        expect(calculateImplementationFactor(4, timeline)).toBe(1);    // Month 5: Full implementation reached
      });

      it('should default to 1 when no timeline provided', () => {
        expect(calculateImplementationFactor(0)).toBe(1);
        expect(calculateImplementationFactor(5)).toBe(1);
      });
    });

    describe('Baseline Costs Calculations', () => {
      it('should calculate total baseline costs correctly', () => {
        const baselineCosts = calculateBaselineCostsForMonth(costSavingsData, 0);
        // 25000 + 8000 + 3000 = 36000
        expect(baselineCosts).toBe(36000);
      });

      it('should return 0 for non-cost-savings models', () => {
        const baselineCosts = calculateBaselineCostsForMonth(mockBusinessData, 0);
        expect(baselineCosts).toBe(0);
      });

      it('should handle missing cost savings data', () => {
        const dataWithoutCostSavings = createMockCostSavingsData({
          assumptions: { cost_savings: { baseline_costs: [] } }
        });
        const baselineCosts = calculateBaselineCostsForMonth(dataWithoutCostSavings, 0);
        expect(baselineCosts).toBe(0);
      });
    });

    describe('Cost Savings Calculations', () => {
      it('should calculate cost savings correctly with implementation timeline', () => {
        // Month 0 (month 1): manual processing should start (70% of 25000 = 17500 max)
        const month0Savings = calculateCostSavingsForMonth(costSavingsData, 0);
        expect(month0Savings).toBeCloseTo(2916.67, 0); // 17500 * (1/6) implementation factor

        // Month 6 (month 7): full implementation for manual processing
        const month6Savings = calculateCostSavingsForMonth(costSavingsData, 6);
        expect(month6Savings).toBeGreaterThan(17500); // Should include all categories now
      });

      it('should return 0 for non-cost-savings models', () => {
        const savings = calculateCostSavingsForMonth(mockBusinessData, 0);
        expect(savings).toBe(0);
      });

      it('should handle timeline correctly for different cost categories', () => {
        // Error handling starts at month 3
        const month1Savings = calculateCostSavingsForMonth(costSavingsData, 1);
        const month4Savings = calculateCostSavingsForMonth(costSavingsData, 4);
        
        expect(month4Savings).toBeGreaterThan(month1Savings);
      });
    });

    describe('Efficiency Gains Calculations', () => {
      it('should calculate efficiency gains correctly', () => {
        // Month 1 (index 1 = month 2): processing speed should start
        const month1Gains = calculateEfficiencyGainsForMonth(costSavingsData, 1);

        // CORRECTED LOGIC: Efficiency gains = |baseline - improved| × value per unit × implementation factor
        // Processing speed: |12-120| × 2.5 EUR/invoice × (1/5) = 108 × 2.5 × 0.2 = 54 EUR
        // Accuracy hasn't started yet (starts month 3)
        expect(month1Gains).toBeCloseTo(54, 0);
      });

      it('should return 0 for non-cost-savings models', () => {
        const gains = calculateEfficiencyGainsForMonth(mockBusinessData, 0);
        expect(gains).toBe(0);
      });

      it('should handle implementation timeline for efficiency gains', () => {
        // Month 6 (index 6 = month 7): both processing speed and accuracy should be fully implemented
        const month6Gains = calculateEfficiencyGainsForMonth(costSavingsData, 6);

        // CORRECTED LOGIC: Efficiency gains = |baseline - improved| × value per unit (full implementation)
        // Processing speed: |12-120| × 2.5 EUR/invoice = 108 × 2.5 = 270 EUR
        // Accuracy: |100-15| × 45 EUR/error = 85 × 45 = 3825 EUR
        // Total: 270 + 3825 = 4095 EUR
        expect(month6Gains).toBeCloseTo(4095, 0);
      });
    });

    describe('Total Benefits Calculations', () => {
      it('should sum cost savings and efficiency gains', () => {
        const month6Savings = calculateCostSavingsForMonth(costSavingsData, 6);
        const month6Gains = calculateEfficiencyGainsForMonth(costSavingsData, 6);
        const month6Benefits = calculateTotalBenefitsForMonth(costSavingsData, 6);
        
        expect(month6Benefits).toBeCloseTo(month6Savings + month6Gains, 0);
      });
    });

    describe('Cost Savings Monthly Data Generation', () => {
      it('should generate monthly data for cost savings model', () => {
        const monthlyData = generateMonthlyData(costSavingsData);
        
        expect(monthlyData).toHaveLength(36);
        expect(monthlyData[0].baselineCosts).toBeDefined();
        expect(monthlyData[0].costSavings).toBeDefined();
        expect(monthlyData[0].efficiencyGains).toBeDefined();
        expect(monthlyData[0].totalBenefits).toBeDefined();
      });

      it('should use total benefits as revenue for cost savings model', () => {
        const monthlyData = generateMonthlyData(costSavingsData);
        
        expect(monthlyData[6].revenue).toBe(monthlyData[6].totalBenefits);
        expect(monthlyData[6].unitPrice).toBe(0);
        expect(monthlyData[6].salesVolume).toBe(1);
      });

      it('should not set customer fields for cost savings model', () => {
        const monthlyData = generateMonthlyData(costSavingsData);
        
        expect(monthlyData[0].newCustomers).toBe(0);
        expect(monthlyData[0].existingCustomers).toBe(0);
      });
    });

    describe('Cost Savings Business Metrics', () => {
      it('should calculate business metrics for cost savings model', () => {
        const metrics = calculateBusinessMetrics(costSavingsData);
        
        expect(metrics.totalRevenue).toBeGreaterThan(0);
        expect(metrics.npv).toBeDefined();
        expect(metrics.irr).toBeDefined();
        expect(metrics.paybackPeriod).toBeGreaterThan(0);
        expect(metrics.monthlyData).toHaveLength(36);
      });

      it('should show improving performance over time', () => {
        const monthlyData = generateMonthlyData(costSavingsData);
        
        // Benefits should increase as implementation progresses
        expect(monthlyData[6].totalBenefits).toBeGreaterThan(monthlyData[0].totalBenefits);
        expect(monthlyData[12].totalBenefits).toBeGreaterThan(monthlyData[6].totalBenefits);
      });

      it('should handle opex and capex correctly for cost savings', () => {
        const monthlyData = generateMonthlyData(costSavingsData);
        
        // Should have opex from AI platform costs
        expect(monthlyData[0].salesMarketing).toBeLessThan(0);
        expect(monthlyData[0].rd).toBeLessThan(0);
        expect(monthlyData[0].ga).toBeLessThan(0);
        
        // Should have capex in early months
        expect(monthlyData[0].capex).toBeLessThan(0);
        expect(monthlyData[1].capex).toBeLessThan(0);
        expect(monthlyData[2].capex).toBeLessThan(0);
      });
    });

    describe('Edge Cases for Cost Savings', () => {
      it('should handle missing implementation timelines', () => {
        const dataWithoutTimelines = createMockCostSavingsData({
          assumptions: {
            cost_savings: {
              baseline_costs: [
                {
                  id: 'simple_cost',
                  label: 'Simple Cost',
                  category: 'operational',
                  current_monthly_cost: { value: 1000, unit: 'EUR', rationale: 'Test cost' },
                  savings_potential_pct: { value: 50, unit: '%', rationale: 'Test savings' }
                  // No implementation_timeline
                }
              ]
            }
          }
        });
        
        const savings = calculateCostSavingsForMonth(dataWithoutTimelines, 0);
        expect(savings).toBe(500); // Should default to full implementation
      });

      it('should handle zero baseline costs', () => {
        const dataWithZeroCosts = createMockCostSavingsData({
          assumptions: {
            cost_savings: {
              baseline_costs: [
                {
                  id: 'zero_cost',
                  label: 'Zero Cost',
                  category: 'operational',
                  current_monthly_cost: { value: 0, unit: 'EUR', rationale: 'No cost' },
                  savings_potential_pct: { value: 100, unit: '%', rationale: 'Max savings' }
                }
              ]
            }
          }
        });
        
        const savings = calculateCostSavingsForMonth(dataWithZeroCosts, 0);
        expect(savings).toBe(0);
      });

      it('should handle malformed cost savings data', () => {
        const malformedData = createMockCostSavingsData({
          assumptions: {
            cost_savings: undefined
          }
        });
        
        expect(() => calculateCostSavingsForMonth(malformedData, 0)).not.toThrow();
        expect(calculateCostSavingsForMonth(malformedData, 0)).toBe(0);
      });
    });
  });

  describe('Flexible Pricing and Volume', () => {
    describe('Dynamic Unit Price Calculations', () => {
      it('should return base price when no adjustments are configured', () => {
        const data = createMockBusinessData({
          assumptions: {
            pricing: {
              avg_unit_price: { value: 100, unit: 'EUR', rationale: 'Base price' }
            }
          }
        });
        
        expect(calculateDynamicUnitPrice(data, 0)).toBe(100);
        expect(calculateDynamicUnitPrice(data, 11)).toBe(100);
        expect(calculateDynamicUnitPrice(data, 24)).toBe(100);
      });

      it('should apply yearly adjustment factors correctly', () => {
        const data = createMockBusinessData({
          assumptions: {
            pricing: {
              avg_unit_price: { value: 100, unit: 'EUR', rationale: 'Base price' },
              yearly_adjustments: {
                pricing_factors: [
                  { year: 1, factor: 1.0, rationale: 'Year 1 baseline' },
                  { year: 2, factor: 1.05, rationale: 'Year 2: 5% increase' },
                  { year: 3, factor: 1.15, rationale: 'Year 3: 15% increase' }
                ]
              }
            }
          }
        });
        
        // Year 1 (months 0-11)
        expect(calculateDynamicUnitPrice(data, 0)).toBe(100);
        expect(calculateDynamicUnitPrice(data, 11)).toBe(100);
        
        // Year 2 (months 12-23)
        expect(calculateDynamicUnitPrice(data, 12)).toBe(105);
        expect(calculateDynamicUnitPrice(data, 23)).toBe(105);
        
        // Year 3 (months 24-35)
        expect(calculateDynamicUnitPrice(data, 24)).toBe(115);
        expect(calculateDynamicUnitPrice(data, 35)).toBe(115);
      });

      it('should prioritize period overrides over yearly factors', () => {
        const data = createMockBusinessData({
          assumptions: {
            pricing: {
              avg_unit_price: { value: 100, unit: 'EUR', rationale: 'Base price' },
              yearly_adjustments: {
                pricing_factors: [
                  { year: 2, factor: 1.05, rationale: 'Year 2: 5% increase' }
                ],
                price_overrides: [
                  { period: 13, price: 120, rationale: 'Special pricing for month 13' }
                ]
              }
            }
          }
        });
        
        // Month 12 (period 12) should use year 1 base price
        expect(calculateDynamicUnitPrice(data, 11)).toBe(100);
        
        // Month 13 (period 13) should use override
        expect(calculateDynamicUnitPrice(data, 12)).toBe(120); // period 13 is monthIndex 12
        
        // Month 14 (period 14) should return to year 2 yearly factor
        expect(calculateDynamicUnitPrice(data, 13)).toBe(105);
      });

      it('should handle missing yearly factors gracefully', () => {
        const data = createMockBusinessData({
          assumptions: {
            pricing: {
              avg_unit_price: { value: 100, unit: 'EUR', rationale: 'Base price' },
              yearly_adjustments: {
                pricing_factors: [
                  { year: 1, factor: 1.0, rationale: 'Year 1 baseline' }
                  // No year 2 factor
                ]
              }
            }
          }
        });
        
        // Year 2 should fall back to base price
        expect(calculateDynamicUnitPrice(data, 12)).toBe(100);
      });
    });

    describe('Dynamic Volume Calculations', () => {
      it('should apply yearly volume factors correctly', () => {
        const segment = {
          id: 'test',
          label: 'Test Segment',
          rationale: 'Test',
          volume: {
            type: 'pattern',
            pattern_type: 'linear_growth',
            series: [{ period: 1, value: 100, unit: 'customers', rationale: 'Base' }],
            monthly_flat_increase: { value: 0, unit: 'customers', rationale: 'No growth' },
            yearly_adjustments: {
              volume_factors: [
                { year: 1, factor: 1.0, rationale: 'Year 1 baseline' },
                { year: 2, factor: 1.2, rationale: 'Year 2: 20% increase' },
                { year: 3, factor: 0.8, rationale: 'Year 3: 20% decrease' }
              ]
            }
          }
        };
        
        // Year 1 
        expect(calculateDynamicSegmentVolume(segment, 0)).toBe(100);
        expect(calculateDynamicSegmentVolume(segment, 11)).toBe(100);
        
        // Year 2
        expect(calculateDynamicSegmentVolume(segment, 12)).toBe(120);
        expect(calculateDynamicSegmentVolume(segment, 23)).toBe(120);
        
        // Year 3
        expect(calculateDynamicSegmentVolume(segment, 24)).toBe(80);
        expect(calculateDynamicSegmentVolume(segment, 35)).toBe(80);
      });

      it('should prioritize volume overrides over yearly factors', () => {
        const segment = {
          id: 'test',
          label: 'Test Segment',
          rationale: 'Test',
          volume: {
            type: 'pattern',
            pattern_type: 'linear_growth',
            series: [{ period: 1, value: 100, unit: 'customers', rationale: 'Base' }],
            monthly_flat_increase: { value: 0, unit: 'customers', rationale: 'No growth' },
            yearly_adjustments: {
              volume_factors: [
                { year: 2, factor: 1.2, rationale: 'Year 2: 20% increase' }
              ],
              volume_overrides: [
                { period: 13, volume: 150, rationale: 'Special volume for month 13' }
              ]
            }
          }
        };
        
        // Month 12 (period 12) should use year 1 base volume
        expect(calculateDynamicSegmentVolume(segment, 11)).toBe(100);
        
        // Month 13 (period 13) should use override
        expect(calculateDynamicSegmentVolume(segment, 12)).toBe(150); // period 13 is monthIndex 12
        
        // Month 14 (period 14) should return to year 2 yearly factor
        expect(calculateDynamicSegmentVolume(segment, 13)).toBe(120);
      });

      it('should work with complex growth patterns', () => {
        const segment = {
          id: 'test',
          label: 'Test Segment',
          rationale: 'Test',
          volume: {
            type: 'pattern',
            pattern_type: 'geom_growth',
            series: [{ period: 1, value: 100, unit: 'customers', rationale: 'Base' }],
            monthly_growth_rate: { value: 0.02, unit: '%', rationale: '2% monthly growth' },
            yearly_adjustments: {
              volume_factors: [
                { year: 2, factor: 1.5, rationale: 'Year 2: Market expansion' }
              ]
            }
          }
        };
        
        // Month 0 (Year 1): Base volume with growth
        const baseVolumeMonth0 = calculateSegmentVolumeForMonth(segment, 0);
        expect(calculateDynamicSegmentVolume(segment, 0)).toBeCloseTo(baseVolumeMonth0, 2);
        
        // Month 12 (Year 2): Growth pattern + yearly factor
        const baseVolumeMonth12 = calculateSegmentVolumeForMonth(segment, 12);
        expect(calculateDynamicSegmentVolume(segment, 12)).toBeCloseTo(baseVolumeMonth12 * 1.5, 2);
      });
    });

    describe('Dynamic Total Volume Calculations', () => {
      it('should sum dynamic volumes from multiple segments', () => {
        const data = createMockBusinessData({
          assumptions: {
            customers: {
              segments: [
                {
                  id: 'segment1',
                  label: 'Segment 1',
                  rationale: 'Primary segment',
                  volume: {
                    type: 'pattern',
                    pattern_type: 'linear_growth',
                    series: [{ period: 1, value: 100, unit: 'customers', rationale: 'Base' }],
                    monthly_flat_increase: { value: 0, unit: 'customers', rationale: 'No growth' },
                    yearly_adjustments: {
                      volume_factors: [
                        { year: 2, factor: 1.2, rationale: 'Year 2: 20% increase' }
                      ]
                    }
                  }
                },
                {
                  id: 'segment2',
                  label: 'Segment 2',
                  rationale: 'Secondary segment',
                  volume: {
                    type: 'pattern',
                    pattern_type: 'linear_growth',
                    series: [{ period: 1, value: 50, unit: 'customers', rationale: 'Base' }],
                    monthly_flat_increase: { value: 0, unit: 'customers', rationale: 'No growth' },
                    yearly_adjustments: {
                      volume_factors: [
                        { year: 2, factor: 0.8, rationale: 'Year 2: 20% decrease' }
                      ]
                    }
                  }
                }
              ]
            }
          }
        });
        
        // Year 1: 100 + 50 = 150
        expect(calculateDynamicTotalVolumeForMonth(data, 0)).toBe(150);
        
        // Year 2: (100 * 1.2) + (50 * 0.8) = 120 + 40 = 160
        expect(calculateDynamicTotalVolumeForMonth(data, 12)).toBe(160);
      });
    });

    describe('Trajectory Functions', () => {
      it('should generate pricing trajectory with source indicators', () => {
        const data = createMockBusinessData({
          assumptions: {
            pricing: {
              avg_unit_price: { value: 100, unit: 'EUR', rationale: 'Base price' },
              yearly_adjustments: {
                pricing_factors: [
                  { year: 2, factor: 1.05, rationale: 'Year 2: 5% increase' }
                ],
                price_overrides: [
                  { period: 25, price: 120, rationale: 'Special pricing' }
                ]
              }
            }
          }
        });
        
        const trajectory = getPricingTrajectory(data, 36);
        
        expect(trajectory).toHaveLength(36);
        
        // Check some specific points
        expect(trajectory[0]).toEqual({ period: 1, price: 100, source: 'base' });
        expect(trajectory[11]).toEqual({ period: 12, price: 100, source: 'base' });
        expect(trajectory[12]).toEqual({ period: 13, price: 105, source: 'yearly' });
        expect(trajectory[24]).toEqual({ period: 25, price: 120, source: 'override' });
      });

      it('should generate volume trajectory with source indicators', () => {
        const segment = {
          id: 'test',
          label: 'Test Segment',
          rationale: 'Test',
          volume: {
            type: 'pattern',
            pattern_type: 'linear_growth',
            series: [{ period: 1, value: 100, unit: 'customers', rationale: 'Base' }],
            monthly_flat_increase: { value: 5, unit: 'customers', rationale: '5 per month' },
            yearly_adjustments: {
              volume_factors: [
                { year: 2, factor: 1.2, rationale: 'Year 2: 20% increase' }
              ],
              volume_overrides: [
                { period: 25, volume: 200, rationale: 'Special volume' }
              ]
            }
          }
        };
        
        const trajectory = getVolumeTrajectory(segment, 36);
        
        expect(trajectory).toHaveLength(36);
        
        // Check source classifications
        expect(trajectory[0].source).toBe('pattern');
        expect(trajectory[12].source).toBe('yearly'); // Should be different from base due to factor
        expect(trajectory[24].source).toBe('override');
      });
    });

    describe('Integration with Monthly Data Generation', () => {
      it('should use dynamic pricing in monthly data generation', () => {
        const data = createMockBusinessData({
          assumptions: {
            pricing: {
              avg_unit_price: { value: 100, unit: 'EUR', rationale: 'Base price' },
              yearly_adjustments: {
                pricing_factors: [
                  { year: 1, factor: 1.0, rationale: 'Year 1 baseline' },
                  { year: 2, factor: 1.1, rationale: 'Year 2: 10% increase' }
                ]
              }
            }
          }
        });
        
        const monthlyData = generateMonthlyData(data);
        
        // Check that pricing varies by year
        expect(monthlyData[0].unitPrice).toBe(100); // Month 1
        expect(monthlyData[11].unitPrice).toBe(100); // Month 12
        expect(monthlyData[12].unitPrice).toBe(110); // Month 13 (Year 2)
        expect(monthlyData[23].unitPrice).toBe(110); // Month 24
      });

      it('should use dynamic volume in revenue calculations', () => {
        const data = createMockBusinessData({
          assumptions: {
            pricing: {
              avg_unit_price: { value: 100, unit: 'EUR', rationale: 'Base price' }
            },
            customers: {
              segments: [
                {
                  id: 'segment1',
                  label: 'Test Segment',
                  rationale: 'Test',
                  volume: {
                    type: 'pattern',
                    pattern_type: 'linear_growth',
                    series: [{ period: 1, value: 100, unit: 'customers', rationale: 'Base' }],
                    monthly_flat_increase: { value: 0, unit: 'customers', rationale: 'No growth' },
                    yearly_adjustments: {
                      volume_factors: [
                        { year: 2, factor: 1.5, rationale: 'Year 2: 50% increase' }
                      ]
                    }
                  }
                }
              ]
            }
          }
        });
        
        const monthlyData = generateMonthlyData(data);
        
        // Year 1: 100 customers * €100 = €10,000
        expect(monthlyData[0].revenue).toBe(10000);
        expect(monthlyData[0].salesVolume).toBe(100);
        
        // Year 2: 150 customers * €100 = €15,000
        expect(monthlyData[12].revenue).toBe(15000);
        expect(monthlyData[12].salesVolume).toBe(150);
      });

      it('should handle combined pricing and volume changes', () => {
        const data = createMockBusinessData({
          assumptions: {
            pricing: {
              avg_unit_price: { value: 100, unit: 'EUR', rationale: 'Base price' },
              yearly_adjustments: {
                pricing_factors: [
                  { year: 2, factor: 1.2, rationale: 'Year 2: 20% price increase' }
                ]
              }
            },
            customers: {
              segments: [
                {
                  id: 'segment1',
                  label: 'Test Segment',
                  rationale: 'Test',
                  volume: {
                    type: 'pattern',
                    pattern_type: 'linear_growth',
                    series: [{ period: 1, value: 100, unit: 'customers', rationale: 'Base' }],
                    monthly_flat_increase: { value: 0, unit: 'customers', rationale: 'No growth' },
                    yearly_adjustments: {
                      volume_factors: [
                        { year: 2, factor: 1.5, rationale: 'Year 2: 50% volume increase' }
                      ]
                    }
                  }
                }
              ]
            }
          }
        });
        
        const monthlyData = generateMonthlyData(data);
        
        // Year 1: 100 customers * €100 = €10,000
        expect(monthlyData[0].revenue).toBe(10000);
        
        // Year 2: 150 customers * €120 = €18,000
        expect(monthlyData[12].revenue).toBe(18000);
        expect(monthlyData[12].salesVolume).toBe(150);
        expect(monthlyData[12].unitPrice).toBe(120);
      });
    });

    describe('Edge Cases for Flexible Pricing and Volume', () => {
      it('should handle missing yearly adjustments gracefully', () => {
        const data = createMockBusinessData({
          assumptions: {
            pricing: {
              avg_unit_price: { value: 100, unit: 'EUR', rationale: 'Base price' }
              // No yearly_adjustments
            }
          }
        });
        
        expect(calculateDynamicUnitPrice(data, 0)).toBe(100);
        expect(calculateDynamicUnitPrice(data, 12)).toBe(100);
        expect(calculateDynamicUnitPrice(data, 24)).toBe(100);
      });

      it('should handle zero base prices', () => {
        const data = createMockBusinessData({
          assumptions: {
            pricing: {
              avg_unit_price: { value: 0, unit: 'EUR', rationale: 'Free tier' },
              yearly_adjustments: {
                pricing_factors: [
                  { year: 2, factor: 1.5, rationale: 'Year 2: introduce pricing' }
                ]
              }
            }
          }
        });
        
        expect(calculateDynamicUnitPrice(data, 0)).toBe(0);
        expect(calculateDynamicUnitPrice(data, 12)).toBe(0); // 0 * 1.5 = 0
      });

      it('should handle negative adjustment factors', () => {
        const segment = {
          id: 'test',
          label: 'Test Segment',
          rationale: 'Test',
          volume: {
            type: 'pattern',
            pattern_type: 'linear_growth',
            series: [{ period: 1, value: 100, unit: 'customers', rationale: 'Base' }],
            yearly_adjustments: {
              volume_factors: [
                { year: 2, factor: -0.5, rationale: 'Extreme market decline' }
              ]
            }
          }
        };
        
        expect(() => calculateDynamicSegmentVolume(segment, 12)).not.toThrow();
        expect(calculateDynamicSegmentVolume(segment, 12)).toBe(-50); // Negative volume
      });
    });
  });

  describe('New Segment Pattern Functions', () => {
    describe('calculateSegmentSeasonalPattern', () => {
      it('should calculate seasonal pattern correctly', () => {
        const volume = {
          base_value: 100,
          seasonal_pattern: [1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 1.3, 1.5]
        };

        // Test first month (index 0)
        expect(calculateSegmentSeasonalPattern(volume, 0)).toBe(120); // 100 * 1.2
        
        // Test mid-year month (index 6) 
        expect(calculateSegmentSeasonalPattern(volume, 6)).toBe(80); // 100 * 0.8
        
        // Test end of year (index 11)
        expect(calculateSegmentSeasonalPattern(volume, 11)).toBe(150); // 100 * 1.5
        
        // Test pattern repeats in second year (index 12 = month 0 of year 2)
        expect(calculateSegmentSeasonalPattern(volume, 12)).toBe(120); // 100 * 1.2
      });

      it('should handle missing seasonal pattern', () => {
        const volume = {
          base_value: 100,
          seasonal_pattern: []
        };

        expect(calculateSegmentSeasonalPattern(volume, 0)).toBe(100); // Returns base_value
      });

      it('should handle missing base_value', () => {
        const volume = {
          seasonal_pattern: [1.2, 1.1, 1.0]
        };

        expect(calculateSegmentSeasonalPattern(volume, 0)).toBe(0); // Returns 0
      });
    });

    describe('calculateSegmentGeometricGrowth', () => {
      it('should calculate geometric growth correctly', () => {
        const volume = {
          base_value: 100,
          growth_rate: 0.08 // 8% monthly growth
        };

        // Test first month (index 0)
        expect(calculateSegmentGeometricGrowth(volume, 0)).toBe(100); // 100 * (1.08)^0
        
        // Test second month (index 1)
        expect(calculateSegmentGeometricGrowth(volume, 1)).toBeCloseTo(108); // 100 * (1.08)^1
        
        // Test after 12 months (index 12)
        const expected12 = 100 * Math.pow(1.08, 12);
        expect(calculateSegmentGeometricGrowth(volume, 12)).toBeCloseTo(expected12);
      });

      it('should handle zero growth rate', () => {
        const volume = {
          base_value: 100,
          growth_rate: 0
        };

        expect(calculateSegmentGeometricGrowth(volume, 0)).toBe(100);
        expect(calculateSegmentGeometricGrowth(volume, 12)).toBe(100); // No growth
      });

      it('should handle negative growth rate', () => {
        const volume = {
          base_value: 100,
          growth_rate: -0.05 // 5% monthly decline
        };

        expect(calculateSegmentGeometricGrowth(volume, 1)).toBeCloseTo(95); // 100 * 0.95
      });

      it('should handle missing values', () => {
        const volume = {};

        expect(calculateSegmentGeometricGrowth(volume, 0)).toBe(0);
      });
    });
  });

  describe('Variable OPEX Calculations', () => {
    describe('calculateOpexForMonth', () => {
      it('should handle legacy fixed-only OPEX format (backwards compatibility)', () => {
        const businessData = createMockBusinessData({
          assumptions: {
            opex: [
              { name: "Sales & Marketing", value: { value: 5000, unit: "EUR_per_month", rationale: "Fixed S&M cost" } },
              { name: "R&D", value: { value: 10000, unit: "EUR_per_month", rationale: "Fixed R&D cost" } },
              { name: "G&A", value: { value: 3000, unit: "EUR_per_month", rationale: "Fixed G&A cost" } }
            ]
          }
        });
        
        const result = calculateOpexForMonth(businessData, 0, 100000, 500);
        
        expect(result.salesMarketing).toBe(5000);
        expect(result.rd).toBe(10000);
        expect(result.ga).toBe(3000);
        expect(result.totalOpex).toBe(18000);
      });

      it('should calculate revenue-based variable OPEX', () => {
        const businessData = createMockBusinessData({
          assumptions: {
            opex: [
              { 
                name: "Sales & Marketing", 
                cost_structure: {
                  fixed_component: { value: 5000, unit: "EUR_per_month", rationale: "Base S&M cost" },
                  variable_revenue_rate: { value: 0.10, unit: "percentage_of_revenue", rationale: "10% of revenue for marketing" }
                }
              },
              { name: "R&D", value: { value: 10000, unit: "EUR_per_month", rationale: "Fixed R&D" } },
              { name: "G&A", value: { value: 3000, unit: "EUR_per_month", rationale: "Fixed G&A" } }
            ]
          }
        });
        
        const revenue = 100000;
        const result = calculateOpexForMonth(businessData, 0, revenue, 500);
        
        // S&M should be: 5000 (fixed) + 100000 * 0.10 (variable) = 15000
        expect(result.salesMarketing).toBe(15000);
        expect(result.rd).toBe(10000);
        expect(result.ga).toBe(3000);
        expect(result.totalOpex).toBe(28000);
      });

      it('should calculate volume-based variable OPEX', () => {
        const businessData = createMockBusinessData({
          assumptions: {
            opex: [
              { name: "Sales & Marketing", value: { value: 5000, unit: "EUR_per_month", rationale: "Fixed" } },
              { name: "R&D", value: { value: 10000, unit: "EUR_per_month", rationale: "Fixed" } },
              { 
                name: "G&A", 
                cost_structure: {
                  fixed_component: { value: 3000, unit: "EUR_per_month", rationale: "Base G&A cost" },
                  variable_volume_rate: { value: 15, unit: "EUR_per_customer", rationale: "Support cost per customer" }
                }
              }
            ]
          }
        });
        
        const volume = 500;
        const result = calculateOpexForMonth(businessData, 0, 100000, volume);
        
        expect(result.salesMarketing).toBe(5000);
        expect(result.rd).toBe(10000);
        // G&A should be: 3000 (fixed) + 500 * 15 (variable) = 10500
        expect(result.ga).toBe(10500);
        expect(result.totalOpex).toBe(25500);
      });

      it('should calculate mixed fixed + revenue + volume OPEX', () => {
        const businessData = createMockBusinessData({
          assumptions: {
            opex: [
              { 
                name: "Sales & Marketing", 
                cost_structure: {
                  fixed_component: { value: 5000, unit: "EUR_per_month", rationale: "Base cost" },
                  variable_revenue_rate: { value: 0.10, unit: "percentage_of_revenue", rationale: "10% of revenue" },
                  variable_volume_rate: { value: 20, unit: "EUR_per_customer", rationale: "20 per customer" }
                }
              },
              { 
                name: "R&D", 
                cost_structure: {
                  fixed_component: { value: 20000, unit: "EUR_per_month", rationale: "Base R&D" },
                  variable_revenue_rate: { value: 0.08, unit: "percentage_of_revenue", rationale: "8% of revenue" }
                }
              },
              { 
                name: "G&A", 
                cost_structure: {
                  fixed_component: { value: 3000, unit: "EUR_per_month", rationale: "Base G&A" },
                  variable_volume_rate: { value: 15, unit: "EUR_per_customer", rationale: "15 per customer" }
                }
              }
            ]
          }
        });
        
        const revenue = 100000;
        const volume = 500;
        const result = calculateOpexForMonth(businessData, 0, revenue, volume);
        
        // S&M: 5000 + (100000 * 0.10) + (500 * 20) = 5000 + 10000 + 10000 = 25000
        expect(result.salesMarketing).toBe(25000);
        
        // R&D: 20000 + (100000 * 0.08) = 20000 + 8000 = 28000
        expect(result.rd).toBe(28000);
        
        // G&A: 3000 + (500 * 15) = 3000 + 7500 = 10500
        expect(result.ga).toBe(10500);
        
        expect(result.totalOpex).toBe(63500);
      });

      it('should handle zero revenue gracefully', () => {
        const businessData = createMockBusinessData({
          assumptions: {
            opex: [
              { 
                name: "Sales & Marketing", 
                cost_structure: {
                  fixed_component: { value: 5000, unit: "EUR_per_month", rationale: "Base" },
                  variable_revenue_rate: { value: 0.10, unit: "percentage_of_revenue", rationale: "10%" }
                }
              },
              { name: "R&D", value: { value: 10000, unit: "EUR_per_month", rationale: "Fixed" } },
              { name: "G&A", value: { value: 3000, unit: "EUR_per_month", rationale: "Fixed" } }
            ]
          }
        });
        
        const result = calculateOpexForMonth(businessData, 0, 0, 100);
        
        // Only fixed component should apply
        expect(result.salesMarketing).toBe(5000);
        expect(result.rd).toBe(10000);
        expect(result.ga).toBe(3000);
        expect(result.totalOpex).toBe(18000);
      });

      it('should handle zero volume gracefully', () => {
        const businessData = createMockBusinessData({
          assumptions: {
            opex: [
              { name: "Sales & Marketing", value: { value: 5000, unit: "EUR_per_month", rationale: "Fixed" } },
              { name: "R&D", value: { value: 10000, unit: "EUR_per_month", rationale: "Fixed" } },
              { 
                name: "G&A", 
                cost_structure: {
                  fixed_component: { value: 3000, unit: "EUR_per_month", rationale: "Base" },
                  variable_volume_rate: { value: 15, unit: "EUR_per_customer", rationale: "Per customer" }
                }
              }
            ]
          }
        });
        
        const result = calculateOpexForMonth(businessData, 0, 100000, 0);
        
        expect(result.salesMarketing).toBe(5000);
        expect(result.rd).toBe(10000);
        // Only fixed component for G&A
        expect(result.ga).toBe(3000);
        expect(result.totalOpex).toBe(18000);
      });

      it('should handle missing opex array', () => {
        const businessData = createMockBusinessData({
          assumptions: {}
        });
        
        const result = calculateOpexForMonth(businessData, 0, 100000, 500);
        
        expect(result.salesMarketing).toBe(0);
        expect(result.rd).toBe(0);
        expect(result.ga).toBe(0);
        expect(result.totalOpex).toBe(0);
      });

      it('should handle fixed-only cost_structure (no variable components)', () => {
        const businessData = createMockBusinessData({
          assumptions: {
            opex: [
              { 
                name: "Sales & Marketing", 
                cost_structure: {
                  fixed_component: { value: 5000, unit: "EUR_per_month", rationale: "Base only" }
                }
              },
              { name: "R&D", value: { value: 10000, unit: "EUR_per_month", rationale: "Fixed" } },
              { name: "G&A", value: { value: 3000, unit: "EUR_per_month", rationale: "Fixed" } }
            ]
          }
        });
        
        const result = calculateOpexForMonth(businessData, 0, 100000, 500);
        
        expect(result.salesMarketing).toBe(5000);
        expect(result.rd).toBe(10000);
        expect(result.ga).toBe(3000);
        expect(result.totalOpex).toBe(18000);
      });

      it('should round OPEX values to whole numbers', () => {
        const businessData = createMockBusinessData({
          assumptions: {
            opex: [
              { 
                name: "Sales & Marketing", 
                cost_structure: {
                  fixed_component: { value: 5000.75, unit: "EUR_per_month", rationale: "Base" },
                  variable_revenue_rate: { value: 0.103, unit: "percentage_of_revenue", rationale: "10.3%" }
                }
              },
              { name: "R&D", value: { value: 10000, unit: "EUR_per_month", rationale: "Fixed" } },
              { name: "G&A", value: { value: 3000, unit: "EUR_per_month", rationale: "Fixed" } }
            ]
          }
        });
        
        const revenue = 10000;
        const result = calculateOpexForMonth(businessData, 0, revenue, 0);
        
        // 5000.75 + (10000 * 0.103) = 5000.75 + 1030 = 6030.75, rounded to 6031
        expect(result.salesMarketing).toBe(Math.round(5000.75 + 1030));
        expect(Number.isInteger(result.salesMarketing)).toBe(true);
        expect(Number.isInteger(result.rd)).toBe(true);
        expect(Number.isInteger(result.ga)).toBe(true);
      });
    });

    describe('Integration with generateMonthlyData', () => {
      it('should use variable OPEX in monthly data generation', () => {
        const businessData = createMockBusinessData({
          meta: {
            title: 'Variable OPEX Test',
            description: 'Testing variable OPEX',
            business_model: 'recurring',
            currency: 'EUR',
            periods: 12,
            frequency: 'monthly'
          },
          assumptions: {
            pricing: {
              avg_unit_price: { value: 100, unit: "EUR_per_month", rationale: "Subscription price" }
            },
            customers: {
              segments: [
                {
                  id: "segment1",
                  label: "Main Segment",
                  rationale: "Primary customer base",
                  volume: {
                    type: "pattern",
                    pattern_type: "linear_growth",
                    series: [{ period: 1, value: 100, unit: "customers", rationale: "Start" }]
                  }
                }
              ]
            },
            opex: [
              { 
                name: "Sales & Marketing", 
                cost_structure: {
                  fixed_component: { value: 5000, unit: "EUR_per_month", rationale: "Base" },
                  variable_revenue_rate: { value: 0.10, unit: "percentage_of_revenue", rationale: "10%" }
                }
              },
              { 
                name: "R&D", 
                cost_structure: {
                  fixed_component: { value: 10000, unit: "EUR_per_month", rationale: "Base" }
                }
              },
              { 
                name: "G&A", 
                cost_structure: {
                  fixed_component: { value: 3000, unit: "EUR_per_month", rationale: "Base" },
                  variable_volume_rate: { value: 10, unit: "EUR_per_customer", rationale: "Per customer" }
                }
              }
            ]
          }
        });
        
        const monthlyData = generateMonthlyData(businessData);
        
        expect(monthlyData).toHaveLength(12);
        
        // Month 1: 100 customers * 100 EUR = 10,000 revenue
        const month1 = monthlyData[0];
        expect(month1.salesMarketing).toBeLessThan(0); // Should be negative
        // S&M: -(5000 + 10000 * 0.10) = -(5000 + 1000) = -6000
        expect(Math.abs(month1.salesMarketing)).toBe(6000);
        // R&D: -10000
        expect(Math.abs(month1.rd)).toBe(10000);
        // G&A: -(3000 + 100 * 10) = -(3000 + 1000) = -4000
        expect(Math.abs(month1.ga)).toBe(4000);
        
        // Verify OPEX scales with growth
        const lastMonth = monthlyData[11];
        // If revenue grows, S&M should grow too
        if (lastMonth.revenue > month1.revenue) {
          expect(Math.abs(lastMonth.salesMarketing)).toBeGreaterThan(Math.abs(month1.salesMarketing));
        }
      });

      it('should maintain backwards compatibility with old format in monthly data', () => {
        const businessData = createMockBusinessData({
          assumptions: {
            opex: [
              { name: "Sales & Marketing", value: { value: 5000, unit: "EUR_per_month", rationale: "Fixed" } },
              { name: "R&D", value: { value: 10000, unit: "EUR_per_month", rationale: "Fixed" } },
              { name: "G&A", value: { value: 3000, unit: "EUR_per_month", rationale: "Fixed" } }
            ]
          }
        });
        
        const monthlyData = generateMonthlyData(businessData);
        
        expect(monthlyData.length).toBeGreaterThan(0);
        
        // All months should have the same fixed OPEX
        monthlyData.forEach(month => {
          expect(Math.abs(month.salesMarketing)).toBe(5000);
          expect(Math.abs(month.rd)).toBe(10000);
          expect(Math.abs(month.ga)).toBe(3000);
        });
      });
    });
  });
});
