/**
 * Growth Pattern Utilities
 * Shared logic for calculating different growth patterns
 */

import type { VolumeConfiguration, ValueWithRationale } from '@/core/types/common';

/**
 * Calculate geometric growth for a given period
 */
export function calculateGeometricGrowth(
  start: number,
  monthlyGrowthRate: number,
  monthIndex: number
): number {
  return start * Math.pow(1 + monthlyGrowthRate, monthIndex);
}

/**
 * Calculate seasonal growth for a given period
 */
export function calculateSeasonalGrowth(
  baseYearTotal: number,
  seasonalityIndex: number[],
  yoyGrowth: number,
  monthIndex: number
): number {
  if (seasonalityIndex.length !== 12) {
    console.error('Seasonality index must have exactly 12 values');
    return 0;
  }

  const year = Math.floor(monthIndex / 12);
  const monthOfYear = monthIndex % 12;
  
  // Apply year-over-year growth
  const growthFactor = Math.pow(1 + yoyGrowth, year);
  
  // Calculate monthly volume from annual total
  const baseMonthlyVolume = baseYearTotal / 12;
  
  // Apply seasonality
  const seasonalVolume = baseMonthlyVolume * seasonalityIndex[monthOfYear];
  
  // Apply growth
  return seasonalVolume * growthFactor;
}

/**
 * Calculate linear growth for a given period
 */
export function calculateLinearGrowth(
  start: number,
  monthlyIncrease: number,
  monthIndex: number
): number {
  return start + (monthlyIncrease * monthIndex);
}

/**
 * Get volume from time series data
 */
export function getTimeSeriesValue(
  series: readonly { period: number; value: number }[],
  monthIndex: number
): number {
  // Find exact match
  const exactMatch = series.find(s => s.period === monthIndex + 1);
  if (exactMatch) {
    return exactMatch.value;
  }

  // If no exact match, interpolate between closest points
  const sortedSeries = [...series].sort((a, b) => a.period - b.period);
  
  const period = monthIndex + 1;
  
  // Find surrounding points
  const before = sortedSeries.filter(s => s.period <= period);
  const after = sortedSeries.filter(s => s.period > period);
  
  if (before.length === 0) {
    return after[0]?.value || 0;
  }
  
  if (after.length === 0) {
    return before[before.length - 1].value;
  }
  
  // Linear interpolation
  const p1 = before[before.length - 1];
  const p2 = after[0];
  
  const ratio = (period - p1.period) / (p2.period - p1.period);
  return p1.value + (p2.value - p1.value) * ratio;
}

/**
 * Apply yearly adjustments (factors and overrides) to a base volume
 */
export function applyYearlyAdjustments(
  baseVolume: number,
  monthIndex: number,
  yearlyAdjustments?: {
    readonly volume_factors?: readonly {
      readonly year: number;
      readonly factor: number;
      readonly rationale: string;
    }[];
    readonly volume_overrides?: readonly {
      readonly period: number;
      readonly volume: number;
      readonly rationale: string;
    }[];
  }
): number {
  let volume = baseVolume;

  if (!yearlyAdjustments) {
    return volume;
  }

  // Check for period-specific override
  const override = yearlyAdjustments.volume_overrides?.find(
    o => o.period === monthIndex + 1
  );
  
  if (override) {
    return override.volume;
  }

  // Apply year-specific factor
  const year = Math.floor(monthIndex / 12) + 1;
  const factor = yearlyAdjustments.volume_factors?.find(f => f.year === year);
  
  if (factor) {
    volume *= factor.factor;
  }

  return volume;
}

/**
 * Calculate volume based on configuration
 */
export function calculateVolumeFromConfig(
  config: VolumeConfiguration,
  monthIndex: number
): number {
  if (config.type === 'time_series' && config.series) {
    // Time series takes precedence
    return getTimeSeriesValue(config.series, monthIndex);
  }

  // Pattern-based calculation
  let baseVolume = 0;

  switch (config.pattern_type) {
    case 'geom_growth':
      if (config.base_year_total?.value && config.monthly_growth_rate?.value) {
        const monthlyStart = config.base_year_total.value / 12;
        baseVolume = calculateGeometricGrowth(
          monthlyStart,
          config.monthly_growth_rate.value,
          monthIndex
        );
      }
      break;

    case 'seasonal_growth':
      if (config.base_year_total?.value && config.seasonality_index_12 && config.yoy_growth?.value) {
        baseVolume = calculateSeasonalGrowth(
          config.base_year_total.value,
          config.seasonality_index_12,
          config.yoy_growth.value,
          monthIndex
        );
      }
      break;

    case 'linear_growth':
      if (config.base_year_total?.value && config.monthly_flat_increase?.value) {
        const monthlyStart = config.base_year_total.value / 12;
        baseVolume = calculateLinearGrowth(
          monthlyStart,
          config.monthly_flat_increase.value,
          monthIndex
        );
      }
      break;
  }

  // Apply yearly adjustments
  return applyYearlyAdjustments(baseVolume, monthIndex, config.yearly_adjustments);
}
