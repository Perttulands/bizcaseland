# Bug Fix: SensitivityDriverBadge TypeError

## Issue
When setting a customer segment volume datapoint as a sensitivity driver, the application threw:
```
TypeError: currentRange.map is not a function
```

## Root Cause
The `SensitivityDriverBadge` component expected `currentRange` to always be an array of 5 numbers, but it could receive different formats:

1. **5-value array**: `[10, 20, 30, 40, 50]` (expected format)
2. **2-value tuple**: `[10, 50]` (from TypeScript type definition `readonly [number, number]`)
3. **Object format**: `{ min: 10, max: 50 }` (converted by `findSensitivityDriver()`)
4. **undefined/null**: When no range is set

The component called `.map()` directly on `currentRange` without checking its type or normalizing it, causing a runtime error when it received non-array formats.

## Solution
Added a `normalizeRange()` function that:
1. Handles null/undefined by returning default `[0, 0, 0, 0, 0]`
2. Handles arrays:
   - If 5+ elements: slice to first 5
   - If 2 elements (tuple): interpolate to 5 values evenly between min and max
   - If fewer than 5: pad with zeros
3. Handles objects with `min`/`max` properties: interpolate to 5 values
4. Falls back to default for any other format

## Changes Made

### Modified Files
- `src/modules/business-case/components/SensitivityDriverBadge.tsx`
  - Added `normalizeRange()` function before component state initialization
  - Updated `useState` to use `normalizeRange(currentRange).map(toDisplayValue)`

### Test Coverage
- `src/test/components/business-case/SensitivityDriverBadge.test.tsx`
  - Added 8 comprehensive tests covering all edge cases
  - All tests pass ✅

## Test Results
```
✓ should handle non-array currentRange gracefully
✓ should render with valid 5-value array
✓ should handle undefined currentRange by using default
✓ should convert percentage values correctly
✓ should save range correctly when updated
✓ should normalize 2-value tuple to 5-value array
✓ should handle readonly tuple from TypeScript type system
✓ should handle object range with min/max properties
```

## Example Behavior
```typescript
// 2-value tuple [10, 50] becomes:
[10, 20, 30, 40, 50]

// Object { min: 100, max: 500 } becomes:
[100, 200, 300, 400, 500]

// Percentage values are still displayed correctly:
[0.05, 0.10, 0.15, 0.20, 0.25] displays as [5, 10, 15, 20, 25]
```

## Related Type Definitions
- `Driver` interface in `src/core/types/common.ts` defines `range: readonly [number, number]`
- `SensitivityDriverBadge` component expects `currentRange?: number[]`
- This fix bridges the gap between these type definitions

## Future Improvements
Consider standardizing the driver range format across the codebase to either:
1. Always use 5-value arrays
2. Always use 2-value tuples and interpolate at display time
3. Update TypeScript types to reflect actual runtime behavior
