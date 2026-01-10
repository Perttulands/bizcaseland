# Design: UX Architecture - Excel-like Interface Patterns

> Generated: 2026-01-06
> Status: Ready for Review
> Issue: bi-5tm

## Executive Summary

Design a spreadsheet-like interface for Bizcaseland 2.0 that feels familiar to business users (Excel/Sheets) but is simpler - no formulas to write. The interface is AI-powered, with every cell potentially backed by deep research evidence.

**Key Design Decisions:**
- **Grid Architecture**: Hybrid approach - AG Grid for data-heavy views, custom components for interactive cells
- **Cell Model**: Extended `CellWithEvidence` supporting AI-generated values with full research trails
- **Core Element**: Cash flow timeline over time - THE central UI artifact
- **Interaction Model**: Click cell → interrogate → refine assumptions with infinite depth

## Problem Statement

Current Bizcaseland displays financial projections in a static table format. Users cannot:
1. **Interrogate cells** - Ask "why this value?" and get AI explanations
2. **See evidence depth** - Cells show rationale but not full market studies backing them
3. **Iterate assumptions** - Quick estimates cannot be refined to arbitrary depth
4. **Compare scenarios** - No side-by-side business case comparison

**Stakeholder Vision:**
> "Cash flow analysis over time is THE core element. User clicks revenue in month 14, asks 'why this value?' → AI explains reasoning and can refine underlying assumptions. Unlike Excel's single comment, a cell can have an entire market study as supporting evidence."

## Proposed Design

### Overview: The Intelligent Spreadsheet

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Bizcaseland 2.0 - Business Case: SaaS for Physical Therapists (Finland)   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────┐  ┌────────────────────┐ │
│  │  📊 Cash Flow Timeline                        │  │ 🤖 AI Assistant    │ │
│  │  ┌──────┬──────┬──────┬──────┬──────┬─────┐  │  │                    │ │
│  │  │      │ M1   │ M2   │ M3   │ M4   │ ... │  │  │ "Why is Month 14   │ │
│  │  ├──────┼──────┼──────┼──────┼──────┼─────┤  │  │ revenue €42,000?"  │ │
│  │  │Rev   │ 5K   │ 8K   │ 12K  │[15K]*│     │  │  │                    │ │
│  │  │COGS  │ -2K  │ -3K  │ -4K  │ -5K  │     │  │  │ Based on:          │ │
│  │  │OpEx  │ -10K │ -10K │ -11K │ -11K │     │  │  │ • Market size [📄] │ │
│  │  │EBITDA│ -7K  │ -5K  │ -3K  │ -1K  │     │  │  │ • Growth rate [📄] │ │
│  │  │Cash  │ -7K  │ -12K │ -15K │ -16K │     │  │  │ • Pricing [📄]     │ │
│  │  └──────┴──────┴──────┴──────┴──────┴─────┘  │  │                    │ │
│  │                                               │  │ [Refine] [Drill]   │ │
│  │  * Cell selected - [AI] badge visible        │  └────────────────────┘ │
│  └───────────────────────────────────────────────┘                         │
│                                                                             │
│  ┌──────────────────────────────────┐  ┌───────────────────────────────────┐│
│  │  📈 Key Metrics                  │  │  🔍 Cell Evidence (Revenue M4)    ││
│  │  NPV: €1.2M | IRR: 32%          │  │  ├── Market Research Doc [1]      ││
│  │  Payback: Month 18              │  │  │   "Finland PT market is €45M"  ││
│  │  Break-even: Month 12           │  │  ├── Competitor Analysis [2]      ││
│  └──────────────────────────────────┘  │  │   "3 competitors, 12% share"  ││
│                                         │  └── Assumption Trail            ││
│                                         │      15,000 = 500 users × €30    ││
│                                         └───────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core UX Principles

#### 1. Progressive Disclosure
- **Surface**: Clean grid with numbers, color-coded (green=positive, red=negative)
- **First click**: Cell highlights, shows brief rationale badge
- **Hover/second click**: Popover with formula + AI confidence
- **Deep dive**: Sidebar shows full evidence trail with linked research documents

#### 2. Familiar Metaphors from Excel/Sheets
| Excel Concept | Bizcaseland Equivalent | Key Difference |
|---------------|------------------------|----------------|
| Cell | `GridCell` | AI-backed with evidence depth |
| Formula | Auto-calculated | No manual formulas - AI derives |
| Comment | Evidence Panel | Full documents, not text snippets |
| Named Range | Assumption Reference | Links to underlying assumptions |
| Conditional Format | Confidence Coloring | AI confidence drives appearance |

#### 3. Cell Types

```typescript
type CellType =
  | 'input'        // User-entered value (editable)
  | 'calculated'   // Derived from formula (read-only)
  | 'ai_estimated' // AI-generated (editable, shows confidence)
  | 'hybrid'       // AI-suggested, user-modified (shows delta);
```

**Visual Indicators:**
- **Input cells**: White/neutral background, pencil icon on hover
- **Calculated cells**: Light gray, formula icon, non-editable
- **AI-estimated cells**: Sparkle badge, confidence gradient (blue=high, orange=low)
- **Hybrid cells**: Delta indicator showing user override vs AI suggestion

### Component Architecture

#### Grid Selection: Hybrid Approach

**Recommendation: AG Grid Community + Custom Cell Renderers**

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| AG Grid Community | Performance (100K+ rows), virtual scroll, free | Learning curve, less "spreadsheet feel" | **Use for data views** |
| Handsontable | True Excel UX, keyboard nav | $899+/yr license, perf limits | Not recommended |
| react-spreadsheet | Lightweight, MIT, customizable | Limited features, no enterprise support | **Use for simple grids** |
| Custom (current) | Full control, existing patterns | Development time, perf unknowns | **Enhance for cash flow** |

**Chosen Strategy:**
1. **Cash Flow Grid**: Enhance existing `CashFlowStatement.tsx` with new cell components
2. **Assumption Tables**: Use react-spreadsheet for simple editable grids
3. **Large Data Views**: AG Grid Community for scenario comparison with many rows

#### Component Hierarchy

```
src/
├── components/
│   ├── grid/
│   │   ├── CashFlowGrid.tsx           # Main cash flow timeline
│   │   ├── GridCell.tsx               # Base cell with evidence support
│   │   ├── InputCell.tsx              # User-editable values
│   │   ├── CalculatedCell.tsx         # Formula-derived values
│   │   ├── AIEstimatedCell.tsx        # AI-generated with confidence
│   │   ├── CellEvidencePanel.tsx      # Deep-dive evidence sidebar
│   │   ├── CellInterrogationModal.tsx # "Why this value?" dialog
│   │   └── index.ts
│   ├── scenarios/
│   │   ├── ScenarioComparison.tsx     # Side-by-side grid
│   │   └── ScenarioDiff.tsx           # Highlight differences
```

### Data Model

#### Extended Cell Model

```typescript
/**
 * CellWithEvidence - Extends ValueWithRationale for grid cells
 * Supports deep AI backing with full research document trails
 */
interface CellWithEvidence<T = number> {
  // Core value
  value: T;
  displayValue?: string;  // Formatted for display

  // Cell metadata
  cellType: 'input' | 'calculated' | 'ai_estimated' | 'hybrid';
  formula?: string;        // For calculated cells: "revenue - cogs"
  dataPath: string;        // JSON path: "monthlyData[3].revenue"

  // Rationale (quick view)
  rationale: string;
  unit: string;

  // AI backing (deep view)
  aiGenerated?: boolean;
  aiConfidence?: number;   // 0-1
  aiModel?: string;        // Which model generated this

  // Evidence trail (infinite depth)
  researchIds?: string[];  // Links to ResearchDocument[]
  assumptionRefs?: string[];  // Links to underlying assumptions

  // Edit tracking
  userModified?: boolean;
  originalAIValue?: T;     // If user overrode AI
  modifiedAt?: string;

  // Validation
  validRange?: [number, number];
  validationError?: string;
}

/**
 * ResearchDocument - Full backing evidence
 * Can contain entire market studies
 */
interface ResearchDocument {
  id: string;
  title: string;
  type: 'market_research' | 'competitor_analysis' | 'customer_survey' | 'expert_input' | 'calculation';

  // Content
  summary: string;         // Brief for popover
  fullContent: string;     // Markdown for deep dive

  // Source
  source: {
    type: 'ai_research' | 'web_search' | 'user_input' | 'imported';
    url?: string;
    searchQuery?: string;
    model?: string;
    timestamp: string;
  };

  // Relationships
  linkedCells: string[];   // Which cells reference this
  linkedAssumptions: string[];

  // Quality
  confidence: number;
  verificationStatus: 'unverified' | 'user_verified' | 'expert_verified';
}
```

#### Cash Flow Grid Data Structure

```typescript
interface CashFlowGridData {
  meta: {
    title: string;
    currency: CurrencyCode;
    periods: number;
    frequency: 'monthly' | 'quarterly' | 'annually';
  };

  rows: GridRow[];

  // Columns are time periods
  columns: {
    period: number;
    date: Date;
    label: string;  // "M1", "Q1 2025", etc.
  }[];
}

interface GridRow {
  id: string;
  label: string;
  category: 'revenue' | 'costs' | 'profit' | 'cash' | 'volume' | 'spacer';
  isTotal?: boolean;
  isSubtotal?: boolean;
  isSubItem?: boolean;

  // Cell values by period
  cells: Map<number, CellWithEvidence>;
}
```

### Key Interactions

#### 1. Cell Interrogation Flow

```
User clicks cell → Cell highlights with glow
  │
  ├─ Quick view (popover appears automatically):
  │   • Value: €15,000
  │   • Formula: 500 users × €30/user
  │   • Confidence: 78% [AI badge]
  │   • [Ask AI] [View Evidence] buttons
  │
  ├─ User clicks "Ask AI" or types question:
  │   │
  │   └─ AI Sidebar activates with context:
  │       "Why is Month 4 revenue €15,000?"
  │
  │       AI Response:
  │       "This projection is based on:
  │        • 500 projected users (from market research)
  │        • €30/month pricing (competitor analysis)
  │
  │        Key assumptions:
  │        • 15% month-over-month growth
  │        • 3% churn rate
  │
  │        [Refine Growth Rate] [Adjust Pricing]
  │        [See Full Market Research]"
  │
  └─ User clicks "View Evidence":
      │
      └─ Evidence Panel slides in:
          ├── Market Research: Finland PT Market (📄)
          │   "The Finnish physical therapy market..."
          │   [Read Full Document]
          │
          ├── Competitor Analysis: 3 Main Players (📄)
          │   "Competitor pricing ranges €25-40..."
          │   [Read Full Document]
          │
          └── Assumption Chain:
              revenue = users × price
              users = prev_users × (1 + growth) × (1 - churn)
              [Edit in Assumptions Panel]
```

#### 2. Quick Edit Flow

```
User double-clicks cell (or presses Enter)
  │
  ├─ Input cell: Edit mode activates
  │   • Current value selected
  │   • Enter to save, Escape to cancel
  │   • Tab moves to next cell
  │
  ├─ AI-estimated cell: Override dialog
  │   • Shows AI value and confidence
  │   • "Override with your value?"
  │   • Input field for new value
  │   • "Keep AI value" or "Use My Value"
  │   • If overridden: shows delta badge
  │
  └─ Calculated cell: Shows formula
      • Cannot edit directly
      • "Edit underlying assumptions" link
```

#### 3. Keyboard Navigation (Excel-compatible)

| Key | Action |
|-----|--------|
| Arrow keys | Navigate cells |
| Enter | Edit cell / Confirm edit |
| Tab | Move right |
| Shift+Tab | Move left |
| Escape | Cancel edit |
| Ctrl+C | Copy cell value |
| Ctrl+V | Paste (into input cells) |
| F2 | Edit cell |
| Ctrl+? | Show cell details |

### Wireframes

#### Cash Flow Grid (Primary View)

```
┌──────────────────────────────────────────────────────────────────┐
│ 📊 Cash Flow Analysis - SaaS for Finnish Physical Therapists    │
│ Currency: EUR | Periods: 24 months | Model: Recurring Revenue    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┬────────┬────────┬────────┬────────┬─────────┐   │
│  │            │   M1   │   M2   │   M3   │   M4   │   ...   │   │
│  ├────────────┼────────┼────────┼────────┼────────┼─────────┤   │
│  │ Revenue    │  5,000 │  8,000 │ 12,000 │ 15,000✨│         │   │
│  │   Users    │    100 │    160 │    240 │    300 │         │   │
│  │   Price    │     50 │     50 │     50 │     50 │         │   │
│  ├────────────┼────────┼────────┼────────┼────────┼─────────┤   │
│  │ COGS       │ -2,000 │ -3,200 │ -4,800 │ -6,000 │         │   │
│  ├────────────┼────────┼────────┼────────┼────────┼─────────┤   │
│  │ Gross      │  3,000 │  4,800 │  7,200 │  9,000 │         │   │
│  ├────────────┼────────┼────────┼────────┼────────┼─────────┤   │
│  │ S&M        │ -5,000 │ -5,500 │ -6,000 │ -6,500 │         │   │
│  │ R&D        │ -8,000 │ -8,000 │ -8,500 │ -8,500 │         │   │
│  │ G&A        │ -3,000 │ -3,000 │ -3,200 │ -3,200 │         │   │
│  ├────────────┼────────┼────────┼────────┼────────┼─────────┤   │
│  │ EBITDA     │-13,000 │-11,700 │-10,500 │ -9,200 │         │   │
│  ├────────────┼────────┼────────┼────────┼────────┼─────────┤   │
│  │ Net Cash   │-13,000 │-24,700 │-35,200 │-44,400 │         │   │
│  └────────────┴────────┴────────┴────────┴────────┴─────────┘   │
│                                                                  │
│  Legend: ✨ AI-generated  ✏️ User-edited  📊 Calculated          │
│                                                                  │
│  [Export CSV] [Export PDF] [Compare Scenarios]                   │
└──────────────────────────────────────────────────────────────────┘
```

#### Cell Detail Popover

```
┌───────────────────────────────────────┐
│ Revenue - Month 4                     │
│                                       │
│ Value: €15,000                        │
│ Formula: users × price_per_user       │
│          300 × €50                    │
│                                       │
│ ┌─────────────────────────────────┐   │
│ │ ✨ AI Confidence: 78%           │   │
│ │ ████████████░░░░                │   │
│ └─────────────────────────────────┘   │
│                                       │
│ Sources: 2 research documents         │
│ • Market Analysis (high conf.)        │
│ • Competitor Pricing (medium conf.)   │
│                                       │
│ [💬 Ask AI]  [📄 View Evidence]       │
└───────────────────────────────────────┘
```

#### Scenario Comparison View

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🔀 Scenario Comparison                                                  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌────────────┬──────────────────┬──────────────────┬────────────────┐│
│  │            │    Base Case     │   Optimistic     │   Pessimistic  ││
│  ├────────────┼──────────────────┼──────────────────┼────────────────┤│
│  │ M12 Rev    │     €180,000     │     €250,000     │     €120,000   ││
│  │            │                  │     +39% ▲       │     -33% ▼     ││
│  ├────────────┼──────────────────┼──────────────────┼────────────────┤│
│  │ M24 Rev    │     €500,000     │     €750,000     │     €300,000   ││
│  │            │                  │     +50% ▲       │     -40% ▼     ││
│  ├────────────┼──────────────────┼──────────────────┼────────────────┤│
│  │ NPV        │     €1.2M        │     €2.1M        │     €400K      ││
│  │ IRR        │       32%        │       48%        │       18%      ││
│  │ Payback    │     Month 18     │     Month 12     │     Month 24+  ││
│  └────────────┴──────────────────┴──────────────────┴────────────────┘│
│                                                                        │
│  Key Assumption Differences:                                           │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Growth Rate:  15%/mo (base) → 20%/mo (opt.) → 10%/mo (pess.)     │ │
│  │ Churn Rate:   3%/mo (base) → 2%/mo (opt.) → 5%/mo (pess.)        │ │
│  │ Price:        €50 (base) → €55 (opt.) → €45 (pess.)              │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Library Recommendations

#### Primary: shadcn/ui + Custom Grid Components

Keep using existing shadcn/ui components and extend with:

```typescript
// New grid-specific components needed:

// 1. Base grid cell with evidence support
<GridCell
  value={cell}
  onSelect={() => setSelectedCell(cell)}
  onEdit={(newValue) => updateCell(cell.dataPath, newValue)}
  onInterrogate={() => openAIChat(cell)}
/>

// 2. Evidence panel for deep dives
<CellEvidencePanel
  cell={selectedCell}
  documents={getResearchDocs(cell.researchIds)}
  onDocumentSelect={(doc) => openDocViewer(doc)}
/>

// 3. Scenario comparison grid (consider AG Grid here)
<ScenarioComparisonGrid
  scenarios={[baseCase, optimistic, pessimistic]}
  highlightDifferences={true}
/>
```

#### For Large Data: AG Grid Community

```tsx
// For scenario comparison with many rows
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Custom cell renderer for AI confidence
const AIConfidenceCell = (props) => (
  <div className="flex items-center gap-2">
    <span>{formatCurrency(props.value)}</span>
    {props.data.aiConfidence && (
      <AIBadge confidence={props.data.aiConfidence} />
    )}
  </div>
);
```

### Trade-offs and Decisions

#### Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Grid library | Hybrid (custom + AG Grid) | Best balance of UX control and performance |
| Cell model | CellWithEvidence extension | Builds on existing ValueWithRationale |
| Evidence storage | IndexedDB (via existing pattern) | Handles large research docs |
| Keyboard nav | Excel-compatible shortcuts | Familiar to business users |

#### Trade-offs

| Trade-off | Choice | What We Gave Up |
|-----------|--------|-----------------|
| Full Excel parity vs AI-first | AI-first | Some Excel power users may miss advanced features |
| Custom grid vs off-the-shelf | Custom for core, AG Grid for data | Development time for custom components |
| Evidence depth vs load time | Lazy load docs | Initial view may not show all evidence |

### Implementation Phases

#### Phase 1: Enhanced Cash Flow Grid
- [ ] Create `GridCell` component with evidence support
- [ ] Add cell selection and highlight states
- [ ] Implement basic popover with rationale
- [ ] Connect to existing DataContext

#### Phase 2: Cell Interrogation
- [ ] Create `CellInterrogationModal`
- [ ] Connect to AI sidebar with cell context
- [ ] Implement "Ask AI" flow with research backing
- [ ] Add evidence panel sidebar

#### Phase 3: Edit Capabilities
- [ ] Implement `InputCell` for editable values
- [ ] Add override flow for AI-estimated cells
- [ ] Track user modifications with delta display
- [ ] Keyboard navigation

#### Phase 4: Scenario Comparison
- [ ] Create `ScenarioComparisonGrid` with AG Grid
- [ ] Implement diff highlighting
- [ ] Add assumption variation controls
- [ ] Export comparison reports

#### Phase 5: Polish
- [ ] Performance optimization for 100+ period grids
- [ ] Accessibility audit (ARIA for grid navigation)
- [ ] Mobile responsive design
- [ ] User documentation

## References

- [AG Grid Documentation](https://www.ag-grid.com/react-data-grid/)
- [react-spreadsheet](https://github.com/iddan/react-spreadsheet)
- [Handsontable](https://handsontable.com)
- [Best JavaScript Data Grids 2025](https://bryntum.com/blog/the-best-javascript-data-grids-in-2025/)
- [React Table Libraries Comparison](https://www.simple-table.com/blog/best-react-table-libraries-2025)

## Appendix: Existing Code References

Key files to understand current implementation:
- `src/modules/business-case/components/CashFlowStatement.tsx` - Current grid
- `src/components/common/EditableValueCell.tsx` - Existing edit pattern
- `src/components/common/ValueWithRationaleDisplay.tsx` - AI badge pattern
- `src/core/types/common.ts` - ValueWithRationale type
- `src/core/contexts/DataContext.tsx` - State management
