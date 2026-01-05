/**
 * AI Service - Frontend client for LiteLLM API via Netlify proxy
 * Handles chat completions with streaming support
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

const API_ENDPOINT = '/.netlify/functions/ai';
const DEFAULT_MODEL = 'google/gemini-2.0-flash';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 2048;

// Available models for user selection
export const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast and cost-effective' },
  { id: 'azure/gpt-4o-mini', name: 'GPT-4o Mini', description: 'Balanced performance' },
] as const;

// ============================================================================
// AI Service Class
// ============================================================================

class AIService {
  private abortController: AbortController | null = null;

  /**
   * Send a chat completion request (non-streaming)
   */
  async chat(
    messages: AIServiceMessage[],
    options: AIServiceOptions = {}
  ): Promise<AIServiceResponse> {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || DEFAULT_MODEL,
        messages,
        stream: false,
        temperature: options.temperature ?? DEFAULT_TEMPERATURE,
        max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      content: data.choices?.[0]?.message?.content || '',
      tokenUsage: {
        prompt: parseInt(response.headers.get('X-Token-Usage-Prompt') || '0', 10),
        completion: parseInt(response.headers.get('X-Token-Usage-Completion') || '0', 10),
        total: parseInt(response.headers.get('X-Token-Usage-Total') || '0', 10),
      },
    };
  }

  /**
   * Send a streaming chat completion request
   */
  async streamChat(
    messages: AIServiceMessage[],
    callbacks: StreamCallbacks,
    options: AIServiceOptions = {}
  ): Promise<void> {
    // Cancel any existing stream
    this.cancelStream();

    this.abortController = new AbortController();
    let fullContent = '';

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || DEFAULT_MODEL,
          messages,
          stream: true,
          temperature: options.temperature ?? DEFAULT_TEMPERATURE,
          max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `API error: ${response.status}`);
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
              // Skip invalid JSON
            }
          }
        }
      }

      callbacks.onComplete({
        content: fullContent,
        tokenUsage,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Stream was cancelled, don't report as error
        return;
      }
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
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
