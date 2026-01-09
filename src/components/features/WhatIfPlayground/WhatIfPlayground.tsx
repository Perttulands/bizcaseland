/**
 * WhatIfPlayground Component
 * Interactive sensitivity analysis with real-time visualization
 *
 * "Drag sliders for key variables and watch the entire cash flow
 * visualization update in real-time."
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Sliders,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useBusinessData } from '@/core/contexts';
import { calculateBusinessMetrics } from '@/core/engine';
import { WhatIfSlider } from './WhatIfSlider';
import {
  PlaygroundSlider,
  ScenarioResult,
  MonthlyScenarioData,
  PresetScenario,
  PRESET_SCENARIOS,
  DEFAULT_CHART_CONFIG,
} from './types';
import type { Driver } from '@/core/types/common';

// ============================================================================
// Custom Tooltip
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string; name: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `€${(value / 1000000).toFixed(2)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value.toFixed(0)}`;
  };

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-medium">{formatValue(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Key Metrics Display
// ============================================================================

interface KeyMetricsProps {
  baseline: ScenarioResult | null;
  current: ScenarioResult | null;
}

function KeyMetrics({ baseline, current }: KeyMetricsProps) {
  const metrics = useMemo(() => {
    if (!current) return [];

    const formatCurrency = (value: number) => {
      if (Math.abs(value) >= 1000000) {
        return `€${(value / 1000000).toFixed(2)}M`;
      }
      if (Math.abs(value) >= 1000) {
        return `€${(value / 1000).toFixed(0)}K`;
      }
      return `€${value.toFixed(0)}`;
    };

    const getChange = (current: number, base: number | undefined) => {
      if (!base || base === 0) return null;
      return ((current - base) / Math.abs(base)) * 100;
    };

    return [
      {
        label: 'NPV',
        value: formatCurrency(current.outputs.npv),
        change: getChange(current.outputs.npv, baseline?.outputs.npv),
      },
      {
        label: 'IRR',
        value: current.outputs.irr !== null ? `${(current.outputs.irr * 100).toFixed(1)}%` : 'N/A',
        change: current.outputs.irr && baseline?.outputs.irr
          ? (current.outputs.irr - baseline.outputs.irr) * 100
          : null,
      },
      {
        label: 'Runway',
        value: `${current.outputs.runway} mo`,
        change: baseline ? current.outputs.runway - baseline.outputs.runway : null,
        unit: 'mo',
      },
      {
        label: 'Revenue (Y1)',
        value: formatCurrency(current.outputs.revenue),
        change: getChange(current.outputs.revenue, baseline?.outputs.revenue),
      },
    ];
  }, [current, baseline]);

  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="text-center">
          <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
          <p className="font-mono font-bold text-lg">{metric.value}</p>
          {metric.change !== null && (
            <Badge
              variant="secondary"
              className={cn(
                'text-xs mt-1',
                metric.change > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
              )}
            >
              {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}{metric.unit || '%'}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Preset Scenario Buttons
// ============================================================================

interface PresetButtonsProps {
  onApply: (scenario: PresetScenario) => void;
  disabled?: boolean;
}

function PresetButtons({ onApply, disabled }: PresetButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_SCENARIOS.map((scenario) => (
        <Button
          key={scenario.id}
          variant="outline"
          size="sm"
          onClick={() => onApply(scenario)}
          disabled={disabled}
          className="gap-1"
        >
          <span>{scenario.icon}</span>
          <span>{scenario.name}</span>
        </Button>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export interface WhatIfPlaygroundProps {
  className?: string;
}

export function WhatIfPlayground({ className }: WhatIfPlaygroundProps) {
  const { data, updateAssumption } = useBusinessData();
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
  const [isExpanded, setIsExpanded] = useState(true);
  const [showBaseline, setShowBaseline] = useState(true);

  // Extract drivers from business data
  const drivers = useMemo<Driver[]>(() => {
    if (!data?.meta?.drivers) return [];
    return data.meta.drivers as Driver[];
  }, [data]);

  // Build sliders from drivers
  const sliders = useMemo<PlaygroundSlider[]>(() => {
    return drivers.map((driver) => {
      const [min, max] = driver.range;
      const baseValue = (min + max) / 2;
      const currentValue = sliderValues[driver.path] ?? baseValue;

      // Determine step size
      const range = max - min;
      let step = range / 100;
      if (driver.unit?.includes('%')) {
        step = Math.max(0.1, range / 50);
      } else if (range >= 10000) {
        step = Math.round(range / 100);
      }

      // Format display value
      const formatValue = (value: number) => {
        if (driver.unit?.includes('%')) {
          return `${value.toFixed(1)}%`;
        }
        if (driver.unit?.includes('EUR') || driver.unit?.includes('USD')) {
          if (Math.abs(value) >= 1000000) {
            return `€${(value / 1000000).toFixed(2)}M`;
          }
          if (Math.abs(value) >= 1000) {
            return `€${(value / 1000).toFixed(0)}K`;
          }
          return `€${value.toFixed(0)}`;
        }
        return value.toLocaleString();
      };

      return {
        id: driver.path,
        driver,
        currentValue,
        displayValue: formatValue(currentValue),
        step,
        formatValue,
      };
    });
  }, [drivers, sliderValues]);

  // Calculate scenarios
  const { baselineScenario, currentScenario, chartData } = useMemo(() => {
    if (!data) {
      return { baselineScenario: null, currentScenario: null, chartData: [] };
    }

    // Calculate baseline (original data)
    const baseMetrics = calculateBusinessMetrics(data);

    // Calculate current (with slider adjustments)
    // For now, we'll simulate the adjustments
    const periods = data.meta.periods || 60;
    const pricing = data.assumptions?.pricing || {};
    const unitEcon = data.assumptions?.unit_economics || {};
    const costs = data.assumptions?.costs || {};

    const baseRevenue = pricing.monthly_revenue?.value || 50000;
    const growthRate = unitEcon.growth_rate?.value || 0.02;

    // Apply slider adjustments
    let adjustedGrowthRate = growthRate;
    let adjustedRevenue = baseRevenue;
    let costFactor = 1;

    Object.entries(sliderValues).forEach(([path, value]) => {
      const driver = drivers.find(d => d.path === path);
      if (!driver) return;

      const [min, max] = driver.range;
      const baseline = (min + max) / 2;
      const adjustment = baseline > 0 ? value / baseline : 1;

      if (path.includes('growth')) {
        adjustedGrowthRate *= adjustment;
      } else if (path.includes('price') || path.includes('revenue')) {
        adjustedRevenue *= adjustment;
      } else if (path.includes('cost') || path.includes('opex')) {
        costFactor *= adjustment;
      }
    });

    // Generate monthly data
    const generateMonthlyData = (
      revenue: number,
      growth: number,
      costMult: number,
    ): MonthlyScenarioData[] => {
      let cumCashFlow = -50000;
      return Array.from({ length: Math.min(periods, 36) }, (_, i) => {
        const growthFactor = Math.pow(1 + growth, i);
        const monthRevenue = revenue * growthFactor;
        const monthCosts = (monthRevenue * 0.7) * costMult;
        const profit = monthRevenue - monthCosts;
        cumCashFlow += profit;

        return {
          month: i + 1,
          period: `M${i + 1}`,
          revenue: monthRevenue,
          costs: monthCosts,
          profit,
          cashFlow: profit,
          cumulativeCashFlow: cumCashFlow,
        };
      });
    };

    const baseMonthly = generateMonthlyData(baseRevenue, growthRate, 1);
    const currentMonthly = generateMonthlyData(adjustedRevenue, adjustedGrowthRate, costFactor);

    // Calculate outputs
    const sumRevenue = (data: MonthlyScenarioData[]) =>
      data.slice(0, 12).reduce((sum, m) => sum + m.revenue, 0);
    const sumProfit = (data: MonthlyScenarioData[]) =>
      data.slice(0, 12).reduce((sum, m) => sum + m.profit, 0);
    const findRunway = (data: MonthlyScenarioData[]) => {
      const idx = data.findIndex(m => m.cumulativeCashFlow < 0);
      return idx === -1 ? data.length : idx;
    };

    const baseScenario: ScenarioResult = {
      scenarioName: 'Baseline',
      driverValues: {},
      outputs: {
        revenue: sumRevenue(baseMonthly),
        profit: sumProfit(baseMonthly),
        cashFlow: baseMonthly[baseMonthly.length - 1]?.cumulativeCashFlow || 0,
        npv: baseMetrics?.financials?.npv || 0,
        irr: baseMetrics?.financials?.irr || null,
        runway: findRunway(baseMonthly),
      },
      monthlyData: baseMonthly,
    };

    const currScenario: ScenarioResult = {
      scenarioName: 'Current',
      driverValues: sliderValues,
      outputs: {
        revenue: sumRevenue(currentMonthly),
        profit: sumProfit(currentMonthly),
        cashFlow: currentMonthly[currentMonthly.length - 1]?.cumulativeCashFlow || 0,
        npv: (baseMetrics?.financials?.npv || 0) * (adjustedRevenue / baseRevenue) * (1 + adjustedGrowthRate - growthRate) / costFactor,
        irr: baseMetrics?.financials?.irr ? baseMetrics.financials.irr * (adjustedRevenue / baseRevenue) : null,
        runway: findRunway(currentMonthly),
      },
      monthlyData: currentMonthly,
    };

    // Combine for chart
    const chart = currentMonthly.map((current, i) => ({
      period: current.period,
      baseline: baseMonthly[i]?.cumulativeCashFlow || 0,
      current: current.cumulativeCashFlow,
      baselineRevenue: baseMonthly[i]?.revenue || 0,
      currentRevenue: current.revenue,
    }));

    return {
      baselineScenario: baseScenario,
      currentScenario: currScenario,
      chartData: chart,
    };
  }, [data, sliderValues, drivers]);

  // Handlers
  const handleSliderChange = useCallback((path: string, value: number) => {
    setSliderValues(prev => ({ ...prev, [path]: value }));
  }, []);

  const handleReset = useCallback((path: string) => {
    const driver = drivers.find(d => d.path === path);
    if (driver) {
      const [min, max] = driver.range;
      setSliderValues(prev => ({ ...prev, [path]: (min + max) / 2 }));
    }
  }, [drivers]);

  const handleResetAll = useCallback(() => {
    setSliderValues({});
  }, []);

  const handleApplyPreset = useCallback((scenario: PresetScenario) => {
    const newValues: Record<string, number> = {};
    Object.entries(scenario.driverAdjustments).forEach(([path, multiplier]) => {
      const driver = drivers.find(d => d.path === path);
      if (driver) {
        const [min, max] = driver.range;
        const baseline = (min + max) / 2;
        newValues[path] = baseline * multiplier;
      }
    });
    setSliderValues(newValues);
  }, [drivers]);

  const handleApplyChanges = useCallback(() => {
    // Apply slider values to actual data
    Object.entries(sliderValues).forEach(([path, value]) => {
      updateAssumption(path.replace('.value', ''), value);
    });
  }, [sliderValues, updateAssumption]);

  // No drivers = show message
  if (drivers.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            What-If Playground
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Sliders className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No sensitivity drivers configured</p>
            <p className="text-sm mt-1">
              Add drivers to your business case to enable the What-If Playground
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('flex flex-col', className)}>
      {/* Header */}
      <CardHeader className="flex-none border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            What-If Playground
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleResetAll}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset All
            </Button>
            <Button size="sm" onClick={handleApplyChanges}>
              <Sparkles className="h-4 w-4 mr-1" />
              Apply Changes
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Key Metrics */}
      <div className="flex-none p-4 border-b bg-muted/30">
        <KeyMetrics baseline={baselineScenario} current={currentScenario} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sliders Panel */}
        <div className="w-80 border-r flex-none overflow-hidden flex flex-col">
          {/* Presets */}
          <div className="p-4 border-b">
            <p className="text-sm font-medium mb-2">Quick Scenarios</p>
            <PresetButtons onApply={handleApplyPreset} />
          </div>

          {/* Sliders */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {sliders.map((slider) => (
                <WhatIfSlider
                  key={slider.id}
                  slider={slider}
                  onChange={(value) => handleSliderChange(slider.driver.path, value)}
                  onReset={() => handleReset(slider.driver.path)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chart Panel */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="font-medium">Cumulative Cash Flow</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBaseline(!showBaseline)}
            >
              {showBaseline ? 'Hide' : 'Show'} Baseline
            </Button>
          </div>

          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    Math.abs(value) >= 1000
                      ? `€${(value / 1000).toFixed(0)}K`
                      : `€${value}`
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />

                {showBaseline && (
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    name="Baseline"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    animationDuration={DEFAULT_CHART_CONFIG.animationDuration}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="current"
                  name="Current Scenario"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  dot={false}
                  animationDuration={DEFAULT_CHART_CONFIG.animationDuration}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default WhatIfPlayground;
