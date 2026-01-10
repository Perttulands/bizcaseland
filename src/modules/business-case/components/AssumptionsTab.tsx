import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, DollarSign, Users, Settings, Info, Calculator, Target, Clock, Zap, BarChart3, Scale } from 'lucide-react';
import { useBusinessData } from '@/core/contexts';
import { EditableValueCell, EditableRationaleCell } from '@/components/common';
import { SensitivityDriverBadge } from './SensitivityDriverBadge';
import { AssumptionDebateDialog, EvidenceTrailPanel } from '@/components/features/AssumptionDebate';

interface SensitivityDriver {
  key: string;
  path: string;
  range: {
    min: number;
    max: number;
  };
  rationale?: string;
}

interface AssumptionRow {
  label: string;
  value?: any;
  unit?: string;
  rationale?: string;
  category: string;
  isSubItem?: boolean;
  icon?: any;
  color?: string;
  sensitivityDriver?: SensitivityDriver;
  dataPath?: string;
}

export function AssumptionsTab() {
  const { data, updateAssumption, addDriver, removeDriver, updateDriverRange } = useBusinessData();
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [changedValuePaths, setChangedValuePaths] = useState<Set<string>>(new Set());

  // Debate mode state
  const [debateOpen, setDebateOpen] = useState(false);
  const [debateAssumption, setDebateAssumption] = useState<{
    label: string;
    value: number | string;
    unit: string;
    rationale: string;
    category: string;
    dataPath?: string;
  } | null>(null);
  const [showEvidenceTrail, setShowEvidenceTrail] = useState(false);

  // Handle opening debate dialog for an assumption
  const handleChallenge = (row: AssumptionRow) => {
    if (row.value === undefined || !row.dataPath) return;
    setDebateAssumption({
      label: row.label.trim(),
      value: row.value,
      unit: row.unit || '',
      rationale: row.rationale || '',
      category: row.category,
      dataPath: row.dataPath,
    });
    setDebateOpen(true);
  };

  // Handle value update from debate
  const handleDebateValueUpdate = (newValue: number | string, reasoning: string) => {
    if (debateAssumption?.dataPath) {
      updateAssumption(debateAssumption.dataPath, newValue);
      // Update rationale with reasoning
      const rationalePath = debateAssumption.dataPath.replace('.value', '.rationale');
      updateAssumption(rationalePath, reasoning);
    }
  };

  if (!data) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Info className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No Data Available</h3>
            <p className="text-muted-foreground">Please load business case data to view assumptions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.meta.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatValue = (value: any, unit: string) => {
    if (typeof value === 'number') {
      if (unit.includes('EUR') || unit.includes('USD')) {
        return formatCurrency(value);
      }
      if (unit === 'ratio' || unit.includes('pct') || unit.includes('percentage')) {
        return `${(value * 100).toFixed(1)}%`;
      }
      if (unit.includes('hours')) {
        return `${value.toFixed(1)} hours`;
      }
      if (unit === 'month' || unit.includes('month') && !unit.includes('per_month')) {
        return `Month ${value}`;
      }
      if (unit.includes('per_customer') || unit.includes('per_unit')) {
        return `${formatCurrency(value)} ${unit.replace('EUR_', '').replace('_', ' ')}`;
      }
      return value.toLocaleString();
    }
    return String(value);
  };

  // Handle value updates
  const handleValueUpdate = (path: string, value: any) => {
    updateAssumption(path, value);
    // Mark the value path as changed (so rationale shows red)
    const valuePath = path.replace('.value', ''); // Get base path without .value
    setChangedValuePaths(prev => new Set(prev).add(valuePath));
  };

  // Handle rationale updates
  const handleRationaleUpdate = (path: string, value: string) => {
    updateAssumption(path, value);
    // Remove from changed paths when rationale is updated
    const valuePath = path.replace('.rationale', ''); // Get base path without .rationale
    setChangedValuePaths(prev => {
      const newSet = new Set(prev);
      newSet.delete(valuePath);
      return newSet;
    });
  };

  // Helper to check if rationale needs update
  const rationaleNeedsUpdate = (dataPath: string | undefined): boolean => {
    if (!dataPath) return false;
    const basePath = dataPath.replace('.value', '').replace('.rationale', '');
    return changedValuePaths.has(basePath);
  };

  // Check if a path is a sensitivity driver
  const isDriver = (path: string | undefined): boolean => {
    if (!path || !data?.drivers) return false;
    return data.drivers.some((d: any) => d.path === path);
  };

  // Get driver for a path
  const getDriver = (path: string | undefined) => {
    if (!path || !data?.drivers) return undefined;
    return data.drivers.find((d: any) => d.path === path);
  };

  // Toggle driver status
  const handleToggleDriver = (path: string, label: string, unit?: string) => {
    if (isDriver(path)) {
      removeDriver(path);
    } else {
      // Create a key from the label
      const key = label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      // Default range with 5 values
      const defaultRange = [0, 0, 0, 0, 0];
      const rationale = `Sensitivity analysis for ${label.trim()}`;
      addDriver(path, key, defaultRange, rationale, unit);
    }
  };

  // Determine business model type
  const isCostSavingsModel = data.meta?.business_model === 'cost_savings';
  const isRecurringModel = data.meta?.business_model === 'recurring';

  // Helper function to find sensitivity driver for a given path
  const findSensitivityDriver = (dataPath: string): SensitivityDriver | undefined => {
    if (!data.drivers) return undefined;
    
    const driver = data.drivers.find((d: any) => d.path === dataPath);
    if (!driver) return undefined;
    // Handle both array format (e.g. [30,40,50,60,70]) and object format { min, max }
    let range: { min: number; max: number } | undefined;
    if (Array.isArray(driver.range)) {
      const nums = driver.range.filter((v: any) => typeof v === 'number');
      if (nums.length > 0) {
        range = { min: Math.min(...nums), max: Math.max(...nums) };
      }
    } else {
      // defensive: treat driver.range as any and accept {min,max} shape
      const drRange: any = driver.range;
      if (drRange && typeof drRange.min === 'number' && typeof drRange.max === 'number') {
        range = { min: drRange.min, max: drRange.max };
      }
    }

    return {
      key: driver.key,
      path: driver.path,
      // cast to any to be tolerant of undefined ranges in data
      range: range as any,
      rationale: driver.rationale
    };
  };

  // Helper function to generate the data path for an assumption
  const generateDataPath = (category: string, index?: number, field?: string) => {
    switch (category) {
      case 'pricing':
        if (field === 'avg_unit_price') return 'assumptions.pricing.avg_unit_price.value';
        break;
      case 'cost_savings':
        if (field === 'baseline_cost') return `assumptions.cost_savings.baseline_costs[${index}].current_monthly_cost.value`;
        if (field === 'savings_rate') return `assumptions.cost_savings.baseline_costs[${index}].savings_potential_pct.value`;
        break;
      case 'efficiency':
        if (field === 'baseline') return `assumptions.cost_savings.efficiency_gains[${index}].baseline_value.value`;
        if (field === 'improved') return `assumptions.cost_savings.efficiency_gains[${index}].improved_value.value`;
        if (field === 'value_per_unit') return `assumptions.cost_savings.efficiency_gains[${index}].value_per_unit.value`;
        break;
      case 'cogs':
        if (field === 'cogs_pct') return 'assumptions.unit_economics.cogs_pct.value';
        if (field === 'cac') return 'assumptions.unit_economics.cac.value';
        break;
      case 'opex':
        // Legacy format
        if (field === 'value') return `assumptions.opex[${index}].value.value`;
        // New format with cost_structure
        if (field === 'fixed_component') return `assumptions.opex[${index}].cost_structure.fixed_component.value`;
        if (field === 'variable_revenue_rate') return `assumptions.opex[${index}].cost_structure.variable_revenue_rate.value`;
        if (field === 'variable_volume_rate') return `assumptions.opex[${index}].cost_structure.variable_volume_rate.value`;
        break;
      case 'capex':
        return `assumptions.capex[${index}].timeline.series[0].value`;
      case 'financial':
        if (field === 'interest_rate') return 'assumptions.financial.interest_rate.value';
        break;
      case 'segment':
        // Segment volume fields
        if (field === 'base_volume') return `assumptions.customers.segments[${index}].volume.series[0].value`;
        if (field === 'base_volume_rationale') return `assumptions.customers.segments[${index}].volume.series[0].rationale`;
        break;
      case 'segment_growth':
        // Growth rate fields - different paths depending on pattern type
        if (field === 'geom_growth') return 'assumptions.growth_settings.geom_growth.monthly_growth.value';
        if (field === 'geom_growth_rationale') return 'assumptions.growth_settings.geom_growth.monthly_growth.rationale';
        if (field === 'linear_growth') return 'assumptions.growth_settings.linear_growth.monthly_flat_increase.value';
        if (field === 'linear_growth_rationale') return 'assumptions.growth_settings.linear_growth.monthly_flat_increase.rationale';
        if (field === 'seasonal_growth') return 'assumptions.growth_settings.seasonal_growth.yoy_growth.value';
        if (field === 'seasonal_growth_rationale') return 'assumptions.growth_settings.seasonal_growth.yoy_growth.rationale';
        break;
      case 'segment_yearly_factor':
        // Yearly adjustment factors
        if (field === 'factor_value') return `assumptions.customers.segments[${index}].volume.yearly_adjustments.volume_factors[${field}].factor`;
        if (field === 'factor_rationale') return `assumptions.customers.segments[${index}].volume.yearly_adjustments.volume_factors[${field}].rationale`;
        break;
      default:
        return null;
    }
    return null;
  };

  // Build assumption rows based on business model and available data
  const getAssumptionRows = () => {
    const rows: any[] = [];

    // Revenue/Net Benefit Section
    rows.push({ 
      label: isCostSavingsModel ? 'Net Benefits' : 'Revenue', 
      category: 'header',
      icon: TrendingUp,
      color: 'text-financial-success'
    });

    if (isCostSavingsModel) {
      // Cost Savings Model
      if (data.assumptions?.cost_savings?.baseline_costs) {
        data.assumptions.cost_savings.baseline_costs.forEach((cost, index) => {
          const baselinePath = generateDataPath('cost_savings', index, 'baseline_cost');
          const savingsPath = generateDataPath('cost_savings', index, 'savings_rate');
          const baselineDriver = findSensitivityDriver(baselinePath);
          const savingsDriver = findSensitivityDriver(savingsPath);
          
          rows.push({
            label: `  ${cost.label} - Baseline Cost`,
            value: cost.current_monthly_cost?.value,
            unit: cost.current_monthly_cost?.unit,
            rationale: cost.current_monthly_cost?.rationale,
            category: 'cost_savings',
            isSubItem: true,
            sensitivityDriver: baselineDriver,
            dataPath: baselinePath
          });
          rows.push({
            label: `  ${cost.label} - Savings Rate`,
            value: cost.savings_potential_pct?.value,
            unit: cost.savings_potential_pct?.unit,
            rationale: cost.savings_potential_pct?.rationale,
            category: 'cost_savings',
            isSubItem: true,
            sensitivityDriver: savingsDriver,
            dataPath: savingsPath
          });
        });
      }

      if (data.assumptions?.cost_savings?.efficiency_gains) {
        data.assumptions.cost_savings.efficiency_gains.forEach((gain, index) => {
          const baselinePath = generateDataPath('efficiency', index, 'baseline');
          const improvedPath = generateDataPath('efficiency', index, 'improved');
          const valuePath = generateDataPath('efficiency', index, 'value_per_unit');
          const baselineDriver = findSensitivityDriver(baselinePath);
          const improvedDriver = findSensitivityDriver(improvedPath);
          const valueDriver = findSensitivityDriver(valuePath);
          
          rows.push({
            label: `  ${gain.label} - Baseline`,
            value: gain.baseline_value?.value,
            unit: gain.baseline_value?.unit,
            rationale: gain.baseline_value?.rationale,
            category: 'efficiency',
            isSubItem: true,
            sensitivityDriver: baselineDriver,
            dataPath: baselinePath
          });
          rows.push({
            label: `  ${gain.label} - Improved`,
            value: gain.improved_value?.value,
            unit: gain.improved_value?.unit,
            rationale: gain.improved_value?.rationale,
            category: 'efficiency',
            isSubItem: true,
            sensitivityDriver: improvedDriver,
            dataPath: improvedPath
          });
          rows.push({
            label: `  ${gain.label} - Value per Unit`,
            value: gain.value_per_unit?.value,
            unit: gain.value_per_unit?.unit,
            rationale: gain.value_per_unit?.rationale,
            category: 'efficiency',
            isSubItem: true,
            sensitivityDriver: valueDriver,
            dataPath: valuePath
          });
        });
      }
    } else {
      // Regular Business Model
      if (data.assumptions?.pricing?.avg_unit_price) {
        const pricingPath = generateDataPath('pricing', undefined, 'avg_unit_price');
        const pricingDriver = findSensitivityDriver(pricingPath);
        
        rows.push({
          label: '  Average Unit Price',
          value: data.assumptions.pricing.avg_unit_price.value,
          unit: data.assumptions.pricing.avg_unit_price.unit,
          rationale: data.assumptions.pricing.avg_unit_price.rationale,
          category: 'pricing',
          isSubItem: true,
          sensitivityDriver: pricingDriver,
          dataPath: pricingPath
        });
      }

      if (data.assumptions?.customers?.segments) {
        data.assumptions.customers.segments.forEach((segment, index) => {
          // Cast segment to any to handle the actual data structure vs typed interface mismatch
          const segmentAny = segment as any;
          
          // Handle pattern-based volume data (new format)
          if (segmentAny.volume?.type === 'pattern') {
            const patternType = segmentAny.volume.pattern_type;
            
            // Extract base value from series, growth_settings, or direct base_value
            let baseValue, baseUnit, baseRationale;
            if (segmentAny.volume.series && segmentAny.volume.series[0]) {
              baseValue = segmentAny.volume.series[0].value;
              baseUnit = segmentAny.volume.series[0].unit;
              baseRationale = segmentAny.volume.series[0].rationale;
            } else if (data.assumptions?.growth_settings?.[patternType]?.start) {
              baseValue = data.assumptions.growth_settings[patternType].start.value;
              baseUnit = data.assumptions.growth_settings[patternType].start.unit;
              baseRationale = data.assumptions.growth_settings[patternType].start.rationale;
            } else if (segmentAny.volume.base_value !== undefined) {
              // Handle direct base_value in volume object
              baseValue = segmentAny.volume.base_value;
              baseUnit = segmentAny.volume.unit;
              baseRationale = segmentAny.volume.rationale;
            }
            
            if (baseValue !== undefined) {
              const baseVolumePath = generateDataPath('segment', index, 'base_volume');
              const baseVolumeDriver = findSensitivityDriver(baseVolumePath);
              
              rows.push({
                label: `  ${segmentAny.name || segment.label} - Base Volume`,
                value: baseValue,
                unit: baseUnit || 'units_per_month',
                rationale: baseRationale || `Base volume for ${segmentAny.name || segment.label}`,
                category: 'volume',
                isSubItem: true,
                sensitivityDriver: baseVolumeDriver,
                dataPath: baseVolumePath
              });
            }
            
            // Extract growth rate from growth_settings or direct growth_rate
            let growthValue, growthUnit, growthRationale;
            if (data.assumptions?.growth_settings?.[patternType]) {
              const growthSettings = data.assumptions.growth_settings[patternType];
              
              if (patternType === 'geom_growth' && growthSettings.monthly_growth) {
                growthValue = growthSettings.monthly_growth.value;
                growthUnit = 'ratio'; // Convert to percentage display
                growthRationale = growthSettings.monthly_growth.rationale;
              } else if (patternType === 'linear_growth' && growthSettings.monthly_flat_increase) {
                growthValue = growthSettings.monthly_flat_increase.value;
                growthUnit = growthSettings.monthly_flat_increase.unit;
                growthRationale = growthSettings.monthly_flat_increase.rationale;
              } else if (patternType === 'seasonal_growth' && growthSettings.yoy_growth) {
                growthValue = growthSettings.yoy_growth.value;
                growthUnit = growthSettings.yoy_growth.unit;
                growthRationale = growthSettings.yoy_growth.rationale;
              }
            } else if (segmentAny.volume.growth_rate !== undefined) {
              // Handle direct growth_rate in volume object
              growthValue = segmentAny.volume.growth_rate;
              // For linear growth, the growth_rate is in units_per_month; for others it's a ratio
              growthUnit = (segmentAny.volume.pattern_type === 'linear_growth') ? 'units_per_month' : 'ratio';
              growthRationale = segmentAny.volume.growth_rationale || 'Growth rate assumption';
            }
            
            if (growthValue !== undefined) {
              const growthLabel = patternType === 'linear_growth' 
                ? 'Linear Growth' 
                : 'Growth Rate';
              
              // Generate data path based on pattern type
              let growthPath = null;
              if (patternType === 'geom_growth') {
                growthPath = generateDataPath('segment_growth', undefined, 'geom_growth');
              } else if (patternType === 'linear_growth') {
                growthPath = generateDataPath('segment_growth', undefined, 'linear_growth');
              } else if (patternType === 'seasonal_growth') {
                growthPath = generateDataPath('segment_growth', undefined, 'seasonal_growth');
              }
              
              const growthDriver = findSensitivityDriver(growthPath);
              
              rows.push({
                label: `  ${segmentAny.name || segment.label} - ${growthLabel}`,
                value: growthValue,
                unit: growthUnit,
                rationale: growthRationale || 'Growth rate assumption',
                category: 'volume',
                isSubItem: true,
                sensitivityDriver: growthDriver,
                dataPath: growthPath
              });
            }
            
            // Show growth pattern type (only if patternType is defined)
            if (patternType) {
              rows.push({
                label: `  ${segmentAny.name || segment.label} - Growth Pattern`,
                value: patternType.replace('_', ' '),
                unit: 'pattern',
                rationale: `Growth methodology: ${patternType}`,
                category: 'volume',
                isSubItem: true
              });
            }
            
            // Handle yearly adjustments if present
            if (segmentAny.volume.yearly_adjustments?.volume_factors) {
              segmentAny.volume.yearly_adjustments.volume_factors.forEach((factor: any, factorIndex: number) => {
                const factorPath = `assumptions.customers.segments[${index}].volume.yearly_adjustments.volume_factors[${factorIndex}].factor`;
                const factorDriver = findSensitivityDriver(factorPath);
                
                rows.push({
                  label: `    ${segmentAny.name || segment.label} - Year ${factor.year} Factor`,
                  value: factor.factor,
                  unit: 'multiplier',
                  rationale: factor.rationale,
                  category: 'volume',
                  isSubItem: true,
                  sensitivityDriver: factorDriver,
                  dataPath: factorPath
                });
              });
            }
          }
          // Handle modern data structure with base_value and growth_rate (direct in volume object)
          else if (segmentAny.volume?.base_value !== undefined) {
            const baseVolumePath = `assumptions.customers.segments[${index}].volume.base_value`;
            const baseVolumeDriver = findSensitivityDriver(baseVolumePath);
            
            rows.push({
              label: `  ${segmentAny.name || segment.label} - Base Volume`,
              value: segmentAny.volume.base_value,
              unit: segmentAny.volume.unit || 'units_per_month',
              rationale: segmentAny.volume.rationale || `Base volume for ${segmentAny.name || segment.label}`,
              category: 'volume',
              isSubItem: true,
              sensitivityDriver: baseVolumeDriver,
              dataPath: baseVolumePath
            });
          
            // Show growth rate based on pattern type
            if (segmentAny.volume?.growth_rate !== undefined) {
              const growthLabel = segmentAny.volume.pattern_type === 'linear_growth' 
                ? 'Linear Growth' 
                : 'Growth Rate';
              const growthUnit = segmentAny.volume.pattern_type === 'linear_growth'
                ? 'units_per_month'
                : 'ratio';
              const growthPath = `assumptions.customers.segments[${index}].volume.growth_rate`;
              const growthDriver = findSensitivityDriver(growthPath);
              
              rows.push({
                label: `  ${segmentAny.name || segment.label} - ${growthLabel}`,
                value: segmentAny.volume.growth_rate,
                unit: growthUnit,
                rationale: segmentAny.volume.growth_rationale || 'Growth rate assumption',
                category: 'volume',
                isSubItem: true,
                sensitivityDriver: growthDriver,
                dataPath: growthPath
              });
            }
            
            // Show growth pattern type
            if (segmentAny.volume?.pattern_type) {
              rows.push({
                label: `  ${segmentAny.name || segment.label} - Growth Pattern`,
                value: segmentAny.volume.pattern_type.replace('_', ' '),
                unit: 'pattern',
                rationale: segmentAny.volume.growth_rationale || 'Growth pattern methodology',
                category: 'volume',
                isSubItem: true
              });
            }
            
            // Handle seasonal patterns
            if (segmentAny.volume?.pattern_type === 'seasonal_growth' && segmentAny.volume?.seasonal_pattern) {
              const peakMonth = segmentAny.volume.seasonal_pattern.indexOf(Math.max(...segmentAny.volume.seasonal_pattern)) + 1;
              const lowMonth = segmentAny.volume.seasonal_pattern.indexOf(Math.min(...segmentAny.volume.seasonal_pattern)) + 1;
              
              rows.push({
                label: `  ${segmentAny.name || segment.label} - Seasonal Variation`,
                value: `Peak: Month ${peakMonth}, Low: Month ${lowMonth}`,
                unit: 'seasonal',
                rationale: 'Seasonal demand pattern throughout the year',
                category: 'volume',
                isSubItem: true
              });
            }
          }
          
          // Handle legacy data structure for backward compatibility
          else if (segment.volume?.base_year_total) {
            const baseVolumePath = `assumptions.customers.segments[${index}].volume.base_year_total.value`;
            const baseVolumeDriver = findSensitivityDriver(baseVolumePath);
            
            rows.push({
              label: `  ${segmentAny.name || segment.label} - Base Volume`,
              value: segment.volume.base_year_total.value,
              unit: segment.volume.base_year_total.unit,
              rationale: segment.volume.base_year_total.rationale,
              category: 'volume',
              isSubItem: true,
              sensitivityDriver: baseVolumeDriver,
              dataPath: baseVolumePath
            });
          
            if (segment.volume?.yoy_growth) {
              const growthPath = `assumptions.customers.segments[${index}].volume.yoy_growth.value`;
              const growthDriver = findSensitivityDriver(growthPath);
              
              rows.push({
                label: `  ${segmentAny.name || segment.label} - Growth Rate`,
                value: segment.volume.yoy_growth.value,
                unit: segment.volume.yoy_growth.unit,
                rationale: segment.volume.yoy_growth.rationale,
                category: 'volume',
                isSubItem: true,
                sensitivityDriver: growthDriver,
                dataPath: growthPath
              });
            }
          }
        });
      }
    }

    // Gross Margin Section (only for non-cost savings models)
    if (!isCostSavingsModel) {
      rows.push({ label: '', category: 'spacer' });
      rows.push({ 
        label: 'Gross Margin', 
        category: 'header',
        icon: DollarSign,
        color: 'text-financial-primary'
      });

      if (data.assumptions?.unit_economics?.cogs_pct) {
        const cogsPath = generateDataPath('cogs', undefined, 'cogs_pct');
        const cogsDriver = findSensitivityDriver(cogsPath);
        
        rows.push({
          label: '  Cost of Goods Sold %',
          value: data.assumptions.unit_economics.cogs_pct.value,
          unit: data.assumptions.unit_economics.cogs_pct.unit,
          rationale: data.assumptions.unit_economics.cogs_pct.rationale,
          category: 'cogs',
          isSubItem: true,
          sensitivityDriver: cogsDriver,
          dataPath: cogsPath
        });
      }

      if (data.assumptions?.unit_economics?.cac) {
        const cacPath = generateDataPath('cogs', undefined, 'cac');
        const cacDriver = findSensitivityDriver(cacPath);
        
        rows.push({
          label: '  Customer Acquisition Cost',
          value: data.assumptions.unit_economics.cac.value,
          unit: data.assumptions.unit_economics.cac.unit,
          rationale: data.assumptions.unit_economics.cac.rationale,
          category: 'cogs',
          isSubItem: true,
          sensitivityDriver: cacDriver,
          dataPath: cacPath
        });
      }
    }

    // Operating Expenses Section
    rows.push({ label: '', category: 'spacer' });
    rows.push({ 
      label: 'Operating Expenses', 
      category: 'header',
      icon: Settings,
      color: 'text-financial-danger'
    });

    if (data.assumptions?.opex) {
      data.assumptions.opex.forEach((opex, index) => {
        // Check if using new cost_structure format or legacy value format
        if (opex.cost_structure) {
          // New format with variable costs
          rows.push({
            label: `  ${opex.name}`,
            category: 'opex',
            isSubItem: false,
            // This is just a header row for this OPEX item
          });
          
          // Fixed component
          if (opex.cost_structure.fixed_component) {
            const fixedPath = generateDataPath('opex', index, 'fixed_component');
            const fixedDriver = findSensitivityDriver(fixedPath);
            
            rows.push({
              label: `    ${opex.name} - Fixed Component`,
              value: opex.cost_structure.fixed_component.value,
              unit: opex.cost_structure.fixed_component.unit,
              rationale: opex.cost_structure.fixed_component.rationale,
              category: 'opex',
              isSubItem: true,
              sensitivityDriver: fixedDriver,
              dataPath: fixedPath
            });
          }
          
          // Variable revenue rate
          if (opex.cost_structure.variable_revenue_rate) {
            const revPath = generateDataPath('opex', index, 'variable_revenue_rate');
            const revDriver = findSensitivityDriver(revPath);
            
            rows.push({
              label: `    ${opex.name} - Variable Revenue Rate`,
              value: opex.cost_structure.variable_revenue_rate.value,
              unit: opex.cost_structure.variable_revenue_rate.unit,
              rationale: opex.cost_structure.variable_revenue_rate.rationale,
              category: 'opex',
              isSubItem: true,
              sensitivityDriver: revDriver,
              dataPath: revPath
            });
          }
          
          // Variable volume rate
          if (opex.cost_structure.variable_volume_rate) {
            const volPath = generateDataPath('opex', index, 'variable_volume_rate');
            const volDriver = findSensitivityDriver(volPath);
            
            rows.push({
              label: `    ${opex.name} - Variable Volume Rate`,
              value: opex.cost_structure.variable_volume_rate.value,
              unit: opex.cost_structure.variable_volume_rate.unit,
              rationale: opex.cost_structure.variable_volume_rate.rationale,
              category: 'opex',
              isSubItem: true,
              sensitivityDriver: volDriver,
              dataPath: volPath
            });
          }
        } else if (opex.value) {
          // Legacy format with fixed value only
          const opexPath = generateDataPath('opex', index, 'value');
          const opexDriver = findSensitivityDriver(opexPath);
          
          rows.push({
            label: `  ${opex.name}`,
            value: opex.value.value,
            unit: opex.value.unit,
            rationale: opex.value.rationale,
            category: 'opex',
            isSubItem: true,
            sensitivityDriver: opexDriver,
            dataPath: opexPath
          });
        }
      });
    }

    // Capital Expenditures Section
    if (data.assumptions?.capex && data.assumptions.capex.length > 0) {
      rows.push({ label: '', category: 'spacer' });
      rows.push({ 
        label: 'Capital Expenditures', 
        category: 'header',
        icon: Calculator,
        color: 'text-purple-600'
      });

      data.assumptions.capex.forEach((capex, index) => {
        if (capex.timeline?.series?.[0]) {
          const capexPath = generateDataPath('capex', index);
          const capexDriver = findSensitivityDriver(capexPath);
          
          rows.push({
            label: `  ${capex.name}`,
            value: capex.timeline.series[0].value,
            unit: capex.timeline.series[0].unit,
            rationale: capex.timeline.series[0].rationale,
            category: 'capex',
            isSubItem: true,
            sensitivityDriver: capexDriver,
            dataPath: capexPath
          });
        }
      });
    }

    // Financial Parameters Section
    rows.push({ label: '', category: 'spacer' });
    rows.push({ 
      label: 'Financial Parameters', 
      category: 'header',
      icon: TrendingUp,
      color: 'text-blue-600'
    });

    if (data.assumptions?.financial?.interest_rate) {
      const interestPath = generateDataPath('financial', undefined, 'interest_rate');
      const interestDriver = findSensitivityDriver(interestPath);
      
      rows.push({
        label: '  Discount Rate',
        value: data.assumptions.financial.interest_rate.value,
        unit: data.assumptions.financial.interest_rate.unit,
        rationale: data.assumptions.financial.interest_rate.rationale,
        category: 'financial',
        isSubItem: true,
        sensitivityDriver: interestDriver,
        dataPath: interestPath
      });
    }

    if (data.meta?.periods) {
      const periodsPath = generateDataPath('meta', undefined, 'periods');
      const periodsDriver = findSensitivityDriver(periodsPath);
      
      rows.push({
        label: '  Analysis Period',
        value: data.meta.periods,
        unit: 'months',
        rationale: `Business case analysis covers ${data.meta.periods} months`,
        category: 'financial',
        isSubItem: true,
        sensitivityDriver: periodsDriver,
        dataPath: periodsPath
      });
    }

    if (data.meta?.frequency) {
      const frequencyPath = generateDataPath('meta', undefined, 'frequency');
      const frequencyDriver = findSensitivityDriver(frequencyPath);
      
      rows.push({
        label: '  Reporting Frequency',
        value: data.meta.frequency,
        unit: 'frequency',
        rationale: `Financial projections calculated on a ${data.meta.frequency} basis`,
        category: 'financial',
        isSubItem: true,
        sensitivityDriver: frequencyDriver,
        dataPath: frequencyPath
      });
    }

    return rows;
  };

  const assumptionRows = getAssumptionRows();

  const getRowClasses = (row: any) => {
    if (row.category === 'spacer') return 'h-2';
    if (row.category === 'header') return 'bg-muted/20 border-t-2 border-border font-semibold';
    if (row.isSubItem) return 'hover:bg-muted/30 transition-colors';
    return '';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Business Case Assumptions</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Click any value or rationale to edit inline. Changes save automatically and update all calculations.
            When you edit a value, its rationale will turn <span className="text-red-600 font-medium">red</span> to remind you to update it too.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="text-xs">
              {assumptionRows.filter(r => r.value !== undefined).length} assumptions
            </Badge>
            <Badge variant="outline" className="text-xs">
              {data.meta?.business_model?.replace('_', ' ')} model
            </Badge>
            <Badge variant="outline" className="text-xs">
              {data.meta?.currency} currency
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Assumptions Table */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Assumption Details</span>
            </div>
            <p className="text-xs text-muted-foreground font-normal">
              Click values or rationales to edit • Changes save automatically
            </p>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-center px-2 py-3 font-medium text-xs w-12">
                    <Tooltip>
                      <TooltipTrigger>Driver</TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Check to include in sensitivity analysis</p>
                      </TooltipContent>
                    </Tooltip>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-sm">Assumption</th>
                  <th className="text-center px-4 py-3 font-medium text-sm">Value</th>
                  <th className="text-center px-4 py-3 font-medium text-sm">Unit</th>
                  <th className="text-left px-4 py-3 font-medium text-sm">Rationale</th>
                  <th className="text-center px-2 py-3 font-medium text-xs w-20">
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1">
                        <Scale className="h-3 w-3" />
                        Debate
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Challenge this assumption with AI analysis</p>
                      </TooltipContent>
                    </Tooltip>
                  </th>
                </tr>
              </thead>
              <tbody>
                {assumptionRows.map((row, index) => {
                  const rowClasses = getRowClasses(row);
                  
                  if (row.category === 'spacer') {
                    return <tr key={index} className={rowClasses}><td colSpan={6}></td></tr>;
                  }

                  if (row.category === 'header') {
                    const Icon = row.icon;
                    return (
                      <tr key={index} className={rowClasses}>
                        <td colSpan={6} className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <Icon className={`h-4 w-4 ${row.color}`} />
                            <span className="font-semibold text-base">{row.label}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <TooltipProvider key={index}>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <tr 
                            className={rowClasses}
                            onMouseEnter={() => setHoveredCell(`row-${index}`)}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            <td className="px-2 py-3 text-center">
                              {row.dataPath && row.value !== undefined && (
                                <Checkbox
                                  checked={isDriver(row.dataPath)}
                                  onCheckedChange={() => handleToggleDriver(row.dataPath, row.label, row.unit)}
                                  className="cursor-pointer"
                                />
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-sm">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">{row.label}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {row.value !== undefined ? (
                                <div className="flex items-center justify-center gap-2">
                                  <EditableValueCell
                                    value={row.value}
                                    unit={row.unit}
                                    dataPath={row.dataPath || null}
                                    formatValue={formatValue}
                                    onUpdate={handleValueUpdate}
                                    onValueChanged={(path) => {
                                      // Track that this value was changed
                                      const basePath = path.replace('.value', '');
                                      setChangedValuePaths(prev => new Set(prev).add(basePath));
                                    }}
                                  />
                                  {isDriver(row.dataPath) && row.dataPath && (
                                    <SensitivityDriverBadge
                                      path={row.dataPath}
                                      currentRange={getDriver(row.dataPath)?.range || [0, 0, 0, 0, 0]}
                                      onUpdateRange={(range) => updateDriverRange(row.dataPath, range)}
                                      onRemove={() => removeDriver(row.dataPath)}
                                      unit={row.unit}
                                    />
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {row.unit && (
                                <Badge variant="outline" className="text-xs">
                                  {row.unit.replace('_', ' ')}
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground max-w-md">
                              <EditableRationaleCell
                                value={row.rationale || 'No rationale provided'}
                                dataPath={row.dataPath ? row.dataPath.replace('.value', '.rationale') : null}
                                onUpdate={handleRationaleUpdate}
                                needsUpdate={rationaleNeedsUpdate(row.dataPath)}
                              />
                            </td>
                            <td className="px-2 py-3 text-center">
                              {row.value !== undefined && row.dataPath && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleChallenge(row);
                                  }}
                                  className="h-7 px-2 text-xs hover:bg-primary/10"
                                >
                                  <Scale className="h-3 w-3 mr-1" />
                                  Debate
                                </Button>
                              )}
                            </td>
                          </tr>
                        </TooltipTrigger>
                        {row.rationale && (
                          <TooltipContent side="top" className="max-w-sm">
                            <div className="space-y-1">
                              <p className="font-medium text-xs">{row.label.trim()}</p>
                              <p className="text-xs text-muted-foreground">{row.rationale}</p>
                              {row.value !== undefined && (
                                <p className="text-xs">
                                  <span className="font-medium">Value:</span> {formatValue(row.value, row.unit)}
                                </p>
                              )}
                              {row.sensitivityDriver && (
                                <div className="border-t pt-1 mt-1">
                                  <p className="text-xs font-medium text-orange-500 flex items-center space-x-1">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>Sensitivity Driver</span>
                                  </p>
                                  {row.sensitivityDriver.range && (
                                    <p className="text-xs text-muted-foreground">
                                      Range: {row.sensitivityDriver.range.min} to {row.sensitivityDriver.range.max}
                                    </p>
                                  )}
                                  {row.sensitivityDriver.rationale && (
                                    <p className="text-xs text-muted-foreground">
                                      {row.sensitivityDriver.rationale}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-success shadow-card">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-white/80 mb-1">Total Assumptions</p>
              <p className="text-2xl font-bold text-white">
                {assumptionRows.filter(r => r.value !== undefined).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-secondary shadow-card">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-white/80 mb-1">Analysis Period</p>
              <p className="text-2xl font-bold text-white">
                {data.meta?.periods} months
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-accent shadow-card">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-white/80 mb-1">Currency</p>
              <p className="text-2xl font-bold text-white">
                {data.meta?.currency}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evidence Trail Toggle */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEvidenceTrail(!showEvidenceTrail)}
          className="gap-2"
        >
          <Scale className="h-4 w-4" />
          {showEvidenceTrail ? 'Hide' : 'Show'} Evidence Trail
        </Button>
      </div>

      {/* Evidence Trail Panel */}
      {showEvidenceTrail && <EvidenceTrailPanel className="mt-4" />}

      {/* Assumption Debate Dialog */}
      <AssumptionDebateDialog
        open={debateOpen}
        onOpenChange={setDebateOpen}
        assumption={debateAssumption}
        onValueUpdate={handleDebateValueUpdate}
      />
    </div>
  );
}
