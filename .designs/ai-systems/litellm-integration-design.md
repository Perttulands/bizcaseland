# Design: AI Systems - LiteLLM Integration & Agent Orchestration

> Generated: 2026-01-06
> Status: Draft
> Author: dementus (Polecat)

## Executive Summary

This document outlines the architecture for Bizcaseland 2.0's AI-powered business case agent. The system uses a LiteLLM gateway for unified model access, Sonnet 4.5 for complex reasoning, and Gemini Flash 2.5 for fast web search with grounding.

**Key Architectural Decisions:**
- **Gateway**: LiteLLM Proxy for unified API, cost tracking, fallback routing
- **Research Agent**: Gemini 2.0 Flash with Google Search grounding for real-time market data
- **Analysis Agent**: Sonnet 4.5 for complex reasoning, calculation validation, strategic insights
- **Orchestration**: Multi-agent workflow with cell-level interrogation and cumulative evidence

## Problem Statement

Users currently copy business case JSON to external AI tools, losing context and requiring manual data re-entry. The AI-first experience should:

1. Allow **cell-level interrogation**: User selects a cell, asks "why?" and AI explains its reasoning chain
2. Support **assumption refinement**: AI researches and refines underlying assumptions with citations
3. Enable **quick-to-deep research**: Fast answers (e.g., "how many physical therapists in Finland?") that can drill infinitely deeper
4. Build **cumulative evidence**: Each research session adds to the cell's supporting evidence over time

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BIZCASELAND CLIENT                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Business Case UI          │  AI Chat Sidebar                    │  │
│  │  - Cell selection          │  - Message history                  │  │
│  │  - Value editing           │  - Quick actions                    │  │
│  │  - Research badges         │  - Source citations                 │  │
│  │  - Evidence panel          │  - Streaming responses              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                  │                                       │
│                                  ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              AGENT ORCHESTRATION LAYER                           │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │  │
│  │  │  Research  │  │  Analysis  │  │ Calculation│                 │  │
│  │  │   Agent    │  │   Agent    │  │   Agent    │                 │  │
│  │  │ (Flash 2.5)│  │(Sonnet 4.5)│  │   (Local)  │                 │  │
│  │  └────────────┘  └────────────┘  └────────────┘                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API LAYER (Netlify Functions)                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │  /api/ai   │  │/api/search │  │/api/research│ │/api/analyze│       │
│  │ (chat)     │  │(web search)│  │(deep dive) │  │(reasoning) │       │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        LITELLM PROXY GATEWAY                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  • Unified OpenAI-compatible API                                 │  │
│  │  • Cost tracking per request/user/project                        │  │
│  │  • Automatic fallback: Sonnet → GPT-4o → Gemini                  │  │
│  │  • Rate limiting & guardrails                                    │  │
│  │  • Request logging for observability                             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                    │                    │                    │          │
│                    ▼                    ▼                    ▼          │
│  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐ │
│  │  Anthropic API     │ │  Google AI API     │ │  Azure OpenAI      │ │
│  │  (Sonnet 4.5)      │ │  (Flash 2.5)       │ │  (GPT-4o)          │ │
│  └────────────────────┘ └────────────────────┘ └────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## Agent Architecture

### 1. Research Agent (Gemini 2.0 Flash + Grounding)

**Purpose**: Fast market data retrieval with real-time web search

**Model**: `google/gemini-2.0-flash` via LiteLLM

**Key Capability**: Google Search grounding - the model can decide when to search the web

```typescript
interface ResearchRequest {
  query: string;                    // "How many physical therapists in Finland?"
  context: CellContext;             // Current cell data, path, rationale
  depth: 'quick' | 'standard' | 'deep';
  trustedDomainsOnly?: boolean;
}

interface ResearchResponse {
  answer: string;
  confidence: number;
  sources: ResearchSource[];        // From grounding metadata
  suggestedValue?: {
    value: number | string;
    unit: string;
    rationale: string;
  };
  followUpQuestions?: string[];     // For "drill deeper" UX
}
```

**Grounding Integration**:
```typescript
// LiteLLM call with Google Search tool
const response = await litellm.chat({
  model: 'google/gemini-2.0-flash',
  messages: [...],
  tools: [{
    type: 'google_search',
    google_search: {}
  }],
  // Model decides when to search
});

// Extract grounding metadata
const groundingChunks = response.groundingMetadata?.groundingChunks;
const sources = groundingChunks?.map(chunk => ({
  url: chunk.web?.uri,
  title: chunk.web?.title,
  snippet: chunk.retrievedContext?.text
}));
```

### 2. Analysis Agent (Claude Sonnet 4.5)

**Purpose**: Complex reasoning, strategic analysis, assumption validation

**Model**: `anthropic/claude-sonnet-4.5` via LiteLLM

**Use Cases**:
- Explain reasoning chains for cell values
- Validate assumption consistency
- Generate strategic recommendations
- Synthesize research into actionable insights

```typescript
interface AnalysisRequest {
  type: 'explain' | 'validate' | 'synthesize' | 'strategize';
  context: BusinessCaseContext;     // Full business case data
  focusPath?: string;               // Specific cell path
  researchDocs?: ResearchDocument[];
}

interface AnalysisResponse {
  analysis: string;
  confidence: number;
  suggestions?: AISuggestion[];
  warnings?: string[];              // Inconsistency warnings
  relatedCells?: string[];          // Cells affected by this analysis
}
```

### 3. Calculation Agent (Local)

**Purpose**: Validate and compute business metrics

**Implementation**: Client-side TypeScript, no LLM needed

**Responsibilities**:
- Recalculate dependent cells when values change
- Validate input ranges and relationships
- Propagate changes through calculation graph
- Flag calculation errors for AI review

## API Route Structure

### `/api/ai/chat` - General Chat

```typescript
// POST /.netlify/functions/ai-chat
interface ChatRequest {
  messages: ChatMessage[];
  model?: string;                   // Default: gemini-2.0-flash
  stream?: boolean;
  context?: 'business' | 'market';
}
```

### `/api/ai/research` - Deep Research

```typescript
// POST /.netlify/functions/ai-research
interface ResearchRequest {
  query: string;
  cellPath?: string;                // e.g., "assumptions.pricing.avg_unit_price"
  depth: 'quick' | 'standard' | 'deep';
  existingEvidence?: string[];      // Research doc IDs to build on
}

interface ResearchResponse {
  answer: string;
  sources: ResearchSource[];
  suggestedValue?: ValueSuggestion;
  researchDocId: string;            // Persisted research doc
}
```

### `/api/ai/analyze` - Strategic Analysis

```typescript
// POST /.netlify/functions/ai-analyze
interface AnalyzeRequest {
  type: 'explain' | 'validate' | 'compare' | 'strategize';
  businessData?: BusinessData;
  marketData?: MarketData;
  focusPaths?: string[];
}
```

### `/api/ai/interrogate` - Cell Interrogation

```typescript
// POST /.netlify/functions/ai-interrogate
interface InterrogateRequest {
  cellPath: string;                 // "volume.segment_volumes.retail.customers"
  question?: string;                // Optional, default: "Why this value?"
  businessData: BusinessData;
  existingResearch?: string[];
}

interface InterrogateResponse {
  explanation: string;              // Reasoning chain
  supportingEvidence: ResearchSource[];
  confidence: number;
  canDrillDeeper: boolean;
  drillDownPrompts?: string[];
}
```

## LiteLLM Configuration

### Model Routing

```yaml
# litellm_config.yaml
model_list:
  # Research - Fast, grounded web search
  - model_name: research/quick
    litellm_params:
      model: google/gemini-2.0-flash
      api_key: os.environ/GOOGLE_API_KEY
    model_info:
      max_tokens: 8192
      supports_grounding: true

  # Analysis - Complex reasoning
  - model_name: analysis/deep
    litellm_params:
      model: anthropic/claude-sonnet-4.5
      api_key: os.environ/ANTHROPIC_API_KEY
    model_info:
      max_tokens: 16384
      supports_extended_thinking: true

  # Fallback - Balanced
  - model_name: analysis/fallback
    litellm_params:
      model: azure/gpt-4o
      api_base: os.environ/AZURE_API_BASE
      api_key: os.environ/AZURE_API_KEY
    model_info:
      max_tokens: 8192

router_settings:
  routing_strategy: "usage-based-routing"
  enable_pre_call_checks: true
  fallbacks:
    - analysis/deep: [analysis/fallback]
```

### Cost Tracking

```yaml
litellm_settings:
  success_callback: ["langfuse"]    # Observability
  general_settings:
    cost_tracking: true
    max_budget: 50.0                # $50/month limit
    budget_duration: 1M
```

## Streaming Patterns

### Server-Sent Events (SSE)

```typescript
// API Route Handler
export async function handler(event) {
  const { messages, model } = JSON.parse(event.body);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    },
    body: streamResponse(messages, model)
  };
}

async function* streamResponse(messages, model) {
  const stream = await litellm.chat({
    model,
    messages,
    stream: true
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield `data: ${JSON.stringify({ content })}\n\n`;
    }
  }

  yield `data: [DONE]\n\n`;
}
```

### Client-Side Consumption

```typescript
async function streamChat(messages: ChatMessage[], onChunk: (content: string) => void) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, stream: true }),
    headers: { 'Content-Type': 'application/json' }
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') continue;

      const parsed = JSON.parse(data);
      if (parsed.content) {
        onChunk(parsed.content);
      }
    }
  }
}
```

## Cell-Level Interrogation Flow

```
User clicks cell → "Why this value?"
          │
          ▼
┌─────────────────────────────────────┐
│     INTERROGATION ORCHESTRATOR      │
│                                     │
│  1. Load cell context (path, value, │
│     existing rationale, evidence)   │
│                                     │
│  2. Check existing research docs    │
│     └─ If sufficient → Analysis     │
│     └─ If gaps → Research first     │
│                                     │
│  3. Route to appropriate agent      │
└─────────────────────────────────────┘
          │
          ├─────────────────────────────────┐
          ▼                                 ▼
┌─────────────────────┐       ┌─────────────────────┐
│   RESEARCH AGENT    │       │   ANALYSIS AGENT    │
│   (Gemini Flash)    │       │   (Sonnet 4.5)      │
│                     │       │                     │
│  • Web search       │       │  • Reasoning chain  │
│  • Source citations │       │  • Confidence score │
│  • Data extraction  │       │  • Related cells    │
└─────────────────────┘       └─────────────────────┘
          │                             │
          └──────────────┬──────────────┘
                         ▼
┌─────────────────────────────────────┐
│       EVIDENCE ACCUMULATOR          │
│                                     │
│  • Create/update ResearchDocument   │
│  • Link to cell                     │
│  • Update confidence scores         │
│  • Persist to storage               │
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│         RESPONSE TO USER            │
│                                     │
│  "This value of 15,000 physical     │
│   therapists in Finland is based    │
│   on:                               │
│   - [1] Finnish Health Registry...  │
│   - [2] Statista market report...   │
│                                     │
│   Confidence: 85%                   │
│   [Drill Deeper] [Accept] [Edit]"   │
└─────────────────────────────────────┘
```

## Prompt Engineering

### Research System Prompt

```markdown
You are a market research assistant for Bizcaseland, a business case analysis tool.

Your task: Find accurate, current market data to support business case assumptions.

Guidelines:
1. ALWAYS cite sources with URLs
2. Prefer recent data (2024-2025)
3. Prefer authoritative sources: Statista, Gartner, government statistics
4. When data is unavailable, clearly state this and provide best estimates
5. Include confidence level (high/medium/low)

Output format:
- **Value**: [specific number with unit]
- **Source**: [URL and publication date]
- **Confidence**: [high/medium/low]
- **Notes**: [any caveats or context]
```

### Analysis System Prompt

```markdown
You are a strategic business analyst for Bizcaseland.

Your task: Explain reasoning chains for business case values and validate assumptions.

When explaining a value:
1. Start with the direct calculation or source
2. Explain dependencies on other cells
3. Identify key assumptions
4. Assess confidence and risks
5. Suggest validation approaches

When validating:
1. Check for internal consistency
2. Compare to industry benchmarks
3. Identify unrealistic assumptions
4. Suggest alternative scenarios
```

## Cost Estimation

### Per-Request Costs (Estimated)

| Operation | Model | Input Tokens | Output Tokens | Cost/Request |
|-----------|-------|--------------|---------------|--------------|
| Quick Research | Flash 2.5 | 2,000 | 500 | $0.0003 |
| Deep Research | Flash 2.5 | 5,000 | 2,000 | $0.0009 |
| Cell Explanation | Sonnet 4.5 | 4,000 | 1,000 | $0.021 |
| Strategic Analysis | Sonnet 4.5 | 8,000 | 2,000 | $0.042 |
| General Chat | Flash 2.5 | 1,000 | 500 | $0.0002 |

### Monthly Budget Scenarios

| Usage Pattern | Requests/Day | Monthly Cost |
|---------------|--------------|--------------|
| Light (testing) | 50 | ~$15 |
| Moderate (active user) | 200 | ~$60 |
| Heavy (power user) | 500 | ~$150 |

### Cost Management Strategies

1. **Model tiering**: Use Flash for most requests, Sonnet only when needed
2. **Caching**: Cache research results for common queries
3. **Rate limiting**: Per-user daily limits
4. **Context pruning**: Sliding window for chat history (6 messages)
5. **Batch processing**: Group related research queries

## Security Considerations

1. **API Key Protection**: All keys stored in Netlify environment variables
2. **Rate Limiting**: Per-user limits via LiteLLM
3. **Input Validation**: Sanitize user prompts before sending to models
4. **Output Filtering**: Check for sensitive data leakage
5. **Guardrails**: LiteLLM guardrails for PII detection

## Open Questions

1. **Vercel AI SDK vs. Custom Implementation**: Should we use Vercel AI SDK for streaming helpers, or continue with custom SSE implementation?

2. **Research Document Persistence**: IndexedDB vs. Server-side storage for accumulated evidence?

3. **Agent Communication Protocol**: Should agents communicate directly or always through orchestrator?

4. **Offline Support**: Cache research results for offline business case editing?

## References

- [LiteLLM Documentation](https://docs.litellm.ai/docs/)
- [LiteLLM GitHub](https://github.com/BerriAI/litellm)
- [Gemini API Grounding](https://ai.google.dev/gemini-api/docs/google-search)
- [Firebase AI Logic Grounding](https://firebase.google.com/docs/ai-logic/grounding-google-search)
- [Google Cloud Grounding Docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-with-google-search)
