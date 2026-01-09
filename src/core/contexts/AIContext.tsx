/**
 * AIContext - State management for AI Co-pilot features
 * Manages chat messages, streaming state, and token usage
 */

import React, { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import type { AIState, ChatMessage, ResearchDocument } from '@/core/types/ai';
import { aiService, AVAILABLE_MODELS } from '@/core/services/ai-service';

// ============================================================================
// Types
// ============================================================================

type AIAction =
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'UPDATE_LAST_MESSAGE'; content: string }
  | { type: 'SET_STREAMING'; isStreaming: boolean }
  | { type: 'SET_MODEL'; model: string }
  | { type: 'ADD_TOKENS'; tokens: number }
  | { type: 'ADD_RESEARCH_DOC'; document: ResearchDocument }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'REMOVE_MESSAGE'; id: string };

interface AIContextValue {
  state: AIState;
  sendMessage: (content: string) => Promise<void>;
  cancelStream: () => void;
  clearMessages: () => void;
  setModel: (model: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  availableModels: typeof AVAILABLE_MODELS;
}

// ============================================================================
// Initial State
// ============================================================================

const SYSTEM_PROMPT = `You are an AI assistant for Bizcaseland, a business case analysis tool.
You help users analyze business cases and market data. Be concise, professional, and data-driven.
When suggesting values, explain your reasoning and cite sources when possible.
Format responses in markdown for clarity.`;

const initialState: AIState = {
  messages: [],
  pendingSuggestions: [],
  researchDocuments: {},
  isStreaming: false,
  selectedModel: AVAILABLE_MODELS[0].id,
  totalTokensUsed: 0,
};

// ============================================================================
// Reducer
// ============================================================================

function aiReducer(state: AIState, action: AIAction): AIState {
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

    case 'ADD_TOKENS':
      return { ...state, totalTokensUsed: state.totalTokensUsed + action.tokens };

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
  const streamContentRef = useRef('');

  const sendMessage = useCallback(
    async (content: string) => {
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
      const systemMessage = aiService.createSystemMessage(SYSTEM_PROMPT);
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
              dispatch({ type: 'ADD_TOKENS', tokens: response.tokenUsage.total });
            }
          },
          onError: (error) => {
            console.error('AI stream error:', error);
            dispatch({ type: 'SET_STREAMING', isStreaming: false });
            dispatch({
              type: 'UPDATE_LAST_MESSAGE',
              content: `Error: ${error.message}. Please try again.`,
            });
          },
        },
        { model: state.selectedModel }
      );
    },
    [state.isStreaming, state.messages, state.selectedModel]
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

  const value = useMemo(
    () => ({
      state,
      sendMessage,
      cancelStream,
      clearMessages,
      setModel,
      isOpen,
      setIsOpen,
      availableModels: AVAILABLE_MODELS,
    }),
    [state, sendMessage, cancelStream, clearMessages, setModel, isOpen]
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
