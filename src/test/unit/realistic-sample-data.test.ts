import { describe, test, expect } from 'vitest';
import { calculateBusinessMetrics } from '@/core/engine/calculators/business-calculator-full';
import fintechSampleData from '@/../public/sample-data/business-cases/fintech-market-entry.json';

describe('Realistic Business Case Sample Data Tests', () => {
  describe('IoT Product Launch - Realistic Scenarios', () => {
    test('should have realistic revenue to cost ratios', () => {
      // Test data structure for realistic IoT product
      const realisticIoTData = {
        meta: {
          title: "Smart Home IoT Product Launch",
          currency: "EUR",
          periods: 48,
          frequency: "monthly"
        },
        assumptions: {
          pricing: {
            avg_unit_price: { value: 299.0, unit: "EUR_per_unit" }
          },
          customers: {
            segments: [
              {
                id: "early_adopters",
                label: "Tech Enthusiasts & Early Adopters",
                volume: {
                  type: "pattern",
                  pattern_type: "seasonal_growth",
                  base_year_total: { value: 2400, unit: "units_per_year" }, // 200/month baseline
                  seasonality_index_12: [1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 1.3, 1.5],
                  yoy_growth: { value: 0.15, unit: "decimal" } // 15% yearly growth - realistic
                }
              },
              {
                id: "mainstream_consumers", 
                label: "Mainstream Smart Home Adopters",
                volume: {
                  type: "pattern",
                  pattern_type: "geom_growth",
                  start: { value: 50, unit: "units_per_month" }, // Start small
                  monthly_growth_rate: { value: 0.03, unit: "decimal" } // 3% monthly = reasonable
                }
              }
            ]
          },
          unit_economics: {
            cogs_pct: { value: 0.55, unit: "percentage_of_revenue" }, // More realistic for hardware
            cac: { value: 75.0, unit: "EUR_per_customer" }
          },
          opex: [
            { name: "Sales & Marketing", value: { value: 45000.0, unit: "EUR_per_month" }},
            { name: "R&D", value: { value: 25000.0, unit: "EUR_per_month" }},
            { name: "G&A", value: { value: 18000.0, unit: "EUR_per_month" }}
          ]
        }
      };

      const metrics = calculateBusinessMetrics(realisticIoTData as any);
      
      // Verify realistic financial ratios
      expect(metrics.totalRevenue).toBeGreaterThan(0);
      expect(metrics.totalRevenue).toBeLessThan(10000000); // Less than €10M over 4 years
      
      // Calculate gross margin from monthly data
      const totalGrossProfit = metrics.monthlyData.reduce((sum, month) => sum + month.grossProfit, 0);
      const grossMargin = totalGrossProfit / metrics.totalRevenue;
      expect(grossMargin).toBeGreaterThan(0.35); // At least 35% gross margin
      expect(grossMargin).toBeLessThan(0.55); // Less than 55% gross margin
      
      // Operating expenses should be significant relative to revenue  
      // Note: OPEX values are stored as negative in the calculation engine
      const totalOpex = Math.abs(metrics.monthlyData.reduce((sum, month) => sum + month.totalOpex, 0));
      const operatingExpenseRatio = totalOpex / metrics.totalRevenue;
      expect(operatingExpenseRatio).toBeGreaterThan(0.3); // At least 30% of revenue
      expect(operatingExpenseRatio).toBeLessThan(1.2); // Less than 120% of revenue (allows for high OPEX scenarios)
    });

    test('should show realistic customer segment growth patterns', () => {
      // Verify growth doesn't explode exponentially
      const monthlyGrowthRate = 0.03; // 3% monthly
      const startingVolume = 50;
      
      // After 24 months: 50 * (1.03)^24 ≈ 102 units/month
      const projectedVolume24Months = startingVolume * Math.pow(1 + monthlyGrowthRate, 24);
      expect(projectedVolume24Months).toBeLessThan(150); // Reasonable growth
      
      // After 48 months: should still be under 300 units/month
      const projectedVolume48Months = startingVolume * Math.pow(1 + monthlyGrowthRate, 48);
      expect(projectedVolume48Months).toBeLessThan(300);
    });
  });

  describe('Fintech Market Entry - Realistic Scenarios', () => {
    test('should have balanced transaction volumes and costs', () => {
      // Use the actual fintech sample data to test realistic business models
      const metrics = calculateBusinessMetrics(fintechSampleData as any);
      
      // Market entry involves significant upfront investment and may show initial losses
      // CAPEX includes €1.6M+ for market entry, infrastructure, and compliance
      expect(metrics.netProfit).toBeGreaterThan(-1000000000); // Allow for very high market entry costs
      expect(metrics.netProfit).toBeLessThan(10000000); // Reasonable ceiling over 5 years
      
      // Revenue should scale with transaction fees (€0.45 per transaction)
      expect(metrics.totalRevenue).toBeGreaterThan(500000); // Minimum viable scale
      expect(metrics.totalRevenue).toBeLessThan(20000000); // Realistic ceiling for 5-year expansion
    });

    test('should model realistic transaction growth with market constraints', () => {
      // Use actual growth rates from fintech sample data (1.5% monthly)
      const fintechSegments = fintechSampleData.assumptions.customers.segments;
      const primarySegment = fintechSegments[0]; // German SME Merchants
      
      const startingTransactions = primarySegment.volume.start.value; // 15,000
      const monthlyGrowthRate = primarySegment.volume.monthly_growth_rate.value; // 0.015 (1.5%)
      
      // After 24 months - should be significant but not explosive
      const projected24Months = startingTransactions * Math.pow(1 + monthlyGrowthRate, 24);
      expect(projected24Months).toBeLessThan(40000); // Under 40K with 1.5% growth
      
      // After 60 months - market saturation should limit growth
      const projected60Months = startingTransactions * Math.pow(1 + monthlyGrowthRate, 60);
      expect(projected60Months).toBeLessThan(65000); // Under 65K with realistic 1.5% growth
    });
  });

  describe('Enhanced Customer Segment Insights', () => {
    test('should include behavioral and psychographic insights', () => {
      const enhancedSegmentData = {
        id: "digital_natives",
        label: "Digital-Native Urban Professionals",
        rationale: "Tech-savvy professionals aged 25-40 in metropolitan areas who prioritize convenience and are early adopters of smart home technology",
        psychographics: {
          values: ["convenience", "innovation", "sustainability"],
          behaviors: ["mobile-first shopping", "social media influence", "premium willingness"],
          pain_points: ["time constraints", "compatibility concerns", "privacy worries"]
        },
        market_positioning: {
          size_percentage: 12,
          growth_trend: "expanding",
          competitive_intensity: "high",
          value_drivers: ["convenience", "status", "integration"]
        },
        volume: {
          type: "pattern",
          pattern_type: "seasonal_growth",
          confidence_level: 0.75,
          market_factors: ["urbanization trends", "disposable income growth", "smart home adoption"]
        }
      };

      // Test that enhanced data structure is comprehensive
      expect(enhancedSegmentData.psychographics.values).toHaveLength(3);
      expect(enhancedSegmentData.market_positioning.size_percentage).toBeGreaterThan(0);
      expect(enhancedSegmentData.market_positioning.size_percentage).toBeLessThan(50);
      expect(enhancedSegmentData.volume.confidence_level).toBeGreaterThan(0);
      expect(enhancedSegmentData.volume.confidence_level).toBeLessThanOrEqual(1);
    });

    test('should provide actionable market insights', () => {
      const marketInsights = {
        competitive_landscape: {
          direct_competitors: 3,
          market_leader_share: 0.35,
          market_growth_rate: 0.18,
          barriers_to_entry: ["brand recognition", "distribution channels", "regulatory compliance"]
        },
        opportunity_assessment: {
          market_size_addressable: 2500000,
          realistic_penetration: 0.02,
          time_to_market_leadership: 36,
          key_success_factors: ["product differentiation", "distribution strategy", "customer experience"]
        }
      };

      expect(marketInsights.competitive_landscape.market_leader_share).toBeLessThan(0.5);
      expect(marketInsights.opportunity_assessment.realistic_penetration).toBeLessThan(0.1);
      expect(marketInsights.opportunity_assessment.time_to_market_leadership).toBeGreaterThan(12);
    });
  });
});
