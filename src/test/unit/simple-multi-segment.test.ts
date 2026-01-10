import { describe, it, expect } from 'vitest';
import { calculateTotalVolumeForMonth } from '@/core/engine/calculators/business-calculator-full';
import { BusinessData } from '@/core/types';

describe('Simple Multi-Segment Test', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true);
  });

  it('should handle basic multi-segment calculation', () => {
    const businessData: BusinessData = {
      meta: {
        title: 'Test',
        description: 'Test description',
        business_model: 'recurring',
        currency: 'EUR',
        periods: 12,
        frequency: 'monthly'
      },
      assumptions: {
        customers: {
          segments: [
            {
              id: 'segment1',
              label: 'Segment 1',
              rationale: 'Test segment',
              volume: {
                type: 'pattern',
                pattern_type: 'linear_growth',
                series: [{ period: 1, value: 50, unit: 'customers', rationale: 'Initial' }],
                monthly_flat_increase: { value: 10, unit: 'customers', rationale: 'Growth' }
              }
            },
            {
              id: 'segment2',
              label: 'Segment 2',
              rationale: 'Test segment 2',
              volume: {
                type: 'pattern',
                pattern_type: 'linear_growth',
                series: [{ period: 1, value: 25, unit: 'customers', rationale: 'Initial' }],
                monthly_flat_increase: { value: 5, unit: 'customers', rationale: 'Growth' }
              }
            }
          ]
        }
      }
    };
    
    const totalVolume = calculateTotalVolumeForMonth(businessData, 0);
    expect(totalVolume).toBe(75); // 50 + 25
  });
});
