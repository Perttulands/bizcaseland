/**
 * Pitch Deck Export Service
 *
 * Generates professional, investor-ready PowerPoint pitch decks from business case data.
 * Auto-generates slides: Title, Problem, Solution, Market Size, Business Model,
 * Financial Highlights, Unit Economics, Financial Projections, and The Ask.
 */

import PptxGenJS from 'pptxgenjs';
import { BusinessData, MarketData, CalculatedMetrics } from '@/core/types';
import { calculateBusinessMetrics } from '@/core/engine';

// ============================================================================
// Constants
// ============================================================================

const COLORS = {
  primary: '2563eb',      // Blue
  secondary: '64748b',    // Slate
  success: '10b981',      // Green
  danger: 'ef4444',       // Red
  warning: 'f59e0b',      // Amber
  light: 'f1f5f9',        // Light gray
  dark: '1e293b',         // Dark slate
  text: '334155',         // Gray text
  white: 'ffffff',
};

const FONTS = {
  title: 44,
  heading: 32,
  subheading: 24,
  body: 18,
  small: 14,
  caption: 12,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format currency with appropriate units (M, K)
 */
function formatCurrency(value: number, currency: string = 'USD'): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${currency} ${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (Math.abs(value) >= 1_000_000) {
    return `${currency} ${(value / 1_000_000).toFixed(1)}M`;
  } else if (Math.abs(value) >= 1_000) {
    return `${currency} ${(value / 1_000).toFixed(0)}K`;
  }
  return `${currency} ${value.toFixed(0)}`;
}

/**
 * Format large numbers for market sizes
 */
function formatMarketSize(value: number, currency: string = 'USD'): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${currency}${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (Math.abs(value) >= 1_000_000) {
    return `${currency}${(value / 1_000_000).toFixed(0)}M`;
  }
  return `${currency}${(value / 1_000).toFixed(0)}K`;
}

/**
 * Format percentage
 */
function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Get a color based on positive/negative value
 */
function getValueColor(value: number): string {
  return value >= 0 ? COLORS.success : COLORS.danger;
}

// ============================================================================
// Slide Creation Functions
// ============================================================================

/**
 * Create title slide
 */
function createTitleSlide(pptx: PptxGenJS, data: BusinessData): void {
  const slide = pptx.addSlide();

  // Background with gradient effect
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: '50%',
    fill: { color: COLORS.primary },
  });

  // Company/Project title
  slide.addText(data.meta.title || 'Business Case', {
    x: 0.5,
    y: 1.5,
    w: '90%',
    h: 1.5,
    fontSize: FONTS.title,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.white,
    align: 'center',
  });

  // Description/Elevator pitch
  if (data.meta.description) {
    slide.addText(data.meta.description, {
      x: 0.5,
      y: 3.2,
      w: '90%',
      h: 1,
      fontSize: FONTS.body,
      fontFace: 'Arial',
      color: COLORS.text,
      align: 'center',
      valign: 'top',
    });
  }

  // Metadata box
  const metaInfo = [
    `Business Model: ${data.meta.business_model?.replace('_', ' ').toUpperCase() || 'N/A'}`,
    `Analysis Period: ${data.meta.periods} ${data.meta.frequency}`,
    `Currency: ${data.meta.currency}`,
  ].join('  |  ');

  slide.addText(metaInfo, {
    x: 0.5,
    y: 4.8,
    w: '90%',
    h: 0.4,
    fontSize: FONTS.caption,
    fontFace: 'Arial',
    color: COLORS.secondary,
    align: 'center',
  });

  // Branding footer
  slide.addText('Powered by Bizcaseland', {
    x: 0.5,
    y: 5.2,
    w: '90%',
    h: 0.3,
    fontSize: FONTS.caption,
    fontFace: 'Arial',
    italic: true,
    color: COLORS.secondary,
    align: 'center',
  });
}

/**
 * Create problem slide - highlights market pain points
 */
function createProblemSlide(
  pptx: PptxGenJS,
  businessData: BusinessData,
  marketData?: MarketData
): void {
  const slide = pptx.addSlide();

  // Header
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.8,
    fill: { color: COLORS.danger },
  });

  slide.addText('The Problem', {
    x: 0.5,
    y: 0.15,
    w: '90%',
    h: 0.5,
    fontSize: FONTS.heading,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.white,
  });

  // Problem statements from market data or business context
  const problems: string[] = [];

  // Extract pain points from customer analysis
  if (marketData?.customer_analysis?.segments) {
    marketData.customer_analysis.segments.forEach(segment => {
      if (segment.pain_points) {
        problems.push(...segment.pain_points.slice(0, 2));
      }
    });
  }

  // If no market data, use generic problems based on business model
  if (problems.length === 0) {
    if (businessData.meta.business_model === 'cost_savings') {
      problems.push(
        'High operational costs eating into margins',
        'Inefficient processes reducing productivity',
        'Manual workflows causing delays and errors'
      );
    } else {
      problems.push(
        'Market needs addressed by this solution',
        'Customer pain points driving demand',
        'Gap in current market offerings'
      );
    }
  }

  // Display problems as bullet points
  const bulletPoints = problems.slice(0, 4).map(p => ({ text: p, options: { bullet: true } }));

  slide.addText(bulletPoints, {
    x: 0.5,
    y: 1.2,
    w: '90%',
    h: 3.5,
    fontSize: FONTS.subheading,
    fontFace: 'Arial',
    color: COLORS.dark,
    valign: 'top',
    paraSpaceAfter: 20,
  });

  // Add market risk context if available
  if (marketData?.risk_assessment?.risks && marketData.risk_assessment.risks.length > 0) {
    const highRisks = marketData.risk_assessment.risks
      .filter(r => r.probability === 'high' || r.impact === 'high')
      .slice(0, 2);

    if (highRisks.length > 0) {
      slide.addText('Key Market Challenges:', {
        x: 0.5,
        y: 4.0,
        w: '90%',
        h: 0.4,
        fontSize: FONTS.body,
        fontFace: 'Arial',
        bold: true,
        color: COLORS.warning,
      });

      slide.addText(highRisks.map(r => r.risk).join(' | '), {
        x: 0.5,
        y: 4.4,
        w: '90%',
        h: 0.5,
        fontSize: FONTS.small,
        fontFace: 'Arial',
        color: COLORS.text,
      });
    }
  }
}

/**
 * Create solution slide - product/service overview
 */
function createSolutionSlide(
  pptx: PptxGenJS,
  businessData: BusinessData,
  marketData?: MarketData
): void {
  const slide = pptx.addSlide();

  // Header
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.8,
    fill: { color: COLORS.success },
  });

  slide.addText('Our Solution', {
    x: 0.5,
    y: 0.15,
    w: '90%',
    h: 0.5,
    fontSize: FONTS.heading,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.white,
  });

  // Value proposition from go-to-market strategy
  const valueProposition = marketData?.go_to_market?.value_proposition ||
    businessData.meta.description ||
    'Innovative solution addressing key market needs';

  slide.addText(valueProposition, {
    x: 0.5,
    y: 1.2,
    w: '90%',
    h: 1,
    fontSize: FONTS.body,
    fontFace: 'Arial',
    color: COLORS.dark,
    italic: true,
    align: 'center',
  });

  // Key features/benefits
  const benefits: string[] = [];

  // From competitive advantages
  if (marketData?.competitive_landscape?.competitive_advantages) {
    marketData.competitive_landscape.competitive_advantages.forEach(adv => {
      benefits.push(adv.advantage);
    });
  }

  // If cost savings model, highlight savings
  if (businessData.meta.business_model === 'cost_savings' &&
      businessData.assumptions.cost_savings?.baseline_costs) {
    const totalSavings = businessData.assumptions.cost_savings.baseline_costs
      .reduce((sum, cost) => sum + (cost.savings_potential_pct?.value || 0), 0);
    if (totalSavings > 0) {
      benefits.push(`Up to ${totalSavings}% cost reduction potential`);
    }
  }

  // Default benefits if none found
  if (benefits.length === 0) {
    benefits.push(
      'Scalable and efficient solution',
      'Strong unit economics',
      'Clear path to profitability'
    );
  }

  const bulletPoints = benefits.slice(0, 4).map(b => ({ text: b, options: { bullet: true } }));

  slide.addText(bulletPoints, {
    x: 0.5,
    y: 2.5,
    w: '90%',
    h: 2.5,
    fontSize: FONTS.subheading,
    fontFace: 'Arial',
    color: COLORS.dark,
    valign: 'top',
    paraSpaceAfter: 15,
  });
}

/**
 * Create market size slide - TAM/SAM/SOM visualization
 */
function createMarketSizeSlide(
  pptx: PptxGenJS,
  businessData: BusinessData,
  marketData?: MarketData
): void {
  const slide = pptx.addSlide();

  // Header
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.8,
    fill: { color: COLORS.primary },
  });

  slide.addText('Market Opportunity', {
    x: 0.5,
    y: 0.15,
    w: '90%',
    h: 0.5,
    fontSize: FONTS.heading,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.white,
  });

  const currency = businessData.meta.currency;
  const sizing = marketData?.market_sizing;

  // TAM
  const tamValue = sizing?.total_addressable_market?.base_value?.value || 0;
  const tamGrowth = sizing?.total_addressable_market?.growth_rate?.value || 0;

  // SAM
  const samPct = sizing?.serviceable_addressable_market?.percentage_of_tam?.value || 0;
  const samValue = tamValue * (samPct / 100);

  // SOM
  const somPct = sizing?.serviceable_obtainable_market?.percentage_of_sam?.value || 0;
  const somValue = samValue * (somPct / 100);

  // Create market size boxes (funnel visualization)
  const marketSizes = [
    { label: 'TAM', sublabel: 'Total Addressable Market', value: tamValue, color: COLORS.primary, width: 8 },
    { label: 'SAM', sublabel: 'Serviceable Addressable', value: samValue, color: COLORS.secondary, width: 6 },
    { label: 'SOM', sublabel: 'Serviceable Obtainable', value: somValue, color: COLORS.success, width: 4 },
  ];

  let yPos = 1.2;
  marketSizes.forEach((market, index) => {
    const xOffset = (10 - market.width) / 2;

    // Box
    slide.addShape('rect', {
      x: xOffset,
      y: yPos,
      w: market.width,
      h: 1.0,
      fill: { color: market.color },
      line: { color: market.color },
    });

    // Label
    slide.addText(`${market.label}: ${formatMarketSize(market.value, currency)}`, {
      x: xOffset,
      y: yPos + 0.15,
      w: market.width,
      h: 0.4,
      fontSize: FONTS.subheading,
      fontFace: 'Arial',
      bold: true,
      color: COLORS.white,
      align: 'center',
    });

    // Sublabel
    slide.addText(market.sublabel, {
      x: xOffset,
      y: yPos + 0.55,
      w: market.width,
      h: 0.3,
      fontSize: FONTS.small,
      fontFace: 'Arial',
      color: COLORS.white,
      align: 'center',
    });

    yPos += 1.2;
  });

  // Growth rate and market definition
  if (tamGrowth > 0) {
    slide.addText(`Market Growth: ${formatPercentage(tamGrowth)} CAGR`, {
      x: 0.5,
      y: 4.8,
      w: '45%',
      h: 0.4,
      fontSize: FONTS.body,
      fontFace: 'Arial',
      bold: true,
      color: COLORS.success,
    });
  }

  // Market definition
  const marketDef = sizing?.total_addressable_market?.market_definition;
  if (marketDef) {
    slide.addText(marketDef, {
      x: 5,
      y: 4.8,
      w: '45%',
      h: 0.6,
      fontSize: FONTS.caption,
      fontFace: 'Arial',
      color: COLORS.text,
    });
  }
}

/**
 * Create business model slide - pricing, revenue streams
 */
function createBusinessModelSlide(
  pptx: PptxGenJS,
  businessData: BusinessData
): void {
  const slide = pptx.addSlide();

  // Header
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.8,
    fill: { color: COLORS.warning },
  });

  slide.addText('Business Model', {
    x: 0.5,
    y: 0.15,
    w: '90%',
    h: 0.5,
    fontSize: FONTS.heading,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.white,
  });

  const currency = businessData.meta.currency;
  const model = businessData.meta.business_model;

  // Business model type box
  const modelDisplayName = model === 'recurring' ? 'Recurring Revenue' :
    model === 'unit_sales' ? 'Unit Sales' :
    model === 'cost_savings' ? 'Cost Savings' : 'Revenue Model';

  slide.addShape('roundRect', {
    x: 3.5,
    y: 1.0,
    w: 3,
    h: 0.6,
    fill: { color: COLORS.dark },
    rectRadius: 0.1,
  });

  slide.addText(modelDisplayName, {
    x: 3.5,
    y: 1.1,
    w: 3,
    h: 0.4,
    fontSize: FONTS.body,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.white,
    align: 'center',
  });

  // Revenue components
  const components: { label: string; value: string }[] = [];

  // Pricing
  if (businessData.assumptions.pricing?.avg_unit_price) {
    components.push({
      label: 'Average Unit Price',
      value: formatCurrency(businessData.assumptions.pricing.avg_unit_price.value, currency),
    });
  }

  // Customer segments
  if (businessData.assumptions.customers?.segments) {
    components.push({
      label: 'Customer Segments',
      value: `${businessData.assumptions.customers.segments.length} segments`,
    });
  }

  // Churn rate
  if (businessData.assumptions.customers?.churn_pct) {
    components.push({
      label: 'Churn Rate',
      value: formatPercentage(businessData.assumptions.customers.churn_pct.value),
    });
  }

  // COGS
  if (businessData.assumptions.unit_economics?.cogs_pct) {
    components.push({
      label: 'COGS',
      value: formatPercentage(businessData.assumptions.unit_economics.cogs_pct.value),
    });
  }

  // Display components in a grid
  let xPos = 0.5;
  let yPos = 2.0;
  const colWidth = 4.5;

  components.forEach((comp, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 0.5 + (col * colWidth);
    const y = 2.0 + (row * 1.0);

    slide.addText(comp.label, {
      x,
      y,
      w: 4,
      h: 0.4,
      fontSize: FONTS.small,
      fontFace: 'Arial',
      color: COLORS.secondary,
    });

    slide.addText(comp.value, {
      x,
      y: y + 0.35,
      w: 4,
      h: 0.5,
      fontSize: FONTS.subheading,
      fontFace: 'Arial',
      bold: true,
      color: COLORS.dark,
    });
  });

  // Revenue streams description
  if (model === 'recurring') {
    slide.addText('Subscription-based recurring revenue with predictable cash flows', {
      x: 0.5,
      y: 4.5,
      w: '90%',
      h: 0.5,
      fontSize: FONTS.body,
      fontFace: 'Arial',
      color: COLORS.text,
      align: 'center',
    });
  } else if (model === 'unit_sales') {
    slide.addText('Transaction-based revenue scaling with customer growth', {
      x: 0.5,
      y: 4.5,
      w: '90%',
      h: 0.5,
      fontSize: FONTS.body,
      fontFace: 'Arial',
      color: COLORS.text,
      align: 'center',
    });
  } else if (model === 'cost_savings') {
    slide.addText('ROI-driven model through operational efficiency gains', {
      x: 0.5,
      y: 4.5,
      w: '90%',
      h: 0.5,
      fontSize: FONTS.body,
      fontFace: 'Arial',
      color: COLORS.text,
      align: 'center',
    });
  }
}

/**
 * Create financial highlights slide - 6 key metrics
 */
function createFinancialHighlightsSlide(
  pptx: PptxGenJS,
  businessData: BusinessData,
  calculations: CalculatedMetrics
): void {
  const slide = pptx.addSlide();

  // Header
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.8,
    fill: { color: COLORS.success },
  });

  slide.addText('Financial Highlights', {
    x: 0.5,
    y: 0.15,
    w: '90%',
    h: 0.5,
    fontSize: FONTS.heading,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.white,
  });

  const currency = businessData.meta.currency;
  const isCostSavings = businessData.meta.business_model === 'cost_savings';

  // 6 key metrics grid (3x2)
  const metrics = [
    {
      label: isCostSavings ? 'Total Benefits (5Y)' : 'Total Revenue (5Y)',
      value: formatCurrency(calculations.totalRevenue || 0, currency),
      color: COLORS.success,
    },
    {
      label: 'Net Profit (5Y)',
      value: formatCurrency(calculations.netProfit || 0, currency),
      color: getValueColor(calculations.netProfit || 0),
    },
    {
      label: 'NPV',
      value: formatCurrency(calculations.npv || 0, currency),
      color: getValueColor(calculations.npv || 0),
    },
    {
      label: 'Payback Period',
      value: calculations.paybackPeriod > 0 ? `${calculations.paybackPeriod} months` : 'N/A',
      color: COLORS.primary,
    },
    {
      label: 'Total Investment',
      value: formatCurrency(calculations.totalInvestmentRequired || 0, currency),
      color: COLORS.warning,
    },
    {
      label: 'Break-Even',
      value: calculations.breakEvenMonth > 0 ? `Month ${calculations.breakEvenMonth}` : 'N/A',
      color: COLORS.warning,
    },
  ];

  const boxWidth = 2.8;
  const boxHeight = 1.5;
  const spacing = 0.3;
  const startX = 0.7;
  const startY = 1.2;

  metrics.forEach((metric, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = startX + (col * (boxWidth + spacing));
    const y = startY + (row * (boxHeight + spacing));

    // Metric box
    slide.addShape('roundRect', {
      x,
      y,
      w: boxWidth,
      h: boxHeight,
      fill: { color: COLORS.light },
      line: { color: metric.color, pt: 2 },
      rectRadius: 0.1,
    });

    // Top accent bar
    slide.addShape('rect', {
      x: x + 0.1,
      y: y + 0.1,
      w: boxWidth - 0.2,
      h: 0.15,
      fill: { color: metric.color },
    });

    // Label
    slide.addText(metric.label, {
      x,
      y: y + 0.35,
      w: boxWidth,
      h: 0.4,
      fontSize: FONTS.small,
      fontFace: 'Arial',
      color: COLORS.text,
      align: 'center',
    });

    // Value
    slide.addText(metric.value, {
      x,
      y: y + 0.8,
      w: boxWidth,
      h: 0.5,
      fontSize: FONTS.subheading,
      fontFace: 'Arial',
      bold: true,
      color: metric.color,
      align: 'center',
    });
  });

  // Investment recommendation
  const recommendation = calculations.npv > 0 && calculations.irr > 0
    ? 'Positive NPV indicates a strong investment opportunity'
    : 'Detailed analysis recommended before investment decision';

  slide.addShape('roundRect', {
    x: 0.5,
    y: 4.6,
    w: 9,
    h: 0.6,
    fill: { color: calculations.npv > 0 ? COLORS.success : COLORS.warning },
    rectRadius: 0.1,
  });

  slide.addText(recommendation, {
    x: 0.5,
    y: 4.7,
    w: 9,
    h: 0.4,
    fontSize: FONTS.body,
    fontFace: 'Arial',
    color: COLORS.white,
    align: 'center',
  });
}

/**
 * Create unit economics slide
 */
function createUnitEconomicsSlide(
  pptx: PptxGenJS,
  businessData: BusinessData,
  calculations: CalculatedMetrics
): void {
  const slide = pptx.addSlide();

  // Header
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.8,
    fill: { color: COLORS.secondary },
  });

  slide.addText('Unit Economics', {
    x: 0.5,
    y: 0.15,
    w: '90%',
    h: 0.5,
    fontSize: FONTS.heading,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.white,
  });

  const currency = businessData.meta.currency;
  const unitEcon = businessData.assumptions.unit_economics;
  const pricing = businessData.assumptions.pricing;

  // Key unit economics metrics
  const unitMetrics: { label: string; value: string; description: string }[] = [];

  // Price
  if (pricing?.avg_unit_price) {
    unitMetrics.push({
      label: 'Average Price',
      value: formatCurrency(pricing.avg_unit_price.value, currency),
      description: pricing.avg_unit_price.rationale || 'Per unit price',
    });
  }

  // COGS
  if (unitEcon?.cogs_pct) {
    unitMetrics.push({
      label: 'COGS',
      value: formatPercentage(unitEcon.cogs_pct.value),
      description: unitEcon.cogs_pct.rationale || 'Cost of goods sold',
    });
  }

  // Gross Margin (calculated)
  if (unitEcon?.cogs_pct) {
    const grossMargin = 100 - unitEcon.cogs_pct.value;
    unitMetrics.push({
      label: 'Gross Margin',
      value: formatPercentage(grossMargin),
      description: 'Revenue minus direct costs',
    });
  }

  // CAC
  if (unitEcon?.cac) {
    unitMetrics.push({
      label: 'CAC',
      value: formatCurrency(unitEcon.cac.value, currency),
      description: unitEcon.cac.rationale || 'Customer acquisition cost',
    });
  }

  // Display metrics
  unitMetrics.forEach((metric, index) => {
    const y = 1.2 + (index * 0.9);

    slide.addShape('rect', {
      x: 0.5,
      y,
      w: 9,
      h: 0.8,
      fill: { color: index % 2 === 0 ? COLORS.light : COLORS.white },
    });

    slide.addText(metric.label, {
      x: 0.7,
      y: y + 0.15,
      w: 3,
      h: 0.5,
      fontSize: FONTS.body,
      fontFace: 'Arial',
      bold: true,
      color: COLORS.dark,
    });

    slide.addText(metric.value, {
      x: 3.5,
      y: y + 0.15,
      w: 2,
      h: 0.5,
      fontSize: FONTS.body,
      fontFace: 'Arial',
      bold: true,
      color: COLORS.primary,
      align: 'center',
    });

    slide.addText(metric.description, {
      x: 5.5,
      y: y + 0.15,
      w: 3.8,
      h: 0.5,
      fontSize: FONTS.small,
      fontFace: 'Arial',
      color: COLORS.text,
    });
  });
}

/**
 * Create financial projections slide with chart data
 */
function createFinancialProjectionsSlide(
  pptx: PptxGenJS,
  businessData: BusinessData,
  calculations: CalculatedMetrics
): void {
  const slide = pptx.addSlide();

  // Header
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.8,
    fill: { color: COLORS.dark },
  });

  slide.addText('Financial Projections', {
    x: 0.5,
    y: 0.15,
    w: '90%',
    h: 0.5,
    fontSize: FONTS.heading,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.white,
  });

  const currency = businessData.meta.currency;
  const monthlyData = calculations.monthlyData || [];
  const isCostSavings = businessData.meta.business_model === 'cost_savings';

  // Aggregate to annual data
  const annualData: { year: string; revenue: number; netCashFlow: number; cumulative: number }[] = [];
  let cumulative = 0;

  for (let year = 0; year < 5; year++) {
    const startMonth = year * 12;
    const endMonth = Math.min(startMonth + 12, monthlyData.length);
    const yearData = monthlyData.slice(startMonth, endMonth);

    if (yearData.length > 0) {
      const revenue = yearData.reduce((sum, m) => sum + m.revenue, 0);
      const netCashFlow = yearData.reduce((sum, m) => sum + m.netCashFlow, 0);
      cumulative += netCashFlow;

      annualData.push({
        year: `Y${year + 1}`,
        revenue,
        netCashFlow,
        cumulative,
      });
    }
  }

  // Create bar chart for revenue
  if (annualData.length > 0) {
    const chartData = [
      {
        name: isCostSavings ? 'Benefits' : 'Revenue',
        labels: annualData.map(d => d.year),
        values: annualData.map(d => d.revenue / 1000000), // In millions
      },
      {
        name: 'Net Cash Flow',
        labels: annualData.map(d => d.year),
        values: annualData.map(d => d.netCashFlow / 1000000),
      },
    ];

    slide.addChart(pptx.ChartType.bar, chartData, {
      x: 0.5,
      y: 1.0,
      w: 6,
      h: 3.5,
      barDir: 'bar',
      barGrouping: 'clustered',
      showValue: true,
      valAxisTitle: `${currency} (Millions)`,
      catAxisTitle: 'Year',
      chartColors: [COLORS.primary, COLORS.success],
      showLegend: true,
      legendPos: 'b',
    });

    // Summary table
    const tableData = [
      ['Year', isCostSavings ? 'Benefits' : 'Revenue', 'Net CF', 'Cumulative'],
      ...annualData.map(d => [
        d.year,
        formatCurrency(d.revenue, currency),
        formatCurrency(d.netCashFlow, currency),
        formatCurrency(d.cumulative, currency),
      ]),
    ];

    slide.addTable(tableData, {
      x: 6.8,
      y: 1.0,
      w: 3,
      h: 3,
      fontSize: FONTS.caption,
      fontFace: 'Arial',
      border: { pt: 0.5, color: COLORS.secondary },
      colW: [0.6, 0.8, 0.8, 0.8],
      rowH: 0.4,
      fill: { color: COLORS.white },
      align: 'center',
      valign: 'middle',
    });
  }
}

/**
 * Create "The Ask" slide - funding requirements
 */
function createTheAskSlide(
  pptx: PptxGenJS,
  businessData: BusinessData,
  calculations: CalculatedMetrics
): void {
  const slide = pptx.addSlide();

  // Header
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.8,
    fill: { color: COLORS.primary },
  });

  slide.addText('The Ask', {
    x: 0.5,
    y: 0.15,
    w: '90%',
    h: 0.5,
    fontSize: FONTS.heading,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.white,
  });

  const currency = businessData.meta.currency;
  const investmentRequired = calculations.totalInvestmentRequired || 0;

  // Main funding ask
  slide.addText('Investment Required', {
    x: 0.5,
    y: 1.2,
    w: '90%',
    h: 0.4,
    fontSize: FONTS.body,
    fontFace: 'Arial',
    color: COLORS.secondary,
    align: 'center',
  });

  slide.addText(formatCurrency(investmentRequired, currency), {
    x: 0.5,
    y: 1.6,
    w: '90%',
    h: 0.8,
    fontSize: FONTS.title,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.primary,
    align: 'center',
  });

  // Use of funds breakdown
  slide.addText('Use of Funds', {
    x: 0.5,
    y: 2.6,
    w: '90%',
    h: 0.4,
    fontSize: FONTS.subheading,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.dark,
    align: 'center',
  });

  // Calculate use of funds from CAPEX and initial OPEX
  const useOfFunds: { label: string; value: number; percentage: number }[] = [];

  // CAPEX items
  if (businessData.assumptions.capex && businessData.assumptions.capex.length > 0) {
    const totalCapex = investmentRequired * 0.6; // Estimate 60% for CAPEX
    useOfFunds.push({
      label: 'Capital Expenditure',
      value: totalCapex,
      percentage: 60,
    });
  }

  // OPEX items
  if (businessData.assumptions.opex && businessData.assumptions.opex.length > 0) {
    const operationsAllocation = investmentRequired * 0.25;
    useOfFunds.push({
      label: 'Operations',
      value: operationsAllocation,
      percentage: 25,
    });
  }

  // Reserve
  if (useOfFunds.length > 0) {
    const remaining = 100 - useOfFunds.reduce((sum, f) => sum + f.percentage, 0);
    useOfFunds.push({
      label: 'Working Capital Reserve',
      value: investmentRequired * (remaining / 100),
      percentage: remaining,
    });
  } else {
    // Default breakdown
    useOfFunds.push(
      { label: 'Product Development', value: investmentRequired * 0.4, percentage: 40 },
      { label: 'Sales & Marketing', value: investmentRequired * 0.35, percentage: 35 },
      { label: 'Operations', value: investmentRequired * 0.15, percentage: 15 },
      { label: 'Reserve', value: investmentRequired * 0.1, percentage: 10 }
    );
  }

  // Display use of funds
  const barHeight = 0.4;
  let yPos = 3.1;

  useOfFunds.forEach((fund) => {
    // Label
    slide.addText(`${fund.label} (${fund.percentage}%)`, {
      x: 0.5,
      y: yPos,
      w: 3.5,
      h: barHeight,
      fontSize: FONTS.small,
      fontFace: 'Arial',
      color: COLORS.dark,
      valign: 'middle',
    });

    // Progress bar background
    slide.addShape('rect', {
      x: 4,
      y: yPos + 0.05,
      w: 5,
      h: barHeight - 0.1,
      fill: { color: COLORS.light },
    });

    // Progress bar fill
    slide.addShape('rect', {
      x: 4,
      y: yPos + 0.05,
      w: 5 * (fund.percentage / 100),
      h: barHeight - 0.1,
      fill: { color: COLORS.primary },
    });

    // Value
    slide.addText(formatCurrency(fund.value, currency), {
      x: 9.1,
      y: yPos,
      w: 0.8,
      h: barHeight,
      fontSize: FONTS.caption,
      fontFace: 'Arial',
      color: COLORS.text,
      valign: 'middle',
    });

    yPos += barHeight + 0.15;
  });

  // Key returns summary
  slide.addShape('roundRect', {
    x: 0.5,
    y: 4.8,
    w: 9,
    h: 0.6,
    fill: { color: COLORS.success },
    rectRadius: 0.1,
  });

  const returnsText = `Expected Returns: ${formatCurrency(calculations.netProfit || 0, currency)} Net Profit | ` +
    `Payback: ${calculations.paybackPeriod > 0 ? calculations.paybackPeriod + ' months' : 'TBD'}`;

  slide.addText(returnsText, {
    x: 0.5,
    y: 4.9,
    w: 9,
    h: 0.4,
    fontSize: FONTS.body,
    fontFace: 'Arial',
    color: COLORS.white,
    align: 'center',
  });
}

/**
 * Create closing slide with contact/next steps
 */
function createClosingSlide(pptx: PptxGenJS, data: BusinessData): void {
  const slide = pptx.addSlide();

  // Background
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: '100%',
    fill: { color: COLORS.primary },
  });

  // Thank you message
  slide.addText('Thank You', {
    x: 0.5,
    y: 1.5,
    w: '90%',
    h: 1,
    fontSize: FONTS.title,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.white,
    align: 'center',
  });

  // Project name
  slide.addText(data.meta.title || 'Business Case', {
    x: 0.5,
    y: 2.5,
    w: '90%',
    h: 0.6,
    fontSize: FONTS.heading,
    fontFace: 'Arial',
    color: COLORS.white,
    align: 'center',
  });

  // Next steps
  slide.addText('Ready to discuss next steps', {
    x: 0.5,
    y: 3.5,
    w: '90%',
    h: 0.5,
    fontSize: FONTS.body,
    fontFace: 'Arial',
    color: COLORS.white,
    align: 'center',
  });

  // Timestamp
  const timestamp = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  slide.addText(`Generated on ${timestamp}`, {
    x: 0.5,
    y: 4.5,
    w: '90%',
    h: 0.4,
    fontSize: FONTS.caption,
    fontFace: 'Arial',
    color: COLORS.white,
    align: 'center',
  });

  // Branding
  slide.addText('Powered by Bizcaseland', {
    x: 0.5,
    y: 5.0,
    w: '90%',
    h: 0.3,
    fontSize: FONTS.caption,
    fontFace: 'Arial',
    italic: true,
    color: COLORS.white,
    align: 'center',
  });
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Export business case to PowerPoint pitch deck
 *
 * @param businessData - Business case data
 * @param marketData - Optional market analysis data
 * @param providedCalculations - Optional pre-calculated metrics
 */
export async function exportToPitchDeck(
  businessData: BusinessData,
  marketData?: MarketData,
  providedCalculations?: CalculatedMetrics
): Promise<void> {
  // Initialize presentation
  const pptx = new PptxGenJS();

  // Set presentation properties
  pptx.author = 'Bizcaseland';
  pptx.title = `${businessData.meta.title || 'Business Case'} - Pitch Deck`;
  pptx.subject = 'Investor Pitch Deck';
  pptx.company = 'Bizcaseland';

  // Set layout
  pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
  pptx.layout = 'LAYOUT_16x9';

  // Calculate metrics if not provided
  const calculations = providedCalculations || calculateBusinessMetrics(businessData);

  // Generate slides
  // 1. Title slide
  createTitleSlide(pptx, businessData);

  // 2. Problem slide
  createProblemSlide(pptx, businessData, marketData);

  // 3. Solution slide
  createSolutionSlide(pptx, businessData, marketData);

  // 4. Market size slide
  createMarketSizeSlide(pptx, businessData, marketData);

  // 5. Business model slide
  createBusinessModelSlide(pptx, businessData);

  // 6. Financial highlights slide
  createFinancialHighlightsSlide(pptx, businessData, calculations);

  // 7. Unit economics slide
  createUnitEconomicsSlide(pptx, businessData, calculations);

  // 8. Financial projections slide
  createFinancialProjectionsSlide(pptx, businessData, calculations);

  // 9. The Ask slide
  createTheAskSlide(pptx, businessData, calculations);

  // 10. Closing slide
  createClosingSlide(pptx, businessData);

  // Generate filename
  const sanitizedTitle = (businessData.meta.title || 'business-case')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `pitch-deck-${sanitizedTitle}-${dateStr}`;

  // Save the presentation
  await pptx.writeFile({ fileName: filename });
}
