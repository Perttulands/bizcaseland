/**
 * AI-related types for the AI Co-pilot feature
 * Research documents, suggestions, and AI metadata
 */

// ============================================================================
// Research Document System
// ============================================================================

/**
 * A source reference for research backing
 */
export interface ResearchSource {
  readonly url: string;
  readonly title: string;
  readonly domain: string;
  readonly accessedAt: string;  // ISO timestamp
  readonly snippet?: string;    // Relevant excerpt from source
}

/**
 * Research document that backs a data point or suggestion
 * Provides rationale, sources, and confidence for AI-generated values
 */
export interface ResearchDocument {
  readonly id: string;                    // Unique identifier (e.g., 'research-abc123')
  readonly sources: readonly ResearchSource[];
  readonly rationale: string;             // AI's reasoning for the value
  readonly confidence: number;            // 0-1 confidence score
  readonly createdAt: string;             // ISO timestamp
  readonly updatedAt: string;             // ISO timestamp
  readonly query?: string;                // Original query that generated this research
  readonly modelId?: string;              // Which AI model generated this
}

/**
 * Extension fields for ValueWithRationale to support AI backing
 * These fields are optional for backward compatibility
 */
export interface AIBackingFields {
  readonly researchIds?: readonly string[];  // References to ResearchDocument IDs
  readonly aiGenerated?: boolean;            // Was this value AI-suggested?
  readonly aiConfidence?: number;            // AI confidence score (0-1)
}

// ============================================================================
// AI Suggestions
// ============================================================================

export type SuggestionStatus = 'pending' | 'accepted' | 'rejected';

/**
 * AI suggestion for a data field change
 */
export interface AISuggestion {
  readonly id: string;                       // Unique suggestion ID
  readonly path: string;                     // JSON path (e.g., 'assumptions.pricing.avg_unit_price')
  readonly currentValue: unknown;
  readonly suggestedValue: unknown;
  readonly rationale: string;
  readonly confidence: number;               // 0-1
  readonly researchRefs: readonly string[];  // ResearchDocument IDs
  readonly status: SuggestionStatus;
  readonly createdAt: string;
  readonly respondedAt?: string;             // When accepted/rejected
}

// ============================================================================
// Chat Types
// ============================================================================

export type ChatRole = 'user' | 'assistant' | 'system';

/**
 * Chat message in the AI conversation
 */
export interface ChatMessage {
  readonly id: string;
  readonly role: ChatRole;
  readonly content: string;
  readonly timestamp: string;
  readonly suggestions?: readonly AISuggestion[];  // Suggestions extracted from this message
  readonly tokenCount?: number;                    // Token usage for this message
}

// ============================================================================
// AI State
// ============================================================================

/**
 * State for AI features in the application
 */
export interface AIState {
  readonly messages: readonly ChatMessage[];
  readonly pendingSuggestions: readonly AISuggestion[];
  readonly researchDocuments: Record<string, ResearchDocument>;
  readonly isStreaming: boolean;
  readonly selectedModel: string;
  readonly totalTokensUsed: number;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isValidConfidence(value: number): boolean {
  return typeof value === 'number' && value >= 0 && value <= 1 && !isNaN(value) && isFinite(value);
}

export function isResearchDocument(obj: unknown): obj is ResearchDocument {
  if (!obj || typeof obj !== 'object') return false;
  const doc = obj as Record<string, unknown>;
  return (
    typeof doc.id === 'string' &&
    Array.isArray(doc.sources) &&
    typeof doc.rationale === 'string' &&
    typeof doc.confidence === 'number' &&
    typeof doc.createdAt === 'string' &&
    typeof doc.updatedAt === 'string'
  );
}

export function isResearchSource(obj: unknown): obj is ResearchSource {
  if (!obj || typeof obj !== 'object') return false;
  const src = obj as Record<string, unknown>;
  return (
    typeof src.url === 'string' &&
    typeof src.title === 'string' &&
    typeof src.domain === 'string' &&
    typeof src.accessedAt === 'string'
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique ID for research documents
 */
export function generateResearchId(): string {
  return `research-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Generate a unique ID for suggestions
 */
export function generateSuggestionId(): string {
  return `suggestion-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Generate a unique ID for chat messages
 */
export function generateMessageId(): string {
  return `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a new research document
 */
export function createResearchDocument(
  sources: ResearchSource[],
  rationale: string,
  confidence: number,
  options?: {
    query?: string;
    modelId?: string;
  }
): ResearchDocument {
  const now = new Date().toISOString();
  return {
    id: generateResearchId(),
    sources,
    rationale,
    confidence: Math.max(0, Math.min(1, confidence)),
    createdAt: now,
    updatedAt: now,
    query: options?.query,
    modelId: options?.modelId,
  };
}

/**
 * Create a research source from a URL
 */
export function createResearchSource(
  url: string,
  title: string,
  snippet?: string
): ResearchSource {
  let domain: string;
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = 'unknown';
  }

  return {
    url,
    title,
    domain,
    accessedAt: new Date().toISOString(),
    snippet,
  };
}

// ============================================================================
// Assumption Debate Types
// ============================================================================

/**
 * Represents a single argument in a debate (bull or bear case)
 */
export interface DebateArgument {
  readonly id: string;
  readonly type: 'bull' | 'bear';
  readonly headline: string;           // Short summary of the argument
  readonly reasoning: string;          // Detailed explanation
  readonly evidence: readonly string[];  // Supporting evidence/data points
  readonly confidence: number;         // 0-1 confidence score
  readonly sources?: readonly ResearchSource[];
}

/**
 * Represents a complete debate round for an assumption
 */
export interface DebateRound {
  readonly id: string;
  readonly assumption: string;         // The assumption being debated
  readonly assumptionPath?: string;    // JSON path to the assumption in data
  readonly currentValue?: unknown;     // Current value of the assumption
  readonly bullCase: DebateArgument;
  readonly bearCase: DebateArgument;
  readonly createdAt: string;
  readonly userVerdict?: 'bull' | 'bear' | 'neutral';
  readonly userNotes?: string;         // User's reasoning for their choice
  readonly adjustedValue?: unknown;    // Value user adjusted to
}

/**
 * Evidence trail entry - records user decisions from debates
 */
export interface EvidenceTrailEntry {
  readonly id: string;
  readonly debateRoundId: string;
  readonly assumption: string;
  readonly originalValue?: unknown;
  readonly finalValue?: unknown;
  readonly verdict: 'bull' | 'bear' | 'neutral';
  readonly reasoning: string;          // Why user made this decision
  readonly timestamp: string;
}

/**
 * State for the debate feature
 */
export interface DebateState {
  readonly activeDebate: DebateRound | null;
  readonly debateHistory: readonly DebateRound[];
  readonly evidenceTrail: readonly EvidenceTrailEntry[];
  readonly isGenerating: boolean;
}

// ============================================================================
// Debate Utility Functions
// ============================================================================

/**
 * Generate a unique ID for debate rounds
 */
export function generateDebateId(): string {
  return `debate-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Generate a unique ID for debate arguments
 */
export function generateArgumentId(): string {
  return `arg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Generate a unique ID for evidence trail entries
 */
export function generateEvidenceId(): string {
  return `evidence-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a new debate round
 */
export function createDebateRound(
  assumption: string,
  bullCase: DebateArgument,
  bearCase: DebateArgument,
  options?: {
    assumptionPath?: string;
    currentValue?: unknown;
  }
): DebateRound {
  return {
    id: generateDebateId(),
    assumption,
    assumptionPath: options?.assumptionPath,
    currentValue: options?.currentValue,
    bullCase,
    bearCase,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create an evidence trail entry from a resolved debate
 */
export function createEvidenceEntry(
  debateRound: DebateRound,
  verdict: 'bull' | 'bear' | 'neutral',
  reasoning: string,
  finalValue?: unknown
): EvidenceTrailEntry {
  return {
    id: generateEvidenceId(),
    debateRoundId: debateRound.id,
    assumption: debateRound.assumption,
    originalValue: debateRound.currentValue,
    finalValue,
    verdict,
    reasoning,
    timestamp: new Date().toISOString(),
  };
}
