/**
 * Market AI Context - Builds context and system prompts for market analysis AI
 * Provides market-specific prompts and data context for the AI assistant
 */

import type { MarketData } from '@/core/types/market';

// ============================================================================
// System Prompts
// ============================================================================

const MARKET_ANALYSIS_SYSTEM_PROMPT = `You are an expert market analyst AI assistant for Bizcaseland, specializing in market research, competitive analysis, and strategic planning.

Your capabilities:
- Market sizing: TAM (Total Addressable Market), SAM (Serviceable Addressable Market), SOM (Serviceable Obtainable Market) analysis
- Competitive intelligence: Competitor analysis, market positioning, competitive advantages
- Customer analysis: Market segmentation, customer profiles, value proposition
- Strategic planning: Market entry strategies, growth strategies, go-to-market planning

Guidelines:
1. Be data-driven: Cite sources and explain your reasoning
2. Be specific: Provide concrete numbers, percentages, and rationales
3. Be actionable: Suggest specific values that can be directly used
4. Format responses in markdown for clarity
5. When suggesting market data values, use this format:
   - **Value**: [specific number with unit]
   - **Rationale**: [why this value makes sense]
   - **Sources**: [relevant data sources]

When the user asks you to suggest market analysis values, provide structured suggestions they can review and accept.`;

// ============================================================================
// Context Builder
// ============================================================================

/**
 * Build context string from market data for AI consumption
 */
export function buildMarketContext(marketData: MarketData | null): string {
  if (!marketData) {
    return 'No market data loaded. I can help you start building your market analysis from scratch.';
  }

  const parts: string[] = [];

  // Meta information
  if (marketData.meta) {
    parts.push(`## Project: ${marketData.meta.title || 'Untitled'}`);
    if (marketData.meta.description) {
      parts.push(`Description: ${marketData.meta.description}`);
    }
    if (marketData.meta.currency) {
      parts.push(`Currency: ${marketData.meta.currency}`);
    }
    if (marketData.meta.base_year) {
      parts.push(`Base Year: ${marketData.meta.base_year}`);
    }
  }

  // Market Sizing
  if (marketData.market_sizing) {
    parts.push('\n## Current Market Sizing');
    const sizing = marketData.market_sizing;

    if (sizing.total_addressable_market) {
      const tam = sizing.total_addressable_market;
      parts.push(`- **TAM**: ${formatCurrency(tam.base_value?.value)} (${tam.base_value?.rationale || 'No rationale'})`);
      if (tam.growth_rate) {
        parts.push(`  - Growth Rate: ${tam.growth_rate.value}% per year`);
      }
      if (tam.market_definition) {
        parts.push(`  - Market Definition: ${tam.market_definition}`);
      }
    }

    if (sizing.serviceable_addressable_market) {
      const sam = sizing.serviceable_addressable_market;
      parts.push(`- **SAM**: ${sam.percentage_of_tam?.value}% of TAM`);
      if (sam.geographic_constraints) {
        parts.push(`  - Geographic: ${sam.geographic_constraints}`);
      }
    }

    if (sizing.serviceable_obtainable_market) {
      const som = sizing.serviceable_obtainable_market;
      parts.push(`- **SOM**: ${som.percentage_of_sam?.value}% of SAM`);
    }
  }

  // Competitive Landscape
  if (marketData.competitive_landscape?.competitors?.length) {
    parts.push('\n## Competitive Landscape');
    const competitors = marketData.competitive_landscape.competitors;
    parts.push(`${competitors.length} competitors identified:`);
    competitors.forEach(c => {
      parts.push(`- **${c.name}**: ${c.market_share?.value}% market share, ${c.threat_level} threat`);
      if (c.strengths?.length) {
        parts.push(`  - Strengths: ${c.strengths.slice(0, 3).join(', ')}`);
      }
    });
  }

  // Customer Segments
  if (marketData.customer_analysis?.segments?.length) {
    parts.push('\n## Customer Segments');
    const segments = marketData.customer_analysis.segments;
    parts.push(`${segments.length} segments defined:`);
    segments.forEach(s => {
      parts.push(`- **${s.name}**: ${s.size?.value} ${s.size?.unit || ''}`);
    });
  }

  // Market segments from customer_analysis.market_segments (alternative structure)
  const marketSegments = (marketData.customer_analysis as any)?.market_segments;
  if (marketSegments?.length && !marketData.customer_analysis?.segments?.length) {
    parts.push('\n## Customer Segments');
    parts.push(`${marketSegments.length} segments defined:`);
    marketSegments.forEach((s: any) => {
      parts.push(`- **${s.name}**: ${s.size_percentage?.value || s.size_value?.value || 'N/A'}`);
      if (s.pain_points) {
        parts.push(`  - Pain points: ${s.pain_points}`);
      }
    });
  }

  return parts.join('\n');
}

/**
 * Build full system prompt with market context
 */
export function buildMarketSystemPrompt(marketData: MarketData | null): string {
  const context = buildMarketContext(marketData);
  return `${MARKET_ANALYSIS_SYSTEM_PROMPT}

---
## Current Market Analysis Data
${context}
---

Use this context to provide informed suggestions. Reference the existing data when making recommendations.`;
}

// ============================================================================
// Quick Action Prompts
// ============================================================================

export interface QuickActionPrompt {
  id: string;
  label: string;
  icon: string;
  category: 'sizing' | 'competitive' | 'customer' | 'strategy' | 'debate';
  prompt: string;
  description: string;
}

export const MARKET_QUICK_ACTIONS: QuickActionPrompt[] = [
  // Market Sizing
  {
    id: 'suggest-tam',
    label: 'Suggest TAM',
    icon: 'target',
    category: 'sizing',
    prompt: 'Based on the market context, suggest an appropriate Total Addressable Market (TAM) value. Include the market definition, base value, growth rate, and data sources. Format as structured suggestions I can review.',
    description: 'Get AI suggestions for Total Addressable Market'
  },
  {
    id: 'suggest-sam',
    label: 'Suggest SAM',
    icon: 'layers',
    category: 'sizing',
    prompt: 'Based on the TAM and our capabilities, suggest the Serviceable Addressable Market (SAM). Include percentage of TAM, geographic constraints, regulatory constraints, and capability constraints with rationale.',
    description: 'Get AI suggestions for Serviceable Addressable Market'
  },
  {
    id: 'suggest-som',
    label: 'Suggest SOM',
    icon: 'pie-chart',
    category: 'sizing',
    prompt: 'Based on the SAM and competitive landscape, suggest a realistic Serviceable Obtainable Market (SOM). Include percentage of SAM, resource constraints, competitive barriers, and time constraints.',
    description: 'Get AI suggestions for Serviceable Obtainable Market'
  },
  {
    id: 'validate-sizing',
    label: 'Validate Sizing',
    icon: 'check-circle',
    category: 'sizing',
    prompt: 'Review my current TAM/SAM/SOM assumptions and provide feedback. Are the values realistic? Are the rationales sound? What might be missing?',
    description: 'Validate your market sizing assumptions'
  },

  // Competitive Analysis
  {
    id: 'identify-competitors',
    label: 'Identify Competitors',
    icon: 'users',
    category: 'competitive',
    prompt: 'Based on the market definition and segments, identify the key competitors in this market. For each, provide name, estimated market share, positioning, strengths, weaknesses, and threat level.',
    description: 'Identify and analyze competitors'
  },
  {
    id: 'competitive-positioning',
    label: 'Positioning Analysis',
    icon: 'crosshair',
    category: 'competitive',
    prompt: 'Analyze the competitive positioning in this market. Suggest positioning axes, where we should position ourselves, and our key competitive advantages with sustainability ratings.',
    description: 'Analyze competitive positioning'
  },
  {
    id: 'market-structure',
    label: 'Market Structure',
    icon: 'grid',
    category: 'competitive',
    prompt: 'Analyze the market structure. Is it fragmented, moderately concentrated, or highly concentrated? What are the barriers to entry? Provide rationale for each assessment.',
    description: 'Analyze market structure and barriers'
  },

  // Customer Analysis
  {
    id: 'suggest-segments',
    label: 'Suggest Segments',
    icon: 'pie-chart',
    category: 'customer',
    prompt: 'Based on the market analysis, suggest 3-5 customer segments to target. For each segment include: name, size (value and percentage), growth rate, demographics, pain points, value drivers, and recommended entry strategy.',
    description: 'Get AI suggestions for customer segments'
  },
  {
    id: 'segment-prioritization',
    label: 'Prioritize Segments',
    icon: 'bar-chart',
    category: 'customer',
    prompt: 'Review the defined customer segments and help prioritize them. Consider segment size, growth potential, competition intensity, and our fit. Rank them and explain the prioritization.',
    description: 'Prioritize customer segments'
  },
  {
    id: 'customer-profiles',
    label: 'Build Personas',
    icon: 'user',
    category: 'customer',
    prompt: 'For the primary customer segments, help build detailed buyer personas including role, goals, challenges, buying process, and key decision criteria.',
    description: 'Build customer personas'
  },

  // Strategy
  {
    id: 'entry-strategy',
    label: 'Entry Strategy',
    icon: 'rocket',
    category: 'strategy',
    prompt: 'Based on the market analysis, competitive landscape, and customer segments, suggest 2-3 market entry strategies. For each, provide the approach, key activities, expected outcomes, and rationale.',
    description: 'Suggest market entry strategies'
  },
  {
    id: 'growth-strategy',
    label: 'Growth Plan',
    icon: 'trending-up',
    category: 'strategy',
    prompt: 'Help develop a growth strategy with realistic market share targets. Define key milestones, penetration strategy (linear, exponential, or s-curve), and rationale for each year.',
    description: 'Develop growth strategy and milestones'
  },
  {
    id: 'gtm-strategy',
    label: 'Go-to-Market',
    icon: 'navigation',
    category: 'strategy',
    prompt: 'Outline a go-to-market strategy including target segments, positioning statement, value proposition, marketing channels, and sales approach.',
    description: 'Plan go-to-market strategy'
  },

  // Assumption Debate
  {
    id: 'debate-assumption',
    label: 'Challenge Assumption',
    icon: 'scale',
    category: 'debate',
    prompt: 'I want to challenge an assumption in my analysis. Please help me think through it by presenting both bull and bear cases.',
    description: 'Get bull/bear analysis on any assumption'
  },
  {
    id: 'debate-market-size',
    label: 'Debate Market Size',
    icon: 'scale',
    category: 'debate',
    prompt: 'Challenge my market sizing assumptions. Present bull case (why the market could be larger) and bear case (why it could be smaller) with evidence.',
    description: 'Challenge market sizing assumptions'
  },
  {
    id: 'debate-growth-rate',
    label: 'Debate Growth Rate',
    icon: 'scale',
    category: 'debate',
    prompt: 'Challenge my growth rate assumptions. Present bull case (faster growth scenario) and bear case (slower growth scenario) with supporting evidence.',
    description: 'Challenge growth rate assumptions'
  },
  {
    id: 'view-evidence-trail',
    label: 'View Evidence Trail',
    icon: 'file-text',
    category: 'debate',
    prompt: 'Show my evidence trail - the history of assumptions I have challenged and decisions I have made.',
    description: 'Review your debate decisions history'
  },
];

/**
 * Get quick actions by category
 */
export function getQuickActionsByCategory(category: QuickActionPrompt['category']): QuickActionPrompt[] {
  return MARKET_QUICK_ACTIONS.filter(action => action.category === category);
}

/**
 * Get a specific quick action by ID
 */
export function getQuickAction(id: string): QuickActionPrompt | undefined {
  return MARKET_QUICK_ACTIONS.find(action => action.id === id);
}

// ============================================================================
// Utilities
// ============================================================================

function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return 'Not set';
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toString();
}
