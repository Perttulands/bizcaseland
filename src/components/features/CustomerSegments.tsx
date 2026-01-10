import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Users, 
  TrendingUp, 
  Info, 
  Target, 
  Calendar, 
  Brain, 
  Eye, 
  Heart,
  Zap,
  Shield,
  Star,
  Award,
  PieChart as PieIcon,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  Activity,
  Lightbulb,
  Trophy
} from 'lucide-react';
import { BusinessData } from '@/core/types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { calculateSegmentVolumeForMonth } from '@/core/engine';

interface CustomerSegmentsProps {
  data: BusinessData;
}

interface VolumeProjection {
  month: number;
  total: number;
  segments: Record<string, number>;
}

export function CustomerSegments({ data }: CustomerSegmentsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.meta.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getGrowthPatternDescription = (patternTypeOrSegment: string | any) => {
    // Handle direct pattern type string
    if (typeof patternTypeOrSegment === 'string') {
      switch (patternTypeOrSegment) {
        case 'geom_growth':
          return 'Geometric';
        case 'seasonal_growth':
          return 'Seasonal';
        case 'linear_growth':
          return 'Linear';
        default:
          return 'Custom';
      }
    }
    
    // Handle full segment object
    const segment = patternTypeOrSegment;
    if (!segment.volume) return 'No pattern';
    
    const { type, pattern_type } = segment.volume;
    
    if (type === 'pattern') {
      switch (pattern_type) {
        case 'geom_growth':
          return 'Geometric growth (compound monthly growth rate)';
        case 'seasonal_growth':
          return 'Seasonal pattern (yearly cycles with optional growth)';
        case 'linear_growth':
          return 'Linear growth (fixed monthly increase)';
        default:
          return 'Custom growth pattern';
      }
    } else if (type === 'time_series') {
      return 'Custom time series data';
    }
    
    return 'Growth pattern not specified';
  };

  // Calculate volume projections for visualization using centralized calculations
  const calculateVolumeProjections = (): VolumeProjection[] => {
    const projections: VolumeProjection[] = [];
    const segments = data.assumptions?.customers?.segments || [];
    
    // Generate projections for the specified periods
    const periods = data.meta?.periods || 60;
    for (let month = 0; month < periods; month++) {
      const projection: VolumeProjection = {
        month: month + 1,
        total: 0,
        segments: {}
      };

      segments.forEach((segment) => {
        // Use centralized calculation function
        const segmentVolume = calculateSegmentVolumeForMonth(segment, month, data);
        projection.segments[segment.id] = Math.max(0, Math.round(segmentVolume));
        projection.total += projection.segments[segment.id];
      });

      projections.push(projection);
    }

    return projections;
  };

  const volumeProjections = calculateVolumeProjections();
  
  // Prepare chart data (show first 24 months)
  const chartData = volumeProjections.slice(0, 24).map(p => ({
    month: `M${p.month}`,
    total: p.total,
    ...p.segments
  }));

  const segments = data.assumptions?.customers?.segments || [];
  const totalStartVolume = segments.reduce((sum, segment) => {
    return sum + (segment.volume?.series?.[0]?.value || 0);
  }, 0);

  const totalYear5Volume = volumeProjections[Math.min(59, volumeProjections.length - 1)]?.total || 0;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Customer Segments & Volume Projection</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Build the demand side of your business case by defining customer segments and their volume growth patterns over time.
          </p>
        </CardHeader>
      </Card>

      {/* Volume Overview */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Volume Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-muted/30 border-l-4 border-l-financial-primary">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-financial-primary" />
                  <h4 className="font-medium text-sm">Starting Volume (Month 1)</h4>
                </div>
                <div className="text-2xl font-bold text-financial-success">
                  {totalStartVolume.toLocaleString()} {data.meta?.business_model === 'recurring' ? 'accounts' : 'units'}
                </div>
                <Badge variant="outline" className="text-xs mt-2">
                  {segments.length} segment{segments.length !== 1 ? 's' : ''}
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-l-4 border-l-financial-secondary">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-financial-secondary" />
                  <h4 className="font-medium text-sm">Projected Volume (Year 5)</h4>
                </div>
                <div className="text-2xl font-bold text-financial-success">
                  {totalYear5Volume.toLocaleString()} {data.meta?.business_model === 'recurring' ? 'accounts' : 'units'}
                </div>
                <Badge variant="outline" className="text-xs mt-2">
                  {totalYear5Volume > 0 && totalStartVolume > 0 
                    ? `${((totalYear5Volume / totalStartVolume - 1) * 100).toFixed(0)}% growth`
                    : 'No growth data'
                  }
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-l-4 border-l-financial-accent">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-financial-accent" />
                  <h4 className="font-medium text-sm">Total Revenue Potential</h4>
                </div>
                <div className="text-2xl font-bold text-financial-success">
                  {formatCurrency(totalYear5Volume * (data.assumptions?.pricing?.avg_unit_price?.value || 0))}
                </div>
                <Badge variant="outline" className="text-xs mt-2">Annual (Year 5)</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Volume Growth Chart */}
          <div className="h-64 w-full">
            <h4 className="font-medium mb-4">24-Month Volume Projection</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value: any, name: string) => [
                    `${Number(value).toLocaleString()} ${data.meta?.business_model === 'recurring' ? 'accounts' : 'units'}`,
                    name === 'total' ? 'Total Volume' : `${name} segment`
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--financial-primary))" 
                  strokeWidth={3}
                  name="Total Volume"
                />
                {segments.map((segment, index) => (
                  <Line
                    key={segment.id}
                    type="monotone"
                    dataKey={segment.id}
                    stroke={`hsl(${200 + index * 30}, 70%, 50%)`}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name={segment.label}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Customer Insights with Wow Effect */}
      {segments.some(segment => segment.psychographics || segment.market_positioning) && (
        <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-3">
              <Brain className="h-6 w-6" />
              <span className="text-xl">Customer Intelligence Dashboard</span>
              <Badge className="bg-white/20 text-white border-white/30">AI-Powered Insights</Badge>
            </CardTitle>
            <p className="text-blue-100 mt-2">Deep customer understanding through behavioral analysis and market positioning</p>
          </CardHeader>
          <CardContent className="p-6">
            
            {/* Psychographic Insights Grid */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <Heart className="h-5 w-5 text-pink-600" />
                <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Psychographic DNA Analysis
                </span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Values Radar Chart */}
                <Card className="bg-white/60 backdrop-blur-sm border border-purple-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-center mb-3 flex items-center justify-center space-x-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      <span>Core Values Spectrum</span>
                    </h4>
                    {(() => {
                      const allValues = segments.flatMap(s => s.psychographics?.values || []);
                      const valueCounts = allValues.reduce((acc, value) => {
                        acc[value] = (acc[value] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      
                      const radarData = Object.entries(valueCounts).map(([value, count]) => ({
                        value: value.charAt(0).toUpperCase() + value.slice(1),
                        score: (count / segments.length) * 100
                      }));
                      
                      if (radarData.length === 0) return (
                        <div className="text-center text-muted-foreground text-sm">
                          No values data available
                        </div>
                      );
                      
                      return (
                        <ResponsiveContainer width="100%" height={200}>
                          <RadarChart data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="value" tick={{ fontSize: 11 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                            <Radar
                              name="Values"
                              dataKey="score"
                              stroke="#8b5cf6"
                              fill="#8b5cf6"
                              fillOpacity={0.3}
                              strokeWidth={2}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Behavior Patterns */}
                <Card className="bg-white/60 backdrop-blur-sm border border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-center mb-3 flex items-center justify-center space-x-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span>Behavior Patterns</span>
                    </h4>
                    <div className="space-y-2">
                      {segments.map((segment, idx) => (
                        segment.psychographics?.behaviors?.map((behavior, bidx) => (
                          <div key={`${idx}-${bidx}`} className="flex items-center space-x-2 text-sm">
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${
                              bidx % 3 === 0 ? 'from-blue-400 to-blue-600' :
                              bidx % 3 === 1 ? 'from-purple-400 to-purple-600' :
                              'from-pink-400 to-pink-600'
                            }`} />
                            <span className="capitalize">{behavior}</span>
                          </div>
                        ))
                      )).flat()}
                    </div>
                  </CardContent>
                </Card>

                {/* Pain Points Analysis */}
                <Card className="bg-white/60 backdrop-blur-sm border border-red-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-center mb-3 flex items-center justify-center space-x-2">
                      <Shield className="h-4 w-4 text-red-600" />
                      <span>Pain Point Matrix</span>
                    </h4>
                    <div className="space-y-2">
                      {segments.map((segment, idx) => (
                        segment.psychographics?.pain_points?.map((pain, pidx) => (
                          <div key={`${idx}-${pidx}`} className="bg-red-50 rounded-lg p-2 border-l-2 border-red-400">
                            <div className="text-xs font-medium text-red-800 mb-1">{segment.label}</div>
                            <div className="text-xs text-red-600">{pain}</div>
                          </div>
                        ))
                      )).flat()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Market Positioning Intelligence */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Strategic Market Positioning
                </span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Market Share Distribution */}
                <Card className="bg-white/60 backdrop-blur-sm border border-green-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-center mb-3 flex items-center justify-center space-x-2">
                      <PieIcon className="h-4 w-4 text-green-600" />
                      <span>Market Share Potential</span>
                    </h4>
                    {(() => {
                      const marketData = segments
                        .filter(s => s.market_positioning?.size_percentage)
                        .map((segment, idx) => ({
                          name: segment.label,
                          value: segment.market_positioning.size_percentage,
                          fill: `hsl(${idx * 137.5 % 360}, 70%, 50%)`
                        }));
                      
                      if (marketData.length === 0) return (
                        <div className="text-center text-muted-foreground text-sm">
                          No market sizing data available
                        </div>
                      );
                      
                      return (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={marketData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {marketData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              formatter={(value) => [`${value}%`, 'Market Share']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Competitive Intensity Heatmap */}
                <Card className="bg-white/60 backdrop-blur-sm border border-orange-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-center mb-3 flex items-center justify-center space-x-2">
                      <Gauge className="h-4 w-4 text-orange-600" />
                      <span>Competitive Landscape</span>
                    </h4>
                    <div className="space-y-3">
                      {segments.map((segment, idx) => {
                        if (!segment.market_positioning?.competitive_intensity) return null;
                        
                        const intensity = segment.market_positioning.competitive_intensity;
                        const intensityScore = 
                          intensity === 'very high' ? 95 :
                          intensity === 'high' ? 75 :
                          intensity === 'medium' ? 50 :
                          intensity === 'low' ? 25 : 10;
                        
                        const color = 
                          intensityScore >= 80 ? 'bg-red-500' :
                          intensityScore >= 60 ? 'bg-orange-500' :
                          intensityScore >= 40 ? 'bg-yellow-500' :
                          intensityScore >= 20 ? 'bg-blue-500' : 'bg-green-500';
                        
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium">{segment.label}</span>
                              <span className="capitalize">{intensity}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${color} transition-all duration-300`}
                                style={{ width: `${intensityScore}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Value Drivers Intelligence */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  Value Driver Optimization
                </span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {segments.map((segment, idx) => {
                  if (!segment.market_positioning?.value_drivers) return null;
                  
                  return (
                    <Card key={idx} className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <Trophy className="h-4 w-4 text-yellow-600" />
                          <h4 className="font-semibold text-sm">{segment.label}</h4>
                        </div>
                        <div className="space-y-2">
                          {segment.market_positioning.value_drivers.map((driver, didx) => (
                            <div key={didx} className="flex items-center space-x-2">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs font-medium">{driver}</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Growth Trend Indicator */}
                        {segment.market_positioning.growth_trend && (
                          <div className="mt-3 pt-2 border-t border-yellow-200">
                            <div className="flex items-center space-x-2">
                              {segment.market_positioning.growth_trend === 'expanding' ? 
                                <ArrowUpRight className="h-3 w-3 text-green-600" /> :
                                segment.market_positioning.growth_trend === 'steady' ?
                                <ArrowDownRight className="h-3 w-3 text-blue-600" /> :
                                <Eye className="h-3 w-3 text-gray-600" />
                              }
                              <span className="text-xs font-medium capitalize">
                                {segment.market_positioning.growth_trend} Market
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Strategic Insights Summary */}
            <Card className="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Strategic Insights & Recommendations
                  </span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-2">Key Opportunities</h4>
                    <ul className="space-y-1 text-sm text-purple-700">
                      {segments.filter(s => s.market_positioning?.growth_trend === 'expanding').length > 0 && (
                        <li className="flex items-center space-x-2">
                          <ArrowUpRight className="h-3 w-3 text-green-600" />
                          <span>{segments.filter(s => s.market_positioning?.growth_trend === 'expanding').length} expanding market segment(s)</span>
                        </li>
                      )}
                      {segments.filter(s => s.market_positioning?.competitive_intensity === 'low' || s.market_positioning?.competitive_intensity === 'medium').length > 0 && (
                        <li className="flex items-center space-x-2">
                          <Shield className="h-3 w-3 text-blue-600" />
                          <span>Lower competition in {segments.filter(s => s.market_positioning?.competitive_intensity === 'low' || s.market_positioning?.competitive_intensity === 'medium').length} segment(s)</span>
                        </li>
                      )}
                      <li className="flex items-center space-x-2">
                        <Target className="h-3 w-3 text-orange-600" />
                        <span>Total addressable market: {segments.reduce((sum, s) => sum + (s.market_positioning?.size_percentage || 0), 0)}% share potential</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-2">Risk Factors</h4>
                    <ul className="space-y-1 text-sm text-purple-700">
                      {segments.filter(s => s.market_positioning?.competitive_intensity === 'very high' || s.market_positioning?.competitive_intensity === 'high').length > 0 && (
                        <li className="flex items-center space-x-2">
                          <Gauge className="h-3 w-3 text-red-600" />
                          <span>High competition in {segments.filter(s => s.market_positioning?.competitive_intensity === 'very high' || s.market_positioning?.competitive_intensity === 'high').length} segment(s)</span>
                        </li>
                      )}
                      {segments.flatMap(s => s.psychographics?.pain_points || []).length > 0 && (
                        <li className="flex items-center space-x-2">
                          <Shield className="h-3 w-3 text-yellow-600" />
                          <span>{segments.flatMap(s => s.psychographics?.pain_points || []).length} identified pain points to address</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Customer Segments Details */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Customer Segments</span>
            <Badge variant="secondary">{segments.length} segments</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {segments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No customer segments defined in the business data.</p>
              <p className="text-sm">Customer segments drive the volume side of your business case.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {segments.map((segment, index) => (
                <Card key={segment.id} className="bg-muted/30 border-l-4 border-l-financial-primary">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">{segment.label}</h4>
                          <Badge variant="outline" className="mt-1">{getGrowthPatternDescription(segment.volume?.pattern_type)}</Badge>
                        </div>
                        <TooltipProvider>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-sm">
                              <p className="text-xs">{segment.rationale}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Growth Pattern:</span>
                          <Badge variant="secondary" className="text-xs">
                            {getGrowthPatternDescription(segment)}
                          </Badge>
                        </div>

                        {segment.volume?.series?.[0] && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Starting Volume:</span>
                            <span className="font-medium">
                              {segment.volume.series[0].value?.toLocaleString() || 0} {segment.volume.series[0].unit}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">5-Year Projection:</span>
                          <span className="font-medium text-financial-success">
                            {(volumeProjections[Math.min(59, volumeProjections.length - 1)]?.segments[segment.id] || 0).toLocaleString()} {data.meta?.business_model === 'recurring' ? 'accounts' : 'units'}
                          </span>
                        </div>
                      </div>

                      {segment.volume?.series?.[0]?.rationale && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            <strong>Rationale:</strong> {segment.volume.series[0].rationale}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}