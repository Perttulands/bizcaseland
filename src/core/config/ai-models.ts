/**
 * AI Models Configuration
 * 
 * Centralized configuration for available AI models.
 * Edit this file to add/remove models or update pricing.
 * 
 * Pricing is in USD per million tokens.
 * Source: https://www.litellm.ai/pricing (check for latest rates)
 */

// ============================================================================
// Types
// ============================================================================

export interface AIModelConfig {
  /** LiteLLM model identifier (e.g., 'anthropic/claude-sonnet-4-5') */
  id: string;
  /** Display name for UI */
  name: string;
  /** Short description of model capabilities */
  description: string;
  /** Cost per million input tokens in USD */
  inputCostPerMillion: number;
  /** Cost per million output tokens in USD */
  outputCostPerMillion: number;
  /** Whether this model supports Google Search grounding */
  supportsGrounding?: boolean;
  /** Maximum context window size in tokens */
  maxContextTokens?: number;
  /** Maximum output tokens */
  maxOutputTokens?: number;
}

// ============================================================================
// Model Definitions
// ============================================================================

/**
 * Available AI models for the application.
 * 
 * To add a new model:
 * 1. Add entry to this array with LiteLLM model ID
 * 2. Include current pricing from LiteLLM or provider docs
 * 3. Set supportsGrounding: true if it's a Gemini model
 */
export const AI_MODELS: readonly AIModelConfig[] = [
  {
    id: 'anthropic/claude-sonnet-4-5-20250514',
    name: 'Claude Sonnet 4.5',
    description: 'Best quality reasoning (Recommended)',
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    supportsGrounding: false,
    maxContextTokens: 200000,
    maxOutputTokens: 8192,
  },
  {
    id: 'google/gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Fast with web search grounding',
    inputCostPerMillion: 0.10,
    outputCostPerMillion: 0.40,
    supportsGrounding: true,
    maxContextTokens: 1000000,
    maxOutputTokens: 8192,
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Latest Gemini, very fast',
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
    supportsGrounding: true,
    maxContextTokens: 1000000,
    maxOutputTokens: 8192,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Cost-effective OpenAI model',
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
    supportsGrounding: false,
    maxContextTokens: 128000,
    maxOutputTokens: 16384,
  },
] as const;

// ============================================================================
// Default Model
// ============================================================================

/**
 * Default model ID used when no model is explicitly selected.
 * Should match an ID in AI_MODELS array.
 */
export const DEFAULT_MODEL_ID = 'anthropic/claude-sonnet-4-5-20250514';

/**
 * Model to use for research queries (requires grounding support)
 */
export const RESEARCH_MODEL_ID = 'google/gemini-2.0-flash';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get model config by ID
 */
export function getModelById(modelId: string): AIModelConfig | undefined {
  return AI_MODELS.find((m) => m.id === modelId);
}

/**
 * Get the default model config
 */
export function getDefaultModel(): AIModelConfig {
  const model = getModelById(DEFAULT_MODEL_ID);
  if (!model) {
    throw new Error(`Default model ${DEFAULT_MODEL_ID} not found in AI_MODELS`);
  }
  return model;
}

/**
 * Get the research model config (with grounding)
 */
export function getResearchModel(): AIModelConfig {
  const model = getModelById(RESEARCH_MODEL_ID);
  if (!model) {
    throw new Error(`Research model ${RESEARCH_MODEL_ID} not found in AI_MODELS`);
  }
  return model;
}

/**
 * Get models that support grounding (for research features)
 */
export function getGroundingModels(): AIModelConfig[] {
  return AI_MODELS.filter((m) => m.supportsGrounding);
}

/**
 * Calculate estimated cost for a request
 * @param modelId - The model used
 * @param promptTokens - Number of input tokens
 * @param completionTokens - Number of output tokens
 * @returns Cost in USD
 */
export function calculateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number {
  const model = getModelById(modelId);
  if (!model) {
    console.warn(`Unknown model ${modelId}, cannot calculate cost`);
    return 0;
  }

  const inputCost = (promptTokens / 1_000_000) * model.inputCostPerMillion;
  const outputCost = (completionTokens / 1_000_000) * model.outputCostPerMillion;

  return inputCost + outputCost;
}

/**
 * Format cost as USD string
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

export default AI_MODELS;
