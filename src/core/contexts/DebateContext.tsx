/**
 * DebateContext - State management for Assumption Debate Mode
 * Manages debate rounds, evidence trail, and AI-generated arguments
 */

import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import type {
  DebateState,
  DebateRound,
  DebateArgument,
  EvidenceTrailEntry,
} from '@/core/types/ai';
import {
  generateDebateId,
  generateArgumentId,
  createEvidenceEntry,
} from '@/core/types/ai';
import { aiService } from '@/core/services/ai-service';
import { storageService } from '@/core/services/storage.service';

// ============================================================================
// Storage Key
// ============================================================================

const DEBATE_STORAGE_KEY = 'bizcaseland_debate_state';

// ============================================================================
// Types
// ============================================================================

type DebateAction =
  | { type: 'SET_ACTIVE_DEBATE'; debate: DebateRound | null }
  | { type: 'ADD_TO_HISTORY'; debate: DebateRound }
  | { type: 'UPDATE_ACTIVE_DEBATE'; updates: Partial<DebateRound> }
  | { type: 'ADD_EVIDENCE'; entry: EvidenceTrailEntry }
  | { type: 'SET_GENERATING'; isGenerating: boolean }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'CLEAR_EVIDENCE_TRAIL' }
  | { type: 'LOAD_STATE'; state: DebateState };

interface DebateContextValue {
  state: DebateState;
  // Debate operations
  startDebate: (assumption: string, assumptionPath?: string, currentValue?: unknown) => Promise<void>;
  resolveDebate: (verdict: 'bull' | 'bear' | 'neutral', reasoning: string, adjustedValue?: unknown) => void;
  cancelDebate: () => void;
  // History operations
  clearHistory: () => void;
  clearEvidenceTrail: () => void;
  getDebateById: (id: string) => DebateRound | undefined;
  // Status
  isDebating: boolean;
}

// ============================================================================
// Initial State
// ============================================================================

const loadInitialState = (): DebateState => {
  const saved = storageService.load<DebateState>(DEBATE_STORAGE_KEY);
  if (saved) {
    return {
      ...saved,
      activeDebate: null, // Don't persist active debates
      isGenerating: false,
    };
  }
  return {
    activeDebate: null,
    debateHistory: [],
    evidenceTrail: [],
    isGenerating: false,
  };
};

// ============================================================================
// Reducer
// ============================================================================

function debateReducer(state: DebateState, action: DebateAction): DebateState {
  switch (action.type) {
    case 'SET_ACTIVE_DEBATE':
      return { ...state, activeDebate: action.debate };

    case 'ADD_TO_HISTORY':
      return {
        ...state,
        debateHistory: [action.debate, ...state.debateHistory].slice(0, 50), // Keep last 50
      };

    case 'UPDATE_ACTIVE_DEBATE':
      if (!state.activeDebate) return state;
      return {
        ...state,
        activeDebate: { ...state.activeDebate, ...action.updates },
      };

    case 'ADD_EVIDENCE':
      return {
        ...state,
        evidenceTrail: [action.entry, ...state.evidenceTrail].slice(0, 100), // Keep last 100
      };

    case 'SET_GENERATING':
      return { ...state, isGenerating: action.isGenerating };

    case 'CLEAR_HISTORY':
      return { ...state, debateHistory: [] };

    case 'CLEAR_EVIDENCE_TRAIL':
      return { ...state, evidenceTrail: [] };

    case 'LOAD_STATE':
      return action.state;

    default:
      return state;
  }
}

// ============================================================================
// Debate System Prompt
// ============================================================================

const DEBATE_SYSTEM_PROMPT = `You are an expert analyst providing balanced bull/bear case analysis for business assumptions.

When asked to debate an assumption, you MUST respond with a JSON object in this exact format:
{
  "bullCase": {
    "headline": "Brief optimistic summary (1 line)",
    "reasoning": "Detailed explanation of why this assumption could be conservative/optimistic (2-3 paragraphs)",
    "evidence": ["Evidence point 1", "Evidence point 2", "Evidence point 3"],
    "confidence": 0.7
  },
  "bearCase": {
    "headline": "Brief pessimistic summary (1 line)",
    "reasoning": "Detailed explanation of why this assumption could be too optimistic/risky (2-3 paragraphs)",
    "evidence": ["Evidence point 1", "Evidence point 2", "Evidence point 3"],
    "confidence": 0.6
  }
}

Guidelines:
1. Be genuinely balanced - don't favor one side
2. Use specific data points and industry references
3. Consider market conditions, competition, and execution risks
4. Confidence should be 0-1 based on strength of evidence
5. Each side should have 2-4 evidence points
6. Keep headlines concise but impactful
7. Reasoning should reference the specific assumption value if provided

IMPORTANT: Respond ONLY with the JSON object, no additional text.`;

// ============================================================================
// Parse AI Response
// ============================================================================

function parseDebateResponse(response: string): { bullCase: Omit<DebateArgument, 'id' | 'type'>; bearCase: Omit<DebateArgument, 'id' | 'type'> } | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.bullCase || !parsed.bearCase) return null;

    return {
      bullCase: {
        headline: parsed.bullCase.headline || 'Optimistic case',
        reasoning: parsed.bullCase.reasoning || '',
        evidence: Array.isArray(parsed.bullCase.evidence) ? parsed.bullCase.evidence : [],
        confidence: typeof parsed.bullCase.confidence === 'number' ? parsed.bullCase.confidence : 0.5,
      },
      bearCase: {
        headline: parsed.bearCase.headline || 'Pessimistic case',
        reasoning: parsed.bearCase.reasoning || '',
        evidence: Array.isArray(parsed.bearCase.evidence) ? parsed.bearCase.evidence : [],
        confidence: typeof parsed.bearCase.confidence === 'number' ? parsed.bearCase.confidence : 0.5,
      },
    };
  } catch (e) {
    console.error('Failed to parse debate response:', e);
    return null;
  }
}

// ============================================================================
// Context
// ============================================================================

const DebateContext = createContext<DebateContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface DebateProviderProps {
  children: React.ReactNode;
}

export function DebateProvider({ children }: DebateProviderProps) {
  const [state, dispatch] = useReducer(debateReducer, undefined, loadInitialState);

  // Persist state changes (except active debate and generating status)
  React.useEffect(() => {
    const toSave: DebateState = {
      ...state,
      activeDebate: null,
      isGenerating: false,
    };
    storageService.save(DEBATE_STORAGE_KEY, toSave);
  }, [state.debateHistory, state.evidenceTrail]);

  const startDebate = useCallback(
    async (assumption: string, assumptionPath?: string, currentValue?: unknown) => {
      if (state.isGenerating) return;

      dispatch({ type: 'SET_GENERATING', isGenerating: true });

      // Build the prompt
      const userPrompt = currentValue !== undefined
        ? `Analyze this business assumption and provide bull/bear cases:\n\nAssumption: "${assumption}"\nCurrent Value: ${JSON.stringify(currentValue)}`
        : `Analyze this business assumption and provide bull/bear cases:\n\nAssumption: "${assumption}"`;

      try {
        // Create messages for API
        const systemMessage = aiService.createSystemMessage(DEBATE_SYSTEM_PROMPT);
        const userMessage = aiService.createUserMessage(userPrompt);
        const apiMessages = aiService.toServiceMessages([systemMessage, userMessage]);

        // Get the response (non-streaming for structured output)
        let fullResponse = '';

        await aiService.streamChat(
          apiMessages,
          {
            onChunk: (chunk) => {
              fullResponse += chunk;
            },
            onComplete: () => {
              const parsed = parseDebateResponse(fullResponse);

              if (parsed) {
                const debateRound: DebateRound = {
                  id: generateDebateId(),
                  assumption,
                  assumptionPath,
                  currentValue,
                  bullCase: {
                    id: generateArgumentId(),
                    type: 'bull',
                    ...parsed.bullCase,
                  },
                  bearCase: {
                    id: generateArgumentId(),
                    type: 'bear',
                    ...parsed.bearCase,
                  },
                  createdAt: new Date().toISOString(),
                };

                dispatch({ type: 'SET_ACTIVE_DEBATE', debate: debateRound });
              } else {
                console.error('Failed to parse debate response');
              }

              dispatch({ type: 'SET_GENERATING', isGenerating: false });
            },
            onError: (error) => {
              console.error('Debate generation error:', error);
              dispatch({ type: 'SET_GENERATING', isGenerating: false });
            },
          },
          { model: 'claude-sonnet' } // Use sonnet for faster response
        );
      } catch (error) {
        console.error('Failed to start debate:', error);
        dispatch({ type: 'SET_GENERATING', isGenerating: false });
      }
    },
    [state.isGenerating]
  );

  const resolveDebate = useCallback(
    (verdict: 'bull' | 'bear' | 'neutral', reasoning: string, adjustedValue?: unknown) => {
      if (!state.activeDebate) return;

      // Update the debate with user's verdict
      const resolvedDebate: DebateRound = {
        ...state.activeDebate,
        userVerdict: verdict,
        userNotes: reasoning,
        adjustedValue,
      };

      // Add to history
      dispatch({ type: 'ADD_TO_HISTORY', debate: resolvedDebate });

      // Create evidence trail entry
      const evidenceEntry = createEvidenceEntry(
        state.activeDebate,
        verdict,
        reasoning,
        adjustedValue
      );
      dispatch({ type: 'ADD_EVIDENCE', entry: evidenceEntry });

      // Clear active debate
      dispatch({ type: 'SET_ACTIVE_DEBATE', debate: null });
    },
    [state.activeDebate]
  );

  const cancelDebate = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_DEBATE', debate: null });
    dispatch({ type: 'SET_GENERATING', isGenerating: false });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  const clearEvidenceTrail = useCallback(() => {
    dispatch({ type: 'CLEAR_EVIDENCE_TRAIL' });
  }, []);

  const getDebateById = useCallback(
    (id: string): DebateRound | undefined => {
      if (state.activeDebate?.id === id) return state.activeDebate;
      return state.debateHistory.find((d) => d.id === id);
    },
    [state.activeDebate, state.debateHistory]
  );

  const value = useMemo(
    () => ({
      state,
      startDebate,
      resolveDebate,
      cancelDebate,
      clearHistory,
      clearEvidenceTrail,
      getDebateById,
      isDebating: state.activeDebate !== null || state.isGenerating,
    }),
    [state, startDebate, resolveDebate, cancelDebate, clearHistory, clearEvidenceTrail, getDebateById]
  );

  return <DebateContext.Provider value={value}>{children}</DebateContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useDebate() {
  const context = useContext(DebateContext);
  if (!context) {
    throw new Error('useDebate must be used within a DebateProvider');
  }
  return context;
}

export default DebateContext;
