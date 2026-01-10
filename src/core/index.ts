/**
 * Core Infrastructure Export
 * Central export point for all core functionality
 */

// Export types
export * from './types';

// Export services
export * from './services';

// Export contexts
export * from './contexts';

// Export engine
export * from './engine';

// Re-export commonly used items
export type {
  BusinessData,
  MarketData,
  ValueWithRationale,
  Driver,
} from './types';

export {
  storageService,
  validationService,
  syncService,
  STORAGE_KEYS,
} from './services';

export {
  DataProvider,
  useData,
  useBusinessData,
  useMarketData,
  useDataStatus,
  useNavigation,
} from './contexts';
