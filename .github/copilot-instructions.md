
**What is Bizcaseland?**  
An AI-first business analysis platform where users:
1. Export JSON templates from our tool
2. Populate them with AI (ChatGPT/Claude) with rationale
3. Import back to visualize and analyze

**Two Main Tools:**
- **Business Case Analyzer** (`/business`) - Financial modeling with NPV, IRR, sensitivity analysis
- **Market Analysis Suite** (`/market`) - Market sizing, competitive analysis, customer segmentation

**Entry Point:** `src/main.tsx` → `App.tsx` → React Router → `pages/Index.tsx` (landing) or tool pages


---

## 🏗️ Architecture Quick Reference

**Full details:** See [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)

### Component Structure
```
src/
├── components/
│   ├── business-case/      # Business Case Analyzer tabs
│   ├── market-analysis/    # Market Analysis Suite modules
│   ├── shared/             # Reusable cross-tool components
│   └── ui/                 # shadcn/ui base components
├── lib/                    # Business logic
│   ├── calculations.ts              # Calculations engine
├── contexts/               # React Context providers
│   ├── AppContext.tsx              # Global state + localStorage
│   └── BusinessDataContext.tsx     # Legacy (being migrated)
└── types/                  # TypeScript interfaces
```

### Key Data Interfaces

**Business Case:**
- Location: `src/types/business-data.ts`
- Pattern: Every number = `{ value, unit, rationale }`
- Calculations: `src/lib/calculations.ts`

**Market Analysis:**
- Location: `src/lib/market-calculations.ts`
- Structure: `{ meta, market_sizing, competitive_landscape, customer_analysis }`
- Calculations: `src/lib/market-suite-calculations.ts`

### State Management
- **AppContext**: Global state for both tools + localStorage persistence
- **BusinessDataContext**: Legacy (being migrated to AppContext)
- **Pattern**: Props down, callbacks up

---

## 🔧 Development Patterns

### Tech Stack
- **Core**: React 18 + Vite + TypeScript
- **UI**: Tailwind CSS + shadcn/ui + Radix primitives
- **Charts**: Recharts (all visualizations)
- **State**: React Context + localStorage (no backend)
- **Testing**: Vitest

### Code Style
- **Language**: TypeScript for all new code
- **Components**: Functional components with typed props
- **Types**: Prefer `interface` over `type` for public shapes
- **Naming**: Descriptive booleans (`isLoading`, `hasError`)
- **Exports**: Named exports for components and helpers
- **Functions**: Use `function` keyword (better stack traces)

### UI Patterns
- **Design System**: HSL CSS variables in `src/index.css` (don't use hard-coded hex)
- **Components**: Reuse `src/components/ui/*` (shadcn/ui) over raw HTML
- **Responsive**: Mobile-first with Tailwind breakpoints
- **Charts**: Always wrap Recharts in `ResponsiveContainer`

### State & Data Flow
- **Global State**: Use `AppContext` for cross-tool state
- **Data Updates**: Use context methods, not direct mutation
- **Persistence**: Auto-saves to localStorage (no manual save needed)
- **Pattern**: Props down, callbacks up

---

## ⚠️ Critical Rules (Don't Break These!)

### Financial Calculations
- **IRR Error Codes**: Use `isIRRError()` and `getIRRErrorMessage()` — don't expose raw error codes
- **Date Logic**: Default start date is `2026-01-01` — tests assume this
- **Rationale Required**: Every number needs `{ value, unit, rationale }` — missing rationale breaks calculations

### Data Validation
- **JSON Schema**: Both tools enforce strict schema validation — test before committing
- **Market Analysis**: `validateMarketSuiteData()` is the authority
- **Business Case**: All paths must resolve (e.g., `assumptions.pricing.avg_unit_price.value`)

### UI & Styling
- **HSL Colors Only**: Use CSS variables from `src/index.css` — hex colors break theming
- **ResponsiveContainer**: Always wrap Recharts components
- **Mobile-First**: Use Tailwind breakpoints, not fixed pixels
- **Don't Modify**: shadcn/ui components in `src/components/ui/` should not be edited

### Performance
- **Bundle Size**: ~911KB — avoid heavy dependencies
- **Chart Performance**: Use ResponsiveContainer + memoization
- **localStorage**: Auto-throttled — don't trigger excessive updates

---

## 📝 Making Changes

### Business Case Changes
- **Calculations**: Edit `src/lib/calculations.ts` (add tests!)
- **Data Model**: Update `src/types/business-data.ts`
- **UI**: Main orchestrator is `src/components/business-case/BusinessCaseAnalyzer.tsx`
- **State**: Use `AppContext.updateBusinessData()` or legacy `BusinessDataContext` methods

### Market Analysis Changes
- **Calculations**: Edit `src/lib/market-calculations.ts` or `market-suite-calculations.ts`
- **Data Model**: Update `MarketData` interface in `src/lib/market-calculations.ts`
- **UI**: Main orchestrator is `src/components/market-analysis/MarketAnalysisSuite.tsx`
- **Modules**: Individual modules in `src/components/market-analysis/modules/`
- **State**: Use `AppContext.updateMarketData()`

### Global Changes
- **Routing**: Add routes in `src/App.tsx` (above catch-all `*` route)
- **Shared UI**: Add to `src/components/shared/`
- **Global State**: Edit `src/contexts/AppContext.tsx`
