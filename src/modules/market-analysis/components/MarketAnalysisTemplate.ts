/**
 * Simplified Market Analysis Template System
 * Uses composition instead of filtering for modularity
 */

// Base template - always included
const baseTemplate = {
  schema_version: "2.0",
  meta: {
    title: "TODO-Market Analysis Title",
    description: "TODO-Market analysis description",
    currency: "EUR",
    base_year: 2024,
    analysis_horizon_years: 5,
    created_date: "TODO-YYYY-MM-DD",
    analyst: "TODO-Analyst Name"
  }
};

// Core instructions - shared across all modules
const coreInstructions = {
  purpose: "AI-Human collaborative market analysis. Complete any module independently or build a comprehensive analysis.",
  ai_workflow_protocol: {
    initial_prompt: "Upon receiving this template, ask: 'Would you like to work through this collaboratively or should I complete the analysis autonomously?'",
    collaborative_mode: {
      process: [
        "1. AI researches and presents one data point at a time with value and rationale",
        "2. AI asks: 'Does this look correct, or would you like me to revise it?'",
        "3. User responds with: 'looks good' OR 'too high/low, reconsider' OR specific correction",
        "4. AI adjusts if needed, then proceeds to next data point",
        "5. User can say 'finish the rest' anytime to switch to autonomous mode"
      ]
    },
    autonomous_mode: "AI completes all selected modules independently using available research"
  },
  rationale_requirements: {
    mandatory: "Every numeric value must have: value, unit, and detailed rationale with sources",
    quality: "Rationales should be specific enough for verification. Include data sources, methodology, and assumptions."
  },
  json_formatting_rules: {
    critical: [
      "CRITICAL: Output must be VALID JSON - no trailing commas, no syntax errors",
      "CRITICAL: All 'value' fields must contain ONLY plain numbers (e.g., 350000000000), NOT expressions",
      "CRITICAL: No trailing commas after last property in objects or arrays",
      "CRITICAL: Maintain exact JSON structure as provided in template"
    ],
    examples: {
      correct: "\"value\": 2180400000",
      incorrect: "\"value\": \"2_180_400_000\" OR \"value\": 2180400000,"
    }
  }
};

// Module templates - each is independent
const modules = {
  market_sizing: {
    market_sizing: {
      total_addressable_market: {
        base_value: { value: 0.0, unit: "EUR", rationale: "TODO-Total market size with sources" },
        growth_rate: { value: 0.0, unit: "percentage_per_year", rationale: "TODO-Market growth rate" },
        market_definition: "TODO-Clear definition of TAM",
        data_sources: ["TODO-Source 1", "TODO-Source 2"]
      },
      serviceable_addressable_market: {
        percentage_of_tam: { value: 0.0, unit: "percentage", rationale: "TODO-Why this % of TAM" },
        geographic_constraints: "TODO-Geographic limitations",
        regulatory_constraints: "TODO-Regulatory limitations",
        capability_constraints: "TODO-Capability limitations"
      },
      serviceable_obtainable_market: {
        percentage_of_sam: { value: 0.0, unit: "percentage", rationale: "TODO-Realistic obtainable portion" },
        resource_constraints: "TODO-Resource limitations",
        competitive_barriers: "TODO-Competitive barriers",
        time_constraints: "TODO-Time considerations"
      }
    },
    market_share: {
      current_position: {
        current_share: { value: 0.0, unit: "percentage", rationale: "TODO-Current position" },
        market_entry_date: "TODO-Entry date",
        current_revenue: { value: 0.0, unit: "EUR_per_year", rationale: "TODO-Current revenue" }
      },
      target_position: {
        target_share: { value: 0.0, unit: "percentage", rationale: "TODO-Target share" },
        target_timeframe: { value: 5, unit: "years", rationale: "TODO-Timeframe" },
        penetration_strategy: "linear",
        key_milestones: [
          { year: 1, milestone: "TODO-Year 1", target_share: 0.0, rationale: "TODO-Why achievable" }
        ]
      }
    }
  },

  competitive_intelligence: {
    competitive_landscape: {
      positioning_axes: {
        x_axis_label: "TODO-X Dimension (e.g., Market Share, Innovation)",
        y_axis_label: "TODO-Y Dimension (e.g., Quality, Service)"
      },
      our_position: { x: 50, y: 50 },
      market_structure: {
        concentration_level: "fragmented",
        concentration_rationale: "TODO-Concentration explanation",
        barriers_to_entry: "medium",
        barriers_description: "TODO-Entry barriers"
      },
      competitors: [
        {
          name: "TODO-Competitor name",
          x_position: 50,
          y_position: 50,
          market_share: { value: 0.0, unit: "percentage", rationale: "TODO-Position" },
          positioning: "TODO-Positioning strategy",
          strengths: ["TODO-Strength 1", "TODO-Strength 2"],
          weaknesses: ["TODO-Weakness 1", "TODO-Weakness 2"],
          threat_level: "medium",
          competitive_response: "TODO-PARAGRAPH 1: Competitor's position and threat.\n\nTODO-PARAGRAPH 2: Response and vulnerabilities."
        }
      ],
      competitive_advantages: [
        {
          advantage: "TODO-Your advantage",
          sustainability: "medium",
          rationale: "TODO-Why sustainable"
        }
      ],
      data_sources: ["TODO-Source"]
    }
  },

  customer_analysis: {
    customer_analysis: {
      market_segments: [
        {
          id: "segment_1",
          name: "TODO-Segment name",
          size_percentage: { value: 0.0, unit: "percentage", rationale: "TODO-% of TAM" },
          size_value: { value: 0.0, unit: "EUR", rationale: "TODO-Absolute size" },
          growth_rate: { value: 0.0, unit: "percentage_per_year", rationale: "TODO-Growth" },
          demographics: "TODO-Who they are, characteristics",
          pain_points: "TODO-Problems and unmet needs",
          customer_profile: "TODO-Typical behaviors",
          value_drivers: ["TODO-What drives value"],
          entry_strategy: "TODO-How to enter segment"
        }
      ],
      data_sources: ["TODO-Source"]
    }
  },

  strategic_planning: {
    strategic_planning: {
      market_entry_strategies: [
        {
          name: "TODO-Strategy Name",
          type: "partnership",
          essence: "TODO-PARAGRAPH 1: Core approach.\n\nTODO-PARAGRAPH 2: Resources needed.\n\nTODO-PARAGRAPH 3: Timeline and outcomes.",
          rationale: "TODO-PARAGRAPH 1: Why appropriate.\n\nTODO-PARAGRAPH 2: Advantages.\n\nTODO-PARAGRAPH 3: Risk mitigation."
        }
      ],
      data_sources: ["TODO-Source"]
    }
  }
};

// Module descriptions for instructions
const moduleDescriptions: Record<string, string> = {
  market_sizing: "Market opportunity (TAM/SAM/SOM) with growth projections",
  competitive_intelligence: "Positioning matrix and competitor analysis",
  customer_analysis: "Customer segments with demographics and pain points",
  strategic_planning: "Market entry strategies with detailed rationale"
};

/**
 * Module identifiers
 */
export type ModuleId = 'market_sizing' | 'competitive_intelligence' | 'customer_analysis' | 'strategic_planning';

/**
 * Compose a market analysis template from selected modules
 */
export function composeMarketAnalysisTemplate(selectedModules: ModuleId[]): string {
  // Start with base
  const composed: any = { ...baseTemplate };

  // Add instructions with selected module info
  composed.instructions = {
    ...coreInstructions,
    selected_modules: selectedModules.length === 4 
      ? "All modules included" 
      : `Selected: ${selectedModules.map(id => moduleDescriptions[id]).join(', ')}`
  };

  // Add each selected module
  selectedModules.forEach(moduleId => {
    Object.assign(composed, modules[moduleId]);
  });

  return JSON.stringify(composed, null, 2);
}

/**
 * Get full template with all modules
 */
export function getFullTemplate(): string {
  return composeMarketAnalysisTemplate([
    'market_sizing',
    'competitive_intelligence',
    'customer_analysis',
    'strategic_planning'
  ]);
}

/**
 * Get template for a single module
 * Perfect for targeted AI requests when user only needs one module
 */
export function getSingleModuleTemplate(moduleId: ModuleId): string {
  return composeMarketAnalysisTemplate([moduleId]);
}

/**
 * Backward compatibility - generate modular template
 */
export function generateModularTemplate(selectedModules: string[]): string {
  return composeMarketAnalysisTemplate(selectedModules as ModuleId[]);
}

/**
 * Legacy full template export (for backward compatibility)
 */
export const MarketAnalysisTemplate = getFullTemplate();

/**
 * Main template getter function for market analysis
 * Returns the full template by default
 */
export function getMarketAnalysisTemplate(): string {
  return getFullTemplate();
}
