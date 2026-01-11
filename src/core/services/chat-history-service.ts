/**
 * Chat History Service
 * 
 * Logs all LLM calls with full context for debugging and analysis.
 * Persists to localStorage with a rolling limit to prevent storage overflow.
 */

import { calculateCost, formatCost, getModelById } from '@/core/config/ai-models';

// ============================================================================
// Types
// ============================================================================

export interface ChatHistoryEntry {
  /** Unique identifier */
  id: string;
  /** ISO timestamp when request started */
  timestamp: string;
  /** Model ID used */
  modelId: string;
  /** Model display name */
  modelName: string;
  /** The system prompt (if any) */
  systemPrompt?: string;
  /** User's input message */
  userMessage: string;
  /** Full messages array sent to API (truncated for storage) */
  messagesPreview: string;
  /** AI response content */
  response: string;
  /** Response truncated for storage */
  responseTruncated: boolean;
  /** Token usage breakdown */
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  /** Estimated cost in USD */
  cost: number;
  /** Formatted cost string */
  costFormatted: string;
  /** Request duration in milliseconds */
  durationMs: number;
  /** Whether the request was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Context type (general, market-analysis, business-case) */
  contextType?: string;
}

export interface ChatHistoryStats {
  totalEntries: number;
  totalTokens: number;
  totalCost: number;
  totalCostFormatted: string;
  oldestEntry?: string;
  newestEntry?: string;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'bizcaseland-chat-history';
const MAX_ENTRIES = 50;
const MAX_RESPONSE_LENGTH = 2000;
const MAX_MESSAGES_PREVIEW_LENGTH = 500;

// ============================================================================
// Service Implementation
// ============================================================================

class ChatHistoryService {
  private entries: ChatHistoryEntry[] = [];
  private loaded = false;

  constructor() {
    this.load();
  }

  /**
   * Load history from localStorage
   */
  private load(): void {
    if (this.loaded || typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.entries = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[ChatHistory] Failed to load from localStorage:', error);
      this.entries = [];
    }
    this.loaded = true;
  }

  /**
   * Save history to localStorage
   */
  private save(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch (error) {
      console.warn('[ChatHistory] Failed to save to localStorage:', error);
      // If storage is full, try removing oldest entries
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.entries = this.entries.slice(-Math.floor(MAX_ENTRIES / 2));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
        } catch {
          console.error('[ChatHistory] Still cannot save after pruning');
        }
      }
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Truncate string to max length with indicator
   */
  private truncate(str: string, maxLength: number): { text: string; truncated: boolean } {
    if (str.length <= maxLength) {
      return { text: str, truncated: false };
    }
    return {
      text: str.substring(0, maxLength) + '... [truncated]',
      truncated: true,
    };
  }

  /**
   * Log a new LLM call
   */
  logEntry(params: {
    modelId: string;
    systemPrompt?: string;
    userMessage: string;
    messages: Array<{ role: string; content: string }>;
    response: string;
    tokens: { prompt: number; completion: number; total: number };
    durationMs: number;
    success: boolean;
    error?: string;
    contextType?: string;
  }): ChatHistoryEntry {
    this.load();

    const model = getModelById(params.modelId);
    const cost = calculateCost(
      params.modelId,
      params.tokens.prompt,
      params.tokens.completion
    );

    const responseResult = this.truncate(params.response, MAX_RESPONSE_LENGTH);
    const messagesJson = JSON.stringify(params.messages);
    const messagesPreview = this.truncate(messagesJson, MAX_MESSAGES_PREVIEW_LENGTH);

    const entry: ChatHistoryEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      modelId: params.modelId,
      modelName: model?.name || params.modelId,
      systemPrompt: params.systemPrompt,
      userMessage: params.userMessage,
      messagesPreview: messagesPreview.text,
      response: responseResult.text,
      responseTruncated: responseResult.truncated,
      tokens: params.tokens,
      cost,
      costFormatted: formatCost(cost),
      durationMs: params.durationMs,
      success: params.success,
      error: params.error,
      contextType: params.contextType,
    };

    // Add to beginning (newest first)
    this.entries.unshift(entry);

    // Enforce rolling limit
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(0, MAX_ENTRIES);
    }

    this.save();

    // Also log to console for debugging
    console.group('[ChatHistory] New Entry');
    console.log('Model:', entry.modelName);
    console.log('Tokens:', entry.tokens);
    console.log('Cost:', entry.costFormatted);
    console.log('Duration:', `${entry.durationMs}ms`);
    console.log('Success:', entry.success);
    console.groupEnd();

    return entry;
  }

  /**
   * Get all history entries (newest first)
   */
  getHistory(): ChatHistoryEntry[] {
    this.load();
    return [...this.entries];
  }

  /**
   * Get history entries with pagination
   */
  getHistoryPage(page: number, pageSize: number = 10): {
    entries: ChatHistoryEntry[];
    totalPages: number;
    totalEntries: number;
  } {
    this.load();
    const start = page * pageSize;
    const entries = this.entries.slice(start, start + pageSize);
    return {
      entries,
      totalPages: Math.ceil(this.entries.length / pageSize),
      totalEntries: this.entries.length,
    };
  }

  /**
   * Get a single entry by ID
   */
  getEntry(id: string): ChatHistoryEntry | undefined {
    this.load();
    return this.entries.find((e) => e.id === id);
  }

  /**
   * Get aggregate stats
   */
  getStats(): ChatHistoryStats {
    this.load();

    const totalTokens = this.entries.reduce((sum, e) => sum + e.tokens.total, 0);
    const totalCost = this.entries.reduce((sum, e) => sum + e.cost, 0);

    return {
      totalEntries: this.entries.length,
      totalTokens,
      totalCost,
      totalCostFormatted: formatCost(totalCost),
      oldestEntry: this.entries.length > 0 ? this.entries[this.entries.length - 1].timestamp : undefined,
      newestEntry: this.entries.length > 0 ? this.entries[0].timestamp : undefined,
    };
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.entries = [];
    this.save();
  }

  /**
   * Export history as JSON string
   */
  exportAsJSON(): string {
    this.load();
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        stats: this.getStats(),
        entries: this.entries,
      },
      null,
      2
    );
  }

  /**
   * Export history as CSV string
   */
  exportAsCSV(): string {
    this.load();

    const headers = [
      'Timestamp',
      'Model',
      'User Message',
      'Prompt Tokens',
      'Completion Tokens',
      'Total Tokens',
      'Cost',
      'Duration (ms)',
      'Success',
      'Error',
    ];

    const rows = this.entries.map((e) => [
      e.timestamp,
      e.modelName,
      `"${e.userMessage.replace(/"/g, '""')}"`,
      e.tokens.prompt,
      e.tokens.completion,
      e.tokens.total,
      e.costFormatted,
      e.durationMs,
      e.success,
      e.error || '',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const chatHistoryService = new ChatHistoryService();
export default chatHistoryService;
