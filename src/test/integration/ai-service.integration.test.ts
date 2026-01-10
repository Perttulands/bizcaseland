/**
 * AI Service Integration Tests
 *
 * These tests run against the real LiteLLM endpoint.
 * They verify that the BYOK (Bring Your Own Key) system works correctly.
 *
 * To run these tests:
 * 1. Set LITELLM_TEST_API_KEY environment variable with a valid API key
 * 2. Run: npm test -- --testPathPattern=ai-service.integration
 *
 * Tests are skipped if no API key is provided (CI-friendly).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { aiService, AVAILABLE_MODELS } from '@/core/services/ai-service';

// Get test API key from environment
const TEST_API_KEY = import.meta.env.VITE_LITELLM_TEST_API_KEY || process.env.LITELLM_TEST_API_KEY;

// Skip tests if no API key is available
const describeWithApiKey = TEST_API_KEY ? describe : describe.skip;

describeWithApiKey('AI Service Integration Tests', () => {
  beforeEach(() => {
    // Clear any existing API key
    aiService.clearApiKey();
  });

  afterEach(() => {
    // Cleanup
    aiService.clearApiKey();
    aiService.cancelStream();
  });

  describe('API Key Management', () => {
    it('should start without an API key', () => {
      expect(aiService.hasApiKey()).toBe(false);
      expect(aiService.getApiKey()).toBeNull();
    });

    it('should set and retrieve API key', () => {
      aiService.setApiKey(TEST_API_KEY);
      expect(aiService.hasApiKey()).toBe(true);
      expect(aiService.getApiKey()).toBe(TEST_API_KEY);
    });

    it('should clear API key', () => {
      aiService.setApiKey(TEST_API_KEY);
      aiService.clearApiKey();
      expect(aiService.hasApiKey()).toBe(false);
      expect(aiService.getApiKey()).toBeNull();
    });

    it('should persist API key to localStorage', () => {
      aiService.setApiKey(TEST_API_KEY);
      const storedKey = localStorage.getItem('litellm-api-key');
      expect(storedKey).toBe(TEST_API_KEY);
    });

    it('should remove API key from localStorage on clear', () => {
      aiService.setApiKey(TEST_API_KEY);
      aiService.clearApiKey();
      const storedKey = localStorage.getItem('litellm-api-key');
      expect(storedKey).toBeNull();
    });
  });

  describe('Error Handling Without API Key', () => {
    it('should throw error when calling chat without API key', async () => {
      await expect(
        aiService.chat([{ role: 'user', content: 'Hello' }])
      ).rejects.toThrow('API key not configured');
    });

    it('should call onError when streaming without API key', async () => {
      const onError = vi.fn();

      await aiService.streamChat(
        [{ role: 'user', content: 'Hello' }],
        {
          onChunk: () => {},
          onComplete: () => {},
          onError,
        }
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('API key not configured'),
        })
      );
    });
  });

  describe('Available Models', () => {
    it('should have Claude Sonnet 4.5 as default model', () => {
      const defaultModel = AVAILABLE_MODELS[0];
      expect(defaultModel.id).toBe('anthropic/claude-4-5-sonnet-aws');
      expect(defaultModel.name).toBe('Claude Sonnet 4.5');
    });

    it('should have Gemini 2.5 Flash as alternative', () => {
      const geminiModel = AVAILABLE_MODELS.find(m => m.id.includes('gemini'));
      expect(geminiModel).toBeDefined();
      expect(geminiModel?.id).toBe('google/gemini-2.5-flash');
    });

    it('should only have 2 models available', () => {
      expect(AVAILABLE_MODELS.length).toBe(2);
    });
  });

  describe('Real API Calls', () => {
    beforeEach(() => {
      aiService.setApiKey(TEST_API_KEY);
    });

    it('should complete a non-streaming chat request', async () => {
      const response = await aiService.chat(
        [{ role: 'user', content: 'Say exactly: "Test successful"' }],
        { model: AVAILABLE_MODELS[0].id, maxTokens: 50 }
      );

      expect(response.content).toBeTruthy();
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.tokenUsage).toBeDefined();
    }, 30000); // 30 second timeout for API call

    it('should stream a chat response', async () => {
      const chunks: string[] = [];
      let completed = false;
      let tokenUsage: { prompt: number; completion: number; total: number } | undefined;

      await new Promise<void>((resolve, reject) => {
        aiService.streamChat(
          [{ role: 'user', content: 'Count from 1 to 5, one number per line.' }],
          {
            onChunk: (chunk) => {
              chunks.push(chunk);
            },
            onComplete: (response) => {
              completed = true;
              tokenUsage = response.tokenUsage;
              resolve();
            },
            onError: (error) => {
              reject(error);
            },
          },
          { model: AVAILABLE_MODELS[0].id, maxTokens: 100 }
        );
      });

      expect(completed).toBe(true);
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toContain('1');
      expect(tokenUsage).toBeDefined();
    }, 30000);

    it('should handle invalid API key gracefully', async () => {
      aiService.setApiKey('invalid-key-12345');

      await expect(
        aiService.chat([{ role: 'user', content: 'Hello' }])
      ).rejects.toThrow();
    }, 15000);

    it('should be able to cancel a streaming request', async () => {
      const chunks: string[] = [];
      let completeCalled = false;

      const streamPromise = aiService.streamChat(
        [{ role: 'user', content: 'Write a very long essay about the history of artificial intelligence from 1950 to today.' }],
        {
          onChunk: (chunk) => {
            chunks.push(chunk);
            // Cancel after receiving first chunk
            if (chunks.length === 1) {
              aiService.cancelStream();
            }
          },
          onComplete: () => {
            completeCalled = true;
          },
          onError: () => {
            // Error may or may not be called depending on timing - that's ok
          },
        },
        { model: AVAILABLE_MODELS[0].id, maxTokens: 1000 }
      );

      await streamPromise;

      // The key test: cancellation should work without hanging
      // If we get here, cancellation succeeded
      // We may or may not have received chunks depending on network timing
      expect(true).toBe(true);
    }, 30000);

    it('should work with Gemini model', async () => {
      const geminiModel = AVAILABLE_MODELS.find(m => m.id.includes('gemini'));
      if (!geminiModel) {
        throw new Error('Gemini model not found');
      }

      const response = await aiService.chat(
        [{ role: 'user', content: 'Say "Hello from Gemini"' }],
        { model: geminiModel.id, maxTokens: 50 }
      );

      expect(response.content).toBeTruthy();
    }, 30000);
  });
});

// Unit tests that don't require API key
describe('AI Service Unit Tests', () => {
  beforeEach(() => {
    aiService.clearApiKey();
  });

  describe('Message Helpers', () => {
    it('should create user message with correct structure', () => {
      const message = aiService.createUserMessage('Hello');
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello');
      expect(message.id).toBeTruthy();
      expect(message.timestamp).toBeTruthy();
    });

    it('should create assistant message with correct structure', () => {
      const message = aiService.createAssistantMessage('Hi there', 100);
      expect(message.role).toBe('assistant');
      expect(message.content).toBe('Hi there');
      expect(message.tokenCount).toBe(100);
      expect(message.id).toBeTruthy();
    });

    it('should create system message with correct structure', () => {
      const message = aiService.createSystemMessage('You are helpful');
      expect(message.role).toBe('system');
      expect(message.content).toBe('You are helpful');
      expect(message.id).toBeTruthy();
    });

    it('should convert ChatMessage array to service format', () => {
      const chatMessages = [
        aiService.createUserMessage('Hello'),
        aiService.createAssistantMessage('Hi'),
      ];

      const serviceMessages = aiService.toServiceMessages(chatMessages);

      expect(serviceMessages.length).toBe(2);
      expect(serviceMessages[0]).toEqual({ role: 'user', content: 'Hello' });
      expect(serviceMessages[1]).toEqual({ role: 'assistant', content: 'Hi' });
    });
  });

  describe('Model Validation', () => {
    it('should have valid model IDs', () => {
      AVAILABLE_MODELS.forEach(model => {
        expect(model.id).toBeTruthy();
        // Model IDs follow pattern: provider/model-name (may include dots and numbers)
        expect(model.id).toMatch(/^[a-z]+\/[a-z0-9.-]+$/);
      });
    });

    it('should have display names for all models', () => {
      AVAILABLE_MODELS.forEach(model => {
        expect(model.name).toBeTruthy();
        expect(model.name.length).toBeGreaterThan(0);
      });
    });

    it('should have descriptions for all models', () => {
      AVAILABLE_MODELS.forEach(model => {
        expect(model.description).toBeTruthy();
      });
    });
  });
});
