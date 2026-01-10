# Design: AI Co-pilot Sidebar for Bizcaseland

> Generated: 2026-01-05
> Status: Ready for Review

## Executive Summary

Transform Bizcaseland from a manual JSON copy-paste workflow to an integrated AI-first experience with a persistent chat sidebar. Users will be able to generate, refine, and research-back business cases and market analyses through natural conversation with an AI assistant.

**Key Decisions:**
- **Layout**: Resizable right sidebar (desktop) with Sheet fallback (mobile)
- **State**: Separate AIContext + DataContext with bridge hook
- **Data Model**: Hybrid research documents (inline summary + external store)
- **Security**: Backend proxy REQUIRED for API key protection
- **Budget**: $10/week allows ~300 moderate interactions

## Problem Statement

Current workflow requires users to:
1. Copy JSON template from app
2. Paste to external ChatGPT/Claude
3. Have AI populate the template
4. Paste JSON back into app

This is friction-heavy and loses context. The AI-first experience brings AI collaboration directly into the app.

## Proposed Design

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Bizcaseland                                    [Theme] [Reset] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐│
│  │  📊 Business Case            │  │  🤖 AI Assistant         ││
│  │  [Existing tabs/charts]      │  │                          ││
│  │                              │  │  Chat with context       ││
│  │  Values show [AI] badges     │  │  awareness               ││
│  │  when AI-suggested           │  │                          ││
│  │                              │  │  [Pending Suggestions]   ││
│  │                              │  │                          ││
│  └──────────────────────────────┘  └──────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **AICopilotSidebar** - Main chat interface with message history
2. **AIContext** - State management for chat, suggestions, research docs
3. **aiService** - LiteLLM API abstraction with streaming
4. **ResearchDocument system** - Source backing for every data point
5. **Suggestion approval flow** - AI suggests → user reviews → accepts/rejects

### Interface Design

**AI Service:**
```typescript
interface AIService {
  stream(messages: ChatMessage[], onChunk: (chunk) => void): void;
  parseSuggestions(response: string): AISuggestion[];
}
```

**Suggestion Flow:**
```typescript
interface AISuggestion {
  path: string;           // e.g., "assumptions.pricing.avg_unit_price"
  currentValue: any;
  suggestedValue: any;
  rationale: string;
  confidence: number;     // 0-1
  researchRefs: string[]; // Document IDs
  status: 'pending' | 'accepted' | 'rejected';
}
```

**Data Extension (backward compatible):**
```typescript
interface ValueWithRationale<T = number> {
  value: T;
  unit: string;
  rationale: string;
  link?: string;
  // NEW optional fields:
  researchIds?: string[];  // Research document references
  aiGenerated?: boolean;   // Was this AI-suggested?
  aiConfidence?: number;   // AI confidence score
}
```

## Trade-offs and Decisions

### Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Sidebar layout | Resizable panel + Sheet mobile | Best UX, uses existing components |
| State management | Separate AIContext | Clean separation, testable |
| Research docs | Hybrid (inline summary + store) | Balance of UX and storage |
| API key handling | Backend proxy | SECURITY REQUIREMENT |
| Chat history | Sliding window (6 messages) | Token budget management |

### Decisions Finalized

1. **Backend Infrastructure**: Netlify Functions
   - API key stored in Netlify environment variables
   - Serverless function proxies requests to LiteLLM

2. **Data Sensitivity**: No restrictions
   - LiteLLM is vetted and safe
   - All business data can be sent to AI

3. **Model Selection**: Multiple options for user choice
   - `google/gemini-2.0-flash` (fast, cheap - default)
   - `azure/gpt-4o-mini` (balanced)
   - User can switch in settings

4. **Web Search**: ENABLED
   - Essential for research backing
   - Domain allowlist for trusted sources

5. **Token Transparency**: Show usage to user
   - Display tokens used per request
   - Running total in sidebar footer
   - Model cost indicator

### Trade-offs

| Trade-off | Choice | What We Gave Up |
|-----------|--------|-----------------|
| Rich chat vs budget | Sliding window history | Full conversation context |
| Security vs simplicity | Backend proxy | Pure client-side app |
| UX vs storage | Hybrid research docs | Either full inline or full external |

## Risks and Mitigations

### Security (CRITICAL)

| Risk | Severity | Mitigation |
|------|----------|------------|
| API key exposure in client | CRITICAL | Backend proxy required |
| Sensitive data to AI | HIGH | Data classification + filtering |
| Prompt injection | HIGH | Input validation + system prompt hardening |
| XSS from AI responses | MEDIUM | Sanitized markdown rendering |

### Scalability

| Risk | Severity | Mitigation |
|------|----------|------------|
| Budget exhaustion | HIGH | Tiered rate limiting, graceful degradation |
| localStorage limits | MEDIUM | IndexedDB for research docs |
| Token costs | MEDIUM | Smart context pruning, caching |

## Implementation Plan

### Phase 1: Foundation
- [ ] Create `src/core/types/ai.ts`
- [ ] Create `AIContext` in `src/core/contexts/`
- [ ] Create `aiService` mock implementation
- [ ] Add feature flag infrastructure
- [ ] Extend storage keys

### Phase 2: Sidebar Shell
- [ ] Create `AICopilotSidebar` component
- [ ] Create `ChatMessage`, `ChatInput` components
- [ ] Integrate `SidebarProvider` into modules
- [ ] Add toggle button to headers
- [ ] Mobile Sheet fallback

### Phase 3: Backend Proxy
- [ ] Set up Cloudflare Worker (or alternative)
- [ ] Move API key to backend
- [ ] Add rate limiting middleware
- [ ] Add request logging

### Phase 4: AI Integration
- [ ] Implement real AI service
- [ ] Add streaming response support
- [ ] Implement suggestion parsing
- [ ] Add approval workflow UI

### Phase 5: Research Documents
- [ ] Create `ResearchDocPanel`
- [ ] Implement document storage (IndexedDB)
- [ ] Add document linking to ValueWithRationale
- [ ] Source citation UI

### Phase 6: Polish
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Feature flag gradual rollout
- [ ] User documentation

## Appendix: Dimension Analyses

Full analyses available in `.designs/ai-copilot-sidebar/`:
- `api-design.md` - Interface and component APIs
- `data-model.md` - Data structures and storage
- `ux-analysis.md` - User experience flows
- `scalability.md` - Performance and cost analysis
- `security.md` - Threat model and mitigations
- `integration.md` - Implementation plan and testing
