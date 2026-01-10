import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Target, TrendingUp, DollarSign, Users } from 'lucide-react';

import { MarketData } from '@/core/types';
import { formatMarketCurrency } from '@/core/engine';
import { MarketSuiteMetrics } from '@/core/engine/calculators/market-suite-calculations';
import { ValueWithRationale } from '../ValueWithRationale';

interface MarketSizingModuleProps {
  marketData: MarketData;
  onDataUpdate: (data: MarketData) => void;
  metrics: MarketSuiteMetrics | null;
}

export function MarketSizingModule({ marketData, onDataUpdate, metrics }: MarketSizingModuleProps) {
  // Calculate TAM/SAM/SOM values
  const marketSizingData = useMemo(() => {
    const tam = marketData?.market_sizing?.total_addressable_market?.base_value?.value || 0;
    const samPercentage = (marketData?.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.value || 0) / 100;
    const somPercentage = (marketData?.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.value || 0) / 100;
    
    const sam = tam * samPercentage;
    const som = sam * somPercentage;
    
    return { tam, sam, som, samPercentage: samPercentage * 100, somPercentage: somPercentage * 100 };
  }, [marketData]);

  // Market growth projection - 6 year forecast
  const growthProjection = useMemo(() => {
    const baseYear = marketData?.meta?.base_year || 2024;
    const tam = marketData?.market_sizing?.total_addressable_market?.base_value?.value || 0;
    const growthRate = marketData?.market_sizing?.total_addressable_market?.growth_rate?.value || 0;
    const samPercentage = (marketData?.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.value || 0) / 100;
    const somPercentage = (marketData?.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.value || 0) / 100;
    
    return Array.from({ length: 6 }, (_, i) => ({
      year: baseYear + i,
      tam: tam * Math.pow(1 + growthRate / 100, i),
      sam: tam * Math.pow(1 + growthRate / 100, i) * samPercentage,
      som: tam * Math.pow(1 + growthRate / 100, i) * samPercentage * somPercentage
    }));
  }, [marketData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Target className="h-6 w-6 text-green-600" />
        <h2 className="text-2xl font-bold">Market Sizing</h2>
      </div>

      {/* Key metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total Addressable Market</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              <ValueWithRationale
                value={formatMarketCurrency(marketSizingData.tam)}
                rationale={marketData?.market_sizing?.total_addressable_market?.base_value?.rationale}
                link={marketData?.market_sizing?.total_addressable_market?.base_value?.link}
                label="TAM"
                inline
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Total market opportunity
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Serviceable Addressable Market</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              <ValueWithRationale
                value={formatMarketCurrency(marketSizingData.sam)}
                rationale={marketData?.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.rationale}
                link={marketData?.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.link}
                label="SAM"
                inline
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {marketSizingData.samPercentage.toFixed(1)}% of TAM
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Serviceable Obtainable Market</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              <ValueWithRationale
                value={formatMarketCurrency(marketSizingData.som)}
                rationale={marketData?.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.rationale}
                link={marketData?.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.link}
                label="SOM"
                inline
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {marketSizingData.somPercentage.toFixed(1)}% of SAM
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Market Growth Rate (CAGR)</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              <ValueWithRationale
                value={`${(marketData?.market_sizing?.total_addressable_market?.growth_rate?.value || 0).toFixed(1)}%`}
                rationale={marketData?.market_sizing?.total_addressable_market?.growth_rate?.rationale}
                link={marketData?.market_sizing?.total_addressable_market?.growth_rate?.link}
                label="CAGR"
                inline
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Annual compound growth
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Growth Projection Chart */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span>Market Growth Projection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthProjection}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="year" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => formatMarketCurrency(value)}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-md">
                          <p className="font-semibold">{`Year ${label}`}</p>
                          {payload.map((entry, index) => (
                            <p key={index} style={{ color: entry.color }}>
                              {`${entry.name}: ${formatMarketCurrency(entry.value as number)}`}
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
                  dataKey="tam" 
                  stroke="#0088FE" 
                  strokeWidth={3}
                  dot={false}
                  name="TAM"
                />
                <Line 
                  type="monotone" 
                  dataKey="sam" 
                  stroke="#00C49F" 
                  strokeWidth={2}
                  dot={false}
                  name="SAM"
                />
                <Line 
                  type="monotone" 
                  dataKey="som" 
                  stroke="#FFBB28" 
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                  name="SOM"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* TAM/SAM/SOM Summary Memo */}
      <Card>
        <CardHeader>
          <CardTitle>Market Sizing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The total addressable market (TAM) is valued at <span className="font-semibold text-foreground">{formatMarketCurrency(marketSizingData.tam)}</span> with 
                a compound annual growth rate (CAGR) of <span className="font-semibold text-foreground">{(marketData?.market_sizing?.total_addressable_market?.growth_rate?.value || 0).toFixed(1)}%</span>.
                {marketData?.market_sizing?.total_addressable_market?.base_value?.rationale && (
                  <span> {marketData.market_sizing.total_addressable_market.base_value.rationale}</span>
                )}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The serviceable addressable market (SAM) represents <span className="font-semibold text-foreground">{marketSizingData.samPercentage.toFixed(1)}%</span> of 
                TAM, equating to <span className="font-semibold text-foreground">{formatMarketCurrency(marketSizingData.sam)}</span>.
                {marketData?.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.rationale && (
                  <span> {marketData.market_sizing.serviceable_addressable_market.percentage_of_tam.rationale}</span>
                )}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The serviceable obtainable market (SOM) is <span className="font-semibold text-foreground">{marketSizingData.somPercentage.toFixed(1)}%</span> of 
                SAM, valued at <span className="font-semibold text-foreground">{formatMarketCurrency(marketSizingData.som)}</span>.
                {marketData?.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.rationale && (
                  <span> {marketData.market_sizing.serviceable_obtainable_market.percentage_of_sam.rationale}</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
