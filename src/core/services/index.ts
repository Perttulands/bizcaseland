/**
 * Core Services Export
 * Single point of access for all services
 */

export * from './storage.service';
export * from './validation.service';
export * from './sync.service';
export * from './json-validation.service';
export * from './ai-service';
export * from './market-ai-context';
export * from './web-search-service';
export * from './voice-service';
export * from './pitch-deck-export.service';

// Re-export commonly used service instances
export { storageService, STORAGE_KEYS } from './storage.service';
export { validationService } from './validation.service';
export { syncService } from './sync.service';
export { aiService, AVAILABLE_MODELS } from './ai-service';
export { buildMarketSystemPrompt, buildMarketContext, MARKET_QUICK_ACTIONS } from './market-ai-context';
export { webSearchService, TRUSTED_DOMAINS } from './web-search-service';
export { voiceService } from './voice-service';
