# Design: Domain Expert - Business Case Frameworks & Research Methodologies

> Generated: 2026-01-06
> Status: Ready for Review
> Author: polecat/toast

## Executive Summary

This document defines what makes a great business case tool - the domain model, frameworks, methodologies, and quality indicators that should drive Bizcaseland's design.

**Core Insight**: Cash flow over time IS the business case. Everything else (market sizing, unit economics, competitive analysis) feeds into a time-series financial model.

**Key Principle**: Progressive refinement - start with rough estimates, deepen iteratively, maintain full provenance.

## The Cash Flow-First Mental Model

```
                    ┌─────────────────────────────────────────────┐
                    │         CASH FLOW OVER TIME                 │
                    │   (The Core Model - Everything Feeds Here)   │
                    └────────────────────┬────────────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
         ▼                               ▼                               ▼
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│  MARKET INPUTS  │            │  UNIT ECONOMICS │            │   COST MODEL    │
│─────────────────│            │─────────────────│            │─────────────────│
│ TAM/SAM/SOM     │            │ Price per unit  │            │ Fixed costs     │
│ Growth rate     │            │ COGS/margin     │            │ Variable costs  │
│ Market share    │            │ CAC/LTV         │            │ CapEx schedule  │
│ Customer count  │            │ Churn/retention │            │ Scaling costs   │
└────────┬────────┘            └────────┬────────┘            └────────┬────────┘
         │                               │                               │
         └───────────────────────────────┼───────────────────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │ Monthly Projection  │
                              │─────────────────────│
                              │ Month 1: -$50K      │
                              │ Month 2: -$45K      │
                              │ ...                 │
                              │ Month 14: Break-even│
                              │ ...                 │
                              │ Month 60: +$200K    │
                              └─────────────────────┘
```

### Why Cash Flow First?

1. **Investors think in cash flow** - NPV, IRR, payback period all derive from it
2. **Time reveals risks** - A model that works in steady state may never reach steady state
3. **Assumptions become concrete** - "10% market share" becomes "247 customers in month 18"
4. **Sensitivity is visible** - Change one assumption, see ripple through all 60 months

## Business Case Frameworks

### 1. Market Sizing (TAM/SAM/SOM)

```
TAM (Total Addressable Market)
│   "If we had 100% of everyone who could possibly buy"
│   Example: All physical therapist clinics globally that use software
│
├── SAM (Serviceable Addressable Market)
│   │   "Everyone we could realistically reach"
│   │   Example: Finnish PT clinics (geographic limit)
│   │
│   └── SOM (Serviceable Obtainable Market)
│       "What we can realistically capture in 3-5 years"
│       Example: 15% of Finnish PT clinics by year 5
```

**Two Approaches**:

| Approach | Method | Best For | Risk |
|----------|--------|----------|------|
| Top-Down | Start with TAM, apply % filters | Large markets, investor pitches | Overestimation |
| Bottom-Up | Count individual customers, multiply | Niche markets, operational planning | Underestimation |

**Best Practice**: Do both. If they diverge by >2x, investigate why.

### 2. Unit Economics Framework

```
Unit Economics for [Recurring Business Model]

Revenue Per Customer
├── Average Revenue Per User (ARPU)
│   └── Price × Usage frequency × Upsell factor
│
├── Lifetime Value (LTV)
│   └── ARPU × Average Customer Lifetime
│   └── = ARPU / Churn Rate (for recurring)
│
└── Customer Acquisition Cost (CAC)
    └── Total Sales & Marketing / New Customers Acquired

Key Ratios:
┌──────────────────────────────────────────────────┐
│ LTV:CAC Ratio     │ Target: 3:1+                 │
│ CAC Payback       │ Target: <12 months           │
│ Gross Margin      │ Target: 70%+ (SaaS)          │
│ Monthly Churn     │ Target: <2% (B2B SaaS)       │
└──────────────────────────────────────────────────┘
```

### 3. Competitive Analysis Framework

**Porter's Five Forces** (adapted for quick assessment):

| Force | Key Question | Red/Yellow/Green |
|-------|--------------|------------------|
| Rivalry | How many direct competitors? How differentiated? | Many undifferentiated = Red |
| New Entrants | How hard to copy us? | Easy to replicate = Red |
| Substitutes | What else solves this problem? | Many alternatives = Yellow |
| Buyer Power | How price-sensitive? How many options? | Commoditized = Red |
| Supplier Power | Are we dependent on key suppliers? | Single source = Red |

**Positioning Map** (visual differentiation):
```
                    High Price
                        │
                        │    ● Enterprise Players
                        │
    Low ─────────────────┼───────────────────── High
    Feature              │              Feature
    Set                  │    ◉ US      Set
                        │
                        │ ○ Budget Players
                        │
                    Low Price

◉ = Our position, ● = Competitors
```

## Market Research Methodologies

### Data Triangulation

Never trust a single source. Every key number should have 2-3 corroborating sources.

```
Data Point: "Finnish PT clinic software market size"

Source 1: Industry Report (Statista)
├── Method: Top-down estimate
├── Value: €4.2M
└── Confidence: Medium (global report, Finland extrapolated)

Source 2: Government Statistics
├── Method: Bottom-up (registered clinics × avg spend)
├── Value: €3.8M
└── Confidence: High (official data, but spend estimated)

Source 3: Competitor Analysis
├── Method: Sum of known players' revenue
├── Value: €3.1M
└── Confidence: Medium (public data limited)

Triangulated Estimate: €3.5-4.0M (weighted average with ranges)
```

### Research Confidence Levels

| Level | Source Type | Typical Accuracy | When to Use |
|-------|-------------|------------------|-------------|
| **High** | Primary research, official statistics | ±10% | Key assumptions |
| **Medium** | Industry reports, competitor analysis | ±25% | Supporting data |
| **Low** | Expert estimates, analogies | ±50% | Initial exploration |
| **Guess** | Rough order of magnitude | ±100% | Quick validation |

### Progressive Refinement Workflow

```
Stage 1: GUESS (5 minutes)
├── "SaaS for Finnish PTs"
├── Rough TAM: ~€5M (gut feeling from similar markets)
└── Confidence: Guess (±100%)

Stage 2: QUICK RESEARCH (30 minutes)
├── Find: Number of PT clinics in Finland (~2,000)
├── Find: Average software spend per clinic (~€200/month)
├── Calculate: 2,000 × €200 × 12 = €4.8M
└── Confidence: Low (±50%)

Stage 3: DEEP DIVE (2-4 hours)
├── Verify clinic count with official registry
├── Survey 10 clinics on actual software spending
├── Analyze 3 competitor pricing pages
├── Find industry report on healthcare software
└── Confidence: Medium (±25%)

Stage 4: PRIMARY RESEARCH (1-2 weeks)
├── Interview 20+ clinic owners
├── Run pricing sensitivity test
├── Analyze competitor financials (if available)
└── Confidence: High (±10%)
```

**Each stage is valid** - the tool should support all depths, clearly showing confidence level.

## Key Data Points by Business Model

### SaaS / Subscription

| Category | Data Point | Unit | Typical Range | Confidence Need |
|----------|------------|------|---------------|-----------------|
| **Market** | TAM | $ | Varies | Medium |
| | SAM | $ | 10-50% of TAM | Medium |
| | SOM | $ | 1-10% of SAM | Medium |
| | Market growth rate | %/year | 5-30% | Medium |
| **Customers** | Target segment size | count | Varies | High |
| | Current customers | count | Actual | High |
| | Monthly churn | % | 1-5% B2B, 5-15% B2C | High |
| | Growth rate | %/month | 5-20% early stage | Medium |
| **Pricing** | ARPU | $/month | Varies | High |
| | Price tier 1 | $/month | Varies | High |
| | Price tier 2 | $/month | Varies | High |
| | Annual discount | % | 10-20% | Low |
| **Economics** | Gross margin | % | 70-90% | High |
| | CAC | $ | Varies | High |
| | Sales cycle | months | 0.5-12 | Medium |
| | LTV | $ | ARPU/Churn | Derived |
| | LTV:CAC | ratio | 3:1 target | Derived |
| **Costs** | Engineering | $/month | Fixed + % rev | High |
| | Sales & Marketing | $/month | 20-40% of rev | High |
| | G&A | $/month | 10-15% of rev | Medium |
| | Hosting/Infra | $/month | 5-15% of rev | High |

### Marketplace / Platform

| Category | Data Point | Unit | Typical Range |
|----------|------------|------|---------------|
| **Supply Side** | Number of sellers | count | Varies |
| | Seller acquisition cost | $ | Varies |
| | Seller churn | %/month | 2-10% |
| **Demand Side** | Number of buyers | count | Varies |
| | Buyer acquisition cost | $ | Varies |
| | Transactions/buyer/month | count | Varies |
| **Transactions** | GMV (gross merchandise value) | $ | Varies |
| | Average order value | $ | Varies |
| | Take rate | % | 5-30% |
| | Net revenue | $ | GMV × Take rate |

### Hardware / Physical Product

| Category | Data Point | Unit | Typical Range |
|----------|------------|------|---------------|
| **Unit Economics** | Bill of Materials | $/unit | Varies |
| | Manufacturing cost | $/unit | Varies |
| | Shipping/fulfillment | $/unit | Varies |
| | Gross margin | % | 30-60% |
| **Sales** | Units sold | count/month | Varies |
| | Average selling price | $ | Varies |
| | Return rate | % | 1-10% |
| **Inventory** | Inventory turns | /year | 4-12 |
| | Days inventory | days | 30-90 |
| **CapEx** | Tooling/molds | $ | Upfront |
| | Certification | $ | Upfront |

## Calculation Formulas

### Core Financial Metrics

```
Monthly Revenue = Customers × ARPU

Gross Profit = Revenue - COGS
Gross Margin = Gross Profit / Revenue × 100

EBITDA = Gross Profit - OpEx

Net Cash Flow = EBITDA - CapEx - Tax

Cumulative Cash = Sum of Net Cash Flow (all prior months)
```

### SaaS Metrics

```
MRR (Monthly Recurring Revenue) = Active Customers × ARPU

ARR (Annual Recurring Revenue) = MRR × 12

Net Revenue Retention = (Starting MRR + Expansion - Churn) / Starting MRR
  • Target: >100% (expansion exceeds churn)

CAC Payback = CAC / (ARPU × Gross Margin)
  • Result in months

LTV = ARPU × Gross Margin × Customer Lifetime
    = ARPU × Gross Margin / Monthly Churn Rate (for stable churn)

LTV:CAC = LTV / CAC
  • Target: >3:1

Magic Number = Net New ARR / Prior Quarter S&M Spend
  • >0.75 = efficient growth
```

### Valuation Metrics

```
NPV (Net Present Value) = Σ (Cash Flow_t / (1 + r)^t)
  where r = discount rate (typically 10-20% for startups)

IRR (Internal Rate of Return) = r where NPV = 0
  • Find iteratively

Payback Period = Month where Cumulative Cash Flow turns positive

Break-even = Month where Monthly Cash Flow = 0
```

## Quality Indicators

### What Makes a Business Case Credible?

| Indicator | Good | Warning | Red Flag |
|-----------|------|---------|----------|
| **Data Sources** | 3+ sources per key number | 1-2 sources | No sources cited |
| **Confidence Levels** | Explicit uncertainty ranges | Point estimates only | Made-up precision |
| **Methodology** | Top-down AND bottom-up agree | Only one approach | Neither documented |
| **Assumptions** | Clearly stated, testable | Implicit/hidden | Unrealistic |
| **Sensitivity** | Key drivers identified | Some analysis | None |
| **Scenario Planning** | Base/Bull/Bear cases | Only one scenario | Only bull case |
| **Time Horizon** | 3-5 years with monthly granularity | Vague timelines | "In the future" |

### Common Business Case Mistakes

1. **Hockey Stick Syndrome**
   - Problem: Revenue flat then suddenly explodes
   - Fix: Explain the inflection point mechanism

2. **Magical Market Share**
   - Problem: "We'll get 10% of market" with no customer acquisition plan
   - Fix: Build bottom-up from CAC and marketing budget

3. **Gross Margin Confusion**
   - Problem: Forgetting to subtract COGS, showing 100% margin
   - Fix: Always model true unit economics

4. **Fixed Cost Flatness**
   - Problem: Costs stay flat as revenue 10x
   - Fix: Model step functions (need more staff at thresholds)

5. **Ignoring Competition**
   - Problem: "No competition" (always false)
   - Fix: If no direct competitors, explain what customers do today

6. **Precision Theater**
   - Problem: "$4,237,891 in Year 3 revenue"
   - Fix: Show ranges that reflect actual uncertainty

7. **Survivor Bias in Comparables**
   - Problem: "Uber grew 50%/month, so will we"
   - Fix: Sample from similar companies, not just unicorns

## Output Formats

### 1. Quick Estimate Card (30-second read)

```
┌─────────────────────────────────────────────────────┐
│ SaaS for Finnish Physical Therapists               │
├─────────────────────────────────────────────────────┤
│ TAM: €4-5M  │  Year 5 Revenue: €400-600K           │
│ SAM: €2-3M  │  Break-even: Month 18-24             │
│ SOM: €0.5M  │  Total Funding Need: €150-200K       │
├─────────────────────────────────────────────────────┤
│ Confidence: ●●●○○ (Low - based on quick estimates) │
│ Key Risk: Small market, need 10%+ share to scale   │
└─────────────────────────────────────────────────────┘
```

### 2. Executive Summary (2-minute read)

- **One paragraph** opportunity summary
- **Key metrics table** (TAM, Year 5 Revenue, Break-even, Funding)
- **3 bullet points** why this works
- **3 bullet points** key risks
- **One chart** cumulative cash flow over time

### 3. Full Business Case (20-minute read)

1. Executive Summary
2. Market Analysis
   - Market sizing (TAM/SAM/SOM)
   - Competitive landscape
   - Target customer profile
3. Business Model
   - Revenue model
   - Unit economics
   - Growth assumptions
4. Financial Projections
   - 5-year P&L summary
   - Monthly cash flow (first 2 years detailed)
   - Key metrics dashboard
5. Risk Analysis
   - Sensitivity analysis
   - Scenario comparison (Base/Bull/Bear)
   - Key assumptions to test
6. Funding Requirements
   - Use of funds
   - Milestones
   - Return projections

### 4. Presentation Deck (10-12 slides)

| Slide | Content | Time |
|-------|---------|------|
| 1 | Title + One-liner | 15s |
| 2 | Problem | 30s |
| 3 | Solution | 30s |
| 4 | Market Size | 30s |
| 5 | Business Model | 45s |
| 6 | Traction/Proof | 30s |
| 7 | Competition | 30s |
| 8 | Go-to-Market | 30s |
| 9 | Financials (Summary) | 45s |
| 10 | Team | 30s |
| 11 | Ask | 30s |
| 12 | Appendix (detailed financials) | Reference |

## Industry-Specific Templates

### Template: B2B SaaS

**Key Characteristics**:
- Recurring revenue (monthly/annual subscriptions)
- High gross margins (70-90%)
- Sales-driven or product-led growth
- Long customer lifetimes if sticky

**Critical Metrics**:
```
MRR Growth Rate:  Target >10%/month early, >5%/month growth stage
Net Revenue Retention: Target >110%
CAC Payback: Target <12 months
LTV:CAC: Target >3:1
Monthly Churn: Target <2%
```

**Revenue Model**:
```
Month N Revenue = Month N-1 Customers × (1 - Churn) × ARPU
                + New Customers × ARPU
                + Expansion Revenue
```

### Template: B2B Marketplace

**Key Characteristics**:
- Two-sided market (buyers + sellers)
- GMV-driven (take rate on transactions)
- Network effects (value increases with participants)
- Chicken-and-egg launch challenge

**Critical Metrics**:
```
GMV Growth: Target >20%/month early
Take Rate: Typical 5-30% depending on category
Liquidity: % of listings that transact
Repeat Rate: % of buyers who return
```

**Revenue Model**:
```
GMV = Active Sellers × Listings/Seller × Conversion Rate × AOV
Net Revenue = GMV × Take Rate
```

### Template: Consumer Subscription

**Key Characteristics**:
- Monthly/annual subscriptions
- Higher churn than B2B (5-15%/month)
- Often freemium conversion model
- Marketing-driven acquisition

**Critical Metrics**:
```
Trial-to-Paid Conversion: Target >3% (freemium) or >30% (free trial)
Monthly Churn: Target <8%
ARPU: Typical $5-50/month
LTV: Typical $50-500
```

### Template: Hardware Product

**Key Characteristics**:
- Upfront CapEx (tooling, certification)
- Inventory risk
- Lower margins than software
- Longer sales cycles

**Critical Metrics**:
```
Gross Margin: Target >40%
Inventory Turns: Target >6/year
Return Rate: Target <5%
Reorder Rate: If consumable, key metric
```

**Revenue Model**:
```
Revenue = Units Sold × ASP
Gross Profit = Revenue - (Units × COGS) - Shipping - Returns
```

## Example Workflow: Finnish PT SaaS

### User Query
> "I want to build a SaaS for physical therapists in Finland to manage their patient bookings and notes."

### Stage 1: Quick Estimate (AI-assisted, 2 minutes)

**Market Sizing**:
- ~2,000 PT clinics in Finland (quick search)
- ~€150/month typical software spend (assumption)
- TAM = 2,000 × €150 × 12 = €3.6M

**Unit Economics** (standard SaaS):
- Price: €99/month (SMB pricing)
- CAC: €500 (estimate)
- Churn: 3%/month (SMB typical)
- LTV: €99 × 0.7 / 0.03 = €2,310
- LTV:CAC = 4.6:1 ✓

**Quick Assessment**:
- Small but viable niche
- Strong unit economics potential
- Risk: Market too small to scale big

### Stage 2: Research Deep Dive (AI-assisted, 30 minutes)

**Market Validation**:
1. Finnish PT association lists 3,200 registered PTs
2. Clinic count verified: ~1,800 clinics (some PTs work in hospitals)
3. Interview snippet: "We pay €120/month for current booking system"
4. Competitor analysis: 2 local players, 1 international

**Refined Model**:
- SAM: 1,800 clinics × €120 × 12 = €2.6M
- SOM (5-year target): 15% = €390K ARR
- Break-even: ~150 customers at €99/month
- Funding need: ~€120K for 18 months runway

### Stage 3: Full Business Case

[Full 60-month model with all assumptions, sensitivity analysis, scenario comparison]

**Key Outputs**:
- Break-even: Month 22
- 5-year cumulative cash flow: €450K
- NPV (15% discount): €280K
- IRR: 45%

**Confidence**: Medium (based on secondary research, needs primary validation)

**Key Risks**:
1. Small market limits exit potential
2. Incumbents may respond with price cuts
3. Finnish language requirement limits team options

## Appendix: Data Point Sourcing Guide

### Where to Find Market Data

| Data Type | Free Sources | Paid Sources |
|-----------|--------------|--------------|
| Market Size | Government statistics, trade associations, news | Statista, IBISWorld, Gartner |
| Company Data | Press releases, LinkedIn, Crunchbase | PitchBook, D&B |
| Pricing | Competitor websites, G2/Capterra | Sales intelligence tools |
| Demographics | Census data, Eurostat, World Bank | Nielsen, Experian |
| Industry Trends | Google Trends, industry blogs | McKinsey, BCG, Forrester |

### Quality Assessment Questions

For every data point, ask:
1. **Source**: Where did this number come from?
2. **Date**: How recent is this data?
3. **Methodology**: How was it calculated?
4. **Bias**: What incentive might the source have to skew this?
5. **Corroboration**: Does any other source confirm this?
