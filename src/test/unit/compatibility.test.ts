import { describe, it, expect } from 'vitest';
import { calculateBusinessMetrics, generateMonthlyData } from '@/core/engine/calculators/business-calculator-full';
import { createMockBusinessData, createMockCostSavingsData } from '@/test/mockData';

describe('Revenue Model Compatibility Tests', () => {
  it('should maintain revenue model calculations with UI changes', () => {
    // Test recurring revenue model
    const recurringData = createMockBusinessData({
      meta: {
        business_model: 'recurring',
        title: 'Recurring Revenue Test',
        description: 'Test recurring model',
        currency: 'EUR',
        periods: 12,
        frequency: 'monthly'
      }
    });

    const monthlyData = generateMonthlyData(recurringData);
    const metrics = calculateBusinessMetrics(recurringData);

    // Basic checks that revenue models still work
    expect(monthlyData.length).toBe(12);
    expect(monthlyData[0].revenue).toBeGreaterThan(0);
    expect(monthlyData[0].newCustomers).toBeGreaterThan(0);
    expect(monthlyData[0].unitPrice).toBeGreaterThan(0);
    expect(metrics.totalRevenue).toBeGreaterThan(0);

    // Check that cost savings fields are undefined for revenue models
    expect(monthlyData[0].baselineCosts).toBeUndefined();
    expect(monthlyData[0].costSavings).toBeUndefined();
    expect(monthlyData[0].efficiencyGains).toBeUndefined();
    expect(monthlyData[0].totalBenefits).toBeUndefined();
  });

  it('should maintain unit sales model calculations with UI changes', () => {
    // Test unit sales model
    const unitSalesData = createMockBusinessData({
      meta: {
        business_model: 'unit_sales',
        title: 'Unit Sales Test',
        description: 'Test unit sales model',
        currency: 'EUR',
        periods: 12,
        frequency: 'monthly'
      }
    });

    const monthlyData = generateMonthlyData(unitSalesData);
    const metrics = calculateBusinessMetrics(unitSalesData);

    // Basic checks that unit sales models still work
    expect(monthlyData.length).toBe(12);
    expect(monthlyData[0].revenue).toBeGreaterThan(0);
    expect(monthlyData[0].salesVolume).toBeGreaterThan(0);
    expect(monthlyData[0].unitPrice).toBeGreaterThan(0);
    expect(metrics.totalRevenue).toBeGreaterThan(0);

    // For unit sales, all customers are "new" each month
    expect(monthlyData[0].newCustomers).toBe(monthlyData[0].salesVolume);
    expect(monthlyData[0].existingCustomers).toBe(0);

    // Check that cost savings fields are undefined for revenue models
    expect(monthlyData[0].baselineCosts).toBeUndefined();
    expect(monthlyData[0].costSavings).toBeUndefined();
    expect(monthlyData[0].efficiencyGains).toBeUndefined();
    expect(monthlyData[0].totalBenefits).toBeUndefined();
  });

  it('should properly calculate cost savings models with new fields', () => {
    // Test cost savings model
    const costSavingsData = createMockCostSavingsData();
    const monthlyData = generateMonthlyData(costSavingsData);
    const metrics = calculateBusinessMetrics(costSavingsData);

    // Basic checks that cost savings models work
    expect(monthlyData.length).toBeGreaterThan(0);
    expect(monthlyData[0].revenue).toBeGreaterThanOrEqual(0); // Benefits as revenue

    // Check that cost savings fields are properly defined
    expect(monthlyData[0].baselineCosts).toBeDefined();
    expect(monthlyData[0].costSavings).toBeDefined();
    expect(monthlyData[0].efficiencyGains).toBeDefined();
    expect(monthlyData[0].totalBenefits).toBeDefined();

    // Check that revenue fields are not applicable
    expect(monthlyData[0].salesVolume).toBe(1); // Default value for cost savings
    expect(monthlyData[0].unitPrice).toBe(0); // Not applicable
    expect(monthlyData[0].newCustomers).toBe(0);
    expect(monthlyData[0].existingCustomers).toBe(0);
  });

  it('should not break existing revenue calculations', () => {
    // Verify that the revenue calculation formula hasn't changed
    const revenueData = createMockBusinessData({
      meta: { 
        business_model: 'recurring', 
        title: 'Revenue Test',
        description: 'Test revenue calculation',
        currency: 'EUR',
        periods: 1,
        frequency: 'monthly'
      }
    });

    const monthlyData = generateMonthlyData(revenueData);
    const expectedRevenue = monthlyData[0].salesVolume * monthlyData[0].unitPrice;
    
    expect(monthlyData[0].revenue).toBe(expectedRevenue);
  });
});
