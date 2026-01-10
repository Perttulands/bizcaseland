import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Trophy, TrendingUp, Target, Zap } from 'lucide-react';

import { MarketData } from '@/core/types';
import { MarketSuiteMetrics } from '@/core/engine/calculators/market-suite-calculations';
import { ValueWithRationale } from '../ValueWithRationale';
import { ModuleImportCard } from '@/modules/market-analysis/components/shared/ModuleImportCard';
import { mergeMarketData } from '@/core/engine/utils/market-data-utils';

interface CompetitiveIntelligenceModuleProps {
  marketData: MarketData;
  onDataUpdate: (data: MarketData) => void;
  metrics: MarketSuiteMetrics | null;
}

const COMPETITOR_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export function CompetitiveIntelligenceModule({ marketData, onDataUpdate, metrics }: CompetitiveIntelligenceModuleProps) {
  const competitors = marketData?.competitive_landscape?.competitors || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-red-600" />
        <h2 className="text-2xl font-bold">Competitive Analysis</h2>
      </div>

      {/* Competitive Positioning Matrix */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-red-600" />
            <span>Competitive Positioning Matrix</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Position of key competitors and your new business on relevant market dimensions
          </p>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          {competitors.length > 0 ? (
            <div className="h-96 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  {/* Centered reference lines at 50 for 2x2 quadrants */}
                  <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="5 5" opacity="0.3" />
                  <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="5 5" opacity="0.3" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="X Axis"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    domain={[0, 100]}
                    label={{ 
                      value: marketData?.competitive_landscape?.positioning_axes?.x_axis_label || 'X Dimension (0-100)', 
                      position: 'bottom', 
                      offset: 20 
                    }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Y Axis"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    domain={[0, 100]}
                    label={{ 
                      value: marketData?.competitive_landscape?.positioning_axes?.y_axis_label || 'Y Dimension (0-100)', 
                      angle: -90, 
                      position: 'left', 
                      offset: 10 
                    }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-md">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">X: {data.x}</p>
                            <p className="text-sm">Y: {data.y}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    name="Competitors" 
                    data={competitors.map((comp, index) => ({
                      name: comp.name,
                      x: comp.x_position || 50,
                      y: comp.y_position || 50
                    }))}
                    fill="#8884d8"
                  >
                    {competitors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COMPETITOR_COLORS[index % COMPETITOR_COLORS.length]} r={12} />
                    ))}
                  </Scatter>
                  {/* Our Idea reference diamond with larger size */}
                  <Scatter
                    name="Our Idea"
                    data={[{
                      name: 'Our Idea',
                      x: marketData?.competitive_landscape?.our_position?.x || 50,
                      y: marketData?.competitive_landscape?.our_position?.y || 50
                    }]}
                    fill="#000000"
                    shape="diamond"
                  >
                    <Cell r={12} />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              {/* "Our Idea" text label */}
              {marketData?.competitive_landscape?.our_position && (
                <div 
                  className="absolute text-xs font-semibold bg-white px-2 py-1 rounded border border-gray-300 pointer-events-none"
                  style={{
                    left: `calc(${((marketData.competitive_landscape.our_position.x || 50) / 100) * 100}% - 30px)`,
                    top: `calc(${100 - ((marketData.competitive_landscape.our_position.y || 50) / 100) * 100}% - 35px)`
                  }}
                >
                  Our Idea
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No competitor data available</p>
              <p className="text-sm mt-2">Add competitor information to see positioning analysis</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Competitor Cards */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Key Competitors</h3>
        <div className="space-y-6">
          {competitors.length > 0 ? (
            competitors.map((competitor, index) => (
              <Card key={index} className="border-l-4" style={{ borderLeftColor: COMPETITOR_COLORS[index % COMPETITOR_COLORS.length] }}>
                <CardHeader className="pb-3">
                  <div>
                    <CardTitle className="text-lg">{competitor.name}</CardTitle>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>
                        Market Share: <ValueWithRationale
                          value={`${competitor.market_share?.value || 0}%`}
                          rationale={competitor.market_share?.rationale}
                          link={competitor.market_share?.link}
                          inline
                        />
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Value Proposition */}
                  <div>
                    <h5 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Value Proposition
                    </h5>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {competitor.positioning}
                    </p>
                  </div>

                  {/* Unique Selling Point */}
                  <div>
                    <h5 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Unique Selling Point & Strengths
                    </h5>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {competitor.strengths && competitor.strengths.length > 0 ? (
                        competitor.strengths.join('. ') + '.'
                      ) : (
                        'No specific strengths identified.'
                      )}
                    </p>
                  </div>

                  {/* Competitor Summary Memo (2 paragraphs) */}
                  <div className="bg-muted/30 rounded-lg p-4 mt-4">
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      <span className="font-semibold text-foreground">{competitor.name}</span> holds a {competitor.market_share?.value || 0}% 
                      market share and is positioned as {competitor.positioning.toLowerCase()}. Their competitive 
                      threat level is assessed as <span className="font-semibold text-foreground">{competitor.threat_level}</span>, 
                      reflecting their {competitor.strengths && competitor.strengths.length > 0 ? 'strong' : 'moderate'} market position.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Expected competitive response: {competitor.competitive_response}
                      {competitor.weaknesses && competitor.weaknesses.length > 0 && (
                        <span> Key vulnerabilities include: {competitor.weaknesses.join(', ').toLowerCase()}.</span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <ModuleImportCard
              moduleId="competitive_intelligence"
              moduleName="Competitive Intelligence"
              icon="TrendingUp"
              description="Analyze competitors with positioning matrix, market shares, and competitive advantages"
              onDataUpload={(newData) => {
                const merged = mergeMarketData(marketData, newData);
                onDataUpdate(merged as MarketData);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
