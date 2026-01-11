/**
 * AIContext - State management for AI Co-pilot features
 * Manages chat messages, streaming state, and token usage
 * Supports context-aware system prompts for different analysis modes
 */

import React, { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import type { AIState, AISuggestion, ChatMessage, ResearchDocument } from '@/core/types/ai';
import { aiService, AVAILABLE_MODELS } from '@/core/services/ai-service';
import { AI_MODELS, DEFAULT_MODEL_ID, calculateCost, formatCost } from '@/core/config/ai-models';
import { chatHistoryService } from '@/core/services/chat-history-service';

// ============================================================================
// Types
// ============================================================================

export type AIContextType = 'general' | 'market-analysis' | 'business-case';

type AIAction =
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'UPDATE_LAST_MESSAGE'; content: string }
  | { type: 'SET_STREAMING'; isStreaming: boolean }
  | { type: 'SET_MODEL'; model: string }
  | { type: 'ADD_TOKENS'; tokens: { prompt: number; completion: number; total: number } }
  | { type: 'ADD_RESEARCH_DOC'; document: ResearchDocument }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'REMOVE_MESSAGE'; id: string }
  | { type: 'SET_CONTEXT_TYPE'; contextType: AIContextType }
  | { type: 'SET_SYSTEM_PROMPT'; prompt: string }
  | { type: 'ADD_SUGGESTION'; suggestion: AISuggestion }
  | { type: 'ACCEPT_SUGGESTION'; id: string }
  | { type: 'REJECT_SUGGESTION'; id: string }
  | { type: 'CLEAR_SUGGESTIONS' };

/** Token usage breakdown */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  estimatedCostFormatted: string;
}

interface AIContextValue {
  state: AIState;
  sendMessage: (content: string) => Promise<void>;
  sendMessageWithPrompt: (content: string, customSystemPrompt: string) => Promise<void>;
  cancelStream: () => void;
  clearMessages: () => void;
  setModel: (model: string) => void;
  setContextType: (contextType: AIContextType) => void;
  setSystemPrompt: (prompt: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  availableModels: typeof AVAILABLE_MODELS;
  contextType: AIContextType;
  // API Key management (BYOK)
  hasApiKey: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  // Suggestion management
  addSuggestion: (suggestion: AISuggestion) => void;
  acceptSuggestion: (id: string) => AISuggestion | undefined;
  rejectSuggestion: (id: string) => void;
  acceptAllSuggestions: () => AISuggestion[];
  rejectAllSuggestions: () => void;
  pendingSuggestions: readonly AISuggestion[];
  // Token/cost tracking
  tokenUsage: TokenUsage;
  // Chat history access
  getChatHistory: () => ReturnType<typeof chatHistoryService.getHistory>;
  getChatHistoryStats: () => ReturnType<typeof chatHistoryService.getStats>;
  clearChatHistory: () => void;
  exportChatHistory: (format: 'json' | 'csv') => string;
}

// ============================================================================
// Initial State
// ============================================================================

const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant for Bizcaseland, a business case analysis tool.
You help users analyze business cases and market data. Be concise, professional, and data-driven.
When suggesting values, explain your reasoning and cite sources when possible.
Format responses in markdown for clarity.`;

interface ExtendedAIState extends AIState {
  contextType: AIContextType;
  customSystemPrompt: string | null;
  promptTokensUsed: number;
  completionTokensUsed: number;
  totalCost: number;
}

const initialState: ExtendedAIState = {
  messages: [],
  pendingSuggestions: [],
  researchDocuments: {},
  isStreaming: false,
  selectedModel: DEFAULT_MODEL_ID,
  totalTokensUsed: 0,
  contextType: 'general',
  customSystemPrompt: null,
  promptTokensUsed: 0,
  completionTokensUsed: 0,
  totalCost: 0,
};

// ============================================================================
// Reducer
// ============================================================================

function aiReducer(state: ExtendedAIState, action: AIAction): ExtendedAIState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.message],
      };

    case 'UPDATE_LAST_MESSAGE': {
      const messages = [...state.messages];
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
        messages[lastIndex] = {
          ...messages[lastIndex],
          content: action.content,
        };
      }
      return { ...state, messages };
    }

    case 'SET_STREAMING':
      return { ...state, isStreaming: action.isStreaming };

    case 'SET_MODEL':
      return { ...state, selectedModel: action.model };

    case 'ADD_TOKENS': {
      const cost = calculateCost(
        state.selectedModel,
        action.tokens.prompt,
        action.tokens.completion
      );
      return {
        ...state,
        totalTokensUsed: state.totalTokensUsed + action.tokens.total,
        promptTokensUsed: state.promptTokensUsed + action.tokens.prompt,
        completionTokensUsed: state.completionTokensUsed + action.tokens.completion,
        totalCost: state.totalCost + cost,
      };
    }

    case 'ADD_RESEARCH_DOC':
      return {
        ...state,
        researchDocuments: {
          ...state.researchDocuments,
          [action.document.id]: action.document,
        },
      };

    case 'CLEAR_MESSAGES':
      return { ...state, messages: [], pendingSuggestions: [] };

    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter((m) => m.id !== action.id),
      };

    case 'SET_CONTEXT_TYPE':
      return { ...state, contextType: action.contextType };

    case 'SET_SYSTEM_PROMPT':
      return { ...state, customSystemPrompt: action.prompt };

    case 'ADD_SUGGESTION':
      return {
        ...state,
        pendingSuggestions: [...state.pendingSuggestions, action.suggestion],
      };

    case 'ACCEPT_SUGGESTION':
      return {
        ...state,
        pendingSuggestions: state.pendingSuggestions.map(s =>
          s.id === action.id
            ? { ...s, status: 'accepted' as const, respondedAt: new Date().toISOString() }
            : s
        ),
      };

    case 'REJECT_SUGGESTION':
      return {
        ...state,
        pendingSuggestions: state.pendingSuggestions.map(s =>
          s.id === action.id
            ? { ...s, status: 'rejected' as const, respondedAt: new Date().toISOString() }
            : s
        ),
      };

    case 'CLEAR_SUGGESTIONS':
      return { ...state, pendingSuggestions: [] };

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

const AIContext = createContext<AIContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface AIProviderProps {
  children: React.ReactNode;
}

export function AIProvider({ children }: AIProviderProps) {
  const [state, dispatch] = useReducer(aiReducer, initialState);
  const [isOpen, setIsOpen] = React.useState(false);
  const [hasApiKey, setHasApiKey] = React.useState(() => aiService.hasApiKey());
  const streamContentRef = useRef('');

  // API Key management methods
  const setApiKey = useCallback((key: string) => {
    aiService.setApiKey(key);
    setHasApiKey(true);
  }, []);

  const clearApiKey = useCallback(() => {
    aiService.clearApiKey();
    setHasApiKey(false);
  }, []);

  // Core message sending logic
  const sendMessageCore = useCallback(
    async (content: string, systemPrompt: string) => {
      if (!content.trim() || state.isStreaming) return;

      // Add user message
      const userMessage = aiService.createUserMessage(content);
      dispatch({ type: 'ADD_MESSAGE', message: userMessage });

      // Create placeholder for assistant response
      const assistantMessage = aiService.createAssistantMessage('');
      dispatch({ type: 'ADD_MESSAGE', message: assistantMessage });
      dispatch({ type: 'SET_STREAMING', isStreaming: true });
      streamContentRef.current = '';

      // Prepare messages for API (include system prompt + sliding window)
      const systemMessage = aiService.createSystemMessage(systemPrompt);
      const recentMessages = state.messages.slice(-6); // Keep last 6 messages for context
      const apiMessages = aiService.toServiceMessages([systemMessage, ...recentMessages, userMessage]);

      // Stream the response
      await aiService.streamChat(
        apiMessages,
        {
          onChunk: (chunk) => {
            streamContentRef.current += chunk;
            dispatch({ type: 'UPDATE_LAST_MESSAGE', content: streamContentRef.current });
          },
          onComplete: (response) => {
            dispatch({ type: 'SET_STREAMING', isStreaming: false });
            if (response.tokenUsage) {
              dispatch({
                type: 'ADD_TOKENS',
                tokens: {
                  prompt: response.tokenUsage.prompt,
                  completion: response.tokenUsage.completion,
                  total: response.tokenUsage.total,
                },
              });
            }
          },
          onError: (error) => {
            console.error('AI stream error:', error);
            dispatch({ type: 'SET_STREAMING', isStreaming: false });

            // Provide helpful error messages based on error type
            let userMessage = '';
            const errMsg = error.message.toLowerCase();

            if (errMsg.includes('timed out')) {
              userMessage = 'The request took too long. Please try a shorter message or try again.';
            } else if (errMsg.includes('rate limit') || errMsg.includes('429')) {
              userMessage = 'Too many requests. Please wait a moment before trying again.';
            } else if (errMsg.includes('api error: 5') || errMsg.includes('500') || errMsg.includes('502') || errMsg.includes('503')) {
              userMessage = 'Server error. The AI service may be temporarily unavailable. Please try again in a few minutes.';
            } else if (errMsg.includes('api error: 401') || errMsg.includes('unauthorized')) {
              userMessage = 'Authentication error. Please check your API configuration.';
            } else if (errMsg.includes('network') || errMsg.includes('fetch')) {
              userMessage = 'Network error. Please check your internet connection and try again.';
            } else {
              userMessage = `Error: ${error.message}`;
            }

            dispatch({
              type: 'UPDATE_LAST_MESSAGE',
              content: userMessage,
            });
          },
        },
        { model: state.selectedModel }
      );
    },
    [state.isStreaming, state.messages, state.selectedModel]
  );

  // Send message with default or custom system prompt
  const sendMessage = useCallback(
    async (content: string) => {
      const systemPrompt = state.customSystemPrompt || DEFAULT_SYSTEM_PROMPT;
      await sendMessageCore(content, systemPrompt);
    },
    [sendMessageCore, state.customSystemPrompt]
  );

  // Send message with a specific system prompt (one-time override)
  const sendMessageWithPrompt = useCallback(
    async (content: string, customSystemPrompt: string) => {
      await sendMessageCore(content, customSystemPrompt);
    },
    [sendMessageCore]
  );

  const cancelStream = useCallback(() => {
    aiService.cancelStream();
    dispatch({ type: 'SET_STREAMING', isStreaming: false });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);

  const setModel = useCallback((model: string) => {
    dispatch({ type: 'SET_MODEL', model });
  }, []);

  const setContextType = useCallback((contextType: AIContextType) => {
    dispatch({ type: 'SET_CONTEXT_TYPE', contextType });
  }, []);

  const setSystemPrompt = useCallback((prompt: string) => {
    dispatch({ type: 'SET_SYSTEM_PROMPT', prompt });
  }, []);

  // ============================================================================
  // Suggestion Management
  // ============================================================================

  const addSuggestion = useCallback((suggestion: AISuggestion) => {
    dispatch({ type: 'ADD_SUGGESTION', suggestion });
  }, []);

  const acceptSuggestion = useCallback((id: string): AISuggestion | undefined => {
    const suggestion = state.pendingSuggestions.find(s => s.id === id);
    if (suggestion) {
      dispatch({ type: 'ACCEPT_SUGGESTION', id });
    }
    return suggestion;
  }, [state.pendingSuggestions]);

  const rejectSuggestion = useCallback((id: string) => {
    dispatch({ type: 'REJECT_SUGGESTION', id });
  }, []);

  const acceptAllSuggestions = useCallback((): AISuggestion[] => {
    const pending = state.pendingSuggestions.filter(s => s.status === 'pending');
    pending.forEach(s => dispatch({ type: 'ACCEPT_SUGGESTION', id: s.id }));
    return pending;
  }, [state.pendingSuggestions]);

  const rejectAllSuggestions = useCallback(() => {
    state.pendingSuggestions
      .filter(s => s.status === 'pending')
      .forEach(s => dispatch({ type: 'REJECT_SUGGESTION', id: s.id }));
  }, [state.pendingSuggestions]);

  const pendingSuggestions = useMemo(
    () => state.pendingSuggestions.filter(s => s.status === 'pending'),
    [state.pendingSuggestions]
  );

  // ============================================================================
  // Token/Cost Tracking
  // ============================================================================

  const tokenUsage: TokenUsage = useMemo(() => ({
    promptTokens: state.promptTokensUsed,
    completionTokens: state.completionTokensUsed,
    totalTokens: state.totalTokensUsed,
    estimatedCost: state.totalCost,
    estimatedCostFormatted: formatCost(state.totalCost),
  }), [state.promptTokensUsed, state.completionTokensUsed, state.totalTokensUsed, state.totalCost]);

  // ============================================================================
  // Chat History Access
  // ============================================================================

  const getChatHistory = useCallback(() => chatHistoryService.getHistory(), []);
  const getChatHistoryStats = useCallback(() => chatHistoryService.getStats(), []);
  const clearChatHistory = useCallback(() => chatHistoryService.clearHistory(), []);
  const exportChatHistory = useCallback(
    (format: 'json' | 'csv') =>
      format === 'json' ? chatHistoryService.exportAsJSON() : chatHistoryService.exportAsCSV(),
    []
  );

  const value = useMemo(
    () => ({
      state,
      sendMessage,
      sendMessageWithPrompt,
      cancelStream,
      clearMessages,
      setModel,
      setContextType,
      setSystemPrompt,
      isOpen,
      setIsOpen,
      availableModels: AVAILABLE_MODELS,
      contextType: state.contextType,
      // API Key management (BYOK)
      hasApiKey,
      setApiKey,
      clearApiKey,
      // Suggestion management
      addSuggestion,
      acceptSuggestion,
      rejectSuggestion,
      acceptAllSuggestions,
      rejectAllSuggestions,
      pendingSuggestions,
      // Token/cost tracking
      tokenUsage,
      // Chat history access
      getChatHistory,
      getChatHistoryStats,
      clearChatHistory,
      exportChatHistory,
    }),
    [state, sendMessage, sendMessageWithPrompt, cancelStream, clearMessages, setModel, setContextType, setSystemPrompt, isOpen, hasApiKey, setApiKey, clearApiKey, addSuggestion, acceptSuggestion, rejectSuggestion, acceptAllSuggestions, rejectAllSuggestions, pendingSuggestions, tokenUsage, getChatHistory, getChatHistoryStats, clearChatHistory, exportChatHistory]
  );

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}

export default AIContext;
