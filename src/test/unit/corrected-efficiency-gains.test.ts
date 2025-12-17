/**
 * Test to verify the corrected efficiency gains logic
 *
 * Corrected Logic: Efficiency Gains = |Baseline - Improved| × Value per Unit × Implementation Factor
 *
 * This represents the actual monetary value of the improvement - the difference between
 * baseline and improved states, multiplied by the value per unit.
 *
 * Examples:
 * - Hours reduced from 160 to 60: gain = (160-60) × €50/h = €5,000/month
 * - Detections increased from 4 to 8: gain = |4-8| × €3,000 = €12,000/month
 */

import { describe, it, expect } from 'vitest';
import { calculateEfficiencyGainsForMonth } from '@/core/engine/calculators/business-calculator-full';
import { BusinessData } from '@/core/types';

describe('Corrected Efficiency Gains Logic', () => {
  it('should calculate efficiency gains as: |baseline - improved| × value per unit', () => {
    const testData: BusinessData = {
      meta: {
        title: 'Efficiency Test',
        description: 'Testing corrected efficiency gains logic',
        business_model: 'cost_savings',
        currency: 'EUR',
        periods: 12,
        frequency: 'monthly'
      },
      assumptions: {
        cost_savings: {
          efficiency_gains: [
            {
              id: 'payroll_efficiency',
              label: 'Payroll Processing Efficiency',
              metric: 'hours_per_month',
              baseline_value: { value: 40, unit: 'hours/month', rationale: 'Manual payroll takes 40 hours' },
              improved_value: { value: 8, unit: 'hours/month', rationale: 'Automated payroll takes 8 hours' },
              value_per_unit: { value: 50, unit: 'EUR/hour', rationale: 'Cost per hour of payroll work' },
              implementation_timeline: {
                start_month: 1,
                ramp_up_months: 0,
                full_implementation_month: 1
              }
            }
          ]
        }
      }
    };

    const gains = calculateEfficiencyGainsForMonth(testData, 0);

    // Corrected logic: |40-8| hours × 50 EUR/hour = 32 × 50 = 1600 EUR
    // This represents the actual savings from reducing hours worked
    expect(gains).toBe(Math.abs(40 - 8) * 50); // 1600 EUR
  });

  it('should handle both reduction and increase scenarios', () => {
    const testData: BusinessData = {
      meta: {
        title: 'Bidirectional Test',
        description: 'Testing efficiency gains in both directions',
        business_model: 'cost_savings',
        currency: 'EUR',
        periods: 12,
        frequency: 'monthly'
      },
      assumptions: {
        cost_savings: {
          efficiency_gains: [
            {
              id: 'hours_reduced',
              label: 'Hours Reduced (baseline > improved)',
              metric: 'hours_per_month',
              baseline_value: { value: 100, unit: 'hours/month', rationale: 'Baseline processing time' },
              improved_value: { value: 20, unit: 'hours/month', rationale: 'Improved processing time' },
              value_per_unit: { value: 75, unit: 'EUR/hour', rationale: 'Value per hour' },
              implementation_timeline: {
                start_month: 1,
                ramp_up_months: 0,
                full_implementation_month: 1
              }
            },
            {
              id: 'detections_increased',
              label: 'Detections Increased (improved > baseline)',
              metric: 'incidents_per_month',
              baseline_value: { value: 4, unit: 'incidents/month', rationale: 'Manual detection rate' },
              improved_value: { value: 12, unit: 'incidents/month', rationale: 'Automated detection rate' },
              value_per_unit: { value: 500, unit: 'EUR/incident', rationale: 'Value per early detection' },
              implementation_timeline: {
                start_month: 1,
                ramp_up_months: 0,
                full_implementation_month: 1
              }
            }
          ]
        }
      }
    };

    const gains = calculateEfficiencyGainsForMonth(testData, 0);

    // Hours reduced: |100-20| × 75 = 80 × 75 = 6000 EUR
    // Detections increased: |4-12| × 500 = 8 × 500 = 4000 EUR
    // Total: 6000 + 4000 = 10000 EUR
    expect(gains).toBe((Math.abs(100 - 20) * 75) + (Math.abs(4 - 12) * 500)); // 10000 EUR
  });

  it('should handle multiple efficiency gains correctly', () => {
    const testData: BusinessData = {
      meta: {
        title: 'Multiple Gains',
        description: 'Testing multiple efficiency gains',
        business_model: 'cost_savings',
        currency: 'EUR',
        periods: 12,
        frequency: 'monthly'
      },
      assumptions: {
        cost_savings: {
          efficiency_gains: [
            {
              id: 'gain1',
              label: 'Process A',
              metric: 'hours_per_month',
              baseline_value: { value: 50, unit: 'hours/month', rationale: 'Baseline A' },
              improved_value: { value: 10, unit: 'hours/month', rationale: 'Improved A' },
              value_per_unit: { value: 60, unit: 'EUR/hour', rationale: 'Value A' },
              implementation_timeline: {
                start_month: 1,
                ramp_up_months: 0,
                full_implementation_month: 1
              }
            },
            {
              id: 'gain2',
              label: 'Process B',
              metric: 'hours_per_month',
              baseline_value: { value: 30, unit: 'hours/month', rationale: 'Baseline B' },
              improved_value: { value: 5, unit: 'hours/month', rationale: 'Improved B' },
              value_per_unit: { value: 80, unit: 'EUR/hour', rationale: 'Value B' },
              implementation_timeline: {
                start_month: 1,
                ramp_up_months: 0,
                full_implementation_month: 1
              }
            }
          ]
        }
      }
    };

    const gains = calculateEfficiencyGainsForMonth(testData, 0);

    // Process A: |50-10| × 60 = 40 × 60 = 2400 EUR
    // Process B: |30-5| × 80 = 25 × 80 = 2000 EUR
    // Total: 2400 + 2000 = 4400 EUR
    expect(gains).toBe((Math.abs(50 - 10) * 60) + (Math.abs(30 - 5) * 80)); // 4400 EUR
  });
});
