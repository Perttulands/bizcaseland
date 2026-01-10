/**
 * Shared data synchronization utilities for cross-tool integration
 */

import { BusinessData } from '@/contexts/BusinessDataContext';
import { MarketData } from '@/core/types/market';

export interface DataSyncOptions {
  preserveExisting: boolean;
  validateResults: boolean;
  logChanges: boolean;
}

export interface SyncResult {
  success: boolean;
  changesApplied: number;
  warnings: string[];
  errors: string[];
}

/**
 * Sync market analysis insights to business case volume assumptions
 */
export function syncMarketToBusinessVolume(
  marketData: MarketData, 
  currentBusinessData?: BusinessData,
  options: Partial<DataSyncOptions> = {}
): { businessData: Partial<BusinessData>; syncResult: SyncResult } {
  
  const opts: DataSyncOptions = {
    preserveExisting: false,
    validateResults: true,
    logChanges: true,
    ...options
  };

  const result: SyncResult = {
    success: true,
    changesApplied: 0,
    warnings: [],
    errors: []
  };

  const updates: Partial<BusinessData> = {};

  try {
    // Extract market insights
    const som = marketData.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.value || 0;
    const tamValue = marketData.market_sizing?.total_addressable_market?.base_value?.value || 0;
    const samPercentage = marketData.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.value || 0;
    const targetShare = marketData.market_share?.target_position?.target_share?.value || 0;
    
    // Calculate market-based volume estimate
    const marketBasedVolume = (tamValue * samPercentage / 100 * som / 100 * targetShare / 100);
    
    if (marketBasedVolume > 0) {
      // Update business case meta information
      if (!updates.meta) updates.meta = { ...currentBusinessData?.meta } as any;
      updates.meta!.title = marketData.meta?.title || updates.meta!.title;
      updates.meta!.currency = marketData.meta?.currency || updates.meta!.currency;
      
      // Sync customer segments with market segments
      if (marketData.customer_analysis?.market_segments) {
        if (!updates.assumptions) updates.assumptions = {};
        if (!updates.assumptions.customers) updates.assumptions.customers = {};
        
        const marketSegments = marketData.customer_analysis.market_segments;
        const businessSegments = marketSegments.map((segment, index) => ({
          id: segment.id,
          label: segment.name,
          rationale: `Derived from market analysis: ${segment.size_percentage?.rationale || 'Market segment analysis'}`,
          volume: {
            type: 'pattern' as const,
            pattern_type: 'linear_growth' as const,
            base_year_total: {
              value: marketBasedVolume * (segment.size_percentage?.value || 0) / 100,
              unit: 'units_per_year',
              rationale: `Market-based volume estimate: ${marketBasedVolume.toFixed(0)} total units × ${segment.size_percentage?.value || 0}% segment share`
            },
            yoy_growth: {
              value: segment.growth_rate?.value || 5,
              unit: 'percentage',
              rationale: segment.growth_rate?.rationale || 'Market growth rate'
            }
          }
        }));
        
        updates.assumptions.customers.segments = businessSegments;
        result.changesApplied++;
        
        if (opts.logChanges) {
          result.warnings.push(`Updated ${businessSegments.length} customer segments based on market analysis`);
        }
      }
      
      // Customer economics sync removed - no longer part of market analysis
      // Pricing data should come from business case assumptions or competitive analysis
      
    } else {
      result.warnings.push('Could not calculate meaningful market-based volume - insufficient market data');
    }

  } catch (error) {
    result.success = false;
    result.errors.push(`Error during market-to-business sync: ${error}`);
  }

  return { businessData: updates, syncResult: result };
}

/**
 * Validate business case assumptions against market analysis
 */
export function validateBusinessAgainstMarket(
  businessData: BusinessData,
  marketData: MarketData
): { validation: SyncResult; insights: MarketBusinessInsights } {
  
  const validation: SyncResult = {
    success: true,
    changesApplied: 0,
    warnings: [],
    errors: []
  };

  // Calculate market opportunity
  const tamValue = marketData.market_sizing?.total_addressable_market?.base_value?.value || 0;
  const samPercentage = marketData.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.value || 0;
  const somPercentage = marketData.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.value || 0;
  const targetShare = marketData.market_share?.target_position?.target_share?.value || 0;
  
  const marketOpportunity = tamValue * (samPercentage / 100) * (somPercentage / 100) * (targetShare / 100);
  
  // Extract business projections
  const businessSegments = businessData.assumptions?.customers?.segments || [];
  const totalBusinessVolume = businessSegments.reduce((total, segment) => {
    return total + (segment.volume?.base_year_total?.value || 0);
  }, 0);
  
  const avgUnitPrice = businessData.assumptions?.pricing?.avg_unit_price?.value || 0;
  const businessProjectedRevenue = totalBusinessVolume * avgUnitPrice;
  
  // Calculate insights
  const insights: MarketBusinessInsights = {
    volumeAlignment: {
      marketProjectedVolume: marketOpportunity / avgUnitPrice,
      businessAssumedVolume: totalBusinessVolume,
      alignmentScore: calculateAlignmentScore(marketOpportunity / avgUnitPrice, totalBusinessVolume),
      recommendations: []
    },
    revenueConsistency: {
      marketSize: marketOpportunity,
      businessProjectedRevenue,
      marketShareImplied: businessProjectedRevenue / tamValue,
      feasibilityScore: calculateFeasibilityScore(businessProjectedRevenue, marketOpportunity)
    }
  };
  
  // Generate recommendations
  if (insights.volumeAlignment.alignmentScore < 0.7) {
    validation.warnings.push('Business volume assumptions may be optimistic compared to market analysis');
    insights.volumeAlignment.recommendations.push('Consider adjusting volume assumptions downward');
  } else if (insights.volumeAlignment.alignmentScore > 1.3) {
    validation.warnings.push('Business assumptions may be conservative - market opportunity appears larger');
    insights.volumeAlignment.recommendations.push('Consider increasing volume targets');
  }
  
  if (insights.revenueConsistency.feasibilityScore < 0.6) {
    validation.warnings.push('Revenue projections may not be achievable given market constraints');
    insights.revenueConsistency.marketShareImplied > 0.1 && 
      validation.warnings.push(`Implied market share of ${(insights.revenueConsistency.marketShareImplied * 100).toFixed(1)}% may be too aggressive`);
  }

  return { validation, insights };
}

export interface MarketBusinessInsights {
  volumeAlignment: {
    marketProjectedVolume: number;
    businessAssumedVolume: number;
    alignmentScore: number;
    recommendations: string[];
  };
  revenueConsistency: {
    marketSize: number;
    businessProjectedRevenue: number;
    marketShareImplied: number;
    feasibilityScore: number;
  };
}

/**
 * Calculate alignment score between market and business projections
 */
function calculateAlignmentScore(marketVolume: number, businessVolume: number): number {
  if (marketVolume === 0 || businessVolume === 0) return 0;
  
  const ratio = businessVolume / marketVolume;
  
  // Perfect alignment is around 1.0, score decreases as ratio moves away
  if (ratio <= 1) {
    return ratio; // 0 to 1 scale
  } else {
    return 1 / ratio; // Inverted for ratios > 1
  }
}

/**
 * Calculate feasibility score based on revenue vs market size
 */
function calculateFeasibilityScore(revenue: number, marketSize: number): number {
  if (marketSize === 0) return 0;
  
  const marketShare = revenue / marketSize;
  
  // High feasibility for market shares under 5%, decreasing after that
  if (marketShare <= 0.05) return 1.0;
  if (marketShare <= 0.10) return 0.8;
  if (marketShare <= 0.20) return 0.6;
  if (marketShare <= 0.50) return 0.4;
  return 0.2; // Very low feasibility for >50% market share
}

/**
 * Export unified insights for reporting
 */
export function exportUnifiedInsights(
  businessData: BusinessData,
  marketData: MarketData
): any {
  const { insights } = validateBusinessAgainstMarket(businessData, marketData);
  
  return {
    meta: {
      exportDate: new Date().toISOString(),
      businessTitle: businessData.meta?.title,
      marketTitle: marketData.meta?.title,
      version: '1.0'
    },
    crossToolAnalysis: {
      volumeAlignment: insights.volumeAlignment,
      revenueConsistency: insights.revenueConsistency,
      overallFeasibility: (insights.volumeAlignment.alignmentScore + insights.revenueConsistency.feasibilityScore) / 2
    },
    businessSummary: {
      totalVolume: businessData.assumptions?.customers?.segments?.reduce((total, seg) => 
        total + (seg.volume?.base_year_total?.value || 0), 0) || 0,
      avgUnitPrice: businessData.assumptions?.pricing?.avg_unit_price?.value || 0,
      currency: businessData.meta?.currency || 'EUR'
    },
    marketSummary: {
      tam: marketData.market_sizing?.total_addressable_market?.base_value?.value || 0,
      targetShare: marketData.market_share?.target_position?.target_share?.value || 0,
      timeframe: marketData.market_share?.target_position?.target_timeframe?.value || 0,
      currency: marketData.meta?.currency || 'EUR'
    }
  };
}
