/**
 * Debate Prompts Service - Builds AI prompts for bull/bear case analysis
 * Used by the Assumption Debate Mode feature
 */

// ============================================================================
// Types
// ============================================================================

export interface DebateContext {
  assumptionLabel: string;
  currentValue: number | string;
  unit: string;
  rationale: string;
  category: string;
  relatedData?: Record<string, unknown>;
}

export interface DebateCase {
  position: 'bull' | 'bear';
  arguments: string[];
  suggestedValue?: number | string;
  confidence: 'low' | 'medium' | 'high';
  sources?: string[];
}

export interface DebateResult {
  assumption: DebateContext;
  bullCase: DebateCase;
  bearCase: DebateCase;
  timestamp: string;
  userDecision?: {
    selectedPosition: 'bull' | 'bear' | 'original' | 'custom';
    newValue?: number | string;
    reasoning: string;
  };
}

// ============================================================================
// Prompt Building Functions
// ============================================================================

/**
 * Build a system prompt for the debate analysis
 */
export function buildDebateSystemPrompt(context: DebateContext): string {
  return `You are a business analyst providing balanced analysis of assumptions.
Your role is to present BOTH bullish (optimistic) and bearish (pessimistic) perspectives on a given assumption.

For each perspective, you should:
1. Present 2-3 strong arguments with data or reasoning
2. Suggest a value adjustment if the perspective is more accurate
3. Rate your confidence in each argument (low/medium/high)
4. Cite sources or reasoning where possible

Be objective and analytical. The goal is to help the user make a more informed decision, not to push them toward any particular conclusion.

Current assumption being analyzed:
- Label: ${context.assumptionLabel}
- Current Value: ${context.currentValue} ${context.unit}
- Category: ${context.category}
- Current Rationale: ${context.rationale}`;
}

/**
 * Build the user prompt for bull/bear analysis
 */
export function buildDebateUserPrompt(context: DebateContext): string {
  return `Analyze this assumption and present BOTH bull (optimistic) and bear (pessimistic) cases:

**Assumption:** ${context.assumptionLabel}
**Current Value:** ${context.currentValue} ${context.unit}
**Rationale:** ${context.rationale}

Please respond in the following JSON format:
\`\`\`json
{
  "bullCase": {
    "arguments": ["argument 1", "argument 2", "argument 3"],
    "suggestedValue": <number or null>,
    "confidence": "low|medium|high",
    "sources": ["source 1", "source 2"]
  },
  "bearCase": {
    "arguments": ["argument 1", "argument 2", "argument 3"],
    "suggestedValue": <number or null>,
    "confidence": "low|medium|high",
    "sources": ["source 1", "source 2"]
  }
}
\`\`\`

Consider:
- Market conditions and trends
- Industry benchmarks
- Historical data patterns
- Risk factors
- Growth potential`;
}

/**
 * Build a prompt to get a specific position's analysis
 */
export function buildSinglePositionPrompt(
  context: DebateContext,
  position: 'bull' | 'bear'
): string {
  const positionLabel = position === 'bull' ? 'BULLISH (Optimistic)' : 'BEARISH (Pessimistic)';
  const focus = position === 'bull'
    ? 'growth potential, market opportunities, positive trends'
    : 'risks, challenges, market headwinds, conservative estimates';

  return `Provide a ${positionLabel} analysis for this assumption:

**Assumption:** ${context.assumptionLabel}
**Current Value:** ${context.currentValue} ${context.unit}
**Rationale:** ${context.rationale}

Focus on: ${focus}

Provide:
1. 3 strong arguments supporting this perspective
2. A suggested adjusted value (if different from current)
3. Your confidence level (low/medium/high)
4. Supporting data sources or reasoning

Format your response as markdown with clear sections.`;
}

// ============================================================================
// Response Parsing
// ============================================================================

/**
 * Parse AI response to extract bull/bear cases
 */
export function parseDebateResponse(response: string): { bullCase: DebateCase; bearCase: DebateCase } | null {
  try {
    // Try to find JSON in the response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      return {
        bullCase: {
          position: 'bull',
          arguments: parsed.bullCase?.arguments || [],
          suggestedValue: parsed.bullCase?.suggestedValue,
          confidence: parsed.bullCase?.confidence || 'medium',
          sources: parsed.bullCase?.sources || [],
        },
        bearCase: {
          position: 'bear',
          arguments: parsed.bearCase?.arguments || [],
          suggestedValue: parsed.bearCase?.suggestedValue,
          confidence: parsed.bearCase?.confidence || 'medium',
          sources: parsed.bearCase?.sources || [],
        },
      };
    }

    // If no JSON found, try to parse as plain JSON
    const parsed = JSON.parse(response);
    return {
      bullCase: {
        position: 'bull',
        arguments: parsed.bullCase?.arguments || [],
        suggestedValue: parsed.bullCase?.suggestedValue,
        confidence: parsed.bullCase?.confidence || 'medium',
        sources: parsed.bullCase?.sources || [],
      },
      bearCase: {
        position: 'bear',
        arguments: parsed.bearCase?.arguments || [],
        suggestedValue: parsed.bearCase?.suggestedValue,
        confidence: parsed.bearCase?.confidence || 'medium',
        sources: parsed.bearCase?.sources || [],
      },
    };
  } catch {
    return null;
  }
}

// ============================================================================
// Evidence Trail
// ============================================================================

const EVIDENCE_TRAIL_KEY = 'bizcaseland-evidence-trail';

/**
 * Save a debate result to the evidence trail
 */
export function saveDebateToTrail(result: DebateResult): void {
  const trail = getEvidenceTrail();
  trail.push(result);
  localStorage.setItem(EVIDENCE_TRAIL_KEY, JSON.stringify(trail));
}

/**
 * Get the full evidence trail
 */
export function getEvidenceTrail(): DebateResult[] {
  try {
    const stored = localStorage.getItem(EVIDENCE_TRAIL_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Clear the evidence trail
 */
export function clearEvidenceTrail(): void {
  localStorage.removeItem(EVIDENCE_TRAIL_KEY);
}

/**
 * Get debates for a specific assumption
 */
export function getDebatesForAssumption(assumptionLabel: string): DebateResult[] {
  return getEvidenceTrail().filter(
    (d) => d.assumption.assumptionLabel === assumptionLabel
  );
}
