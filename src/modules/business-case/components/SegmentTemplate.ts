/**
 * JSON Template for adding new customer segments to existing business cases
 * This follows the Business Case data structure, NOT Market Analysis
 */

export const SegmentTemplate = `{
  "instructions": {
    "purpose": "Add a new customer segment to an existing business case. This will be MERGED with your current data - existing segments, pricing, and costs remain unchanged.",
    "rules": [
      "Replace all TODO items with actual values for YOUR new segment",
      "Each field must have: value (number), unit (string), and rationale (explanation)",
      "Choose volume type: 'pattern' for growth patterns OR 'time_series' for explicit period values",
      "Choose ONE pattern_type: geom_growth (compound %), seasonal_growth (seasonal), or linear_growth (fixed increment)",
      "The segment 'id' must be unique (e.g., 'enterprise', 'smb', 'government') - if ID exists, it will UPDATE that segment",
      "Set rationale fields to explain your assumptions clearly - this helps others understand your analysis"
    ],
    "volume_types": {
      "pattern": "Use growth patterns (geom_growth, seasonal_growth, linear_growth) - system calculates all 60 months",
      "time_series": "Explicitly define volume for key periods - system interpolates between points. Use for precise control."
    },
    "volume_patterns": {
      "geom_growth": "Compound percentage growth. Example: Start 50, grow 15% monthly → Month 1: 50, Month 2: 57.5, Month 3: 66...",
      "seasonal_growth": "Year-over-year growth with seasonal variations. Example: Base year 1200 total, seasonality peaks in Q4, 20% YoY growth",
      "linear_growth": "Fixed number increase each period. Example: Start 25, add 10 monthly → Month 1: 25, Month 2: 35, Month 3: 45..."
    },
    "important_notes": [
      "This template ONLY adds customer segments - pricing, OpEx, CapEx from your existing business case are NOT affected",
      "All segments in your business case share the same pricing (avg_unit_price) and cost structure",
      "After import, you'll be automatically redirected to the Volume tab to see your new segment",
      "Use yearly_adjustments SPARINGLY - they multiply the base pattern and can create unrealistic compounding"
    ]
  },
  "assumptions": {
    "customers": {
      "segments": [
        {
          "id": "TODO_unique_segment_id",
          "label": "TODO: Segment Name (e.g., Enterprise Customers)",
          "rationale": "TODO: Explain why this segment is important and how it differs from existing segments",
          "volume": {
            "_instructions": "Define volume growth per segment. Either use 'pattern' with growth settings OR 'time_series' with explicit values.",
            "_pattern_guidance": "When type='pattern': segment grows using pattern_type (geom_growth, seasonal_growth, or linear_growth).",
            "_time_series_alternative": "When type='time_series': explicitly list volume for each key period. Engine interpolates between points.",
            "type": "pattern",
            "pattern_type": "geom_growth",
            "series": [
              { "period": 1, "value": 0, "unit": "customers", "rationale": "TODO: Starting customer count for this segment" }
            ],
            "yearly_adjustments": {
              "_usage": "OPTIONAL multiplicative adjustments. Use sparingly - these multiply the ongoing growth pattern.",
              "volume_factors": [
                { "year": 1, "factor": 1.0, "rationale": "TODO: Year 1 multiplier (1.0 = no adjustment)" },
                { "year": 2, "factor": 1.0, "rationale": "TODO: Year 2 multiplier (e.g., 1.5 = 50% boost on top of base growth)" }
              ],
              "volume_overrides": [
                { "period": 13, "volume": 0, "rationale": "TODO: Replace calculated volume for specific month (optional)" }
              ]
            }
          }
        }
      ]
    },
    "growth_settings": {
      "_instructions": "Define growth parameters for this segment's pattern_type. Only populate the pattern you're using.",
      "geom_growth": {
        "start": { "value": 0, "unit": "customers", "rationale": "TODO: Starting customer count (same as series[0].value)" },
        "monthly_growth": { "value": 0.0, "unit": "ratio_per_month", "rationale": "TODO: Monthly compound growth rate (e.g., 0.05 = 5% monthly)" }
      },
      "seasonal_growth": {
        "base_year_total": { "value": 0, "unit": "customers", "rationale": "TODO: Expected total customers for base year" },
        "seasonality_index_12": { "value": [1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0], "unit": "ratio", "rationale": "TODO: 12 monthly multipliers that sum to ~12.0 (adjust for seasonal peaks)" },
        "yoy_growth": { "value": 0.0, "unit": "ratio_per_year", "rationale": "TODO: Year-over-year growth rate (e.g., 0.20 = 20% YoY)" }
      },
      "linear_growth": {
        "start": { "value": 0, "unit": "customers", "rationale": "TODO: Starting customer count (same as series[0].value)" },
        "monthly_flat_increase": { "value": 0, "unit": "customers_per_month", "rationale": "TODO: Fixed monthly customer increase (e.g., 10 customers per month)" }
      }
    }
  }
}`;

export const SegmentTemplateInstructions = {
  title: "Add New Customer Segment",
  description: "Use this template to add new customer segments to your existing business case. The system will merge this with your current data.",
  instructions: [
    "1. Copy the template above or click 'Copy Template to Clipboard'",
    "2. Replace all TODO items with your segment's actual data",
    "3. Set a unique 'id' (e.g., 'enterprise', 'smb', 'government')",
    "4. Choose a growth pattern type (see examples below)",
    "5. Paste the completed JSON in the textarea above",
    "6. Click 'Update Data' - your new segment will be ADDED to existing segments"
  ],
  examples: {
    geometric_growth: {
      description: "Percentage-based growth (compound)",
      pattern: {
        "base_value": 50,
        "unit": "customers_per_month",
        "pattern_type": "geometric_growth",
        "growth_rate": 0.15,
        "rationale": "Starting with 50 customers",
        "growth_rationale": "15% monthly growth through digital marketing"
      }
    },
    linear_growth: {
      description: "Fixed number increase each period",
      pattern: {
        "base_value": 25,
        "unit": "customers_per_month",
        "pattern_type": "linear_growth",
        "growth_rate": 10,
        "rationale": "Starting with 25 customers",
        "growth_rationale": "Adding 10 new customers per month through direct sales"
      }
    },
    seasonal_growth: {
      description: "Year-over-year with seasonal variations",
      pattern: {
        "base_value": 100,
        "unit": "customers_per_month",
        "pattern_type": "seasonal_growth",
        "growth_rate": 0.20,
        "rationale": "Starting with 100 customers",
        "growth_rationale": "20% YoY growth with seasonal peaks in Q4"
      }
    }
  },
  notes: [
    "⚠️ This template ONLY adds customer segments - pricing, OpEx, CapEx remain unchanged",
    "💡 If you use an existing segment 'id', it will UPDATE that segment instead of adding",
    "✓ All segments share the same pricing (avg_unit_price) and cost structure from your business case"
  ]
};

export const generateSegmentOnlyTemplate = (segmentId: string = "new_segment") => {
  return `{
  "assumptions": {
    "customers": {
      "segments": [
        {
          "id": "${segmentId}",
          "label": "TODO: Segment Name",
          "name": "TODO: Display Name",
          "rationale": "TODO: Why this segment matters",
          "volume": {
            "base_value": 0,
            "unit": "customers_per_month",
            "rationale": "TODO: Starting customer count for this segment",
            "pattern_type": "geometric_growth",
            "growth_rate": 0.10,
            "growth_rationale": "TODO: Expected growth (10% monthly shown as example)"
          }
        }
      ]
    }
  }
}`;
};

export const downloadSegmentTemplate = () => {
  const blob = new Blob([SegmentTemplate], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'business-case-add-segment.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
