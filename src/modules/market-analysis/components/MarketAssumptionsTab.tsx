import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Target, TrendingUp, Users, Info, BarChart3, Building2 } from 'lucide-react';
import { useMarketData } from '@/core/contexts';
import { MarketData, MarketDriver } from '@/core/engine';
import { EditableValueCell, EditableRationaleCell } from '@/components/common';
import { SensitivityDriverBadge } from '@/modules/business-case/components/SensitivityDriverBadge';
import { extractMarketAssumptions, groupAssumptionsByCategory, getCategoryOrder } from '@/core/engine/utils/market-path-utils';

export function MarketAssumptionsTab() {
  const { data: marketData, updateAssumption, addDriver, removeDriver, updateDriverRange } = useMarketData();
  
  const [changedValuePaths, setChangedValuePaths] = useState<Set<string>>(new Set());

  if (!marketData) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Info className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No Data Available</h3>
            <p className="text-muted-foreground">Please load market analysis data to view assumptions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: marketData.meta?.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatValue = (value: any, unit: string) => {
    if (typeof value === 'number') {
      if (unit.includes('EUR') || unit.includes('USD') || unit === 'currency') {
        return formatCurrency(value);
      }
      if (unit === 'ratio' || unit.includes('pct') || unit === '%' || unit === 'percentage') {
        return `${(value * 100).toFixed(1)}%`;
      }
      if (unit.includes('year')) {
        return `${value} years`;
      }
      return value.toLocaleString();
    }
    return String(value);
  };

  // Handle value updates
  const handleValueUpdate = (path: string, value: any) => {
    updateAssumption(path, value);
    // Mark the value path as changed (so rationale shows red)
    const basePath = path.replace('.value', '');
    setChangedValuePaths(prev => new Set(prev).add(basePath));
  };

  // Handle rationale updates
  const handleRationaleUpdate = (path: string, value: string) => {
    updateAssumption(path, value);
    // Remove from changed paths when rationale is updated
    const basePath = path.replace('.rationale', '');
    setChangedValuePaths(prev => {
      const newSet = new Set(prev);
      newSet.delete(basePath);
      return newSet;
    });
  };

  // Helper to check if rationale needs update
  const rationaleNeedsUpdate = (dataPath: string): boolean => {
    const basePath = dataPath.replace('.value', '').replace('.rationale', '');
    return changedValuePaths.has(basePath);
  };

  // Check if a path is a sensitivity driver
  const isDriver = (path: string): boolean => {
    const data = marketData as MarketData & { drivers?: MarketDriver[] };
    if (!data?.drivers) return false;
    return data.drivers.some(d => d.path === path);
  };

  // Get driver for a path
  const getDriver = (path: string): MarketDriver | undefined => {
    const data = marketData as MarketData & { drivers?: MarketDriver[] };
    if (!data?.drivers) return undefined;
    return data.drivers.find(d => d.path === path);
  };

  // Toggle driver status
  const handleToggleDriver = (path: string, label: string, rationale: string) => {
    if (isDriver(path)) {
      removeMarketDriver(path);
    } else {
      // Default range with 5 values (Very Low, Low, Base, High, Very High)
      const defaultRange = [0, 0, 0, 0, 0];
      addMarketDriver(label, path, defaultRange, rationale || `Sensitivity analysis for ${label}`);
    }
  };

  // Extract and group assumptions
  const assumptions = useMemo(() => extractMarketAssumptions(marketData), [marketData]);
  const groupedAssumptions = useMemo(() => groupAssumptionsByCategory(assumptions), [assumptions]);
  const categoryOrder = getCategoryOrder();

  // Category icons
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Market Sizing':
        return Target;
      case 'Market Share':
        return TrendingUp;
      case 'Competitive Intelligence':
        return Building2;
      case 'Customer Analysis':
        return Users;
      default:
        return BarChart3;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-card shadow-elevation">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Market Analysis Assumptions
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Edit market sizing, competitive intelligence, and customer analysis assumptions directly.
            Changes are saved automatically.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-financial-primary">{assumptions.length}</div>
              <div className="text-sm text-muted-foreground">Total Assumptions</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-financial-warning">
                {(marketData as MarketData & { drivers?: MarketDriver[] }).drivers?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Sensitivity Drivers</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-financial-info">{groupedAssumptions.size}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend Card */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Checkbox checked={true} className="pointer-events-none" />
              <span className="text-muted-foreground">Check to add as sensitivity driver</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                S
              </Badge>
              <span className="text-muted-foreground">Sensitivity driver (click to edit range)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-destructive font-medium">Red text</span>
              <span className="text-muted-foreground">Rationale needs update after value change</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assumptions Tables by Category */}
      {categoryOrder.map(category => {
        const categoryRows = groupedAssumptions.get(category);
        if (!categoryRows || categoryRows.length === 0) return null;

        const Icon = getCategoryIcon(category);
        
        // Group by subcategory if available
        const subcategoryGroups = new Map<string, typeof categoryRows>();
        categoryRows.forEach(row => {
          const subcat = row.subcategory || 'General';
          if (!subcategoryGroups.has(subcat)) {
            subcategoryGroups.set(subcat, []);
          }
          subcategoryGroups.get(subcat)!.push(row);
        });

        return (
          <Card key={category} className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon className="h-5 w-5 text-financial-primary" />
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.from(subcategoryGroups.entries()).map(([subcategory, rows]) => (
                <div key={subcategory} className="mb-6 last:mb-0">
                  {subcategory !== 'General' && (
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">{subcategory}</h4>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2 w-[12px]"></th>
                          <th className="text-left p-2 font-medium text-sm">Assumption</th>
                          <th className="text-left p-2 font-medium text-sm w-[150px]">Value</th>
                          <th className="text-left p-2 font-medium text-sm w-[100px]">Unit</th>
                          <th className="text-left p-2 font-medium text-sm">Rationale</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(row => {
                          const driver = getDriver(row.path);
                          const needsUpdate = rationaleNeedsUpdate(row.valuePath);
                          
                          return (
                            <tr key={row.key} className="border-b border-border/50 hover:bg-accent/30">
                              {/* Driver Checkbox */}
                              <td className="p-2 align-top">
                                <Checkbox
                                  checked={isDriver(row.path)}
                                  onCheckedChange={() => handleToggleDriver(row.path, row.label, row.rationale)}
                                />
                              </td>
                              
                              {/* Label */}
                              <td className="p-2 align-top">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{row.label}</span>
                                  {driver && (
                                    <SensitivityDriverBadge
                                      path={driver.path}
                                      currentRange={driver.range}
                                      onUpdateRange={(range) => updateMarketDriverRange(row.path, range)}
                                      onRemove={() => removeMarketDriver(row.path)}
                                    />
                                  )}
                                </div>
                              </td>
                              
                              {/* Value */}
                              <td className="p-2 align-top">
                                <EditableValueCell
                                  value={row.value}
                                  unit={row.unit}
                                  dataPath={row.valuePath}
                                  formatValue={formatValue}
                                  onUpdate={handleValueUpdate}
                                  onValueChanged={() => {
                                    const basePath = row.valuePath.replace('.value', '');
                                    setChangedValuePaths(prev => new Set(prev).add(basePath));
                                  }}
                                />
                              </td>
                              
                              {/* Unit */}
                              <td className="p-2 align-top">
                                <span className="text-sm text-muted-foreground">{row.unit}</span>
                              </td>
                              
                              {/* Rationale */}
                              <td className="p-2 align-top">
                                <EditableRationaleCell
                                  value={row.rationale}
                                  dataPath={row.rationalePath}
                                  onUpdate={handleRationaleUpdate}
                                  needsUpdate={needsUpdate}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Empty State */}
      {assumptions.length === 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Info className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">No Assumptions Found</h3>
              <p className="text-muted-foreground">
                The current market data doesn't contain any editable assumptions.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
