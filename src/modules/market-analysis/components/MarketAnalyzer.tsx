import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, Users, Target, PieChart, BarChart3, Download, Upload, RefreshCw } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import { Textarea } from '@/components/ui/textarea';
import { MarketAnalysisTemplate } from './MarketAnalysisTemplate';
import { 
  MarketData,
  MarketMetrics,
  MarketVolumeProjection,
  calculateMarketTAM,
  calculateMarketSAM,
  calculateMarketSOM,
  getMarketAnalysisMetrics,
  getMarketPenetrationTrajectory,
  validateMarketAnalysis,
  calculateMarketOpportunityScore,
  formatMarketCurrency,
  formatMarketPercent
} from '@/core/engine';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function MarketAnalyzer() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(60); // months

  // Calculate metrics
  const currentMetrics = useMemo(() => 
    marketData ? getMarketAnalysisMetrics(marketData, 0) : null, 
    [marketData]
  );
  
  const year1Metrics = useMemo(() => 
    marketData ? getMarketAnalysisMetrics(marketData, 12) : null, 
    [marketData]
  );
  
  const year3Metrics = useMemo(() => 
    marketData ? getMarketAnalysisMetrics(marketData, 36) : null, 
    [marketData]
  );

  // Get trajectory data
  const trajectoryData = useMemo(() => {
    return marketData ? getMarketPenetrationTrajectory(marketData, selectedTimeframe) : [];
  }, [marketData, selectedTimeframe]);

  // Validate data
  const validation = useMemo(() => 
    marketData ? validateMarketAnalysis(marketData) : null, 
    [marketData]
  );

  // Calculate opportunity score
  const opportunityScore = useMemo(() => 
    marketData ? calculateMarketOpportunityScore(marketData) : null,
    [marketData]
  );

  const handleDataLoad = (data: any) => {
    setMarketData(data as MarketData);
  };

  const exportVolumeProjections = () => {
    if (!trajectoryData.length) return;
    
    const csv = [
      'Period,Year,Month,TAM,SAM,SOM,Market Share,Monthly Volume,Annual Volume,Market Value',
      ...trajectoryData.map(d => 
        `${d.period},${d.year},${((d.period - 1) % 12) + 1},${d.tam},${d.sam},${d.som},${d.marketShare},${d.marketBasedVolume},${d.marketBasedVolume * 12},${d.marketValue}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'market-volume-projections.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!marketData) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Market Analysis Tool</h1>
          <p className="text-muted-foreground">
            Analyze market opportunities and generate volume projections for your business case
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Load Market Analysis Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="market-data-input" className="text-sm font-medium">
                Market Analysis JSON Data
              </label>
              <Textarea
                id="market-data-input"
                placeholder="Paste your market analysis JSON data here..."
                className="min-h-[300px] font-mono text-sm"
                onChange={(e) => {
                  try {
                    const data = JSON.parse(e.target.value);
                    handleDataLoad(data);
                  } catch (error) {
                    // Invalid JSON, do nothing
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(MarketAnalysisTemplate, null, 2));
                }}
              >
                Copy Template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currency = marketData.meta?.currency || 'EUR';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {marketData.meta?.title || 'Market Analysis'}
          </h1>
          <p className="text-muted-foreground">
            {marketData.meta?.description || 'Market opportunity analysis and volume projections'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportVolumeProjections}>
            <Download className="h-4 w-4 mr-2" />
            Export Projections
          </Button>
          <Button variant="outline" onClick={() => setMarketData(null)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Load New Data
          </Button>
        </div>
      </div>

      {/* Validation Alerts */}
      {validation && !validation.isValid && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-semibold">Data Validation Errors</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {validation && validation.warnings.length > 0 && (
        <Card className="border-warning">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-warning mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-semibold">Warnings</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validation.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="market-size">Market Size</TabsTrigger>
          <TabsTrigger value="competitive">Competitive</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
          <TabsTrigger value="opportunity">Opportunity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current TAM</p>
                    <p className="text-2xl font-bold">{formatMarketCurrency(currentMetrics?.tam || 0, currency)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target Market Share</p>
                    <p className="text-2xl font-bold">
                      {formatMarketPercent((marketData.market_share?.target_position?.target_share?.value || 0) / 100)}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Year 3 Volume</p>
                    <p className="text-2xl font-bold">
                      {Math.round(year3Metrics?.marketBasedVolume || 0).toLocaleString()}/month
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Competitors</p>
                    <p className="text-2xl font-bold">
                      {marketData.competitive_landscape?.competitors?.length || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Penetration Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Market Penetration Trajectory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trajectoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        if (name === 'marketShare') return [formatMarketPercent(value), 'Market Share'];
                        if (name === 'marketBasedVolume') return [Math.round(value).toLocaleString(), 'Monthly Volume'];
                        return [formatMarketCurrency(value, currency), name];
                      }}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="som" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    <Line yAxisId="right" type="monotone" dataKey="marketShare" stroke="#ff7300" strokeWidth={3} />
                    <Bar yAxisId="right" dataKey="marketBasedVolume" fill="#82ca9d" opacity={0.7} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market-size" className="space-y-6">
          {/* TAM/SAM/SOM Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Total Addressable Market</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold">{formatMarketCurrency(currentMetrics?.tam || 0, currency)}</p>
                    <p className="text-sm text-muted-foreground">Current year</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold">{formatMarketCurrency(year3Metrics?.tam || 0, currency)}</p>
                    <p className="text-sm text-muted-foreground">Year 3 projection</p>
                  </div>
                  <Badge variant="outline">
                    {formatMarketPercent((marketData.market_sizing?.total_addressable_market?.growth_rate?.value || 0) / 100)} annual growth
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Serviceable Addressable Market</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold">{formatMarketCurrency(currentMetrics?.sam || 0, currency)}</p>
                    <p className="text-sm text-muted-foreground">Current year</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold">{formatMarketCurrency(year3Metrics?.sam || 0, currency)}</p>
                    <p className="text-sm text-muted-foreground">Year 3 projection</p>
                  </div>
                  <Badge variant="outline">
                    {formatMarketPercent((marketData.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.value || 0) / 100)} of TAM
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">Serviceable Obtainable Market</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold">{formatMarketCurrency(currentMetrics?.som || 0, currency)}</p>
                    <p className="text-sm text-muted-foreground">Current year</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold">{formatMarketCurrency(year3Metrics?.som || 0, currency)}</p>
                    <p className="text-sm text-muted-foreground">Year 3 projection</p>
                  </div>
                  <Badge variant="outline">
                    {formatMarketPercent((marketData.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.value || 0) / 100)} of SAM
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Size Evolution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Market Size Evolution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trajectoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [formatMarketCurrency(value, currency), 'Market Size']} />
                    <Area type="monotone" dataKey="tam" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="sam" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                    <Area type="monotone" dataKey="som" stackId="3" stroke="#ffc658" fill="#ffc658" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitive" className="space-y-6">
          {/* Competitive Landscape */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Share Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Our Target Share', value: (marketData.market_share?.target_position?.target_share?.value || 0) },
                          ...(currentMetrics?.competitivePosition.competitorShares.map(comp => ({
                            name: comp.name,
                            value: comp.share * 100
                          })) || []),
                          { 
                            name: 'Other Players', 
                            value: 100 - (marketData.market_share?.target_position?.target_share?.value || 0) - 
                                   (currentMetrics?.competitivePosition.competitorShares.reduce((sum, comp) => sum + comp.share * 100, 0) || 0)
                          }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, value}) => `${name}: ${value.toFixed(1)}%`}
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Competitive Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Market Concentration</Label>
                    <p className="text-lg">{(currentMetrics?.competitivePosition.marketConcentration || 0).toFixed(3)}</p>
                    <p className="text-xs text-muted-foreground">
                      {(currentMetrics?.competitivePosition.marketConcentration || 0) > 0.25 ? 'Highly concentrated' : 
                       (currentMetrics?.competitivePosition.marketConcentration || 0) > 0.15 ? 'Moderately concentrated' : 'Fragmented'}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Barriers to Entry</Label>
                    <Badge variant="outline" className="ml-2">
                      {marketData.competitive_landscape?.market_structure?.barriers_to_entry || 'Not specified'}
                    </Badge>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Market Structure</Label>
                    <Badge variant="outline" className="ml-2">
                      {marketData.competitive_landscape?.market_structure?.concentration_level || 'Not specified'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Competitor Details */}
          {marketData.competitive_landscape?.competitors && marketData.competitive_landscape.competitors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Competitor Profiles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {marketData.competitive_landscape.competitors.map((competitor, index) => (
                    <Card key={index} className="border">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold">{competitor.name}</h4>
                            <Badge variant={competitor.threat_level === 'high' ? 'destructive' : 
                                          competitor.threat_level === 'medium' ? 'default' : 'secondary'}>
                              {competitor.threat_level} threat
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{competitor.positioning}</p>
                          <div className="flex justify-between text-sm">
                            <span>Market Share:</span>
                            <span className="font-medium">{formatMarketPercent((competitor.market_share?.value || 0) / 100)}</span>
                          </div>
                          {competitor.strengths.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-green-600">Strengths:</p>
                              <ul className="text-xs text-muted-foreground list-disc list-inside">
                                {competitor.strengths.slice(0, 2).map((strength, i) => (
                                  <li key={i}>{strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="projections" className="space-y-6">
          {/* Volume Projections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Volume Projections
                <Select value={selectedTimeframe.toString()} onValueChange={(value) => setSelectedTimeframe(parseInt(value))}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="36">3 Years (36 months)</SelectItem>
                    <SelectItem value="60">5 Years (60 months)</SelectItem>
                    <SelectItem value="84">7 Years (84 months)</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trajectoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        if (name === 'marketBasedVolume') return [Math.round(value).toLocaleString(), 'Monthly Volume'];
                        if (name === 'cumulativeVolume') return [Math.round(value).toLocaleString(), 'Cumulative Volume'];
                        if (name === 'marketShare') return [formatMarketPercent(value), 'Market Share'];
                        return [value, name];
                      }}
                    />
                    <Bar yAxisId="left" dataKey="marketBasedVolume" fill="#8884d8" />
                    <Line yAxisId="right" type="monotone" dataKey="cumulativeVolume" stroke="#ff7300" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="marketShare" stroke="#00ff00" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Volume Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Volume Summary by Year</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Year</th>
                      <th className="text-right p-2">Average Monthly Volume</th>
                      <th className="text-right p-2">Total Annual Volume</th>
                      <th className="text-right p-2">Market Share</th>
                      <th className="text-right p-2">Market Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({length: Math.ceil(selectedTimeframe / 12)}, (_, yearIndex) => {
                      const yearData = trajectoryData.filter(d => Math.floor((d.period - 1) / 12) === yearIndex);
                      const avgVolume = yearData.reduce((sum, d) => sum + d.marketBasedVolume, 0) / yearData.length;
                      const totalVolume = yearData.reduce((sum, d) => sum + d.marketBasedVolume, 0);
                      const avgShare = yearData.reduce((sum, d) => sum + d.marketShare, 0) / yearData.length;
                      const avgValue = yearData.reduce((sum, d) => sum + d.marketValue, 0) / yearData.length;
                      
                      return (
                        <tr key={yearIndex} className="border-b">
                          <td className="p-2">Year {yearIndex + 1}</td>
                          <td className="text-right p-2">{Math.round(avgVolume).toLocaleString()}</td>
                          <td className="text-right p-2">{Math.round(totalVolume).toLocaleString()}</td>
                          <td className="text-right p-2">{formatMarketPercent(avgShare)}</td>
                          <td className="text-right p-2">{formatMarketCurrency(avgValue, currency)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunity" className="space-y-6">
          {/* Opportunity Score */}
          {opportunityScore && (
            <Card>
              <CardHeader>
                <CardTitle>Market Opportunity Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-6xl font-bold mb-4 text-blue-600">{opportunityScore.score}</div>
                    <div className="text-lg text-muted-foreground mb-4">out of 100</div>
                    <Badge variant={opportunityScore.score >= 75 ? 'default' : 
                                  opportunityScore.score >= 60 ? 'secondary' : 'outline'} 
                           className="text-sm">
                      {opportunityScore.interpretation}
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Market Size</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{width: `${(opportunityScore.breakdown.marketSize / 25) * 100}%`}}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{opportunityScore.breakdown.marketSize}/25</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Market Growth</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{width: `${(opportunityScore.breakdown.marketGrowth / 25) * 100}%`}}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{opportunityScore.breakdown.marketGrowth}/25</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Competitive Position</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{width: `${(opportunityScore.breakdown.competitivePosition / 25) * 100}%`}}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{opportunityScore.breakdown.competitivePosition}/25</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Market Barriers</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full" 
                            style={{width: `${(opportunityScore.breakdown.barriers / 25) * 100}%`}}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{opportunityScore.breakdown.barriers}/25</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Market Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-green-600">Growth Drivers</h4>
                  <div className="space-y-2">
                    {marketData.market_dynamics?.growth_drivers?.map((driver, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span className="text-sm">{driver.driver}</span>
                        <Badge variant={driver.impact === 'high' ? 'default' : 
                                      driver.impact === 'medium' ? 'secondary' : 'outline'}>
                          {driver.impact}
                        </Badge>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">No growth drivers specified</p>}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-red-600">Market Risks</h4>
                  <div className="space-y-2">
                    {marketData.market_dynamics?.market_risks?.map((risk, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <span className="text-sm">{risk.risk}</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            P: {risk.probability}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            I: {risk.impact}
                          </Badge>
                        </div>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">No market risks specified</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-800">Volume Validation</h5>
                  <p className="text-sm text-blue-700">
                    Use the projected monthly volumes ({Math.round(year1Metrics?.marketBasedVolume || 0).toLocaleString()} in Year 1) 
                    to validate your business case volume assumptions.
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <h5 className="font-medium text-green-800">Market Timing</h5>
                  <p className="text-sm text-green-700">
                    Consider the market penetration strategy ({marketData.market_share?.target_position?.penetration_strategy}) 
                    when planning your market entry and scaling timeline.
                  </p>
                </div>
                
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <h5 className="font-medium text-yellow-800">Competitive Response</h5>
                  <p className="text-sm text-yellow-700">
                    Monitor competitors closely as your market share grows. 
                    Plan for competitive responses especially from high-threat competitors.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
