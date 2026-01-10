import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SensitivityDriverBadge } from '@/modules/business-case/components/SensitivityDriverBadge';

describe('SensitivityDriverBadge', () => {
  it('should handle non-array currentRange gracefully', () => {
    const onUpdateRange = vi.fn();
    const onRemove = vi.fn();

    // Simulate the error condition where currentRange is not an array
    // This can happen when the driver is stored with a [number, number] tuple
    // but the badge expects an array of 5 values
    const nonArrayRange: any = [10, 20]; // Tuple format from storage

    // This should not throw an error
    expect(() => {
      render(
        <SensitivityDriverBadge
          path="assumptions.customers.segments[0].volume.base_value"
          currentRange={nonArrayRange}
          onUpdateRange={onUpdateRange}
          onRemove={onRemove}
          unit="units"
        />
      );
    }).not.toThrow();
  });

  it('should render with valid 5-value array', () => {
    const onUpdateRange = vi.fn();
    const onRemove = vi.fn();
    const validRange = [10, 20, 30, 40, 50];

    render(
      <SensitivityDriverBadge
        path="assumptions.customers.segments[0].volume.base_value"
        currentRange={validRange}
        onUpdateRange={onUpdateRange}
        onRemove={onRemove}
        unit="units"
      />
    );

    // Click to open the popover
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Verify all 5 inputs are present
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(5);
    expect(inputs[0]).toHaveValue(10);
    expect(inputs[1]).toHaveValue(20);
    expect(inputs[2]).toHaveValue(30);
    expect(inputs[3]).toHaveValue(40);
    expect(inputs[4]).toHaveValue(50);
  });

  it('should handle undefined currentRange by using default', () => {
    const onUpdateRange = vi.fn();
    const onRemove = vi.fn();

    render(
      <SensitivityDriverBadge
        path="assumptions.customers.segments[0].volume.base_value"
        currentRange={undefined}
        onUpdateRange={onUpdateRange}
        onRemove={onRemove}
        unit="units"
      />
    );

    // Click to open the popover
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Verify all 5 inputs have default value of 0
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(5);
    inputs.forEach(input => {
      expect(input).toHaveValue(0);
    });
  });

  it('should convert percentage values correctly', () => {
    const onUpdateRange = vi.fn();
    const onRemove = vi.fn();
    
    // Range stored as decimals (0.05 = 5%)
    const percentageRange = [0.05, 0.10, 0.15, 0.20, 0.25];

    render(
      <SensitivityDriverBadge
        path="assumptions.customers.churn_pct.value"
        currentRange={percentageRange}
        onUpdateRange={onUpdateRange}
        onRemove={onRemove}
        unit="%"
      />
    );

    // Click to open the popover
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Verify percentages are displayed correctly (multiplied by 100)
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0]).toHaveValue(5);
    expect(inputs[1]).toHaveValue(10);
    expect(inputs[2]).toHaveValue(15);
    expect(inputs[3]).toHaveValue(20);
    expect(inputs[4]).toHaveValue(25);
  });

  it('should save range correctly when updated', () => {
    const onUpdateRange = vi.fn();
    const onRemove = vi.fn();
    const initialRange = [10, 20, 30, 40, 50];

    render(
      <SensitivityDriverBadge
        path="assumptions.customers.segments[0].volume.base_value"
        currentRange={initialRange}
        onUpdateRange={onUpdateRange}
        onRemove={onRemove}
        unit="units"
      />
    );

    // Click to open the popover
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Change the first value
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '15' } });

    // Save
    const saveButton = screen.getByText('Save Range');
    fireEvent.click(saveButton);

    // Verify onUpdateRange was called with updated values
    expect(onUpdateRange).toHaveBeenCalledWith([15, 20, 30, 40, 50]);
  });

  it('should normalize 2-value tuple to 5-value array', () => {
    const onUpdateRange = vi.fn();
    const onRemove = vi.fn();

    // This is the bug scenario: driver stored as [min, max] tuple
    const tupleRange: any = [10, 50];

    render(
      <SensitivityDriverBadge
        path="assumptions.customers.segments[0].volume.base_value"
        currentRange={tupleRange}
        onUpdateRange={onUpdateRange}
        onRemove={onRemove}
        unit="units"
      />
    );

    // Click to open the popover
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should have 5 inputs even though we passed 2 values
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(5);
    
    // Values should be interpolated from min (10) to max (50)
    // [10, 20, 30, 40, 50]
    expect(inputs[0]).toHaveValue(10);  // min
    expect(inputs[1]).toHaveValue(20);  // min + step
    expect(inputs[2]).toHaveValue(30);  // middle
    expect(inputs[3]).toHaveValue(40);  // max - step
    expect(inputs[4]).toHaveValue(50);  // max
  });

  it('should handle readonly tuple from TypeScript type system', () => {
    const onUpdateRange = vi.fn();
    const onRemove = vi.fn();

    // Simulate the actual runtime scenario where a readonly tuple is passed
    // This is what happens when getDriver().range is passed directly
    const readonlyTuple = [10, 50] as readonly [number, number];

    // This should not throw "currentRange.map is not a function"
    expect(() => {
      render(
        <SensitivityDriverBadge
          path="assumptions.customers.segments[0].volume.base_value"
          currentRange={readonlyTuple as any}
          onUpdateRange={onUpdateRange}
          onRemove={onRemove}
          unit="units"
        />
      );
    }).not.toThrow();
  });

  it('should handle object range with min/max properties', () => {
    const onUpdateRange = vi.fn();
    const onRemove = vi.fn();

    // This is the actual bug: when findSensitivityDriver converts array to {min, max}
    const objectRange: any = { min: 10, max: 50 };

    // This should not throw "currentRange.map is not a function"
    expect(() => {
      render(
        <SensitivityDriverBadge
          path="assumptions.customers.segments[0].volume.base_value"
          currentRange={objectRange}
          onUpdateRange={onUpdateRange}
          onRemove={onRemove}
          unit="units"
        />
      );
    }).not.toThrow();

    // Click to open and verify interpolation
    const button = screen.getByRole('button');
    fireEvent.click(button);

    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(5);
    
    // Should interpolate from min to max
    expect(inputs[0]).toHaveValue(10); // min
    expect(inputs[4]).toHaveValue(50); // max
    // Middle values should be interpolated
    expect(parseFloat(inputs[2].getAttribute('value') || '0')).toBeGreaterThan(10);
    expect(parseFloat(inputs[2].getAttribute('value') || '0')).toBeLessThan(50);
  });
});
