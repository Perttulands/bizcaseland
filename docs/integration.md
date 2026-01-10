# AI Integration Analysis

> Integration plan for AI-First Experience Overhaul (Epic: bi-phu)

## Executive Summary

This document analyzes how the AI feature set integrates with the existing Bizcaseland codebase. The platform's architecture is already **AI-ready** with `ValueWithRationale` patterns, modular design, and clear separation of concerns. Integration requires careful coordination across 5 new components with a clear dependency chain.

---

## 1. Existing Components Touched

### 1.1 Routes & Page Components

| Component | Location | Impact |
|-----------|----------|--------|
| `BusinessCaseAnalyzer` | `src/modules/business-case/components/BusinessCaseAnalyzer.tsx` | **HIGH** - Add AIChatSidebar alongside main content |
| `MarketAnalysisSuite` | `src/modules/market-analysis/components/MarketAnalysisSuite.tsx` | **HIGH** - Add AIChatSidebar alongside main content |
| `App.tsx` | `src/App.tsx` | **LOW** - No route changes needed |

### 1.2 Core Infrastructure

| Component | Location | Impact |
|-----------|----------|--------|
| `DataContext` | `src/core/contexts/DataContext.tsx` | **MEDIUM** - Extend with AI state (chat history, session) |
| `StorageService` | `src/core/services/storage.service.ts` | **LOW** - Add new STORAGE_KEYS for AI data |
| `STORAGE_KEYS` | `src/core/services/storage.service.ts:118` | **LOW** - Add AI_CHAT_HISTORY, RESEARCH_DOCS keys |

### 1.3 Type System

| Component | Location | Impact |
|-----------|----------|--------|
| `common.ts` | `src/core/types/common.ts` | **MEDIUM** - Add ResearchDocument, AIMessage types |
| `business.ts` | `src/core/types/business.ts` | **LOW** - Extend with optional research_docs field |
| `market.ts` | `src/core/types/market.ts` | **LOW** - Extend with optional research_docs field |

### 1.4 UI Components

| Component | Location | Impact |
|-----------|----------|--------|
| `ValueWithRationaleDisplay` | `src/components/common/ValueWithRationaleDisplay.tsx` | **MEDIUM** - Add expandable research backing UI |
| `EditableValueCell` | Various | **LOW** - Potential AI-suggest button |

---

## 2. Dependencies: What New Features Need

### 2.1 Dependency Graph

```
                    bi-ght (AI Service Layer)
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
         bi-wqq      bi-div         (direct)
     (Chat Sidebar)  (Research Docs)     │
              │            │            │
              └────────────┼────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
         bi-9je                     bi-kv7
   (Business AI Integration)  (Market AI Integration)
```

### 2.2 External Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| LiteLLM API | External | AI completions (configured via env vars) |
| `@tanstack/react-query` | Existing | Streaming response handling |
| Existing shadcn/ui | Existing | Chat UI components (Button, Input, ScrollArea) |

### 2.3 Internal Dependencies (Existing Code Used)

| New Component | Depends On | Usage |
|---------------|------------|-------|
| `ai-service.ts` | `storage.service.ts` | Persist chat history |
| `AIChatSidebar` | `useBusinessData()`, `useMarketData()` | Read current data for context |
| `AIChatSidebar` | `ai-service.ts` | Send/receive messages |
| `ResearchDocument` | `common.ts` types | Type definitions |
| Business/Market AI | `DataContext` | Update data from AI suggestions |

### 2.4 Environment Configuration

New environment variables (`.env`):
```
VITE_LITELLM_API_URL=https://...
VITE_LITELLM_API_KEY=...
VITE_LITELLM_MODEL=gpt-4-turbo  # or claude-3-sonnet
```

---

## 3. Dependents: What Will Use These Features

### 3.1 Immediate Dependents

| Component | Depends On | How |
|-----------|------------|-----|
| `BusinessCaseAnalyzer` | `AIChatSidebar`, AI Service | Embeds sidebar, uses AI suggestions |
| `MarketAnalysisSuite` | `AIChatSidebar`, AI Service | Embeds sidebar, uses AI suggestions |
| All editable cells | `ResearchDocument` | Display expandable research backing |
| PDF Export | `ResearchDocument` | Include research in exports |

### 3.2 Future Dependents (Not In Scope)

- Scenario comparison tool
- Multi-user collaboration
- Version history with AI-generated diffs
- Automated data refresh via AI agents

---

## 4. Where Code Lives

### 4.1 New Files to Create

```
src/
├── core/
│   ├── services/
│   │   └── ai-service.ts           # NEW: LiteLLM integration
│   └── types/
│       └── ai.ts                   # NEW: AI-specific types
├── components/
│   └── features/
│       └── AIChatSidebar/
│           ├── index.ts            # NEW: Export barrel
│           ├── AIChatSidebar.tsx   # NEW: Main component
│           ├── ChatMessage.tsx     # NEW: Message bubble
│           ├── ChatInput.tsx       # NEW: Input field
│           └── StreamingText.tsx   # NEW: Streaming display
```

### 4.2 Files to Modify

```
src/
├── core/
│   ├── contexts/DataContext.tsx    # MODIFY: Add chat state
│   ├── services/storage.service.ts # MODIFY: Add AI storage keys
│   └── types/
│       ├── common.ts               # MODIFY: Add ResearchDocument
│       ├── business.ts             # MODIFY: Extend with research_docs
│       └── market.ts               # MODIFY: Extend with research_docs
├── modules/
│   ├── business-case/
│   │   └── components/
│   │       └── BusinessCaseAnalyzer.tsx  # MODIFY: Add sidebar
│   └── market-analysis/
│       └── components/
│           └── MarketAnalysisSuite.tsx   # MODIFY: Add sidebar
```

---

## 5. Impact on Existing Workflows

### 5.1 Data Flow Changes

**Before (Manual Workflow):**
```
User → Export JSON Template → External AI Tool → Copy JSON → Import
```

**After (Integrated Workflow):**
```
User → Chat with AI Sidebar → AI Suggests Values → User Approves → Auto-update Data
```

### 5.2 State Management Changes

**Current DataState:**
```typescript
interface DataState {
  business: { data, hasData, lastModified }
  market: { data, hasData, lastModified }
  ui: { activeMode }
}
```

**Extended DataState:**
```typescript
interface DataState {
  business: { data, hasData, lastModified }
  market: { data, hasData, lastModified }
  ui: { activeMode }
  ai: {                        // NEW
    chatHistory: AIMessage[]
    sessionId: string | null
    isStreaming: boolean
    researchDocs: Map<string, ResearchDocument>
  }
}
```

### 5.3 Type System Extensions

**New `ResearchDocument` type:**
```typescript
interface ResearchDocument {
  id: string
  dataPath: string           // Links to ValueWithRationale path
  sources: Source[]
  rationale: string
  confidence: 'high' | 'medium' | 'low'
  timestamp: string
  generatedBy: 'ai' | 'user'
}

interface Source {
  title: string
  url?: string
  excerpt?: string
  accessDate: string
}
```

**Extended `ValueWithRationale`:**
```typescript
interface ValueWithRationale<T = number> {
  readonly value: T
  readonly unit: string
  readonly rationale: string
  readonly link?: string
  readonly researchDocId?: string  // NEW: Optional link to ResearchDocument
}
```

---

## 6. Dependent Code Changes

### 6.1 BusinessCaseAnalyzer Changes

```tsx
// Before
return (
  <div className="container mx-auto p-4">
    <Tabs>...</Tabs>
  </div>
);

// After
return (
  <div className="flex">
    <div className="flex-1 container mx-auto p-4">
      <Tabs>...</Tabs>
    </div>
    <AIChatSidebar
      context="business"
      data={jsonData}
      onSuggestion={handleAISuggestion}
    />
  </div>
);
```

### 6.2 MarketAnalysisSuite Changes

Same pattern as BusinessCaseAnalyzer - wrap in flex container with sidebar.

---

## 7. Migration Path

### 7.1 Implementation Order (Critical Path)

```
Week 1:
├── bi-ght: AI Service Layer (FOUNDATION)
│   └── No blockers - can start immediately

Week 2:
├── bi-div: Research Document System (parallel)
│   └── Depends on types from bi-ght
├── bi-wqq: AI Chat Sidebar (parallel)
│   └── Depends on AI Service from bi-ght

Week 3:
├── bi-9je: Business Case AI Integration
│   └── Depends on bi-ght, bi-wqq, bi-div
├── bi-kv7: Market Analysis AI Integration
│   └── Depends on bi-ght, bi-wqq, bi-div
```

### 7.2 Feature Flag Strategy

Per REFACTORING_PLAN.md: *"This is not a production version, no need for backward compatibility or bandage fixes. We do not expect backward compatibility. It is ok to break the app for a while."*

**Recommendation:** No feature flags needed. Direct integration approach:
1. Build AI Service first (isolated)
2. Build sidebar component (isolated)
3. Integrate into routes (breaking change OK)

### 7.3 Rollout Steps

1. **Phase 1: Foundation** (bi-ght)
   - Create `src/core/services/ai-service.ts`
   - Add environment variables
   - Add type definitions
   - Unit tests for AI service

2. **Phase 2: Components** (bi-wqq, bi-div in parallel)
   - Build AIChatSidebar component tree
   - Build ResearchDocument storage
   - Extend DataContext
   - Component tests

3. **Phase 3: Integration** (bi-9je, bi-kv7 in parallel)
   - Add sidebar to BusinessCaseAnalyzer
   - Add sidebar to MarketAnalysisSuite
   - Wire up AI suggestions → data updates
   - Integration tests

---

## 8. Backwards Compatibility

### 8.1 Breaking Changes (Acceptable per REFACTORING_PLAN.md)

| Change | Impact | Mitigation |
|--------|--------|------------|
| DataContext shape change | Components using `useData()` | Update all consumers |
| Layout shift in analyzers | UI positioning | CSS updates only |
| New required env vars | Local dev setup | Document in README |

### 8.2 Non-Breaking Additions

| Addition | Compatibility |
|----------|---------------|
| New `ai.ts` types | Additive only |
| Optional `researchDocId` on VWR | Optional field, backwards compatible |
| New storage keys | Isolated, no conflicts |
| New sidebar component | Self-contained |

### 8.3 Data Migration

**Existing data (localStorage) requires NO migration:**
- `researchDocId` field is optional
- Existing `ValueWithRationale` objects remain valid
- AI chat history starts fresh per session

---

## 9. Testing Strategy

### 9.1 Unit Tests

| Component | Test Focus |
|-----------|------------|
| `ai-service.ts` | API calls, error handling, retry logic |
| `AIChatSidebar` | Message rendering, input handling |
| `ResearchDocument` | Storage, retrieval, linking |
| Type guards | New AI types validation |

### 9.2 Integration Tests

| Test Case | Components |
|-----------|------------|
| AI suggestion → data update | AIService + DataContext |
| Chat history persistence | AIService + StorageService |
| Research doc linking | ResearchDoc + ValueWithRationale |

### 9.3 E2E Tests

| Flow | Steps |
|------|-------|
| Business case AI workflow | Open /business → Chat → Accept suggestion → Verify update |
| Market analysis AI workflow | Open /market → Chat → Accept suggestion → Verify update |
| Research doc expansion | Click VWR → Expand research → View sources |

### 9.4 Test File Locations

```
src/
├── core/
│   └── services/
│       └── __tests__/
│           └── ai-service.test.ts       # NEW
├── components/
│   └── features/
│       └── AIChatSidebar/
│           └── __tests__/
│               └── AIChatSidebar.test.tsx # NEW
```

---

## 10. Risk Assessment

### 10.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LiteLLM API latency | Medium | Medium | Streaming responses, loading states |
| Token limits exceeded | Low | High | Truncate context, summarize data |
| Conflicting state updates | Medium | High | Queue AI updates, optimistic locking |
| Streaming failures | Medium | Medium | Graceful degradation, retry |

### 10.2 UX Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Sidebar obscures content | Medium | Medium | Collapsible, resizable panel |
| AI hallucinations | High | High | User approval required for all changes |
| Slow AI responses | High | Medium | Streaming, cancel button |

---

## 11. Success Criteria

### 11.1 Functional

- [ ] AI sidebar visible on `/business` route
- [ ] AI sidebar visible on `/market` route
- [ ] User can send messages, receive streaming responses
- [ ] AI suggestions can be accepted → data updates
- [ ] Research documents link to data points
- [ ] Research expandable in UI

### 11.2 Non-Functional

- [ ] First response token < 500ms
- [ ] Full response < 10s for typical queries
- [ ] No regressions in existing test suite
- [ ] Sidebar collapse state persists

---

## 12. Open Questions

1. **System Prompt Strategy:** Separate prompts per module (business vs market) or unified?
   - **Recommendation:** Separate prompts with shared base context

2. **Chat History Scope:** Per session or persistent?
   - **Recommendation:** Per session initially, persist later

3. **Suggestion Format:** Structured JSON or natural language?
   - **Recommendation:** Structured JSON with user-friendly display

4. **Multi-turn Context:** How much data to include in each request?
   - **Recommendation:** Summary of current data + last 5 messages

---

## Appendix A: Type Definitions

```typescript
// src/core/types/ai.ts

export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  suggestions?: AISuggestion[]
}

export interface AISuggestion {
  id: string
  path: string              // JSON path to update
  currentValue: any
  suggestedValue: any
  rationale: string
  confidence: 'high' | 'medium' | 'low'
  sources?: string[]
  status: 'pending' | 'accepted' | 'rejected'
}

export interface AIServiceConfig {
  apiUrl: string
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
}

export interface StreamCallbacks {
  onToken: (token: string) => void
  onComplete: (message: AIMessage) => void
  onError: (error: Error) => void
}
```

---

## Appendix B: Component Props

```typescript
// AIChatSidebar Props
interface AIChatSidebarProps {
  context: 'business' | 'market'
  data: BusinessData | MarketData | null
  onSuggestion: (suggestion: AISuggestion) => void
  onAcceptSuggestion: (suggestionId: string) => void
  onRejectSuggestion: (suggestionId: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  width?: number
  minWidth?: number
  maxWidth?: number
}

// ResearchDocExpander Props
interface ResearchDocExpanderProps {
  docId: string
  path: string
  initialExpanded?: boolean
}
```

---

*Generated by: polecat furiosa*
*Date: 2026-01-05*
*Epic: bi-phu (AI-First Experience Overhaul)*
