/**
 * Tests for partial data merge functionality
 * Verifies that uploading one module preserves existing modules
 */

import { describe, it, expect } from 'vitest';
import { MarketData } from '@/core/types/market';
import { mergeMarketData, getAvailableModules, validateMarketData } from '@/core/engine/utils/market-data-utils';

describe('Partial data merge', () => {
  // Helper to create sample existing data
  const createExistingData = (): Partial<MarketData> => ({
    meta: {
      title: "Existing Market Analysis",
      currency: "EUR",
      base_year: 2024
    },
    market_sizing: {
      total_addressable_market: {
        base_value: { value: 1000000, unit: "EUR", rationale: "Existing TAM" },
        growth_rate: { value: 5, unit: "percentage_per_year", rationale: "Existing growth" },
        market_definition: "Existing market",
        data_sources: ["Source 1"]
      },
      serviceable_addressable_market: {
        percentage_of_tam: { value: 30, unit: "percentage", rationale: "Existing SAM" },
        geographic_constraints: "Europe",
        regulatory_constraints: "None",
        capability_constraints: "None"
      },
      serviceable_obtainable_market: {
        percentage_of_sam: { value: 10, unit: "percentage", rationale: "Existing SOM" },
        resource_constraints: "Limited",
        competitive_barriers: "High",
        time_constraints: "3 years"
      }
    }
  });

  const createNewStrategicPlanningData = () => ({
    schema_version: "2.0",
    meta: {
      title: "Updated with Strategic Planning",
      currency: "EUR",
      base_year: 2024
    },
    strategic_planning: {
      market_entry_strategies: [
        {
          name: "Direct Sales",
          type: "direct",
          essence: "Direct sales approach targeting enterprise customers with dedicated sales team.",
          rationale: "High feasibility with proven track record. Quick deployment possible within 12 months with initial investment of €500k. Expected to capture 5% market share."
        }
      ],
      data_sources: ["Strategy source 1"]
    }
  });

  describe('mergeMarketData function', () => {
    it('should merge new module while preserving existing modules', () => {
      const existing = createExistingData();
      const newData = createNewStrategicPlanningData();

      const merged = mergeMarketData(existing, newData);

      // Should preserve existing market_sizing
      expect(merged.market_sizing).toBeDefined();
      expect(merged.market_sizing?.total_addressable_market.base_value.value).toBe(1000000);
      expect(merged.market_sizing?.total_addressable_market.market_definition).toBe("Existing market");

      // Should add new strategic_planning
      expect(merged.strategic_planning).toBeDefined();
      expect(merged.strategic_planning?.market_entry_strategies).toHaveLength(1);
      expect(merged.strategic_planning?.market_entry_strategies[0].name).toBe("Direct Sales");

      // Should not have modules that weren't in either dataset
      expect(merged.competitive_landscape).toBeUndefined();
      expect(merged.customer_analysis).toBeUndefined();
    });

    it('should update meta information from new data', () => {
      const existing = createExistingData();
      const newData = createNewStrategicPlanningData();

      const merged = mergeMarketData(existing, newData);

      // Should use new meta title
      expect(merged.meta?.title).toBe("Updated with Strategic Planning");
      expect(merged.meta?.currency).toBe("EUR");
    });

    it('should overwrite existing module if new data has the same module', () => {
      const existing = createExistingData();
      const newMarketSizingData = {
        schema_version: "2.0",
        meta: {
          title: "Updated Market Sizing",
          currency: "USD",
          base_year: 2025
        },
        market_sizing: {
          total_addressable_market: {
            base_value: { value: 2000000, unit: "USD", rationale: "Updated TAM" },
            growth_rate: { value: 10, unit: "percentage_per_year", rationale: "Higher growth" },
            market_definition: "Updated market",
            data_sources: ["New Source"]
          },
          serviceable_addressable_market: {
            percentage_of_tam: { value: 40, unit: "percentage", rationale: "Updated SAM" },
            geographic_constraints: "Global",
            regulatory_constraints: "Updated",
            capability_constraints: "Updated"
          },
          serviceable_obtainable_market: {
            percentage_of_sam: { value: 15, unit: "percentage", rationale: "Updated SOM" },
            resource_constraints: "Updated",
            competitive_barriers: "Updated",
            time_constraints: "Updated"
          }
        }
      };

      const merged = mergeMarketData(existing, newMarketSizingData);

      // Should use NEW market_sizing values
      expect(merged.market_sizing?.total_addressable_market.base_value.value).toBe(2000000);
      expect(merged.market_sizing?.total_addressable_market.market_definition).toBe("Updated market");
      expect(merged.market_sizing?.serviceable_addressable_market.percentage_of_tam.value).toBe(40);
    });

    it('should handle merging multiple new modules at once', () => {
      const existing = createExistingData();
      const multiModuleData = {
        schema_version: "2.0",
        meta: { title: "Multi-module update", currency: "EUR", base_year: 2024 },
        strategic_planning: createNewStrategicPlanningData().strategic_planning,
        customer_analysis: {
          market_segments: [
            {
              id: "enterprise",
              name: "Enterprise",
              size_percentage: { value: 25, unit: "percentage", rationale: "Quarter of market" },
              size_value: { value: 50000000, unit: "EUR", rationale: "High value" },
              growth_rate: { value: 5, unit: "percentage_per_year", rationale: "Growth rate" },
              demographics: "Large companies with 500+ employees",
              pain_points: "Complex needs",
              customer_profile: "Enterprise buyers",
              value_drivers: ["Scalability", "Support"],
              entry_strategy: "Direct sales"
            }
          ],
          data_sources: ["Market research"]
        }
      };

      const merged = mergeMarketData(existing, multiModuleData);

      // Should preserve existing
      expect(merged.market_sizing).toBeDefined();

      // Should add both new modules
      expect(merged.strategic_planning).toBeDefined();
      expect(merged.customer_analysis).toBeDefined();
      expect(merged.customer_analysis?.market_segments).toHaveLength(1);
    });

    it('should handle empty existing data', () => {
      const newData = createNewStrategicPlanningData();
      const merged = mergeMarketData({}, newData);

      expect(merged.strategic_planning).toBeDefined();
      expect(merged.meta).toBeDefined();
    });

    it('should handle empty new data', () => {
      const existing = createExistingData();
      const merged = mergeMarketData(existing, { schema_version: "2.0" });

      // Should preserve existing data
      expect(merged.market_sizing).toBeDefined();
      expect(merged.market_sizing?.total_addressable_market.base_value.value).toBe(1000000);
    });

    it('should preserve market_share when merging market_sizing', () => {
      const existingWithMarketShare = {
        ...createExistingData(),
        market_share: {
          current_position: {
            current_share: { value: 5, unit: "percentage", rationale: "Current position" },
            market_entry_date: "2023-01-01",
            current_revenue: { value: 50000, unit: "EUR_per_year", rationale: "Current revenue" }
          },
          target_position: {
            target_share: { value: 15, unit: "percentage", rationale: "Target" },
            target_timeframe: { value: 5, unit: "years", rationale: "Timeline" },
            penetration_strategy: "linear" as const,
            key_milestones: []
          }
        }
      };

      const newData = createNewStrategicPlanningData();
      const merged = mergeMarketData(existingWithMarketShare, newData);

      // market_share should be preserved (it's part of market_sizing module)
      expect(merged.market_share).toBeDefined();
      expect(merged.market_share?.current_position.current_share.value).toBe(5);
    });
  });

  describe('Module detection', () => {
    it('should correctly identify which modules are present in data', () => {
      const data = createExistingData();
      const modules = getAvailableModules(data);

      expect(modules).toContain('market_sizing');
      expect(modules).not.toContain('strategic_planning');
      expect(modules).not.toContain('customer_analysis');
      expect(modules).not.toContain('competitive_intelligence');
    });

    it('should detect all modules in complete dataset', () => {
      const completeData = {
        ...createExistingData(),
        strategic_planning: {},
        customer_analysis: {},
        competitive_landscape: {}
      };

      const modules = getAvailableModules(completeData);

      expect(modules).toContain('market_sizing');
      expect(modules).toContain('strategic_planning');
      expect(modules).toContain('customer_analysis');
      expect(modules).toContain('competitive_intelligence');
      expect(modules).toHaveLength(4);
    });

    it('should handle empty data', () => {
      const modules = getAvailableModules({});
      expect(modules).toHaveLength(0);
    });
  });

  describe('Validation after merge', () => {
    it('should validate merged data structure', () => {
      const existing = createExistingData();
      const newData = createNewStrategicPlanningData();
      const merged = mergeMarketData(existing, newData);

      const validation = validateMarketData(merged);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect errors in merged invalid data', () => {
      const existing = createExistingData();
      const invalidData = {
        strategic_planning: {
          market_entry_strategies: [
            {
              // Missing required fields (missing essence and rationale)
              name: "Incomplete Strategy"
            } as any
          ]
        }
      };

      const merged = mergeMarketData(existing, invalidData);
      const validation = validateMarketData(merged);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});
