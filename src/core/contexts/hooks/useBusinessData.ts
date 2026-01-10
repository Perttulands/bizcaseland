/**
 * Business Data Hook
 * Convenience hook for accessing business data from DataContext
 */

import { useMemo } from 'react';
import { useData } from '../DataContext';
import type { BusinessData } from '@/core/types/business';

export interface UseBusinessDataReturn {
  // Data
  data: BusinessData | null;
  hasData: boolean;
  lastModified: string | null;
  
  // Operations
  updateData: (data: BusinessData | null) => void;
  updateAssumption: (path: string, value: any) => void;
  clearData: () => void;
  
  // Driver management
  addDriver: (path: string, key: string, range: number[], rationale: string, unit?: string) => void;
  removeDriver: (path: string) => void;
  updateDriverRange: (path: string, range: number[]) => void;
  
  // Export
  exportData: () => string;
}

export function useBusinessData(): UseBusinessDataReturn {
  const {
    state,
    updateBusinessData,
    updateBusinessAssumption,
    clearBusinessData,
    addBusinessDriver,
    removeBusinessDriver,
    updateBusinessDriverRange,
  } = useData();

  const exportData = useMemo(() => {
    return () => {
      if (!state.business.data) return '{}';
      try {
        return JSON.stringify(state.business.data, null, 2);
      } catch (error) {
        console.error('Failed to export business data:', error);
        return '{}';
      }
    };
  }, [state.business.data]);

  return {
    data: state.business.data,
    hasData: state.business.hasData,
    lastModified: state.business.lastModified,
    updateData: updateBusinessData,
    updateAssumption: updateBusinessAssumption,
    clearData: clearBusinessData,
    addDriver: addBusinessDriver,
    removeDriver: removeBusinessDriver,
    updateDriverRange: updateBusinessDriverRange,
    exportData,
  };
}
