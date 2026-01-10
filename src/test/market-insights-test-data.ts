/**
 * Market Insights Test Data
 * 
 * Comprehensive test data scenarios for market insights cart testing,
 * covering various market analysis situations and edge cases.
 */

import { MarketData } from '@/core/types';

// ===== BASIC SAAS PLATFORM SCENARIO =====

export const saasMarketData: MarketData = {
  schema_version: "1.0",
  meta: {
    title: "European SaaS Customer Service Platform",
    description: "Market analysis for SMB customer service software in Europe",
    currency: "EUR",
    base_year: 2024,
    analysis_horizon_years: 5,
    created_date: "2024-01-15",
    analyst: "Market Research Team"
  },
  market_sizing: {
    total_addressable_market: {
      base_value: { 
        value: 2500000, 
        unit: "EUR", 
        rationale: "European SMB customer service software market" 
      },
      growth_rate: { 
        value: 8.5, 
        unit: "percentage_per_year", 
        rationale: "Strong SaaS market growth driven by digital transformation" 
      },
      market_definition: "Small to medium business customer service and support software solutions",
      data_sources: ["Gartner Market Guide", "EU SMB Survey 2024", "Industry association reports"]
    },
    serviceable_addressable_market: {
      percentage_of_tam: { 
        value: 65, 
        unit: "percentage", 
        rationale: "Accessible market considering geographic reach and product fit" 
      },
      geographic_constraints: "EU27 countries with English/local language support",
      regulatory_constraints: "GDPR compliance required",
      capability_constraints: "Cloud-based solutions only"
    },
    serviceable_obtainable_market: {
      percentage_of_sam: { 
        value: 35, 
        unit: "percentage", 
        rationale: "Realistic market capture considering competition and resources" 
      },
      resource_constraints: "Limited to €2M marketing budget in first 3 years",
      competitive_barriers: "Established players with strong brand recognition",
      time_constraints: "18-month product development timeline"
    }
  },
  market_share: {
    current_position: {
      current_share: { 
        value: 0, 
        unit: "percentage", 
        rationale: "New market entrant" 
      },
      market_entry_date: "2024-Q3",
      current_revenue: { 
        value: 0, 
        unit: "EUR_per_year", 
        rationale: "Pre-revenue stage" 
      }
    },
    target_position: {
      target_share: { 
        value: 12, 
        unit: "percentage", 
        rationale: "Aggressive but achievable 5-year target based on product differentiation" 
      },
      target_timeframe: {
        value: 5,
        unit: "years",
        rationale: "Strategic 5-year growth plan"
      },
      penetration_strategy: "exponential" as const,
      key_milestones: [
        {
          year: 1,
          milestone: "Market entry and pilot customers",
          target_share: 0.5,
          rationale: "Initial traction with early adopters"
        },
        {
          year: 2,
          milestone: "Product-market fit validation",
          target_share: 2.0,
          rationale: "Expansion after validation"
        },
        {
          year: 3,
          milestone: "Scale phase initiation",
          target_share: 5.0,
          rationale: "Accelerated growth phase"
        },
        {
          year: 5,
          milestone: "Market leadership position",
          target_share: 12.0,
          rationale: "Established market position"
        }
      ]
    }
  },
  competitive_landscape: {
    competitors: [
      {
        name: "Zendesk",
        market_share: { 
          value: 28, 
          unit: "percentage", 
          rationale: "Market leader with strong brand" 
        },
        positioning: "Enterprise-focused, feature-rich platform",
        strengths: ["Brand recognition", "Feature completeness", "Integration ecosystem"],
        weaknesses: ["High pricing", "Complex setup", "Over-engineered for SMBs"],
        threat_level: "high" as const,
        competitive_response: "Price competition and feature parity"
      },
      {
        name: "Freshworks",
        market_share: { 
          value: 18, 
          unit: "percentage", 
          rationale: "Strong SMB focus" 
        },
        positioning: "SMB-friendly, affordable solution",
        strengths: ["SMB focus", "Competitive pricing", "Ease of use"],
        weaknesses: ["Limited enterprise features", "Regional presence"],
        threat_level: "high" as const,
        competitive_response: "Feature enhancement and market expansion"
      },
      {
        name: "Intercom",
        market_share: { 
          value: 15, 
          unit: "percentage", 
          rationale: "Strong in messaging and chat" 
        },
        positioning: "Modern messaging-first approach",
        strengths: ["Modern UI/UX", "Messaging focus", "Developer-friendly"],
        weaknesses: ["Limited traditional ticketing", "Higher cost"],
        threat_level: "medium" as const,
        competitive_response: "Platform expansion to traditional support"
      }
    ],
    competitive_advantages: [
      {
        advantage: "AI-powered automation",
        sustainability: "high" as const,
        rationale: "Proprietary AI models with continuous learning"
      },
      {
        advantage: "European data residency",
        sustainability: "medium" as const,
        rationale: "GDPR compliance advantage, but can be replicated"
      },
      {
        advantage: "SMB-optimized pricing",
        sustainability: "low" as const,
        rationale: "Easily copied by competitors"
      }
    ]
  },
  customer_analysis: {
    market_segments: [
      {
        id: "tech_startups",
        name: "Technology Startups",
        size_percentage: { 
          value: 25, 
          unit: "percentage", 
          rationale: "High-growth segment with strong digital adoption" 
        },
        growth_rate: { 
          value: 15, 
          unit: "percentage_per_year", 
          rationale: "Rapid growth in European tech ecosystem" 
        },
        target_share: { 
          value: 20, 
          unit: "percentage", 
          rationale: "Primary target with highest willingness to pay" 
        },
        customer_profile: "Fast-growing technology companies with 10-200 employees needing scalable support",
        value_drivers: ["Scalability", "Integration capabilities", "Modern user experience"],
        entry_strategy: "Direct sales with product-led growth model"
      },
      {
        id: "ecommerce_retailers",
        name: "E-commerce Retailers",
        size_percentage: { 
          value: 35, 
          unit: "percentage", 
          rationale: "Largest segment with high support volume needs" 
        },
        growth_rate: { 
          value: 12, 
          unit: "percentage_per_year", 
          rationale: "Continued e-commerce growth post-pandemic" 
        },
        target_share: { 
          value: 15, 
          unit: "percentage", 
          rationale: "Secondary target with volume potential" 
        },
        customer_profile: "Online retailers with 5-500 employees handling high customer inquiry volumes",
        value_drivers: ["Volume handling", "Multi-channel support", "Cost efficiency"],
        entry_strategy: "Partner channel through e-commerce platforms"
      },
      {
        id: "professional_services",
        name: "Professional Services",
        size_percentage: { 
          value: 20, 
          unit: "percentage", 
          rationale: "Stable segment with consistent needs" 
        },
        growth_rate: { 
          value: 6, 
          unit: "percentage_per_year", 
          rationale: "Steady growth in professional services sector" 
        },
        target_share: { 
          value: 8, 
          unit: "percentage", 
          rationale: "Tertiary target requiring customization" 
        },
        customer_profile: "Consulting, legal, and accounting firms with 20-1000 employees",
        value_drivers: ["Professional image", "Compliance features", "Client management integration"],
        entry_strategy: "Industry-specific partnerships and referrals"
      },
      {
        id: "healthcare_providers",
        name: "Healthcare Providers",
        size_percentage: { 
          value: 12, 
          unit: "percentage", 
          rationale: "Specialized segment with regulatory requirements" 
        },
        growth_rate: { 
          value: 8, 
          unit: "percentage_per_year", 
          rationale: "Digital health transformation" 
        },
        target_share: { 
          value: 5, 
          unit: "percentage", 
          rationale: "Niche segment requiring specialized approach" 
        },
        customer_profile: "Private healthcare providers and clinics with patient support needs",
        value_drivers: ["HIPAA compliance", "Patient privacy", "Integration with health systems"],
        entry_strategy: "Healthcare-specific partnerships and compliance positioning"
      },
      {
        id: "financial_services",
        name: "Financial Services",
        size_percentage: { 
          value: 8, 
          unit: "percentage", 
          rationale: "Small but high-value segment" 
        },
        growth_rate: { 
          value: 4, 
          unit: "percentage_per_year", 
          rationale: "Steady fintech growth" 
        },
        target_share: { 
          value: 3, 
          unit: "percentage", 
          rationale: "Specialized segment with high barriers" 
        },
        customer_profile: "Fintech companies and small financial institutions",
        value_drivers: ["Security", "Regulatory compliance", "Audit trails"],
        entry_strategy: "Security-first positioning with compliance expertise"
      }
    ],
    customer_economics: {
      average_customer_value: {
        annual_value: { 
          value: 3600, 
          unit: "EUR_per_customer_per_year", 
          rationale: "Average across all segments based on tiered pricing" 
        },
        lifetime_value: { 
          value: 14400, 
          unit: "EUR_per_customer", 
          rationale: "4-year average customer lifetime" 
        },
        acquisition_cost: { 
          value: 720, 
          unit: "EUR_per_customer", 
          rationale: "20% of annual value including sales and marketing costs" 
        }
      },
      customer_behavior: {
        purchase_frequency: { 
          value: 1, 
          unit: "purchases_per_year", 
          rationale: "Annual subscription model with monthly payment option" 
        },
        loyalty_rate: {
          value: 88,
          unit: "percentage",
          rationale: "High switching costs in customer service software"
        },
        referral_rate: {
          value: 25,
          unit: "percentage",
          rationale: "Strong word-of-mouth in SMB community"
        }
      }
    }
  }
};

// ===== FINTECH MARKET ENTRY SCENARIO =====

export const fintechMarketData: MarketData = {
  schema_version: "1.0",
  meta: {
    title: "Digital Banking Platform for SMEs",
    description: "Market analysis for digital banking solutions targeting European SMEs",
    currency: "EUR",
    base_year: 2024,
    analysis_horizon_years: 7,
    created_date: "2024-02-01",
    analyst: "Financial Services Research Team"
  },
  market_sizing: {
    total_addressable_market: {
      base_value: { 
        value: 15000000, 
        unit: "EUR", 
        rationale: "European SME banking market opportunity" 
      },
      growth_rate: { 
        value: 12.5, 
        unit: "percentage_per_year", 
        rationale: "Digital transformation accelerating post-COVID" 
      },
      market_definition: "Digital banking and financial services for SMEs with 1-250 employees",
      data_sources: ["ECB SME Survey", "PwC Fintech Report 2024", "EBA Digital Finance Strategy"]
    },
    serviceable_addressable_market: {
      percentage_of_tam: { 
        value: 40, 
        unit: "percentage", 
        rationale: "Limited by regulatory licensing and capital requirements" 
      },
      geographic_constraints: "EU banking license required - focus on 5 core markets initially",
      regulatory_constraints: "Banking license, PSD2 compliance, anti-money laundering",
      capability_constraints: "Regulatory capital requirements and compliance infrastructure"
    },
    serviceable_obtainable_market: {
      percentage_of_sam: { 
        value: 8, 
        unit: "percentage", 
        rationale: "Conservative estimate due to established banking relationships" 
      },
      resource_constraints: "€50M capital requirement and 3-year regulatory approval timeline",
      competitive_barriers: "Incumbent banks with existing customer relationships",
      time_constraints: "Regulatory approval and licensing timeline"
    }
  },
  market_share: {
    current_position: {
      current_share: { 
        value: 0, 
        unit: "percentage", 
        rationale: "Pre-launch fintech startup" 
      },
      market_entry_date: "2025-Q2",
      current_revenue: { 
        value: 0, 
        unit: "EUR_per_year", 
        rationale: "In regulatory approval phase" 
      }
    },
    target_position: {
      target_share: { 
        value: 3.5, 
        unit: "percentage", 
        rationale: "Ambitious but realistic 7-year target for niche player" 
      },
      target_timeframe: {
        value: 7,
        unit: "years",
        rationale: "Long timeline due to regulatory complexity"
      },
      penetration_strategy: "s_curve" as const,
      key_milestones: [
        {
          year: 1,
          milestone: "Regulatory approval and launch",
          target_share: 0.1,
          rationale: "Initial customers post-launch"
        },
        {
          year: 3,
          milestone: "Product-market fit achieved",
          target_share: 0.8,
          rationale: "Established customer base"
        },
        {
          year: 5,
          milestone: "Multi-country expansion",
          target_share: 2.0,
          rationale: "Geographic expansion phase"
        },
        {
          year: 7,
          milestone: "Established digital bank",
          target_share: 3.5,
          rationale: "Mature market position"
        }
      ]
    }
  },
  competitive_landscape: {
    competitors: [
      {
        name: "Traditional Banks (Aggregate)",
        market_share: { 
          value: 70, 
          unit: "percentage", 
          rationale: "Incumbent banks dominate SME banking" 
        },
        positioning: "Full-service traditional banking",
        strengths: ["Established relationships", "Regulatory expertise", "Capital base"],
        weaknesses: ["Legacy systems", "Slow innovation", "High costs"],
        threat_level: "medium" as const,
        competitive_response: "Digital transformation initiatives"
      },
      {
        name: "Revolut Business",
        market_share: { 
          value: 8, 
          unit: "percentage", 
          rationale: "Leading digital challenger" 
        },
        positioning: "Digital-first business banking",
        strengths: ["User experience", "Fast onboarding", "Multi-currency"],
        weaknesses: ["Limited lending", "Regulatory challenges"],
        threat_level: "high" as const,
        competitive_response: "Feature competition and geographic expansion"
      },
      {
        name: "Wise Business",
        market_share: { 
          value: 5, 
          unit: "percentage", 
          rationale: "Strong in international transfers" 
        },
        positioning: "International business payments focus",
        strengths: ["International transfers", "Transparent pricing", "Multi-currency"],
        weaknesses: ["Limited banking features", "Narrow focus"],
        threat_level: "medium" as const,
        competitive_response: "Platform expansion to full banking"
      }
    ],
    competitive_advantages: [
      {
        advantage: "AI-powered credit scoring",
        sustainability: "high" as const,
        rationale: "Proprietary algorithms with unique data sources"
      },
      {
        advantage: "SME-specific workflow integration",
        sustainability: "medium" as const,
        rationale: "Deep SME process understanding"
      },
      {
        advantage: "Regulatory-first approach",
        sustainability: "high" as const,
        rationale: "Compliance-by-design architecture"
      }
    ]
  },
  customer_analysis: {
    market_segments: [
      {
        id: "digital_native_smes",
        name: "Digital-Native SMEs",
        size_percentage: { 
          value: 30, 
          unit: "percentage", 
          rationale: "Fast-growing segment of digitally-savvy businesses" 
        },
        growth_rate: { 
          value: 18, 
          unit: "percentage_per_year", 
          rationale: "Rapid growth in digital business models" 
        },
        target_share: { 
          value: 15, 
          unit: "percentage", 
          rationale: "Primary target with highest digital adoption" 
        },
        customer_profile: "Tech startups, e-commerce, and digital service providers",
        value_drivers: ["Speed", "Digital integration", "Real-time insights"],
        entry_strategy: "Digital marketing and API-first partnerships"
      },
      {
        id: "traditional_smes_digitalizing",
        name: "Traditional SMEs Digitalizing",
        size_percentage: { 
          value: 45, 
          unit: "percentage", 
          rationale: "Largest segment undergoing digital transformation" 
        },
        growth_rate: { 
          value: 8, 
          unit: "percentage_per_year", 
          rationale: "Steady digitalization pace" 
        },
        target_share: { 
          value: 6, 
          unit: "percentage", 
          rationale: "Secondary target with education needs" 
        },
        customer_profile: "Traditional businesses adopting digital tools and processes",
        value_drivers: ["Ease of use", "Support", "Gradual transition"],
        entry_strategy: "Educational content and hands-on support"
      },
      {
        id: "export_focused_smes",
        name: "Export-Focused SMEs",
        size_percentage: { 
          value: 25, 
          unit: "percentage", 
          rationale: "Significant segment with complex international needs" 
        },
        growth_rate: { 
          value: 10, 
          unit: "percentage_per_year", 
          rationale: "Growing international trade" 
        },
        target_share: { 
          value: 8, 
          unit: "percentage", 
          rationale: "Specialized high-value segment" 
        },
        customer_profile: "SMEs with significant international business operations",
        value_drivers: ["Multi-currency", "Trade finance", "Compliance"],
        entry_strategy: "Trade association partnerships and trade show presence"
      }
    ],
    customer_economics: {
      average_customer_value: {
        annual_value: { 
          value: 2400, 
          unit: "EUR_per_customer_per_year", 
          rationale: "Based on transaction fees and subscription models" 
        },
        lifetime_value: { 
          value: 12000, 
          unit: "EUR_per_customer", 
          rationale: "5-year average customer lifetime in business banking" 
        },
        acquisition_cost: { 
          value: 360, 
          unit: "EUR_per_customer", 
          rationale: "15% of annual value through digital acquisition" 
        }
      },
      customer_behavior: {
        purchase_frequency: { 
          value: 12, 
          unit: "purchases_per_year", 
          rationale: "Monthly subscription with transaction-based revenue" 
        },
        loyalty_rate: {
          value: 92,
          unit: "percentage",
          rationale: "Very high switching costs in business banking"
        },
        referral_rate: {
          value: 35,
          unit: "percentage",
          rationale: "Strong referrals in SME business networks"
        }
      }
    }
  }
};

// ===== IOT PRODUCT LAUNCH SCENARIO =====

export const iotMarketData: MarketData = {
  schema_version: "1.0",
  meta: {
    title: "Smart Building IoT Platform",
    description: "Market analysis for IoT-based smart building management solutions",
    currency: "EUR",
    base_year: 2024,
    analysis_horizon_years: 6,
    created_date: "2024-01-20",
    analyst: "IoT Market Research Division"
  },
  market_sizing: {
    total_addressable_market: {
      base_value: { 
        value: 8500000, 
        unit: "EUR", 
        rationale: "European smart building market for SME commercial properties" 
      },
      growth_rate: { 
        value: 22, 
        unit: "percentage_per_year", 
        rationale: "High growth driven by energy efficiency and automation trends" 
      },
      market_definition: "IoT-based building management systems for commercial properties 1000-10000 sqm",
      data_sources: ["IoT Analytics Report", "Smart Building Market Study", "Energy Efficiency Regulation Impact"]
    },
    serviceable_addressable_market: {
      percentage_of_tam: { 
        value: 55, 
        unit: "percentage", 
        rationale: "Limited by integration complexity and building age constraints" 
      },
      geographic_constraints: "EU markets with strong energy efficiency regulations",
      regulatory_constraints: "Energy efficiency compliance requirements",
      capability_constraints: "Buildings with existing IP infrastructure or retrofit capability"
    },
    serviceable_obtainable_market: {
      percentage_of_sam: { 
        value: 25, 
        unit: "percentage", 
        rationale: "Moderate penetration due to long sales cycles and integration complexity" 
      },
      resource_constraints: "Limited installation and support capacity",
      competitive_barriers: "Existing building management system vendors",
      time_constraints: "Long procurement cycles in commercial real estate"
    }
  },
  market_share: {
    current_position: {
      current_share: { 
        value: 0, 
        unit: "percentage", 
        rationale: "New IoT solution entering market" 
      },
      market_entry_date: "2024-Q4",
      current_revenue: { 
        value: 0, 
        unit: "EUR_per_year", 
        rationale: "Product development phase" 
      }
    },
    target_position: {
      target_share: { 
        value: 6, 
        unit: "percentage", 
        rationale: "Realistic target for specialized IoT solution" 
      },
      target_timeframe: {
        value: 6,
        unit: "years",
        rationale: "Extended timeline due to B2B sales cycles"
      },
      penetration_strategy: "linear" as const,
      key_milestones: [
        {
          year: 1,
          milestone: "Pilot customer validation",
          target_share: 0.2,
          rationale: "Initial proof-of-concept customers"
        },
        {
          year: 2,
          milestone: "Product-market fit achieved",
          target_share: 1.0,
          rationale: "Established product-market fit"
        },
        {
          year: 4,
          milestone: "Scale phase with channel partners",
          target_share: 3.5,
          rationale: "Channel partnership scaling"
        },
        {
          year: 6,
          milestone: "Market leadership in niche",
          target_share: 6.0,
          rationale: "Established market position"
        }
      ]
    }
  },
  competitive_landscape: {
    competitors: [
      {
        name: "Johnson Controls",
        market_share: { 
          value: 35, 
          unit: "percentage", 
          rationale: "Dominant player in building management systems" 
        },
        positioning: "Enterprise-grade building automation",
        strengths: ["Market presence", "Integration capabilities", "Service network"],
        weaknesses: ["Legacy systems", "High cost", "Complex implementation"],
        threat_level: "medium" as const,
        competitive_response: "IoT platform enhancement and pricing pressure"
      },
      {
        name: "Siemens Building Technologies",
        market_share: { 
          value: 25, 
          unit: "percentage", 
          rationale: "Strong in European market" 
        },
        positioning: "Integrated building solutions",
        strengths: ["Technology integration", "European presence", "R&D capabilities"],
        weaknesses: ["Complex solutions", "High implementation cost"],
        threat_level: "medium" as const,
        competitive_response: "Smart building platform development"
      },
      {
        name: "Newer IoT Startups",
        market_share: { 
          value: 15, 
          unit: "percentage", 
          rationale: "Fragmented startup ecosystem" 
        },
        positioning: "Modern IoT-first solutions",
        strengths: ["Modern technology", "Agility", "Cloud-native"],
        weaknesses: ["Limited resources", "Unproven scale", "Integration challenges"],
        threat_level: "high" as const,
        competitive_response: "Feature racing and customer acquisition competition"
      }
    ],
    competitive_advantages: [
      {
        advantage: "Edge computing optimization",
        sustainability: "high" as const,
        rationale: "Proprietary edge processing algorithms"
      },
      {
        advantage: "Energy efficiency focus",
        sustainability: "medium" as const,
        rationale: "Strong regulatory tailwinds but replicable"
      },
      {
        advantage: "SME-optimized pricing",
        sustainability: "low" as const,
        rationale: "Pricing strategy easily copied"
      }
    ]
  },
  customer_analysis: {
    market_segments: [
      {
        id: "office_buildings",
        name: "Modern Office Buildings",
        size_percentage: { 
          value: 40, 
          unit: "percentage", 
          rationale: "Largest segment with high automation needs" 
        },
        growth_rate: { 
          value: 15, 
          unit: "percentage_per_year", 
          rationale: "Hybrid work driving smart office demand" 
        },
        target_share: { 
          value: 10, 
          unit: "percentage", 
          rationale: "Primary target with highest ROI potential" 
        },
        customer_profile: "Commercial office buildings 2000-8000 sqm with modern tenants",
        value_drivers: ["Energy savings", "Tenant satisfaction", "Operational efficiency"],
        entry_strategy: "Property management company partnerships"
      },
      {
        id: "retail_spaces",
        name: "Retail and Shopping Centers",
        size_percentage: { 
          value: 30, 
          unit: "percentage", 
          rationale: "Significant segment with customer experience focus" 
        },
        growth_rate: { 
          value: 8, 
          unit: "percentage_per_year", 
          rationale: "Retail transformation driving technology adoption" 
        },
        target_share: { 
          value: 6, 
          unit: "percentage", 
          rationale: "Secondary target with customer experience value" 
        },
        customer_profile: "Shopping centers and large retail spaces with customer experience focus",
        value_drivers: ["Customer comfort", "Energy costs", "Space optimization"],
        entry_strategy: "Retail technology integrator partnerships"
      },
      {
        id: "industrial_warehouses",
        name: "Industrial and Warehouse Facilities",
        size_percentage: { 
          value: 30, 
          unit: "percentage", 
          rationale: "Growing segment with efficiency focus" 
        },
        growth_rate: { 
          value: 25, 
          unit: "percentage_per_year", 
          rationale: "E-commerce and logistics growth" 
        },
        target_share: { 
          value: 4, 
          unit: "percentage", 
          rationale: "Specialized segment requiring custom solutions" 
        },
        customer_profile: "Logistics and manufacturing facilities with efficiency and safety priorities",
        value_drivers: ["Operational efficiency", "Safety compliance", "Predictive maintenance"],
        entry_strategy: "Industrial automation channel partnerships"
      }
    ],
    customer_economics: {
      average_customer_value: {
        annual_value: { 
          value: 15000, 
          unit: "EUR_per_customer_per_year", 
          rationale: "Hardware + software subscription + services model" 
        },
        lifetime_value: { 
          value: 75000, 
          unit: "EUR_per_customer", 
          rationale: "5-year system lifecycle with expansion opportunities" 
        },
        acquisition_cost: { 
          value: 4500, 
          unit: "EUR_per_customer", 
          rationale: "30% of annual value due to complex B2B sales process" 
        }
      },
      customer_behavior: {
        purchase_frequency: { 
          value: 0.2, 
          unit: "purchases_per_year", 
          rationale: "5-year replacement cycle for building systems" 
        },
        loyalty_rate: {
          value: 95,
          unit: "percentage",
          rationale: "Very high switching costs due to infrastructure integration"
        },
        referral_rate: {
          value: 45,
          unit: "percentage",
          rationale: "Strong referrals in commercial real estate networks"
        }
      }
    }
  }
};

// ===== LOW-GROWTH MATURE MARKET SCENARIO =====

export const matureMarketData: MarketData = {
  schema_version: "1.0",
  meta: {
    title: "Traditional Manufacturing ERP Extension",
    description: "Market analysis for ERP add-on modules in mature manufacturing sector",
    currency: "EUR",
    base_year: 2024,
    analysis_horizon_years: 5,
    created_date: "2024-03-01",
    analyst: "Enterprise Software Research"
  },
  market_sizing: {
    total_addressable_market: {
      base_value: { 
        value: 1200000, 
        unit: "EUR", 
        rationale: "Mature ERP extension market for manufacturing SMEs" 
      },
      growth_rate: { 
        value: 2.5, 
        unit: "percentage_per_year", 
        rationale: "Low growth in mature market with replacement demand" 
      },
      market_definition: "ERP add-on modules for manufacturing companies 50-500 employees",
      data_sources: ["ERP Market Analysis", "Manufacturing Technology Survey", "Industry consolidation reports"]
    },
    serviceable_addressable_market: {
      percentage_of_tam: { 
        value: 80, 
        unit: "percentage", 
        rationale: "High addressability due to standardized requirements" 
      },
      geographic_constraints: "German-speaking markets initially",
      regulatory_constraints: "Industry-specific compliance requirements",
      capability_constraints: "Compatible with major ERP platforms only"
    },
    serviceable_obtainable_market: {
      percentage_of_sam: { 
        value: 15, 
        unit: "percentage", 
        rationale: "Low penetration due to satisfied customers with existing solutions" 
      },
      resource_constraints: "Limited sales resources for long sales cycles",
      competitive_barriers: "Strong incumbent relationships and high switching costs",
      time_constraints: "Long procurement cycles in manufacturing"
    }
  },
  market_share: {
    current_position: {
      current_share: { 
        value: 2, 
        unit: "percentage", 
        rationale: "Existing niche player with small market presence" 
      },
      market_entry_date: "2019-Q1",
      current_revenue: { 
        value: 24000, 
        unit: "EUR_per_year", 
        rationale: "Current annual revenue from existing customers" 
      }
    },
    target_position: {
      target_share: { 
        value: 5, 
        unit: "percentage", 
        rationale: "Conservative growth target in mature market" 
      },
      target_timeframe: {
        value: 5,
        unit: "years",
        rationale: "Gradual growth strategy"
      },
      penetration_strategy: "linear" as const,
      key_milestones: [
        {
          year: 1,
          milestone: "Product enhancement completion",
          target_share: 2.5,
          rationale: "Enhanced product offering"
        },
        {
          year: 3,
          milestone: "Channel partnership establishment",
          target_share: 3.5,
          rationale: "Partner channel development"
        },
        {
          year: 5,
          milestone: "Market position consolidation",
          target_share: 5.0,
          rationale: "Established niche position"
        }
      ]
    }
  },
  competitive_landscape: {
    competitors: [
      {
        name: "SAP Business One Extensions",
        market_share: { 
          value: 45, 
          unit: "percentage", 
          rationale: "Dominant ERP vendor with extensive ecosystem" 
        },
        positioning: "Integrated ERP ecosystem",
        strengths: ["Market dominance", "Integration", "Partner network"],
        weaknesses: ["High cost", "Complexity", "Slow innovation"],
        threat_level: "low" as const,
        competitive_response: "Platform lock-in and pricing pressure"
      },
      {
        name: "Industry-Specific Vendors",
        market_share: { 
          value: 35, 
          unit: "percentage", 
          rationale: "Fragmented market of specialized solutions" 
        },
        positioning: "Industry-specific expertise",
        strengths: ["Deep industry knowledge", "Established relationships"],
        weaknesses: ["Limited resources", "Technology debt"],
        threat_level: "medium" as const,
        competitive_response: "Feature enhancement and customer retention"
      }
    ],
    competitive_advantages: [
      {
        advantage: "Manufacturing process expertise",
        sustainability: "high" as const,
        rationale: "Deep domain knowledge accumulated over years"
      },
      {
        advantage: "Cost-effective implementation",
        sustainability: "medium" as const,
        rationale: "Streamlined implementation process"
      }
    ]
  },
  customer_analysis: {
    market_segments: [
      {
        id: "automotive_suppliers",
        name: "Automotive Supply Chain",
        size_percentage: { 
          value: 60, 
          unit: "percentage", 
          rationale: "Dominant segment in manufacturing market" 
        },
        growth_rate: { 
          value: 1, 
          unit: "percentage_per_year", 
          rationale: "Mature market with minimal growth" 
        },
        target_share: { 
          value: 6, 
          unit: "percentage", 
          rationale: "Primary focus with existing expertise" 
        },
        customer_profile: "Tier 2 and 3 automotive suppliers with complex quality requirements",
        value_drivers: ["Quality compliance", "Cost reduction", "Process optimization"],
        entry_strategy: "Industry association partnerships and existing customer referrals"
      },
      {
        id: "machinery_manufacturers",
        name: "Machinery Manufacturers",
        size_percentage: { 
          value: 40, 
          unit: "percentage", 
          rationale: "Secondary segment with project-based business" 
        },
        growth_rate: { 
          value: 3, 
          unit: "percentage_per_year", 
          rationale: "Slightly higher growth due to automation trends" 
        },
        target_share: { 
          value: 3, 
          unit: "percentage", 
          rationale: "Secondary target with customization needs" 
        },
        customer_profile: "Mid-size machinery and equipment manufacturers",
        value_drivers: ["Project management", "Resource planning", "Customer delivery"],
        entry_strategy: "Engineering services partnerships"
      }
    ],
    customer_economics: {
      average_customer_value: {
        annual_value: { 
          value: 8000, 
          unit: "EUR_per_customer_per_year", 
          rationale: "License + maintenance + support model" 
        },
        lifetime_value: { 
          value: 40000, 
          unit: "EUR_per_customer", 
          rationale: "Long-term relationships in manufacturing" 
        },
        acquisition_cost: { 
          value: 2400, 
          unit: "EUR_per_customer", 
          rationale: "30% of annual value due to long sales cycles" 
        }
      },
      customer_behavior: {
        purchase_frequency: { 
          value: 0.1, 
          unit: "purchases_per_year", 
          rationale: "10-year replacement cycles typical in manufacturing" 
        },
        loyalty_rate: {
          value: 98,
          unit: "percentage",
          rationale: "Extremely high switching costs in manufacturing ERP"
        },
        referral_rate: {
          value: 60,
          unit: "percentage",
          rationale: "Very strong industry network referrals"
        }
      }
    }
  }
};

// ===== EDGE CASE: INSUFFICIENT DATA SCENARIO =====

export const insufficientDataMarketData: MarketData = {
  schema_version: "1.0",
  meta: {
    title: "Emerging Market Opportunity",
    description: "Early-stage market with limited data availability",
    currency: "EUR",
    base_year: 2024,
    analysis_horizon_years: 3,
    created_date: "2024-04-01",
    analyst: "Emerging Markets Team"
  },
  market_sizing: {
    total_addressable_market: {
      base_value: { 
        value: 50000, 
        unit: "EUR", 
        rationale: "Limited market data available - early estimate" 
      },
      growth_rate: { 
        value: 0, 
        unit: "percentage_per_year", 
        rationale: "No historical data for growth rate estimation" 
      },
      market_definition: "Emerging technology market with limited precedent",
      data_sources: ["Initial market research", "Expert interviews"]
    },
    serviceable_addressable_market: {
      percentage_of_tam: { 
        value: 20, 
        unit: "percentage", 
        rationale: "Conservative estimate due to uncertainty" 
      },
      geographic_constraints: "Single market pilot only",
      regulatory_constraints: "Regulatory framework still developing",
      capability_constraints: "Limited capability to address broader market"
    },
    serviceable_obtainable_market: {
      percentage_of_sam: { 
        value: 50, 
        unit: "percentage", 
        rationale: "High uncertainty - could be first mover advantage" 
      },
      resource_constraints: "Very limited resources for market development",
      competitive_barriers: "No established competitors yet",
      time_constraints: "Market timing uncertainty"
    }
  },
  market_share: {
    current_position: {
      current_share: { 
        value: 0, 
        unit: "percentage", 
        rationale: "Market does not exist yet" 
      },
      market_entry_date: "2024-Q4",
      current_revenue: { 
        value: 0, 
        unit: "EUR_per_year", 
        rationale: "Pre-market stage" 
      }
    },
    target_position: {
      target_share: { 
        value: 25, 
        unit: "percentage", 
        rationale: "First mover advantage potential" 
      },
      target_timeframe: {
        value: 3,
        unit: "years",
        rationale: "Short timeline due to uncertainty"
      },
      penetration_strategy: "exponential" as const,
      key_milestones: [
        {
          year: 1,
          milestone: "Market validation",
          target_share: 5,
          rationale: "Validate market exists"
        },
        {
          year: 2,
          milestone: "Product-market fit",
          target_share: 15,
          rationale: "Establish product-market fit"
        },
        {
          year: 3,
          milestone: "Market leadership",
          target_share: 25,
          rationale: "Capitalize on first mover advantage"
        }
      ]
    }
  },
  competitive_landscape: {
    competitors: [],
    competitive_advantages: [
      {
        advantage: "First mover advantage",
        sustainability: "medium" as const,
        rationale: "Advantage erodes as market develops"
      }
    ]
  },
  customer_analysis: {
    market_segments: [
      {
        id: "early_adopters",
        name: "Early Adopters",
        size_percentage: { 
          value: 100, 
          unit: "percentage", 
          rationale: "Single segment in emerging market" 
        },
        growth_rate: { 
          value: 0, 
          unit: "percentage_per_year", 
          rationale: "Unknown growth rate" 
        },
        target_share: { 
          value: 25, 
          unit: "percentage", 
          rationale: "Target based on capacity constraints" 
        },
        customer_profile: "Technology early adopters willing to try new solutions",
        value_drivers: ["Innovation", "First mover advantage", "Problem solving"],
        entry_strategy: "Direct outreach to known early adopters"
      }
    ],
    customer_economics: {
      average_customer_value: {
        annual_value: { 
          value: 1000, 
          unit: "EUR_per_customer_per_year", 
          rationale: "Estimated based on similar markets" 
        },
        lifetime_value: { 
          value: 3000, 
          unit: "EUR_per_customer", 
          rationale: "Short lifetime due to market uncertainty" 
        },
        acquisition_cost: { 
          value: 300, 
          unit: "EUR_per_customer", 
          rationale: "High uncertainty in acquisition strategy" 
        }
      },
      customer_behavior: {
        purchase_frequency: { 
          value: 1, 
          unit: "purchases_per_year", 
          rationale: "Assumed annual subscription" 
        },
        loyalty_rate: {
          value: 50,
          unit: "percentage",
          rationale: "High uncertainty in new market"
        },
        referral_rate: {
          value: 20,
          unit: "percentage",
          rationale: "Conservative estimate for new market"
        }
      }
    }
  }
};

// ===== EXPORT ALL TEST SCENARIOS =====

export const marketDataScenarios = {
  saas: saasMarketData,
  fintech: fintechMarketData,
  iot: iotMarketData,
  mature: matureMarketData,
  insufficient: insufficientDataMarketData
};

export const scenarioDescriptions = {
  saas: "High-growth SaaS platform with strong market opportunity and competitive landscape",
  fintech: "Regulated fintech market with long development cycles and high barriers to entry",
  iot: "Emerging IoT market with hardware/software hybrid model and B2B sales complexity",
  mature: "Mature manufacturing market with low growth and established incumbent competition",
  insufficient: "Early-stage market with limited data availability and high uncertainty"
};

// ===== TEST DATA VALIDATION UTILITY =====

export function getScenarioTestData(scenario: keyof typeof marketDataScenarios) {
  const data = marketDataScenarios[scenario];
  const description = scenarioDescriptions[scenario];
  
  return {
    marketData: data,
    description,
    expectedInsights: {
      volumeProjection: data.market_sizing.total_addressable_market.base_value.value > 100000,
      marketSizing: data.market_sizing.serviceable_addressable_market.percentage_of_tam.value > 0,
      customerSegments: data.customer_analysis.market_segments.length > 0,
      highConfidence: data.market_sizing.total_addressable_market.base_value.value > 1000000
    }
  };
}

// ===== SAMPLE BUSINESS CASE DATA FOR TESTING =====

export const sampleBusinessCaseData = {
  meta: {
    title: "Test Business Case for Cart Integration",
    description: "Sample business case for testing cart integration",
    currency: "EUR",
    periods: 60,
    business_model: "recurring" as const
  },
  assumptions: {
    customers: {
      segments: [
        {
          id: "target_segment_1",
          label: "Primary Target Segment",
          rationale: "Main customer segment based on market analysis",
          volume: {
            type: "pattern" as const,
            pattern_type: "linear_growth" as const,
            base_year_total: {
              value: 500,
              unit: "units_per_year",
              rationale: "Conservative initial estimate"
            },
            yoy_growth: {
              value: 15,
              unit: "percentage",
              rationale: "Expected growth rate"
            }
          }
        },
        {
          id: "target_segment_2",
          label: "Secondary Target Segment",
          rationale: "Secondary customer segment for expansion",
          volume: {
            type: "pattern" as const,
            pattern_type: "linear_growth" as const,
            base_year_total: {
              value: 200,
              unit: "units_per_year",
              rationale: "Smaller secondary segment"
            },
            yoy_growth: {
              value: 10,
              unit: "percentage",
              rationale: "Conservative growth for secondary segment"
            }
          }
        }
      ]
    },
    pricing: {
      avg_unit_price: {
        value: 120,
        unit: "EUR",
        rationale: "Average subscription price across segments"
      }
    }
  }
};
