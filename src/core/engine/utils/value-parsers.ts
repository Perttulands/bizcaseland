/**
 * Simple value parsing utilities for inline editing
 */

/**
 * Parse a string value based on its unit type
 */
export function parseValue(input: string, unit: string): number {
  const trimmed = input.trim();
  
  if (!trimmed) {
    throw new Error('Value cannot be empty');
  }

  // Remove currency symbols and commas
  let cleaned = trimmed
    .replace(/[€$£¥]/g, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '');

  // Handle percentage input
  if (unit === 'ratio' || unit === '%' || unit.includes('pct') || unit.includes('percentage') || unit.includes('churn')) {
    if (cleaned.endsWith('%')) {
      cleaned = cleaned.slice(0, -1);
    }
    const numValue = parseFloat(cleaned);
    if (isNaN(numValue)) {
      throw new Error('Invalid number format');
    }
    // Convert percentage to ratio (75% -> 0.75)
    return numValue / 100;
  }

  // Handle regular numbers
  const numValue = parseFloat(cleaned);
  if (isNaN(numValue)) {
    throw new Error('Invalid number format');
  }

  return numValue;
}

/**
 * Format a value for editing (show raw number)
 */
export function formatEditValue(value: any, unit: string): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value !== 'number') {
    return String(value);
  }

  // For ratios/percentages, show as percentage number (user-friendly format)
  if (unit === 'ratio' || unit === '%' || unit.includes('pct') || unit.includes('percentage') || unit.includes('churn')) {
    const percentValue = value * 100;
    // Remove unnecessary decimals (10.00 -> 10, but 10.5 stays as 10.5)
    return percentValue % 1 === 0 ? String(percentValue) : String(percentValue.toFixed(2));
  }

  // For other numbers, show with minimal formatting
  return String(value);
}

/**
 * Validate a parsed value
 */
export function validateValue(value: number, unit: string): { isValid: boolean; error?: string } {
  if (isNaN(value) || !isFinite(value)) {
    return { isValid: false, error: 'Value must be a valid number' };
  }

  // Ratio/percentage validation
  if (unit === 'ratio' || unit === '%' || unit.includes('pct') || unit.includes('percentage')) {
    // Allow any positive percentage for OPEX and other business metrics
    // (OPEX can be more than 100% of revenue, churn should be 0-100%)
    if (value < 0) {
      return { isValid: false, error: 'Percentage must be positive' };
    }
    // Warn if churn rate is unrealistic (but still allow it)
    if (unit.includes('churn') && value > 1) {
      return { isValid: false, error: 'Churn rate must be between 0% and 100%' };
    }
  }

  // Positive value validation for financial fields
  const shouldBePositive = 
    unit.includes('EUR') || 
    unit.includes('USD') ||
    unit.includes('price') ||
    unit.includes('cost') ||
    unit.includes('units') ||
    unit.includes('customers');

  if (shouldBePositive && value < 0) {
    return { isValid: false, error: 'Value must be positive' };
  }

  return { isValid: true };
}

/**
 * Check if a unit type should be editable
 */
export function isEditableUnit(unit: string): boolean {
  // Pattern types are not editable
  if (unit === 'pattern' || unit === 'seasonal' || unit === 'multiplier' || unit === 'frequency') {
    return false;
  }

  // N/A units are not editable
  if (unit === 'n/a') {
    return false;
  }

  return true;
}
