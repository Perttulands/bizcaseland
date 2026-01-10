import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  LineChart, 
  Line,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, 
  AlertCircle, 
  Package, 
  DollarSign, 
  Target, 
  Activity,
  BarChart3,
  Users,
  Percent
} from 'lucide-react';
import { useBusinessData } from '@/core/contexts';
import { setNestedValue } from '@/core/engine';
import { SensitivityAnalysis } from './SensitivityAnalysis';
import { 
  calculateBusinessMetrics, 
  formatCurrency, 
  calculateDynamicSegmentVolume, 
  calculateDynamicUnitPrice 
} from '@/core/engine';

interface SegmentYearlyData {
  year: number;
  yearLabel: string;
  [key: string]: number | string;
}

interface SegmentMonthlyData {
  month: number;
  monthLabel: string;
  [key: string]: number | string;
}

interface SegmentSummary {
  id: string;
  label: string;
  totalVolume: number;
  totalValue: number;
  avgMonthlyVolume: number;
  avgPrice: number;
  growthPattern: string;
  percentOfTotal: number;
}

export function VolumeAnalysisTab() {
  const { data: businessData, updateData } = useBusinessData();
  const [viewMode, setViewMode] = useState<'stacked' | 'grouped' | 'line'>('stacked');
  const [timeScale, setTimeScale] = useState<'yearly' | 'monthly'>('yearly');
  const [driverValues, setDriverValues] = useState<{[key: string]: number}>({});
  const baselineRef = useRef(businessData);

  // Get drivers before early return
  const drivers = businessData?.drivers || [];

  // Update baseline when a fresh businessData is loaded and there are no active modifications
  useEffect(() => {
    if (Object.keys(driverValues).length === 0) {
      baselineRef.current = businessData;
    }
  }, [businessData, driverValues]);

  // Listen for global data refresh events
  useEffect(() => {
    const handleDataRefreshed = () => {
      setDriverValues({});
      baselineRef.current = businessData;
    };
    window.addEventListener('datarefreshed', handleDataRefreshed);
    return () => window.removeEventListener('datarefreshed', handleDataRefreshed);
  }, [businessData]);

  // Handle driver changes with immediate updates
  const handleDriverChange = (driverKey: string, value: number) => {
    setDriverValues(prev => {
      const newValues = {
        ...prev,
        [driverKey]: value
      };
      
      // Apply changes immediately to global data
      let modified = businessData;
      for (const driver of drivers) {
        const currentValue = newValues[driver.key];
        if (currentValue !== undefined) {
          modified = setNestedValue(modified, driver.path, currentValue);
        }
      }
      updateData(modified);
      
      return newValues;
    });
  };

  if (!businessData) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No Data Available</h3>
            <p className="text-muted-foreground">Please load business case data to view volume analysis.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create consistent color mapping by segment ID
  const segmentColorMap = useMemo(() => {
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    const colorMap: {[key: string]: string} = {};
    const segments = businessData?.assumptions?.customers?.segments || [];
    segments.forEach((segment, index) => {
      colorMap[segment.id] = COLORS[index % COLORS.length];
    });
    return colorMap;
  }, [businessData?.assumptions?.customers?.segments]);

  // Calculate metrics using modified data
  const calculatedMetrics = useMemo(() => {
    if (!businessData) return null;
    return calculateBusinessMetrics(businessData);
  }, [businessData]);

  // Process segment data for visualization
  const { 
    yearlyVolumeData, 
    yearlyValueData, 
    monthlyVolumeData,
    monthlyValueData,
    segmentSummaries 
  } = useMemo(() => {
    if (!businessData || !calculatedMetrics) {
      return { 
        yearlyVolumeData: [], 
        yearlyValueData: [], 
        monthlyVolumeData: [],
        monthlyValueData: [],
        segmentSummaries: [] 
      };
    }

    const segments = businessData.assumptions?.customers?.segments || [];
    const periods = businessData.meta.periods;
    const numYears = Math.ceil(periods / 12);
    const currency = businessData.meta.currency;

    // Initialize yearly data arrays
    const volumeByYear: SegmentYearlyData[] = [];
    const valueByYear: SegmentYearlyData[] = [];

    for (let year = 1; year <= numYears; year++) {
      const volumeEntry: SegmentYearlyData = { year, yearLabel: `Year ${year}` };
      const valueEntry: SegmentYearlyData = { year, yearLabel: `Year ${year}` };
      
      segments.forEach(segment => {
        volumeEntry[`${segment.id}_volume`] = 0;
        volumeEntry[`${segment.id}_label`] = segment.label || segment.id;
        valueEntry[`${segment.id}_value`] = 0;
        valueEntry[`${segment.id}_label`] = segment.label || segment.id;
      });

      volumeByYear.push(volumeEntry);
      valueByYear.push(valueEntry);
    }

    // Initialize monthly data arrays (limited to first 24 months for readability)
    const monthsToShow = Math.min(periods, 24);
    const volumeByMonth: SegmentMonthlyData[] = [];
    const valueByMonth: SegmentMonthlyData[] = [];

    for (let month = 0; month < monthsToShow; month++) {
      const volumeEntry: SegmentMonthlyData = { 
        month: month + 1, 
        monthLabel: `M${month + 1}` 
      };
      const valueEntry: SegmentMonthlyData = { 
        month: month + 1, 
        monthLabel: `M${month + 1}` 
      };
      
      segments.forEach(segment => {
        volumeEntry[`${segment.id}_volume`] = 0;
        valueEntry[`${segment.id}_value`] = 0;
      });

      volumeByMonth.push(volumeEntry);
      valueByMonth.push(valueEntry);
    }

    // Aggregate data
    let totalVolumeAllSegments = 0;
    let totalValueAllSegments = 0;

    for (let monthIndex = 0; monthIndex < periods; monthIndex++) {
      const yearIndex = Math.floor(monthIndex / 12);
      const price = calculateDynamicUnitPrice(businessData, monthIndex);

      segments.forEach(segment => {
        const volume = calculateDynamicSegmentVolume(segment, monthIndex, businessData);
        const value = volume * price;

        // Add to yearly totals
        if (yearIndex < volumeByYear.length) {
          volumeByYear[yearIndex][`${segment.id}_volume`] = 
            (volumeByYear[yearIndex][`${segment.id}_volume`] as number) + volume;
          valueByYear[yearIndex][`${segment.id}_value`] = 
            (valueByYear[yearIndex][`${segment.id}_value`] as number) + value;
        }

        // Add to monthly totals (first 24 months only)
        if (monthIndex < monthsToShow) {
          volumeByMonth[monthIndex][`${segment.id}_volume`] = volume;
          valueByMonth[monthIndex][`${segment.id}_value`] = value;
        }

        totalVolumeAllSegments += volume;
        totalValueAllSegments += value;
      });
    }

    // Calculate segment summaries
    const summaries: SegmentSummary[] = segments.map((segment, index) => {
      let totalVolume = 0;
      let totalValue = 0;

      for (let monthIndex = 0; monthIndex < periods; monthIndex++) {
        const volume = calculateDynamicSegmentVolume(segment, monthIndex, businessData);
        const price = calculateDynamicUnitPrice(businessData, monthIndex);
        totalVolume += volume;
        totalValue += volume * price;
      }

      const avgMonthlyVolume = totalVolume / periods;
      const avgPrice = totalVolume > 0 ? totalValue / totalVolume : 0;
      const percentOfTotal = totalVolumeAllSegments > 0 
        ? (totalVolume / totalVolumeAllSegments) * 100 
        : 0;

      // Determine growth pattern
      let growthPattern = 'Custom';
      if (segment.volume?.pattern_type === 'geom_growth' || 
          segment.volume?.pattern_type === 'geometric_growth') {
        growthPattern = 'Geometric';
      } else if (segment.volume?.pattern_type === 'linear_growth') {
        growthPattern = 'Linear';
      } else if (segment.volume?.pattern_type === 'seasonal') {
        growthPattern = 'Seasonal';
      } else if (segment.volume?.pattern_type === 'time_series') {
        growthPattern = 'Time Series';
      }

      return {
        id: segment.id,
        label: segment.label || segment.id,
        totalVolume: Math.round(totalVolume),
        totalValue: Math.round(totalValue),
        avgMonthlyVolume: Math.round(avgMonthlyVolume),
        avgPrice,
        growthPattern,
        percentOfTotal,
        color: segmentColorMap[segment.id] || '#3b82f6',
      };
    });

    return {
      yearlyVolumeData: volumeByYear,
      yearlyValueData: valueByYear,
      monthlyVolumeData: volumeByMonth,
      monthlyValueData: valueByMonth,
      segmentSummaries: summaries,
    };
  }, [businessData, calculatedMetrics, segmentColorMap]);

  if (!businessData) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No Data Available</h3>
            <p className="text-muted-foreground">Please load business case data to view volume analysis.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const segments = businessData.assumptions?.customers?.segments || [];
  const currency = businessData.meta?.currency || 'EUR';
  const isCostSavings = businessData.meta?.business_model === 'cost_savings';

  // Shorthand currency formatter for chart axes
  const formatCurrencyShort = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    const symbol = currency === 'USD' ? '$' : '€';
    
    if (absValue >= 1_000_000_000) {
      return `${sign}${symbol}${(absValue / 1_000_000_000).toFixed(1)}B`;
    } else if (absValue >= 1_000_000) {
      return `${sign}${symbol}${(absValue / 1_000_000).toFixed(1)}M`;
    } else if (absValue >= 1_000) {
      return `${sign}${symbol}${(absValue / 1_000).toFixed(0)}K`;
    }
    return `${sign}${symbol}${absValue.toFixed(0)}`;
  };

  // If no segments, show message
  if (segments.length === 0) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Package className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No Segments Defined</h3>
            <p className="text-muted-foreground">
              {isCostSavings 
                ? 'This cost savings model does not use customer segments.'
                : 'Please add customer segments to your business case data to view volume analysis.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Select data based on time scale
  const volumeData = timeScale === 'yearly' ? yearlyVolumeData : monthlyVolumeData;
  const valueData = timeScale === 'yearly' ? yearlyValueData : monthlyValueData;
  const xAxisKey = timeScale === 'yearly' ? 'yearLabel' : 'monthLabel';

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Volume Analysis by Segment
                {Object.keys(driverValues).length > 0 && (
                  <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                    Modified
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Deep dive into segment performance, volume trends, and revenue contribution
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={timeScale === 'yearly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeScale('yearly')}
              >
                Yearly
              </Button>
              <Button
                variant={timeScale === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeScale('monthly')}
              >
                Monthly
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Segment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segmentSummaries.map((summary) => (
          <Card key={summary.id} className="bg-gradient-card shadow-card border-l-4" style={{ borderLeftColor: summary.color }}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: summary.color }}
                    />
                    {summary.label}
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      style={{ 
                        backgroundColor: `${summary.color}20`, 
                        color: summary.color,
                        borderColor: `${summary.color}40`
                      }}
                    >
                      {summary.growthPattern}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {summary.percentOfTotal.toFixed(1)}% of total
                    </Badge>
                  </div>
                </div>
                <Target className="h-5 w-5" style={{ color: summary.color, opacity: 0.6 }} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Volume</span>
                <span className="font-semibold">{summary.totalVolume.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Value</span>
                <span className="font-semibold">{formatCurrency(summary.totalValue, currency)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Avg Monthly</span>
                <span className="font-semibold">{summary.avgMonthlyVolume.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Avg Price</span>
                <span className="font-semibold">{formatCurrency(summary.avgPrice, currency)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Volume Analysis Tabs */}
      <Tabs defaultValue="volume" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="volume">
            <Package className="h-4 w-4 mr-2" />
            Volume
          </TabsTrigger>
          <TabsTrigger value="value">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <BarChart3 className="h-4 w-4 mr-2" />
            Compare
          </TabsTrigger>
        </TabsList>

        {/* Volume Tab */}
        <TabsContent value="volume" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Sales Volume by Segment
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {timeScale === 'yearly' ? 'Year-by-year' : 'Month-by-month'} volume comparison across all segments
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'stacked' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('stacked')}
                  >
                    Stacked
                  </Button>
                  <Button
                    variant={viewMode === 'grouped' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grouped')}
                  >
                    Grouped
                  </Button>
                  <Button
                    variant={viewMode === 'line' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('line')}
                  >
                    Trend
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  {viewMode === 'line' ? (
                    <LineChart data={volumeData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey={xAxisKey}
                        className="text-xs"
                      />
                      <YAxis 
                        label={{ value: 'Volume (Units)', angle: -90, position: 'insideLeft' }}
                        className="text-xs"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [value.toLocaleString(), '']}
                      />
                      <Legend />
                      {segments.map((segment, index) => (
                        <Line
                          key={segment.id}
                          type="monotone"
                          dataKey={`${segment.id}_volume`}
                          name={segment.label || segment.id}
                          stroke={segmentColorMap[segment.id] || '#3b82f6'}
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  ) : (
                    <BarChart data={volumeData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey={xAxisKey}
                        className="text-xs"
                      />
                      <YAxis 
                        label={{ value: 'Volume (Units)', angle: -90, position: 'insideLeft' }}
                        className="text-xs"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [value.toLocaleString(), '']}
                      />
                      <Legend />
                      {segments.map((segment, index) => (
                        <Bar
                          key={segment.id}
                          dataKey={`${segment.id}_volume`}
                          name={segment.label || segment.id}
                          fill={segmentColorMap[segment.id] || '#3b82f6'}
                          stackId={viewMode === 'stacked' ? 'volume' : undefined}
                        />
                      ))}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue/Value Tab */}
        <TabsContent value="value" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Revenue by Segment
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {timeScale === 'yearly' ? 'Year-by-year' : 'Month-by-month'} revenue contribution from each segment
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'stacked' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('stacked')}
                  >
                    Stacked
                  </Button>
                  <Button
                    variant={viewMode === 'grouped' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grouped')}
                  >
                    Grouped
                  </Button>
                  <Button
                    variant={viewMode === 'line' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('line')}
                  >
                    Trend
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  {viewMode === 'line' ? (
                    <AreaChart data={valueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey={xAxisKey}
                        className="text-xs"
                      />
                      <YAxis 
                        label={{ value: `Revenue (${currency})`, angle: -90, position: 'insideLeft' }}
                        className="text-xs"
                        tickFormatter={formatCurrencyShort}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [formatCurrency(value, currency), '']}
                      />
                      <Legend />
                      {segments.map((segment, index) => (
                        <Area
                          key={segment.id}
                          type="monotone"
                          dataKey={`${segment.id}_value`}
                          name={segment.label || segment.id}
                          stroke={segmentColorMap[segment.id] || '#3b82f6'}
                          fill={segmentColorMap[segment.id] || '#3b82f6'}
                          fillOpacity={0.6}
                          stackId="1"
                        />
                      ))}
                    </AreaChart>
                  ) : (
                    <BarChart data={valueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey={xAxisKey}
                        className="text-xs"
                      />
                      <YAxis 
                        label={{ value: `Revenue (${currency})`, angle: -90, position: 'insideLeft' }}
                        className="text-xs"
                        tickFormatter={formatCurrencyShort}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [formatCurrency(value, currency), '']}
                      />
                      <Legend />
                      {segments.map((segment, index) => (
                        <Bar
                          key={segment.id}
                          dataKey={`${segment.id}_value`}
                          name={segment.label || segment.id}
                          fill={segmentColorMap[segment.id] || '#3b82f6'}
                          stackId={viewMode === 'stacked' ? 'value' : undefined}
                        />
                      ))}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Segment Share - Volume */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Market Share by Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {segmentSummaries
                    .sort((a, b) => b.totalVolume - a.totalVolume)
                    .map((summary) => (
                      <div key={summary.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{summary.label}</span>
                          <span className="text-muted-foreground">
                            {summary.percentOfTotal.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${summary.percentOfTotal}%`,
                              backgroundColor: summary.color,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{summary.totalVolume.toLocaleString()} units</span>
                          <span>{formatCurrency(summary.totalValue, currency)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Segment Metrics Table */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Segment Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {segmentSummaries.map((summary) => (
                    <div 
                      key={summary.id} 
                      className="flex items-center justify-between p-3 rounded-lg border"
                      style={{ borderLeftWidth: '3px', borderLeftColor: summary.color }}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{summary.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {summary.growthPattern} Growth
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {summary.avgMonthlyVolume.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          avg/month
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side-by-side comparison */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Volume vs Revenue Comparison
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Direct comparison of volume and revenue contribution by segment
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey={xAxisKey}
                      className="text-xs"
                    />
                    <YAxis 
                      yAxisId="left"
                      label={{ value: 'Volume', angle: -90, position: 'insideLeft' }}
                      className="text-xs"
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      label={{ value: 'Revenue', angle: 90, position: 'insideRight' }}
                      className="text-xs"
                      tickFormatter={formatCurrencyShort}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    {segments.slice(0, 2).map((segment, index) => (
                      <React.Fragment key={segment.id}>
                        <Bar
                          yAxisId="left"
                          dataKey={`${segment.id}_volume`}
                          name={`${segment.label || segment.id} (Volume)`}
                          fill={segmentColorMap[segment.id] || '#3b82f6'}
                          opacity={0.7}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey={`${segment.id}_value`}
                          name={`${segment.label || segment.id} (Revenue)`}
                          stroke={segmentColorMap[segment.id] || '#3b82f6'}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </React.Fragment>
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              {segments.length > 2 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Showing first 2 segments for clarity. Switch to other tabs to view all segments.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sensitivity Drivers */}
      <SensitivityAnalysis
        drivers={drivers}
        businessData={businessData}
        baselineRef={baselineRef}
        driverValues={driverValues}
        onDriverChange={handleDriverChange}
      />

      {/* Segment Configuration Details */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Segment Configuration
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Detailed setup and rationale for each customer segment
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {segments.map((segment, index) => (
              <div 
                key={segment.id}
                className="p-4 bg-muted/30 rounded-lg border-l-4"
                style={{ borderLeftWidth: '4px', borderLeftColor: segmentColorMap[segment.id] }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: segmentColorMap[segment.id] }}
                  />
                  <h4 className="font-semibold text-lg">{segment.label || segment.id}</h4>
                  <Badge variant="outline" className="ml-auto">
                    {segmentSummaries[index]?.percentOfTotal.toFixed(1)}% of volume
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground font-medium">Segment ID:</span>
                    <div className="font-mono mt-1">{segment.id}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Growth Pattern:</span>
                    <div className="mt-1">
                      {segmentSummaries.find(s => s.id === segment.id)?.growthPattern || 'N/A'}
                    </div>
                  </div>
                  {segment.volume?.base_value && (
                    <div>
                      <span className="text-muted-foreground font-medium">Base Value:</span>
                      <div className="mt-1">{segment.volume.base_value.toLocaleString()}</div>
                    </div>
                  )}
                  {segment.volume?.growth_rate !== undefined && (
                    <div>
                      <span className="text-muted-foreground font-medium">Growth Rate:</span>
                      <div className="mt-1">
                        {segment.volume.pattern_type === 'linear_growth' 
                          ? `+${segment.volume.growth_rate}/period`
                          : `${(segment.volume.growth_rate * 100).toFixed(1)}%`
                        }
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground font-medium">Total Volume:</span>
                    <div className="mt-1 font-semibold">
                      {segmentSummaries.find(s => s.id === segment.id)?.totalVolume.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Total Revenue:</span>
                    <div className="mt-1 font-semibold">
                      {formatCurrency(
                        segmentSummaries.find(s => s.id === segment.id)?.totalValue || 0, 
                        currency
                      )}
                    </div>
                  </div>
                </div>
                {segment.rationale && (
                  <div className="mt-4 pt-4 border-t">
                    <span className="text-muted-foreground font-medium text-sm">Rationale:</span>
                    <p className="mt-1 text-sm text-muted-foreground italic leading-relaxed">
                      {segment.rationale}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
