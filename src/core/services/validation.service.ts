/**
 * Validation Service
 * Provides validation for business and market data
 */

import type { BusinessData } from '@/core/types/business';
import type { MarketData } from '@/core/types/market';
import {
  isPositiveNumber,
  isValidPercentage,
  isValidDecimalPercentage,
  isNonEmptyString,
  isValidCurrency,
} from '@/core/types/common';
import { isValidBusinessModel } from '@/core/types/business';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  value?: any;
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

export class ValidationService {
  /**
   * Validate business case data
   */
  validateBusinessData(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!data) {
      errors.push({ path: 'root', message: 'Business data is null or undefined' });
      return { valid: false, errors, warnings };
    }

    // Validate meta
    if (!data.meta) {
      errors.push({ path: 'meta', message: 'Missing meta information' });
    } else {
      if (!data.meta.title || data.meta.title.trim() === '') {
        errors.push({ path: 'meta.title', message: 'Title is required' });
      }
      
      if (!data.meta.currency || !isValidCurrency(data.meta.currency)) {
        errors.push({
          path: 'meta.currency',
          message: 'Invalid or missing currency code',
          value: data.meta.currency,
        });
      }

      if (!data.meta.business_model || !isValidBusinessModel(data.meta.business_model)) {
        errors.push({
          path: 'meta.business_model',
          message: 'Invalid or missing business model',
          value: data.meta.business_model,
        });
      }

      if (!data.meta.periods || !isPositiveNumber(data.meta.periods)) {
        errors.push({
          path: 'meta.periods',
          message: 'Periods must be a positive number',
          value: data.meta.periods,
        });
      }
    }

    // Validate assumptions
    if (!data.assumptions) {
      warnings.push({
        path: 'assumptions',
        message: 'No assumptions defined',
        suggestion: 'Add financial assumptions for better analysis',
      });
    } else {
      this.validateAssumptions(data.assumptions, errors, warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate market analysis data
   */
  validateMarketData(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!data) {
      errors.push({ path: 'root', message: 'Market data is null or undefined' });
      return { valid: false, errors, warnings };
    }

    // Validate meta
    if (!data.meta) {
      warnings.push({
        path: 'meta',
        message: 'Missing meta information',
        suggestion: 'Add title and description for better documentation',
      });
    }

    // Validate market sizing
    if (!data.market_sizing) {
      warnings.push({
        path: 'market_sizing',
        message: 'No market sizing data',
        suggestion: 'Add TAM/SAM/SOM analysis',
      });
    } else {
      this.validateMarketSizing(data.market_sizing, errors, warnings);
    }

    // Validate competitive landscape
    if (!data.competitive_landscape) {
      warnings.push({
        path: 'competitive_landscape',
        message: 'No competitive analysis',
        suggestion: 'Add competitor information',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate value with rationale structure
   */
  validateValueWithRationale(value: any, path: string, errors: ValidationError[]): boolean {
    if (!value) return false;

    if (typeof value.value !== 'number' || isNaN(value.value)) {
      errors.push({
        path: `${path}.value`,
        message: 'Value must be a valid number',
        value: value.value,
      });
      return false;
    }

    if (!value.unit || typeof value.unit !== 'string') {
      errors.push({
        path: `${path}.unit`,
        message: 'Unit must be a non-empty string',
        value: value.unit,
      });
      return false;
    }

    if (!value.rationale || typeof value.rationale !== 'string') {
      errors.push({
        path: `${path}.rationale`,
        message: 'Rationale must be a non-empty string',
        value: value.rationale,
      });
      return false;
    }

    return true;
  }

  /**
   * Validate assumptions object
   */
  private validateAssumptions(
    assumptions: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Validate pricing
    if (assumptions.pricing?.avg_unit_price) {
      this.validateValueWithRationale(
        assumptions.pricing.avg_unit_price,
        'assumptions.pricing.avg_unit_price',
        errors
      );
    }

    // Validate financial
    if (assumptions.financial?.interest_rate) {
      this.validateValueWithRationale(
        assumptions.financial.interest_rate,
        'assumptions.financial.interest_rate',
        errors
      );
    }

    // Validate customer segments
    if (assumptions.customers?.segments) {
      if (!Array.isArray(assumptions.customers.segments)) {
        errors.push({
          path: 'assumptions.customers.segments',
          message: 'Segments must be an array',
        });
      } else if (assumptions.customers.segments.length === 0) {
        warnings.push({
          path: 'assumptions.customers.segments',
          message: 'No customer segments defined',
          suggestion: 'Add customer segments for better analysis',
        });
      }
    }

    // Validate OpEx
    if (assumptions.opex && !Array.isArray(assumptions.opex)) {
      errors.push({
        path: 'assumptions.opex',
        message: 'OpEx must be an array',
      });
    }
  }

  /**
   * Validate market sizing
   */
  private validateMarketSizing(
    sizing: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (sizing.total_addressable_market) {
      const tam = sizing.total_addressable_market;
      if (!this.validateValueWithRationale(tam.base_value, 'market_sizing.total_addressable_market.base_value', errors)) {
        // Error already added
      }
      if (!this.validateValueWithRationale(tam.growth_rate, 'market_sizing.total_addressable_market.growth_rate', errors)) {
        // Error already added
      }
    }

    // Check for complete funnel
    const hasTAM = !!sizing.total_addressable_market;
    const hasSAM = !!sizing.serviceable_addressable_market;
    const hasSOM = !!sizing.serviceable_obtainable_market;

    if (hasTAM && !hasSAM) {
      warnings.push({
        path: 'market_sizing.serviceable_addressable_market',
        message: 'TAM defined but SAM missing',
        suggestion: 'Complete the market sizing funnel',
      });
    }

    if (hasSAM && !hasSOM) {
      warnings.push({
        path: 'market_sizing.serviceable_obtainable_market',
        message: 'SAM defined but SOM missing',
        suggestion: 'Complete the market sizing funnel',
      });
    }
  }

  /**
   * Cross-validate business and market data
   */
  validateCrossToolConsistency(
    businessData: BusinessData | null,
    marketData: MarketData | null
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!businessData || !marketData) {
      return { valid: true, errors, warnings };
    }

    // Check currency consistency
    if (businessData.meta.currency !== marketData.meta?.currency) {
      warnings.push({
        path: 'cross-tool.currency',
        message: 'Currency mismatch between business case and market analysis',
        suggestion: `Business: ${businessData.meta.currency}, Market: ${marketData.meta?.currency}`,
      });
    }

    // Check if market sizing aligns with business projections
    if (marketData.market_sizing?.total_addressable_market && businessData.assumptions.customers?.segments) {
      warnings.push({
        path: 'cross-tool.alignment',
        message: 'Review alignment between market size and business volumes',
        suggestion: 'Ensure business projections are realistic given market size',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Export singleton instance
export const validationService = new ValidationService();
