/**
 * Business Case Calculator
 * Central calculation engine for all business case metrics
 */

import { BusinessData } from '@/core/types';
import {
  calculateTotalVolumeForMonth,
  calculateSegmentVolumeForMonth,
  calculateDynamicUnitPrice,
  calculateDynamicSegmentVolume,
  calculateDynamicTotalVolumeForMonth,
  getPricingTrajectory,
  getVolumeTrajectory,
  calculateBaselineCostsForMonth,
  calculateCostSavingsForMonth,
  calculateEfficiencyGainsForMonth,
  calculateTotalBenefitsForMonth,
  calculateImplementationFactor
} from './business-calculator-full';
import { IRR_ERROR_CODES, isIRRError } from '../utils/financial';

export interface CalculatedMetrics {
  totalRevenue: number;
  netProfit: number;
  npv: number;
  irr: number;
  paybackPeriod: number;
  totalInvestmentRequired: number;
  breakEvenMonth: number;
  monthlyData: MonthlyData[];
}

export interface MonthlyData {
  month: number;
  date: Date;
  salesVolume: number;
  newCustomers: number;
  existingCustomers: number;
  unitPrice: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  salesMarketing: number;
  totalCAC: number;
  cac: number;
  rd: number;
  ga: number;
  totalOpex: number;
  ebitda: number;
  capex: number;
  netCashFlow: number;
  baselineCosts?: number;
  costSavings?: number;
  efficiencyGains?: number;
  totalBenefits?: number;
}

export interface OpexCalculationResult {
  salesMarketing: number;
  rd: number;
  ga: number;
  totalOpex: number;
}

// Re-export for external use
export { getIRRErrorMessage } from './business-calculator-full';
export {
  calculateTotalVolumeForMonth,
  calculateSegmentVolumeForMonth,
  calculateDynamicUnitPrice,
  calculateDynamicSegmentVolume,
  calculateDynamicTotalVolumeForMonth,
  getPricingTrajectory,
  getVolumeTrajectory,
  calculateBaselineCostsForMonth,
  calculateCostSavingsForMonth,
  calculateEfficiencyGainsForMonth,
  calculateTotalBenefitsForMonth,
  calculateImplementationFactor
};

/**
 * Central calculation engine for all business case metrics
 */
export function calculateBusinessMetrics(businessData: BusinessData | null): CalculatedMetrics {
  if (!businessData) {
    return getDefaultMetrics();
  }

  const monthlyData = generateMonthlyData(businessData);
  const totalRevenue = monthlyData.reduce((sum, month) => sum + month.revenue, 0);
  
  const interestRate = businessData.assumptions?.financial?.interest_rate?.value || 0;
  const npv = calculateNPV(monthlyData, interestRate);
  const irr = calculateIRR(monthlyData);
  const breakEvenMonth = calculateBreakEven(monthlyData);
  const netProfit = monthlyData.reduce((sum, month) => sum + month.netCashFlow, 0);
  const paybackPeriod = calculatePaybackPeriod(monthlyData);
  
  let cumulativeCashFlow = 0;
  let maxNegativeCumulativeCashFlow = 0;
  
  for (const month of monthlyData) {
    cumulativeCashFlow += month.netCashFlow;
    if (cumulativeCashFlow < maxNegativeCumulativeCashFlow) {
      maxNegativeCumulativeCashFlow = cumulativeCashFlow;
    }
  }
  
  const totalInvestmentRequired = Math.abs(maxNegativeCumulativeCashFlow);

  return {
    totalRevenue,
    netProfit,
    npv,
    irr,
    paybackPeriod,
    totalInvestmentRequired,
    breakEvenMonth: breakEvenMonth || 0,
    monthlyData
  };
}

/**
 * Generate monthly financial data based on business assumptions
 */
export function generateMonthlyData(businessData: BusinessData): MonthlyData[] {
  const months: MonthlyData[] = [];
  const startDate = new Date('2026-01-01');
  const periods = Math.min(businessData.meta?.periods || 60, 60);

  for (let i = 0; i < periods; i++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(startDate.getMonth() + i);
    
    let totalSalesVolume = calculateDynamicTotalVolumeForMonth(businessData, i);
    const businessModel = businessData?.meta?.business_model;
    const churnRate = businessData?.assumptions?.customers?.churn_pct?.value || 0;
    
    let newCustomers = 0;
    let existingCustomers = 0;
    let revenue = 0;
    let baselineCosts = 0;
    let costSavings = 0;
    let efficiencyGains = 0;
    let totalBenefits = 0;
    
    if (businessModel === 'cost_savings') {
      baselineCosts = calculateBaselineCostsForMonth(businessData, i);
      costSavings = calculateCostSavingsForMonth(businessData, i);
      efficiencyGains = calculateEfficiencyGainsForMonth(businessData, i);
      totalBenefits = calculateTotalBenefitsForMonth(businessData, i);
      revenue = Math.round(totalBenefits);
      totalSalesVolume = 1;
      newCustomers = 0;
      existingCustomers = 0;
    } else {
      if (businessModel === 'recurring') {
        if (i === 0) {
          newCustomers = totalSalesVolume;
          existingCustomers = 0;
        } else {
          const previousMonth = months[i - 1];
          existingCustomers = Math.round((previousMonth.newCustomers + previousMonth.existingCustomers) * (1 - churnRate));
          newCustomers = Math.max(0, totalSalesVolume - existingCustomers);
        }
      } else {
        newCustomers = totalSalesVolume;
        existingCustomers = 0;
      }
      
      const unitPrice = calculateDynamicUnitPrice(businessData, i);
      revenue = Math.round(totalSalesVolume * unitPrice);
    }
    
    const salesVolume = Math.round(totalSalesVolume);
    const cogs = -Math.round(revenue * (businessData?.assumptions?.unit_economics?.cogs_pct?.value || 0));
    const grossProfit = revenue + cogs;
    
    const opexResult = calculateOpexForMonth(businessData, i, revenue, totalSalesVolume);
    const salesMarketing = -opexResult.salesMarketing;
    const rd = -opexResult.rd;
    const ga = -opexResult.ga;
    
    const cac = businessData?.assumptions?.unit_economics?.cac?.value || 0;
    const totalCAC = businessModel === 'recurring'
      ? -Math.round(newCustomers * cac)
      : -Math.round(totalSalesVolume * cac);
    
    const totalOpex = salesMarketing + totalCAC + rd + ga;
    const ebitda = grossProfit + totalOpex;
    const capex = -calculateCapexForMonth(businessData, i);
    const netCashFlow = ebitda + capex;
    
    const monthData: MonthlyData = {
      month: i + 1,
      date: currentDate,
      salesVolume,
      newCustomers: Math.round(newCustomers),
      existingCustomers: Math.round(existingCustomers),
      unitPrice: businessModel === 'cost_savings' ? 0 : calculateDynamicUnitPrice(businessData, i),
      revenue,
      cogs,
      grossProfit,
      salesMarketing,
      totalCAC,
      cac,
      rd,
      ga,
      totalOpex,
      ebitda,
      capex,
      netCashFlow,
    };
    
    if (businessModel === 'cost_savings') {
      monthData.baselineCosts = Math.round(baselineCosts);
      monthData.costSavings = Math.round(costSavings);
      monthData.efficiencyGains = Math.round(efficiencyGains);
      monthData.totalBenefits = Math.round(totalBenefits);
    }
    
    months.push(monthData);
  }
  
  return months;
}

// NPV/IRR/Break-even calculations
export function calculateNPV(monthlyData: MonthlyData[], interestRate: number): number {
  const monthlyRate = interestRate / 12;
  return monthlyData.reduce((npv, month, index) => {
    const discountFactor = Math.pow(1 + monthlyRate, -(index + 1));
    return npv + (month.netCashFlow * discountFactor);
  }, 0);
}

export function calculateIRR(monthlyData: MonthlyData[], initialGuess: number = 0.1): number {
  if (!monthlyData || monthlyData.length === 0) return IRR_ERROR_CODES.NO_DATA;
  
  const cashFlows = monthlyData.map(month => month.netCashFlow);
  const allSame = cashFlows.every(cf => Math.abs(cf - cashFlows[0]) < 0.01);
  if (allSame) return IRR_ERROR_CODES.ALL_SAME;
  
  const allPositive = cashFlows.every(cf => cf >= 0);
  if (allPositive) return IRR_ERROR_CODES.ALL_POSITIVE;
  
  const allNegative = cashFlows.every(cf => cf <= 0);
  if (allNegative) return IRR_ERROR_CODES.ALL_NEGATIVE;
  
  let rate = initialGuess;
  let iteration = 0;
  const maxIterations = 1000;
  const tolerance = 0.000001;
  
  while (iteration < maxIterations) {
    const npvAtRate = cashFlows.reduce((npv, cashFlow, index) => {
      const discountFactor = Math.pow(1 + rate / 12, -(index + 1));
      return npv + (cashFlow * discountFactor);
    }, 0);
    
    if (Math.abs(npvAtRate) < tolerance) {
      const annualRate = Math.pow(1 + rate / 12, 12) - 1;
      if (annualRate < -0.99 || annualRate > 100) {
        return IRR_ERROR_CODES.EXTREME_RATE;
      }
      return rate;
    }
    
    const npvDerivative = cashFlows.reduce((derivative, cashFlow, index) => {
      const period = index + 1;
      const discountFactor = Math.pow(1 + rate / 12, -(period + 1));
      return derivative - (cashFlow * period * discountFactor) / (12 * (1 + rate / 12));
    }, 0);
    
    if (Math.abs(npvDerivative) < tolerance) break;
    
    const newRate = rate - npvAtRate / npvDerivative;
    
    if (Math.abs(newRate - rate) > 1.0) {
      rate = rate + Math.sign(newRate - rate) * 0.5;
    } else {
      rate = newRate;
    }
    
    if (rate < -0.5 || rate > 5.0) {
      return IRR_ERROR_CODES.EXTREME_RATE;
    }
    
    iteration++;
  }
  
  return IRR_ERROR_CODES.NO_CONVERGENCE;
}

export function calculateBreakEven(monthlyData: MonthlyData[]): number {
  for (let i = 0; i < monthlyData.length; i++) {
    if (monthlyData[i].netCashFlow > 0) {
      return i + 1;
    }
  }
  return 0;
}

export function calculatePaybackPeriod(monthlyData: MonthlyData[]): number {
  let cumulativeCashFlow = 0;
  for (let i = 0; i < monthlyData.length; i++) {
    cumulativeCashFlow += monthlyData[i].netCashFlow;
    if (cumulativeCashFlow >= 0) {
      return i + 1;
    }
  }
  return 0;
}

function getDefaultMetrics(): CalculatedMetrics {
  return {
    totalRevenue: 0,
    netProfit: 0,
    npv: 0,
    irr: 0,
    paybackPeriod: 0,
    totalInvestmentRequired: 0,
    breakEvenMonth: 0,
    monthlyData: []
  };
}

// OPEX calculations
export function calculateOpexForMonth(
  businessData: BusinessData | null,
  monthIndex: number,
  revenue: number,
  volume: number
): OpexCalculationResult {
  if (!businessData?.assumptions?.opex) {
    return { salesMarketing: 0, rd: 0, ga: 0, totalOpex: 0 };
  }

  const opexItems = businessData.assumptions.opex;
  const salesMarketing = calculateSingleOpexItem(opexItems[0], revenue, volume);
  const rd = calculateSingleOpexItem(opexItems[1], revenue, volume);
  const ga = calculateSingleOpexItem(opexItems[2], revenue, volume);
  const totalOpex = salesMarketing + rd + ga;

  return { salesMarketing, rd, ga, totalOpex };
}

function calculateSingleOpexItem(
  opexItem: any,
  revenue: number,
  volume: number
): number {
  if (!opexItem) return 0;

  if (opexItem.cost_structure) {
    const fixedComponent = opexItem.cost_structure.fixed_component?.value || 0;
    const variableRevenueRate = opexItem.cost_structure.variable_revenue_rate?.value || 0;
    const variableVolumeRate = opexItem.cost_structure.variable_volume_rate?.value || 0;

    return Math.round(
      fixedComponent +
      (revenue * variableRevenueRate) +
      (volume * variableVolumeRate)
    );
  }

  if (opexItem.value?.value !== undefined) {
    return opexItem.value.value;
  }

  return 0;
}

// Capex calculations
export function calculateCapexForMonth(businessData: BusinessData, monthIndex: number): number {
  const capexItems = businessData?.assumptions?.capex || [];
  let totalCapex = 0;

  for (const item of capexItems) {
    const timeline = item?.timeline;
    if (!timeline) continue;

    if (timeline.type === "time_series") {
      const series = timeline.series || [];
      const monthData = series.find((s: any) => s.period === monthIndex + 1);
      if (monthData) {
        totalCapex += monthData.value || 0;
      }
    }
  }

  return totalCapex;
}

// Formatting utilities  
export { formatCurrency, formatPercent } from '../utils/financial';
