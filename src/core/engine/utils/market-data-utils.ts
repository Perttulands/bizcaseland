/**
 * Utility functions for merging partial market data
 * Allows adding individual modules without overwriting existing data
 */

import { MarketData } from './market-calculations';

export type ModuleId = 'market_sizing' | 'competitive_intelligence' | 'customer_analysis' | 'strategic_planning';

/**
 * Merge new market data into existing data
 * Preserves existing modules while adding/updating new ones
 */
export function mergeMarketData(
  existing: Partial<MarketData>,
  newData: Partial<MarketData>
): Partial<MarketData> {
  const merged: Partial<MarketData> = { ...existing };

  // Update meta information (prefer new if exists)
  if (newData.meta) {
    merged.meta = { ...existing.meta, ...newData.meta };
  }

  // Merge market_sizing module
  if (newData.market_sizing) {
    merged.market_sizing = newData.market_sizing;
  }

  // Merge market_share (part of market_sizing module)
  if (newData.market_share) {
    merged.market_share = newData.market_share;
  }

  // Merge competitive_landscape (competitive_intelligence module)
  if (newData.competitive_landscape) {
    merged.competitive_landscape = newData.competitive_landscape;
  }

  // Merge customer_analysis module
  if (newData.customer_analysis) {
    merged.customer_analysis = newData.customer_analysis;
  }

  // Merge strategic_planning module
  if (newData.strategic_planning) {
    merged.strategic_planning = newData.strategic_planning;
  }

  return merged;
}

/**
 * Get list of modules that are present in the data
 */
export function getAvailableModules(data: Partial<MarketData>): ModuleId[] {
  const modules: ModuleId[] = [];

  if (data.market_sizing || data.market_share) {
    modules.push('market_sizing');
  }

  if (data.competitive_landscape) {
    modules.push('competitive_intelligence');
  }

  if (data.customer_analysis) {
    modules.push('customer_analysis');
  }

  if (data.strategic_planning) {
    modules.push('strategic_planning');
  }

  return modules;
}

/**
 * Basic validation for market data structure
 */
export function validateMarketData(data: Partial<MarketData>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for meta information
  if (!data.meta) {
    warnings.push('Missing meta information');
  }

  // Validate market_sizing if present
  if (data.market_sizing) {
    if (!data.market_sizing.total_addressable_market) {
      errors.push('market_sizing.total_addressable_market is required');
    }
    if (!data.market_sizing.serviceable_addressable_market) {
      errors.push('market_sizing.serviceable_addressable_market is required');
    }
    if (!data.market_sizing.serviceable_obtainable_market) {
      errors.push('market_sizing.serviceable_obtainable_market is required');
    }
  }

  // Validate competitive_landscape if present
  if (data.competitive_landscape) {
    if (!data.competitive_landscape.positioning_axes) {
      errors.push('competitive_landscape.positioning_axes is required');
    }
  }

  // Validate customer_analysis if present
  if (data.customer_analysis) {
    if (data.customer_analysis.market_segments) {
      if (!Array.isArray(data.customer_analysis.market_segments)) {
        errors.push('customer_analysis.market_segments must be an array');
      } else if (data.customer_analysis.market_segments.length === 0) {
        warnings.push('customer_analysis.market_segments array is empty');
      }
    }
  }

  // Validate strategic_planning if present
  if (data.strategic_planning) {
    if (!data.strategic_planning.market_entry_strategies) {
      errors.push('strategic_planning.market_entry_strategies is required');
    } else if (!Array.isArray(data.strategic_planning.market_entry_strategies)) {
      errors.push('strategic_planning.market_entry_strategies must be an array');
    } else if (data.strategic_planning.market_entry_strategies.length > 0) {
      // Validate each strategy
      data.strategic_planning.market_entry_strategies.forEach((strategy, index) => {
        if (!strategy.name) {
          errors.push(`Strategy ${index}: name is required`);
        }
        if (!strategy.essence) {
          errors.push(`Strategy ${index}: essence is required`);
        }
        if (!strategy.rationale) {
          errors.push(`Strategy ${index}: rationale is required`);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
