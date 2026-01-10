# Core Infrastructure Guide

## Overview

The `src/core/` directory contains the foundational infrastructure for the Bizcaseland application. This is the result of a major refactoring effort to consolidate duplicate code, improve type safety, and establish clean architectural patterns.

## Directory Structure

```
src/core/
├── types/              # Centralized type system
├── services/           # Business logic services
├── contexts/           # Unified data context
├── engine/             # Calculation engine
└── index.ts            # Main export point
```

## 📘 Type System (`types/`)

### Purpose
Single source of truth for all type definitions, eliminating duplication across the codebase.

### Files

#### `common.ts`
Shared types used by both Business Case and Market Analysis:
- `ValueWithRationale<T>` - Standard value + rationale pattern
- `Driver` - Sensitivity analysis drivers
- `VolumeConfiguration` - Growth pattern configurations
- Utility types: `CurrencyCode`, `GrowthPatternType`, etc.
- Type guards: `isPositiveNumber()`, `isValidPercentage()`, etc.

#### `business.ts`
Business case specific types:
- `BusinessData` - Complete business case structure
- `BusinessAssumptions` - All assumption types
- `MonthlyData` - Monthly calculation results
- `CalculatedMetrics` - Financial metrics (NPV, IRR, etc.)

#### `market.ts`
Market analysis specific types:
- `MarketData` - Complete market analysis structure
- `MarketSizing` - TAM/SAM/SOM
- `CompetitiveLandscape` - Competitor analysis
- `CustomerAnalysis` - Customer segments and profiles

### Usage

```typescript
// Import from central location
import { BusinessData, MarketData, ValueWithRationale } from '@/core/types';

// Or import specific file
import type { BusinessData } from '@/core/types/business';
```

## 🔧 Services (`services/`)

### Purpose
Centralized business logic and infrastructure services, separated from UI components.

### Services

#### `StorageService`
Handles all localStorage operations with error handling and type safety.

```typescript
import { storageService, STORAGE_KEYS } from '@/core/services';

// Save data
storageService.save(STORAGE_KEYS.BUSINESS_DATA, businessData);

// Load data
const data = storageService.load<BusinessData>(STORAGE_KEYS.BUSINESS_DATA);

// Load with default
const mode = storageService.loadWithDefault('mode', 'landing');
```

**Methods:**
- `save<T>(key, data)` - Save data to localStorage
- `load<T>(key)` - Load data from localStorage
- `loadWithDefault<T>(key, defaultValue)` - Load with fallback
- `remove(key)` - Remove data
- `exists(key)` - Check if key exists
- `clear()` - Clear all data

#### `ValidationService`
Validates business and market data with detailed error reporting.

```typescript
import { validationService } from '@/core/services';

// Validate business data
const result = validationService.validateBusinessData(data);
if (!result.valid) {
  console.log('Errors:', result.errors);
  console.log('Warnings:', result.warnings);
}

// Cross-tool validation
const crossCheck = validationService.validateCrossToolConsistency(
  businessData,
  marketData
);
```

**Methods:**
- `validateBusinessData(data)` - Validate business case
- `validateMarketData(data)` - Validate market analysis
- `validateValueWithRationale(value, path, errors)` - Validate VWR structure
- `validateCrossToolConsistency(business, market)` - Cross-tool checks

#### `SyncService`
Handles data synchronization between Business Case and Market Analysis.

```typescript
import { syncService } from '@/core/services';

// Sync market data to business case
const result = syncService.syncMarketToBusinessVolume(marketData, businessData);

// Extract market insights
const insights = syncService.extractMarketInsights(marketData);

// Check data consistency
const report = syncService.checkConsistency(businessData, marketData);
```

## 🎯 Data Context (`contexts/`)

### Purpose
Unified state management replacing 3 separate contexts (AppContext, BusinessDataContext, DataManagerContext).

### Main Context: `DataContext`

```typescript
import { DataProvider, useData } from '@/core/contexts';

// Wrap app with provider
<DataProvider>
  <App />
</DataProvider>

// Access data in components
const { state, updateBusinessData, switchMode } = useData();
```

### Custom Hooks

#### `useBusinessData()`
```typescript
import { useBusinessData } from '@/core/contexts';

const {
  data,               // BusinessData | null
  hasData,            // boolean
  lastModified,       // string | null
  updateData,         // (data) => void
  updateAssumption,   // (path, value) => void
  clearData,          // () => void
  addDriver,          // (path, key, range, rationale, unit?) => void
  removeDriver,       // (path) => void
  updateDriverRange,  // (path, range) => void
  exportData,         // () => string
} = useBusinessData();
```

#### `useMarketData()`
```typescript
import { useMarketData } from '@/core/contexts';

const {
  data,               // MarketData | null
  hasData,            // boolean
  lastModified,       // string | null
  updateData,         // (data) => void
  updateAssumption,   // (path, value) => void
  clearData,          // () => void
  addDriver,          // (label, path, range, rationale) => void
  removeDriver,       // (path) => void
  updateDriverRange,  // (path, range) => void
  exportData,         // () => string
} = useMarketData();
```

#### `useDataStatus()`
```typescript
import { useDataStatus } from '@/core/contexts';

const {
  hasBusinessData,    // boolean
  hasMarketData,      // boolean
  hasAnyData,         // boolean
  businessData,       // BusinessData | null
  marketData,         // MarketData | null
} = useDataStatus();
```

#### `useNavigation()`
```typescript
import { useNavigation } from '@/core/contexts';

const {
  activeMode,         // 'landing' | 'business' | 'market'
  switchMode,         // (mode) => void
  switchToLanding,    // () => void
  switchToBusiness,   // () => void
  switchToMarket,     // () => void
} = useNavigation();
```

## ⚙️ Calculation Engine (`engine/`)

### Purpose
Shared calculation logic eliminating duplication between business and market calculations.

### Utilities

#### Growth Patterns (`utils/growth-patterns.ts`)
```typescript
import {
  calculateGeometricGrowth,
  calculateSeasonalGrowth,
  calculateLinearGrowth,
  calculateVolumeFromConfig,
} from '@/core/engine';

// Calculate geometric growth
const volume = calculateGeometricGrowth(start, monthlyGrowth, monthIndex);

// Calculate from configuration
const volume = calculateVolumeFromConfig(volumeConfig, monthIndex);
```

#### Financial Utilities (`utils/financial.ts`)
```typescript
import {
  calculateNPV,
  calculateIRR,
  calculateBreakEven,
  formatCurrency,
  IRR_ERROR_CODES,
} from '@/core/engine';

// Calculate NPV
const npv = calculateNPV(cashFlows, discountRate);

// Calculate IRR
const irr = calculateIRR(cashFlows);
if (isIRRError(irr)) {
  console.log('IRR calculation failed');
}

// Format currency
const formatted = formatCurrency(1000000, 'EUR'); // "€1.0M"
```

## 🎨 Common Components (`components/common/`)

Reusable UI components shared across modules.

### `EditableValueCell`
```typescript
import { EditableValueCell } from '@/components/common';

<EditableValueCell
  value={1000}
  unit="EUR"
  dataPath="assumptions.pricing.avg_unit_price.value"
  formatValue={(v, u) => `${v} ${u}`}
  onUpdate={handleUpdate}
/>
```

### `EditableRationaleCell`
```typescript
import { EditableRationaleCell } from '@/components/common';

<EditableRationaleCell
  value="Based on market analysis"
  dataPath="assumptions.pricing.avg_unit_price.rationale"
  onUpdate={handleUpdate}
  needsUpdate={false}
/>
```

### `DataCard`
```typescript
import { DataCard } from '@/components/common';

<DataCard
  title="Revenue Projections"
  description="Monthly revenue breakdown"
  icon={TrendingUp}
  badge={{ label: "Updated", variant: "secondary" }}
>
  {/* Card content */}
</DataCard>
```

### `StatCard`
```typescript
import { StatCard } from '@/components/common';

<StatCard
  label="Total Revenue"
  value="€1.2M"
  icon={DollarSign}
  trend={{ value: 15, isPositive: true }}
  description="vs last period"
/>
```

## 📦 Migration Guide

### From Old Contexts to New

**Before:**
```typescript
import { useBusinessData } from '@/contexts/BusinessDataContext';
import { useApp } from '@/contexts/AppContext';

const { data, updateData } = useBusinessData();
const { switchToBusinessMode } = useApp();
```

**After:**
```typescript
import { useBusinessData, useNavigation } from '@/core/contexts';

const { data, updateData } = useBusinessData();
const { switchToBusiness } = useNavigation();
```

### From Old Types to New

**Before:**
```typescript
import { BusinessData } from '@/contexts/BusinessDataContext';
import { MarketData } from '@/lib/market-calculations';
```

**After:**
```typescript
import { BusinessData, MarketData } from '@/core/types';
```

### From Old Services to New

**Before:**
```typescript
// Scattered throughout code
localStorage.setItem('businessCaseData', JSON.stringify(data));
const saved = JSON.parse(localStorage.getItem('businessCaseData') || '{}');
```

**After:**
```typescript
import { storageService, STORAGE_KEYS } from '@/core/services';

storageService.save(STORAGE_KEYS.BUSINESS_DATA, data);
const saved = storageService.load(STORAGE_KEYS.BUSINESS_DATA);
```

## 🧪 Testing

All core infrastructure is designed to be independently testable:

```typescript
// Test services
import { storageService } from '@/core/services';

describe('StorageService', () => {
  it('should save and load data', () => {
    const data = { test: 'value' };
    storageService.save('test-key', data);
    const loaded = storageService.load('test-key');
    expect(loaded).toEqual(data);
  });
});

// Test type guards
import { isPositiveNumber } from '@/core/types';

describe('Type Guards', () => {
  it('should validate positive numbers', () => {
    expect(isPositiveNumber(5)).toBe(true);
    expect(isPositiveNumber(-5)).toBe(false);
  });
});
```

## 🚀 Best Practices

1. **Always use core types** - Import from `@/core/types` for consistency
2. **Use services for logic** - Keep business logic in services, not components
3. **Use custom hooks** - Prefer `useBusinessData()` over direct context access
4. **Validate data** - Use `validationService` before saving
5. **Centralize storage** - Use `storageService` instead of direct localStorage
6. **Type safety first** - Leverage TypeScript strict mode and type guards

## 🔄 Future Enhancements

- [ ] Add calculators to engine (volume, financial, market)
- [ ] Module registry system for dynamic composition
- [ ] Enhanced validation rules
- [ ] Caching layer for expensive calculations
- [ ] Event system for cross-module communication

## 📚 Additional Resources

- See `REFACTORING_PLAN.md` for the complete refactoring roadmap
- See `REFACTORING_SUMMARY.md` for progress tracking
- Check individual file comments for detailed API documentation
