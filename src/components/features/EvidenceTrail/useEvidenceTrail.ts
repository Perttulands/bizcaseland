/**
 * useEvidenceTrail Hook
 * Builds evidence trail from the data model for a given cell path
 */

import { useMemo } from 'react';
import { useData } from '@/core/contexts/DataContext';
import type { ValueWithRationale } from '@/core/types/common';
import type { ResearchDocument } from '@/core/types/ai';
import type { EvidenceTrail, ProvenanceNode, ProvenanceNodeType } from './types';

// ============================================================================
// Path Parsing Utilities
// ============================================================================

/**
 * Get value at a path in an object
 */
function getValueAtPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Generate human-readable label from data path
 */
function pathToLabel(path: string): string {
  const parts = path.split('.');
  const lastPart = parts[parts.length - 1];

  // Convert snake_case to Title Case
  return lastPart
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Determine node type from path and value
 */
function determineNodeType(path: string, value: unknown): ProvenanceNodeType {
  // Check path patterns
  if (path.includes('research') || path.includes('source')) {
    return 'research';
  }
  if (path.includes('calculated') || path.includes('metric')) {
    return 'calculation';
  }
  if (path.includes('benchmark') || path.includes('industry')) {
    return 'benchmark';
  }
  if (path.includes('assumption')) {
    return 'assumption';
  }

  // Check value structure
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (v.aiGenerated || v.researchIds) {
      return 'research';
    }
    if (v.formula) {
      return 'calculation';
    }
  }

  return 'value';
}

/**
 * Check if value is a ValueWithRationale
 */
function isValueWithRationale(value: unknown): value is ValueWithRationale {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    'value' in v &&
    'unit' in v &&
    'rationale' in v
  );
}

// ============================================================================
// Evidence Trail Builder
// ============================================================================

interface BuildContext {
  getResearchDocuments: (ids: string[]) => ResearchDocument[];
  businessData: unknown;
  marketData: unknown;
}

/**
 * Build provenance node for a ValueWithRationale
 */
function buildProvenanceFromVWR(
  vwr: ValueWithRationale,
  path: string,
  context: BuildContext,
): ProvenanceNode {
  const children: ProvenanceNode[] = [];
  const researchDocs = vwr.researchIds
    ? context.getResearchDocuments(vwr.researchIds as string[])
    : [];

  // Add research documents as children
  for (const doc of researchDocs) {
    const sourceNodes: ProvenanceNode[] = doc.sources.map((source, idx) => ({
      id: `${doc.id}-source-${idx}`,
      type: 'source' as const,
      label: source.title,
      description: source.snippet,
      source,
    }));

    children.push({
      id: doc.id,
      type: 'research',
      label: doc.query || 'AI Research',
      description: doc.rationale,
      confidence: doc.confidence,
      timestamp: doc.createdAt,
      research: doc,
      children: sourceNodes.length > 0 ? sourceNodes : undefined,
    });
  }

  // Add link as source if present
  if (vwr.link) {
    children.push({
      id: `${path}-link`,
      type: 'source',
      label: 'External Source',
      source: {
        url: vwr.link,
        title: vwr.link,
        domain: new URL(vwr.link).hostname,
        accessedAt: new Date().toISOString(),
      },
    });
  }

  // Add rationale as assumption if no other backing
  if (children.length === 0 && vwr.rationale) {
    children.push({
      id: `${path}-rationale`,
      type: 'assumption',
      label: 'User Assumption',
      description: vwr.rationale,
      confidence: 0.8, // Manual assumptions get moderate confidence
    });
  }

  return {
    id: path,
    type: vwr.aiGenerated ? 'research' : 'value',
    label: pathToLabel(path),
    value: vwr.value as number | string,
    unit: vwr.unit,
    description: vwr.rationale,
    confidence: vwr.aiConfidence,
    dataPath: path,
    children: children.length > 0 ? children : undefined,
  };
}

/**
 * Build provenance node for calculated values
 */
function buildCalculatedNode(
  path: string,
  value: number,
  formula: string,
  dependencies: Array<{ path: string; label: string }>,
  context: BuildContext,
): ProvenanceNode {
  const children: ProvenanceNode[] = dependencies.map((dep) => {
    const depValue = getValueAtPath(context.businessData, dep.path) ??
      getValueAtPath(context.marketData, dep.path);

    if (isValueWithRationale(depValue)) {
      return buildProvenanceFromVWR(depValue, dep.path, context);
    }

    return {
      id: dep.path,
      type: 'value' as const,
      label: dep.label,
      value: typeof depValue === 'number' ? depValue : String(depValue),
      dataPath: dep.path,
    };
  });

  return {
    id: path,
    type: 'calculation',
    label: pathToLabel(path),
    value,
    formula,
    children: children.length > 0 ? children : undefined,
  };
}

// ============================================================================
// Known Calculation Dependencies
// ============================================================================

/**
 * Map of calculated fields to their dependencies
 */
const calculationDependencies: Record<string, {
  formula: string;
  deps: Array<{ path: string; label: string }>;
}> = {
  'metrics.monthly_revenue': {
    formula: 'volume × avg_unit_price',
    deps: [
      { path: 'assumptions.customers.total_volume', label: 'Total Volume' },
      { path: 'assumptions.pricing.avg_unit_price', label: 'Average Unit Price' },
    ],
  },
  'metrics.gross_margin': {
    formula: 'revenue - cogs',
    deps: [
      { path: 'metrics.monthly_revenue', label: 'Monthly Revenue' },
      { path: 'assumptions.costs.cogs', label: 'Cost of Goods Sold' },
    ],
  },
  'metrics.npv': {
    formula: 'NPV(cash_flows, discount_rate)',
    deps: [
      { path: 'assumptions.financial.discount_rate', label: 'Discount Rate' },
    ],
  },
  'metrics.irr': {
    formula: 'IRR(cash_flows)',
    deps: [],
  },
  'market.tam': {
    formula: 'total_addressable_market',
    deps: [
      { path: 'market.sizing.total_market_value', label: 'Total Market Value' },
    ],
  },
  'market.sam': {
    formula: 'TAM × serviceable_percentage',
    deps: [
      { path: 'market.tam', label: 'TAM' },
      { path: 'market.sizing.serviceable_percentage', label: 'Serviceable %' },
    ],
  },
  'market.som': {
    formula: 'SAM × obtainable_percentage',
    deps: [
      { path: 'market.sam', label: 'SAM' },
      { path: 'market.sizing.obtainable_percentage', label: 'Obtainable %' },
    ],
  },
};

// ============================================================================
// Main Hook
// ============================================================================

export interface UseEvidenceTrailOptions {
  path: string;
  label?: string;
}

export interface UseEvidenceTrailResult {
  trail: EvidenceTrail | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to build an evidence trail for a specific cell path
 */
export function useEvidenceTrail({
  path,
  label,
}: UseEvidenceTrailOptions): UseEvidenceTrailResult {
  const { state, getResearchDocuments } = useData();

  const trail = useMemo(() => {
    if (!path) return null;

    const businessData = state.business.data;
    const marketData = state.market.data;

    const context: BuildContext = {
      getResearchDocuments,
      businessData,
      marketData,
    };

    // Get value at path
    const value = getValueAtPath(businessData, path) ??
      getValueAtPath(marketData, path);

    if (value === undefined) {
      return null;
    }

    // Build root provenance node
    let root: ProvenanceNode;

    // Check if this is a calculated field
    const calcDeps = calculationDependencies[path];
    if (calcDeps && typeof value === 'number') {
      root = buildCalculatedNode(
        path,
        value,
        calcDeps.formula,
        calcDeps.deps,
        context,
      );
    } else if (isValueWithRationale(value)) {
      root = buildProvenanceFromVWR(value, path, context);
    } else {
      // Simple value
      root = {
        id: path,
        type: determineNodeType(path, value),
        label: label || pathToLabel(path),
        value: typeof value === 'number' || typeof value === 'string'
          ? value
          : JSON.stringify(value),
        dataPath: path,
      };
    }

    // Build the trail
    const currentValue = isValueWithRationale(value) ? value.value : value;
    const unit = isValueWithRationale(value) ? value.unit : undefined;
    const aiGenerated = isValueWithRationale(value) ? value.aiGenerated : undefined;

    return {
      cellPath: path,
      cellLabel: label || pathToLabel(path),
      currentValue: typeof currentValue === 'number' || typeof currentValue === 'string'
        ? currentValue
        : String(currentValue),
      unit,
      lastUpdated: new Date().toISOString(),
      root,
      aiGenerated,
    };
  }, [path, label, state.businessData, state.marketData, getResearchDocuments]);

  return {
    trail,
    isLoading: false,
    error: trail === null && path ? 'Value not found at path' : null,
  };
}

export default useEvidenceTrail;
