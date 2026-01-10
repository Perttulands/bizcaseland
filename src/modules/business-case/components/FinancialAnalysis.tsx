import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Target, AlertCircle, BarChart3, Search } from 'lucide-react';
import { useBusinessData } from '@/core/contexts';
import { BusinessData, EvidenceContext } from '@/core/types';
import { calculateBusinessMetrics, formatCurrency, formatPercent, calculateBreakEven } from '@/core/engine';
import { setNestedValue, getNestedValue } from '@/core/engine';
import { SensitivityAnalysis } from './SensitivityAnalysis';
import { EvidenceTrailPanel } from './EvidenceTrailPanel';

// Helper functions for driver manipulation - now using safe utilities
// Note: The imported getNestedValue and setNestedValue from utils should be used instead

export function FinancialAnalysis() {
  const { data: businessData, updateData } = useBusinessData();

  const [driverValues, setDriverValues] = useState<{[key: string]: number}>({});
  const [evidenceContext, setEvidenceContext] = useState<EvidenceContext | null>(null);
  const [isEvidencePanelOpen, setIsEvidencePanelOpen] = useState(false);
  // baselineRef holds the original JSON data so we can compare current values
  // against the original baseline even after the global data is updated.
  const baselineRef = useRef(businessData);

  // Update baseline when a fresh businessData is loaded and there are no active modifications.
  useEffect(() => {
    if (Object.keys(driverValues).length === 0) {
      baselineRef.current = businessData;
    }
  }, [businessData, driverValues]);

  // Listen for global data refresh events (dispatched from BusinessCaseAnalyzer)
  useEffect(() => {
    const handleDataRefreshed = () => {
      // Clear any local driver overrides so UI reflects the fresh JSON
      setDriverValues({});
      // Update baseline to the latest businessData
      baselineRef.current = businessData;
    };

    window.addEventListener('datarefreshed', handleDataRefreshed);
    return () => window.removeEventListener('datarefreshed', handleDataRefreshed);
  }, [businessData]);
  
  // Get drivers and initialize values if needed (moved before early return)
  const drivers = businessData?.drivers || [];
  
  // Create modified business data with current driver values
  const modifiedBusinessData = useMemo(() => {
    if (!businessData) return null;
    
    let modified = businessData;
    
    for (const driver of drivers) {
      const currentValue = driverValues[driver.key];
      if (currentValue !== undefined) {
        modified = setNestedValue(modified, driver.path, currentValue);
      }
    }
    
    return modified;
  }, [businessData, driverValues, drivers]);
  
  // Calculate metrics from modified business data using centralized calculations
  const calculatedMetrics = useMemo(() => {
    if (!modifiedBusinessData) return null;
    
    const metrics = calculateBusinessMetrics(modifiedBusinessData);

    // Ensure break-even month is recalculated correctly
    metrics.breakEvenMonth = calculateBreakEven(metrics.monthlyData);

    return metrics;
  }, [modifiedBusinessData]);

  if (!businessData) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No Data Available</h3>
            <p className="text-muted-foreground">Please load business case data to view analysis.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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

  const openEvidenceTrail = (metricKey: string, metricLabel: string, value: number) => {
    setEvidenceContext({
      metricKey,
      metricLabel,
      value,
      currency: businessData.meta.currency
    });
    setIsEvidencePanelOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Business Case Overview */}
      <Card className="bg-gradient-card shadow-elevation">
        <CardHeader>
          <CardTitle className="text-xl">{businessData.meta.title}</CardTitle>
          <p className="text-muted-foreground">{businessData.meta.description}</p>
        </CardHeader>
      </Card>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          className="bg-gradient-success shadow-card cursor-pointer hover:ring-2 hover:ring-white/30 transition-all group"
          onClick={() => openEvidenceTrail(
            'totalRevenue',
            businessData.meta.business_model === 'cost_savings' ? 'Total Benefits (5Y)' : 'Total Revenue (5Y)',
            calculatedMetrics.totalRevenue
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-financial-success-foreground/80 flex items-center gap-1">
                  {businessData.meta.business_model === 'cost_savings' ? 'Total Benefits (5Y)' : 'Total Revenue (5Y)'}
                  <Search className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-2xl font-bold text-white">{formatCurrency(calculatedMetrics.totalRevenue, businessData.meta.currency)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`${calculatedMetrics.netProfit >= 0 ? "bg-gradient-success shadow-card" : "bg-gradient-danger shadow-card"} cursor-pointer hover:ring-2 hover:ring-white/30 transition-all group`}
          onClick={() => openEvidenceTrail('netProfit', 'Net Profit (5Y)', calculatedMetrics.netProfit)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 flex items-center gap-1">
                  Net Profit (5Y)
                  <Search className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-2xl font-bold text-white">{formatCurrency(calculatedMetrics.netProfit, businessData.meta.currency)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`${calculatedMetrics.npv >= 0 ? "bg-gradient-success shadow-card" : "bg-gradient-danger shadow-card"} cursor-pointer hover:ring-2 hover:ring-white/30 transition-all group`}
          onClick={() => openEvidenceTrail('npv', 'Net Present Value', calculatedMetrics.npv)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 flex items-center gap-1">
                  Net Present Value
                  <Search className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-2xl font-bold text-white">{formatCurrency(calculatedMetrics.npv, businessData.meta.currency)}</p>
              </div>
              <Target className="h-8 w-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Performance Indicators</CardTitle>
          <p className="text-xs text-muted-foreground">Click any metric to see its evidence trail</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              className="text-center p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 hover:ring-1 hover:ring-financial-primary/50 transition-all group"
              onClick={() => openEvidenceTrail('paybackPeriod', 'Payback Period', calculatedMetrics.paybackPeriod)}
            >
              <div className="text-3xl font-bold text-financial-primary mb-2">{calculatedMetrics.paybackPeriod > 0 ? calculatedMetrics.paybackPeriod : "N/A"}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                Payback Period (months)
                <Search className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div
              className={`text-center p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 hover:ring-1 hover:ring-financial-primary/50 transition-all group ${calculatedMetrics.irr >= 0 && calculatedMetrics.irr <= 1 && calculatedMetrics.irr !== -999 ? 'text-financial-success' : 'text-financial-danger'}`}
              onClick={() => openEvidenceTrail('irr', 'Internal Rate of Return', calculatedMetrics.irr)}
            >
              <div className="text-3xl font-bold mb-2">
                {calculatedMetrics.irr === -999 || calculatedMetrics.irr < -1 || calculatedMetrics.irr > 1 ? (
                  <span className="text-financial-danger">-</span>
                ) : (
                  formatPercent(calculatedMetrics.irr)
                )}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                Internal Rate of Return
                <Search className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div
              className="text-center p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 hover:ring-1 hover:ring-financial-primary/50 transition-all group"
              onClick={() => openEvidenceTrail('totalInvestmentRequired', 'Required Investment', calculatedMetrics.totalInvestmentRequired)}
            >
              <div className="text-3xl font-bold text-financial-warning mb-2">{formatCurrency(calculatedMetrics.totalInvestmentRequired, businessData.meta.currency)}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                Required Investment to Break-even
                <Search className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div
              className="text-center p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 hover:ring-1 hover:ring-financial-primary/50 transition-all group"
              onClick={() => openEvidenceTrail('breakEvenMonth', 'Break-even Month', calculatedMetrics.breakEvenMonth)}
            >
              <div className="text-3xl font-bold text-financial-warning mb-2">{calculatedMetrics.breakEvenMonth}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                Break-even (months)
                <Search className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Interactive Sensitivity Drivers */}
      <SensitivityAnalysis
        drivers={drivers}
        businessData={businessData}
        baselineRef={baselineRef}
        driverValues={driverValues}
        onDriverChange={handleDriverChange}
      />

      {/* Volume & Customer Metrics */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {businessData.meta.business_model === 'cost_savings' ? 'Efficiency & Savings Overview' : 'Volume & Customer Overview'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {businessData.meta.business_model === 'cost_savings' 
              ? 'Cost savings and efficiency gains over the analysis period'
              : 'Customer acquisition and volume projections over the analysis period'
            }
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessData.meta.business_model === 'cost_savings' ? (
              <>
                {/* Total Efficiency Gain */}
                <div className="text-center p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-6 w-6 text-financial-primary mr-2" />
                  </div>
                  <div className="text-3xl font-bold text-financial-primary mb-2">
                    {(() => {
                      const totalEfficiencyHours = calculatedMetrics.monthlyData.reduce((sum, month) => {
                        // Calculate actual hours saved for display (baseline - improved)
                        // Note: This is different from monetary calculation which uses improved value only
                        const efficiencyGains = businessData?.assumptions?.cost_savings?.efficiency_gains || [];
                        const monthlyHoursGained = efficiencyGains.reduce((total, gain) => {
                          const baselineHours = gain.baseline_value?.value || 0;
                          const improvedHours = gain.improved_value?.value || 0;
                          return total + (baselineHours - improvedHours);
                        }, 0);
                        return sum + monthlyHoursGained;
                      }, 0);
                      return Math.round(totalEfficiencyHours).toLocaleString();
                    })()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Efficiency Gain</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Hours saved over {calculatedMetrics.monthlyData.length} months
                  </div>
                </div>
                
                {/* Total Money Saved */}
                <div className="text-center p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-center mb-2">
                    <Target className="h-6 w-6 text-financial-success mr-2" />
                  </div>
                  <div className="text-3xl font-bold text-financial-success mb-2">
                    {formatCurrency(
                      calculatedMetrics.monthlyData.reduce((sum, month) => 
                        sum + (month.costSavings || 0) + (month.efficiencyGains || 0), 0
                      ),
                      businessData.meta.currency
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Money Saved</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Cost savings + efficiency gains
                  </div>
                </div>
                
                {/* Cost per Hour Saved */}
                <div className="text-center p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-6 w-6 text-financial-warning mr-2" />
                  </div>
                  <div className="text-3xl font-bold text-financial-warning mb-2">
                    {(() => {
                      const totalInvestment = calculatedMetrics.totalInvestmentRequired;
                      const totalEfficiencyHours = calculatedMetrics.monthlyData.reduce((sum, month) => {
                        // Calculate actual hours saved for display (baseline - improved)
                        // Note: This is different from monetary calculation which uses improved value only
                        const efficiencyGains = businessData?.assumptions?.cost_savings?.efficiency_gains || [];
                        const monthlyHoursGained = efficiencyGains.reduce((total, gain) => {
                          const baselineHours = gain.baseline_value?.value || 0;
                          const improvedHours = gain.improved_value?.value || 0;
                          return total + (baselineHours - improvedHours);
                        }, 0);
                        return sum + monthlyHoursGained;
                      }, 0);
                      
                      const costPerHour = totalEfficiencyHours > 0 ? totalInvestment / totalEfficiencyHours : 0;
                      return formatCurrency(costPerHour, businessData.meta.currency);
                    })()}
                  </div>
                  <div className="text-sm text-muted-foreground">Cost per Hour Saved</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Investment / total hours saved
                  </div>
                </div>
                
                {/* Average Monthly Benefit */}
                <div className="text-center p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-6 w-6 text-financial-info mr-2" />
                  </div>
                  <div className="text-3xl font-bold text-financial-info mb-2">
                    {formatCurrency(
                      calculatedMetrics.monthlyData.length > 0 ? 
                        calculatedMetrics.monthlyData.reduce((sum, month) => 
                          sum + (month.costSavings || 0) + (month.efficiencyGains || 0), 0
                        ) / calculatedMetrics.monthlyData.length :
                        0,
                      businessData.meta.currency
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Average Monthly Benefit</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Benefits per month
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Original volume metrics for non-cost-savings models */}
                <div className="text-center p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-6 w-6 text-financial-primary mr-2" />
                  </div>
                  <div className="text-3xl font-bold text-financial-primary mb-2">
                    {calculatedMetrics.monthlyData.reduce((sum, month) => sum + month.salesVolume, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Units Sold</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Over {calculatedMetrics.monthlyData.length} months
                  </div>
                </div>
                
                <div className="text-center p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-center mb-2">
                    <Target className="h-6 w-6 text-financial-success mr-2" />
                  </div>
                  <div className="text-3xl font-bold text-financial-success mb-2">
                    {businessData.meta.business_model === 'recurring' ? 
                      calculatedMetrics.monthlyData.reduce((sum, month) => sum + (month.newCustomers || 0), 0).toLocaleString() :
                      calculatedMetrics.monthlyData.reduce((sum, month) => sum + month.salesVolume, 0).toLocaleString()
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {businessData.meta.business_model === 'recurring' ? 'New Customers Acquired' : 'Total Customer Interactions'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {businessData.meta.business_model === 'recurring' ? 'Net new acquisitions' : 'All sales transactions'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-6 w-6 text-financial-warning mr-2" />
                  </div>
                  <div className="text-3xl font-bold text-financial-warning mb-2">
                    {formatCurrency(
                      calculatedMetrics.monthlyData.length > 0 && calculatedMetrics.monthlyData.reduce((sum, month) => sum + month.salesVolume, 0) > 0 ? 
                        calculatedMetrics.monthlyData.reduce((sum, month) => sum + month.revenue, 0) / calculatedMetrics.monthlyData.reduce((sum, month) => sum + month.salesVolume, 0) :
                        0,
                      businessData.meta.currency
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Average Revenue per Unit</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Blended rate across all periods
                  </div>
                </div>
                
                <div className="text-center p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-6 w-6 text-financial-info mr-2" />
                  </div>
                  <div className="text-3xl font-bold text-financial-info mb-2">
                    {calculatedMetrics.monthlyData.length > 0 ? 
                      Math.round(calculatedMetrics.monthlyData.reduce((sum, month) => sum + month.salesVolume, 0) / calculatedMetrics.monthlyData.length).toLocaleString() :
                      0
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Average Monthly Volume</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Units per month
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Customer Segments Information */}
          {businessData.assumptions?.customers?.segments && businessData.assumptions.customers.segments.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="font-semibold mb-3 text-sm">Customer Segments</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {businessData.assumptions.customers.segments.map((segment, index) => (
                  <div key={index} className="p-4 bg-accent/20 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-sm">{segment.label || `Segment ${index + 1}`}</h5>
                      <Badge variant="secondary" className="text-xs">
                        {segment.volume?.type || 'Standard'}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-xs">
                      {segment.volume?.series?.[0]?.value && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base Volume:</span>
                          <span className="font-medium">{segment.volume.series[0].value.toLocaleString()}</span>
                        </div>
                      )}
                      {segment.volume?.yoy_growth?.value && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">YoY Growth:</span>
                          <span className="font-medium">{(segment.volume.yoy_growth.value * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {segment.volume?.monthly_growth_rate?.value && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Monthly Growth:</span>
                          <span className="font-medium">{(segment.volume.monthly_growth_rate.value * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {segment.volume?.pattern_type && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pattern:</span>
                          <span className="font-medium capitalize">{segment.volume.pattern_type.replace('_', ' ')}</span>
                        </div>
                      )}
                      {segment.rationale && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-muted-foreground">{segment.rationale}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Growth Insights */}
          {calculatedMetrics.monthlyData.length > 1 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="font-semibold mb-3 text-sm">
                {businessData.meta.business_model === 'cost_savings' ? 'Implementation Insights' : 'Growth Insights'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {businessData.meta.business_model === 'cost_savings' ? (
                  <>
                    {/* Benefits Growth for Cost Savings */}
                    <div className="text-center p-3 bg-accent/30 rounded-lg">
                      <div className="text-lg font-bold text-financial-primary">
                        {(() => {
                          const firstMonthBenefits = (calculatedMetrics.monthlyData[0]?.costSavings || 0) + (calculatedMetrics.monthlyData[0]?.efficiencyGains || 0);
                          const lastMonthBenefits = (calculatedMetrics.monthlyData[calculatedMetrics.monthlyData.length - 1]?.costSavings || 0) + (calculatedMetrics.monthlyData[calculatedMetrics.monthlyData.length - 1]?.efficiencyGains || 0);
                          
                          if (firstMonthBenefits > 0) {
                            return Math.round(((lastMonthBenefits - firstMonthBenefits) / firstMonthBenefits) * 100);
                          } else if (lastMonthBenefits > 0) {
                            return "∞"; // Infinite growth from zero
                          }
                          return 0;
                        })()}%
                      </div>
                      <div className="text-xs text-muted-foreground">Benefits Ramp-up</div>
                    </div>
                    
                    {/* Initial Monthly Benefits */}
                    <div className="text-center p-3 bg-accent/30 rounded-lg">
                      <div className="text-lg font-bold text-financial-success">
                        {formatCurrency(
                          (calculatedMetrics.monthlyData[0]?.costSavings || 0) + (calculatedMetrics.monthlyData[0]?.efficiencyGains || 0),
                          businessData.meta.currency
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">Starting Benefits</div>
                    </div>
                    
                    {/* Final Monthly Benefits */}
                    <div className="text-center p-3 bg-accent/30 rounded-lg">
                      <div className="text-lg font-bold text-financial-warning">
                        {formatCurrency(
                          (calculatedMetrics.monthlyData[calculatedMetrics.monthlyData.length - 1]?.costSavings || 0) + 
                          (calculatedMetrics.monthlyData[calculatedMetrics.monthlyData.length - 1]?.efficiencyGains || 0),
                          businessData.meta.currency
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">Peak Benefits</div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Original Growth Insights for Revenue Models */}
                    <div className="text-center p-3 bg-accent/30 rounded-lg">
                      <div className="text-lg font-bold text-financial-primary">
                        {calculatedMetrics.monthlyData.length > 0 && calculatedMetrics.monthlyData[0].salesVolume > 0 ? 
                          Math.round(((calculatedMetrics.monthlyData[calculatedMetrics.monthlyData.length - 1].salesVolume - calculatedMetrics.monthlyData[0].salesVolume) / calculatedMetrics.monthlyData[0].salesVolume) * 100) :
                          0
                        }%
                      </div>
                      <div className="text-xs text-muted-foreground">Volume Growth</div>
                    </div>
                    <div className="text-center p-3 bg-accent/30 rounded-lg">
                      <div className="text-lg font-bold text-financial-success">
                        {calculatedMetrics.monthlyData[0]?.salesVolume?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-muted-foreground">Starting Volume</div>
                    </div>
                    <div className="text-center p-3 bg-accent/30 rounded-lg">
                      <div className="text-lg font-bold text-financial-warning">
                        {calculatedMetrics.monthlyData[calculatedMetrics.monthlyData.length - 1]?.salesVolume?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-muted-foreground">Final Volume</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scenarios */}
      {businessData.scenarios && businessData.scenarios.length > 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Scenarios Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {businessData.scenarios.map((scenario, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">{scenario.name}</h4>
                  <div className="text-2xl font-bold text-financial-primary mb-1">
                    {formatCurrency(calculatedMetrics.totalRevenue * (1 + index * 0.1 - 0.1), modifiedBusinessData.meta.currency)}
                  </div>
                  <p className="text-xs text-muted-foreground">Projected Revenue</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence Trail Panel */}
      <EvidenceTrailPanel
        isOpen={isEvidencePanelOpen}
        onClose={() => setIsEvidencePanelOpen(false)}
        context={evidenceContext}
      />
    </div>
  );
}