/**
 * Research Service
 * 
 * Provides AI-powered research with Google Search grounding via Gemini models.
 * Uses LiteLLM gateway for model access.
 */

import { RESEARCH_MODEL_ID, getResearchModel } from '@/core/config/ai-models';
import { chatHistoryService } from './chat-history-service';

// ============================================================================
// Types
// ============================================================================

export interface ResearchSource {
  url: string;
  title: string;
  snippet?: string;
}

export interface ResearchResponse {
  answer: string;
  sources: ResearchSource[];
  confidence: number;
  suggestedValue?: {
    value: number | string;
    unit: string;
    rationale: string;
  };
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface ResearchRequest {
  query: string;
  context?: string;
  depth?: 'quick' | 'standard' | 'deep';
}

// ============================================================================
// Constants
// ============================================================================

const API_KEY_STORAGE_KEY = 'litellm-api-key';
const LITELLM_ENDPOINT = 'https://app-litellmsn66ka.azurewebsites.net';
const REQUEST_TIMEOUT_MS = 60000;

// System prompt for research queries
const RESEARCH_SYSTEM_PROMPT = `You are a research assistant for business case analysis.
Your task is to find accurate, up-to-date information to support business decisions.

When responding:
1. Provide specific, quantitative data when available (market sizes, growth rates, statistics)
2. Cite your sources clearly
3. Indicate your confidence level (low/medium/high)
4. If you find a specific value that could be used in a business case, format it as:
   SUGGESTED_VALUE: {"value": <number>, "unit": "<unit>", "rationale": "<why this value>"}

Be concise but thorough. Focus on facts, not opinions.`;

// ============================================================================
// Service Implementation
// ============================================================================

class ResearchService {
  private apiKey: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    }
  }

  /**
   * Check if the service is available (API key configured)
   */
  isAvailable(): boolean {
    if (typeof window !== 'undefined') {
      this.apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    }
    return !!this.apiKey;
  }

  /**
   * Check if grounding is supported
   */
  supportsGrounding(): boolean {
    const model = getResearchModel();
    return model.supportsGrounding ?? false;
  }

  /**
   * Perform a research query with Google Search grounding
   */
  async research(request: ResearchRequest): Promise<ResearchResponse> {
    if (!this.apiKey) {
      throw new Error('API key not configured. Please add your LiteLLM API key in settings.');
    }

    const startTime = Date.now();
    const model = getResearchModel();

    // Build messages
    const messages = [
      { role: 'system', content: RESEARCH_SYSTEM_PROMPT },
      {
        role: 'user',
        content: request.context
          ? `Context: ${request.context}\n\nResearch query: ${request.query}`
          : request.query,
      },
    ];

    // Determine max tokens based on depth
    const maxTokens = request.depth === 'deep' ? 4096 : request.depth === 'standard' ? 2048 : 1024;

    try {
      const response = await fetch(`${LITELLM_ENDPOINT}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: RESEARCH_MODEL_ID,
          messages,
          max_tokens: maxTokens,
          temperature: 0.3, // Lower temperature for factual research
          // Enable Google Search grounding for Gemini models
          tools: model.supportsGrounding
            ? [
                {
                  type: 'google_search',
                  google_search: {},
                },
              ]
            : undefined,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMsg = errorData.error?.message || errorData.error || `API error: ${response.status}`;
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const durationMs = Date.now() - startTime;

      // Extract content
      const content = data.choices?.[0]?.message?.content || '';

      // Extract token usage
      const tokenUsage = {
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
        total: data.usage?.total_tokens || 0,
      };

      // Extract grounding metadata (sources)
      const sources = this.extractSources(data);

      // Extract suggested value if present
      const suggestedValue = this.extractSuggestedValue(content);

      // Estimate confidence based on sources and content
      const confidence = this.estimateConfidence(content, sources);

      // Log to chat history
      chatHistoryService.logEntry({
        modelId: RESEARCH_MODEL_ID,
        systemPrompt: RESEARCH_SYSTEM_PROMPT,
        userMessage: request.query,
        messages,
        response: content,
        tokens: tokenUsage,
        durationMs,
        success: true,
        contextType: 'research',
      });

      return {
        answer: content,
        sources,
        confidence,
        suggestedValue,
        tokenUsage,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Log failed request
      chatHistoryService.logEntry({
        modelId: RESEARCH_MODEL_ID,
        systemPrompt: RESEARCH_SYSTEM_PROMPT,
        userMessage: request.query,
        messages,
        response: '',
        tokens: { prompt: 0, completion: 0, total: 0 },
        durationMs,
        success: false,
        error: errorMessage,
        contextType: 'research',
      });

      throw error;
    }
  }

  /**
   * Extract sources from grounding metadata
   */
  private extractSources(data: Record<string, unknown>): ResearchSource[] {
    const sources: ResearchSource[] = [];

    // Try to extract from groundingMetadata (Gemini format)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groundingMetadata = (data as any).groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web) {
          sources.push({
            url: chunk.web.uri || chunk.web.url || '',
            title: chunk.web.title || 'Web Source',
            snippet: chunk.retrievedContext?.text,
          });
        }
      }
    }

    // Also check for web search results in tool calls
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolCalls = (data as any).choices?.[0]?.message?.tool_calls;
    if (toolCalls) {
      for (const tool of toolCalls) {
        if (tool.type === 'function' && tool.function?.name === 'google_search') {
          try {
            const results = JSON.parse(tool.function.arguments);
            if (Array.isArray(results)) {
              for (const result of results) {
                if (result.url) {
                  sources.push({
                    url: result.url,
                    title: result.title || 'Search Result',
                    snippet: result.snippet,
                  });
                }
              }
            }
          } catch {
            // Ignore parsing errors
          }
        }
      }
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    return sources.filter((s) => {
      if (seen.has(s.url)) return false;
      seen.add(s.url);
      return true;
    });
  }

  /**
   * Extract suggested value from response content
   */
  private extractSuggestedValue(
    content: string
  ): { value: number | string; unit: string; rationale: string } | undefined {
    const match = content.match(/SUGGESTED_VALUE:\s*(\{[^}]+\})/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.value !== undefined && parsed.unit && parsed.rationale) {
          return {
            value: parsed.value,
            unit: parsed.unit,
            rationale: parsed.rationale,
          };
        }
      } catch {
        // Ignore parsing errors
      }
    }
    return undefined;
  }

  /**
   * Estimate confidence based on response quality
   */
  private estimateConfidence(content: string, sources: ResearchSource[]): number {
    let confidence = 0.5; // Base confidence

    // More sources = higher confidence
    if (sources.length >= 3) confidence += 0.2;
    else if (sources.length >= 1) confidence += 0.1;

    // Specific numbers mentioned = higher confidence
    const hasNumbers = /\d+(?:,\d{3})*(?:\.\d+)?/.test(content);
    if (hasNumbers) confidence += 0.1;

    // Confidence indicators in text
    if (/\b(confirmed|verified|according to official|government data)\b/i.test(content)) {
      confidence += 0.1;
    }
    if (/\b(uncertain|unclear|estimated|approximately|roughly)\b/i.test(content)) {
      confidence -= 0.1;
    }

    // Clamp to 0-1 range
    return Math.max(0.1, Math.min(0.95, confidence));
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const researchService = new ResearchService();
export default researchService;
