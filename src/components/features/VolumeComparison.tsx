import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, ArrowRight, BarChart3, Calculator, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import { Textarea } from '@/components/ui/textarea';
import { MarketAnalysisTemplate } from '@/modules/market-analysis/components/MarketAnalysisTemplate';
import { 
  MarketData,
  getMarketPenetrationTrajectory,
  formatMarketCurrency,
  formatMarketPercent
} from '@/core/engine';
import { useBusinessData } from '@/core/contexts';
import { generateMonthlyData } from '@/core/engine';

interface VolumeProjection {
  period: number;
  year: number;
  businessCaseVolume: number;
  marketBasedVolume: number;
  difference: number;
  differencePercent: number;
}

export function VolumeComparison() {
  const { data: businessData } = useBusinessData();
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [analysisTimeframe, setAnalysisTimeframe] = useState<number>(60); // months

  // Generate comparison data
  const comparisonData = useMemo((): VolumeProjection[] => {
    if (!businessData || !marketData) return [];

    // Get business case monthly data
    const monthlyData = generateMonthlyData(businessData);
    
    // Get market-based projections
    const marketTrajectory = getMarketPenetrationTrajectory(marketData, analysisTimeframe);
    
    // Create comparison dataset
    const comparison: VolumeProjection[] = [];
    const maxPeriods = Math.min(monthlyData.length, marketTrajectory.length, analysisTimeframe);
    
    for (let i = 0; i < maxPeriods; i++) {
      const businessVolume = monthlyData[i]?.salesVolume || 0;
      const marketVolume = marketTrajectory[i]?.marketBasedVolume || 0;
      const difference = businessVolume - marketVolume;
      const differencePercent = marketVolume > 0 ? (difference / marketVolume) * 100 : 0;
      
      comparison.push({
        period: i + 1,
        year: Math.floor(i / 12) + 1,
        businessCaseVolume: businessVolume,
        marketBasedVolume: marketVolume,
        difference,
        differencePercent
      });
    }
    
    return comparison;
  }, [businessData, marketData, analysisTimeframe]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (comparisonData.length === 0) return null;

    const year1Data = comparisonData.slice(0, 12);
    const year3Data = comparisonData.slice(0, 36);
    
    const year1BusinessTotal = year1Data.reduce((sum, d) => sum + d.businessCaseVolume, 0);
    const year1MarketTotal = year1Data.reduce((sum, d) => sum + d.marketBasedVolume, 0);
    const year3BusinessTotal = year3Data.reduce((sum, d) => sum + d.businessCaseVolume, 0);
    const year3MarketTotal = year3Data.reduce((sum, d) => sum + d.marketBasedVolume, 0);
    
    const avgDifference = comparisonData.reduce((sum, d) => sum + Math.abs(d.differencePercent), 0) / comparisonData.length;
    
    return {
      year1: {
        businessTotal: year1BusinessTotal,
        marketTotal: year1MarketTotal,
        difference: year1BusinessTotal - year1MarketTotal,
        differencePercent: year1MarketTotal > 0 ? ((year1BusinessTotal - year1MarketTotal) / year1MarketTotal) * 100 : 0
      },
      year3: {
        businessTotal: year3BusinessTotal,
        marketTotal: year3MarketTotal,
        difference: year3BusinessTotal - year3MarketTotal,
        differencePercent: year3MarketTotal > 0 ? ((year3BusinessTotal - year3MarketTotal) / year3MarketTotal) * 100 : 0
      },
      avgAbsDifference: avgDifference
    };
  }, [comparisonData]);

  const handleMarketDataLoad = (data: any) => {
    setMarketData(data as MarketData);
  };

  const exportComparison = () => {
    if (!comparisonData.length) return;
    
    const csv = [
      'Period,Year,Month,Business Case Volume,Market Based Volume,Difference,Difference %',
      ...comparisonData.map(d => 
        `${d.period},${d.year},${((d.period - 1) % 12) + 1},${d.businessCaseVolume},${d.marketBasedVolume},${d.difference},${d.differencePercent.toFixed(2)}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'volume-comparison.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!businessData) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No Business Case Data</h3>
            <p className="text-muted-foreground">Please load business case data first to enable volume comparison.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!marketData) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Volume Comparison Tool</h1>
          <p className="text-muted-foreground">
            Compare volume projections between your business case and market analysis
          </p>
        </div>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <BarChart3 className="h-5 w-5" />
              <span className="font-semibold">Business Case Data Loaded</span>
            </div>
            <p className="text-sm text-green-700">
              Your business case data is ready. Now load market analysis data to compare volume projections.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
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
                    handleMarketDataLoad(data);
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

  const currency = businessData.meta?.currency || marketData.meta?.currency || 'EUR';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Volume Comparison Analysis</h1>
          <p className="text-muted-foreground">
            Compare volume assumptions between business case and market analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportComparison}>
            <Download className="h-4 w-4 mr-2" />
            Export Comparison
          </Button>
          <Button variant="outline" onClick={() => setMarketData(null)}>
            <Calculator className="h-4 w-4 mr-2" />
            Load New Market Data
          </Button>
        </div>
      </div>

      {/* Data Source Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Business Case Analysis</span>
            </div>
            <p className="text-sm text-blue-700 mb-2">
              <strong>{businessData.meta?.title || 'Business Case'}</strong>
            </p>
            <p className="text-xs text-blue-600">
              Figure-based volume projections with {businessData.assumptions?.customers?.segments?.length || 0} customer segments
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">Market Analysis</span>
            </div>
            <p className="text-sm text-green-700 mb-2">
              <strong>{marketData.meta?.title || 'Market Analysis'}</strong>
            </p>
            <p className="text-xs text-green-600">
              Market-based volume projections from TAM/SAM/SOM analysis
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Detailed Comparison</TabsTrigger>
          <TabsTrigger value="analysis">Gap Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Statistics */}
          {summaryStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Year 1 Business Case</p>
                    <p className="text-2xl font-bold">{summaryStats.year1.businessTotal.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total units</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Year 1 Market Based</p>
                    <p className="text-2xl font-bold">{Math.round(summaryStats.year1.marketTotal).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total units</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Year 1 Difference</p>
                    <p className={`text-2xl font-bold ${summaryStats.year1.differencePercent > 20 ? 'text-red-600' : 
                                    summaryStats.year1.differencePercent > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {summaryStats.year1.differencePercent > 0 ? '+' : ''}{summaryStats.year1.differencePercent.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Business vs Market</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Avg Difference</p>
                    <p className={`text-2xl font-bold ${summaryStats.avgAbsDifference > 30 ? 'text-red-600' : 
                                    summaryStats.avgAbsDifference > 15 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {summaryStats.avgAbsDifference.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Average absolute</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Volume Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Volume Projection Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        if (name === 'businessCaseVolume') return [Math.round(value).toLocaleString(), 'Business Case'];
                        if (name === 'marketBasedVolume') return [Math.round(value).toLocaleString(), 'Market Based'];
                        return [value, name];
                      }}
                    />
                    <Bar dataKey="businessCaseVolume" fill="#3b82f6" name="businessCaseVolume" />
                    <Bar dataKey="marketBasedVolume" fill="#10b981" name="marketBasedVolume" opacity={0.7} />
                    <Line type="monotone" dataKey="differencePercent" stroke="#ef4444" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          {/* Detailed Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Volume Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Period</th>
                      <th className="text-left p-2">Year</th>
                      <th className="text-right p-2">Business Case</th>
                      <th className="text-right p-2">Market Based</th>
                      <th className="text-right p-2">Difference</th>
                      <th className="text-right p-2">Difference %</th>
                      <th className="text-center p-2">Alignment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.slice(0, 36).map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{row.period}</td>
                        <td className="p-2">Year {row.year}</td>
                        <td className="text-right p-2">{Math.round(row.businessCaseVolume).toLocaleString()}</td>
                        <td className="text-right p-2">{Math.round(row.marketBasedVolume).toLocaleString()}</td>
                        <td className={`text-right p-2 ${row.difference > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {row.difference > 0 ? '+' : ''}{Math.round(row.difference).toLocaleString()}
                        </td>
                        <td className={`text-right p-2 ${Math.abs(row.differencePercent) > 20 ? 'text-red-600 font-bold' : 
                                        Math.abs(row.differencePercent) > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {row.differencePercent > 0 ? '+' : ''}{row.differencePercent.toFixed(1)}%
                        </td>
                        <td className="text-center p-2">
                          <Badge variant={Math.abs(row.differencePercent) <= 10 ? 'default' : 
                                        Math.abs(row.differencePercent) <= 20 ? 'secondary' : 'destructive'}>
                            {Math.abs(row.differencePercent) <= 10 ? 'Good' : 
                             Math.abs(row.differencePercent) <= 20 ? 'Fair' : 'Poor'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {/* Gap Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Gap Analysis Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summaryStats && (
                  <>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Volume Trajectory Analysis</h4>
                      <p className="text-sm text-blue-700">
                        Your business case projects {summaryStats.year1.differencePercent > 0 ? 'higher' : 'lower'} volumes 
                        than market analysis suggests. Year 1 difference: {Math.abs(summaryStats.year1.differencePercent).toFixed(1)}%
                        {summaryStats.year1.differencePercent > 0 ? ' above' : ' below'} market expectations.
                      </p>
                    </div>

                    {Math.abs(summaryStats.year1.differencePercent) > 20 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-2">⚠️ Significant Gap Detected</h4>
                        <p className="text-sm text-red-700">
                          There's a substantial difference between your business case and market analysis projections. 
                          Consider reviewing your assumptions or market research data.
                        </p>
                      </div>
                    )}

                    {Math.abs(summaryStats.avgAbsDifference) <= 15 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">✅ Good Alignment</h4>
                        <p className="text-sm text-green-700">
                          Your business case and market analysis show good alignment overall. 
                          Average difference of {summaryStats.avgAbsDifference.toFixed(1)}% suggests well-researched assumptions.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Difference Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Difference Trend Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [`${value.toFixed(1)}%`, 'Difference']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="differencePercent" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summaryStats && (
                  <>
                    {summaryStats.year1.differencePercent > 20 && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 mb-2">📈 Business Case is Optimistic</h4>
                        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                          <li>Consider revising business case volume assumptions downward</li>
                          <li>Review market penetration strategy and timeline</li>
                          <li>Validate customer acquisition capabilities</li>
                          <li>Consider phased market entry approach</li>
                        </ul>
                      </div>
                    )}

                    {summaryStats.year1.differencePercent < -20 && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">📉 Business Case is Conservative</h4>
                        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                          <li>Market analysis suggests higher volume potential</li>
                          <li>Consider increasing business case projections</li>
                          <li>Review competitive advantages and market positioning</li>
                          <li>Explore accelerated growth strategies</li>
                        </ul>
                      </div>
                    )}

                    {Math.abs(summaryStats.avgAbsDifference) <= 15 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">✅ Proceed with Confidence</h4>
                        <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                          <li>Your business case aligns well with market analysis</li>
                          <li>Volume assumptions appear well-researched and realistic</li>
                          <li>Consider using market data for sensitivity analysis</li>
                          <li>Monitor actual performance against both projections</li>
                        </ul>
                      </div>
                    )}
                  </>
                )}

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">🔄 Next Steps</h4>
                  <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                    <li>Document the comparison results and key insights</li>
                    <li>Adjust business case assumptions if significant gaps exist</li>
                    <li>Use market data ranges for sensitivity analysis</li>
                    <li>Plan regular reviews to validate assumptions</li>
                    <li>Consider creating optimistic/pessimistic scenarios</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
