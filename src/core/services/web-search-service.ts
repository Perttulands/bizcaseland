/**
 * Web Search Service - Frontend client for web search via Firebase Cloud Functions
 * Provides market research search with domain allowlist and source citations
 */

// ============================================================================
// Types
// ============================================================================

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  domain: string;
  publishedDate?: string;
  isTrusted: boolean;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalResults: number;
  trustedCount: number;
}

export interface SearchOptions {
  count?: number;
  freshness?: 'day' | 'week' | 'month' | 'year';
  trustedOnly?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const API_ENDPOINT = '/webSearch';

// Trusted domains (mirrors backend list for UI display)
export const TRUSTED_DOMAINS = [
  // Market research firms
  { domain: 'statista.com', name: 'Statista', category: 'Market Research' },
  { domain: 'gartner.com', name: 'Gartner', category: 'Market Research' },
  { domain: 'forrester.com', name: 'Forrester', category: 'Market Research' },
  { domain: 'mckinsey.com', name: 'McKinsey', category: 'Consulting' },
  { domain: 'bcg.com', name: 'BCG', category: 'Consulting' },
  { domain: 'deloitte.com', name: 'Deloitte', category: 'Consulting' },
  
  // Business publications
  { domain: 'bloomberg.com', name: 'Bloomberg', category: 'News' },
  { domain: 'reuters.com', name: 'Reuters', category: 'News' },
  { domain: 'wsj.com', name: 'Wall Street Journal', category: 'News' },
  { domain: 'ft.com', name: 'Financial Times', category: 'News' },
  { domain: 'hbr.org', name: 'Harvard Business Review', category: 'News' },
  
  // Data sources
  { domain: 'worldbank.org', name: 'World Bank', category: 'Data' },
  { domain: 'imf.org', name: 'IMF', category: 'Data' },
  { domain: 'oecd.org', name: 'OECD', category: 'Data' },
] as const;

// ============================================================================
// Web Search Service Class
// ============================================================================

class WebSearchService {
  private isEnabled: boolean;

  constructor() {
    // Check feature flag
    this.isEnabled = import.meta.env.VITE_FEATURE_WEB_SEARCH === 'true';
  }

  /**
   * Check if web search is enabled
   */
  isSearchEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Perform a web search for market research
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    if (!this.isEnabled) {
      throw new Error('Web search is not enabled');
    }

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        count: options.count || 10,
        freshness: options.freshness,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Search failed' }));
      throw new Error(error.error || 'Search error: ' + response.status);
    }

    const data: SearchResponse = await response.json();

    // Filter to trusted only if requested
    if (options.trustedOnly) {
      data.results = data.results.filter((r) => r.isTrusted);
      data.totalResults = data.results.length;
    }

    return data;
  }

  /**
   * Search specifically for market size data
   */
  async searchMarketSize(market: string, region?: string): Promise<SearchResponse> {
    const query = region
      ? market + ' market size ' + region + ' 2024 2025'
      : market + ' market size global 2024 2025';

    return this.search(query, { count: 10, freshness: 'year', trustedOnly: true });
  }

  /**
   * Search for industry reports
   */
  async searchIndustryReports(industry: string): Promise<SearchResponse> {
    const query = industry + ' industry report market analysis 2024';
    return this.search(query, { count: 10, trustedOnly: true });
  }

  /**
   * Search for competitor information
   */
  async searchCompetitors(company: string, industry?: string): Promise<SearchResponse> {
    const query = industry
      ? company + ' competitors ' + industry + ' market share'
      : company + ' competitors market share';

    return this.search(query, { count: 10 });
  }

  /**
   * Search for pricing benchmarks
   */
  async searchPricing(product: string, market?: string): Promise<SearchResponse> {
    const query = market
      ? product + ' pricing ' + market + ' benchmark average'
      : product + ' pricing benchmark average cost';

    return this.search(query, { count: 10, trustedOnly: true });
  }

  /**
   * Format search results as citations for research documents
   */
  formatAsCitations(results: SearchResult[]): string {
    return results
      .filter((r) => r.isTrusted)
      .slice(0, 5)
      .map((r, idx) => '[' + (idx + 1) + '] ' + r.title + ' - ' + r.domain + (r.publishedDate ? ' (' + r.publishedDate + ')' : ''))
      .join('\n');
  }

  /**
   * Create research document sources from search results
   */
  toResearchSources(results: SearchResult[]): Array<{
    url: string;
    title: string;
    domain: string;
    accessedAt: string;
    snippet?: string;
  }> {
    return results.map((r) => ({
      url: r.url,
      title: r.title,
      domain: r.domain,
      accessedAt: new Date().toISOString(),
      snippet: r.description,
    }));
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const webSearchService = new WebSearchService();
export default webSearchService;
