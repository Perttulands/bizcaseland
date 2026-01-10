import { BusinessData } from '@/core/types';
import { MarketData } from '@/core/types/market';
import { OpexItem } from '@/types/business-data';

export const createMockBusinessData = (overrides: Partial<BusinessData> = {}): BusinessData => ({
  meta: {
    title: 'Test Business Case',
    description: 'Mock data for testing calculations',
    business_model: 'recurring',
    currency: 'EUR',
    periods: 24,
    frequency: 'monthly',
    ...overrides.meta
  },
  assumptions: {
    pricing: {
      avg_unit_price: { value: 100, unit: 'EUR', rationale: 'Average market price' },
      ...overrides.assumptions?.pricing
    },
    unit_economics: {
      cogs_pct: { value: 0.3, unit: '%', rationale: 'Industry standard' },
      cac: { value: 50, unit: 'EUR', rationale: 'Marketing efficiency' },
      ...overrides.assumptions?.unit_economics
    },
    financial: {
      interest_rate: { value: 0.12, unit: '%', rationale: 'Market rate' },
      ...overrides.assumptions?.financial
    },
    customers: {
      churn_pct: { value: 0.05, unit: '%', rationale: 'Low churn assumption' },
      segments: [
        {
          id: 'segment1',
          label: 'Primary Segment',
          rationale: 'Main customer base',
          volume: {
            type: 'pattern',
            pattern_type: 'linear_growth',
            series: [{ period: 1, value: 100, unit: 'customers', rationale: 'Initial volume' }],
            monthly_flat_increase: { value: 10, unit: 'customers', rationale: 'Steady growth' }
          }
        }
      ],
      ...overrides.assumptions?.customers
    },
    opex: overrides.assumptions?.opex || [
      { name: 'Sales & Marketing', value: { value: 5000, unit: 'EUR', rationale: 'Marketing budget' } } as OpexItem,
      { name: 'R&D', value: { value: 3000, unit: 'EUR', rationale: 'Development costs' } } as OpexItem,
      { name: 'G&A', value: { value: 2000, unit: 'EUR', rationale: 'General admin' } } as OpexItem
    ],
    capex: [],
    growth_settings: {
      seasonal_growth: {
        base_year_total: { value: 1200, unit: 'customers', rationale: 'Annual baseline' },
        seasonality_index_12: { value: [1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3], unit: 'multiplier', rationale: 'Seasonal pattern' },
        yoy_growth: { value: 0.15, unit: '%', rationale: 'Market growth rate' }
      },
      geom_growth: {
        start: { value: 100, unit: 'customers', rationale: 'Starting volume' },
        monthly_growth: { value: 0.05, unit: '%', rationale: 'Growth rate' }
      },
      linear_growth: {
        start: { value: 100, unit: 'customers', rationale: 'Starting volume' },
        monthly_flat_increase: { value: 10, unit: 'customers', rationale: 'Monthly increase' }
      }
    },
    ...overrides.assumptions
  },
  ...overrides
});

export const createMockMonthlyData = () => [
  {
    month: 1,
    date: new Date('2026-01-01'),
    salesVolume: 100,
    newCustomers: 100,
    existingCustomers: 0,
    unitPrice: 100,
    revenue: 10000,
    cogs: -3000,
    grossProfit: 7000,
    salesMarketing: -5000,
    totalCAC: -5000,
    cac: 50,
    rd: -3000,
    ga: -2000,
    totalOpex: -15000,
    ebitda: -8000,
    capex: 0,
    netCashFlow: -8000
  },
  {
    month: 2,
    date: new Date('2026-02-01'),
    salesVolume: 110,
    newCustomers: 15,
    existingCustomers: 95,
    unitPrice: 100,
    revenue: 11000,
    cogs: -3300,
    grossProfit: 7700,
    salesMarketing: -5000,
    totalCAC: -750,
    cac: 50,
    rd: -3000,
    ga: -2000,
    totalOpex: -10750,
    ebitda: -3050,
    capex: 0,
    netCashFlow: -3050
  },
  {
    month: 3,
    date: new Date('2026-03-01'),
    salesVolume: 120,
    newCustomers: 25,
    existingCustomers: 104,
    unitPrice: 100,
    revenue: 12000,
    cogs: -3600,
    grossProfit: 8400,
    salesMarketing: -5000,
    totalCAC: -1250,
    cac: 50,
    rd: -3000,
    ga: -2000,
    totalOpex: -11250,
    ebitda: -2850,
    capex: 0,
    netCashFlow: -2850
  }
];

export const createMockCostSavingsData = (overrides: Partial<BusinessData> = {}): BusinessData => ({
  meta: {
    title: 'AI Invoice Processing Implementation',
    description: 'Cost savings and efficiency gains from implementing AI-powered invoice processing system',
    business_model: 'cost_savings',
    archetype: 'Process Automation',
    currency: 'EUR',
    periods: 36,
    frequency: 'monthly',
    ...overrides.meta
  },
  assumptions: {
    financial: {
      interest_rate: { value: 0.08, unit: '%', rationale: 'Company WACC' },
      ...overrides.assumptions?.financial
    },
    cost_savings: {
      baseline_costs: [
        {
          id: 'manual_processing',
          label: 'Manual Invoice Processing',
          category: 'operational',
          current_monthly_cost: { value: 25000, unit: 'EUR', rationale: '5 FTE @ €5k monthly cost' },
          savings_potential_pct: { value: 70, unit: '%', rationale: 'AI can process 70% of invoices automatically' },
          implementation_timeline: {
            start_month: 1,
            ramp_up_months: 6,
            full_implementation_month: 7
          }
        },
        {
          id: 'error_handling',
          label: 'Error Correction & Rework',
          category: 'operational',
          current_monthly_cost: { value: 8000, unit: 'EUR', rationale: 'Estimated cost of processing errors and corrections' },
          savings_potential_pct: { value: 80, unit: '%', rationale: 'AI reduces error rates significantly' },
          implementation_timeline: {
            start_month: 3,
            ramp_up_months: 4,
            full_implementation_month: 7
          }
        },
        {
          id: 'audit_preparation',
          label: 'Audit Preparation Time',
          category: 'administrative',
          current_monthly_cost: { value: 3000, unit: 'EUR', rationale: 'Monthly effort for audit trail preparation' },
          savings_potential_pct: { value: 60, unit: '%', rationale: 'Automated audit trails and reporting' },
          implementation_timeline: {
            start_month: 6,
            ramp_up_months: 3,
            full_implementation_month: 9
          }
        }
      ],
      efficiency_gains: [
        {
          id: 'processing_speed',
          label: 'Invoice Processing Speed',
          metric: 'invoices per hour',
          baseline_value: { value: 12, unit: 'invoices/hour', rationale: 'Current manual processing rate' },
          improved_value: { value: 120, unit: 'invoices/hour', rationale: 'AI processing speed' },
          value_per_unit: { value: 2.5, unit: 'EUR', rationale: 'Value of faster processing per invoice' },
          implementation_timeline: {
            start_month: 2,
            ramp_up_months: 5,
            full_implementation_month: 7
          }
        },
        {
          id: 'accuracy_improvement',
          label: 'Data Accuracy Improvement',
          metric: 'error reduction',
          baseline_value: { value: 100, unit: 'errors/month', rationale: 'Current monthly error rate' },
          improved_value: { value: 15, unit: 'errors/month', rationale: 'AI-reduced error rate' },
          value_per_unit: { value: 45, unit: 'EUR', rationale: 'Cost to fix each error' },
          implementation_timeline: {
            start_month: 3,
            ramp_up_months: 4,
            full_implementation_month: 7
          }
        }
      ],
      ...overrides.assumptions?.cost_savings
    },
    opex: [
      { name: 'AI Platform License', value: { value: 8000, unit: 'EUR', rationale: 'Monthly SaaS license fees' } },
      { name: 'Training & Support', value: { value: 2000, unit: 'EUR', rationale: 'Ongoing training and support costs' } },
      { name: 'System Integration', value: { value: 1500, unit: 'EUR', rationale: 'Integration maintenance costs' } }
    ],
    capex: [
      {
        name: 'Implementation & Setup',
        timeline: {
          type: 'time_series',
          series: [
            { period: 1, value: 50000, unit: 'EUR', rationale: 'Initial setup and configuration' },
            { period: 2, value: 30000, unit: 'EUR', rationale: 'Integration and testing' },
            { period: 3, value: 20000, unit: 'EUR', rationale: 'Training and change management' }
          ]
        }
      }
    ],
    ...overrides.assumptions
  },
  drivers: [
    {
      key: 'Implementation Speed',
      path: 'assumptions.cost_savings.baseline_costs.0.implementation_timeline.ramp_up_months',
      range: [3, 12],
      rationale: 'Speed of AI system implementation and user adoption'
    },
    {
      key: 'Processing Savings %',
      path: 'assumptions.cost_savings.baseline_costs.0.savings_potential_pct.value',
      range: [50, 85],
      rationale: 'Percentage of manual processing work that can be automated'
    },
    {
      key: 'Error Reduction %',
      path: 'assumptions.cost_savings.baseline_costs.1.savings_potential_pct.value',
      range: [60, 90],
      rationale: 'Percentage reduction in processing errors'
    }
  ],
  ...overrides
});

export const createMockMarketAnalysisData = (overrides: Partial<BusinessData> = {}): BusinessData => ({
  meta: {
    title: 'SaaS Market Entry Strategy',
    description: 'Market analysis for enterprise SaaS solution targeting mid-market companies',
    business_model: 'recurring',
    archetype: 'Market Expansion',
    currency: 'EUR',
    periods: 60,
    frequency: 'monthly',
    ...overrides.meta
  },
  assumptions: {
    pricing: {
      avg_unit_price: { value: 2500, unit: 'EUR', rationale: 'Annual subscription per customer' },
      yearly_adjustments: {
        pricing_factors: [
          { year: 1, factor: 1.0, rationale: 'Year 1: Market entry pricing' },
          { year: 2, factor: 1.08, rationale: 'Year 2: 8% price increase after market validation' },
          { year: 3, factor: 1.15, rationale: 'Year 3: Premium positioning with enhanced features' }
        ]
      },
      ...overrides.assumptions?.pricing
    },
    financial: {
      interest_rate: { value: 0.10, unit: '%', rationale: 'Company cost of capital' },
      ...overrides.assumptions?.financial
    },
    customers: {
      churn_pct: { value: 0.05, unit: '%', rationale: 'Enterprise SaaS average churn rate' },
      segments: [
        {
          id: 'enterprise',
          label: 'Mid-Market Enterprise',
          rationale: 'Companies with 100-1000 employees',
          volume: {
            type: 'pattern',
            pattern_type: 'geom_growth',
            series: [{ period: 1, value: 50, unit: 'customers', rationale: 'Initial customer base' }],
            monthly_growth_rate: { value: 0.08, unit: '%', rationale: '8% monthly growth through market penetration' },
            yearly_adjustments: {
              volume_factors: [
                { year: 1, factor: 1.0, rationale: 'Year 1: Building foundation' },
                { year: 2, factor: 1.3, rationale: 'Year 2: Market recognition and referrals boost' },
                { year: 3, factor: 1.1, rationale: 'Year 3: Market saturation effects' }
              ]
            }
          }
        }
      ],
      ...overrides.assumptions?.customers
    },
    unit_economics: {
      cogs_pct: { value: 0.25, unit: '%', rationale: 'SaaS infrastructure and support costs' },
      cac: { value: 1200, unit: 'EUR', rationale: 'Sales and marketing cost per customer acquisition' },
      ...overrides.assumptions?.unit_economics
    },
    opex: [
      { name: 'Sales & Marketing', value: { value: 45000, unit: 'EUR', rationale: 'Aggressive customer acquisition strategy' } },
      { name: 'R&D', value: { value: 35000, unit: 'EUR', rationale: 'Product development and innovation' } },
      { name: 'G&A', value: { value: 15000, unit: 'EUR', rationale: 'General administration and overhead' } }
    ],
    capex: [
      {
        name: 'Platform Development',
        timeline: {
          type: 'time_series',
          series: [
            { period: 1, value: 150000, unit: 'EUR', rationale: 'Initial platform development investment' },
            { period: 6, value: 75000, unit: 'EUR', rationale: 'Mid-year platform enhancement' },
            { period: 13, value: 100000, unit: 'EUR', rationale: 'Year 2: Major feature development' },
            { period: 25, value: 50000, unit: 'EUR', rationale: 'Year 3: Infrastructure scaling' }
          ]
        }
      }
    ],
    ...overrides.assumptions
  },
  drivers: [
    {
      key: 'Customer Acquisition Cost',
      path: 'assumptions.unit_economics.cac.value',
      range: [800, 2000],
      rationale: 'CAC efficiency directly impacts profitability and growth sustainability'
    },
    {
      key: 'Annual Contract Value',
      path: 'assumptions.pricing.avg_unit_price.value',
      range: [2000, 4000],
      rationale: 'Pricing strategy affects competitive positioning and customer adoption'
    }
  ],
  ...overrides
});

export const createMockMarketData = (overrides: Partial<MarketData> = {}): MarketData => ({
  schema_version: '1.0',
  meta: {
    title: 'Test Market Analysis',
    description: 'Mock market data for testing calculations',
    currency: 'EUR',
    base_year: 2024,
    analysis_horizon_years: 5,
    created_date: '2024-01-01',
    analyst: 'Test Analyst',
    ...overrides.meta
  },
  market_sizing: {
    total_addressable_market: {
      base_value: { value: 2500000000, unit: 'EUR', rationale: 'European enterprise software market size' },
      growth_rate: { value: 12, unit: 'percentage_per_year', rationale: 'Enterprise SaaS market growing at 12% annually' },
      market_definition: 'Mid-market enterprise software solutions in Europe',
      data_sources: ['Industry Report 2024', 'Government Statistics', 'Company Research']
    },
    serviceable_addressable_market: {
      percentage_of_tam: { value: 8, unit: 'percentage', rationale: 'Mid-market segment represents 8% of total enterprise market' },
      geographic_constraints: 'Limited to DACH region initially',
      regulatory_constraints: 'GDPR compliance required',
      capability_constraints: 'Local language support needed'
    },
    serviceable_obtainable_market: {
      percentage_of_sam: { value: 15, unit: 'percentage', rationale: 'Realistic penetration given our resources and positioning' },
      resource_constraints: 'Limited sales team capacity',
      competitive_barriers: 'Established competitors with strong relationships',
      time_constraints: '3-year market entry timeline'
    },
    ...overrides.market_sizing
  },
  market_share: {
    current_position: {
      current_share: { value: 0.1, unit: 'percentage', rationale: 'Currently 0.1% market share as new entrant' },
      market_entry_date: '2024-01-01',
      current_revenue: { value: 250000, unit: 'EUR_per_year', rationale: 'Initial revenue from pilot customers' }
    },
    target_position: {
      target_share: { value: 2.5, unit: 'percentage', rationale: 'Target 2.5% market share within 5 years' },
      target_timeframe: { value: 5, unit: 'years', rationale: '5-year strategic plan horizon' },
      penetration_strategy: 'exponential',
      key_milestones: [
        {
          year: 1,
          milestone: 'Market validation and initial traction',
          target_share: 0.3,
          rationale: 'Focus on proving product-market fit'
        },
        {
          year: 3,
          milestone: 'Established market presence',
          target_share: 1.2,
          rationale: 'Scaled sales and marketing operations'
        }
      ]
    }
  } as any,
  ...(overrides.market_share && { market_share: overrides.market_share }),
  competitive_landscape: {
    market_structure: {
      concentration_level: 'moderately_concentrated',
      concentration_rationale: 'Top 4 players control 60% of market',
      barriers_to_entry: 'medium',
      barriers_description: 'Requires significant technical expertise and sales relationships'
    },
    competitors: [
      {
        name: 'Market Leader Corp',
        market_share: { value: 35, unit: 'percentage', rationale: 'Dominant player with legacy enterprise solutions' },
        positioning: 'Enterprise-focused, high-touch sales model',
        strengths: ['Brand recognition', 'Enterprise relationships'],
        weaknesses: ['Legacy technology', 'Slow innovation'],
        threat_level: 'high',
        competitive_response: 'Likely to improve product features and pricing'
      },
      {
        name: 'Agile Solutions Inc',
        market_share: { value: 22, unit: 'percentage', rationale: 'Strong mid-market presence with modern platform' },
        positioning: 'Mid-market specialist with self-service onboarding',
        strengths: ['Modern platform', 'Good pricing'],
        weaknesses: ['Limited enterprise features', 'Smaller team'],
        threat_level: 'medium',
        competitive_response: 'May accelerate feature development'
      }
    ],
    competitive_advantages: [
      {
        advantage: 'AI-powered automation',
        sustainability: 'high',
        rationale: 'Patent-protected technology with significant R&D investment'
      }
    ],
    ...overrides.competitive_landscape
  },
  customer_analysis: {
    market_segments: [
      {
        id: 'manufacturing',
        name: 'Manufacturing',
        size_percentage: { value: 35, unit: 'percentage', rationale: 'Largest segment within mid-market enterprise' },
        size_value: { value: 500000000, unit: 'EUR', rationale: 'Estimated segment size' },
        growth_rate: { value: 10, unit: 'percentage_per_year', rationale: 'Manufacturing digitization driving growth' },
        demographics: 'Mid-size manufacturers with 100-1000 employees',
        pain_points: 'Manual processes, high error rates',
        customer_profile: 'Mid-size manufacturers with 100-1000 employees',
        value_drivers: ['Process automation', 'Cost reduction', 'Quality improvement'],
        entry_strategy: 'Partner with manufacturing consultants'
      }
    ]
  } as any,
  ...(overrides.customer_analysis && { customer_analysis: overrides.customer_analysis }),
  ...overrides
} as any);