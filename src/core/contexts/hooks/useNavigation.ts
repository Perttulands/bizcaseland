/**
 * Navigation Hook
 * Convenience hook for navigation and mode switching
 */

import { useData, type AnalysisMode } from '../DataContext';

export interface UseNavigationReturn {
  activeMode: AnalysisMode;
  switchMode: (mode: AnalysisMode) => void;
  switchToLanding: () => void;
  switchToBusiness: () => void;
  switchToMarket: () => void;
  syncFromStorage: () => void;
}

export function useNavigation(): UseNavigationReturn {
  const { state, switchMode, syncDataFromStorage } = useData();

  return {
    activeMode: state.ui.activeMode,
    switchMode,
    switchToLanding: () => switchMode('landing'),
    switchToBusiness: () => switchMode('business'),
    switchToMarket: () => switchMode('market'),
    syncFromStorage: syncDataFromStorage,
  };
}
