/**
 * Central type system export
 * Single source of truth for all type definitions
 */

// Export all common types
export * from './common';

// Export all business types
export * from './business';

// Export all market types
export * from './market';

// Export all AI types
export * from './ai';

// Export all evidence trail types
export * from './evidence-trail';

// Re-export commonly used types for convenience
export type {
  // Common
  ValueWithRationale,
  Driver,
  VolumeConfiguration,
} from './common';

export type {
  // Business
  BusinessData,
  BusinessAssumptions,
  CustomerSegment,
  MonthlyData,
  CalculatedMetrics,

  // Market
  MarketData,
  MarketSizing,
  CompetitiveLandscape,
  CustomerAnalysis,
} from './business';

export type {
  // AI
  ResearchDocument,
  ResearchSource,
  AISuggestion,
  ChatMessage,
  AIState,
} from './ai';
