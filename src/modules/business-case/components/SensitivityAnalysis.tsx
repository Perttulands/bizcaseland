import React, { MutableRefObject } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatCurrency } from '@/core/engine';
import { getNestedValue } from '@/core/engine';

interface Driver {
  key: string;
  path: string;
  rationale: string;
  range: number[];
  unit?: string;
}

interface SensitivityAnalysisProps {
  drivers: Driver[];
  businessData: any;
  baselineRef: MutableRefObject<any>;
  driverValues: {[key: string]: number};
  onDriverChange: (driverKey: string, value: number) => void;
}

export function SensitivityAnalysis({ 
  drivers, 
  businessData, 
  baselineRef,
  driverValues,
  onDriverChange
}: SensitivityAnalysisProps) {
  
  const getDriverCurrentValue = (driver: Driver) => {
    return driverValues[driver.key] !== undefined 
      ? driverValues[driver.key] 
      : getNestedValue(businessData, driver.path);
  };
  
  // Infer unit from the path if not provided
  const getDriverUnit = (driver: Driver): string | undefined => {
    if (driver.unit) return driver.unit;
    
    // Try to infer unit from the value object at the driver's path
    try {
      // Remove '.value' from the end of the path to get the parent object
      const parentPath = driver.path.replace(/\.value$/, '');
      const parentObj = getNestedValue(businessData, parentPath);
      
      if (parentObj && typeof parentObj === 'object' && 'unit' in parentObj) {
        return parentObj.unit as string;
      }
    } catch (e) {
      // Silent fail - we'll handle undefined unit below
    }
    
    return undefined;
  };

  if (drivers.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <div>
          <CardTitle>Sensitivity Drivers</CardTitle>
          <p className="text-sm text-muted-foreground">
            Adjust key drivers to see real-time impact on your business case. Changes apply immediately.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {drivers.map((driver, index) => {
            const currentValue = getDriverCurrentValue(driver);
            const minValue = Math.min(...driver.range);
            const maxValue = Math.max(...driver.range);
            const baseValue = getNestedValue(baselineRef.current || businessData, driver.path);
            
            // Skip this driver if we can't get valid values
            if (currentValue === undefined || currentValue === null || baseValue === undefined || baseValue === null) {
              console.warn(`Skipping driver ${driver.key} - unable to get values from path: ${driver.path}`);
              return null;
            }
            
            const isModified = Math.abs(currentValue - baseValue) > 0.001;
            
            // Get the unit for this driver
            const driverUnit = getDriverUnit(driver);
            
            // Check if this is a percentage-based value
            const isPercentage = driverUnit === '%' || driverUnit === 'ratio' || driverUnit === 'pct' || driverUnit === 'percentage' || driverUnit?.includes('pct') || driverUnit?.includes('churn');
            
            // Format values for display (percentages: 0.05 -> 5%)
            const formatDisplayValue = (value: number): string => {
              if (value === undefined || value === null) {
                return 'N/A';
              }
              if (businessData.meta.currency && driver.path.includes('price')) {
                return formatCurrency(value, businessData.meta.currency);
              }
              if (isPercentage) {
                return `${(value * 100).toFixed(1)}%`;
              }
              return value.toLocaleString();
            };
            
            // Format values for buttons (percentages: 0.05 -> 5)
            const formatButtonValue = (value: number): string => {
              if (value === undefined || value === null) {
                return 'N/A';
              }
              if (businessData.meta.currency && driver.path.includes('price')) {
                return formatCurrency(value, businessData.meta.currency).replace(/[€$£]/g, '').trim();
              }
              if (isPercentage) {
                return (value * 100).toFixed(1);
              }
              return value.toLocaleString();
            };
            
            return (
              <div key={index} className="space-y-4 p-4 bg-muted/50 dark:bg-muted/50 rounded-lg border-2 border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">
                      {driver.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <p className="text-xs text-muted-foreground">{driver.rationale}</p>
                  </div>
                  {isModified && (
                    <Badge variant="outline" className="text-xs bg-financial-primary text-financial-primary-foreground">
                      Modified
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current Value:</span>
                    <span className="font-mono font-semibold">
                      {formatDisplayValue(currentValue)}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <Slider
                      value={[currentValue]}
                      onValueChange={(values) => onDriverChange(driver.key, values[0])}
                      min={minValue}
                      max={maxValue}
                      step={(maxValue - minValue) / 100}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatDisplayValue(minValue)}</span>
                      <span className="text-center">
                        Base: {formatDisplayValue(baseValue)}
                      </span>
                      <span>{formatDisplayValue(maxValue)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-1">
                    {driver.range.map((value, i) => {
                      const isSelected = Math.abs(currentValue - value) < 0.001; // Handle floating point precision
                      return (
                        <Button
                          key={i}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => onDriverChange(driver.key, value)}
                          className="text-xs h-8"
                        >
                          {formatButtonValue(value)}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default SensitivityAnalysis;