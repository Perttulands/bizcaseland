/**
 * Safe nested object operations without unsafe JSON cloning
 * Provides memory-efficient alternatives to JSON.parse(JSON.stringify())
 */

import { safeDeepClone, selectiveDeepClone } from '@/lib/utils/clone';

/**
 * Safely set a nested value in an object without mutating the original
 * More efficient than JSON.parse(JSON.stringify()) for deep cloning
 */
export function setNestedValue<T>(obj: T, path: string, value: any): T {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Object must be a valid object');
  }

  if (!path || typeof path !== 'string') {
    throw new Error('Path must be a non-empty string');
  }

  // If the path includes array indexing (e.g., items[0].value) selective cloning
  // may not correctly clone array elements because it treats path parts literally.
  // In such cases we fall back to a full deep clone to avoid mutating original arrays.
  const shouldDeepClone = path.includes('[');
  const result = shouldDeepClone ? safeDeepClone(obj) : selectiveDeepClone(obj, [path]);
  
  const pathParts = path.split('.');
  let current: any = result;
  
  try {
    // Navigate to the parent of the target property
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      
      if (part.includes('[') && part.includes(']')) {
        const { arrayName, index } = parseArrayPath(part);
        
        if (!current[arrayName]) {
          current[arrayName] = [];
        }
        
        if (!Array.isArray(current[arrayName])) {
          throw new Error(`Expected array at path ${arrayName}, got ${typeof current[arrayName]}`);
        }
        
        // Ensure array has enough elements
        while (current[arrayName].length <= index) {
          current[arrayName].push({});
        }
        
        current = current[arrayName][index];
      } else {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
    
    // Set the final value
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart.includes('[') && lastPart.includes(']')) {
      const { arrayName, index } = parseArrayPath(lastPart);
      
      if (!current[arrayName]) {
        current[arrayName] = [];
      }
      
      if (!Array.isArray(current[arrayName])) {
        throw new Error(`Expected array at path ${arrayName}, got ${typeof current[arrayName]}`);
      }
      
      // Ensure array has enough elements
      while (current[arrayName].length <= index) {
        current[arrayName].push({});
      }
      
      current[arrayName][index] = value;
    } else {
      current[lastPart] = value;
    }
    
    return result;
  } catch (error) {
    throw new Error(`Failed to set nested value at path "${path}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Safely get a nested value from an object with proper error handling
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj) {
    return undefined;
  }

  if (!path || typeof path !== 'string') {
    throw new Error('Path must be a non-empty string');
  }

  const pathParts = path.split('.');
  let current = obj;
  
  try {
    for (const part of pathParts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      
      if (part.includes('[') && part.includes(']')) {
        const { arrayName, index } = parseArrayPath(part);
        
        if (!current[arrayName] || !Array.isArray(current[arrayName])) {
          return undefined;
        }
        
        if (index >= current[arrayName].length || index < 0) {
          return undefined;
        }
        
        current = current[arrayName][index];
      } else {
        if (typeof current !== 'object' || !current.hasOwnProperty(part)) {
          return undefined;
        }
        current = current[part];
      }
    }
    
    return current;
  } catch (error) {
    console.warn(`Failed to get nested value at path "${path}":`, error);
    return undefined;
  }
}

/**
 * Parse array path notation like "items[2]" into array name and index
 */
function parseArrayPath(pathPart: string): { arrayName: string; index: number } {
  const match = pathPart.match(/^(.+)\[(\d+)\]$/);
  
  if (!match) {
    throw new Error(`Invalid array path format: ${pathPart}. Expected format: "arrayName[index]"`);
  }
  
  const arrayName = match[1];
  const index = parseInt(match[2], 10);
  
  if (isNaN(index) || index < 0) {
    throw new Error(`Invalid array index: ${match[2]}. Must be a non-negative integer`);
  }
  
  // Reasonable array size limit to prevent memory issues
  if (index > 10000) {
    throw new Error(`Array index too large: ${index}. Maximum allowed index is 10000`);
  }
  
  return { arrayName, index };
}

/**
 * Check if a nested path exists in an object
 */
export function hasNestedPath(obj: any, path: string): boolean {
  try {
    const value = getNestedValue(obj, path);
    return value !== undefined;
  } catch {
    return false;
  }
}

/**
 * Get all possible paths in an object (useful for debugging/validation)
 */
export function getAllPaths(obj: any, prefix = '', maxDepth = 10): string[] {
  if (maxDepth <= 0) {
    return [];
  }

  const paths: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    return paths;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const currentPath = prefix ? `${prefix}[${index}]` : `[${index}]`;
      paths.push(currentPath);
      paths.push(...getAllPaths(item, currentPath, maxDepth - 1));
    });
  } else {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      paths.push(currentPath);
      paths.push(...getAllPaths(value, currentPath, maxDepth - 1));
    }
  }
  
  return paths;
}

/**
 * Validate that a path is safe to use (no dangerous patterns)
 */
export function validatePath(path: string): boolean {
  if (!path || typeof path !== 'string') {
    return false;
  }
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    /__proto__/i,
    /constructor/i,
    /prototype/i,
    /\.\./, // Path traversal
    /[<>{}]/  // HTML/template injection
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(path));
}

/**
 * Safe update of nested object with validation
 */
export function safeUpdateNested<T>(
  obj: T, 
  updates: Record<string, any>
): T {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Object must be a valid object');
  }

  let result = obj;
  
  for (const [path, value] of Object.entries(updates)) {
    if (!validatePath(path)) {
      throw new Error(`Invalid or unsafe path: ${path}`);
    }
    
    result = setNestedValue(result, path, value);
  }
  
  return result;
}
