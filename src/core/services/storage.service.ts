/**
 * Centralized Storage Service
 * Handles all localStorage operations with error handling and type safety
 */

export class StorageService {
  /**
   * Save data to localStorage with error handling
   */
  save<T>(key: string, data: T): boolean {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      console.log(`[StorageService] Saved to ${key}`);
      return true;
    } catch (error) {
      console.error(`[StorageService] Failed to save ${key}:`, error);
      return false;
    }
  }

  /**
   * Load data from localStorage with error handling
   */
  load<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        console.log(`[StorageService] No data found for ${key}`);
        return null;
      }
      const parsed = JSON.parse(item) as T;
      console.log(`[StorageService] Loaded from ${key}`);
      return parsed;
    } catch (error) {
      console.error(`[StorageService] Failed to load ${key}:`, error);
      return null;
    }
  }

  /**
   * Load data with a default value if not found
   */
  loadWithDefault<T>(key: string, defaultValue: T): T {
    const data = this.load<T>(key);
    return data !== null ? data : defaultValue;
  }

  /**
   * Remove data from localStorage
   */
  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      console.log(`[StorageService] Removed ${key}`);
      return true;
    } catch (error) {
      console.error(`[StorageService] Failed to remove ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if a key exists in localStorage
   */
  exists(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Clear all data from localStorage (use with caution!)
   */
  clear(): boolean {
    try {
      localStorage.clear();
      console.log('[StorageService] Cleared all data');
      return true;
    } catch (error) {
      console.error('[StorageService] Failed to clear data:', error);
      return false;
    }
  }

  /**
   * Get all keys in localStorage
   */
  getAllKeys(): string[] {
    return Object.keys(localStorage);
  }

  /**
   * Get all keys matching a prefix
   */
  getKeysByPrefix(prefix: string): string[] {
    return this.getAllKeys().filter(key => key.startsWith(prefix));
  }

  /**
   * Remove all keys matching a prefix
   */
  removeByPrefix(prefix: string): boolean {
    try {
      const keys = this.getKeysByPrefix(prefix);
      keys.forEach(key => localStorage.removeItem(key));
      console.log(`[StorageService] Removed ${keys.length} keys with prefix ${prefix}`);
      return true;
    } catch (error) {
      console.error(`[StorageService] Failed to remove keys with prefix ${prefix}:`, error);
      return false;
    }
  }
}

// Export a singleton instance
export const storageService = new StorageService();

// Export storage keys as constants
export const STORAGE_KEYS = {
  // Business data
  BUSINESS_DATA: 'businessCaseData',
  BUSINESS_DRIVERS: 'businessCaseDrivers',

  // Market data
  MARKET_DATA: 'bizcaseland_market_data',
  MARKET_DRIVERS: 'bizcaseland_market_drivers',

  // UI state
  ACTIVE_MODE: 'bizcaseland_active_mode',
  THEME: 'bizcaseland-ui-theme',

  // Projects (future use)
  PROJECTS: 'bizcaseland_projects',
  CURRENT_PROJECT: 'bizcaseland_current_project',

  // Settings
  USER_SETTINGS: 'bizcaseland_settings',

  // AI / Research
  RESEARCH_DOCUMENTS: 'bizcaseland_research_documents',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
