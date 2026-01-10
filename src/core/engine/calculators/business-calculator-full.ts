/**
 * Business Case Calculator
 * Full implementation of all business case calculations
 */

import { BusinessData } from '@/core/types';

export interface CalculatedMetrics {
  totalRevenue: number;
  netProfit: number;
  npv: number;
  irr: number;
  paybackPeriod: number;
  totalInvestmentRequired: number; // Total amount needed to fund the business until break-even
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
  // Cost savings specific fields
  baselineCosts?: number;
  costSavings?: number;
  efficiencyGains?: number;
  totalBenefits?: number;
}

/**
 * Central calculation engine for all business case metrics
 * This ensures consistency across all components
 */
export function calculateBusinessMetrics(businessData: BusinessData | null): CalculatedMetrics {
  if (!businessData) {
    return getDefaultMetrics();
  }

  const monthlyData = generateMonthlyData(businessData);
  const totalRevenue = monthlyData.reduce((sum, month) => sum + month.revenue, 0);
  const totalCashFlow = monthlyData.reduce((sum, month) => sum + month.netCashFlow, 0);
  
  // Calculate NPV
  const interestRate = businessData.assumptions?.financial?.interest_rate?.value || 0;
  const npv = calculateNPV(monthlyData, interestRate);
  
  // Calculate IRR
  const irr = calculateIRR(monthlyData);
  
  // Calculate break-even
  const breakEvenMonth = calculateBreakEven(monthlyData);
  
  // Calculate other metrics
  const netProfit = monthlyData.reduce((sum, month) => sum + month.netCashFlow, 0);
  const paybackPeriod = calculatePaybackPeriod(monthlyData);
  
  // Calculate Total Investment Required: maximum cumulative negative cash flow
  // This represents the total amount of money needed to fund the business until it becomes self-sustaining
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
  const startDate = new Date('2026-01-01'); // Default start date
  const periods = Math.min(businessData.meta?.periods || 60, 60);

  for (let i = 0; i < periods; i++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(startDate.getMonth() + i);
    
    // Calculate total sales volume from all customer segments using dynamic calculations
    let totalSalesVolume = calculateDynamicTotalVolumeForMonth(businessData, i);
    
    // Determine business model and calculate revenue/benefits
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
      // For cost savings models, calculate savings and efficiency gains instead of revenue
      baselineCosts = calculateBaselineCostsForMonth(businessData, i);
      costSavings = calculateCostSavingsForMonth(businessData, i);
      efficiencyGains = calculateEfficiencyGainsForMonth(businessData, i);
      totalBenefits = calculateTotalBenefitsForMonth(businessData, i);
      
      // For cost savings, use total benefits as "revenue"
      revenue = Math.round(totalBenefits);
      
      // Set sales volume to 1 for simplicity (not really applicable to cost savings)
      totalSalesVolume = 1;
      newCustomers = 0;
      existingCustomers = 0;
    } else {
      // Existing logic for recurring and unit sales models
      if (businessModel === 'recurring') {
        // For recurring models, differentiate between new and existing customers
        if (i === 0) {
          // First month: all customers are new
          newCustomers = totalSalesVolume;
          existingCustomers = 0;
        } else {
          // Calculate existing customers from previous month (minus churn)
          const previousMonth = months[i - 1];
          existingCustomers = Math.round((previousMonth.newCustomers + previousMonth.existingCustomers) * (1 - churnRate));
          
          // New customers is the difference to reach total volume
          newCustomers = Math.max(0, totalSalesVolume - existingCustomers);
        }
      } else {
        // For transactional/unit sales models, all volume represents new transactions each month
        // We don't track customers separately - each unit sale is independent
        newCustomers = totalSalesVolume; // This represents units sold, not customers
        existingCustomers = 0;
      }
      
      const unitPrice = calculateDynamicUnitPrice(businessData, i);
      revenue = Math.round(totalSalesVolume * unitPrice);
    }
    
    const salesVolume = Math.round(totalSalesVolume);
    
    const cogs = -Math.round(revenue * (businessData?.assumptions?.unit_economics?.cogs_pct?.value || 0));
    const grossProfit = revenue + cogs;
    
    // Calculate OPEX using new variable cost structure
    const opexResult = calculateOpexForMonth(businessData, i, revenue, totalSalesVolume);
    const salesMarketing = -opexResult.salesMarketing; // Make negative (expense)
    const rd = -opexResult.rd; // Make negative (expense)
    const ga = -opexResult.ga; // Make negative (expense)

    const cac = businessData?.assumptions?.unit_economics?.cac?.value || 0;

    // For recurring models: CAC only applies to new customers
    // For unit sales models: CAC applies to all units (since each sale is independent)
    const totalCAC = businessModel === 'recurring'
      ? -Math.round(newCustomers * cac)
      : -Math.round(totalSalesVolume * cac);

    // Use totalOpex from opexResult (includes ALL opex items, not just first 3) + CAC
    const totalOpex = -opexResult.totalOpex + totalCAC;
    
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
    
    // Add cost savings specific fields if applicable
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

/**
 * Calculate Net Present Value using discount rate
 */
export function calculateNPV(monthlyData: MonthlyData[], interestRate: number): number {
  const monthlyRate = interestRate / 12;
  
  return monthlyData.reduce((npv, month, index) => {
    const discountFactor = Math.pow(1 + monthlyRate, -(index + 1));
    return npv + (month.netCashFlow * discountFactor);
  }, 0);
}

// Constants for better error handling
export const IRR_ERROR_CODES = {
  NO_DATA: -999,
  ALL_SAME: -998,
  ALL_POSITIVE: -997,
  ALL_NEGATIVE: -996,
  NO_CONVERGENCE: -995,
  EXTREME_RATE: -994
} as const;

/**
 * Calculate Internal Rate of Return using iterative approach
 * Returns the monthly IRR as a decimal (e.g., 0.05 = 5% monthly)
 * Returns negative error codes for invalid scenarios
 */
export function calculateIRR(monthlyData: MonthlyData[], initialGuess: number = 0.1): number {
  if (!monthlyData || monthlyData.length === 0) return IRR_ERROR_CODES.NO_DATA;
  
  const cashFlows = monthlyData.map(month => month.netCashFlow);
  
  // Check if all cash flows are the same (no IRR possible)
  const allSame = cashFlows.every(cf => Math.abs(cf - cashFlows[0]) < 0.01);
  if (allSame) return IRR_ERROR_CODES.ALL_SAME;
  
  // Check if all cash flows are positive (no IRR needed - infinite return)
  const allPositive = cashFlows.every(cf => cf >= 0);
  if (allPositive) return IRR_ERROR_CODES.ALL_POSITIVE;
  
  // Check if all cash flows are negative (no IRR possible)
  const allNegative = cashFlows.every(cf => cf <= 0);
  if (allNegative) return IRR_ERROR_CODES.ALL_NEGATIVE;
  
  // Newton-Raphson method to find IRR
  let rate = initialGuess;
  let iteration = 0;
  const maxIterations = 1000; // Increased for better convergence
  const tolerance = 0.000001; // Tighter tolerance
  
  while (iteration < maxIterations) {
    const npvAtRate = cashFlows.reduce((npv, cashFlow, index) => {
      const discountFactor = Math.pow(1 + rate / 12, -(index + 1));
      return npv + (cashFlow * discountFactor);
    }, 0);
    
    if (Math.abs(npvAtRate) < tolerance) {
      // Check for extreme rates (outside -99% to 10,000% annually)
      const annualRate = Math.pow(1 + rate / 12, 12) - 1;
      if (annualRate < -0.99 || annualRate > 100) {
        return IRR_ERROR_CODES.EXTREME_RATE;
      }
      return rate;
    }
    
    // Derivative for Newton-Raphson method
    const npvDerivative = cashFlows.reduce((derivative, cashFlow, index) => {
      const period = index + 1;
      const discountFactor = Math.pow(1 + rate / 12, -(period + 1));
      return derivative - (cashFlow * period * discountFactor) / (12 * (1 + rate / 12));
    }, 0);
    
    if (Math.abs(npvDerivative) < tolerance) {
      break; // Avoid division by zero
    }
    
    const newRate = rate - npvAtRate / npvDerivative;
    
    // Prevent extreme rate changes but allow wider search
    if (Math.abs(newRate - rate) > 1.0) {
      rate = rate + Math.sign(newRate - rate) * 0.5; // Larger but controlled step
    } else {
      rate = newRate;
    }
    
    // Wider bounds during search (monthly rates from -50% to +500%)
    if (rate < -0.5 || rate > 5.0) {
      return IRR_ERROR_CODES.EXTREME_RATE;
    }
    
    iteration++;
  }
  
  return IRR_ERROR_CODES.NO_CONVERGENCE;
}

/**
 * Calculate total volume for a specific month from all customer segments
 */
export function calculateTotalVolumeForMonth(businessData: BusinessData, monthIndex: number): number {
  const segments = businessData?.assumptions?.customers?.segments || [];
  let totalVolume = 0;

  for (const segment of segments) {
    const volume = calculateSegmentVolumeForMonth(segment, monthIndex, businessData);
    totalVolume += volume;
  }

  return totalVolume;
}

/**
 * Calculate volume for a specific segment and month
 */
export function calculateSegmentVolumeForMonth(segment: any, monthIndex: number, businessData?: BusinessData): number {
  const volume = segment?.volume;
  if (!volume) return 0;

  // First check for new segment-level pattern types with base_value
  if (volume.pattern_type) {
    // New segment-level patterns
    if (volume.pattern_type === "seasonal_growth" && volume.seasonal_pattern && volume.base_value !== undefined) {
      return calculateSegmentSeasonalPattern(volume, monthIndex);
    } else if (volume.pattern_type === "geometric_growth" && volume.growth_rate !== undefined && volume.base_value !== undefined) {
      return calculateSegmentGeometricGrowth(volume, monthIndex);
    } else if (volume.pattern_type === "linear_growth" && volume.growth_rate !== undefined && volume.base_value !== undefined) {
      return calculateSegmentLinearGrowth(volume, monthIndex);
    }
  }

  // Existing pattern logic for backward compatibility
  if (volume.type === "pattern") {
    // Check which pattern type is configured (only one should be used)
    if (volume.pattern_type === "seasonal_growth") {
      return calculateSeasonalGrowthVolume(volume, monthIndex, businessData);
    } else if (volume.pattern_type === "geom_growth") {
      return calculateGeomGrowthVolume(volume, monthIndex, businessData);
    } else if (volume.pattern_type === "linear_growth") {
      return calculateLinearGrowthVolume(volume, monthIndex, businessData);
    } else {
      // If no pattern_type specified, try to auto-detect from growth_settings
      const growthSettings = businessData?.assumptions?.growth_settings;
      if (growthSettings?.seasonal_growth?.base_year_total?.value > 0) {
        return calculateSeasonalGrowthVolume(volume, monthIndex, businessData);
      } else if (growthSettings?.geom_growth?.start?.value > 0) {
        return calculateGeomGrowthVolume(volume, monthIndex, businessData);
      } else if (growthSettings?.linear_growth?.start?.value > 0) {
        return calculateLinearGrowthVolume(volume, monthIndex, businessData);
      }
    }
  } else if (volume.type === "time_series") {
    return calculateTimeSeriesVolume(volume, monthIndex);
  }

  // Fallback to series data if available
  const firstSeriesValue = volume?.series?.[0]?.value || 0;
  return firstSeriesValue;
}

/**
 * Calculate volume using seasonal growth pattern
 */
export function calculateSeasonalGrowthVolume(volume: any, monthIndex: number, businessData?: BusinessData): number {
  // Try to get values from volume object first, then fallback to growth_settings
  let baseYearTotal = volume.base_year_total?.value;
  let seasonalityIndices = volume.seasonality_index_12;
  let yoyGrowth = volume.yoy_growth?.value;
  
  // If not found in volume, try growth_settings
  if (baseYearTotal === undefined && businessData?.assumptions?.growth_settings?.seasonal_growth) {
    baseYearTotal = businessData.assumptions.growth_settings.seasonal_growth.base_year_total?.value;
  }
  if (!seasonalityIndices && businessData?.assumptions?.growth_settings?.seasonal_growth) {
    seasonalityIndices = businessData.assumptions.growth_settings.seasonal_growth.seasonality_index_12?.value;
  }
  if (yoyGrowth === undefined && businessData?.assumptions?.growth_settings?.seasonal_growth) {
    yoyGrowth = businessData.assumptions.growth_settings.seasonal_growth.yoy_growth?.value;
  }
  
  // Apply defaults
  baseYearTotal = baseYearTotal || 0;
  seasonalityIndices = seasonalityIndices || [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  yoyGrowth = yoyGrowth || 0;

  // Ensure we have 12 seasonality values
  if (seasonalityIndices.length !== 12) {
    seasonalityIndices = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  }

  // Normalize seasonality indices to sum to 12 (monthly multipliers should average to 1)
  const currentSum = seasonalityIndices.reduce((sum: number, val: number) => sum + val, 0);
  if (currentSum > 0) {
    seasonalityIndices = seasonalityIndices.map((val: number) => (val * 12) / currentSum);
  }

  // Calculate which year and month we're in
  const yearIndex = Math.floor(monthIndex / 12);
  const monthInYear = monthIndex % 12;

  // Apply year-over-year growth
  const yearlyTotal = baseYearTotal * Math.pow(1 + yoyGrowth, yearIndex);
  
  // Calculate monthly average and apply seasonality
  const monthlyAverage = yearlyTotal / 12;
  const seasonalityFactor = seasonalityIndices[monthInYear] || 1;
  
  return monthlyAverage * seasonalityFactor;
}

/**
 * Calculate volume using geometric growth pattern
 */
export function calculateGeomGrowthVolume(volume: any, monthIndex: number, businessData?: BusinessData): number {
  // Try to get values from volume object first - support multiple formats
  let startValue = volume?.start?.value || volume?.series?.[0]?.value;
  let monthlyGrowthRate = volume.monthly_growth_rate?.value;
  
  // If not found in volume, try growth_settings
  if (startValue === undefined && businessData?.assumptions?.growth_settings?.geom_growth) {
    startValue = businessData.assumptions.growth_settings.geom_growth.start?.value;
  }
  if (monthlyGrowthRate === undefined && businessData?.assumptions?.growth_settings?.geom_growth) {
    monthlyGrowthRate = businessData.assumptions.growth_settings.geom_growth.monthly_growth?.value;
  }
  
  // Apply defaults
  startValue = startValue || 0;
  monthlyGrowthRate = monthlyGrowthRate || 0;
  
  return startValue * Math.pow(1 + monthlyGrowthRate, monthIndex);
}

/**
 * Calculate volume using linear growth pattern
 */
export function calculateLinearGrowthVolume(volume: any, monthIndex: number, businessData?: BusinessData): number {
  // Try to get values from volume object first - support multiple formats
  let startValue = volume?.start?.value || volume?.series?.[0]?.value;
  let monthlyIncrease = volume.monthly_flat_increase?.value;
  
  // If not found in volume, try growth_settings
  if (startValue === undefined && businessData?.assumptions?.growth_settings?.linear_growth) {
    startValue = businessData.assumptions.growth_settings.linear_growth.start?.value;
  }
  if (monthlyIncrease === undefined && businessData?.assumptions?.growth_settings?.linear_growth) {
    monthlyIncrease = businessData.assumptions.growth_settings.linear_growth.monthly_flat_increase?.value;
  }
  
  // Apply defaults
  startValue = startValue || 0;
  monthlyIncrease = monthlyIncrease || 0;
  
  return startValue + (monthlyIncrease * monthIndex);
}

/**
 * Calculate volume using time series data
 */
export function calculateTimeSeriesVolume(volume: any, monthIndex: number): number {
  const series = volume?.series || [];
  if (monthIndex < series.length) {
    return series[monthIndex]?.value || 0;
  }
  
  // Extend pattern if we run out of data
  const lastValue = series[series.length - 1]?.value || 0;
  return lastValue;
}

/**
 * Calculate volume using segment-level seasonal pattern
 */
export function calculateSegmentSeasonalPattern(volume: any, monthIndex: number): number {
  const baseValue = volume?.base_value || 0;
  const seasonalPattern = volume?.seasonal_pattern || [];
  const growthRate = volume?.growth_rate || 0;
  
  if (seasonalPattern.length === 0) {
    return baseValue;
  }
  
  // Repeat the seasonal pattern for years beyond the first
  const monthInYear = monthIndex % seasonalPattern.length;
  const seasonalityFactor = seasonalPattern[monthInYear] || 1;
  
  // Apply both seasonal pattern and growth rate over time
  // Formula: base_value * seasonal_factor * (1 + growth_rate)^month
  const growthFactor = Math.pow(1 + growthRate, monthIndex);
  
  return baseValue * seasonalityFactor * growthFactor;
}

/**
 * Calculate volume using segment-level geometric growth
 */
export function calculateSegmentGeometricGrowth(volume: any, monthIndex: number): number {
  const baseValue = volume?.base_value || 0;
  const growthRate = volume?.growth_rate || 0;
  
  return baseValue * Math.pow(1 + growthRate, monthIndex);
}

/**
 * Calculate volume using segment-level linear growth
 */
export function calculateSegmentLinearGrowth(volume: any, monthIndex: number): number {
  const baseValue = volume?.base_value || 0;
  const growthRate = volume?.growth_rate || 0; // This is the flat increase per month
  
  return baseValue + (growthRate * monthIndex);
}

/**
 * Calculate dynamic unit price for a specific month considering yearly adjustments and overrides
 */
export function calculateDynamicUnitPrice(businessData: BusinessData, monthIndex: number): number {
  const basePricing = businessData?.assumptions?.pricing;
  const basePrice = basePricing?.avg_unit_price?.value || 0;
  
  // Check for period-specific override first
  const overrides = basePricing?.yearly_adjustments?.price_overrides || [];
  const periodOverride = overrides.find(override => override.period === monthIndex + 1);
  if (periodOverride) {
    return periodOverride.price;
  }
  
  // Apply yearly adjustment factor
  const yearIndex = Math.floor(monthIndex / 12);
  const yearlyFactors = basePricing?.yearly_adjustments?.pricing_factors || [];
  const yearFactor = yearlyFactors.find(factor => factor.year === yearIndex + 1);
  
  if (yearFactor) {
    return Math.round((basePrice * yearFactor.factor) * 100) / 100; // Round to 2 decimal places
  }
  
  return basePrice;
}

/**
 * Calculate dynamic volume for a segment considering yearly adjustments and overrides
 */
export function calculateDynamicSegmentVolume(segment: any, monthIndex: number, businessData?: BusinessData): number {
  // Check for period-specific override first
  const overrides = segment?.volume?.yearly_adjustments?.volume_overrides || [];
  const periodOverride = overrides.find((override: any) => override.period === monthIndex + 1);
  if (periodOverride) {
    return periodOverride.volume;
  }
  
  // Calculate base volume using existing pattern logic
  let baseVolume = calculateSegmentVolumeForMonth(segment, monthIndex, businessData);
  
  // Apply yearly adjustment factor
  const yearIndex = Math.floor(monthIndex / 12);
  const yearlyFactors = segment?.volume?.yearly_adjustments?.volume_factors || [];
  const yearFactor = yearlyFactors.find((factor: any) => factor.year === yearIndex + 1);
  
  if (yearFactor) {
    baseVolume *= yearFactor.factor;
  }
  
  return baseVolume;
}

/**
 * Calculate total volume for a specific month considering dynamic adjustments
 */
export function calculateDynamicTotalVolumeForMonth(businessData: BusinessData, monthIndex: number): number {
  const segments = businessData?.assumptions?.customers?.segments || [];
  let totalVolume = 0;

  for (const segment of segments) {
    const volume = calculateDynamicSegmentVolume(segment, monthIndex, businessData);
    totalVolume += volume;
  }

  return totalVolume;
}

/**
 * Get pricing trajectory for visualization and planning
 */
export function getPricingTrajectory(businessData: BusinessData, periods: number): Array<{ period: number; price: number; source: 'base' | 'yearly' | 'override' }> {
  const trajectory = [];
  
  for (let i = 0; i < periods; i++) {
    const price = calculateDynamicUnitPrice(businessData, i);
    const basePricing = businessData?.assumptions?.pricing;
    const basePrice = basePricing?.avg_unit_price?.value || 0;
    
    // Determine source of pricing
    const overrides = basePricing?.yearly_adjustments?.price_overrides || [];
    const hasOverride = overrides.some(override => override.period === i + 1);
    
    if (hasOverride) {
      trajectory.push({ period: i + 1, price, source: 'override' });
    } else if (price !== basePrice) {
      trajectory.push({ period: i + 1, price, source: 'yearly' });
    } else {
      trajectory.push({ period: i + 1, price, source: 'base' });
    }
  }
  
  return trajectory;
}

/**
 * Get volume trajectory for a segment
 */
export function getVolumeTrajectory(segment: any, periods: number, businessData?: BusinessData): Array<{ period: number; volume: number; source: 'pattern' | 'yearly' | 'override' }> {
  const trajectory = [];
  
  for (let i = 0; i < periods; i++) {
    const volume = calculateDynamicSegmentVolume(segment, i, businessData);
    const baseVolume = calculateSegmentVolumeForMonth(segment, i, businessData);
    
    // Determine source
    const overrides = segment?.volume?.yearly_adjustments?.volume_overrides || [];
    const hasOverride = overrides.some((override: any) => override.period === i + 1);
    
    if (hasOverride) {
      trajectory.push({ period: i + 1, volume, source: 'override' });
    } else if (Math.abs(volume - baseVolume) > 0.01) {
      trajectory.push({ period: i + 1, volume, source: 'yearly' });
    } else {
      trajectory.push({ period: i + 1, volume, source: 'pattern' });
    }
  }
  
  return trajectory;
}



/**
 * Implementation factor based on timeline
 */
export function calculateImplementationFactor(
  monthIndex: number,
  timeline?: { start_month: number; ramp_up_months: number; full_implementation_month: number }
): number {
  if (!timeline) return 1; // Default to full implementation if no timeline specified
  
  const { start_month, ramp_up_months, full_implementation_month } = timeline;
  
  // Convert to 0-based indexing (monthIndex starts at 0)
  const month = monthIndex + 1;
  
  if (month < start_month) {
    return 0; // Not started yet - implementation starts ON start_month
  }
  
  if (month >= full_implementation_month) {
    return 1; // Fully implemented
  }
  
  // Calculate ramp-up factor
  const monthsIntoImplementation = month - start_month + 1; // Implementation starts ON start_month
  const totalRampUpMonths = ramp_up_months;
  
  return Math.min(1, monthsIntoImplementation / Math.max(1, totalRampUpMonths));
}

/**
 * Calculate baseline costs for a specific month (before any savings)
 */
export function calculateBaselineCostsForMonth(businessData: BusinessData, monthIndex: number): number {
  if (businessData?.meta?.business_model !== 'cost_savings') {
    return 0;
  }
  
  const baselineCosts = businessData?.assumptions?.cost_savings?.baseline_costs || [];
  let totalBaselineCosts = 0;
  
  for (const cost of baselineCosts) {
    const monthlyCost = cost.current_monthly_cost?.value || 0;
    totalBaselineCosts += monthlyCost;
  }
  
  return totalBaselineCosts;
}

/**
 * Calculate cost savings for a specific month
 */
export function calculateCostSavingsForMonth(businessData: BusinessData, monthIndex: number): number {
  if (businessData?.meta?.business_model !== 'cost_savings') {
    return 0;
  }
  
  const baselineCosts = businessData?.assumptions?.cost_savings?.baseline_costs || [];
  let totalSavings = 0;
  
  for (const cost of baselineCosts) {
    const monthlyCost = cost.current_monthly_cost?.value || 0;
    const savingsRate = (cost.savings_potential_pct?.value || 0) / 100; // Convert percentage to decimal
    const implementationFactor = calculateImplementationFactor(monthIndex, cost.implementation_timeline);
    
    const monthlyMaxSavings = monthlyCost * savingsRate;
    const actualSavings = monthlyMaxSavings * implementationFactor;
    
    totalSavings += actualSavings;
  }
  
  return totalSavings;
}

/**
 * Calculate efficiency gains for a specific month
 *
 * Efficiency gains represent the monetary value of improvements from baseline to improved state.
 * The formula calculates the absolute difference between baseline and improved values,
 * multiplied by the value per unit and implementation factor.
 *
 * This handles both:
 * - Reduction scenarios: baseline > improved (e.g., hours reduced from 160 to 60)
 * - Increase scenarios: improved > baseline (e.g., incidents detected increased from 4 to 8)
 *
 * In both cases, the "gain" is the positive difference × value.
 */
export function calculateEfficiencyGainsForMonth(businessData: BusinessData, monthIndex: number): number {
  if (businessData?.meta?.business_model !== 'cost_savings') {
    return 0;
  }

  const efficiencyGains = businessData?.assumptions?.cost_savings?.efficiency_gains || [];
  let totalGains = 0;

  for (const gain of efficiencyGains) {
    const baselineValue = gain.baseline_value?.value || 0;
    const improvedValue = gain.improved_value?.value || 0;
    const valuePerUnit = gain.value_per_unit?.value || 0;
    const implementationFactor = calculateImplementationFactor(monthIndex, gain.implementation_timeline);

    // Efficiency gains = absolute difference between baseline and improved × value per unit
    //
    // Examples:
    // 1. Hours reduced: baseline=160h, improved=60h → gain = |160-60| × €50/h = €5,000/month
    // 2. Detection increased: baseline=4, improved=8 → gain = |4-8| × €3,000 = €12,000/month
    //
    // The absolute value ensures we capture the "improvement" regardless of direction.

    const improvement = Math.abs(baselineValue - improvedValue);
    const monetaryValue = improvement * valuePerUnit * implementationFactor;
    totalGains += monetaryValue;
  }

  return totalGains;
}

/**
 * Calculate total benefits (cost savings + efficiency gains) for a specific month
 */
export function calculateTotalBenefitsForMonth(businessData: BusinessData, monthIndex: number): number {
  const costSavings = calculateCostSavingsForMonth(businessData, monthIndex);
  const efficiencyGains = calculateEfficiencyGainsForMonth(businessData, monthIndex);
  return costSavings + efficiencyGains;
}

/**
 * Calculate capex for a specific month based on period-specific investments
 */
export function calculateCapexForMonth(businessData: BusinessData, monthIndex: number): number {
  const capexItems = businessData?.assumptions?.capex || [];
  let totalCapex = 0;

  for (const item of capexItems) {
    const timeline = item?.timeline;
    if (!timeline) continue;

    if (timeline.type === "time_series") {
      // For time series, check if this specific month has a capex investment
      const series = timeline.series || [];
      const monthData = series.find((s: any) => s.period === monthIndex + 1);
      if (monthData) {
        totalCapex += monthData.value || 0;
      }
    } else if (timeline.type === "pattern") {
      // For patterns, apply the same logic as volume calculations
      if (timeline.pattern_type === "seasonal_growth") {
        totalCapex += calculateSeasonalGrowthVolume(timeline, monthIndex);
      } else if (timeline.pattern_type === "geom_growth") {
        totalCapex += calculateGeomGrowthVolume(timeline, monthIndex);
      } else if (timeline.pattern_type === "linear_growth") {
        totalCapex += calculateLinearGrowthVolume(timeline, monthIndex);
      }
    }
  }

  return totalCapex;
}

/**
 * Calculate break-even point (first month with positive net cash flow)
 */
export function calculateBreakEven(monthlyData: MonthlyData[]): number {
  for (let i = 0; i < monthlyData.length; i++) {
    if (monthlyData[i].netCashFlow > 0) {
      return i + 1; // Return the month where net cash flow is positive
    }
  }

  return 0; // Return 0 if break-even is never reached
}

/**
 * Calculate payback period (time taken to recover the initial investment)
 */
export function calculatePaybackPeriod(monthlyData: MonthlyData[]): number {
  let cumulativeCashFlow = 0;

  for (let i = 0; i < monthlyData.length; i++) {
    cumulativeCashFlow += monthlyData[i].netCashFlow;

    if (cumulativeCashFlow >= 0) {
      return i + 1; // Return the month where cumulative cash flow becomes positive
    }
  }

  return 0; // Return 0 if payback period is never reached
}

/**
 * Default metrics for when no data is available
 */
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

/**
 * Result type for OPEX calculation
 */
export interface OpexCalculationResult {
  salesMarketing: number;
  rd: number;
  ga: number;
  totalOpex: number;
}

/**
 * Calculate OPEX costs for a specific month with support for variable costs
 * Supports both legacy fixed-only format and new format with variable components
 *
 * @param businessData - Business case data
 * @param monthIndex - Zero-based month index
 * @param revenue - Revenue for the month (for revenue-based variable costs)
 * @param volume - Volume/customers for the month (for volume-based variable costs)
 * @returns Object with breakdown of OPEX costs (positive values)
 */
export function calculateOpexForMonth(
  businessData: BusinessData | null,
  monthIndex: number,
  revenue: number,
  volume: number
): OpexCalculationResult {
  if (!businessData?.assumptions?.opex) {
    return {
      salesMarketing: 0,
      rd: 0,
      ga: 0,
      totalOpex: 0
    };
  }

  const opexItems = businessData.assumptions.opex;

  // For backwards compatibility with legacy 3-category format:
  // - Index 0: Sales & Marketing
  // - Index 1: R&D
  // - Index 2: G&A
  // For new format with more OPEX items: sum ALL items into totalOpex
  // The individual categories are populated from indices 0-2 for display purposes

  const salesMarketing = calculateSingleOpexItem(opexItems[0], revenue, volume);
  const rd = calculateSingleOpexItem(opexItems[1], revenue, volume);
  const ga = calculateSingleOpexItem(opexItems[2], revenue, volume);

  // Calculate total OPEX from ALL items (not just first 3)
  let totalOpex = 0;
  for (const item of opexItems) {
    totalOpex += calculateSingleOpexItem(item as any, revenue, volume);
  }

  return {
    salesMarketing,
    rd,
    ga,
    totalOpex
  };
}

/**
 * Calculate a single OPEX item value
 * Handles both legacy format (value only) and new format (cost_structure)
 */
function calculateSingleOpexItem(
  opexItem: { 
    name: string; 
    value?: { value: number; unit: string; rationale: string }; 
    cost_structure?: {
      fixed_component?: { value: number; unit: string; rationale: string };
      variable_revenue_rate?: { value: number; unit: string; rationale: string };
      variable_volume_rate?: { value: number; unit: string; rationale: string };
    };
  } | undefined,
  revenue: number,
  volume: number
): number {
  if (!opexItem) {
    return 0;
  }

  // New format: cost_structure with fixed and variable components
  if (opexItem.cost_structure) {
    const fixedComponent = opexItem.cost_structure.fixed_component?.value || 0;
    const variableRevenueRate = opexItem.cost_structure.variable_revenue_rate?.value || 0;
    const variableVolumeRate = opexItem.cost_structure.variable_volume_rate?.value || 0;

    const total = 
      fixedComponent +
      (revenue * variableRevenueRate) +
      (volume * variableVolumeRate);

    return Math.round(total);
  }

  // Legacy format: fixed value only (backwards compatibility)
  if (opexItem.value?.value !== undefined) {
    return opexItem.value.value;
  }

  return 0;
}

/**
 * Format currency based on business data currency setting
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage values
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Check if IRR result is an error code
 */
export function isIRRError(irr: number): boolean {
  return irr < 0 && Object.values(IRR_ERROR_CODES).includes(irr as any);
}

/**
 * Get human-readable error message for IRR error codes
 */
export function getIRRErrorMessage(irr: number): string {
  switch (irr) {
    case IRR_ERROR_CODES.NO_DATA:
      return 'No data available for IRR calculation';
    case IRR_ERROR_CODES.ALL_SAME:
      return 'All cash flows are identical - IRR cannot be calculated';
    case IRR_ERROR_CODES.ALL_POSITIVE:
      return 'All cash flows are positive - infinite return';
    case IRR_ERROR_CODES.ALL_NEGATIVE:
      return 'All cash flows are negative - no return possible';
    case IRR_ERROR_CODES.NO_CONVERGENCE:
      return 'IRR calculation did not converge';
    case IRR_ERROR_CODES.EXTREME_RATE:
      return 'IRR calculation resulted in extreme rate';
    default:
      return 'Unknown IRR error';
  }
}