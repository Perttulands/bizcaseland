/**
 * Market Analysis Calculator
 * Independent market analysis calculations
 */

// Reusable type for values with rationales and optional links
export interface ValueWithMeta {
  value: number;
  unit: string;
  rationale: string;
  link?: string; // Optional link for AI to provide source URLs
}

export interface MarketDriver {
  key: string;
  label: string;
  path: string;
  range: number[];
  rationale: string;
}

export interface MarketData {
  schema_version?: string;
  meta?: {
    title?: string;
    description?: string;
    currency?: string;
    base_year?: number;
    analysis_horizon_years?: number;
    created_date?: string;
    analyst?: string;
  };
  drivers?: MarketDriver[];
  market_sizing?: {
    total_addressable_market?: {
      base_value: ValueWithMeta;
      growth_rate: ValueWithMeta;
      market_definition: string;
      data_sources: string[];
    };
    serviceable_addressable_market?: {
      percentage_of_tam: ValueWithMeta;
      geographic_constraints: string;
      regulatory_constraints: string;
      capability_constraints: string;
    };
    serviceable_obtainable_market?: {
      percentage_of_sam: ValueWithMeta;
      resource_constraints: string;
      competitive_barriers: string;
      time_constraints: string;
    };
  };
  market_share?: {
    current_position?: {
      current_share: ValueWithMeta;
      market_entry_date: string;
      current_revenue: ValueWithMeta;
    };
    target_position?: {
      target_share: ValueWithMeta;
      target_timeframe: ValueWithMeta;
      penetration_strategy: 'linear' | 'exponential' | 's_curve';
      key_milestones: Array<{
        year: number;
        milestone: string;
        target_share: number;
        rationale: string;
      }>;
    };
  };
  competitive_landscape?: {
    positioning_axes?: {
      x_axis_label: string;
      y_axis_label: string;
    };
    our_position?: {
      x: number;
      y: number;
    };
    market_structure?: {
      concentration_level: 'fragmented' | 'moderately_concentrated' | 'highly_concentrated';
      concentration_rationale: string;
      barriers_to_entry: 'low' | 'medium' | 'high';
      barriers_description: string;
    };
    competitors?: Array<{
      name: string;
      market_share: ValueWithMeta;
      positioning: string;
      strengths: string[];
      weaknesses: string[];
      threat_level: 'high' | 'medium' | 'low';
      competitive_response: string;
      x_position?: number;
      y_position?: number;
    }>;
    competitive_advantages?: Array<{
      advantage: string;
      sustainability: 'high' | 'medium' | 'low';
      rationale: string;
    }>;
    data_sources?: string[];
  };
  customer_analysis?: {
    market_segments?: Array<{
      id: string;
      name: string;
      size_percentage: ValueWithMeta;
      size_value: ValueWithMeta;
      growth_rate: ValueWithMeta;
      demographics: string;
      pain_points: string;
      customer_profile: string;
      value_drivers: string[];
      entry_strategy: string;
    }>;
    data_sources?: string[];
  };
  strategic_planning?: {
    note?: string;
    market_entry_strategies?: Array<{
      name: string;
      type?: 'partnership' | 'direct' | 'platform' | 'gradual' | string;
      essence: string;
      rationale: string;
    }>;
    data_sources?: string[];
  };
}

export interface MarketMetrics {
  year: number;
  tam: number;
  sam: number;
  som: number;
  marketShare: number;
  marketBasedVolume: number;
  marketValue: number;
  competitivePosition: {
    ourShare: number;
    competitorShares: Array<{ name: string; share: number; positioning: string }>;
    marketConcentration: number;
  };
}

export interface MarketVolumeProjection {
  period: number;
  year: number;
  tam: number;
  sam: number;
  som: number;
  marketShare: number;
  marketBasedVolume: number;
  marketValue: number;
  cumulativeVolume: number;
}

/**
 * Calculate Total Addressable Market for a specific year
 */
export function calculateMarketTAM(marketData: MarketData, year: number): number {
  const tam = marketData?.market_sizing?.total_addressable_market;
  if (!tam) return 0;
  
  const baseValue = tam.base_value?.value || 0;
  const growthRate = (tam.growth_rate?.value || 0) / 100;
  const baseYear = marketData?.meta?.base_year || 2024;
  
  const yearsFromBase = year - baseYear;
  return baseValue * Math.pow(1 + growthRate, yearsFromBase);
}

/**
 * Calculate Serviceable Addressable Market for a specific year
 */
export function calculateMarketSAM(marketData: MarketData, year: number): number {
  const tam = calculateMarketTAM(marketData, year);
  const samPercentage = (marketData?.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.value || 0) / 100;
  
  return tam * samPercentage;
}

/**
 * Calculate Serviceable Obtainable Market for a specific year
 */
export function calculateMarketSOM(marketData: MarketData, year: number): number {
  const sam = calculateMarketSAM(marketData, year);
  const somPercentage = (marketData?.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.value || 0) / 100;
  
  return sam * somPercentage;
}

/**
 * Calculate market share progression for a specific time period
 */
export function calculateMarketShareProgression(marketData: MarketData, monthIndex: number): number {
  const marketShare = marketData?.market_share;
  if (!marketShare?.current_position || !marketShare?.target_position) return 0;
  
  const currentShare = (marketShare.current_position.current_share?.value || 0) / 100;
  const targetShare = (marketShare.target_position.target_share?.value || 0) / 100;
  const targetTimeframe = marketShare.target_position.target_timeframe?.value || 5; // years
  const strategy = marketShare.target_position.penetration_strategy || 'linear';
  
  const yearsPassed = Math.max(0, monthIndex) / 12; // Ensure non-negative
  const progressRatio = Math.min(yearsPassed / targetTimeframe, 1);
  
  let penetrationFactor: number;
  
  switch (strategy) {
    case 'linear':
      penetrationFactor = progressRatio;
      break;
    case 'exponential':
      // Faster growth early, slowing down later
      penetrationFactor = 1 - Math.exp(-3 * progressRatio);
      break;
    case 's_curve':
      // S-curve: slow start, rapid middle, slow end
      penetrationFactor = 1 / (1 + Math.exp(-10 * (progressRatio - 0.5)));
      break;
    default:
      penetrationFactor = progressRatio;
  }
  
  return currentShare + (targetShare - currentShare) * penetrationFactor;
}

/**
 * Calculate market-based volume for a specific month
 * Note: Volume calculations now require integration with business case data
 */
export function calculateMarketBasedVolumeProjection(marketData: MarketData, monthIndex: number): number {
  const year = Math.floor(monthIndex / 12) + (marketData?.meta?.base_year || 2024);
  const marketShare = calculateMarketShareProgression(marketData, monthIndex);
  const som = calculateMarketSOM(marketData, year);
  
  // Volume calculation removed - customer_economics no longer part of market analysis
  // Market analysis focuses on opportunity sizing, not unit economics
  return 0;
}

/**
 * Get comprehensive market metrics for a specific time period
 */
export function getMarketAnalysisMetrics(marketData: MarketData, monthIndex: number): MarketMetrics {
  const year = Math.floor(monthIndex / 12) + (marketData?.meta?.base_year || 2024);
  const tam = calculateMarketTAM(marketData, year);
  const sam = calculateMarketSAM(marketData, year);
  const som = calculateMarketSOM(marketData, year);
  const marketShare = calculateMarketShareProgression(marketData, monthIndex);
  const marketBasedVolume = calculateMarketBasedVolumeProjection(marketData, monthIndex);
  const marketValue = som * marketShare;
  
  // Competitive analysis
  const competitors = marketData?.competitive_landscape?.competitors || [];
  const competitorShares = competitors.map(comp => ({
    name: comp.name,
    share: (comp.market_share?.value || 0) / 100,
    positioning: comp.positioning
  }));
  
  // Calculate market concentration (Herfindahl Index)
  const allShares = [marketShare, ...competitorShares.map(c => c.share)];
  const marketConcentration = allShares.reduce((sum, share) => sum + Math.pow(share, 2), 0);
  
  return {
    year,
    tam,
    sam,
    som,
    marketShare,
    marketBasedVolume,
    marketValue,
    competitivePosition: {
      ourShare: marketShare,
      competitorShares,
      marketConcentration
    }
  };
}

/**
 * Generate market penetration trajectory over time
 */
export function getMarketPenetrationTrajectory(marketData: MarketData, periods: number): MarketVolumeProjection[] {
  const trajectory: MarketVolumeProjection[] = [];
  let cumulativeVolume = 0;
  
  for (let i = 0; i < periods; i++) {
    const year = Math.floor(i / 12) + (marketData?.meta?.base_year || 2024);
    const tam = calculateMarketTAM(marketData, year);
    const sam = calculateMarketSAM(marketData, year);
    const som = calculateMarketSOM(marketData, year);
    const marketShare = calculateMarketShareProgression(marketData, i);
    const marketBasedVolume = calculateMarketBasedVolumeProjection(marketData, i);
    const marketValue = som * marketShare;
    
    cumulativeVolume += marketBasedVolume;
    
    trajectory.push({
      period: i + 1,
      year,
      tam,
      sam,
      som,
      marketShare,
      marketBasedVolume,
      marketValue,
      cumulativeVolume
    });
  }
  
  return trajectory;
}

/**
 * Validate market analysis assumptions and data consistency
 */
export function validateMarketAnalysis(marketData: MarketData): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check TAM data
  if (!marketData?.market_sizing?.total_addressable_market?.base_value?.value) {
    errors.push("Total Addressable Market base value is required");
  }
  
  // Check SAM percentage
  const samPercentage = marketData?.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.value || 0;
  if (samPercentage <= 0 || samPercentage > 100) {
    errors.push("Serviceable Addressable Market percentage must be between 0 and 100");
  }
  
  // Check SOM percentage
  const somPercentage = marketData?.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.value || 0;
  if (somPercentage <= 0 || somPercentage > 100) {
    errors.push("Serviceable Obtainable Market percentage must be between 0 and 100");
  }
  
  // Check market share data
  const currentShare = marketData?.market_share?.current_position?.current_share?.value || 0;
  const targetShare = marketData?.market_share?.target_position?.target_share?.value || 0;
  
  if (targetShare <= currentShare) {
    warnings.push("Target market share should be higher than current market share");
  }
  
  if (targetShare > 50) {
    warnings.push("Target market share above 50% may be unrealistic in competitive markets");
  }
  
  // Check competitive analysis
  const competitors = marketData?.competitive_landscape?.competitors || [];
  const totalCompetitorShare = competitors.reduce((sum, comp) => sum + (comp.market_share?.value || 0), 0);
  
  if (totalCompetitorShare + currentShare > 100) {
    warnings.push("Total market share (including competitors) exceeds 100%");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculate market opportunity score based on various factors
 */
export function calculateMarketOpportunityScore(marketData: MarketData): {
  score: number; // 0-100
  breakdown: {
    marketSize: number;
    marketGrowth: number;
    competitivePosition: number;
    barriers: number;
  };
  interpretation: string;
} {
  // Market size score (0-25)
  const tam = marketData?.market_sizing?.total_addressable_market?.base_value?.value || 0;
  const marketSizeScore = Math.min(25, Math.log10(tam / 1000000) * 5); // Log scale for market size
  
  // Market growth score (0-25)
  const growthRate = marketData?.market_sizing?.total_addressable_market?.growth_rate?.value || 0;
  const marketGrowthScore = Math.min(25, growthRate * 2.5); // 10% growth = 25 points
  
  // Competitive position score (0-25)
  const targetShare = marketData?.market_share?.target_position?.target_share?.value || 0;
  const competitiveAdvantages = marketData?.competitive_landscape?.competitive_advantages?.length || 0;
  const competitivePositionScore = Math.min(25, (targetShare / 2) + (competitiveAdvantages * 5));
  
  // Barriers score (0-25) - inverse of barriers (lower barriers = higher score)
  const entryBarriers = marketData?.competitive_landscape?.market_structure?.barriers_to_entry || 'medium';
  const barriersScore = entryBarriers === 'low' ? 25 : entryBarriers === 'medium' ? 15 : 5;
  
  const totalScore = marketSizeScore + marketGrowthScore + competitivePositionScore + barriersScore;
  
  let interpretation: string;
  if (totalScore >= 75) {
    interpretation = "Excellent market opportunity with strong potential";
  } else if (totalScore >= 60) {
    interpretation = "Good market opportunity with moderate potential";
  } else if (totalScore >= 40) {
    interpretation = "Fair market opportunity with some challenges";
  } else {
    interpretation = "Challenging market opportunity requiring careful consideration";
  }
  
  return {
    score: Math.round(totalScore),
    breakdown: {
      marketSize: Math.round(marketSizeScore),
      marketGrowth: Math.round(marketGrowthScore),
      competitivePosition: Math.round(competitivePositionScore),
      barriers: Math.round(barriersScore)
    },
    interpretation
  };
}

/**
 * Format currency values for display
 */
export function formatMarketCurrency(value: number, currency: string = 'EUR'): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(1)}B ${currency}`;
  } else if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(1)}M ${currency}`;
  } else if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(1)}K ${currency}`;
  } else {
    return `${sign}${absValue.toFixed(0)} ${currency}`;
  }
}

/**
 * Format percentage values for display
 */
export function formatMarketPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
