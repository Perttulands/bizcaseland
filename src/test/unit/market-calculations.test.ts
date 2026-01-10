import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateMarketTAM,
  calculateMarketSAM,
  calculateMarketSOM,
  calculateMarketShareProgression,
  calculateMarketBasedVolumeProjection,
  getMarketAnalysisMetrics,
  getMarketPenetrationTrajectory,
  validateMarketAnalysis,
  calculateMarketOpportunityScore,
  formatMarketCurrency,
  formatMarketPercent,
} from '@/core/engine/calculators/market-calculator';
import type { MarketData } from '@/core/types/market';
import { createMockMarketData } from '@/test/mockData';

describe('Market Calculations Engine', () => {
  let mockMarketData: MarketData;

  beforeEach(() => {
    mockMarketData = createMockMarketData();
  });

  describe('calculateMarketTAM', () => {
    it('should calculate TAM for base year correctly', () => {
      const tam = calculateMarketTAM(mockMarketData, 2024);
      expect(tam).toBe(2500000000); // Base value
    });

    it('should calculate TAM with growth for future years', () => {
      const tam2025 = calculateMarketTAM(mockMarketData, 2025);
      const tam2026 = calculateMarketTAM(mockMarketData, 2026);
      
      // With 12% growth rate
      expect(tam2025).toBeCloseTo(2500000000 * 1.12);
      expect(tam2026).toBeCloseTo(2500000000 * Math.pow(1.12, 2));
    });

    it('should handle missing market data gracefully', () => {
      const emptyData: MarketData = {};
      const tam = calculateMarketTAM(emptyData, 2024);
      expect(tam).toBe(0);
    });

    it('should handle past years correctly', () => {
      const tam2023 = calculateMarketTAM(mockMarketData, 2023);
      expect(tam2023).toBeCloseTo(2500000000 / 1.12);
    });
  });

  describe('calculateMarketSAM', () => {
    it('should calculate SAM as percentage of TAM', () => {
      const sam = calculateMarketSAM(mockMarketData, 2024);
      const expectedSam = 2500000000 * 0.08; // 8% of TAM
      expect(sam).toBeCloseTo(expectedSam);
    });

    it('should grow with TAM over time', () => {
      const sam2025 = calculateMarketSAM(mockMarketData, 2025);
      const tam2025 = calculateMarketTAM(mockMarketData, 2025);
      expect(sam2025).toBeCloseTo(tam2025 * 0.08);
    });

    it('should return zero for invalid data', () => {
      const invalidData = createMockMarketData({
        market_sizing: {
          serviceable_addressable_market: {
            percentage_of_tam: { value: 0, unit: 'percentage', rationale: 'Test' },
            geographic_constraints: '',
            regulatory_constraints: '',
            capability_constraints: ''
          }
        }
      });
      const sam = calculateMarketSAM(invalidData, 2024);
      expect(sam).toBe(0);
    });
  });

  describe('calculateMarketSOM', () => {
    it('should calculate SOM as percentage of SAM', () => {
      const som = calculateMarketSOM(mockMarketData, 2024);
      const sam = calculateMarketSAM(mockMarketData, 2024);
      const expectedSom = sam * 0.15; // 15% of SAM
      expect(som).toBeCloseTo(expectedSom);
    });

    it('should maintain proportion across years', () => {
      const som2024 = calculateMarketSOM(mockMarketData, 2024);
      const som2025 = calculateMarketSOM(mockMarketData, 2025);
      
      // SOM should grow at same rate as TAM
      expect(som2025 / som2024).toBeCloseTo(1.12);
    });
  });

  describe('calculateMarketShareProgression', () => {
    it('should return current share at time zero', () => {
      const share = calculateMarketShareProgression(mockMarketData, 0);
      expect(share).toBeCloseTo(0.001); // 0.1% as decimal
    });

    it('should progress towards target share over time with linear strategy', () => {
      const linearData = createMockMarketData({
        market_share: {
          current_position: {
            current_share: { value: 0.1, unit: 'percentage', rationale: 'Test' },
            market_entry_date: '2024-01-01',
            current_revenue: { value: 250000, unit: 'EUR_per_year', rationale: 'Test' }
          },
          target_position: {
            target_share: { value: 2.5, unit: 'percentage', rationale: 'Test' },
            target_timeframe: { value: 5, unit: 'years', rationale: 'Test' },
            penetration_strategy: 'linear',
            key_milestones: []
          }
        }
      });

      const shareYear1 = calculateMarketShareProgression(linearData, 12); // 1 year
      const shareYear5 = calculateMarketShareProgression(linearData, 60); // 5 years
      
      expect(shareYear1).toBeCloseTo(0.001 + (0.025 - 0.001) * 0.2); // 20% progress
      expect(shareYear5).toBeCloseTo(0.025); // Should reach target
    });

    it('should handle exponential penetration strategy', () => {
      const exponentialData = createMockMarketData({
        market_share: {
          current_position: {
            current_share: { value: 0.1, unit: 'percentage', rationale: 'Test' },
            market_entry_date: '2024-01-01',
            current_revenue: { value: 250000, unit: 'EUR_per_year', rationale: 'Test' }
          },
          target_position: {
            target_share: { value: 2.5, unit: 'percentage', rationale: 'Test' },
            target_timeframe: { value: 5, unit: 'years', rationale: 'Test' },
            penetration_strategy: 'exponential',
            key_milestones: []
          }
        }
      });

      const shareYear1 = calculateMarketShareProgression(exponentialData, 12);
      const shareYear3 = calculateMarketShareProgression(exponentialData, 36);
      
      // Exponential should grow faster early
      expect(shareYear1).toBeGreaterThan(0.001);
      expect(shareYear3).toBeGreaterThan(shareYear1);
    });

    it('should cap progression at target share', () => {
      const share = calculateMarketShareProgression(mockMarketData, 120); // 10 years
      expect(share).toBeCloseTo(0.025); // Should not exceed target
    });
  });

  describe('calculateMarketBasedVolumeProjection', () => {
    it('should return zero as volume calculations moved to business case integration', () => {
      // Volume calculations now require integration with business case data
      // Market analysis focuses on opportunity sizing, not unit economics
      const volume = calculateMarketBasedVolumeProjection(mockMarketData, 0);
      expect(volume).toBe(0);
    });

    it('should return zero regardless of market data', () => {
      // Function intentionally returns 0 as volume calculations were removed
      const emptyData = createMockMarketData({});
      
      const volume = calculateMarketBasedVolumeProjection(emptyData, 0);
      expect(volume).toBe(0);
    });

    it('should return zero for all time periods', () => {
      // Function now returns 0 - volume projection moved to business case calculations
      const volume0 = calculateMarketBasedVolumeProjection(mockMarketData, 0);
      const volume12 = calculateMarketBasedVolumeProjection(mockMarketData, 12);
      const volume24 = calculateMarketBasedVolumeProjection(mockMarketData, 24);
      
      expect(volume0).toBe(0);
      expect(volume12).toBe(0);
      expect(volume24).toBe(0);
    });
  });

  describe('getMarketAnalysisMetrics', () => {
    it('should return comprehensive market metrics', () => {
      const metrics = getMarketAnalysisMetrics(mockMarketData, 12);
      
      expect(metrics).toHaveProperty('year', 2025);
      expect(metrics).toHaveProperty('tam');
      expect(metrics).toHaveProperty('sam');
      expect(metrics).toHaveProperty('som');
      expect(metrics).toHaveProperty('marketShare');
      expect(metrics).toHaveProperty('marketBasedVolume');
      expect(metrics).toHaveProperty('marketValue');
      expect(metrics).toHaveProperty('competitivePosition');
      
      expect(metrics.tam).toBeGreaterThan(0);
      expect(metrics.sam).toBeLessThan(metrics.tam);
      expect(metrics.som).toBeLessThan(metrics.sam);
    });

    it('should include competitive analysis', () => {
      const metrics = getMarketAnalysisMetrics(mockMarketData, 0);
      
      expect(metrics.competitivePosition).toHaveProperty('ourShare');
      expect(metrics.competitivePosition).toHaveProperty('competitorShares');
      expect(metrics.competitivePosition).toHaveProperty('marketConcentration');
      
      expect(metrics.competitivePosition.competitorShares).toHaveLength(2);
      expect(metrics.competitivePosition.marketConcentration).toBeGreaterThan(0);
    });

    it('should calculate Herfindahl Index correctly', () => {
      const metrics = getMarketAnalysisMetrics(mockMarketData, 0);
      
      // HHI should be sum of squared market shares
      const ourShare = metrics.competitivePosition.ourShare;
      const competitorShares = metrics.competitivePosition.competitorShares;
      
      const expectedHHI = Math.pow(ourShare, 2) + 
                         competitorShares.reduce((sum, comp) => sum + Math.pow(comp.share, 2), 0);
      
      expect(metrics.competitivePosition.marketConcentration).toBeCloseTo(expectedHHI);
    });
  });

  describe('getMarketPenetrationTrajectory', () => {
    it('should generate trajectory for specified periods', () => {
      const trajectory = getMarketPenetrationTrajectory(mockMarketData, 24);
      
      expect(trajectory).toHaveLength(24);
      
      trajectory.forEach((period, index) => {
        expect(period.period).toBe(index + 1);
        expect(period.year).toBeGreaterThanOrEqual(2024);
        expect(period.tam).toBeGreaterThan(0);
        expect(period.sam).toBeGreaterThan(0);
        expect(period.som).toBeGreaterThan(0);
        expect(period.marketShare).toBeGreaterThanOrEqual(0);
        expect(period.marketBasedVolume).toBeGreaterThanOrEqual(0);
        expect(period.cumulativeVolume).toBeGreaterThanOrEqual(period.marketBasedVolume);
      });
    });

    it('should show growing cumulative volume', () => {
      const trajectory = getMarketPenetrationTrajectory(mockMarketData, 12);
      
      for (let i = 1; i < trajectory.length; i++) {
        expect(trajectory[i].cumulativeVolume).toBeGreaterThanOrEqual(trajectory[i-1].cumulativeVolume);
      }
    });

    it('should handle empty periods gracefully', () => {
      const trajectory = getMarketPenetrationTrajectory(mockMarketData, 0);
      expect(trajectory).toHaveLength(0);
    });
  });

  describe('validateMarketAnalysis', () => {
    it('should validate correct market data', () => {
      const validation = validateMarketAnalysis(mockMarketData);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing TAM base value', () => {
      const invalidData = createMockMarketData({
        market_sizing: {
          total_addressable_market: {
            base_value: { value: 0, unit: 'EUR', rationale: 'Test' },
            growth_rate: { value: 12, unit: 'percentage_per_year', rationale: 'Test' },
            market_definition: 'Test',
            data_sources: ['Test']
          }
        }
      });
      
      const validation = validateMarketAnalysis(invalidData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Total Addressable Market base value is required');
    });

    it('should detect invalid SAM percentage', () => {
      const invalidData = createMockMarketData({
        market_sizing: {
          serviceable_addressable_market: {
            percentage_of_tam: { value: 150, unit: 'percentage', rationale: 'Test' },
            geographic_constraints: '',
            regulatory_constraints: '',
            capability_constraints: ''
          }
        }
      });
      
      const validation = validateMarketAnalysis(invalidData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Serviceable Addressable Market percentage must be between 0 and 100');
    });

    it('should detect invalid SOM percentage', () => {
      const invalidData = createMockMarketData({
        market_sizing: {
          serviceable_obtainable_market: {
            percentage_of_sam: { value: -5, unit: 'percentage', rationale: 'Test' },
            resource_constraints: '',
            competitive_barriers: '',
            time_constraints: ''
          }
        }
      });
      
      const validation = validateMarketAnalysis(invalidData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Serviceable Obtainable Market percentage must be between 0 and 100');
    });

    it('should warn about unrealistic target market share', () => {
      const unrealisticData = createMockMarketData({
        market_share: {
          target_position: {
            target_share: { value: 75, unit: 'percentage', rationale: 'Test' },
            target_timeframe: { value: 5, unit: 'years', rationale: 'Test' },
            penetration_strategy: 'linear',
            key_milestones: []
          }
        }
      });
      
      const validation = validateMarketAnalysis(unrealisticData);
      expect(validation.warnings).toContain('Target market share above 50% may be unrealistic in competitive markets');
    });

    it('should warn about market share consistency', () => {
      const inconsistentData = createMockMarketData({
        market_share: {
          current_position: {
            current_share: { value: 10, unit: 'percentage', rationale: 'Test' },
            market_entry_date: '2024-01-01',
            current_revenue: { value: 250000, unit: 'EUR_per_year', rationale: 'Test' }
          }
        },
        competitive_landscape: {
          competitors: [
            {
              name: 'Competitor 1',
              market_share: { value: 50, unit: 'percentage', rationale: 'Test' },
              positioning: 'Test',
              strengths: ['Test'],
              weaknesses: ['Test'],
              threat_level: 'high',
              competitive_response: 'Test'
            },
            {
              name: 'Competitor 2',
              market_share: { value: 45, unit: 'percentage', rationale: 'Test' },
              positioning: 'Test',
              strengths: ['Test'],
              weaknesses: ['Test'],
              threat_level: 'medium',
              competitive_response: 'Test'
            }
          ]
        }
      });
      
      const validation = validateMarketAnalysis(inconsistentData);
      expect(validation.warnings).toContain('Total market share (including competitors) exceeds 100%');
    });

    it('should allow market analysis without customer analysis module', () => {
      // Customer analysis is now optional - market analysis can be done independently
      const invalidData = createMockMarketData({
        customer_analysis: undefined
      });
      
      const validation = validateMarketAnalysis(invalidData);
      // Should be valid - customer_analysis is optional
      expect(validation.isValid).toBe(true);
    });
  });

  describe('calculateMarketOpportunityScore', () => {
    it('should calculate opportunity score', () => {
      const score = calculateMarketOpportunityScore(mockMarketData);
      
      expect(score.score).toBeGreaterThan(0);
      expect(score.score).toBeLessThanOrEqual(100);
      expect(score.breakdown).toHaveProperty('marketSize');
      expect(score.breakdown).toHaveProperty('marketGrowth');
      expect(score.breakdown).toHaveProperty('competitivePosition');
      expect(score.breakdown).toHaveProperty('barriers');
      expect(score.interpretation).toBeTruthy();
    });

    it('should provide appropriate interpretation', () => {
      const score = calculateMarketOpportunityScore(mockMarketData);
      
      if (score.score >= 75) {
        expect(score.interpretation).toContain('Excellent');
      } else if (score.score >= 60) {
        expect(score.interpretation).toContain('Good');
      } else if (score.score >= 40) {
        expect(score.interpretation).toContain('Fair');
      } else {
        expect(score.interpretation).toContain('Challenging');
      }
    });

    it('should handle low-opportunity markets', () => {
      const lowOpportunityData = createMockMarketData({
        market_sizing: {
          total_addressable_market: {
            base_value: { value: 1000000, unit: 'EUR', rationale: 'Small market' }, // Small TAM
            growth_rate: { value: 2, unit: 'percentage_per_year', rationale: 'Low growth' }, // Low growth
            market_definition: 'Test',
            data_sources: ['Test']
          }
        },
        market_share: {
          target_position: {
            target_share: { value: 1, unit: 'percentage', rationale: 'Conservative target' }, // Low target
            target_timeframe: { value: 5, unit: 'years', rationale: 'Test' },
            penetration_strategy: 'linear',
            key_milestones: []
          }
        },
        competitive_landscape: {
          market_structure: {
            concentration_level: 'highly_concentrated',
            concentration_rationale: 'Test',
            barriers_to_entry: 'high', // High barriers
            barriers_description: 'Test'
          },
          competitive_advantages: [] // No advantages
        }
      });
      
      const score = calculateMarketOpportunityScore(lowOpportunityData);
      expect(score.score).toBeLessThan(50);
    });
  });

  describe('formatting functions', () => {
    describe('formatMarketCurrency', () => {
      it('should format large numbers with appropriate suffixes', () => {
        expect(formatMarketCurrency(1500000000, 'EUR')).toBe('1.5B EUR');
        expect(formatMarketCurrency(250000000, 'USD')).toBe('250.0M USD');
        expect(formatMarketCurrency(750000, 'EUR')).toBe('750.0K EUR');
        expect(formatMarketCurrency(500, 'USD')).toBe('500 USD');
      });

      it('should handle zero and negative values', () => {
        expect(formatMarketCurrency(0, 'EUR')).toBe('0 EUR');
        expect(formatMarketCurrency(-1000000, 'USD')).toBe('-1.0M USD');
      });

      it('should default to EUR currency', () => {
        expect(formatMarketCurrency(1000000)).toBe('1.0M EUR');
      });
    });

    describe('formatMarketPercent', () => {
      it('should format decimal values as percentages', () => {
        expect(formatMarketPercent(0.1)).toBe('10.0%');
        expect(formatMarketPercent(0.025)).toBe('2.5%');
        expect(formatMarketPercent(1.0)).toBe('100.0%');
        expect(formatMarketPercent(0)).toBe('0.0%');
      });

      it('should handle small and large values', () => {
        expect(formatMarketPercent(0.001)).toBe('0.1%');
        expect(formatMarketPercent(2.5)).toBe('250.0%');
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty market data object', () => {
      const emptyData: MarketData = {};
      
      expect(calculateMarketTAM(emptyData, 2024)).toBe(0);
      expect(calculateMarketSAM(emptyData, 2024)).toBe(0);
      expect(calculateMarketSOM(emptyData, 2024)).toBe(0);
      expect(calculateMarketShareProgression(emptyData, 0)).toBe(0);
      expect(calculateMarketBasedVolumeProjection(emptyData, 0)).toBe(0);
    });

    it('should handle extreme growth rates', () => {
      const extremeGrowthData = createMockMarketData({
        market_sizing: {
          total_addressable_market: {
            base_value: { value: 1000000, unit: 'EUR', rationale: 'Test' },
            growth_rate: { value: 1000, unit: 'percentage_per_year', rationale: 'Extreme growth' },
            market_definition: 'Test',
            data_sources: ['Test']
          }
        }
      });
      
      const tam = calculateMarketTAM(extremeGrowthData, 2025);
      expect(tam).toBeGreaterThan(0);
      expect(tam).toBeLessThan(Infinity);
    });

    it('should handle negative time indices', () => {
      expect(calculateMarketShareProgression(mockMarketData, -12)).toBeGreaterThanOrEqual(0);
      expect(calculateMarketBasedVolumeProjection(mockMarketData, -12)).toBeGreaterThanOrEqual(0);
    });
  });
});
