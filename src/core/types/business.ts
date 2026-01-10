/**
 * Business Case specific types
 */

import type {
  ValueWithRationale,
  VolumeConfiguration,
  ImplementationTimeline,
  TimeSeriesDataPoint,
  GrowthSettings,
  Driver,
  CurrencyCode,
  FrequencyType,
} from './common';

// ============================================================================
// Business Meta Information
// ============================================================================

export type BusinessModelType = 'recurring' | 'unit_sales' | 'cost_savings';

export interface BusinessMeta {
  readonly title: string;
  readonly description: string;
  readonly business_model: BusinessModelType;
  readonly archetype?: string;
  readonly currency: CurrencyCode;
  readonly periods: number;
  readonly frequency: FrequencyType;
}

// ============================================================================
// Financial Assumptions
// ============================================================================

export interface PricingAssumptions {
  readonly avg_unit_price?: ValueWithRationale;
  readonly yearly_adjustments?: {
    readonly pricing_factors?: readonly {
      readonly year: number;
      readonly factor: number;
      readonly rationale: string;
    }[];
    readonly price_overrides?: readonly {
      readonly period: number;
      readonly price: number;
      readonly rationale: string;
    }[];
  };
}

export interface FinancialAssumptions {
  readonly interest_rate?: ValueWithRationale;
}

export interface UnitEconomicsAssumptions {
  readonly cogs_pct?: ValueWithRationale;
  readonly cac?: ValueWithRationale;
}

// ============================================================================
// Customer Assumptions
// ============================================================================

export interface CustomerSegment {
  readonly id: string;
  readonly label: string;
  readonly rationale: string;
  readonly volume?: VolumeConfiguration;
}

export interface CustomerAssumptions {
  readonly churn_pct?: ValueWithRationale;
  readonly segments?: readonly CustomerSegment[];
}

// ============================================================================
// Operating Expenses
// ============================================================================

/**
 * OpEx item with support for both fixed and variable costs
 * For backwards compatibility, 'value' represents fixed cost if used alone
 * New format supports fixed + variable components that scale with business growth
 */
export interface OpexItem {
  readonly name: string;
  // Legacy format: fixed cost only (backwards compatible)
  readonly value?: ValueWithRationale;
  // New format: detailed cost structure with variable components
  readonly cost_structure?: {
    readonly fixed_component?: ValueWithRationale; // Base monthly cost
    readonly variable_revenue_rate?: ValueWithRationale; // % of revenue (0-1 decimal)
    readonly variable_volume_rate?: ValueWithRationale; // Cost per unit/customer
  };
}

// ============================================================================
// Capital Expenses
// ============================================================================

export interface CapexTimeline {
  readonly type: TimeSeriesType;
  readonly pattern_type?: GrowthPatternType;
  readonly series?: readonly TimeSeriesDataPoint[];
}

export interface CapexItem {
  readonly name: string;
  readonly timeline?: CapexTimeline;
}

// ============================================================================
// Cost Savings (for cost_savings business model)
// ============================================================================

export interface BaselineCost {
  readonly id: string;
  readonly label: string;
  readonly category: 'operational' | 'administrative' | 'technology' | 'other';
  readonly current_monthly_cost: ValueWithRationale;
  readonly savings_potential_pct: ValueWithRationale;
  readonly implementation_timeline?: ImplementationTimeline;
}

export interface EfficiencyGain {
  readonly id: string;
  readonly label: string;
  readonly metric: string;
  readonly baseline_value: ValueWithRationale;
  readonly improved_value: ValueWithRationale;
  readonly value_per_unit: ValueWithRationale;
  readonly implementation_timeline?: ImplementationTimeline;
}

export interface CostSavingsAssumptions {
  readonly baseline_costs?: readonly BaselineCost[];
  readonly efficiency_gains?: readonly EfficiencyGain[];
}

// ============================================================================
// Complete Business Assumptions
// ============================================================================

export interface BusinessAssumptions {
  readonly pricing?: PricingAssumptions;
  readonly financial?: FinancialAssumptions;
  readonly customers?: CustomerAssumptions;
  readonly unit_economics?: UnitEconomicsAssumptions;
  readonly opex?: readonly OpexItem[];
  readonly capex?: readonly CapexItem[];
  readonly cost_savings?: CostSavingsAssumptions;
  readonly growth_settings?: GrowthSettings;
}

// ============================================================================
// Complete Business Data Structure
// ============================================================================

export interface BusinessData {
  readonly schema_version?: string;
  readonly meta: BusinessMeta;
  readonly assumptions: BusinessAssumptions;
  readonly drivers?: readonly Driver[];
  readonly scenarios?: readonly any[];
  readonly structure?: any;
}

// ============================================================================
// Calculation Results
// ============================================================================

export interface MonthlyData {
  readonly month: number;
  readonly date: Date;
  readonly salesVolume: number;
  readonly newCustomers: number;
  readonly existingCustomers: number;
  readonly unitPrice: number;
  readonly revenue: number;
  readonly cogs: number;
  readonly grossProfit: number;
  readonly salesMarketing: number;
  readonly totalCAC: number;
  readonly cac: number;
  readonly rd: number;
  readonly ga: number;
  readonly totalOpex: number;
  readonly ebitda: number;
  readonly capex: number;
  readonly netCashFlow: number;
  // Cost savings specific fields
  readonly baselineCosts?: number;
  readonly costSavings?: number;
  readonly efficiencyGains?: number;
  readonly totalBenefits?: number;
}

export interface CalculatedMetrics {
  readonly totalRevenue: number;
  readonly netProfit: number;
  readonly npv: number;
  readonly irr: number;
  readonly paybackPeriod: number;
  readonly totalInvestmentRequired: number;
  readonly breakEvenMonth: number;
  readonly monthlyData: readonly MonthlyData[];
}

// ============================================================================
// Type Guards
// ============================================================================

export function isValidBusinessModel(model: string): model is BusinessModelType {
  return ['recurring', 'unit_sales', 'cost_savings'].includes(model);
}
