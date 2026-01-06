/**
 * Calculation Engine Export
 * Central orchestrator for all business and market calculations
 */

// Export utilities
export * from './utils';

// Export calculators
export * from './calculators/business-calculator-full';
export * from './calculators/market-calculator';

// Export evidence trail
export * from './evidence-trail-builder';

// Re-export commonly used utilities
export {
  calculateGeometricGrowth,
  calculateSeasonalGrowth,
  calculateLinearGrowth,
  calculateVolumeFromConfig,
} from './utils/growth-patterns';

export {
  calculateNPV,
  calculateIRR,
  calculateBreakEven,
  calculatePaybackPeriod,
  calculateTotalInvestmentRequired,
  isIRRError,
  formatCurrency,
  formatPercent,
  IRR_ERROR_CODES,
} from './utils/financial';
