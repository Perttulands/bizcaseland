# Bizcaseland Sample Data Repository

This directory contains organized sample datasets for testing and demonstrating the capabilities of the Bizcaseland platform.

## Directory Structure

```
sample-data/
├── business-cases/          # Business case analysis datasets
├── market-analysis/         # Market research and analysis datasets  
├── test-cases/             # Edge cases and validation scenarios
└── README.md               # This file
```

## Business Case Datasets

### Revenue Growth Models
- **`saas-platform-revenue-growth.json`** - SaaS subscription platform with customer acquisition focus
  - 36-month projection
  - Multiple customer segments (SMB, Mid-market)
  - Geometric and linear growth patterns
  - Digital marketing CAC model

### Product Launch Models  
- **`iot-product-launch.json`** - Smart home IoT device launch
  - 48-month hardware product lifecycle
  - Seasonal demand patterns
  - One-time purchase model with declining pricing
  - Manufacturing and retail considerations

### Market Entry Models
- **`fintech-market-entry.json`** - European market expansion for fintech platform
  - 60-month multi-country rollout
  - Transaction-based pricing model
  - Regulatory compliance considerations
  - B2B customer segments across different markets

### Cost Savings Models
- **`payroll-automation-cost-savings.json`** - Process automation business case
  - Internal efficiency initiative
  - Operational cost reduction focus
  - Implementation timeline with training costs
  - ROI through labor savings

## Market Analysis Datasets

### Technology Markets
- **`ev-charging-market.json`** - European electric vehicle charging infrastructure
  - TAM/SAM/SOM analysis for €8.5B market
  - B2B customer segments (Fleet operators, Retail, Public)
  - Competitive landscape with major players
  - 5-year revenue projections

### Healthcare Technology
- **`healthcare-ai-analytics.json`** - AI-powered healthcare analytics platform
  - €12B European healthcare IT market analysis
  - Hospital systems, specialty clinics, and insurance segments
  - Regulatory compliance considerations (GDPR, Medical Device Regulation)
  - 7-year market penetration strategy

## Usage Guidelines

### Business Case Analysis
1. Load any business case JSON into the **Business Case Analyzer**
2. Navigate through tabs: Cash Flow → Financial Analysis → Assumptions → Data Management
3. Experiment with sensitivity analysis and scenario planning
4. Export results for presentation or further analysis

### Market Analysis
1. Import market analysis JSON into the **Market Analysis Suite** 
2. Review market sizing calculations and competitive positioning
3. Analyze customer segments and strategic recommendations
4. Use visualizations for stakeholder presentations

### Cross-Tool Integration
1. Start with market analysis to understand opportunity sizing
2. Transfer market volume data to business case for financial modeling
3. Validate assumptions across both tools for consistency
4. Generate integrated business case with market-validated assumptions

## Data Quality Standards

All sample datasets follow these standards:
- **Schema Compliance**: Validated against latest data schemas
- **Realistic Values**: Based on industry benchmarks and research
- **Complete Rationale**: Every assumption includes business rationale
- **Diverse Scenarios**: Coverage of different business models and industries
- **Current Market Data**: Updated regularly to reflect market conditions

## Contributing New Datasets

When adding new sample data:
1. Follow the established schema formats
2. Include comprehensive rationale for all assumptions
3. Validate data loads correctly in both tools
4. Update this README with dataset description
5. Add appropriate test cases for edge scenarios

## Schema Versions

- Business Case Schema: v1.0
- Market Analysis Schema: v1.0

For schema documentation, see `docs/` directory.
