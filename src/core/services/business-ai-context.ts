/**
 * Business Case AI Context - Builds context and system prompts for business case AI
 * Provides business-case-specific prompts and data context for the AI assistant
 */

import type { BusinessData } from '@/core/types/business';

// ============================================================================
// System Prompts
// ============================================================================

const BUSINESS_CASE_SYSTEM_PROMPT = `You are an expert financial analyst AI assistant for Bizcaseland, specializing in business case development, financial modeling, and investment analysis.

Your capabilities:
- Financial projections: Revenue modeling, cost structures, cash flow analysis
- Assumption validation: Testing key assumptions, sensitivity analysis
- Investment metrics: NPV, IRR, payback period, break-even analysis
- Risk assessment: Identifying and quantifying business risks
- Scenario planning: Best case, worst case, and base case modeling

Guidelines:
1. Be data-driven: Use the provided assumptions and explain your calculations
2. Be specific: Provide concrete numbers with clear units
3. Be actionable: Suggest specific values that can be directly applied
4. Format responses in markdown for clarity
5. When suggesting changes to assumptions, use this format:
   - **Field**: [path to the assumption]
   - **Current Value**: [what it is now]
   - **Suggested Value**: [your recommendation]
   - **Rationale**: [why this change makes sense]
   - **Impact**: [how this affects key metrics]

When the user asks you to analyze or suggest values, provide structured suggestions they can review and accept.`;

// ============================================================================
// Context Builder
// ============================================================================

/**
 * Build context string from business data for AI consumption
 */
export function buildBusinessContext(businessData: BusinessData | null): string {
  if (!businessData) {
    return 'No business case data loaded. I can help you start building your business case from scratch.';
  }

  const parts: string[] = [];

  // Meta information
  if (businessData.meta) {
    parts.push(`## Project: ${businessData.meta.title || 'Untitled Business Case'}`);
    if (businessData.meta.description) {
      parts.push(`Description: ${businessData.meta.description}`);
    }
    if (businessData.meta.currency) {
      parts.push(`Currency: ${businessData.meta.currency}`);
    }
    if (businessData.meta.period_years) {
      parts.push(`Projection Period: ${businessData.meta.period_years} years`);
    }
  }

  // Assumptions
  if (businessData.assumptions) {
    parts.push('\n## Key Assumptions');
    const assumptions = businessData.assumptions;

    // Pricing
    if (assumptions.pricing) {
      parts.push('\n### Pricing');
      const pricing = assumptions.pricing;
      if (pricing.avg_unit_price) {
        parts.push(`- Average Unit Price: ${formatCurrency(pricing.avg_unit_price.value)} ${pricing.avg_unit_price.unit || ''}`);
        if (pricing.avg_unit_price.rationale) {
          parts.push(`  - Rationale: ${pricing.avg_unit_price.rationale}`);
        }
      }
      if (pricing.price_growth_rate) {
        parts.push(`- Price Growth Rate: ${pricing.price_growth_rate.value}% per year`);
      }
    }

    // Volume
    if (assumptions.volume) {
      parts.push('\n### Volume');
      const volume = assumptions.volume;
      if (volume.initial_quantity) {
        parts.push(`- Initial Quantity: ${formatNumber(volume.initial_quantity.value)} ${volume.initial_quantity.unit || 'units'}`);
      }
      if (volume.growth_rate) {
        parts.push(`- Volume Growth Rate: ${volume.growth_rate.value}% per year`);
      }
    }

    // Costs
    if (assumptions.costs) {
      parts.push('\n### Costs');
      const costs = assumptions.costs;
      
      // Variable costs
      if (costs.variable) {
        parts.push('**Variable Costs:**');
        if (costs.variable.cogs_per_unit) {
          parts.push(`- COGS per Unit: ${formatCurrency(costs.variable.cogs_per_unit.value)}`);
        }
        if (costs.variable.variable_overhead_rate) {
          parts.push(`- Variable Overhead: ${costs.variable.variable_overhead_rate.value}%`);
        }
      }

      // Fixed costs
      if (costs.fixed) {
        parts.push('**Fixed Costs:**');
        const fixed = costs.fixed as Record<string, any>;
        Object.entries(fixed).forEach(([key, value]) => {
          if (value && typeof value === 'object' && 'value' in value) {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            parts.push(`- ${label}: ${formatCurrency(value.value)} ${value.unit || ''}`);
          }
        });
      }
    }

    // Investment
    if (assumptions.investment) {
      parts.push('\n### Investment');
      const investment = assumptions.investment;
      if (investment.initial_investment) {
        parts.push(`- Initial Investment: ${formatCurrency(investment.initial_investment.value)}`);
      }
      if (investment.discount_rate) {
        parts.push(`- Discount Rate: ${investment.discount_rate.value}%`);
      }
      if (investment.tax_rate) {
        parts.push(`- Tax Rate: ${investment.tax_rate.value}%`);
      }
    }
  }

  // Segments (if multi-segment)
  if (businessData.segments && businessData.segments.length > 0) {
    parts.push('\n## Business Segments');
    parts.push(`${businessData.segments.length} segment(s) defined:`);
    businessData.segments.forEach(segment => {
      parts.push(`- **${segment.name}**: ${segment.description || 'No description'}`);
      if (segment.assumptions?.pricing?.avg_unit_price) {
        parts.push(`  - Unit Price: ${formatCurrency(segment.assumptions.pricing.avg_unit_price.value)}`);
      }
    });
  }

  // Drivers (sensitivity analysis)
  if (businessData.drivers && businessData.drivers.length > 0) {
    parts.push('\n## Sensitivity Drivers');
    businessData.drivers.forEach(driver => {
      parts.push(`- **${driver.label}**: Range ${driver.range[0]}% to ${driver.range[1]}%`);
      if (driver.rationale) {
        parts.push(`  - Rationale: ${driver.rationale}`);
      }
    });
  }

  return parts.join('\n');
}

/**
 * Build full system prompt with business case context
 */
export function buildBusinessSystemPrompt(businessData: BusinessData | null): string {
  const context = buildBusinessContext(businessData);
  return `${BUSINESS_CASE_SYSTEM_PROMPT}

---
## Current Business Case Data
${context}
---

Use this context to provide informed suggestions. Reference the existing data when making recommendations.`;
}

// ============================================================================
// Quick Action Prompts
// ============================================================================

export interface BusinessQuickActionPrompt {
  id: string;
  label: string;
  icon: string;
  category: 'revenue' | 'costs' | 'investment' | 'analysis' | 'validation';
  prompt: string;
  description: string;
}

export const BUSINESS_QUICK_ACTIONS: BusinessQuickActionPrompt[] = [
  // Revenue Analysis
  {
    id: 'analyze-pricing',
    label: 'Analyze Pricing',
    icon: 'dollar-sign',
    category: 'revenue',
    prompt: 'Review my pricing assumptions. Are they realistic for the market? Suggest alternative pricing strategies and their potential impact on revenue.',
    description: 'Get AI analysis of your pricing strategy'
  },
  {
    id: 'suggest-volume',
    label: 'Suggest Volume',
    icon: 'trending-up',
    category: 'revenue',
    prompt: 'Based on the market size and competitive landscape, suggest realistic initial volume and growth rate assumptions. Include rationale and comparable benchmarks.',
    description: 'Get AI suggestions for volume assumptions'
  },
  {
    id: 'revenue-scenarios',
    label: 'Revenue Scenarios',
    icon: 'bar-chart',
    category: 'revenue',
    prompt: 'Create three revenue scenarios: optimistic, base case, and pessimistic. For each, provide volume and pricing assumptions with supporting rationale.',
    description: 'Generate revenue scenario analysis'
  },
  {
    id: 'segment-analysis',
    label: 'Segment Analysis',
    icon: 'pie-chart',
    category: 'revenue',
    prompt: 'Analyze my business segments. Are they properly differentiated? Suggest ways to optimize pricing or targeting for each segment.',
    description: 'Analyze business segment performance'
  },

  // Cost Analysis
  {
    id: 'validate-cogs',
    label: 'Validate COGS',
    icon: 'package',
    category: 'costs',
    prompt: 'Review my cost of goods sold assumptions. Are they complete? Are the per-unit costs realistic? Suggest any missing cost components.',
    description: 'Validate cost of goods sold'
  },
  {
    id: 'optimize-costs',
    label: 'Optimize Costs',
    icon: 'scissors',
    category: 'costs',
    prompt: 'Analyze my fixed and variable cost structure. Identify opportunities for cost optimization and suggest realistic target reductions.',
    description: 'Find cost optimization opportunities'
  },
  {
    id: 'suggest-costs',
    label: 'Suggest Costs',
    icon: 'calculator',
    category: 'costs',
    prompt: 'Based on the business type and scale, suggest a complete cost structure including any missing fixed or variable costs. Include industry benchmarks.',
    description: 'Get AI suggestions for cost structure'
  },
  {
    id: 'break-even',
    label: 'Break-Even Analysis',
    icon: 'crosshair',
    category: 'costs',
    prompt: 'Calculate my break-even point. What volume and revenue is needed to cover costs? How long will it take to reach break-even?',
    description: 'Calculate break-even analysis'
  },

  // Investment Analysis
  {
    id: 'validate-investment',
    label: 'Validate Investment',
    icon: 'landmark',
    category: 'investment',
    prompt: 'Review my initial investment assumptions. Are all capital requirements captured? Are the amounts realistic for this type of business?',
    description: 'Validate initial investment'
  },
  {
    id: 'suggest-discount-rate',
    label: 'Discount Rate',
    icon: 'percent',
    category: 'investment',
    prompt: 'Help me determine the appropriate discount rate for this investment. Consider the risk profile, industry norms, and cost of capital.',
    description: 'Get discount rate recommendation'
  },
  {
    id: 'funding-strategy',
    label: 'Funding Strategy',
    icon: 'wallet',
    category: 'investment',
    prompt: 'Analyze my capital requirements and suggest optimal funding strategies. Consider debt vs equity, timing of capital needs, and funding sources.',
    description: 'Develop funding strategy'
  },

  // Financial Analysis
  {
    id: 'cashflow-analysis',
    label: 'Cash Flow Analysis',
    icon: 'activity',
    category: 'analysis',
    prompt: 'Analyze my projected cash flows. Identify months with negative cash flow, peak funding requirements, and suggest working capital strategies.',
    description: 'Analyze cash flow projections'
  },
  {
    id: 'sensitivity-drivers',
    label: 'Key Drivers',
    icon: 'sliders',
    category: 'analysis',
    prompt: 'Identify the key value drivers for this business case. Which assumptions have the biggest impact on NPV and IRR? Suggest sensitivity ranges to test.',
    description: 'Identify key value drivers'
  },
  {
    id: 'risk-assessment',
    label: 'Risk Assessment',
    icon: 'shield-alert',
    category: 'analysis',
    prompt: 'Perform a risk assessment of my business case. Identify the top risks, their potential impact, and suggest mitigation strategies.',
    description: 'Assess business case risks'
  },
  {
    id: 'improve-metrics',
    label: 'Improve Metrics',
    icon: 'rocket',
    category: 'analysis',
    prompt: 'My investment metrics need improvement. Suggest specific changes to assumptions that could improve NPV, IRR, or payback period while remaining realistic.',
    description: 'Suggestions to improve metrics'
  },

  // Validation
  {
    id: 'validate-all',
    label: 'Full Validation',
    icon: 'check-circle',
    category: 'validation',
    prompt: 'Perform a comprehensive validation of my entire business case. Check assumptions for completeness, consistency, and realism. Highlight any red flags.',
    description: 'Full business case validation'
  },
  {
    id: 'stress-test',
    label: 'Stress Test',
    icon: 'zap',
    category: 'validation',
    prompt: 'Stress test my business case. What happens if costs increase 20%? If revenue drops 30%? Identify the breaking points and resilience of the model.',
    description: 'Stress test the business case'
  },
  {
    id: 'competitive-check',
    label: 'Competitive Check',
    icon: 'users',
    category: 'validation',
    prompt: 'Compare my assumptions against industry benchmarks and competitors. Are my margins, growth rates, and costs competitive? Where am I optimistic or conservative?',
    description: 'Benchmark against competitors'
  },
  {
    id: 'present-case',
    label: 'Summarize Case',
    icon: 'presentation',
    category: 'validation',
    prompt: 'Summarize my business case in executive summary format. Include key metrics, main assumptions, risks, and investment recommendation.',
    description: 'Generate executive summary'
  },
];

/**
 * Get quick actions by category
 */
export function getBusinessQuickActionsByCategory(category: BusinessQuickActionPrompt['category']): BusinessQuickActionPrompt[] {
  return BUSINESS_QUICK_ACTIONS.filter(action => action.category === category);
}

/**
 * Get a specific quick action by ID
 */
export function getBusinessQuickAction(id: string): BusinessQuickActionPrompt | undefined {
  return BUSINESS_QUICK_ACTIONS.find(action => action.id === id);
}

// ============================================================================
// Utilities
// ============================================================================

function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return 'Not set';
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatNumber(value: number | undefined): string {
  if (value === undefined || value === null) return 'Not set';
  return value.toLocaleString();
}
