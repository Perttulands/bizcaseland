/**
 * Market Data Hook
 * Convenience hook for accessing market data from DataContext
 */

import { useMemo } from 'react';
import { useData } from '../DataContext';
import type { MarketData } from '@/core/types/market';

export interface UseMarketDataReturn {
  // Data
  data: MarketData | null;
  hasData: boolean;
  lastModified: string | null;
  
  // Operations
  updateData: (data: MarketData | null) => void;
  updateAssumption: (path: string, value: any) => void;
  clearData: () => void;
  
  // Driver management
  addDriver: (label: string, path: string, range: number[], rationale: string) => void;
  removeDriver: (path: string) => void;
  updateDriverRange: (path: string, range: number[]) => void;
  
  // Export
  exportData: () => string;
}

export function useMarketData(): UseMarketDataReturn {
  const {
    state,
    updateMarketData,
    updateMarketAssumption,
    clearMarketData,
    addMarketDriver,
    removeMarketDriver,
    updateMarketDriverRange,
  } = useData();

  const exportData = useMemo(() => {
    return () => {
      if (!state.market.data) return '{}';
      try {
        return JSON.stringify(state.market.data, null, 2);
      } catch (error) {
        console.error('Failed to export market data:', error);
        return '{}';
      }
    };
  }, [state.market.data]);

  return {
    data: state.market.data,
    hasData: state.market.hasData,
    lastModified: state.market.lastModified,
    updateData: updateMarketData,
    updateAssumption: updateMarketAssumption,
    clearData: clearMarketData,
    addDriver: addMarketDriver,
    removeDriver: removeMarketDriver,
    updateDriverRange: updateMarketDriverRange,
    exportData,
  };
}
