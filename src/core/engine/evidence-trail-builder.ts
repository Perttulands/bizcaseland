/**
 * Evidence Trail Builder
 * Generates dependency trees showing provenance for calculated values
 */

import type { BusinessData, MonthlyData } from '../types/business';
import type { EvidenceNode, EvidenceContext, EvidenceTrail } from '../types/evidence-trail';
import { getNestedValue } from './utils/nested-operations';

/**
 * Build an evidence trail for a specific metric
 */
export function buildEvidenceTrail(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  context: EvidenceContext
): EvidenceTrail {
  const root = buildMetricNode(businessData, monthlyData, context.metricKey, context.month);

  return {
    context,
    root,
    generatedAt: new Date()
  };
}

/**
 * Build an evidence node for a specific metric
 */
function buildMetricNode(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  metricKey: string,
  month?: number
): EvidenceNode {
  const isCostSavings = businessData.meta.business_model === 'cost_savings';
  const isRecurring = businessData.meta.business_model === 'recurring';
  const monthData = month ? monthlyData[month - 1] : undefined;

  // Get drivers for highlighting
  const drivers = businessData.drivers || [];
  const driverPaths = new Set(drivers.map(d => d.path));

  switch (metricKey) {
    case 'revenue':
    case 'totalRevenue':
      return buildRevenueNode(businessData, monthlyData, month, isCostSavings, driverPaths);

    case 'netProfit':
      return buildNetProfitNode(businessData, monthlyData, month, driverPaths);

    case 'npv':
      return buildNPVNode(businessData, monthlyData, driverPaths);

    case 'irr':
      return buildIRRNode(businessData, monthlyData, driverPaths);

    case 'paybackPeriod':
      return buildPaybackNode(businessData, monthlyData, driverPaths);

    case 'breakEvenMonth':
      return buildBreakEvenNode(businessData, monthlyData, driverPaths);

    case 'totalInvestmentRequired':
      return buildInvestmentNode(businessData, monthlyData, driverPaths);

    case 'grossProfit':
      return buildGrossProfitNode(businessData, monthlyData, month, isCostSavings, driverPaths);

    case 'ebitda':
      return buildEBITDANode(businessData, monthlyData, month, isCostSavings, driverPaths);

    case 'netCashFlow':
      return buildNetCashFlowNode(businessData, monthlyData, month, driverPaths);

    case 'salesVolume':
      return buildSalesVolumeNode(businessData, monthlyData, month, driverPaths);

    case 'costSavings':
      return buildCostSavingsNode(businessData, monthlyData, month, driverPaths);

    case 'efficiencyGains':
      return buildEfficiencyGainsNode(businessData, monthlyData, month, driverPaths);

    case 'totalOpex':
      return buildOpexNode(businessData, monthlyData, month, driverPaths);

    case 'cogs':
      return buildCOGSNode(businessData, monthlyData, month, driverPaths);

    case 'capex':
      return buildCapexNode(businessData, monthlyData, month, driverPaths);

    default:
      return {
        id: `metric-${metricKey}`,
        type: 'calculated',
        label: metricKey,
        value: monthData ? (monthData as any)[metricKey] : undefined,
        children: []
      };
  }
}

function buildRevenueNode(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  month: number | undefined,
  isCostSavings: boolean,
  driverPaths: Set<string>
): EvidenceNode {
  const monthData = month ? monthlyData[month - 1] : undefined;
  const totalRevenue = month
    ? monthData?.revenue || 0
    : monthlyData.reduce((sum, m) => sum + m.revenue, 0);

  if (isCostSavings) {
    const costSavings = month
      ? monthData?.costSavings || 0
      : monthlyData.reduce((sum, m) => sum + (m.costSavings || 0), 0);
    const efficiencyGains = month
      ? monthData?.efficiencyGains || 0
      : monthlyData.reduce((sum, m) => sum + (m.efficiencyGains || 0), 0);

    return {
      id: 'revenue',
      type: 'calculated',
      label: month ? `Total Benefits (Month ${month})` : 'Total Benefits (5Y)',
      value: totalRevenue,
      unit: businessData.meta.currency,
      formula: 'Cost Savings + Efficiency Gains',
      children: [
        buildCostSavingsNode(businessData, monthlyData, month, driverPaths),
        buildEfficiencyGainsNode(businessData, monthlyData, month, driverPaths)
      ]
    };
  }

  const salesVolume = month
    ? monthData?.salesVolume || 0
    : monthlyData.reduce((sum, m) => sum + m.salesVolume, 0);
  const avgPrice = month
    ? monthData?.unitPrice || 0
    : salesVolume > 0 ? totalRevenue / salesVolume : 0;

  return {
    id: 'revenue',
    type: 'calculated',
    label: month ? `Revenue (Month ${month})` : 'Total Revenue (5Y)',
    value: totalRevenue,
    unit: businessData.meta.currency,
    formula: 'Sales Volume × Unit Price',
    children: [
      buildSalesVolumeNode(businessData, monthlyData, month, driverPaths),
      buildPricingNode(businessData, driverPaths)
    ]
  };
}

function buildCostSavingsNode(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  month: number | undefined,
  driverPaths: Set<string>
): EvidenceNode {
  const baselineCosts = businessData.assumptions?.cost_savings?.baseline_costs || [];
  const monthData = month ? monthlyData[month - 1] : undefined;
  const value = month
    ? monthData?.costSavings || 0
    : monthlyData.reduce((sum, m) => sum + (m.costSavings || 0), 0);

  const children: EvidenceNode[] = baselineCosts.map((cost, idx) => {
    const basePath = `assumptions.cost_savings.baseline_costs[${idx}]`;
    const savingsPath = `${basePath}.savings_potential_pct.value`;
    const costPath = `${basePath}.current_monthly_cost.value`;

    return {
      id: `baseline-cost-${cost.id}`,
      type: 'assumption' as const,
      label: cost.label,
      formula: `${cost.current_monthly_cost?.value || 0} × ${(cost.savings_potential_pct?.value || 0)}%`,
      path: basePath,
      children: [
        {
          id: `baseline-cost-${cost.id}-base`,
          type: 'input' as const,
          label: 'Monthly Cost',
          value: cost.current_monthly_cost?.value,
          unit: businessData.meta.currency,
          rationale: cost.current_monthly_cost?.rationale,
          path: costPath,
          isDriver: driverPaths.has(costPath),
          children: []
        },
        {
          id: `baseline-cost-${cost.id}-rate`,
          type: 'input' as const,
          label: 'Savings Rate',
          value: cost.savings_potential_pct?.value,
          unit: '%',
          rationale: cost.savings_potential_pct?.rationale,
          path: savingsPath,
          isDriver: driverPaths.has(savingsPath),
          children: []
        }
      ]
    };
  });

  return {
    id: 'cost-savings',
    type: 'calculated',
    label: month ? `Cost Savings (Month ${month})` : 'Total Cost Savings',
    value,
    unit: businessData.meta.currency,
    formula: 'Σ (Baseline Cost × Savings Rate × Implementation Factor)',
    children
  };
}

function buildEfficiencyGainsNode(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  month: number | undefined,
  driverPaths: Set<string>
): EvidenceNode {
  const efficiencyGains = businessData.assumptions?.cost_savings?.efficiency_gains || [];
  const monthData = month ? monthlyData[month - 1] : undefined;
  const value = month
    ? monthData?.efficiencyGains || 0
    : monthlyData.reduce((sum, m) => sum + (m.efficiencyGains || 0), 0);

  const children: EvidenceNode[] = efficiencyGains.map((gain, idx) => {
    const basePath = `assumptions.cost_savings.efficiency_gains[${idx}]`;

    return {
      id: `efficiency-gain-${gain.id}`,
      type: 'assumption' as const,
      label: gain.label,
      formula: `${gain.improved_value?.value || 0} ${gain.metric} × ${gain.value_per_unit?.value || 0}/unit`,
      path: basePath,
      children: [
        {
          id: `efficiency-gain-${gain.id}-baseline`,
          type: 'input' as const,
          label: `Baseline ${gain.metric}`,
          value: gain.baseline_value?.value,
          unit: gain.metric,
          rationale: gain.baseline_value?.rationale,
          path: `${basePath}.baseline_value.value`,
          isDriver: driverPaths.has(`${basePath}.baseline_value.value`),
          children: []
        },
        {
          id: `efficiency-gain-${gain.id}-improved`,
          type: 'input' as const,
          label: `Improved ${gain.metric}`,
          value: gain.improved_value?.value,
          unit: gain.metric,
          rationale: gain.improved_value?.rationale,
          path: `${basePath}.improved_value.value`,
          isDriver: driverPaths.has(`${basePath}.improved_value.value`),
          children: []
        },
        {
          id: `efficiency-gain-${gain.id}-value`,
          type: 'input' as const,
          label: 'Value per Unit',
          value: gain.value_per_unit?.value,
          unit: `${businessData.meta.currency}/${gain.metric}`,
          rationale: gain.value_per_unit?.rationale,
          path: `${basePath}.value_per_unit.value`,
          isDriver: driverPaths.has(`${basePath}.value_per_unit.value`),
          children: []
        }
      ]
    };
  });

  return {
    id: 'efficiency-gains',
    type: 'calculated',
    label: month ? `Efficiency Gains (Month ${month})` : 'Total Efficiency Gains',
    value,
    unit: businessData.meta.currency,
    formula: 'Σ (Improved Value × Value per Unit × Implementation Factor)',
    children
  };
}

function buildSalesVolumeNode(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  month: number | undefined,
  driverPaths: Set<string>
): EvidenceNode {
  const segments = businessData.assumptions?.customers?.segments || [];
  const monthData = month ? monthlyData[month - 1] : undefined;
  const value = month
    ? monthData?.salesVolume || 0
    : monthlyData.reduce((sum, m) => sum + m.salesVolume, 0);

  const children: EvidenceNode[] = segments.map((segment, idx) => {
    const basePath = `assumptions.customers.segments[${idx}]`;
    const volumeConfig = segment.volume;

    return {
      id: `segment-${segment.id}`,
      type: 'assumption' as const,
      label: segment.label,
      rationale: segment.rationale,
      path: basePath,
      children: volumeConfig ? [
        {
          id: `segment-${segment.id}-type`,
          type: 'input' as const,
          label: 'Growth Pattern',
          value: volumeConfig.pattern_type || volumeConfig.type,
          children: []
        },
        ...(volumeConfig.yoy_growth ? [{
          id: `segment-${segment.id}-yoy`,
          type: 'input' as const,
          label: 'YoY Growth',
          value: (volumeConfig.yoy_growth.value * 100),
          unit: '%',
          rationale: volumeConfig.yoy_growth.rationale,
          path: `${basePath}.volume.yoy_growth.value`,
          isDriver: driverPaths.has(`${basePath}.volume.yoy_growth.value`),
          children: []
        }] : []),
        ...(volumeConfig.monthly_growth_rate ? [{
          id: `segment-${segment.id}-monthly`,
          type: 'input' as const,
          label: 'Monthly Growth',
          value: (volumeConfig.monthly_growth_rate.value * 100),
          unit: '%',
          rationale: volumeConfig.monthly_growth_rate.rationale,
          path: `${basePath}.volume.monthly_growth_rate.value`,
          isDriver: driverPaths.has(`${basePath}.volume.monthly_growth_rate.value`),
          children: []
        }] : [])
      ] : []
    };
  });

  return {
    id: 'sales-volume',
    type: 'calculated',
    label: month ? `Sales Volume (Month ${month})` : 'Total Sales Volume',
    value,
    unit: 'units',
    formula: 'Σ (Segment Base × Growth Factor)',
    children
  };
}

function buildPricingNode(
  businessData: BusinessData,
  driverPaths: Set<string>
): EvidenceNode {
  const pricing = businessData.assumptions?.pricing;
  const avgPrice = pricing?.avg_unit_price;
  const path = 'assumptions.pricing.avg_unit_price.value';

  return {
    id: 'pricing',
    type: 'assumption',
    label: 'Unit Price',
    value: avgPrice?.value,
    unit: businessData.meta.currency,
    rationale: avgPrice?.rationale,
    path,
    isDriver: driverPaths.has(path),
    children: pricing?.yearly_adjustments?.pricing_factors?.map((factor, idx) => ({
      id: `pricing-factor-${idx}`,
      type: 'input' as const,
      label: `Year ${factor.year} Adjustment`,
      value: factor.factor,
      rationale: factor.rationale,
      children: []
    })) || []
  };
}

function buildNetProfitNode(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  month: number | undefined,
  driverPaths: Set<string>
): EvidenceNode {
  const isCostSavings = businessData.meta.business_model === 'cost_savings';
  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
  const totalOpex = monthlyData.reduce((sum, m) => sum + m.totalOpex, 0);
  const totalCapex = monthlyData.reduce((sum, m) => sum + m.capex, 0);
  const totalCogs = monthlyData.reduce((sum, m) => sum + m.cogs, 0);
  const netProfit = totalRevenue - totalCogs + totalOpex - totalCapex;

  return {
    id: 'net-profit',
    type: 'calculated',
    label: 'Net Profit (5Y)',
    value: netProfit,
    unit: businessData.meta.currency,
    formula: isCostSavings
      ? 'Total Benefits + Total OpEx - Total CapEx'
      : 'Total Revenue - COGS + Total OpEx - Total CapEx',
    children: [
      buildRevenueNode(businessData, monthlyData, undefined, isCostSavings, driverPaths),
      ...(!isCostSavings ? [buildCOGSNode(businessData, monthlyData, undefined, driverPaths)] : []),
      buildOpexNode(businessData, monthlyData, undefined, driverPaths),
      buildCapexNode(businessData, monthlyData, undefined, driverPaths)
    ]
  };
}

function buildNPVNode(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  driverPaths: Set<string>
): EvidenceNode {
  const interestRate = businessData.assumptions?.financial?.interest_rate;
  const path = 'assumptions.financial.interest_rate.value';

  return {
    id: 'npv',
    type: 'calculated',
    label: 'Net Present Value',
    formula: 'Σ (Net Cash Flow / (1 + r)^t)',
    children: [
      buildNetCashFlowNode(businessData, monthlyData, undefined, driverPaths),
      {
        id: 'discount-rate',
        type: 'assumption',
        label: 'Discount Rate',
        value: interestRate?.value ? interestRate.value * 100 : undefined,
        unit: '%',
        rationale: interestRate?.rationale,
        path,
        isDriver: driverPaths.has(path),
        children: []
      }
    ]
  };
}

function buildIRRNode(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  driverPaths: Set<string>
): EvidenceNode {
  return {
    id: 'irr',
    type: 'calculated',
    label: 'Internal Rate of Return',
    formula: 'Rate where NPV = 0 (Newton-Raphson method)',
    rationale: 'The discount rate that makes the net present value of all cash flows equal to zero',
    children: [
      buildNetCashFlowNode(businessData, monthlyData, undefined, driverPaths)
    ]
  };
}

function buildPaybackNode(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  driverPaths: Set<string>
): EvidenceNode {
  let cumulativeCashFlow = 0;
  let paybackMonth = 0;

  for (let i = 0; i < monthlyData.length; i++) {
    cumulativeCashFlow += monthlyData[i].netCashFlow;
    if (cumulativeCashFlow >= 0 && paybackMonth === 0) {
      paybackMonth = i + 1;
      break;
    }
  }

  return {
    id: 'payback-period',
    type: 'calculated',
    label: 'Payback Period',
    value: paybackMonth,
    unit: 'months',
    formula: 'First month where cumulative cash flow ≥ 0',
    children: [
      buildNetCashFlowNode(businessData, monthlyData, undefined, driverPaths)
    ]
  };
}

function buildBreakEvenNode(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  driverPaths: Set<string>
): EvidenceNode {
  let breakEvenMonth = 0;

  for (let i = 0; i < monthlyData.length; i++) {
    if (monthlyData[i].ebitda >= 0 && breakEvenMonth === 0) {
      breakEvenMonth = i + 1;
      break;
    }
  }

  return {
    id: 'break-even',
    type: 'calculated',
    label: 'Break-even Month',
    value: breakEvenMonth,
    unit: 'months',
    formula: 'First month where EBITDA ≥ 0',
    children: [
      buildEBITDANode(businessData, monthlyData, undefined, businessData.meta.business_model === 'cost_savings', driverPaths)
    ]
  };
}

function buildInvestmentNode(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  driverPaths: Set<string>
): EvidenceNode {
  let cumulativeCashFlow = 0;
  let maxNegative = 0;

  for (const month of monthlyData) {
    cumulativeCashFlow += month.netCashFlow;
    if (cumulativeCashFlow < maxNegative) {
      maxNegative = cumulativeCashFlow;
    }
    if (cumulativeCashFlow >= 0) break;
  }

  return {
    id: 'total-investment',
    type: 'calculated',
    label: 'Required Investment to Break-even',
    value: Math.abs(maxNegative),
    unit: businessData.meta.currency,
    formula: 'Maximum cumulative negative cash flow before break-even',
    children: [
      buildCapexNode(businessData, monthlyData, undefined, driverPaths),
      buildOpexNode(businessData, monthlyData, undefined, driverPaths)
    ]
  };
}

function buildGrossProfitNode(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  month: number | undefined,
  isCostSavings: boolean,
  driverPaths: Set<string>
): EvidenceNode {
  const monthData = month ? monthlyData[month - 1] : undefined;
  const value = month
    ? monthData?.grossProfit || 0
    : monthlyData.reduce((sum, m) => sum + m.grossProfit, 0);

  return {
    id: 'gross-profit',
    type: 'calculated',
    label: month ? `Gross Profit (Month ${month})` : 'Total Gross Profit',
    value,
    unit: businessData.meta.currency,
    formula: isCostSavings ? 'Total Benefits' : 'Revenue - COGS',
    children: [
      buildRevenueNode(businessData, monthlyData, month, isCostSavings, driverPaths),
      ...(!isCostSavings ? [buildCOGSNode(businessData, monthlyData, month, driverPaths)] : [])
    ]
  };
}

function buildEBITDANode(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  month: number | undefined,
  isCostSavings: boolean,
  driverPaths: Set<string>
): EvidenceNode {
  const monthData = month ? monthlyData[month - 1] : undefined;
  const value = month
    ? monthData?.ebitda || 0
    : monthlyData.reduce((sum, m) => sum + m.ebitda, 0);

  return {
    id: 'ebitda',
    type: 'calculated',
    label: month ? `EBITDA (Month ${month})` : 'Total EBITDA',
    value,
    unit: businessData.meta.currency,
    formula: 'Gross Profit + Total Operating Expenses',
    children: [
      buildGrossProfitNode(businessData, monthlyData, month, isCostSavings, driverPaths),
      buildOpexNode(businessData, monthlyData, month, driverPaths)
    ]
  };
}

function buildNetCashFlowNode(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  month: number | undefined,
  driverPaths: Set<string>
): EvidenceNode {
  const isCostSavings = businessData.meta.business_model === 'cost_savings';
  const monthData = month ? monthlyData[month - 1] : undefined;
  const value = month
    ? monthData?.netCashFlow || 0
    : monthlyData.reduce((sum, m) => sum + m.netCashFlow, 0);

  return {
    id: 'net-cash-flow',
    type: 'calculated',
    label: month ? `Net Cash Flow (Month ${month})` : 'Total Net Cash Flow',
    value,
    unit: businessData.meta.currency,
    formula: 'EBITDA - CapEx',
    children: [
      buildEBITDANode(businessData, monthlyData, month, isCostSavings, driverPaths),
      buildCapexNode(businessData, monthlyData, month, driverPaths)
    ]
  };
}

function buildOpexNode(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  month: number | undefined,
  driverPaths: Set<string>
): EvidenceNode {
  const opexItems = businessData.assumptions?.opex || [];
  const monthData = month ? monthlyData[month - 1] : undefined;
  const value = month
    ? monthData?.totalOpex || 0
    : monthlyData.reduce((sum, m) => sum + m.totalOpex, 0);

  const children: EvidenceNode[] = opexItems.map((item, idx) => {
    const basePath = `assumptions.opex[${idx}]`;
    const hasLegacyValue = item.value !== undefined;
    const hasCostStructure = item.cost_structure !== undefined;

    const itemChildren: EvidenceNode[] = [];

    if (hasLegacyValue && item.value) {
      itemChildren.push({
        id: `opex-${idx}-value`,
        type: 'input',
        label: 'Monthly Cost',
        value: item.value.value,
        unit: businessData.meta.currency,
        rationale: item.value.rationale,
        path: `${basePath}.value.value`,
        isDriver: driverPaths.has(`${basePath}.value.value`),
        children: []
      });
    }

    if (hasCostStructure && item.cost_structure) {
      if (item.cost_structure.fixed_component) {
        itemChildren.push({
          id: `opex-${idx}-fixed`,
          type: 'input',
          label: 'Fixed Component',
          value: item.cost_structure.fixed_component.value,
          unit: businessData.meta.currency,
          rationale: item.cost_structure.fixed_component.rationale,
          path: `${basePath}.cost_structure.fixed_component.value`,
          isDriver: driverPaths.has(`${basePath}.cost_structure.fixed_component.value`),
          children: []
        });
      }
      if (item.cost_structure.variable_revenue_rate) {
        itemChildren.push({
          id: `opex-${idx}-var-rev`,
          type: 'input',
          label: 'Variable (% Revenue)',
          value: item.cost_structure.variable_revenue_rate.value * 100,
          unit: '%',
          rationale: item.cost_structure.variable_revenue_rate.rationale,
          path: `${basePath}.cost_structure.variable_revenue_rate.value`,
          isDriver: driverPaths.has(`${basePath}.cost_structure.variable_revenue_rate.value`),
          children: []
        });
      }
    }

    return {
      id: `opex-${idx}`,
      type: 'assumption' as const,
      label: item.name,
      path: basePath,
      children: itemChildren
    };
  });

  return {
    id: 'total-opex',
    type: 'calculated',
    label: month ? `Total OpEx (Month ${month})` : 'Total Operating Expenses',
    value,
    unit: businessData.meta.currency,
    formula: 'Σ (Fixed Costs + Variable Costs)',
    rationale: 'OpEx values are negative as they represent expenses',
    children
  };
}

function buildCOGSNode(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  month: number | undefined,
  driverPaths: Set<string>
): EvidenceNode {
  const cogsPct = businessData.assumptions?.unit_economics?.cogs_pct;
  const monthData = month ? monthlyData[month - 1] : undefined;
  const value = month
    ? monthData?.cogs || 0
    : monthlyData.reduce((sum, m) => sum + m.cogs, 0);
  const path = 'assumptions.unit_economics.cogs_pct.value';

  return {
    id: 'cogs',
    type: 'calculated',
    label: month ? `COGS (Month ${month})` : 'Total COGS',
    value,
    unit: businessData.meta.currency,
    formula: 'Revenue × COGS Rate',
    children: [
      {
        id: 'cogs-rate',
        type: 'assumption',
        label: 'COGS Rate',
        value: cogsPct?.value ? cogsPct.value * 100 : undefined,
        unit: '%',
        rationale: cogsPct?.rationale,
        path,
        isDriver: driverPaths.has(path),
        children: []
      }
    ]
  };
}

function buildCapexNode(
  businessData: BusinessData,
  monthlyData: readonly MonthlyData[],
  month: number | undefined,
  driverPaths: Set<string>
): EvidenceNode {
  const capexItems = businessData.assumptions?.capex || [];
  const monthData = month ? monthlyData[month - 1] : undefined;
  const value = month
    ? monthData?.capex || 0
    : monthlyData.reduce((sum, m) => sum + m.capex, 0);

  const children: EvidenceNode[] = capexItems.map((item, idx) => {
    const basePath = `assumptions.capex[${idx}]`;

    return {
      id: `capex-${idx}`,
      type: 'assumption' as const,
      label: item.name,
      path: basePath,
      children: item.timeline?.series?.map((point, pIdx) => ({
        id: `capex-${idx}-point-${pIdx}`,
        type: 'input' as const,
        label: `Period ${point.period}`,
        value: point.value,
        unit: businessData.meta.currency,
        rationale: point.rationale,
        path: `${basePath}.timeline.series[${pIdx}].value`,
        isDriver: driverPaths.has(`${basePath}.timeline.series[${pIdx}].value`),
        children: []
      })) || []
    };
  });

  return {
    id: 'capex',
    type: 'calculated',
    label: month ? `CapEx (Month ${month})` : 'Total CapEx',
    value,
    unit: businessData.meta.currency,
    formula: 'Σ (Investment per period)',
    rationale: 'CapEx values are negative as they represent investments',
    children
  };
}

/**
 * Format a value for display in the evidence trail
 */
export function formatEvidenceValue(
  value: number | string | undefined,
  unit?: string,
  currency?: string
): string {
  if (value === undefined) return '-';

  if (typeof value === 'string') return value;

  if (unit === '%') {
    return `${value.toFixed(1)}%`;
  }

  if (unit === 'months' || unit === 'units') {
    return value.toLocaleString();
  }

  // Currency formatting
  const currencyCode = unit || currency || 'EUR';
  if (['EUR', 'USD', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK'].includes(currencyCode)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  return value.toLocaleString();
}
