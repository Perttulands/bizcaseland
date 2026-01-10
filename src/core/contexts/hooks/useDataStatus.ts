/**
 * Data Status Hook
 * Convenience hook for checking data availability across tools
 */

import { useEffect } from 'react';
import { useData } from '../DataContext';
import type { BusinessData } from '@/core/types/business';
import type { MarketData } from '@/core/types/market';

export interface UseDataStatusReturn {
  hasBusinessData: boolean;
  hasMarketData: boolean;
  hasAnyData: boolean;
  businessData: BusinessData | null;
  marketData: MarketData | null;
}

export function useDataStatus(): UseDataStatusReturn {
  const { state, syncDataFromStorage } = useData();

  // Sync data when hook is first used
  useEffect(() => {
    syncDataFromStorage();
  }, [syncDataFromStorage]);

  return {
    hasBusinessData: state.business.hasData,
    hasMarketData: state.market.hasData,
    hasAnyData: state.business.hasData || state.market.hasData,
    businessData: state.business.data,
    marketData: state.market.data,
  };
}
