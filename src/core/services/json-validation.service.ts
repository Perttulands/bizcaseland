/**
 * Secure JSON parsing and validation utilities
 * Prevents prototype pollution and other JSON-based attacks
 */

/**
 * JSON Validation Service
 * Secure JSON parsing and validation with business data support
 */

import { BusinessData } from '@/core/types';

/**
 * JSON parsing options for security
 */
interface SafeParseOptions {
  maxDepth?: number;
  maxKeys?: number;
  maxArrayLength?: number;
  maxStringLength?: number;
  allowedKeys?: string[];
  disallowedKeys?: string[];
}

/**
 * Default security options for JSON parsing
 */
const DEFAULT_PARSE_OPTIONS: Required<SafeParseOptions> = {
  maxDepth: 10,
  maxKeys: 1000,
  maxArrayLength: 10000,
  maxStringLength: 100000,
  allowedKeys: [],
  disallowedKeys: ['__proto__', 'constructor', 'prototype']
};

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

/**
 * Safe JSON parser that prevents common attacks
 */
export function safeJSONParse<T = any>(
  jsonString: string, 
  options: SafeParseOptions = {}
): ValidationResult<T> {
  const opts = { ...DEFAULT_PARSE_OPTIONS, ...options };
  const warnings: string[] = [];

  try {
    // Basic validation
    if (!jsonString || typeof jsonString !== 'string') {
      return { success: false, error: 'Invalid input: must be a non-empty string' };
    }

    if (jsonString.length > opts.maxStringLength) {
      return { 
        success: false, 
        error: `JSON string too long: ${jsonString.length} chars (max: ${opts.maxStringLength})` 
      };
    }

    // Check for JavaScript expressions in JSON (common AI mistake)
    const jsExpressionPatterns = [
      { pattern: /"value"\s*:\s*[0-9_]+\s*[\*\+\-\/]/i, message: 'Arithmetic expressions found (e.g., "value": 123 * 456)' },
      { pattern: /"value"\s*:\s*\([^)]+\)/i, message: 'Parenthetical expressions found (e.g., "value": (2.18e9 * 0.10))' },
      { pattern: /"value"\s*:\s*\d+_\d+/i, message: 'Numeric underscores found (e.g., "value": 2_370_000)' }
    ];

    for (const { pattern, message } of jsExpressionPatterns) {
      if (pattern.test(jsonString)) {
        return { 
          success: false, 
          error: `Invalid JSON format: ${message}. JSON does not support JavaScript expressions. Please calculate the values first and use plain numbers only. Example: use 2180400000 instead of 2_370_000_000 * 0.92` 
        };
      }
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /__proto__/i,
      /constructor/i,
      /prototype/i,
      /function\s*\(/i,
      /javascript:/i,
      /data:text\/html/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(jsonString)) {
        return { 
          success: false, 
          error: 'JSON contains potentially dangerous patterns' 
        };
      }
    }

    // Parse JSON
    const parsed = JSON.parse(jsonString);

    // Validate structure
    const structureValidation = validateObjectStructure(parsed, opts, 0);
    if (!structureValidation.success) {
      return structureValidation;
    }

    // Clean dangerous properties
    const cleaned = cleanObject(parsed, opts.disallowedKeys);

    return { 
      success: true, 
      data: cleaned as T, 
      warnings: warnings.length > 0 ? warnings : undefined 
    };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'JSON parsing failed' 
    };
  }
}

/**
 * Recursively validate object structure for security
 */
function validateObjectStructure(
  obj: any, 
  options: Required<SafeParseOptions>, 
  depth: number
): ValidationResult<any> {
  if (depth > options.maxDepth) {
    return { success: false, error: `Object depth exceeded maximum: ${options.maxDepth}` };
  }

  if (obj === null || typeof obj !== 'object') {
    return { success: true };
  }

  if (Array.isArray(obj)) {
    if (obj.length > options.maxArrayLength) {
      return { 
        success: false, 
        error: `Array length exceeded maximum: ${obj.length} (max: ${options.maxArrayLength})` 
      };
    }

    for (let i = 0; i < obj.length; i++) {
      const validation = validateObjectStructure(obj[i], options, depth + 1);
      if (!validation.success) {
        return validation;
      }
    }
    return { success: true };
  }

  // Check object key count
  const keys = Object.keys(obj);
  if (keys.length > options.maxKeys) {
    return { 
      success: false, 
      error: `Object has too many keys: ${keys.length} (max: ${options.maxKeys})` 
    };
  }

  // Validate each property
  for (const key of keys) {
    // Check for dangerous keys
    if (options.disallowedKeys.includes(key.toLowerCase())) {
      return { success: false, error: `Dangerous key detected: ${key}` };
    }

    // Recursively validate nested objects
    const validation = validateObjectStructure(obj[key], options, depth + 1);
    if (!validation.success) {
      return validation;
    }
  }

  return { success: true };
}

/**
 * Remove dangerous properties from object
 */
function cleanObject(obj: any, disallowedKeys: string[]): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item, disallowedKeys));
  }

  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!disallowedKeys.includes(key.toLowerCase())) {
      cleaned[key] = cleanObject(value, disallowedKeys);
    }
  }

  return cleaned;
}

/**
 * Business data specific validation
 */
export function validateBusinessData(data: any): ValidationResult<BusinessData> {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Business data must be an object' };
  }

  const warnings: string[] = [];

  // Check required top-level properties
  if (!data.meta) {
    return { success: false, error: 'Missing required "meta" property' };
  }

  if (!data.assumptions) {
    return { success: false, error: 'Missing required "assumptions" property' };
  }

  // Validate meta object
  if (!data.meta.title || typeof data.meta.title !== 'string') {
    warnings.push('Meta.title should be a non-empty string');
  }

  if (!data.meta.currency || typeof data.meta.currency !== 'string') {
    warnings.push('Meta.currency should be a valid currency code');
  }

  if (!data.meta.business_model || !['recurring', 'unit_sales', 'cost_savings'].includes(data.meta.business_model)) {
    warnings.push('Meta.business_model should be one of: recurring, unit_sales, cost_savings');
  }

  // Validate numeric fields
  const numericFields = [
    'meta.periods',
    'assumptions.pricing.avg_unit_price.value',
    'assumptions.financial.interest_rate.value'
  ];

  for (const field of numericFields) {
    const value = getNestedProperty(data, field);
    if (value !== undefined && (typeof value !== 'number' || isNaN(value))) {
      warnings.push(`Field ${field} should be a valid number`);
    }
  }

  return { 
    success: true, 
    data: data as BusinessData, 
    warnings: warnings.length > 0 ? warnings : undefined 
  };
}

/**
 * Safely get nested property value
 */
function getNestedProperty(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Create safe JSON string with size limits
 */
export function safeJSONStringify(
  obj: any, 
  maxSize: number = 1000000 // 1MB default
): ValidationResult<string> {
  try {
    const jsonString = JSON.stringify(obj, null, 2);
    
    if (jsonString.length > maxSize) {
      return { 
        success: false, 
        error: `JSON string too large: ${jsonString.length} bytes (max: ${maxSize})` 
      };
    }

    return { success: true, data: jsonString };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'JSON stringification failed' 
    };
  }
}
