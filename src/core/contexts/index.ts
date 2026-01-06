/**
 * Core Contexts Export
 */

export * from './DataContext';
export * from './hooks';

// Re-export main context and commonly used hooks
export { DataProvider, useData } from './DataContext';
export { useBusinessData } from './hooks/useBusinessData';
export { useMarketData } from './hooks/useMarketData';
export { useDataStatus } from './hooks/useDataStatus';
export { useNavigation } from './hooks/useNavigation';
export { AIProvider, useAI } from './AIContext';
export { DebateProvider, useDebate } from './DebateContext';
