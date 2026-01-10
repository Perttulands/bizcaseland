/**
 * Market Analysis specific types
 */

import type {
  ValueWithRationale,
  Driver,
  CurrencyCode,
  PenetrationStrategy,
} from './common';

// ============================================================================
// Market Meta Information
// ============================================================================

export interface MarketMeta {
  readonly title?: string;
  readonly description?: string;
  readonly currency?: CurrencyCode;
  readonly base_year?: number;
  readonly analysis_horizon_years?: number;
  readonly created_date?: string;
  readonly analyst?: string;
}

// ============================================================================
// Market Sizing
// ============================================================================

export interface TotalAddressableMarket {
  readonly base_value: ValueWithRationale;
  readonly growth_rate: ValueWithRationale;
  readonly market_definition: string;
  readonly data_sources: readonly string[];
}

export interface ServiceableAddressableMarket {
  readonly percentage_of_tam: ValueWithRationale;
  readonly geographic_constraints: string;
  readonly regulatory_constraints: string;
  readonly capability_constraints: string;
}

export interface ServiceableObtainableMarket {
  readonly percentage_of_sam: ValueWithRationale;
  readonly resource_constraints: string;
  readonly competitive_barriers: string;
  readonly time_constraints: string;
}

export interface MarketSizing {
  readonly total_addressable_market?: TotalAddressableMarket;
  readonly serviceable_addressable_market?: ServiceableAddressableMarket;
  readonly serviceable_obtainable_market?: ServiceableObtainableMarket;
}

// ============================================================================
// Market Share & Position
// ============================================================================

export interface CurrentPosition {
  readonly current_share: ValueWithRationale;
  readonly market_entry_date: string;
  readonly current_revenue: ValueWithRationale;
}

export interface MarketMilestone {
  readonly year: number;
  readonly milestone: string;
  readonly target_share: number;
  readonly rationale: string;
}

export interface TargetPosition {
  readonly target_share: ValueWithRationale;
  readonly target_timeframe: ValueWithRationale;
  readonly penetration_strategy: PenetrationStrategy;
  readonly key_milestones: readonly MarketMilestone[];
}

export interface MarketShare {
  readonly current_position?: CurrentPosition;
  readonly target_position?: TargetPosition;
}

// ============================================================================
// Competitive Landscape
// ============================================================================

export interface PositioningAxes {
  readonly x_axis_label: string;
  readonly y_axis_label: string;
}

export interface OurPosition {
  readonly x: number;
  readonly y: number;
}

export interface MarketStructure {
  readonly concentration_level: 'fragmented' | 'moderately_concentrated' | 'highly_concentrated';
  readonly concentration_rationale: string;
  readonly barriers_to_entry: 'low' | 'medium' | 'high';
  readonly barriers_description: string;
}

export interface CompetitorPricing {
  readonly base_price?: ValueWithRationale;
  readonly pricing_model?: string; // 'subscription' | 'per-unit' | 'freemium' | 'enterprise'
  readonly pricing_tier_low?: ValueWithRationale;
  readonly pricing_tier_high?: ValueWithRationale;
}

export interface CompetitorFeature {
  readonly name: string;
  readonly has_feature: boolean;
  readonly notes?: string;
  readonly source?: string;
}

export interface Competitor {
  readonly name: string;
  readonly market_share: ValueWithRationale;
  readonly positioning: string;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly threat_level: 'high' | 'medium' | 'low';
  readonly competitive_response: string;
  readonly x_position?: number;
  readonly y_position?: number;
  // Extended fields for competitive intelligence matrix
  readonly website?: string;
  readonly pricing?: CompetitorPricing;
  readonly features?: readonly CompetitorFeature[];
  readonly founded_year?: number;
  readonly employee_count?: ValueWithRationale;
  readonly funding?: ValueWithRationale;
  readonly headquarters?: string;
  readonly data_sources?: readonly string[]; // URLs/references for all data
}

export interface CompetitiveAdvantage {
  readonly advantage: string;
  readonly sustainability: 'high' | 'medium' | 'low';
  readonly rationale: string;
}

export interface CompetitiveLandscape {
  readonly positioning_axes?: PositioningAxes;
  readonly our_position?: OurPosition;
  readonly market_structure?: MarketStructure;
  readonly competitors?: readonly Competitor[];
  readonly competitive_advantages?: readonly CompetitiveAdvantage[];
}

// ============================================================================
// Customer Analysis
// ============================================================================

export interface CustomerSegmentInfo {
  readonly id: string;
  readonly name: string;
  readonly size: ValueWithRationale;
  readonly growth_rate: ValueWithRationale;
  readonly characteristics: string;
  readonly pain_points: readonly string[];
  readonly buying_behavior: string;
  readonly target_share?: ValueWithRationale;
}

export interface CustomerValue {
  readonly annual_value: ValueWithRationale;
  readonly lifetime_value: ValueWithRationale;
  readonly calculation_basis: string;
}

export interface CustomerAnalysis {
  readonly segments?: readonly CustomerSegmentInfo[];
  readonly avg_customer_value?: CustomerValue;
  readonly acquisition_strategy?: string;
  readonly retention_strategy?: string;
}

// ============================================================================
// Market Trends & Drivers
// ============================================================================

export interface MarketTrend {
  readonly trend: string;
  readonly impact: 'high' | 'medium' | 'low';
  readonly timeframe: string;
  readonly description: string;
}

export interface RegulatoryFactor {
  readonly regulation: string;
  readonly impact: 'positive' | 'neutral' | 'negative';
  readonly compliance_requirements: string;
}

export interface TechnologyTrend {
  readonly technology: string;
  readonly adoption_stage: 'emerging' | 'growing' | 'mature' | 'declining';
  readonly impact_on_market: string;
}

export interface MarketTrendsDrivers {
  readonly macro_trends?: readonly MarketTrend[];
  readonly regulatory_factors?: readonly RegulatoryFactor[];
  readonly technology_trends?: readonly TechnologyTrend[];
}

// ============================================================================
// Risk Assessment
// ============================================================================

export interface MarketRisk {
  readonly risk: string;
  readonly probability: 'high' | 'medium' | 'low';
  readonly impact: 'high' | 'medium' | 'low';
  readonly mitigation_strategy: string;
}

export interface RiskAssessment {
  readonly risks?: readonly MarketRisk[];
  readonly overall_risk_level?: 'high' | 'medium' | 'low';
}

// ============================================================================
// Go-to-Market Strategy
// ============================================================================

export interface MarketingChannel {
  readonly channel: string;
  readonly effectiveness: ValueWithRationale;
  readonly cost_per_acquisition: ValueWithRationale;
  readonly reach: string;
}

export interface SalesStrategy {
  readonly approach: string;
  readonly sales_cycle_length: ValueWithRationale;
  readonly conversion_rate: ValueWithRationale;
}

export interface GoToMarketStrategy {
  readonly target_segments?: readonly string[];
  readonly positioning_statement?: string;
  readonly value_proposition?: string;
  readonly marketing_channels?: readonly MarketingChannel[];
  readonly sales_strategy?: SalesStrategy;
  readonly pricing_strategy?: string;
  readonly launch_timeline?: string;
}

// ============================================================================
// Complete Market Data Structure
// ============================================================================

export interface MarketData {
  readonly schema_version?: string;
  readonly meta?: MarketMeta;
  readonly drivers?: readonly Driver[];
  readonly market_sizing?: MarketSizing;
  readonly market_share?: MarketShare;
  readonly competitive_landscape?: CompetitiveLandscape;
  readonly customer_analysis?: CustomerAnalysis;
  readonly market_trends?: MarketTrendsDrivers;
  readonly risk_assessment?: RiskAssessment;
  readonly go_to_market?: GoToMarketStrategy;
}

// ============================================================================
// Market Calculation Results
// ============================================================================

export interface MarketSizeProjection {
  readonly year: number;
  readonly tam: number;
  readonly sam: number;
  readonly som: number;
  readonly our_revenue: number;
  readonly market_share: number;
}

export interface MarketCalculatedMetrics {
  readonly current_tam: number;
  readonly current_sam: number;
  readonly current_som: number;
  readonly projected_revenue: number;
  readonly implied_market_share: number;
  readonly projections: readonly MarketSizeProjection[];
}
