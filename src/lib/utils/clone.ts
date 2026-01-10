/**
 * Safe cloning utilities to replace JSON.parse(JSON.stringify()) patterns
 * These functions are memory-efficient and secure
 */

/**
 * Safe deep clone function using structuredClone when available,
 * falling back to a manual implementation for complex objects
 */
export function safeDeepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Use native structuredClone if available (modern browsers)
  if (typeof structuredClone !== 'undefined') {
    try {
      return structuredClone(obj);
    } catch (error) {
      // Fall back to manual cloning if structuredClone fails
      console.warn('structuredClone failed, falling back to manual cloning:', error);
    }
  }

  // Manual deep clone implementation
  return manualDeepClone(obj);
}

/**
 * Manual deep clone implementation that handles common cases
 * More memory efficient than JSON.parse(JSON.stringify())
 */
function manualDeepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof Array) {
    return obj.map(item => manualDeepClone(item)) as T;
  }

  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = manualDeepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
}

/**
 * Shallow clone for simple objects where deep cloning isn't needed
 * Much more efficient for performance-critical operations
 */
export function shallowClone<T extends Record<string, any>>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return [...obj] as T;
  }

  return { ...obj };
}

/**
 * Selective deep clone - only clone specified paths
 * Useful when you only need to modify certain parts of a large object
 */
export function selectiveDeepClone<T>(obj: T, pathsToClone: string[]): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const result = shallowClone(obj);

  for (const path of pathsToClone) {
    const pathParts = path.split('.');
    let current = result as any;
    let original = obj as any;

    // Navigate to the parent of the target
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (original[part] && typeof original[part] === 'object') {
        if (!current[part]) {
          current[part] = Array.isArray(original[part]) ? [] : {};
        }
        current = current[part];
        original = original[part];
      }
    }

    // Clone the final property
    const finalProp = pathParts[pathParts.length - 1];
    if (original[finalProp] !== undefined) {
      current[finalProp] = safeDeepClone(original[finalProp]);
    }
  }

  return result;
}
