# Customer Segment Template Instructions

## Purpose
Add a new customer segment to an existing business case. This will be MERGED with your current data - existing segments, pricing, and costs remain unchanged.

## Instructions for AI Tools
When filling this template:
1. Replace all TODO items with actual values for the new segment
2. Each field must have: value (number), unit (string), and rationale (explanation)  
3. Choose ONE volume pattern: geometric_growth, linear_growth, or seasonal_growth
4. The segment 'id' must be unique (e.g., 'enterprise', 'smb', 'government')
5. Set rationale fields to explain assumptions clearly

## Volume Growth Patterns

### Geometric Growth (Compound Percentage)
**Use when:** Growth compounds over time (viral products, network effects)
```json
"volume": {
  "base_value": 50,
  "unit": "customers_per_month",
  "pattern_type": "geometric_growth",
  "growth_rate": 0.15,
  "rationale": "Starting with 50 enterprise customers from pilot program",
  "growth_rationale": "15% monthly compound growth driven by digital marketing and customer referrals"
}
```
**Result:** Month 1: 50 → Month 2: 57.5 → Month 3: 66.1...

### Linear Growth (Fixed Increment)
**Use when:** Steady, predictable additions (direct sales, capacity-constrained)
```json
"volume": {
  "base_value": 25,
  "unit": "customers_per_month",
  "pattern_type": "linear_growth",
  "growth_rate": 10,
  "rationale": "Starting with 25 SMB customers from early adopter program",
  "growth_rationale": "Adding 10 new customers monthly through 3-person direct sales team"
}
```
**Result:** Month 1: 25 → Month 2: 35 → Month 3: 45...

### Seasonal Growth (Year-over-Year with Patterns)
**Use when:** Business has seasonal peaks/troughs (retail, B2B annual budgets)
```json
"volume": {
  "base_value": 100,
  "unit": "customers_per_month",
  "pattern_type": "seasonal_growth",
  "growth_rate": 0.20,
  "rationale": "Starting with 100 retail customers",
  "growth_rationale": "20% YoY growth with seasonal peaks in Q4 holiday season"
}
```

## Important Notes

⚠️ **Scope**: This template ONLY adds customer segments. Pricing, OpEx, and CapEx from your existing business case remain unchanged.

💡 **Update vs Add**: If you use an existing segment `id`, it will UPDATE that segment instead of adding a new one.

✓ **Shared Economics**: All segments in your business case share the same:
- Pricing (avg_unit_price)
- Cost of Goods Sold (COGS %)
- Customer Acquisition Cost (CAC)
- Operating Expenses (OpEx)
- Capital Expenses (CapEx)

## Complete Template Structure

```json
{
  "assumptions": {
    "customers": {
      "segments": [
        {
          "id": "TODO_unique_segment_id",
          "label": "TODO: Segment Name",
          "name": "TODO: Display Name",
          "rationale": "TODO: Why this segment matters and how it differs",
          "volume": {
            "base_value": 0,
            "unit": "customers_per_month",
            "rationale": "TODO: Starting customer count explanation",
            "pattern_type": "geometric_growth|linear_growth|seasonal_growth",
            "growth_rate": 0.10,
            "growth_rationale": "TODO: Expected growth explanation"
          }
        }
      ]
    }
  }
}
```

## Workflow

1. Copy template from "Copy Template" button in the Modify Segment Data tab
2. Fill in all TODO items with your segment data  
3. Choose appropriate growth pattern for your use case
4. Paste completed JSON in "Modify Segment Data" tab
5. Click "Import Segment" → automatically redirected to Volume tab to see results
