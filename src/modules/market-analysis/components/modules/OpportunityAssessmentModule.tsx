import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';

import { MarketData } from '@/core/types';
import { MarketSuiteMetrics, createOpportunityMatrix } from '@/core/engine/calculators/market-suite-calculations';

interface OpportunityAssessmentModuleProps {
  marketData: MarketData;
  onDataUpdate: (data: MarketData) => void;
  metrics: MarketSuiteMetrics | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const RISK_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

export function OpportunityAssessmentModule({ marketData, onDataUpdate, metrics }: OpportunityAssessmentModuleProps) {
  // Opportunity matrix
  const opportunityMatrix = useMemo(() => 
    createOpportunityMatrix(marketData), 
    [marketData]
  );

  // Risk assessment
  const riskAssessment = useMemo(() => {
    const risks = marketData?.market_dynamics?.market_risks || [];
    return risks.map(risk => ({
      ...risk,
      riskScore: (risk.probability === 'high' ? 3 : risk.probability === 'medium' ? 2 : 1) *
                 (risk.impact === 'high' ? 3 : risk.impact === 'medium' ? 2 : 1),
      color: RISK_COLORS[risk.probability as keyof typeof RISK_COLORS]
    })).sort((a, b) => b.riskScore - a.riskScore);
  }, [marketData]);

  // Growth drivers assessment
  const growthDrivers = useMemo(() => {
    const drivers = marketData?.market_dynamics?.growth_drivers || [];
    return drivers.map(driver => ({
      ...driver,
      impactScore: driver.impact === 'high' ? 80 : driver.impact === 'medium' ? 50 : 20
    }));
  }, [marketData]);

  // Technology trends impact
  const technologyTrends = useMemo(() => {
    const trends = marketData?.market_dynamics?.technology_trends || [];
    return trends.map(trend => ({
      ...trend,
      relevanceScore: trend.relevance === 'high' ? 90 : trend.relevance === 'medium' ? 60 : 30
    }));
  }, [marketData]);

  // Overall opportunity scoring breakdown
  const opportunityBreakdown = useMemo(() => {
    if (!metrics) return [];
    
    return [
      { factor: 'Market Size', score: Math.min(25, Math.log10((metrics.tam || 1) / 1000000) * 5), max: 25 },
      { factor: 'Growth Rate', score: Math.min(25, (metrics.marketGrowthRate || 0) * 2.5), max: 25 },
      { factor: 'Competition', score: Math.max(0, 25 - ((metrics.marketConcentration || 0) * 25)), max: 25 },
      { factor: 'Strategic Fit', score: (metrics.strategicFitScore || 0) / 100 * 15, max: 15 },
      { factor: 'Market Access', score: Math.min(10, (metrics.marketPenetrationRate || 0) * 100 / 5), max: 10 }
    ];
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold">Opportunity Assessment</h2>
        </div>
        <Badge variant="outline" className="bg-indigo-50">
          Risk & Opportunity Analysis
        </Badge>
      </div>

      {/* Key assessment metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Opportunity Score</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.opportunityScore || '--'}/100
            </div>
            <div className="text-sm text-muted-foreground">
              Overall assessment
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Risk Level</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {metrics?.riskScore ? (metrics.riskScore < 30 ? 'Low' : metrics.riskScore < 60 ? 'Medium' : 'High') : '--'}
            </div>
            <div className="text-sm text-muted-foreground">
              Risk assessment
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Growth Drivers</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {growthDrivers.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Identified drivers
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Market Risks</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {riskAssessment.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Active risks
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall opportunity assessment */}
      {metrics && (
        <Alert className={`border-l-4 ${
          metrics.opportunityScore >= 75 ? 'border-green-500 bg-green-50' :
          metrics.opportunityScore >= 60 ? 'border-yellow-500 bg-yellow-50' :
          metrics.opportunityScore >= 40 ? 'border-orange-500 bg-orange-50' :
          'border-red-500 bg-red-50'
        }`}>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            <strong>Market Opportunity Assessment:</strong> {metrics.summary?.marketOpportunity || 'Analysis pending...'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Opportunity Score Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Opportunity Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {opportunityBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={opportunityBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="factor" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${(value as number).toFixed(1)}`,
                      name === 'score' ? 'Score' : 'Max Score'
                    ]}
                  />
                  <Bar dataKey="score" fill="#8884d8" name="Score" />
                  <Bar dataKey="max" fill="#e0e0e0" name="Max Score" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No scoring data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market Opportunity Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Market Opportunity Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            {opportunityMatrix.opportunities.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={opportunityMatrix.opportunities}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="overallScore"
                    label={({ segment, overallScore }) => `${segment}: ${overallScore.toFixed(0)}`}
                  >
                    {opportunityMatrix.opportunities.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${(value as number).toFixed(0)}`, 'Opportunity Score']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No opportunity matrix data</p>
                <p className="text-sm">Add segment data to generate matrix</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Growth Drivers Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Growth Drivers Impact</CardTitle>
          </CardHeader>
          <CardContent>
            {growthDrivers.length > 0 ? (
              <div className="space-y-4">
                {growthDrivers.map((driver, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{driver.driver}</span>
                      <Badge 
                        variant={driver.impact === 'high' ? 'default' : 
                                driver.impact === 'medium' ? 'secondary' : 'outline'}
                      >
                        {driver.impact} impact
                      </Badge>
                    </div>
                    <Progress value={driver.impactScore} className="h-2" />
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Timeline:</strong> {driver.timeline}</p>
                      <p>{driver.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No growth drivers identified</p>
                <p className="text-sm">Add market dynamics data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            {riskAssessment.length > 0 ? (
              <div className="space-y-4">
                {riskAssessment.map((risk, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{risk.risk}</span>
                      <div className="flex gap-2">
                        <Badge variant="outline">{risk.probability} probability</Badge>
                        <Badge variant="outline">{risk.impact} impact</Badge>
                      </div>
                    </div>
                    <div className="mb-2">
                      <Progress 
                        value={(risk.riskScore / 9) * 100} 
                        className="h-2"
                        style={{ 
                          '--progress-foreground': risk.color 
                        } as React.CSSProperties}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Mitigation:</strong> {risk.mitigation}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Risk Score: {risk.riskScore}/9
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No risks identified</p>
                <p className="text-sm">Add risk analysis data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Technology trends impact */}
      <Card>
        <CardHeader>
          <CardTitle>Technology Trends Impact</CardTitle>
        </CardHeader>
        <CardContent>
          {technologyTrends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {technologyTrends.map((trend, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">{trend.trend}</h4>
                    <Badge 
                      variant={trend.relevance === 'high' ? 'default' : 
                              trend.relevance === 'medium' ? 'secondary' : 'outline'}
                    >
                      {trend.relevance} relevance
                    </Badge>
                  </div>
                  <div className="mb-2">
                    <Progress value={trend.relevanceScore} className="h-2" />
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Impact Timeline:</strong> {trend.impact_timeline}</p>
                    <p><strong>Strategic Response:</strong> {trend.strategic_response}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No technology trends analyzed</p>
              <p className="text-sm">Add technology trend analysis</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations summary */}
      {metrics?.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Strategic Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Key Recommendations
                </h4>
                <ul className="space-y-2">
                  {metrics.summary.recommendations?.map((rec, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  )) || [<li key="0" className="text-muted-foreground">No recommendations available</li>]}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Key Risks
                </h4>
                <ul className="space-y-2">
                  {metrics.summary.keyRisks?.map((risk, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span>{risk}</span>
                    </li>
                  )) || [<li key="0" className="text-muted-foreground">No key risks identified</li>]}
                </ul>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                Next Steps
              </h4>
              <ol className="space-y-2">
                {metrics.summary.nextSteps?.map((step, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-blue-600 font-medium">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                )) || [<li key="0" className="text-muted-foreground">No next steps available</li>]}
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
