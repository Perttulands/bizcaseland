import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, AlertTriangle, BarChart3, PieChart as PieChartIcon, Search } from 'lucide-react';
import { useBusinessData } from '@/core/contexts';
import { BusinessData, EvidenceContext } from '@/core/types';
import { useToast } from '@/hooks/use-toast';
import { calculateBusinessMetrics, formatCurrency } from '@/core/engine';
import { setNestedValue } from '@/core/engine';
import { SensitivityAnalysis } from './SensitivityAnalysis';
import { EvidenceTrailPanel } from './EvidenceTrailPanel';

export function CashFlowStatement() {
  const { data: businessData, updateData } = useBusinessData();
  const { toast } = useToast();
  const [hoveredCell, setHoveredCell] = useState<{row: string, month: number} | null>(null);
  const [driverValues, setDriverValues] = useState<{[key: string]: number}>({});
  const baselineRef = useRef(businessData);
  const [evidenceContext, setEvidenceContext] = useState<EvidenceContext | null>(null);
  const [isEvidencePanelOpen, setIsEvidencePanelOpen] = useState(false);

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
  
  if (!businessData) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No Data Available</h3>
            <p className="text-muted-foreground">Please load business case data to view cash flow analysis.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Use centralized calculation engine
  const calculatedMetrics = calculateBusinessMetrics(businessData);
  const monthlyData = calculatedMetrics.monthlyData;
  const currency = businessData.meta?.currency || 'EUR';
  
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

  const openEvidenceTrail = (metricKey: string, metricLabel: string, value: number, month?: number) => {
    setEvidenceContext({
      metricKey,
      metricLabel,
      value,
      month,
      currency: businessData.meta?.currency || 'EUR'
    });
    setIsEvidencePanelOpen(true);
  };

  const formatDecimal = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: '2-digit' 
    });
  };

  const getValueColor = (value: number, rowKey?: string) => {
    // Baseline costs should always be grey (they represent current state, not gains/losses)
    if (rowKey === 'baselineCosts') return 'text-muted-foreground';
    
    if (value > 0) return 'text-financial-success';
    if (value < 0) return 'text-financial-danger';
    return 'text-muted-foreground';
  };

  // Determine business model type
  const isRecurringModel = businessData?.meta?.business_model === 'recurring';
  const isCostSavingsModel = businessData?.meta?.business_model === 'cost_savings';

  const allRows = [
    { label: isCostSavingsModel ? 'Total Benefits' : 'Revenue', key: 'revenue', isTotal: true, category: 'revenue' },
    ...(isCostSavingsModel ? [
      { label: '  Baseline Costs', key: 'baselineCosts', isSubItem: true, category: 'volume', unit: 'currency' },
      { label: '  Cost Savings', key: 'costSavings', isSubItem: true, category: 'volume', unit: 'currency' },
      { label: '  Efficiency Gains', key: 'efficiencyGains', isSubItem: true, category: 'volume', unit: 'currency' }
    ] : [
      { label: '  Sales Volume', key: 'salesVolume', isSubItem: true, category: 'volume', unit: 'units' },
      ...(isRecurringModel ? [
        { label: '  New Customers', key: 'newCustomers', isSubItem: true, category: 'volume', unit: 'units' },
        { label: '  Existing Customers', key: 'existingCustomers', isSubItem: true, category: 'volume', unit: 'units' }
      ] : []),
      { label: '  Unit Price', key: 'unitPrice', isSubItem: true, category: 'price', unit: 'decimal' }
    ]),
    ...(isCostSavingsModel ? [] : [
      { label: 'Cost of Goods Sold', key: 'cogs', category: 'costs' }
    ]),
    { label: isCostSavingsModel ? 'Net Benefits' : 'Gross Profit', key: 'grossProfit', isSubtotal: true, category: 'profit' },
    { label: '', key: 'spacer1', category: 'spacer' },
    { label: 'Sales & Marketing', key: 'salesMarketing', category: 'opex' },
    { 
      label: isRecurringModel ? 'CAC (New Customers Only)' : 'CAC', 
      key: 'totalCAC', 
      isSubItem: true, 
      category: 'costs' 
    },
    { label: 'Research & Development', key: 'rd', category: 'opex' },
    { label: 'General & Administrative', key: 'ga', category: 'opex' },
    { label: 'Total Operating Expenses', key: 'totalOpex', isSubtotal: true, category: 'opex' },
    { label: '', key: 'spacer2', category: 'spacer' },
    { label: 'EBITDA', key: 'ebitda', isTotal: true, category: 'profit' },
    { label: 'CAPEX', key: 'capex', category: 'capex' },
    { label: '', key: 'spacer3', category: 'spacer' },
    { label: isCostSavingsModel ? 'Cumulative Benefit' : 'Net Cash Flow', key: 'netCashFlow', isTotal: true, category: 'cash', cumulative: isCostSavingsModel },
  ];

  // Filter out rows that have no data across all months
  const shouldShowRow = (row: any) => {
    if (row.category === 'spacer') return true; // Always show spacers
    
    // Check if any month has non-zero data for this row
    return monthlyData.some(month => {
      const value = month[row.key as keyof typeof month] as number;
      return typeof value === 'number' && Math.abs(value) > 0.01;
    });
  };

  const rows = allRows.filter(shouldShowRow);

  const getAssumptions = (rowKey: string, month: number) => {
    if (!businessData.assumptions) return null;
    
    const currentMonth = monthlyData[month - 1];
    
    const assumptions = {
      revenue: {
        formula: isCostSavingsModel ? `Cost Savings + Efficiency Gains` : `Sales Volume × Unit Price`,
        components: isCostSavingsModel 
          ? `${formatCurrency(currentMonth?.costSavings || 0)} + ${formatCurrency(currentMonth?.efficiencyGains || 0)}`
          : `${currentMonth?.salesVolume?.toLocaleString()} units × ${formatCurrency(currentMonth?.unitPrice || 0)}`,
        rationale: isCostSavingsModel 
          ? 'Total monetary benefits from cost reduction and efficiency improvements'
          : businessData.assumptions.pricing?.avg_unit_price?.rationale
      },
      baselineCosts: {
        formula: `Sum of monthly baseline costs before automation`,
        components: businessData?.assumptions?.cost_savings?.baseline_costs?.map(cost => 
          `${cost.label}: ${formatCurrency(cost.current_monthly_cost?.value || 0)}`
        ).join(', ') || '',
        rationale: 'Current operational costs that will be reduced through automation and process improvements'
      },
      costSavings: {
        formula: `Baseline Cost × Savings Rate × Implementation Factor`,
        components: businessData?.assumptions?.cost_savings?.baseline_costs?.map(cost => {
          const baseAmount = cost.current_monthly_cost?.value || 0;
          const savingsRate = (cost.savings_potential_pct?.value || 0) / 100;
          return `${cost.label}: ${formatCurrency(baseAmount)} × ${(savingsRate * 100).toFixed(0)}%`;
        }).join(', ') || '',
        rationale: 'Direct cost reductions achieved through process automation and efficiency improvements'
      },
      efficiencyGains: {
        formula: `Improved Value × Value per Unit × Implementation Factor`,
        components: businessData?.assumptions?.cost_savings?.efficiency_gains?.map(gain => {
          const baseline = gain.baseline_value?.value || 0;
          const improved = gain.improved_value?.value || 0;
          const valuePerHour = gain.value_per_unit?.value || 0;
          return `${gain.label}: ${improved} ${gain.metric || 'units'} × ${formatCurrency(valuePerHour)}/unit`;
        }).join(', ') || '',
        rationale: 'Monetary value generated by improved processes and productivity gains'
      },
      salesVolume: {
        formula: `Base Volume × Growth Factor`,
        baseValue: businessData?.assumptions?.customers?.segments?.map(seg => 
          (seg as any).volume?.base_value || 0).reduce((a, b) => a + b, 0),
        growthRate: `${(month * 2)}% cumulative growth`,
        rationale: businessData?.assumptions?.customers?.segments?.map(seg => 
          `${(seg as any).label || seg.label}: ${(seg as any).volume?.rationale || 'Volume assumption'}`).join('; ')
      },
      unitPrice: {
        formula: `Average Unit Price`,
        value: businessData?.assumptions?.pricing?.avg_unit_price?.value,
        rationale: businessData?.assumptions?.pricing?.avg_unit_price?.rationale
      },
      cogs: {
        formula: `Revenue × COGS Rate`,
        rate: businessData?.assumptions?.unit_economics?.cogs_pct?.value ? `${(businessData.assumptions.unit_economics.cogs_pct.value * 100)}%` : undefined,
        rationale: businessData.assumptions.unit_economics?.cogs_pct?.rationale
      },
      salesMarketing: {
        formula: `Base Cost + Monthly Growth`,
        baseCost: businessData?.assumptions?.opex?.[0]?.value?.value,
        rationale: businessData?.assumptions?.opex?.[0]?.value?.rationale
      },
      rd: {
        formula: `Base Cost + Monthly Growth`,
        baseCost: businessData?.assumptions?.opex?.[1]?.value?.value,
        rationale: businessData?.assumptions?.opex?.[1]?.value?.rationale
      },
      ga: {
        formula: `Base Cost + Monthly Growth`,
        baseCost: businessData?.assumptions?.opex?.[2]?.value?.value,
        rationale: businessData?.assumptions?.opex?.[2]?.value?.rationale
      },
      cac: {
        formula: `Customer Acquisition Cost per Unit`,
        value: businessData?.assumptions?.unit_economics?.cac?.value,
        rationale: businessData?.assumptions?.unit_economics?.cac?.rationale
      },
      totalCAC: {
        formula: isRecurringModel ? `New Customers × CAC` : `Sales Volume × CAC`,
        components: isRecurringModel 
          ? `${currentMonth?.newCustomers?.toLocaleString()} new customers × ${formatDecimal(currentMonth?.cac || 0)}`
          : `${currentMonth?.salesVolume?.toLocaleString()} units × ${formatDecimal(currentMonth?.cac || 0)}`,
        rationale: `CAC Value: ${formatDecimal(businessData?.assumptions?.unit_economics?.cac?.value || 0)} per ${isRecurringModel ? 'customer' : 'unit'}. ${isRecurringModel 
          ? 'Applied only to new customer acquisitions in recurring models.' 
          : 'Applied to all unit sales in transactional models.'} ${businessData?.assumptions?.unit_economics?.cac?.rationale || ''}`
      },
      ebitda: {
        formula: isCostSavingsModel ? `Total Benefits + Total Operating Expenses` : `Gross Profit + Total Operating Expenses`,
        rationale: businessData?.meta?.description
      },
      capex: {
        formula: `Initial Investment + Periodic Investments`,
        rationale: businessData?.assumptions?.capex?.[0]?.name
      },
      netCashFlow: {
        formula: `EBITDA + CAPEX`,
        rationale: businessData?.meta?.description
      }
    };
    
    return assumptions[rowKey as keyof typeof assumptions];
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>{businessData.meta?.title || 'Profit & Loss Statement'}</span>
          </CardTitle>
          {businessData.meta?.description && (
            <p className="text-sm text-muted-foreground">
              {businessData.meta.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Monthly cash flow projection with full P&L structure
          </p>
          <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-1">
            <Search className="h-3 w-3" />
            Double-click any cell to view its evidence trail
          </p>
        </CardHeader>
      </Card>

      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto max-w-full">
            {/* reduce total width per month from 100px -> 80px to be more compact */}
            <div className="min-w-max" style={{ width: `${180 + (monthlyData.length * 80)}px` }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="sticky left-0 bg-gradient-card z-10 px-3 py-2 text-left font-semibold min-w-[160px]">
                      Line Item
                    </th>
                     {monthlyData.map((month) => (
                       <th key={month.month} className="px-2 py-2 text-center font-medium min-w-[80px] border-l border-border">
                         <span className="text-xs font-medium">{month.month}</span>
                       </th>
                     ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    if (row.category === 'spacer') {
                      return (
                        <tr key={index}>
                          <td colSpan={25} className="h-3"></td>
                        </tr>
                      );
                    }

                     const rowClasses = [
                       'border-b border-border/50',
                       row.isTotal && 'bg-muted/30 font-semibold',
                       row.isSubtotal && 'bg-muted/20 font-medium',
                       row.isSubItem && 'bg-muted/10 text-sm',
                     ].filter(Boolean).join(' ');

                    // Check if this row is in the bottom half for tooltip positioning
                    const isBottomHalf = index > rows.length / 2;

                    return (
                      <tr key={index} className={rowClasses}>
                        <td className="sticky left-0 bg-gradient-card z-10 px-3 py-1 font-medium border-r border-border">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{row.label}</span>
                            {row.category === 'revenue' && <TrendingUp className="h-3 w-3 text-financial-success" />}
                            {row.category === 'costs' && <TrendingDown className="h-3 w-3 text-financial-danger" />}
                            {row.category === 'profit' && <DollarSign className="h-3 w-3 text-financial-primary" />}
                          </div>
                        </td>
                        {monthlyData.map((month, monthIndex) => {
                          let value = month[row.key as keyof typeof month] as number;
                          
                          // Calculate cumulative value if this row requires it
                          if (row.cumulative && typeof value === 'number') {
                            value = monthlyData.slice(0, monthIndex + 1)
                              .reduce((sum, m) => sum + (m[row.key as keyof typeof m] as number || 0), 0);
                          }
                          
                          const assumptions = getAssumptions(row.key, month.month);
                          
                          return (
                            <td
                              key={month.month}
                              className="px-2 py-1 text-center border-l border-border relative cursor-pointer hover:bg-muted/30 transition-colors"
                              onMouseEnter={() => setHoveredCell({row: row.key, month: month.month})}
                              onMouseLeave={() => setHoveredCell(null)}
                              onDoubleClick={() => {
                                if (typeof value === 'number') {
                                  openEvidenceTrail(row.key, row.label.trim(), value, month.month);
                                }
                              }}
                              title="Double-click to view evidence trail"
                            >
                             {typeof value === 'number' ? (
                                 <span className={`font-mono text-xs ${getValueColor(value, row.key)}`}>
                                   {row.unit === 'units' ? value.toLocaleString() : 
                                    row.unit === 'decimal' ? formatDecimal(value) : 
                                    row.unit === 'currency' ? formatCurrency(value, currency) :
                                    formatCurrency(value, currency)}
                                 </span>
                               ) : (
                                 <span className="text-muted-foreground text-xs">-</span>
                               )}
                               
                               {/* Tooltip - position above for bottom half, below for top half */}
                               {hoveredCell?.row === row.key && hoveredCell?.month === month.month && assumptions && (
                                 <div className={`absolute z-[100] bg-card border border-border rounded-lg p-3 shadow-elevation min-w-[250px] left-1/2 transform -translate-x-1/2 ${isBottomHalf ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                                   <div className="text-sm space-y-2">
                                     <div className="font-semibold text-foreground">{row.label} - Month {month.month}</div>
                                     {assumptions.formula && (
                                       <div>
                                         <span className="text-muted-foreground">Formula:</span>
                                         <div className="font-mono text-xs bg-muted/50 p-1 rounded">{assumptions.formula}</div>
                                       </div>
                                     )}
                                      {'rate' in assumptions && assumptions.rate && (
                                        <div>
                                          <span className="text-muted-foreground">Rate:</span> {String(assumptions.rate)}
                                        </div>
                                      )}
                                      {'rationale' in assumptions && assumptions.rationale && (
                                        <div>
                                          <span className="text-muted-foreground">Rationale:</span>
                                          <div className="text-xs">{String(assumptions.rationale)}</div>
                                        </div>
                                      )}
                                   </div>
                                 </div>
                               )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Card
          className={`shadow-card cursor-pointer hover:ring-2 hover:ring-white/30 transition-all group ${monthlyData.reduce((s, m) => s + m.revenue, 0) >= 0 ? 'bg-gradient-success' : 'bg-gradient-danger'}`}
          onClick={() => openEvidenceTrail(
            'totalRevenue',
            isCostSavingsModel ? 'Total Benefits' : 'Total Revenue',
            monthlyData.reduce((sum, m) => sum + m.revenue, 0)
          )}
        >
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-sm text-white/80 mb-1 flex items-center justify-center gap-1">
                {isCostSavingsModel ? 'Total Benefits' : 'Total Revenue'}
                <Search className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-xl font-extrabold text-white">
                {formatCurrency(monthlyData.reduce((sum, m) => sum + m.revenue, 0), currency)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`shadow-card cursor-pointer hover:ring-2 hover:ring-white/30 transition-all group ${calculatedMetrics.npv >= 0 ? 'bg-gradient-success' : 'bg-gradient-danger'}`}
          onClick={() => openEvidenceTrail('npv', 'Net Present Value', calculatedMetrics.npv)}
        >
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-sm text-white/80 mb-1 flex items-center justify-center gap-1">
                Net Present Value
                <Search className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-xl font-extrabold text-white">
                {formatCurrency(calculatedMetrics.npv, currency)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`shadow-card cursor-pointer hover:ring-2 hover:ring-white/30 transition-all group ${calculatedMetrics.netProfit >= 0 ? 'bg-gradient-success' : 'bg-gradient-danger'}`}
          onClick={() => openEvidenceTrail('netProfit', 'Net Profit', calculatedMetrics.netProfit)}
        >
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-sm text-white/80 mb-1 flex items-center justify-center gap-1">
                Net Profit
                <Search className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-xl font-extrabold text-white">
                {formatCurrency(calculatedMetrics.netProfit, currency)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`shadow-card cursor-pointer hover:ring-2 hover:ring-white/30 transition-all group ${calculatedMetrics.breakEvenMonth ? 'bg-gradient-success' : 'bg-gradient-danger'}`}
          onClick={() => openEvidenceTrail('breakEvenMonth', 'Break-even Point', calculatedMetrics.breakEvenMonth)}
        >
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-sm text-white/80 mb-1 flex items-center justify-center gap-1">
                Break-even Point
                <Search className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-xl font-extrabold text-white">
                {calculatedMetrics.breakEvenMonth > 0
                  ? `Month ${calculatedMetrics.breakEvenMonth}`
                  : 'Not Achieved'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Three Charts Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Benefits & Operating Expense */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-financial-primary" />
              <span>{isCostSavingsModel ? 'Benefits & Operating Expense' : 'Revenue & Operating Expense'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    interval={Math.floor(monthlyData.length / 10)}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-md">
                            <p className="font-semibold">{`Month ${label}`}</p>
                            {payload.map((entry, index) => (
                              <p key={index} style={{ color: entry.color }}>
                                {`${entry.name}: ${formatCurrency(entry.value as number)}`}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--financial-primary))" 
                    strokeWidth={3}
                    dot={false}
                    name={isCostSavingsModel ? "Total Benefits" : "Revenue"}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalOpex" 
                    stroke="hsl(var(--financial-danger))" 
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 5"
                    name="Operating Expense"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2. Cost Savings Breakdown or Sales Volume */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-financial-success" />
              <span>{isCostSavingsModel ? 'Cost Savings & Efficiency Gains' : 'Sales Volume'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {isCostSavingsModel ? (
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      interval={Math.floor(monthlyData.length / 10)}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-card border border-border rounded-lg p-3 shadow-md">
                              <p className="font-semibold">{`Month ${label}`}</p>
                              {payload.map((entry, index) => (
                                <p key={index} style={{ color: entry.color }}>
                                  {`${entry.name}: ${formatCurrency(entry.value as number)}`}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="costSavings" 
                      stroke="hsl(var(--financial-success))" 
                      strokeWidth={3}
                      dot={false}
                      name="Cost Savings"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="efficiencyGains" 
                      stroke="hsl(var(--financial-primary))" 
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="3 3"
                      name="Efficiency Gains"
                    />
                  </LineChart>
                ) : (
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      interval={Math.floor(monthlyData.length / 10)}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-card border border-border rounded-lg p-3 shadow-md">
                              <p className="font-semibold">{`Month ${label}`}</p>
                              <p style={{ color: payload[0].color }}>
                                {`Sales Volume: ${(payload[0].value as number).toLocaleString()} units`}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="salesVolume" 
                      stroke="hsl(var(--financial-success))" 
                      strokeWidth={3}
                      dot={false}
                      name="Sales Volume"
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3. Net Cash Flow Bar Chart */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-financial-success" />
              <span>{isCostSavingsModel ? 'Cumulative Benefit' : 'Net Cash Flow'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    interval={Math.floor(monthlyData.length / 10)}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const value = payload[0].value as number;
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-md">
                            <p className="font-semibold">{`Month ${label}`}</p>
                            <p style={{ color: value >= 0 ? 'hsl(var(--financial-success))' : 'hsl(var(--financial-danger))' }}>
                              {`Net Cash Flow: ${formatCurrency(value)}`}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="netCashFlow" 
                    fill="hsl(var(--financial-primary))"
                    name={isCostSavingsModel ? "Cumulative Benefit" : "Net Cash Flow"}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sensitivity Analysis */}
      <SensitivityAnalysis
        drivers={drivers}
        businessData={businessData}
        baselineRef={baselineRef}
        driverValues={driverValues}
        onDriverChange={handleDriverChange}
      />

      {/* Evidence Trail Panel */}
      <EvidenceTrailPanel
        isOpen={isEvidencePanelOpen}
        onClose={() => setIsEvidencePanelOpen(false)}
        context={evidenceContext}
      />
    </div>
  );
}