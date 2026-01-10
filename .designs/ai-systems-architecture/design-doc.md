# Design: AI Systems - LiteLLM Integration & Agent Orchestration

> Generated: 2026-01-06
> Status: Ready for Review
> Bead: bi-bvp

## Executive Summary

Design the AI integration architecture for Bizcaseland 2.0 - a business case agent tool with AI-powered market research. The system uses LiteLLM as a unified gateway, Sonnet 4.5 for complex reasoning, and Gemini Flash 2.5 for web search with grounding.

**Key Design Decisions:**
- **Agent Architecture**: Three specialized agents (Research, Analysis, Calculation) with orchestrator
- **Model Routing**: LiteLLM gateway with smart model selection based on task complexity
- **Cell Interrogation**: Every cell can be interrogated for reasoning chain
- **Cumulative Evidence**: Research sessions add to supporting evidence over time
- **Cost Management**: Tiered model selection, aggressive caching, token budgets

## Problem Statement

Current challenges:
1. **Single Model Approach**: Using one model for all tasks is inefficient
2. **No Agent Specialization**: Complex research requires multi-step orchestration
3. **Limited Evidence Trail**: AI suggestions lack deep research backing
4. **No Web Search Integration**: Cannot ground claims in real-world data
5. **Cost Uncertainty**: No clear model for predicting/managing AI costs

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Bizcaseland Frontend                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐ │
│   │  Business    │  │   Market     │  │    AI Chat Sidebar           │ │
│   │  Case View   │  │   Analysis   │  │  ┌────────────────────────┐  │ │
│   │              │  │   View       │  │  │ Agent Orchestrator     │  │ │
│   │  [Cell] ←────┼──┼──────────────┼──┼──│  ├─ Research Agent     │  │ │
│   │  [Cell] ←────┼──┼──────────────┼──┼──│  ├─ Analysis Agent     │  │ │
│   │  [Cell] ←────┼──┼──────────────┼──┼──│  └─ Calculation Agent  │  │ │
│   │              │  │              │  │  └────────────────────────┘  │ │
│   └──────────────┘  └──────────────┘  └──────────────────────────────┘ │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                            Netlify Functions                            │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│   │  /api/ai         │  │ /api/web-search  │  │ /api/research        │ │
│   │  Chat completion │  │ Brave Search     │  │ Deep research        │ │
│   │  with streaming  │  │ with grounding   │  │ multi-step           │ │
│   └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────────┘ │
│            │                     │                     │               │
├────────────┴─────────────────────┴─────────────────────┴───────────────┤
│                            LiteLLM Gateway                              │
│   ┌──────────────────────────────────────────────────────────────────┐ │
│   │  Model Router                                                     │ │
│   │  ├─ Sonnet 4.5 (complex reasoning, business analysis)            │ │
│   │  ├─ Gemini 2.0 Flash (fast queries, web search)                  │ │
│   │  ├─ GPT-4o-mini (balanced, general tasks)                        │ │
│   │  └─ Fallback chain for reliability                               │ │
│   └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## Agent Architecture

### 1. Agent Orchestrator

The orchestrator manages agent coordination and task routing:

```typescript
interface AgentOrchestrator {
  // Route task to appropriate agent(s)
  route(task: Task): AgentPipeline;

  // Execute task pipeline with state management
  execute(pipeline: AgentPipeline, context: TaskContext): Promise<TaskResult>;

  // Cell interrogation entry point
  interrogate(cellPath: string, question?: string): Promise<ExplanationResult>;
}

interface Task {
  type: 'research' | 'analysis' | 'calculation' | 'interrogation';
  query: string;
  cellPath?: string;           // For cell-specific tasks
  context: BusinessCaseData;   // Current state
  constraints?: TaskConstraints;
}

interface TaskConstraints {
  maxSteps?: number;           // Limit research depth
  maxTokens?: number;          // Budget per task
  requireSources?: boolean;    // Must have citations
  confidenceThreshold?: number; // Minimum confidence
}
```

### 2. Research Agent

Specialized for web search and evidence gathering:

```
┌─────────────────────────────────────────────────────────────────┐
│                     RESEARCH AGENT                              │
│                                                                 │
│  Input: Research Query + Context                                │
│    │                                                            │
│    ▼                                                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Step 1: Query Decomposition (Gemini Flash)                  ││
│  │ Break complex query into searchable sub-queries             ││
│  │ "Market size for PT clinics in Finland" →                   ││
│  │   • "number of physical therapy clinics Finland 2024"       ││
│  │   • "physical therapy market size Nordic countries"         ││
│  │   • "healthcare market Finland statistics"                  ││
│  └─────────────────────────────────────────────────────────────┘│
│    │                                                            │
│    ▼                                                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Step 2: Parallel Web Search (Brave Search API)              ││
│  │ Execute searches, prioritize trusted domains                ││
│  │ Return: SearchResult[] with trust scores                    ││
│  └─────────────────────────────────────────────────────────────┘│
│    │                                                            │
│    ▼                                                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Step 3: Source Synthesis (Sonnet 4.5)                       ││
│  │ Analyze results, extract facts, assess confidence           ││
│  │ Return: ResearchDocument with citations                     ││
│  └─────────────────────────────────────────────────────────────┘│
│    │                                                            │
│    ▼                                                            │
│  Output: ResearchDocument {                                     │
│    sources: ResearchSource[],                                   │
│    rationale: string,                                           │
│    confidence: 0-1,                                             │
│    facts: ExtractedFact[],                                      │
│    suggestedValue?: ValueSuggestion                             │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
interface ResearchAgent {
  // Execute research task
  research(query: string, options: ResearchOptions): Promise<ResearchResult>;

  // Deep dive on specific topic
  deepDive(topic: string, existingResearch: ResearchDocument[]): Promise<ResearchResult>;

  // Validate existing claim with fresh research
  validate(claim: string, existingEvidence: ResearchSource[]): Promise<ValidationResult>;
}

interface ResearchOptions {
  depth: 'quick' | 'moderate' | 'deep';  // Controls iterations
  maxSources?: number;
  freshness?: 'any' | 'year' | 'month' | 'week';
  domainFilter?: string[];               // Limit to specific domains
}
```

### 3. Analysis Agent

Specialized for business analysis and reasoning:

```
┌─────────────────────────────────────────────────────────────────┐
│                     ANALYSIS AGENT                              │
│                                                                 │
│  Input: Analysis Task + Business Context + Research             │
│    │                                                            │
│    ▼                                                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Step 1: Context Synthesis (Sonnet 4.5)                      ││
│  │ Understand current business case state, identify gaps       ││
│  └─────────────────────────────────────────────────────────────┘│
│    │                                                            │
│    ▼                                                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Step 2: Analysis Execution (Sonnet 4.5)                     ││
│  │ Apply business frameworks (TAM/SAM/SOM, Porter's, etc.)     ││
│  │ Generate insights with confidence scores                    ││
│  └─────────────────────────────────────────────────────────────┘│
│    │                                                            │
│    ▼                                                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Step 3: Suggestion Generation                               ││
│  │ Create structured suggestions for data updates              ││
│  │ Each suggestion links to supporting research                ││
│  └─────────────────────────────────────────────────────────────┘│
│    │                                                            │
│    ▼                                                            │
│  Output: AnalysisResult {                                       │
│    suggestions: AISuggestion[],                                 │
│    insights: BusinessInsight[],                                 │
│    gaps: DataGap[],                                             │
│    confidence: 0-1                                              │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
interface AnalysisAgent {
  // Analyze business case and suggest improvements
  analyze(context: BusinessCaseData, focus?: AnalysisFocus): Promise<AnalysisResult>;

  // Answer "why" questions about values
  explain(cellPath: string, context: BusinessCaseData): Promise<ExplanationResult>;

  // Suggest improvements for specific section
  suggest(section: SectionType, context: BusinessCaseData): Promise<AISuggestion[]>;
}

type AnalysisFocus =
  | 'market_sizing'
  | 'competitive'
  | 'customer'
  | 'revenue'
  | 'costs'
  | 'cash_flow';
```

### 4. Calculation Agent

Specialized for financial calculations and projections:

```typescript
interface CalculationAgent {
  // Calculate derived values from assumptions
  calculate(inputs: CalculationInputs): Promise<CalculationResult>;

  // Project values over time (cash flow)
  project(
    baseValue: number,
    projectionModel: ProjectionModel,
    periods: number
  ): Promise<ProjectionResult>;

  // Sensitivity analysis
  sensitivity(
    baseCase: BusinessCaseData,
    variable: string,
    range: [number, number]
  ): Promise<SensitivityResult>;
}

interface ProjectionModel {
  type: 'linear' | 'exponential' | 's_curve' | 'custom';
  parameters: Record<string, number>;
  seasonality?: SeasonalityConfig;
}
```

## API Route Structure

### Current Endpoints (Keep)

```
POST /api/ai              - Chat completion (streaming/non-streaming)
POST /api/web-search      - Brave Search with trusted domains
```

### New Endpoints (Add)

```
POST /api/research
  - Deep research with multi-step web search
  - Request: { query, depth, context? }
  - Response: ResearchDocument (streaming progress updates)

POST /api/interrogate
  - Cell interrogation ("why this value?")
  - Request: { cellPath, question?, context }
  - Response: { explanation, researchRefs, confidence }

POST /api/suggest
  - Get AI suggestions for a section
  - Request: { section, context }
  - Response: AISuggestion[]

POST /api/calculate
  - Financial calculations
  - Request: { type, inputs }
  - Response: CalculationResult
```

### API Response Streaming Pattern

For long-running operations (research, analysis), use Server-Sent Events:

```typescript
// Client
const eventSource = new EventSource('/api/research?' + params);
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch (data.type) {
    case 'progress':
      // Update UI with progress (e.g., "Searching...")
      break;
    case 'source_found':
      // Add source to list as discovered
      break;
    case 'complete':
      // Final result
      break;
    case 'error':
      // Handle error
      break;
  }
};

// Server (Netlify Function)
const stream = new ReadableStream({
  async start(controller) {
    // Send progress events
    controller.enqueue(`data: ${JSON.stringify({type: 'progress', step: 1})}\n\n`);

    // Do research...

    controller.enqueue(`data: ${JSON.stringify({type: 'complete', result})}\n\n`);
    controller.close();
  }
});

return new Response(stream, {
  headers: { 'Content-Type': 'text/event-stream' }
});
```

## LiteLLM Configuration

### Model Routing Strategy

```typescript
// Model selection based on task type
const MODEL_ROUTING: Record<TaskType, ModelConfig> = {
  // Quick queries, search decomposition
  search_decomposition: {
    primary: 'google/gemini-2.0-flash',
    fallback: 'azure/gpt-4o-mini',
    maxTokens: 1024,
    temperature: 0.3,
  },

  // Complex reasoning, analysis
  business_analysis: {
    primary: 'anthropic/claude-sonnet-4-5',
    fallback: 'azure/gpt-4o',
    maxTokens: 4096,
    temperature: 0.7,
  },

  // Source synthesis, citation
  synthesis: {
    primary: 'anthropic/claude-sonnet-4-5',
    fallback: 'google/gemini-1.5-pro',
    maxTokens: 2048,
    temperature: 0.5,
  },

  // General chat
  chat: {
    primary: 'google/gemini-2.0-flash',
    fallback: 'azure/gpt-4o-mini',
    maxTokens: 2048,
    temperature: 0.7,
  },

  // Calculations (can use smaller model)
  calculation: {
    primary: 'google/gemini-2.0-flash',
    fallback: 'azure/gpt-4o-mini',
    maxTokens: 1024,
    temperature: 0.1,  // Low temperature for precision
  },
};
```

### LiteLLM Gateway Configuration

```yaml
# litellm_config.yaml
model_list:
  - model_name: anthropic/claude-sonnet-4-5
    litellm_params:
      model: claude-sonnet-4-5-20250514
      api_key: os.environ/ANTHROPIC_API_KEY
    model_info:
      input_cost_per_token: 0.000003
      output_cost_per_token: 0.000015

  - model_name: google/gemini-2.0-flash
    litellm_params:
      model: gemini-2.0-flash
      api_key: os.environ/GOOGLE_API_KEY
    model_info:
      input_cost_per_token: 0.0000001
      output_cost_per_token: 0.0000004

  - model_name: azure/gpt-4o-mini
    litellm_params:
      model: azure/gpt-4o-mini
      api_key: os.environ/AZURE_API_KEY
      api_base: os.environ/AZURE_API_BASE

router_settings:
  routing_strategy: simple-shuffle  # Or latency-based
  num_retries: 2
  fallbacks:
    - anthropic/claude-sonnet-4-5: [azure/gpt-4o, google/gemini-1.5-pro]
    - google/gemini-2.0-flash: [azure/gpt-4o-mini]
```

## Prompt Templates

### Cell Interrogation Prompt

```typescript
const CELL_INTERROGATION_PROMPT = `You are analyzing a business case cell value.

Cell Path: {{cellPath}}
Current Value: {{currentValue}}
Question: {{question || "Why is this value what it is?"}}

Business Case Context:
{{businessCaseContext}}

Research Documents linked to this cell:
{{researchDocuments}}

Explain this value by:
1. Walking through the reasoning chain that led to this value
2. Citing specific sources that support it
3. Identifying any assumptions made
4. Providing a confidence assessment (0-1)

If the value seems questionable, suggest alternatives with rationale.

Format your response as:
## Reasoning Chain
[Step-by-step explanation]

## Supporting Evidence
[Bullet points with sources]

## Assumptions
[List of assumptions]

## Confidence: [0-1]
[Brief confidence rationale]

## Alternative Values (if applicable)
[Suggestions if current value seems off]`;
```

### Research Query Decomposition Prompt

```typescript
const RESEARCH_DECOMPOSITION_PROMPT = `You are a market research assistant.

Research Query: {{query}}
Business Context: {{context}}

Break this query into 3-5 specific, searchable sub-queries that will help gather comprehensive information. Each sub-query should:
1. Be specific enough to return relevant results
2. Target different aspects of the main query
3. Be phrased as a search query (not a question)

Return as JSON:
{
  "subQueries": [
    {
      "query": "search query text",
      "purpose": "what aspect this covers",
      "priority": 1-5
    }
  ]
}`;
```

### Business Analysis Prompt

```typescript
const BUSINESS_ANALYSIS_PROMPT = `You are a senior business analyst reviewing a business case.

Business Case Data:
{{businessCaseData}}

Research Documents Available:
{{researchDocuments}}

Task: {{analysisTask}}

Provide structured suggestions for improving this business case. For each suggestion:
1. Identify the specific field to update (JSON path)
2. Provide the suggested value
3. Explain the rationale with references to research
4. Assign a confidence score (0-1)

Format suggestions as:
{
  "suggestions": [
    {
      "path": "market_sizing.tam.base_value",
      "currentValue": 1000000,
      "suggestedValue": 1500000,
      "rationale": "Based on [source], the market is larger than currently estimated...",
      "confidence": 0.85,
      "researchRefs": ["research-abc123"]
    }
  ]
}`;
```

## Cell Interrogation Flow

The "Cell Interrogation" feature is core to the UX:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CELL INTERROGATION FLOW                             │
│                                                                         │
│  User clicks cell (e.g., Revenue in Month 14: $45,000)                 │
│    │                                                                    │
│    ▼                                                                    │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Cell Info Panel Opens                                             │ │
│  │ ┌─────────────────────────────────────────────────────────────┐   │ │
│  │ │ Revenue - Month 14                              $45,000     │   │ │
│  │ │                                                             │   │ │
│  │ │ [Why this value?]  [Research deeper]  [Edit manually]      │   │ │
│  │ │                                                             │   │ │
│  │ │ Quick info:                                                 │   │ │
│  │ │ • Calculated from: 150 customers × $300/mo                  │   │ │
│  │ │ • Confidence: 78%                                           │   │ │
│  │ │ • Last researched: 2 days ago                               │   │ │
│  │ └─────────────────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│    │                                                                    │
│    │ User clicks "Why this value?"                                     │
│    ▼                                                                    │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ AI Explanation (Sonnet 4.5)                                       │ │
│  │                                                                   │ │
│  │ ## Reasoning Chain                                                │ │
│  │ 1. Customer count grows from 100 → 150 by month 14               │ │
│  │ 2. Growth rate: 3% monthly (based on Finnish SaaS benchmarks)    │ │
│  │ 3. ARPU: $300/mo (validated against competitor pricing)          │ │
│  │                                                                   │ │
│  │ ## Supporting Evidence                                            │ │
│  │ • [Statista: Nordic SaaS market] - 3.2% avg growth               │ │
│  │ • [Competitor Analysis] - $250-350 pricing range                 │ │
│  │                                                                   │ │
│  │ ## Confidence: 78%                                                │ │
│  │ Strong on pricing, moderate on growth rate                       │ │
│  │                                                                   │ │
│  │ [Ask follow-up]  [Research deeper on growth rate]                │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│    │                                                                    │
│    │ User clicks "Research deeper on growth rate"                      │
│    ▼                                                                    │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Deep Research (Research Agent)                                    │ │
│  │                                                                   │ │
│  │ 🔍 Searching: "SaaS customer growth rate Finland 2024"...        │ │
│  │ 🔍 Searching: "physical therapy SaaS market growth Nordic"...    │ │
│  │ 📚 Found 8 sources (5 trusted)                                   │ │
│  │ 🧠 Synthesizing...                                                │ │
│  │                                                                   │ │
│  │ New evidence suggests 2.5-4% monthly growth for niche B2B SaaS   │ │
│  │ Recommend updating to 2.8% (conservative) or keeping 3% (opt.)   │ │
│  │                                                                   │ │
│  │ [Accept 2.8%]  [Keep 3%]  [Enter custom value]                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## Cost Management

### Cost Estimation Model

```typescript
interface CostEstimate {
  models: {
    [modelId: string]: {
      inputTokens: number;
      outputTokens: number;
      calls: number;
      estimatedCost: number;
    };
  };
  total: number;
  confidence: 'low' | 'medium' | 'high';
}

// Estimated costs per operation
const OPERATION_COSTS: Record<string, CostEstimate> = {
  quick_chat: {
    models: {
      'google/gemini-2.0-flash': {
        inputTokens: 1000,
        outputTokens: 500,
        calls: 1,
        estimatedCost: 0.0003,
      },
    },
    total: 0.0003,
    confidence: 'high',
  },

  research_deep: {
    models: {
      'google/gemini-2.0-flash': {
        inputTokens: 2000,
        outputTokens: 1000,
        calls: 3,  // Query decomposition + multiple searches
        estimatedCost: 0.001,
      },
      'anthropic/claude-sonnet-4-5': {
        inputTokens: 5000,
        outputTokens: 2000,
        calls: 1,  // Synthesis
        estimatedCost: 0.045,
      },
    },
    total: 0.046,
    confidence: 'medium',
  },

  full_analysis: {
    models: {
      'anthropic/claude-sonnet-4-5': {
        inputTokens: 10000,
        outputTokens: 4000,
        calls: 1,
        estimatedCost: 0.09,
      },
    },
    total: 0.09,
    confidence: 'medium',
  },
};
```

### Budget Management

```typescript
interface BudgetConfig {
  dailyLimit: number;      // e.g., $2/day
  weeklyLimit: number;     // e.g., $10/week
  perSessionLimit: number; // e.g., $1/session
  warningThreshold: 0.8;   // Warn at 80%
}

interface UsageTracker {
  // Track usage
  trackUsage(operation: string, cost: number): void;

  // Check if operation is within budget
  canProceed(estimatedCost: number): boolean;

  // Get current usage stats
  getUsage(): UsageStats;
}
```

### Cost Optimization Strategies

1. **Smart Model Selection**: Use Gemini Flash for simple queries, reserve Sonnet for complex analysis
2. **Aggressive Caching**: Cache research results, reuse for similar queries
3. **Token Budgets**: Set max_tokens per operation type
4. **Batch Operations**: Combine related queries into single API calls
5. **Progressive Disclosure**: Start with quick estimates, only deep dive on request

## Implementation Plan

### Phase 1: Agent Foundation
- [ ] Create `src/core/agents/types.ts` - Agent type definitions
- [ ] Create `src/core/agents/orchestrator.ts` - Task routing and coordination
- [ ] Create `src/core/agents/research-agent.ts` - Web research agent
- [ ] Update `ai-service.ts` with model routing

### Phase 2: API Enhancements
- [ ] Create `netlify/functions/research.ts` - Deep research endpoint
- [ ] Create `netlify/functions/interrogate.ts` - Cell interrogation endpoint
- [ ] Add streaming progress events to long-running operations
- [ ] Implement response caching layer

### Phase 3: Analysis Agent
- [ ] Create `src/core/agents/analysis-agent.ts` - Business analysis
- [ ] Create `src/core/agents/calculation-agent.ts` - Financial calculations
- [ ] Integrate with existing suggestion system
- [ ] Add confidence scoring

### Phase 4: Cell Interrogation UI
- [ ] Create `CellInfoPanel` component
- [ ] Implement "Why this value?" flow
- [ ] Add "Research deeper" workflow
- [ ] Connect to ResearchDocument system

### Phase 5: Cost Management
- [ ] Implement `UsageTracker` service
- [ ] Add cost display in UI footer
- [ ] Implement budget warnings
- [ ] Add usage analytics

## Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| LiteLLM gateway downtime | HIGH | Implement direct API fallbacks |
| Cost overruns | HIGH | Hard budget limits, usage tracking |
| Slow research responses | MEDIUM | Progressive loading, caching |
| Hallucinated sources | MEDIUM | Source verification step |
| Context window limits | MEDIUM | Smart context pruning |

## Appendix: Model Cost Reference

| Model | Input $/1M tokens | Output $/1M tokens | Best For |
|-------|-------------------|--------------------|-----------|
| Gemini 2.0 Flash | $0.10 | $0.40 | Quick queries, search |
| GPT-4o-mini | $0.15 | $0.60 | Balanced general use |
| Claude Sonnet 4.5 | $3.00 | $15.00 | Complex reasoning |
| GPT-4o | $5.00 | $15.00 | Fallback for Sonnet |

Budget: $10/week allows approximately:
- 30,000 quick chats (Gemini Flash)
- 220 deep research operations
- 110 full business analyses
