import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, BarChart3, Users, DollarSign, Activity, PieChart as PieChartIcon } from 'lucide-react';
import { useBusinessData } from '@/core/contexts';
import { BusinessData } from '@/core/types';
import { calculateBusinessMetrics } from '@/core/engine';

interface DataVisualizationProps {
  data: BusinessData;
}

export function DataVisualization({ data }: DataVisualizationProps) {
  const { data: contextData } = useBusinessData();
  
  // Use context data if available, otherwise use prop data
  const businessData = contextData || data;
  
  // Calculate metrics using the centralized calculation engine
  const calculatedMetrics = useMemo(() => {
    return calculateBusinessMetrics(businessData);
  }, [businessData]);

  // Get the active growth model being used
  const getActiveGrowthModel = () => {
    const segments = businessData?.assumptions?.customers?.segments || [];
    for (const segment of segments) {
      if (segment.volume?.pattern_type) {
        return segment.volume.pattern_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      }
    }
    return null;
  };

  const activeGrowthModel = getActiveGrowthModel();
  
  // Generate data from business assumptions using calculations
  const monthlyData = useMemo(() => {
    if (!businessData.assumptions) {
      return Array.from({ length: 60 }, (_, i) => ({
        month: i + 1,
        period: `M${i + 1}`,
        revenue: Math.floor(5000 + i * 2000 + Math.random() * 1000),
        customers: Math.floor(50 + i * 15 + Math.random() * 10),
        cashFlow: Math.floor(-10000 + i * 1500 + Math.random() * 500),
        ebitda: Math.floor(-5000 + i * 1200 + Math.random() * 400),
        cumulativeCashFlow: Math.floor(-50000 + i * 2000),
        salesVolume: Math.floor(100 + i * 20),
        operatingExpense: Math.floor(15000 + i * 500),
        salesMarketing: Math.floor(5000 + i * 200),
        rd: Math.floor(3000 + i * 100),
        ga: Math.floor(4000 + i * 150),
        capex: i === 0 ? 20000 : 0
      }));
    }
    
    const pricing = businessData.assumptions.pricing || {};
    const unitEconomics = businessData.assumptions.unit_economics || {};
    const costs = businessData.assumptions.costs || {};
    
    const baseRevenue = pricing.monthly_revenue?.value || 50000;
    const growthRate = unitEconomics.growth_rate?.value || 0.02;
    const customerGrowthRate = 0.15;
    
    let cumulativeCashFlow = -50000;
    
    return Array.from({ length: businessData.meta.periods || 60 }, (_, i) => {
      const growthFactor = Math.pow(1 + growthRate, i);
      const seasonality = 1 + Math.sin((i / 12) * 2 * Math.PI) * 0.1;
      
      const revenue = Math.floor(baseRevenue * growthFactor * seasonality);
      const customers = Math.floor(50 + i * customerGrowthRate * 15);
      const salesVolume = Math.floor(customers * 2); // 2 units per customer
      
      const salesMarketing = Math.floor((costs.sales_marketing_percent?.value || 0.15) * revenue);
      const rd = Math.floor((costs.rd_percent?.value || 0.08) * revenue);
      const ga = Math.floor((costs.ga_percent?.value || 0.12) * revenue);
      const operatingExpense = salesMarketing + rd + ga;
      
      const cashFlow = Math.floor(revenue * 0.3 - operatingExpense);
      const ebitda = Math.floor(revenue * 0.25);
      
      cumulativeCashFlow += cashFlow;
      
      return {
        month: i + 1,
        period: `M${i + 1}`,
        revenue,
        customers,
        salesVolume,
        operatingExpense,
        salesMarketing,
        rd,
        ga,
        capex: i === 0 ? 20000 : 0, // One-off CAPEX in first month
        cashFlow,
        ebitda,
        cumulativeCashFlow: Math.floor(cumulativeCashFlow)
      };
    });
  }, [businessData]);

  // Cost structure data for pie chart
  const costStructureData = useMemo(() => {
    const totalSalesMarketing = monthlyData.reduce((sum, m) => sum + m.salesMarketing, 0);
    const totalRD = monthlyData.reduce((sum, m) => sum + m.rd, 0);
    const totalGA = monthlyData.reduce((sum, m) => sum + m.ga, 0);
    const totalCapex = monthlyData.reduce((sum, m) => sum + m.capex, 0);
    
    return [
      { name: 'Sales & Marketing', value: totalSalesMarketing, color: 'hsl(var(--financial-primary))' },
      { name: 'R&D', value: totalRD, color: 'hsl(var(--financial-success))' },
      { name: 'G&A', value: totalGA, color: 'hsl(var(--financial-warning))' },
      { name: 'CAPEX', value: totalCapex, color: 'hsl(var(--financial-danger))' }
    ];
  }, [monthlyData]);

  const yearlyData = Array.from({ length: 5 }, (_, i) => ({
    year: `Year ${i + 1}`,
    revenue: Math.floor(120000 + i * 80000),
    costs: Math.floor(80000 + i * 50000),
    profit: Math.floor(40000 + i * 30000),
    customers: Math.floor(600 + i * 400)
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: businessData.meta.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isCostSavingsModel = businessData?.meta?.business_model === 'cost_savings';
      
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-elevation">
          <p className="font-semibold text-foreground">{`Period: ${label}`}</p>
          {payload.map((entry: any, index: number) => {
            // Transform labels for cost savings models
            let displayLabel = entry.dataKey;
            if (isCostSavingsModel) {
              if (entry.dataKey === 'netCashFlow' || entry.dataKey === 'cashFlow') {
                displayLabel = 'Net Benefit';
              } else if (entry.dataKey === 'revenue') {
                displayLabel = 'Total Benefits';
              }
            }
            
            return (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {`${displayLabel}: ${entry.dataKey.includes('revenue') || entry.dataKey.includes('cashFlow') || entry.dataKey.includes('ebitda') || entry.dataKey.includes('costs') || entry.dataKey.includes('profit') || entry.dataKey.includes('netCashFlow')
                  ? formatCurrency(entry.value) 
                  : entry.value.toLocaleString()}`}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Chart Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-primary shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                 <p className="text-sm text-white/80">Total Revenue</p>
                <p className="text-xl font-bold text-white">{formatCurrency(calculatedMetrics.totalRevenue)}</p>
              </div>
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Total Customers</p>
                <p className="text-xl font-bold text-white">{monthlyData[monthlyData.length - 1]?.customers.toLocaleString()}</p>
              </div>
              <Users className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-financial-warning shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-financial-warning-foreground/80">Break-even</p>
                <p className="text-xl font-bold text-financial-warning-foreground">
                  {calculatedMetrics.breakEvenMonth > 0 ? `Month ${calculatedMetrics.breakEvenMonth}` : 'Never'}
                </p>
              </div>
              <Activity className="h-6 w-6 text-financial-warning-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card border-financial-primary border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Present Value</p>
                <p className="text-xl font-bold text-financial-primary">{formatCurrency(calculatedMetrics.npv)}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-financial-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Three Charts Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Revenue & Operating Expense */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-financial-primary" />
              <span>Revenue & Operating Expense</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="period" 
                    stroke="hsl(var(--muted-foreground))"
                    interval={9}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--financial-primary))" 
                    strokeWidth={3}
                    dot={false}
                    name="Revenue"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="operatingExpense" 
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

        {/* 2. Sales Volume */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-financial-success" />
                <span>Sales Volume</span>
              </div>
              {activeGrowthModel && (
                <Badge variant="secondary" className="text-xs">
                  {activeGrowthModel}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="period" 
                    stroke="hsl(var(--muted-foreground))"
                    interval={9}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="salesVolume" 
                    stroke="hsl(var(--financial-success))" 
                    strokeWidth={3}
                    dot={false}
                    name="Sales Volume"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3. Cost Structure Pie Chart */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="h-5 w-5 text-financial-warning" />
              <span>Total Cost Structure</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costStructureData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costStructureData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(label) => `${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}