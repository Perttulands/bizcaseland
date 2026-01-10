/**
 * Diff utilities for computing visual diffs between values
 * Used by the agent-style chat to show inline changes
 */

// ============================================================================
// Types
// ============================================================================

export type DiffLineType = 'add' | 'remove' | 'context';

export interface DiffLine {
  type: DiffLineType;
  content: string;
  key?: string;  // Property key for object diffs
}

export interface DiffResult {
  lines: DiffLine[];
  hasChanges: boolean;
  addCount: number;
  removeCount: number;
}

// ============================================================================
// Diff Computation
// ============================================================================

/**
 * Compute a visual diff between two values
 * Handles primitives, objects (ValueWithRationale), and arrays
 */
export function computeValueDiff(
  currentValue: unknown,
  suggestedValue: unknown
): DiffResult {
  const lines: DiffLine[] = [];
  let addCount = 0;
  let removeCount = 0;

  // Handle null/undefined
  if (currentValue === null || currentValue === undefined) {
    if (suggestedValue !== null && suggestedValue !== undefined) {
      const addLines = formatValue(suggestedValue, 'add');
      lines.push(...addLines);
      addCount = addLines.length;
    }
    return { lines, hasChanges: addCount > 0, addCount, removeCount };
  }

  if (suggestedValue === null || suggestedValue === undefined) {
    const removeLines = formatValue(currentValue, 'remove');
    lines.push(...removeLines);
    removeCount = removeLines.length;
    return { lines, hasChanges: removeCount > 0, addCount, removeCount };
  }

  // Handle objects (including ValueWithRationale)
  if (typeof currentValue === 'object' && typeof suggestedValue === 'object') {
    const current = currentValue as Record<string, unknown>;
    const suggested = suggestedValue as Record<string, unknown>;
    const allKeys = new Set([
      ...Object.keys(current || {}),
      ...Object.keys(suggested || {}),
    ]);

    // Sort keys for consistent display (value first, then unit, then rationale, then others)
    const keyOrder = ['value', 'unit', 'rationale', 'link', 'researchIds', 'aiGenerated', 'aiConfidence'];
    const sortedKeys = Array.from(allKeys).sort((a, b) => {
      const aIndex = keyOrder.indexOf(a);
      const bIndex = keyOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    for (const key of sortedKeys) {
      const currentVal = current?.[key];
      const suggestedVal = suggested?.[key];

      if (deepEqual(currentVal, suggestedVal)) {
        // Unchanged - show as context
        lines.push({
          type: 'context',
          content: `${key}: ${formatPrimitive(currentVal)}`,
          key,
        });
      } else if (currentVal !== undefined && suggestedVal === undefined) {
        // Removed
        lines.push({
          type: 'remove',
          content: `${key}: ${formatPrimitive(currentVal)}`,
          key,
        });
        removeCount++;
      } else if (currentVal === undefined && suggestedVal !== undefined) {
        // Added
        lines.push({
          type: 'add',
          content: `${key}: ${formatPrimitive(suggestedVal)}`,
          key,
        });
        addCount++;
      } else {
        // Changed
        lines.push({
          type: 'remove',
          content: `${key}: ${formatPrimitive(currentVal)}`,
          key,
        });
        lines.push({
          type: 'add',
          content: `${key}: ${formatPrimitive(suggestedVal)}`,
          key,
        });
        addCount++;
        removeCount++;
      }
    }
  } else {
    // Primitives
    if (!deepEqual(currentValue, suggestedValue)) {
      lines.push({
        type: 'remove',
        content: formatPrimitive(currentValue),
      });
      lines.push({
        type: 'add',
        content: formatPrimitive(suggestedValue),
      });
      addCount = 1;
      removeCount = 1;
    } else {
      lines.push({
        type: 'context',
        content: formatPrimitive(currentValue),
      });
    }
  }

  return {
    lines,
    hasChanges: addCount > 0 || removeCount > 0,
    addCount,
    removeCount,
  };
}

// ============================================================================
// Formatting Helpers
// ============================================================================

/**
 * Format a primitive value for display
 */
function formatPrimitive(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') {
    // Format large numbers with locale separators
    if (Math.abs(value) >= 1000) {
      return value.toLocaleString();
    }
    // Format decimals nicely
    if (!Number.isInteger(value)) {
      return value.toFixed(2);
    }
    return String(value);
  }
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.length <= 3) return `[${value.map(formatPrimitive).join(', ')}]`;
    return `[${value.slice(0, 2).map(formatPrimitive).join(', ')}, ... +${value.length - 2}]`;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Format an entire value (object or primitive) as diff lines
 */
function formatValue(value: unknown, type: DiffLineType): DiffLine[] {
  const lines: DiffLine[] = [];

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    for (const [key, val] of Object.entries(obj)) {
      lines.push({
        type,
        content: `${key}: ${formatPrimitive(val)}`,
        key,
      });
    }
  } else {
    lines.push({
      type,
      content: formatPrimitive(value),
    });
  }

  return lines;
}

/**
 * Deep equality check for values
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object') return a === b;

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(objA[key], objB[key])) return false;
  }

  return true;
}

// ============================================================================
// Path Formatting
// ============================================================================

/**
 * Format a JSON path for display
 * e.g., "assumptions.pricing.avg_unit_price" -> "Assumptions → Pricing → Avg Unit Price"
 */
export function formatPath(path: string): string {
  return path
    .split('.')
    .map((part) =>
      part
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    )
    .join(' → ');
}

/**
 * Get the last segment of a path for short display
 * e.g., "assumptions.pricing.avg_unit_price" -> "avg_unit_price"
 */
export function getPathLeaf(path: string): string {
  const parts = path.split('.');
  return parts[parts.length - 1] || path;
}

/**
 * Format the leaf segment nicely
 * e.g., "avg_unit_price" -> "Avg Unit Price"
 */
export function formatPathLeaf(path: string): string {
  return getPathLeaf(path)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
