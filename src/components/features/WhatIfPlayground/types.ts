/**
 * Types for What-If Playground
 * Drag sliders for key variables and watch the model update in real-time
 */

import type { Driver } from '@/core/types/common';

// ============================================================================
// Slider Configuration
// ============================================================================

/**
 * Configuration for a playground slider
 */
export interface PlaygroundSlider {
  readonly id: string;
  readonly driver: Driver;
  readonly currentValue: number;
  readonly displayValue: string;
  readonly step: number;
  readonly formatValue: (value: number) => string;
}

/**
 * Result of sensitivity calculation for a single scenario
 */
export interface ScenarioResult {
  readonly scenarioName: string;
  readonly driverValues: Record<string, number>;  // Driver path -> value
  readonly outputs: {
    readonly revenue: number;
    readonly profit: number;
    readonly cashFlow: number;
    readonly npv: number;
    readonly irr: number | null;
    readonly runway: number;  // Months until cash zero
  };
  readonly monthlyData: readonly MonthlyScenarioData[];
}

/**
 * Monthly data point for a scenario
 */
export interface MonthlyScenarioData {
  readonly month: number;
  readonly period: string;
  readonly revenue: number;
  readonly costs: number;
  readonly profit: number;
  readonly cashFlow: number;
  readonly cumulativeCashFlow: number;
}

// ============================================================================
// Playground State
// ============================================================================

/**
 * State for the What-If Playground
 */
export interface PlaygroundState {
  readonly sliders: readonly PlaygroundSlider[];
  readonly baseScenario: ScenarioResult | null;
  readonly currentScenario: ScenarioResult | null;
  readonly comparisonEnabled: boolean;
  readonly animating: boolean;
}

// ============================================================================
// Preset Scenarios
// ============================================================================

/**
 * Preset scenario for quick what-if analysis
 */
export interface PresetScenario {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly driverAdjustments: Record<string, number>;  // Path -> percentage adjustment
}

/**
 * Common preset scenarios
 */
export const PRESET_SCENARIOS: readonly PresetScenario[] = [
  {
    id: 'optimistic',
    name: 'Optimistic',
    description: '+20% revenue growth, -10% costs',
    icon: '📈',
    driverAdjustments: {
      'assumptions.unit_economics.growth_rate': 1.2,
      'assumptions.costs.total_opex': 0.9,
    },
  },
  {
    id: 'pessimistic',
    name: 'Pessimistic',
    description: '-20% revenue growth, +15% costs',
    icon: '📉',
    driverAdjustments: {
      'assumptions.unit_economics.growth_rate': 0.8,
      'assumptions.costs.total_opex': 1.15,
    },
  },
  {
    id: 'high-growth',
    name: 'High Growth',
    description: '+50% customer growth, +20% marketing spend',
    icon: '🚀',
    driverAdjustments: {
      'assumptions.customers.monthly_growth': 1.5,
      'assumptions.costs.sales_marketing_percent': 1.2,
    },
  },
  {
    id: 'cost-cutting',
    name: 'Cost Cutting',
    description: '-30% operating costs',
    icon: '✂️',
    driverAdjustments: {
      'assumptions.costs.total_opex': 0.7,
      'assumptions.costs.rd_percent': 0.8,
      'assumptions.costs.ga_percent': 0.7,
    },
  },
  {
    id: 'price-increase',
    name: 'Price Increase',
    description: '+25% unit price',
    icon: '💰',
    driverAdjustments: {
      'assumptions.pricing.avg_unit_price': 1.25,
    },
  },
] as const;

// ============================================================================
// Chart Configuration
// ============================================================================

export interface ChartConfig {
  readonly showBaseline: boolean;
  readonly animationDuration: number;  // ms
  readonly yAxisLabel: string;
  readonly xAxisLabel: string;
}

export const DEFAULT_CHART_CONFIG: ChartConfig = {
  showBaseline: true,
  animationDuration: 300,
  yAxisLabel: 'EUR',
  xAxisLabel: 'Month',
};
