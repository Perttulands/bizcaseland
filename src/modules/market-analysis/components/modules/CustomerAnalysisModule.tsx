import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  PieChart,
  Pie,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { Users, DollarSign } from 'lucide-react';

import { MarketData } from '@/core/types';
import { MarketSuiteMetrics } from '@/core/engine/calculators/market-suite-calculations';
import { ValueWithRationale } from '../ValueWithRationale';
import { ModuleImportCard } from '@/modules/market-analysis/components/shared/ModuleImportCard';
import { mergeMarketData } from '@/core/engine/utils/market-data-utils';

// Simple component to render data source with clickable link
const DataSourceLink = ({ source }: { source: string }) => {
  const urlMatch = source.match(/(https?:\/\/[^\s]+)/);
  
  if (!urlMatch) {
    return <span>{source}</span>;
  }
  
  const url = urlMatch[0];
  const text = source.replace(url, '').trim().replace(/^-\s*/, '').replace(/\s*-\s*$/, '');
  
  return (
    <>
      {text && <span>{text} - </span>}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-600 underline"
      >
        {url}
      </a>
    </>
  );
};

interface CustomerAnalysisModuleProps {
  marketData: MarketData;
  onDataUpdate: (data: MarketData) => void;
  metrics: MarketSuiteMetrics | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1'];

export function CustomerAnalysisModule({ marketData, onDataUpdate, metrics }: CustomerAnalysisModuleProps) {
  const segments = marketData?.customer_analysis?.market_segments || [];
  const currency = marketData?.meta?.currency || 'EUR';

  const segmentValueData = useMemo(() => {
    return segments.map((segment, index) => ({
      name: segment.name,
      value: segment.size_value?.value || 0,
      color: COLORS[index % COLORS.length]
    }));
  }, [segments]);

  const marketSplitData = useMemo(() => {
    return segments.map((segment, index) => ({
      name: segment.name,
      value: segment.size_percentage?.value || 0,
      color: COLORS[index % COLORS.length]
    }));
  }, [segments]);

  const totalMarketSize = useMemo(() => {
    return segments.reduce((sum, seg) => sum + (seg.size_value?.value || 0), 0);
  }, [segments]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `€${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value.toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-purple-600" />
        <h2 className="text-2xl font-bold">Customer Analysis</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Segment Size (Market Value)</CardTitle>
          </CardHeader>
          <CardContent>
            {segmentValueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={segmentValueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-md">
                            <p className="font-semibold">{label}</p>
                            <p style={{ color: payload[0].color }}>
                              {`Market Value: ${formatCurrency(payload[0].value as number)}`}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" name="Market Value" radius={[4, 4, 0, 0]}>
                    {segmentValueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No segment value data available</p>
                <p className="text-sm">Add size_value to segments to see chart</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Market Split by Segment</CardTitle>
          </CardHeader>
          <CardContent>
            {marketSplitData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={marketSplitData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.value.toFixed(1)}%`}
                    labelLine={false}
                  >
                    {marketSplitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-md">
                            <p className="font-semibold">{payload[0].name}</p>
                            <p style={{ color: payload[0].payload.color }}>
                              {`${(payload[0].value as number).toFixed(1)}%`}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    formatter={(value: string) => {
                      return value.length > 30 ? `${value.substring(0, 30)}...` : value;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No market split data available</p>
                <p className="text-sm">Add segments to see distribution</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Segment Details</CardTitle>
        </CardHeader>
        <CardContent>
          {segments.length > 0 ? (
            <div className="space-y-6">
              {segments.map((segment, index) => (
                <Card key={segment.id} className="border-l-4" style={{ borderLeftColor: COLORS[index % COLORS.length] }}>
                  <CardHeader className="pb-3">
                    <div>
                      <CardTitle className="text-lg">{segment.name}</CardTitle>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Size: <ValueWithRationale
                          value={formatCurrency(segment.size_value?.value || 0)}
                          rationale={segment.size_value?.rationale}
                          link={segment.size_value?.link}
                          inline
                        /></span>
                        <span>Growth: <ValueWithRationale
                          value={`${segment.growth_rate?.value || 0}%`}
                          rationale={segment.growth_rate?.rationale}
                          link={segment.growth_rate?.link}
                          inline
                        /> annually</span>
                        <span>Share: <ValueWithRationale
                          value={`${segment.size_percentage?.value || 0}%`}
                          rationale={segment.size_percentage?.rationale}
                          link={segment.size_percentage?.link}
                          inline
                        /> of market</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {segment.demographics && (
                      <div>
                        <h5 className="font-semibold mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Demographics
                        </h5>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {segment.demographics}
                        </p>
                      </div>
                    )}

                    {segment.pain_points && (
                      <div>
                        <h5 className="font-semibold mb-2">Pain Points & Unmet Needs</h5>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {segment.pain_points}
                        </p>
                      </div>
                    )}

                    {segment.customer_profile && (
                      <div>
                        <h5 className="font-semibold mb-2">Customer Profile</h5>
                        <p className="text-sm text-muted-foreground">
                          {segment.customer_profile}
                        </p>
                      </div>
                    )}

                    {segment.value_drivers && segment.value_drivers.length > 0 && (
                      <div>
                        <h5 className="font-semibold mb-2">Value Drivers</h5>
                        <div className="flex flex-wrap gap-2">
                          {segment.value_drivers.map((driver, idx) => (
                            <Badge key={idx} variant="secondary">
                              {driver}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {segment.entry_strategy && (
                      <div>
                        <h5 className="font-semibold mb-2">Entry Strategy</h5>
                        <p className="text-sm text-muted-foreground">
                          {segment.entry_strategy}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <ModuleImportCard
              moduleId="customer_analysis"
              moduleName="Customer Analysis"
              icon="Users"
              description="Define customer segments with demographics, pain points, and market value analysis"
              onDataUpload={(newData) => {
                if (onDataUpdate && marketData) {
                  const merged = mergeMarketData(marketData, newData);
                  onDataUpdate(merged as MarketData);
                } else if (onDataUpdate) {
                  onDataUpdate(newData as MarketData);
                }
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Data Sources */}
      {marketData?.customer_analysis?.data_sources && marketData.customer_analysis.data_sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              {marketData.customer_analysis.data_sources.map((source, index) => (
                <li key={index}>• <DataSourceLink source={source} /></li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
