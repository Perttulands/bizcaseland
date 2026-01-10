/**
 * AI Service - Frontend client for LiteLLM API (BYOK - Bring Your Own Key)
 * Handles chat completions with streaming support
 * Users provide their own LiteLLM API key stored in localStorage
 */

import type { ChatMessage, ChatRole } from '@/core/types/ai';
import { generateMessageId } from '@/core/types/ai';

// ============================================================================
// Types
// ============================================================================

export interface AIServiceMessage {
  role: ChatRole;
  content: string;
}

export interface AIServiceOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIServiceResponse {
  content: string;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (response: AIServiceResponse) => void;
  onError: (error: Error) => void;
}

// ============================================================================
// Constants
// ============================================================================

const LITELLM_ENDPOINT = 'https://app-litellmsn66ka.azurewebsites.net';
const API_KEY_STORAGE_KEY = 'litellm-api-key';
const DEFAULT_MODEL = 'anthropic/claude-4-5-sonnet-aws';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 2048;
const REQUEST_TIMEOUT_MS = 60000; // 60 seconds

// Available models for user selection (from LiteLLM /models endpoint)
export const AVAILABLE_MODELS = [
  { id: 'anthropic/claude-4-5-sonnet-aws', name: 'Claude Sonnet 4.5', description: 'Best quality (Recommended)' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast and cost-effective' },
] as const;

// ============================================================================
// Logging Utilities
// ============================================================================

const LOG_PREFIX = '[AI Service]';

function logLLMRequest(model: string, messages: AIServiceMessage[], options: AIServiceOptions) {
  console.group(`${LOG_PREFIX} Request`);
  console.log('Model:', model);
  console.log('Messages:', messages);
  console.log('Options:', { temperature: options.temperature, maxTokens: options.maxTokens });
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();
}

function logLLMResponse(content: string, tokenUsage: { prompt: number; completion: number; total: number }, durationMs: number) {
  console.group(`${LOG_PREFIX} Response`);
  console.log('Content length:', content.length, 'chars');
  console.log('Content preview:', content.substring(0, 200) + (content.length > 200 ? '...' : ''));
  console.log('Token usage:', tokenUsage);
  console.log('Duration:', `${durationMs}ms`);
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();
}

function logLLMError(error: Error, context: string) {
  console.group(`${LOG_PREFIX} Error`);
  console.error('Context:', context);
  console.error('Message:', error.message);
  if (error.stack) console.error('Stack:', error.stack);
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();
}

// ============================================================================
// AI Service Class
// ============================================================================

class AIService {
  private abortController: AbortController | null = null;
  private apiKey: string | null = null;

  constructor() {
    // Load API key from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    }
  }

  /**
   * Set the API key and persist to localStorage
   */
  setApiKey(key: string): void {
    this.apiKey = key;
    if (typeof window !== 'undefined') {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
    }
  }

  /**
   * Get the current API key
   */
  getApiKey(): string | null {
    return this.apiKey;
  }

  /**
   * Clear the API key from memory and localStorage
   */
  clearApiKey(): void {
    this.apiKey = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  }

  /**
   * Check if an API key is configured
   */
  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  /**
   * Send a chat completion request (non-streaming)
   */
  async chat(
    messages: AIServiceMessage[],
    options: AIServiceOptions = {}
  ): Promise<AIServiceResponse> {
    if (!this.apiKey) {
      throw new Error('API key not configured. Please add your LiteLLM API key in settings.');
    }

    const startTime = Date.now();
    const model = options.model || DEFAULT_MODEL;

    logLLMRequest(model, messages, options);

    try {
      const response = await fetch(`${LITELLM_ENDPOINT}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          temperature: options.temperature ?? DEFAULT_TEMPERATURE,
          max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMsg = errorData.error?.message || errorData.error || `API error: ${response.status}`;
        logLLMError(new Error(errorMsg), 'chat - HTTP response not OK');
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const tokenUsage = {
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
        total: data.usage?.total_tokens || 0,
      };

      logLLMResponse(content, tokenUsage, Date.now() - startTime);

      return { content, tokenUsage };
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        logLLMError(error, 'chat - Request timed out');
        throw new Error('Request timed out. Please try again.');
      }
      if (error instanceof Error) {
        logLLMError(error, 'chat');
      }
      throw error;
    }
  }

  /**
   * Send a streaming chat completion request
   */
  async streamChat(
    messages: AIServiceMessage[],
    callbacks: StreamCallbacks,
    options: AIServiceOptions = {}
  ): Promise<void> {
    // Check for API key first
    if (!this.apiKey) {
      callbacks.onError(new Error('API key not configured. Please add your LiteLLM API key in settings.'));
      return;
    }

    // Cancel any existing stream
    this.cancelStream();

    const startTime = Date.now();
    const model = options.model || DEFAULT_MODEL;

    logLLMRequest(model, messages, options);

    this.abortController = new AbortController();
    let fullContent = '';

    // Create a timeout that will abort the request
    const timeoutId = setTimeout(() => {
      if (this.abortController) {
        this.abortController.abort(new Error('Request timed out'));
      }
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${LITELLM_ENDPOINT}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: options.temperature ?? DEFAULT_TEMPERATURE,
          max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMsg = errorData.error?.message || errorData.error || `API error: ${response.status}`;
        logLLMError(new Error(errorMsg), 'streamChat - HTTP response not OK');
        throw new Error(errorMsg);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let tokenUsage = { prompt: 0, completion: 0, total: 0 };

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                fullContent += content;
                callbacks.onChunk(content);
              }

              // Extract token usage from final chunk
              if (parsed.usage) {
                tokenUsage = {
                  prompt: parsed.usage.prompt_tokens || 0,
                  completion: parsed.usage.completion_tokens || 0,
                  total: parsed.usage.total_tokens || 0,
                };
              }
            } catch {
              // Skip invalid JSON chunks (common in SSE streams)
            }
          }
        }
      }

      clearTimeout(timeoutId);
      logLLMResponse(fullContent, tokenUsage, Date.now() - startTime);

      callbacks.onComplete({
        content: fullContent,
        tokenUsage,
      });
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        // Check if it was a timeout or user cancellation
        if (error.message === 'Request timed out') {
          logLLMError(error, 'streamChat - Request timed out');
          callbacks.onError(new Error('Request timed out. Please try again.'));
        } else {
          console.log(`${LOG_PREFIX} Request cancelled by user`);
        }
        return;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      logLLMError(err, 'streamChat');
      callbacks.onError(err);
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Cancel an ongoing stream
   */
  cancelStream(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Convert ChatMessage[] to AIServiceMessage[] format
   */
  toServiceMessages(messages: ChatMessage[]): AIServiceMessage[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Create a ChatMessage from AI response
   */
  createAssistantMessage(content: string, tokenCount?: number): ChatMessage {
    return {
      id: generateMessageId(),
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      tokenCount,
    };
  }

  /**
   * Create a user ChatMessage
   */
  createUserMessage(content: string): ChatMessage {
    return {
      id: generateMessageId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a system ChatMessage
   */
  createSystemMessage(content: string): ChatMessage {
    return {
      id: generateMessageId(),
      role: 'system',
      content,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const aiService = new AIService();
export default aiService;
