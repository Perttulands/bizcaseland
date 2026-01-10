/**
 * Common types shared across all modules
 * These types are used by both Business Case and Market Analysis tools
 */

// ============================================================================
// Base Utility Types
// ============================================================================

export type NonEmptyString = string & { readonly __brand: unique symbol };
export type PositiveNumber = number & { readonly __brand: unique symbol };
export type Percentage = number & { readonly __brand: unique symbol }; // 0-100
export type DecimalPercentage = number & { readonly __brand: unique symbol }; // 0-1

// ============================================================================
// Standard Enums
// ============================================================================

export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'SEK' | 'NOK' | 'DKK';
export type FrequencyType = 'monthly' | 'quarterly' | 'annually';
export type GrowthPatternType = 'geom_growth' | 'seasonal_growth' | 'linear_growth';
export type TimeSeriesType = 'pattern' | 'time_series';
export type PenetrationStrategy = 'linear' | 'exponential' | 's_curve';

// ============================================================================
// Core Data Structures
// ============================================================================

/**
 * Standard value with metadata pattern used throughout the application
 * All numerical inputs should include rationale for AI transparency
 */
export interface ValueWithRationale<T = number> {
  readonly value: T;
  readonly unit: string;
  readonly rationale: string;
  readonly link?: string; // Optional source URL
  // AI backing fields (optional for backward compatibility)
  readonly researchIds?: readonly string[];  // References to ResearchDocument IDs
  readonly aiGenerated?: boolean;            // Was this value AI-suggested?
  readonly aiConfidence?: number;            // AI confidence score (0-1)
}

/**
 * Time series data point for temporal data
 */
export interface TimeSeriesDataPoint {
  readonly period: number;
  readonly value: number;
  readonly unit: string;
  readonly rationale: string;
}

/**
 * Implementation timeline for phased rollouts
 */
export interface ImplementationTimeline {
  readonly start_month: number;
  readonly ramp_up_months: number;
  readonly full_implementation_month: number;
}

/**
 * Volume configuration supporting multiple growth patterns
 */
export interface VolumeConfiguration {
  readonly type: TimeSeriesType;
  readonly pattern_type?: GrowthPatternType;
  readonly series?: readonly TimeSeriesDataPoint[];
  readonly base_year_total?: ValueWithRationale;
  readonly seasonality_index_12?: readonly number[];
  readonly yoy_growth?: ValueWithRationale;
  readonly monthly_growth_rate?: ValueWithRationale;
  readonly monthly_flat_increase?: ValueWithRationale;
  readonly yearly_adjustments?: {
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
  };
}

/**
 * Growth settings for different growth patterns
 */
export interface GrowthSettings {
  readonly geom_growth?: {
    readonly start?: ValueWithRationale;
    readonly monthly_growth?: ValueWithRationale;
  };
  readonly seasonal_growth?: {
    readonly base_year_total?: ValueWithRationale;
    readonly seasonality_index_12?: ValueWithRationale<readonly number[]>;
    readonly yoy_growth?: ValueWithRationale;
  };
  readonly linear_growth?: {
    readonly start?: ValueWithRationale;
    readonly monthly_flat_increase?: ValueWithRationale;
  };
}

// ============================================================================
// Sensitivity Analysis
// ============================================================================

/**
 * Driver for sensitivity analysis
 * Defines which assumption to vary and by how much
 */
export interface Driver {
  readonly key: string;
  readonly label: string;
  readonly path: string; // JSON path to the value
  readonly range: readonly [number, number]; // Min and max values
  readonly rationale: string;
  readonly unit?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isValidCurrency(currency: string): currency is CurrencyCode {
  return ['EUR', 'USD', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK'].includes(currency);
}

export function isPositiveNumber(value: number): value is PositiveNumber {
  return typeof value === 'number' && value > 0 && !isNaN(value) && isFinite(value);
}

export function isValidPercentage(value: number): value is Percentage {
  return typeof value === 'number' && value >= 0 && value <= 100 && !isNaN(value) && isFinite(value);
}

export function isValidDecimalPercentage(value: number): value is DecimalPercentage {
  return typeof value === 'number' && value >= 0 && value <= 1 && !isNaN(value) && isFinite(value);
}

export function isNonEmptyString(value: string): value is NonEmptyString {
  return typeof value === 'string' && value.trim().length > 0;
}

// ============================================================================
// Type Assertion Helpers
// ============================================================================

export function assertPositiveNumber(value: number, fieldName: string): PositiveNumber {
  if (!isPositiveNumber(value)) {
    throw new Error(`${fieldName} must be a positive number, got: ${value}`);
  }
  return value;
}

export function assertValidPercentage(value: number, fieldName: string): Percentage {
  if (!isValidPercentage(value)) {
    throw new Error(`${fieldName} must be a percentage between 0 and 100, got: ${value}`);
  }
  return value;
}

export function assertNonEmptyString(value: string, fieldName: string): NonEmptyString {
  if (!isNonEmptyString(value)) {
    throw new Error(`${fieldName} must be a non-empty string, got: "${value}"`);
  }
  return value;
}
