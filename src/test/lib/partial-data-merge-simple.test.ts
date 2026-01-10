/**
 * Simplified tests for partial data merge functionality
 * Verifies that uploading one module preserves existing modules
 */

import { describe, it, expect } from 'vitest';
import { mergeMarketData, getAvailableModules } from '@/core/engine/utils/market-data-utils';
import { MarketData } from '@/core/types/market';

describe('Partial data merge', () => {
  it('should merge new strategic_planning without overwriting market_sizing', () => {
    const existing: Partial<MarketData> = {
      market_sizing: {
        total_addressable_market: {
          base_value: { value: 1000000, unit: "EUR", rationale: "Existing TAM" },
          growth_rate: { value: 5, unit: "percentage_per_year", rationale: "Growth" },
          market_definition: "Existing market",
          data_sources: ["Source 1"]
        }
      }
    };

    const newData: Partial<MarketData> = {
      strategic_planning: {
        market_entry_strategies: [
          {
            name: "Direct Sales",
            essence: "New strategy",
            rationale: "High feasibility"
          }
        ]
      }
    };

    const merged = mergeMarketData(existing, newData);

    // Should preserve existing market_sizing
    expect(merged.market_sizing).toBeDefined();
    expect(merged.market_sizing?.total_addressable_market.base_value.value).toBe(1000000);

    // Should add new strategic_planning
    expect(merged.strategic_planning).toBeDefined();
    expect(merged.strategic_planning?.market_entry_strategies).toHaveLength(1);
  });

  it('should update meta information from new data', () => {
    const existing: Partial<MarketData> = {
      meta: { title: "Old Title", currency: "EUR" }
    };

    const newData: Partial<MarketData> = {
      meta: { title: "New Title", currency: "USD" }
    };

    const merged = mergeMarketData(existing, newData);

    expect(merged.meta?.title).toBe("New Title");
    expect(merged.meta?.currency).toBe("USD");
  });

  it('should correctly identify available modules', () => {
    const data: Partial<MarketData> = {
      market_sizing: {},
      strategic_planning: {}
    };

    const modules = getAvailableModules(data);

    expect(modules).toContain('market_sizing');
    expect(modules).toContain('strategic_planning');
    expect(modules).not.toContain('customer_analysis');
    expect(modules).not.toContain('competitive_intelligence');
  });
});
