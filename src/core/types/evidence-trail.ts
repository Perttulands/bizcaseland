/**
 * Evidence Trail types for provenance visualization
 * Enables tracing the chain of sources, calculations, and assumptions
 * that produce any calculated value in the business case
 */

import type { ValueWithRationale } from './common';

/**
 * Node type in the evidence trail tree
 */
export type EvidenceNodeType =
  | 'calculated'    // Result of a calculation
  | 'assumption'    // User-defined assumption
  | 'input'         // Direct input value
  | 'formula'       // Calculation formula/operation
  | 'driver'        // Sensitivity driver
  | 'external';     // External data source

/**
 * A node in the evidence trail tree
 */
export interface EvidenceNode {
  readonly id: string;
  readonly type: EvidenceNodeType;
  readonly label: string;
  readonly value?: number | string;
  readonly unit?: string;
  readonly formula?: string;
  readonly rationale?: string;
  readonly path?: string;          // JSON path to the source value
  readonly link?: string;          // External source URL
  readonly children: readonly EvidenceNode[];
  readonly isDriver?: boolean;     // Is this a sensitivity driver?
  readonly aiGenerated?: boolean;  // Was this AI-suggested?
  readonly confidence?: number;    // AI confidence score
}

/**
 * Context for generating evidence trails
 */
export interface EvidenceContext {
  readonly metricKey: string;       // Key of the metric being traced
  readonly metricLabel: string;     // Human-readable label
  readonly month?: number;          // Optional: specific month for time-series data
  readonly value: number;           // The calculated value
  readonly currency?: string;       // Currency code for formatting
}

/**
 * Metric definition for evidence trail mapping
 */
export interface MetricDefinition {
  readonly key: string;
  readonly label: string;
  readonly category: 'revenue' | 'costs' | 'profit' | 'volume' | 'efficiency' | 'investment';
  readonly formula: string;
  readonly dependencies: readonly string[];  // Keys of dependent metrics
}

/**
 * Complete evidence trail for a specific value
 */
export interface EvidenceTrail {
  readonly context: EvidenceContext;
  readonly root: EvidenceNode;
  readonly generatedAt: Date;
}
