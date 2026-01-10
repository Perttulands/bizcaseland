/**
 * Evidence Trail Visualization
 * Export all components and utilities for the evidence trail feature
 *
 * "Click any cell to see a visual chain of every source, calculation,
 * and assumption that produced that number."
 */

// Types
export * from './types';

// Components
export { EvidenceTrailTree } from './EvidenceTrailTree';
export { EvidenceTrailPanel } from './EvidenceTrailPanel';
export type { EvidenceTrailPanelProps } from './EvidenceTrailPanel';
export { EvidenceTrailCell, EvidenceTrailButton } from './EvidenceTrailCell';
export type { EvidenceTrailCellProps, EvidenceTrailButtonProps } from './EvidenceTrailCell';

// Hooks
export { useEvidenceTrail } from './useEvidenceTrail';
export type { UseEvidenceTrailOptions, UseEvidenceTrailResult } from './useEvidenceTrail';
