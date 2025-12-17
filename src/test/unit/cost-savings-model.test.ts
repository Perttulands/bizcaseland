/**
 * Tests for the cost_savings business model calculations
 *
 * These tests verify correct behavior with:
 * - Multiple OPEX items (more than 3)
 * - Efficiency gains with different baseline/improved directions
 * - Cost savings with implementation timelines
 * - Sensitivity drivers targeting cost savings paths
 */

import { describe, it, expect } from 'vitest';
import {
  calculateBusinessMetrics,
  calculateOpexForMonth,
  calculateCostSavingsForMonth,
  calculateEfficiencyGainsForMonth,
  calculateTotalBenefitsForMonth,
  calculateBaselineCostsForMonth,
  generateMonthlyData,
} from '@/core/engine/calculators/business-calculator-full';
import { getNestedValue, setNestedValue } from '@/core/engine/utils/nested-operations';
import { BusinessData } from '@/core/types';

/**
 * Mock data based on Umicore Energy Twin Hub business case
 * This represents a real-world cost savings scenario with:
 * - 8 OPEX items (vs typical 3)
 * - 3 baseline cost categories
 * - 2 efficiency gains (one reduction, one increase scenario)
 * - 6 sensitivity drivers
 */
const createUmicoreLikeData = (): BusinessData => ({
  schema_version: '1.0',
  meta: {
    title: 'Energy Twin Hub - Cost Savings Test',
    description: 'Testing cost savings model with complex OPEX structure',
    business_model: 'cost_savings',
    currency: 'EUR',
    periods: 60,
    frequency: 'monthly',
  },
  assumptions: {
    financial: {
      interest_rate: { value: 0.08, unit: 'ratio', rationale: '8% discount rate' },
    },
    customers: {
      segments: [
        {
          id: 'energy_baseline',
          label: 'Baseline Energy Consumption',
          rationale: 'Baseline for savings calculations',
          volume: {
            type: 'pattern',
            pattern_type: 'linear_growth',
            series: [{ period: 1, value: 6250, unit: 'MWh', rationale: 'Monthly baseline' }],
          },
        },
      ],
    },
    opex: [
      // 8 OPEX items to test variable-length array support
      {
        name: 'Cloud Hosting',
        cost_structure: {
          fixed_component: { value: 4200, unit: 'EUR_per_month', rationale: 'Cloud costs' },
        },
      },
      {
        name: 'Software Licenses',
        cost_structure: {
          fixed_component: { value: 4583, unit: 'EUR_per_month', rationale: 'License fees' },
        },
      },
      {
        name: 'Vendor Support',
        cost_structure: {
          fixed_component: { value: 6667, unit: 'EUR_per_month', rationale: 'Support contracts' },
        },
      },
      {
        name: 'Internal Support Team',
        cost_structure: {
          fixed_component: { value: 9167, unit: 'EUR_per_month', rationale: '1.5 FTE' },
        },
      },
      {
        name: 'ML Model Refinement',
        cost_structure: {
          fixed_component: { value: 4583, unit: 'EUR_per_month', rationale: 'Data science' },
        },
      },
      {
        name: 'Training',
        cost_structure: {
          fixed_component: { value: 1250, unit: 'EUR_per_month', rationale: 'Training budget' },
        },
      },
      {
        name: 'Cybersecurity',
        cost_structure: {
          fixed_component: { value: 1667, unit: 'EUR_per_month', rationale: 'Security costs' },
        },
      },
      {
        name: 'Hardware Maintenance',
        cost_structure: {
          fixed_component: { value: 958, unit: 'EUR_per_month', rationale: 'Hardware refresh' },
        },
      },
    ],
    capex: [
      {
        name: 'Phase 1',
        timeline: {
          type: 'time_series',
          series: [
            { period: 1, value: 95500, unit: 'EUR', rationale: 'Month 1 investment' },
            { period: 2, value: 95500, unit: 'EUR', rationale: 'Month 2 investment' },
            { period: 3, value: 68000, unit: 'EUR', rationale: 'Month 3 investment' },
          ],
        },
      },
    ],
    cost_savings: {
      baseline_costs: [
        {
          id: 'energy_cost_baseline',
          label: 'Monthly Energy Costs',
          category: 'operational',
          current_monthly_cost: { value: 750000, unit: 'EUR_per_month', rationale: 'Energy spend' },
          savings_potential_pct: { value: 10.0, unit: 'percentage', rationale: '10% reduction target' },
          implementation_timeline: {
            start_month: 1,
            ramp_up_months: 18,
            full_implementation_month: 24,
          },
        },
        {
          id: 'downtime_costs',
          label: 'Equipment Downtime Costs',
          category: 'operational',
          current_monthly_cost: { value: 25000, unit: 'EUR_per_month', rationale: 'Downtime impact' },
          savings_potential_pct: { value: 40.0, unit: 'percentage', rationale: '40% reduction' },
          implementation_timeline: {
            start_month: 3,
            ramp_up_months: 9,
            full_implementation_month: 12,
          },
        },
        {
          id: 'demand_penalties',
          label: 'Peak Demand Charges',
          category: 'operational',
          current_monthly_cost: { value: 6667, unit: 'EUR_per_month', rationale: 'Demand charges' },
          savings_potential_pct: { value: 50.0, unit: 'percentage', rationale: '50% reduction' },
          implementation_timeline: {
            start_month: 4,
            ramp_up_months: 8,
            full_implementation_month: 12,
          },
        },
      ],
      efficiency_gains: [
        {
          id: 'operator_productivity',
          label: 'Operator Time Saved',
          metric: 'hours_per_month',
          // Reduction scenario: 160 hours → 60 hours (saved 100 hours)
          baseline_value: { value: 160, unit: 'hours_per_month', rationale: 'Current manual effort' },
          improved_value: { value: 60, unit: 'hours_per_month', rationale: 'After automation' },
          value_per_unit: { value: 50, unit: 'EUR_per_hour', rationale: 'Hourly rate' },
          implementation_timeline: {
            start_month: 3,
            ramp_up_months: 6,
            full_implementation_month: 9,
          },
        },
        {
          id: 'response_time_improvement',
          label: 'Faster Anomaly Response',
          metric: 'incidents_per_month',
          // Increase scenario: 4 detections → 8 detections (4 more detected)
          baseline_value: { value: 4, unit: 'incidents_per_month', rationale: 'Manual detection rate' },
          improved_value: { value: 8, unit: 'incidents_per_month', rationale: 'Automated detection rate' },
          value_per_unit: { value: 3000, unit: 'EUR_per_incident', rationale: 'Value per early detection' },
          implementation_timeline: {
            start_month: 3,
            ramp_up_months: 6,
            full_implementation_month: 9,
          },
        },
      ],
    },
  },
  drivers: [
    {
      key: 'energy_savings_pct',
      path: 'assumptions.cost_savings.baseline_costs[0].savings_potential_pct.value',
      range: [5.0, 7.5, 10.0, 12.5, 15.0],
      rationale: 'Energy savings percentage sensitivity',
    },
    {
      key: 'energy_price',
      path: 'assumptions.cost_savings.baseline_costs[0].current_monthly_cost.value',
      range: [625000, 687500, 750000, 875000, 1000000],
      rationale: 'Energy cost baseline sensitivity',
    },
    {
      key: 'annual_opex',
      path: 'assumptions.opex[0].cost_structure.fixed_component.value',
      range: [3360, 3780, 4200, 4620, 5040],
      rationale: 'Cloud infrastructure costs sensitivity',
    },
    {
      key: 'discount_rate',
      path: 'assumptions.financial.interest_rate.value',
      range: [0.06, 0.07, 0.08, 0.10, 0.12],
      rationale: 'Discount rate sensitivity',
    },
  ],
});

describe('Cost Savings Business Model - Complex OPEX', () => {
  it('should calculate total OPEX from all 8 items', () => {
    const data = createUmicoreLikeData();
    const result = calculateOpexForMonth(data, 0, 0, 0);

    // Sum of all 8 OPEX items:
    // 4200 + 4583 + 6667 + 9167 + 4583 + 1250 + 1667 + 958 = 33075
    expect(result.totalOpex).toBe(33075);

    // Individual categories still use first 3 items
    expect(result.salesMarketing).toBe(4200);
    expect(result.rd).toBe(4583);
    expect(result.ga).toBe(6667);
  });

  it('should include all OPEX items in net cash flow calculation', () => {
    const data = createUmicoreLikeData();
    const monthlyData = generateMonthlyData(data);

    // In month 1, total OPEX should be 33075 (negative in the data)
    expect(Math.abs(monthlyData[0].totalOpex)).toBe(33075);
  });
});

describe('Cost Savings Business Model - Baseline Cost Savings', () => {
  it('should calculate baseline costs correctly', () => {
    const data = createUmicoreLikeData();
    const baseline = calculateBaselineCostsForMonth(data, 0);

    // Sum of all baseline costs: 750000 + 25000 + 6667 = 781667
    expect(baseline).toBe(781667);
  });

  it('should calculate cost savings with implementation ramp-up', () => {
    const data = createUmicoreLikeData();

    // Month 0 (start): Energy savings just starting, others not started
    const month0Savings = calculateCostSavingsForMonth(data, 0);
    // Energy: 750000 * 10% = 75000 max, at 1/18 ramp-up = 4166.67
    expect(month0Savings).toBeCloseTo(4166.67, 0);

    // Month 11 (full implementation for downtime and demand):
    // Energy: 75000 * (12/18) = 50000
    // Downtime: 25000 * 40% = 10000 (full)
    // Demand: 6667 * 50% = 3333.5 (full)
    const month11Savings = calculateCostSavingsForMonth(data, 11);
    expect(month11Savings).toBeGreaterThan(month0Savings);

    // Month 23 (all fully implemented):
    // Energy: 75000
    // Downtime: 10000
    // Demand: 3333.5
    // Total: ~88333.5
    const month23Savings = calculateCostSavingsForMonth(data, 23);
    expect(month23Savings).toBeCloseTo(88333.5, 0);
  });
});

describe('Cost Savings Business Model - Efficiency Gains', () => {
  it('should calculate efficiency gains for both reduction and increase scenarios', () => {
    const data = createUmicoreLikeData();

    // At full implementation (month 8+):
    // Operator: |160-60| × 50 = 100 × 50 = 5000 EUR/month
    // Response: |4-8| × 3000 = 4 × 3000 = 12000 EUR/month
    // Total: 17000 EUR/month
    const month8Gains = calculateEfficiencyGainsForMonth(data, 8);
    expect(month8Gains).toBe(17000);
  });

  it('should handle ramp-up correctly for efficiency gains', () => {
    const data = createUmicoreLikeData();

    // Month 2 (before start): both start at month 3
    const month2Gains = calculateEfficiencyGainsForMonth(data, 1);
    expect(month2Gains).toBe(0);

    // Month 3 (first month of implementation): 1/6 factor
    // Operator: 5000 × (1/6) = 833.33
    // Response: 12000 × (1/6) = 2000
    // Total: 2833.33
    const month3Gains = calculateEfficiencyGainsForMonth(data, 2);
    expect(month3Gains).toBeCloseTo(2833.33, 0);
  });
});

describe('Cost Savings Business Model - Total Benefits', () => {
  it('should correctly sum cost savings and efficiency gains', () => {
    const data = createUmicoreLikeData();

    // At full implementation for all components (month 24+)
    const month24Savings = calculateCostSavingsForMonth(data, 23);
    const month24Gains = calculateEfficiencyGainsForMonth(data, 23);
    const month24Benefits = calculateTotalBenefitsForMonth(data, 23);

    expect(month24Benefits).toBe(month24Savings + month24Gains);
    // ~88333.5 savings + 17000 gains = ~105333.5
    expect(month24Benefits).toBeCloseTo(105333.5, 0);
  });
});

describe('Cost Savings Business Model - Sensitivity Drivers', () => {
  it('should resolve driver paths correctly for cost savings', () => {
    const data = createUmicoreLikeData();

    // Test path resolution for each driver
    const energySavings = getNestedValue(
      data,
      'assumptions.cost_savings.baseline_costs[0].savings_potential_pct.value'
    );
    expect(energySavings).toBe(10.0);

    const energyCost = getNestedValue(
      data,
      'assumptions.cost_savings.baseline_costs[0].current_monthly_cost.value'
    );
    expect(energyCost).toBe(750000);

    const cloudOpex = getNestedValue(
      data,
      'assumptions.opex[0].cost_structure.fixed_component.value'
    );
    expect(cloudOpex).toBe(4200);

    const discountRate = getNestedValue(data, 'assumptions.financial.interest_rate.value');
    expect(discountRate).toBe(0.08);
  });

  it('should update values correctly when driver is changed', () => {
    const data = createUmicoreLikeData();

    // Change energy savings from 10% to 15%
    const updated = setNestedValue(
      data,
      'assumptions.cost_savings.baseline_costs[0].savings_potential_pct.value',
      15.0
    );

    const newValue = getNestedValue(
      updated,
      'assumptions.cost_savings.baseline_costs[0].savings_potential_pct.value'
    );
    expect(newValue).toBe(15.0);

    // Original should be unchanged
    const originalValue = getNestedValue(
      data,
      'assumptions.cost_savings.baseline_costs[0].savings_potential_pct.value'
    );
    expect(originalValue).toBe(10.0);
  });

  it('should recalculate savings when driver value changes', () => {
    const data = createUmicoreLikeData();

    const originalSavings = calculateCostSavingsForMonth(data, 23);

    // Increase energy savings from 10% to 15%
    const updated = setNestedValue(
      data,
      'assumptions.cost_savings.baseline_costs[0].savings_potential_pct.value',
      15.0
    ) as BusinessData;

    const newSavings = calculateCostSavingsForMonth(updated, 23);

    // Energy savings increase: 750000 × 15% vs 750000 × 10%
    // Difference: 750000 × 5% = 37500 more
    expect(newSavings - originalSavings).toBeCloseTo(37500, 0);
  });
});

describe('Cost Savings Business Model - Full Metrics', () => {
  it('should calculate complete business metrics', () => {
    const data = createUmicoreLikeData();
    const metrics = calculateBusinessMetrics(data);

    expect(metrics.monthlyData).toHaveLength(60);
    expect(metrics.totalRevenue).toBeGreaterThan(0); // Revenue = total benefits in cost_savings model
    expect(metrics.npv).toBeDefined();
    expect(metrics.irr).toBeDefined();

    // All months should have cost savings specific fields
    metrics.monthlyData.forEach((month) => {
      expect(month.baselineCosts).toBeDefined();
      expect(month.costSavings).toBeDefined();
      expect(month.efficiencyGains).toBeDefined();
      expect(month.totalBenefits).toBeDefined();
    });
  });

  it('should show positive ROI over project lifetime', () => {
    const data = createUmicoreLikeData();
    const metrics = calculateBusinessMetrics(data);

    // Total benefits should significantly exceed costs
    const totalBenefits = metrics.monthlyData.reduce(
      (sum, m) => sum + (m.totalBenefits || 0),
      0
    );
    const totalOpex = metrics.monthlyData.reduce(
      (sum, m) => sum + Math.abs(m.totalOpex),
      0
    );
    const totalCapex = metrics.monthlyData.reduce(
      (sum, m) => sum + Math.abs(m.capex),
      0
    );

    // Benefits should exceed costs for a viable project
    expect(totalBenefits).toBeGreaterThan(totalOpex + totalCapex);
  });
});
