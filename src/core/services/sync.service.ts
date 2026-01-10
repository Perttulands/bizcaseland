/**
 * Sync Service
 * Handles synchronization and data transfer between Business Case and Market Analysis
 */

import type { BusinessData, CustomerSegment } from '@/core/types/business';
import type { MarketData } from '@/core/types/market';
import { getNestedValue, setNestedValue } from '@/core/engine';

export interface SyncResult {
  success: boolean;
  changes: SyncChange[];
  errors: string[];
  warnings: string[];
}

export interface SyncChange {
  path: string;
  oldValue: any;
  newValue: any;
  source: 'market' | 'business';
}

export class SyncService {
  /**
   * Sync market volume data to business case customer segments
   */
  syncMarketToBusinessVolume(
    marketData: MarketData,
    businessData: BusinessData | null
  ): SyncResult {
    const changes: SyncChange[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!marketData.customer_analysis?.segments) {
      warnings.push('No customer segments in market data to sync');
      return { success: true, changes, errors, warnings };
    }

    if (!businessData) {
      errors.push('No business data available to sync to');
      return { success: false, changes, errors, warnings };
    }

    // Logic for syncing would go here
    // This is a placeholder for the actual sync implementation
    warnings.push('Volume sync not yet implemented in refactored service');

    return { success: true, changes, errors, warnings };
  }

  /**
   * Validate business assumptions against market data
   */
  validateBusinessAgainstMarket(
    businessData: BusinessData,
    marketData: MarketData
  ): SyncResult {
    const changes: SyncChange[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if business revenue projections are realistic given market size
    if (marketData.market_sizing?.total_addressable_market) {
      const tamValue = marketData.market_sizing.total_addressable_market.base_value.value;
      
      // This would need actual calculation from business data
      // Placeholder for now
      warnings.push('Revenue vs TAM validation not yet implemented');
    }

    // Check if customer segments align
    const businessSegments = businessData.assumptions.customers?.segments || [];
    const marketSegments = marketData.customer_analysis?.segments || [];

    if (businessSegments.length > 0 && marketSegments.length > 0) {
      // Compare segment definitions
      warnings.push('Segment alignment check not yet implemented');
    }

    return { success: true, changes, errors, warnings };
  }

  /**
   * Extract market insights for business case
   */
  extractMarketInsights(marketData: MarketData): MarketInsights {
    const insights: MarketInsights = {
      marketSize: null,
      competitivePosition: null,
      targetSegments: [],
      growthRate: null,
    };

    // Extract TAM
    if (marketData.market_sizing?.total_addressable_market) {
      insights.marketSize = {
        tam: marketData.market_sizing.total_addressable_market.base_value.value,
        sam: marketData.market_sizing.serviceable_addressable_market?.percentage_of_tam.value,
        som: marketData.market_sizing.serviceable_obtainable_market?.percentage_of_sam.value,
        currency: marketData.meta?.currency || 'USD',
      };
      insights.growthRate = marketData.market_sizing.total_addressable_market.growth_rate.value;
    }

    // Extract competitive position
    if (marketData.market_share) {
      insights.competitivePosition = {
        currentShare: marketData.market_share.current_position?.current_share.value,
        targetShare: marketData.market_share.target_position?.target_share.value,
      };
    }

    // Extract target segments
    if (marketData.customer_analysis?.segments) {
      insights.targetSegments = marketData.customer_analysis.segments.map(seg => ({
        id: seg.id,
        name: seg.name,
        size: seg.size.value,
        growthRate: seg.growth_rate.value,
      }));
    }

    return insights;
  }

  /**
   * Apply market insights to business case
   */
  applyMarketInsightsToBusiness(
    insights: MarketInsights,
    businessData: BusinessData
  ): SyncResult {
    const changes: SyncChange[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // This would apply insights to business case
    // Placeholder for implementation
    warnings.push('Insight application not yet implemented');

    return { success: true, changes, errors, warnings };
  }

  /**
   * Check data consistency between tools
   */
  checkConsistency(
    businessData: BusinessData | null,
    marketData: MarketData | null
  ): ConsistencyReport {
    const issues: ConsistencyIssue[] = [];

    if (!businessData || !marketData) {
      return { consistent: true, issues };
    }

    // Check currency consistency
    if (businessData.meta.currency !== marketData.meta?.currency) {
      issues.push({
        type: 'warning',
        category: 'currency',
        message: `Currency mismatch: Business uses ${businessData.meta.currency}, Market uses ${marketData.meta?.currency}`,
        paths: ['meta.currency'],
      });
    }

    // Check time horizon consistency
    const businessYears = businessData.meta.periods / 12;
    const marketYears = marketData.meta?.analysis_horizon_years || 0;
    
    if (marketYears > 0 && Math.abs(businessYears - marketYears) > 1) {
      issues.push({
        type: 'warning',
        category: 'timeframe',
        message: `Time horizon mismatch: Business analyzes ${businessYears.toFixed(1)} years, Market analyzes ${marketYears} years`,
        paths: ['meta.periods', 'meta.analysis_horizon_years'],
      });
    }

    return {
      consistent: issues.filter(i => i.type === 'error').length === 0,
      issues,
    };
  }
}

// Supporting interfaces
export interface MarketInsights {
  marketSize: {
    tam: number;
    sam?: number;
    som?: number;
    currency: string;
  } | null;
  competitivePosition: {
    currentShare?: number;
    targetShare?: number;
  } | null;
  targetSegments: {
    id: string;
    name: string;
    size: number;
    growthRate: number;
  }[];
  growthRate: number | null;
}

export interface ConsistencyReport {
  consistent: boolean;
  issues: ConsistencyIssue[];
}

export interface ConsistencyIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  paths: string[];
}

// Export singleton instance
export const syncService = new SyncService();
