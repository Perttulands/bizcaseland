/**
 * Types for Evidence Trail Visualization
 * Defines the provenance graph structure for cell values
 */

import type { ResearchDocument, ResearchSource } from '@/core/types/ai';

// ============================================================================
// Provenance Node Types
// ============================================================================

export type ProvenanceNodeType =
  | 'value'        // Direct input value
  | 'assumption'   // User/AI assumption
  | 'calculation'  // Calculated value
  | 'source'       // External source (URL)
  | 'research'     // AI research document
  | 'benchmark';   // Industry benchmark

/**
 * A node in the provenance graph
 */
export interface ProvenanceNode {
  readonly id: string;
  readonly type: ProvenanceNodeType;
  readonly label: string;
  readonly value?: number | string;
  readonly unit?: string;
  readonly description?: string;
  readonly confidence?: number;  // 0-1 confidence score
  readonly timestamp?: string;   // ISO timestamp
  readonly children?: readonly ProvenanceNode[];

  // Type-specific data
  readonly source?: ResearchSource;      // For 'source' type
  readonly research?: ResearchDocument;  // For 'research' type
  readonly formula?: string;             // For 'calculation' type
  readonly dataPath?: string;            // JSON path to value
}

/**
 * The complete evidence trail for a cell
 */
export interface EvidenceTrail {
  readonly cellPath: string;         // JSON path to the cell
  readonly cellLabel: string;        // Human-readable label
  readonly currentValue: number | string;
  readonly unit?: string;
  readonly lastUpdated: string;      // ISO timestamp
  readonly root: ProvenanceNode;     // Root of provenance tree
  readonly aiGenerated?: boolean;
  readonly overallConfidence?: number;
}

// ============================================================================
// Display Configuration
// ============================================================================

export interface EvidenceTrailDisplayConfig {
  readonly maxDepth?: number;        // Max tree depth to show
  readonly showTimestamps?: boolean;
  readonly showConfidence?: boolean;
  readonly expandByDefault?: boolean;
  readonly highlightAI?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate overall confidence from a provenance tree
 */
export function calculateOverallConfidence(node: ProvenanceNode): number {
  if (!node.children || node.children.length === 0) {
    return node.confidence ?? 1;
  }

  const childConfidences = node.children.map(calculateOverallConfidence);
  const avgChildConfidence = childConfidences.reduce((a, b) => a + b, 0) / childConfidences.length;

  // Combine node confidence with children (weighted toward lower confidence)
  const nodeConfidence = node.confidence ?? 1;
  return Math.min(nodeConfidence, avgChildConfidence) * 0.8 + avgChildConfidence * 0.2;
}

/**
 * Count total sources in a provenance tree
 */
export function countSources(node: ProvenanceNode): number {
  let count = node.type === 'source' || node.type === 'research' ? 1 : 0;
  if (node.children) {
    count += node.children.reduce((sum, child) => sum + countSources(child), 0);
  }
  return count;
}

/**
 * Get all unique sources from a provenance tree
 */
export function getAllSources(node: ProvenanceNode): ResearchSource[] {
  const sources: ResearchSource[] = [];

  if (node.source) {
    sources.push(node.source);
  }
  if (node.research?.sources) {
    sources.push(...node.research.sources);
  }
  if (node.children) {
    node.children.forEach(child => {
      sources.push(...getAllSources(child));
    });
  }

  // Dedupe by URL
  const seen = new Set<string>();
  return sources.filter(s => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
}

/**
 * Check if a provenance tree contains any AI-generated nodes
 */
export function hasAIContent(node: ProvenanceNode): boolean {
  if (node.type === 'research' || node.research) {
    return true;
  }
  if (node.children) {
    return node.children.some(hasAIContent);
  }
  return false;
}
