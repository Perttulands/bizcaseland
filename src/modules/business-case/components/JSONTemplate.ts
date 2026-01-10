export const JSONTemplate = `{
  "schema_version": "1.0",
  "instructions": {
    "purpose": "Populate this JSON with business case data and rationales. The webapp will expand patterns into 60 months, calculate results, visualize them, and enable analysis.",
    "rules": [
      "Replace TODOs with actual values.",
      "Every numeric datum must have value, unit, and rationale.",
      "Default horizon is 5 years (60 months). Provide at least Year 1 detail OR a pattern; the engine expands the rest.",
      "Choose ONE business model: recurring, unit_sales, or cost_savings.",
      "If a field does not apply, set unit='n/a' and explain in rationale.",
      "CRITICAL: Only one growth model (geom_growth, seasonal_growth, or linear_growth) should be selected and populated per case.",
      "GROWTH PATTERN PRECEDENCE: If segment-level volume.pattern_type is specified, it takes precedence over global growth_settings. Use growth_settings ONLY when all segments share the same pattern.",
      "For consistency, either use segment-level patterns for all segments OR use global growth_settings - do not mix both approaches."
    ],
    "business_models": {
      "recurring": "Subscription-based revenue (SaaS, memberships, etc.)",
      "unit_sales": "One-time sales of products or services",
      "cost_savings": "Investment that generates savings and efficiency gains"
    },
    "growth_patterns": {
      "geom_growth": "Exponential growth: start + monthly_growth rate; engine applies compounding for all periods.",
      "seasonal_growth": "Seasonal pattern: Provide seasonality_index_12 (12 monthly multipliers) and base_year_total (engine repeats pattern yearly with optional yoy_growth).",
      "linear_growth": "Linear growth: start + monthly_flat_increase; engine adds constant amount each period."
    },
    "pattern_location_guidance": {
      "segment_level": "Define volume.pattern_type and related parameters within each customer segment for segment-specific growth patterns.",
      "global_level": "Use growth_settings when ALL segments follow the same pattern. Values here serve as fallback when segment-level patterns are not specified.",
      "precedence": "Segment-level patterns override global growth_settings. Choose one approach consistently."
    },
    "advanced_features": {
      "flexible_pricing": "Use yearly_adjustments.pricing_factors for price changes over time, or price_overrides for specific periods.",
      "flexible_volume": "Use yearly_adjustments.volume_factors for volume changes over time, or volume_overrides for specific periods.",
      "cost_savings": "For cost_savings business model, define baseline_costs and efficiency_gains instead of revenue."
    },
    "drivers_guidance": "Drivers are optional sensitivity analysis tools. You can create drivers for ANY numeric field as long as driver.path resolves to a '.value' in this JSON (e.g., 'assumptions.pricing.avg_unit_price.value'). Common driver paths: pricing, COGS%, CAC, growth rates, OPEX items. Verify paths exist before adding drivers.",
    "validation_checklist": [
      "Verify all driver.path values resolve to existing '.value' fields in the JSON",
      "Ensure only one growth pattern is populated (others should have value: 0 or empty arrays)",
      "Check that business_model matches the data provided (recurring needs churn_pct, cost_savings needs baseline_costs)",
      "Confirm all required rationale fields are meaningful and specific"
    ]
  },
  "meta": {
    "title": "TODO-Short title",
    "description": "TODO-Concept description",
    "business_model": "TODO-recurring|unit_sales|cost_savings",
    "currency": "EUR",
    "periods": 60,
    "frequency": "monthly"
  },
  "assumptions": {
    "pricing": {
      "avg_unit_price": { "value": 0.0, "unit": "EUR_per_unit", "rationale": "TODO-average price rationale" },
      "yearly_adjustments": {
        "pricing_factors": [
          { "year": 1, "factor": 1.0, "rationale": "TODO-Year 1 pricing strategy" },
          { "year": 2, "factor": 1.0, "rationale": "TODO-Year 2 pricing adjustments" }
        ],
        "price_overrides": [
          { "period": 13, "price": 0.0, "rationale": "TODO-specific period price override" }
        ]
      }
    },
    "financial": {
      "interest_rate": { "value": 0.10, "unit": "ratio", "rationale": "10% discount rate for NPV calculations" }
    },
    "customers": {
      "churn_pct": { "value": 0.0, "unit": "ratio_per_month", "rationale": "TODO-monthly churn; used only if business_model=recurring" },
      "segments": [
        {
          "id": "TODO-segment_id_snake_case",
          "label": "TODO-Human label",
          "rationale": "TODO-why this segment matters",
          "volume": {
            "_instructions": "Define volume growth per segment. Either use 'pattern' with growth settings OR 'time_series' with explicit values.",
            "_pattern_guidance": "When type='pattern': segment grows using pattern_type (geom_growth, seasonal_growth, or linear_growth). The growth_settings.geom_growth.monthly_growth applies to ALL segments unless you override it.",
            "_yearly_adjustments_warning": "IMPORTANT: yearly_adjustments.volume_factors MULTIPLY the base growth pattern. Factor 1.8 means 1.8x the volume at that point. This compounds with ongoing growth, creating exponential effects. Use time_series instead if you want explicit control over volumes.",
            "_time_series_alternative": "When type='time_series': explicitly list volume for each key period. Engine interpolates between points. Use this when yearly_adjustments create unrealistic compounding.",
            "type": "pattern|time_series",
            "pattern_type": "geom_growth|seasonal_growth|linear_growth",
            "series": [
              { "period": 1, "value": 0, "unit": "units|accounts", "rationale": "TODO-Starting volume (base for pattern) or explicit time series value" }
            ],
            "yearly_adjustments": {
              "_usage": "OPTIONAL multiplicative adjustments. Use sparingly - these multiply the ongoing growth pattern.",
              "volume_factors": [
                { "year": 1, "factor": 1.0, "rationale": "TODO-Year 1 multiplier (1.0 = no adjustment)" },
                { "year": 2, "factor": 1.0, "rationale": "TODO-Year 2 multiplier (e.g., 1.5 = 50% boost on top of base growth)" }
              ],
              "volume_overrides": [
                { "period": 13, "volume": 0, "rationale": "TODO-Replace calculated volume for specific month" }
              ]
            }
          }
        }
      ]
    },
    "unit_economics": {
      "cogs_pct": { "value": 0.0, "unit": "ratio", "rationale": "TODO" },
      "cac": { "value": 0.0, "unit": "EUR", "rationale": "TODO" }
    },
    "opex": [
      {
        "name": "Sales & Marketing",
        "_documentation": "OPEX supports both fixed-only (legacy) and variable cost structures. Use cost_structure for realistic scaling.",
        "_formats": {
          "legacy_fixed_only": "Use 'value' field for fixed monthly cost that never changes",
          "new_variable_costs": "Use 'cost_structure' with fixed_component, variable_revenue_rate, and/or variable_volume_rate"
        },
        "_examples": {
          "fixed_only": "{ 'value': { 'value': 5000, 'unit': 'EUR_per_month', 'rationale': 'Fixed marketing spend' } }",
          "revenue_based": "{ 'cost_structure': { 'fixed_component': { 'value': 5000, ... }, 'variable_revenue_rate': { 'value': 0.10, 'unit': 'percentage_of_revenue', 'rationale': '10% of revenue' } } }",
          "volume_based": "{ 'cost_structure': { 'fixed_component': { 'value': 3000, ... }, 'variable_volume_rate': { 'value': 15, 'unit': 'EUR_per_customer', 'rationale': '15 EUR per customer' } } }",
          "mixed": "{ 'cost_structure': { 'fixed_component': {...}, 'variable_revenue_rate': {...}, 'variable_volume_rate': {...} } }"
        },
        "cost_structure": {
          "fixed_component": { "value": 0.0, "unit": "EUR_per_month", "rationale": "TODO-Base monthly S&M cost regardless of scale" },
          "variable_revenue_rate": { "value": 0.0, "unit": "percentage_of_revenue", "rationale": "TODO-S&M as % of revenue (0.10 = 10%). Use for demand generation that scales with revenue." },
          "variable_volume_rate": { "value": 0.0, "unit": "EUR_per_customer", "rationale": "TODO-S&M cost per customer/unit. Use for CAC-like costs." }
        }
      },
      {
        "name": "R&D",
        "cost_structure": {
          "fixed_component": { "value": 0.0, "unit": "EUR_per_month", "rationale": "TODO-Core engineering team cost" },
          "variable_revenue_rate": { "value": 0.0, "unit": "percentage_of_revenue", "rationale": "TODO-R&D investment as % of revenue (typically 8-15% for growing tech companies)" },
          "variable_volume_rate": { "value": 0.0, "unit": "EUR_per_customer", "rationale": "TODO-R&D cost per customer (rarely used, typically revenue-based)" }
        }
      },
      {
        "name": "G&A",
        "cost_structure": {
          "fixed_component": { "value": 0.0, "unit": "EUR_per_month", "rationale": "TODO-Base admin/overhead costs" },
          "variable_revenue_rate": { "value": 0.0, "unit": "percentage_of_revenue", "rationale": "TODO-G&A as % of revenue (if scales with company size)" },
          "variable_volume_rate": { "value": 0.0, "unit": "EUR_per_customer", "rationale": "TODO-Customer support/success cost per customer. Use for scalable support costs." }
        }
      }
    ],
    "capex": [
      {
        "name": "TODO-Asset or project",
        "timeline": {
          "type": "pattern|time_series",
          "pattern_type": "geom_growth|seasonal_growth|linear_growth",
          "series": [
            { "period": 1, "value": 0, "unit": "EUR", "rationale": "TODO-one-off or phased investment" }
          ]
        }
      }
    ],
    "cost_savings": {
      "baseline_costs": [
        {
          "id": "cost_1",
          "label": "TODO-Cost category name",
          "category": "operational|administrative|technology|other",
          "current_monthly_cost": { "value": 0.0, "unit": "EUR_per_month", "rationale": "TODO-current monthly cost baseline" },
          "savings_potential_pct": { "value": 0.0, "unit": "percentage", "rationale": "TODO-percentage of cost that can be saved" },
          "implementation_timeline": {
            "start_month": 1,
            "ramp_up_months": 6,
            "full_implementation_month": 12
          }
        }
      ],
      "efficiency_gains": [
        {
          "id": "efficiency_1",
          "label": "TODO-Efficiency improvement name",
          "metric": "TODO-units_per_hour|transactions_per_day|etc",
          "baseline_value": { "value": 0.0, "unit": "units_per_hour", "rationale": "TODO-current efficiency baseline" },
          "improved_value": { "value": 0.0, "unit": "units_per_hour", "rationale": "TODO-improved efficiency target" },
          "value_per_unit": { "value": 0.0, "unit": "EUR_per_unit", "rationale": "TODO-monetary value per efficiency unit" },
          "implementation_timeline": {
            "start_month": 1,
            "ramp_up_months": 6,
            "full_implementation_month": 12
          }
        }
      ]
    },
    "growth_settings": {
      "_instructions": "GLOBAL FALLBACK: Use these settings only when ALL customer segments follow the same growth pattern. Segment-level patterns take precedence over these global settings.",
      "geom_growth": {
        "start": { "value": 0, "unit": "units|accounts", "rationale": "TODO-Global starting level for exponential growth pattern" },
        "monthly_growth": { "value": 0.0, "unit": "ratio_per_month", "rationale": "TODO-Global monthly compound growth rate (e.g., 0.05 = 5% monthly)" }
      },
      "seasonal_growth": {
        "base_year_total": { "value": 0, "unit": "units|accounts", "rationale": "TODO-Global expected total for base year" },
        "seasonality_index_12": { "value": [0,0,0,0,0,0,0,0,0,0,0,0], "unit": "ratio", "rationale": "TODO-Global 12 monthly multipliers that sum to ~12.0 (average 1.0)" },
        "yoy_growth": { "value": 0.0, "unit": "ratio_per_year", "rationale": "TODO-Global year-over-year growth applied to totals" }
      },
      "linear_growth": {
        "start": { "value": 0, "unit": "units|accounts", "rationale": "TODO-Global starting level for linear growth pattern" },
        "monthly_flat_increase": { "value": 0, "unit": "units|accounts_per_month", "rationale": "TODO-Global fixed monthly increment" }
      }
    }
  },
  "drivers": [
    {
      "key": "price",
      "path": "assumptions.pricing.avg_unit_price.value",
      "range": [0, 0, 0, 0, 0],
      "rationale": "TODO-Price sensitivity analysis across different pricing levels"
    },
    {
      "key": "monthly_growth",
      "path": "assumptions.growth_settings.geom_growth.monthly_growth.value",
      "range": [0, 0, 0, 0, 0],
      "rationale": "TODO-Growth rate sensitivity for exponential growth scenarios"
    },
    {
      "key": "monthly_increase",
      "path": "assumptions.growth_settings.linear_growth.monthly_flat_increase.value",
      "range": [0, 0, 0, 0, 0],
      "rationale": "TODO-Linear growth rate sensitivity analysis"
    },
    {
      "key": "cac",
      "path": "assumptions.unit_economics.cac.value",
      "range": [0, 0, 0, 0, 0],
      "rationale": "TODO-Customer acquisition cost sensitivity"
    },
    {
      "key": "cogs_pct",
      "path": "assumptions.unit_economics.cogs_pct.value",
      "range": [0, 0, 0, 0, 0],
      "rationale": "TODO-Cost of goods sold percentage sensitivity"
    },
    {
      "key": "sales_marketing_opex",
      "path": "assumptions.opex[0].value.value",
      "range": [0, 0, 0, 0, 0],
      "rationale": "TODO-Sales & Marketing operational expense sensitivity"
    }
  ]
}`;
/**
 * Returns the JSON template string for business cases
 */
export function getJSONTemplate(): string {
  return JSONTemplate;
}
