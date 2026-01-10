/**
 * Financial Utilities
 * Shared financial calculation utilities
 */

/**
 * Calculate Net Present Value
 */
export function calculateNPV(
  cashFlows: number[],
  discountRate: number
): number {
  const monthlyRate = discountRate / 12;
  
  return cashFlows.reduce((npv, cashFlow, index) => {
    const discountFactor = Math.pow(1 + monthlyRate, -(index + 1));
    return npv + (cashFlow * discountFactor);
  }, 0);
}

/**
 * IRR Error Codes
 */
export const IRR_ERROR_CODES = {
  NO_DATA: -999,
  ALL_SAME: -998,
  ALL_POSITIVE: -997,
  ALL_NEGATIVE: -996,
  NO_CONVERGENCE: -995,
  EXTREME_RATE: -994
} as const;

/**
 * Calculate Internal Rate of Return
 */
export function calculateIRR(
  cashFlows: number[],
  initialGuess: number = 0.1
): number {
  if (!cashFlows || cashFlows.length === 0) {
    return IRR_ERROR_CODES.NO_DATA;
  }
  
  // Check if all cash flows are the same
  const allSame = cashFlows.every(cf => Math.abs(cf - cashFlows[0]) < 0.01);
  if (allSame) return IRR_ERROR_CODES.ALL_SAME;
  
  // Check if all positive
  const allPositive = cashFlows.every(cf => cf >= 0);
  if (allPositive) return IRR_ERROR_CODES.ALL_POSITIVE;
  
  // Check if all negative
  const allNegative = cashFlows.every(cf => cf <= 0);
  if (allNegative) return IRR_ERROR_CODES.ALL_NEGATIVE;
  
  // Newton-Raphson method
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
      // Check for extreme rates
      const annualRate = Math.pow(1 + rate / 12, 12) - 1;
      if (annualRate < -0.99 || annualRate > 100) {
        return IRR_ERROR_CODES.EXTREME_RATE;
      }
      return rate;
    }
    
    // Derivative for Newton-Raphson
    const npvDerivative = cashFlows.reduce((derivative, cashFlow, index) => {
      const period = index + 1;
      const discountFactor = Math.pow(1 + rate / 12, -(period + 1));
      return derivative - (cashFlow * period * discountFactor) / (12 * (1 + rate / 12));
    }, 0);
    
    if (Math.abs(npvDerivative) < tolerance) {
      break;
    }
    
    const newRate = rate - npvAtRate / npvDerivative;
    
    // Prevent extreme rate changes
    if (Math.abs(newRate - rate) > 1.0) {
      rate = rate + (newRate > rate ? 1.0 : -1.0);
    } else {
      rate = newRate;
    }
    
    iteration++;
  }
  
  if (iteration >= maxIterations) {
    return IRR_ERROR_CODES.NO_CONVERGENCE;
  }
  
  return rate;
}

/**
 * Calculate break-even period
 */
export function calculateBreakEven(cashFlows: number[]): number {
  let cumulative = 0;
  
  for (let i = 0; i < cashFlows.length; i++) {
    cumulative += cashFlows[i];
    if (cumulative >= 0) {
      return i + 1; // Return 1-indexed month
    }
  }
  
  return 0; // No break-even found
}

/**
 * Calculate payback period
 */
export function calculatePaybackPeriod(cashFlows: number[]): number {
  return calculateBreakEven(cashFlows);
}

/**
 * Calculate total investment required (max cumulative negative cash flow)
 */
export function calculateTotalInvestmentRequired(cashFlows: number[]): number {
  let cumulative = 0;
  let maxNegative = 0;
  
  for (const cashFlow of cashFlows) {
    cumulative += cashFlow;
    if (cumulative < maxNegative) {
      maxNegative = cumulative;
    }
  }
  
  return Math.abs(maxNegative);
}

/**
 * Check if IRR is an error code
 */
export function isIRRError(irr: number): boolean {
  return Object.values(IRR_ERROR_CODES).includes(irr as any);
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  let value: string;
  let suffix: string;
  
  if (absAmount >= 1_000_000_000) {
    value = (absAmount / 1_000_000_000).toFixed(2);
    suffix = 'B';
  } else if (absAmount >= 1_000_000) {
    value = (absAmount / 1_000_000).toFixed(2);
    suffix = 'M';
  } else if (absAmount >= 1_000) {
    value = (absAmount / 1_000).toFixed(0);
    suffix = 'K';
  } else {
    value = absAmount.toFixed(0);
    suffix = '';
  }
  
  return `${sign}${currency === 'USD' ? '$' : '€'}${value}${suffix}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
