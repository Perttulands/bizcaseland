import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  Target, 
  TrendingUp, 
  Users, 
  Trophy,
  Lightbulb,
  Download,
  Upload,
  RefreshCw,
  ArrowLeft,
  Calculator,
  FileText,
  BarChart3,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { useMarketData, useNavigation } from '@/core/contexts';
import { MarketData } from '@/core/types';
import { MarketSuiteMetrics, calculateSuiteMetrics, validateMarketSuiteData } from '@/core/engine/calculators/market-suite-calculations';
import { ThemeToggle } from '@/components/features/ThemeToggle';
import { AICopilotSidebar, AICopilotToggle } from '@/components/features/AIChatSidebar';

// Import all market analysis modules
import { MarketSizingModule } from './modules/MarketSizingModule';
import { CompetitiveIntelligenceModule } from './modules/CompetitiveIntelligenceModule';
import { CompetitorMatrixGenerator } from './modules/CompetitorMatrixGenerator';
import { CustomerAnalysisModule } from './modules/CustomerAnalysisModule';
import { StrategicPlanningModule } from './modules/StrategicPlanningModule';
import { OpportunityAssessmentModule } from './modules/OpportunityAssessmentModule';
import { DataManagementModule } from './modules/DataManagementModule';
import { MarketAssumptionsTab } from './MarketAssumptionsTab';

export interface MarketAnalysisSuiteProps {
  onExportResults?: (data: any) => void;
  onImportData?: (data: any) => void;
  className?: string;
}

export function MarketAnalysisSuite({ onExportResults, onImportData, className }: MarketAnalysisSuiteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: marketData, updateData: updateMarketData, clearData } = useMarketData();
  const { syncFromStorage } = useNavigation();
  const [inputJson, setInputJson] = useState('');
  const [isValidJson, setIsValidJson] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Initialize activeTab - check for navigation state first, then default based on data
  const getInitialTab = () => {
    // Check if navigated from business case with specific tab request
    if (location.state?.initialTab) {
      return location.state.initialTab;
    }
    // Default behavior: show data tab if no data, overview if data exists
    return marketData && Object.keys(marketData).length > 0 ? 'overview' : 'data';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [shouldAutoSwitch, setShouldAutoSwitch] = useState(false);

  // Sync data from localStorage when component mounts
  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  // Handle navigation state changes (e.g., from business case switch button)
  useEffect(() => {
    if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab);
      // Clear the state immediately to prevent it from affecting future navigations
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.initialTab, navigate]);

  // Set initial tab based on data availability (runs after data is loaded)
  useEffect(() => {
    if (marketData && Object.keys(marketData).length > 0 && shouldAutoSwitch) {
      // Only auto-switch if currently on data tab
      if (activeTab === 'data') {
        setActiveTab('overview');
      }
      setShouldAutoSwitch(false);
    }
  }, [marketData, shouldAutoSwitch]); // Only respond to data changes and auto-switch flag

  // Calculate suite metrics from market data
  const suiteMetrics = useMemo(() => 
    marketData ? calculateSuiteMetrics(marketData) : null,
    [marketData]
  );

  // Validate market data
  const validation = useMemo(() => 
    marketData ? validateMarketSuiteData(marketData) : null,
    [marketData]
  );

  // Handler for resetting all data
  const handleResetAllData = () => {
    clearData();
    toast({
      title: "All data cleared",
      description: "Market analysis data has been reset. You can start fresh or load new data.",
    });
  };

  // Handler for updating market data from modules
  const handleDataUpdate = (data: MarketData) => {
    updateMarketData(data);
    syncFromStorage();
  };

  // Sync data from localStorage when component mounts
  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  const moduleConfig = [
    {
      id: 'sizing',
      title: 'Market',
      icon: Target,
      description: 'TAM/SAM/SOM analysis and segmentation',
      color: 'bg-green-500'
    },
    {
      id: 'competitive',
      title: 'Competition',
      icon: Trophy,
      description: 'Competitor analysis and positioning',
      color: 'bg-red-500'
    },
    {
      id: 'ci-matrix',
      title: 'CI Matrix',
      icon: BarChart3,
      description: 'Auto-generate competitor grid from web research',
      color: 'bg-blue-500'
    },
    {
      id: 'customer',
      title: 'Customer',
      icon: Users,
      description: 'Segment scoring and personas',
      color: 'bg-purple-500'
    },
    {
      id: 'strategic',
      title: 'Strategy',
      icon: Lightbulb,
      description: 'Market entry and growth strategies',
      color: 'bg-orange-500'
    },
    {
      id: 'assumptions',
      title: 'Assumptions',
      icon: Calculator,
      description: 'Edit market analysis assumptions',
      color: 'bg-indigo-500'
    },
    {
      id: 'data',
      title: 'Data Management',
      icon: FileText,
      description: 'Import, export, and template tools',
      color: 'bg-gray-500'
    }
  ];

  const handleJsonPaste = (value: string) => {
    setInputJson(value);
    validateJson(value);
  };

  const validateJson = (value: string) => {
    if (!value.trim()) {
      setIsValidJson(null);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      setIsValidJson(true);
    } catch (error) {
      setIsValidJson(false);
      toast({
        title: "Invalid JSON",
        description: "Failed to parse JSON data",
        variant: "destructive",
      });
    }
  };

  const refreshData = () => {
    if (!isValidJson || !inputJson.trim()) {
      toast({
        title: "Cannot Load",
        description: "Please ensure JSON is valid before loading.",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsed = JSON.parse(inputJson);
      updateMarketData(parsed);
      syncFromStorage();
      setShouldAutoSwitch(true); // Signal that we should auto-switch after data load
      
      toast({
        title: "Data Loaded Successfully",
        description: "Market analysis data has been loaded and visualizations are ready.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load JSON data.",
        variant: "destructive",
      });
    }
  };

  const exportData = () => {
    if (!marketData) {
      toast({
        title: "No Data",
        description: "No data available to export.",
        variant: "destructive",
      });
      return;
    }

    const jsonString = JSON.stringify(marketData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Market analysis data exported successfully.",
      variant: "default",
    });
  };

  const loadSampleData = () => {
    const sampleData: MarketData = {
      schema_version: "1.0",
      meta: {
        title: "Sample Market Analysis Project",
        description: "Example market analysis demonstrating comprehensive market research methodology and data structure",
        currency: "EUR",
        base_year: 2024,
        analysis_horizon_years: 5,
        created_date: new Date().toISOString(),
        analyst: "Market Research Team"
      },
      market_sizing: {
        total_addressable_market: {
          base_value: { value: 15000000000, unit: "EUR", rationale: "Global customer service software market size based on Gartner 2024 reports" },
          growth_rate: { value: 12.5, unit: "percentage_per_year", rationale: "AI-driven customer service market growing at 12.5% CAGR through 2029" },
          market_definition: "Software solutions for customer service automation, including chatbots, ticket management, and AI-powered support",
          data_sources: [
            "Gartner Market Research Report 2024",
            "McKinsey AI in Customer Service Analysis",
            "Forrester Customer Experience Technology Report"
          ]
        },
        serviceable_addressable_market: {
          percentage_of_tam: { value: 25, unit: "percentage", rationale: "Focusing on mid-market segment (100-1000 employees) in Europe and North America" },
          geographic_constraints: "European Union and North American markets due to data privacy regulations and language support",
          regulatory_constraints: "GDPR compliance required for EU operations, data localization requirements",
          capability_constraints: "Initial focus on English, German, and French language support"
        },
        serviceable_obtainable_market: {
          percentage_of_sam: { value: 15, unit: "percentage", rationale: "Realistic market capture considering competitive landscape and go-to-market resources" },
          resource_constraints: "Limited to companies requiring 50-500 support agents initially",
          competitive_barriers: "Established players have strong customer relationships and integration ecosystems",
          time_constraints: "5-year market penetration timeline"
        }
      },
      market_share: {
        current_position: {
          current_share: { value: 0.1, unit: "percentage", rationale: "New entrant with pilot customers" },
          market_entry_date: "2024-01-01",
          current_revenue: { value: 500000, unit: "EUR", rationale: "Revenue from pilot program and early adopters" }
        },
        target_position: {
          target_share: { value: 3.5, unit: "percentage", rationale: "Aggressive but achievable target based on product differentiation" },
          target_timeframe: { value: 5, unit: "years", rationale: "5-year strategic plan for market penetration" },
          penetration_strategy: "s_curve",
          key_milestones: [
            { year: 1, milestone: "Product-market fit validation", target_share: 0.2, rationale: "Focus on customer validation and product refinement" },
            { year: 2, milestone: "Market expansion", target_share: 0.8, rationale: "Expand to new geographic markets and customer segments" },
            { year: 3, milestone: "Platform ecosystem", target_share: 1.5, rationale: "Build partner integrations and expand feature set" },
            { year: 4, milestone: "Market consolidation", target_share: 2.5, rationale: "Acquire smaller competitors and strengthen market position" },
            { year: 5, milestone: "Market leadership", target_share: 3.5, rationale: "Establish as top-3 player in target segment" }
          ]
        }
      },
      strategic_planning: {
        market_entry_strategies: [
          {
            name: "Platform-Led Growth",
            type: "platform",
            essence: "Adopt a platform-led growth strategy that leverages strategic partnerships and ecosystem development. Build integrations with major CRM and business platforms to embed our solution within existing customer workflows. Create a marketplace for third-party extensions to expand functionality without internal development costs.\n\nFocus on self-service onboarding and product-led growth mechanics that reduce customer acquisition costs. Implement viral loops through team collaboration features and referral incentives. Develop comprehensive API documentation and developer resources to encourage platform adoption.",
            rationale: "Platform strategy aligns with the SaaS industry trend toward ecosystem plays and reduces go-to-market costs through organic growth channels. The mid-market segment responds well to self-service models, allowing us to scale efficiently. Strategic partnerships with established platforms provide instant credibility and distribution channels that would take years to build independently."
          },
          {
            name: "AI Technology Leadership",
            type: "direct",
            essence: "Differentiate through superior AI and NLP capabilities that deliver measurably better customer service outcomes. Invest heavily in continuous AI model improvement and maintain a 12-18 month technology lead over competitors. Build proprietary training data sets from customer interactions to create defensible moats.\n\nDemonstrate clear ROI through transparent analytics and benchmarking against industry standards. Position as the premium solution for companies that prioritize quality over cost.",
            rationale: "Technology leadership justifies premium pricing and attracts high-value customers who will pay for superior results. The AI advantage compounds over time as we collect more training data. This strategy protects against commoditization and creates sustainable competitive advantages that are difficult to replicate."
          }
        ]
      },
      competitive_landscape: {
        market_structure: {
          concentration_level: "moderately_concentrated",
          concentration_rationale: "Top 5 players control 60% of market, with many smaller specialized players",
          barriers_to_entry: "medium",
          barriers_description: "Technical complexity and customer acquisition costs are moderate barriers"
        },
        competitors: [
          {
            name: "Zendesk",
            market_share: { value: 18, unit: "percentage", rationale: "Market leader with comprehensive platform" },
            positioning: "Full-service customer experience platform with strong market presence",
            strengths: ["Market leadership", "Comprehensive feature set", "Strong brand recognition", "Extensive integrations"],
            weaknesses: ["High complexity", "Premium pricing", "Over-engineered for SMB"],
            threat_level: "high",
            competitive_response: "Focus on superior AI capabilities and simplified deployment"
          },
          {
            name: "Freshworks",
            market_share: { value: 12, unit: "percentage", rationale: "Strong growth in mid-market segment" },
            positioning: "User-friendly alternative targeting growing businesses",
            strengths: ["Intuitive interface", "Competitive pricing", "Good mid-market fit"],
            weaknesses: ["Limited AI capabilities", "Smaller ecosystem", "Geographic limitations"],
            threat_level: "high",
            competitive_response: "Differentiate through advanced AI and better ROI demonstration"
          },
          {
            name: "Intercom",
            market_share: { value: 8, unit: "percentage", rationale: "Strong in conversational customer engagement" },
            positioning: "Conversational customer engagement platform",
            strengths: ["Modern interface", "Strong messaging focus", "Good developer tools"],
            weaknesses: ["Narrow feature set", "High pricing", "Limited traditional ticketing"],
            threat_level: "medium",
            competitive_response: "Combine conversational AI with comprehensive ticket management"
          }
        ],
        competitive_advantages: [
          {
            advantage: "Advanced AI and NLP",
            sustainability: "high",
            rationale: "Proprietary AI models with continuous learning capabilities provide sustainable differentiation"
          },
          {
            advantage: "Rapid deployment",
            sustainability: "medium",
            rationale: "Pre-configured industry templates enable 48-hour deployment vs. 6-month industry average"
          },
          {
            advantage: "Transparent ROI tracking",
            sustainability: "medium",
            rationale: "Built-in analytics provide clear ROI metrics that competitors lack"
          }
        ]
      },
      customer_analysis: {
        market_segments: [
          {
            id: "mid_market_saas",
            name: "Mid-Market SaaS Companies",
            size_percentage: { value: 35, unit: "percentage", rationale: "Largest addressable segment with high growth potential" },
            size_value: { value: 17500000, unit: "EUR", rationale: "35% of €50M SAM" },
            growth_rate: { value: 15, unit: "percentage_per_year", rationale: "SaaS companies growing rapidly and scaling customer support" },
            demographics: "Software companies with 100-500 employees, 10,000-100,000 end customers",
            pain_points: "Scaling customer support while maintaining quality",
            customer_profile: "Mid-market SaaS companies with high growth and modern tech stack",
            value_drivers: ["Scalability", "Automation", "Customer satisfaction metrics", "Cost reduction"],
            entry_strategy: "Product-led growth with freemium tier and self-service onboarding"
          },
          {
            id: "ecommerce_retailers",
            name: "E-commerce Retailers",
            size_percentage: { value: 30, unit: "percentage", rationale: "Large segment with high support volume needs" },
            size_value: { value: 15000000, unit: "EUR", rationale: "30% of €50M SAM" },
            growth_rate: { value: 18, unit: "percentage_per_year", rationale: "E-commerce growth driving increased support needs" },
            demographics: "Online retailers with €10M-€100M annual revenue",
            pain_points: "Handling peak season volumes and multi-channel support",
            customer_profile: "E-commerce retailers with seasonal demand spikes",
            value_drivers: ["Peak season handling", "Multi-channel support", "Order management integration"],
            entry_strategy: "Partnership with e-commerce platforms and integrations"
          },
          {
            id: "financial_services",
            name: "Financial Services",
            size_percentage: { value: 20, unit: "percentage", rationale: "High-value segment with strict compliance needs" },
            size_value: { value: 10000000, unit: "EUR", rationale: "20% of €50M SAM" },
            growth_rate: { value: 8, unit: "percentage_per_year", rationale: "Steady growth with digital transformation focus" },
            demographics: "Banks, insurance companies, fintech with 200-2000 employees",
            pain_points: "Maintaining compliance while improving customer experience",
            customer_profile: "Financial institutions requiring high security and compliance",
            value_drivers: ["Compliance", "Security", "Regulatory reporting", "Customer trust"],
            entry_strategy: "Enterprise sales with compliance-first positioning"
          }
        ]
      }
    };

    updateMarketData(sampleData);
    setShouldAutoSwitch(true); // Signal that we should auto-switch after data load
    toast({
      title: "Sample Data Loaded",
      description: "Comprehensive market analysis sample data has been loaded with full visualizations.",
      variant: "default",
    });
  };

  const ValidationBadge = () => {
    if (isValidJson === null) return null;
    return (
      <Badge variant={isValidJson ? "default" : "destructive"} className="ml-2">
        {isValidJson ? "Valid" : "Invalid"}
      </Badge>
    );
  };

  // Show data input screen if no data
  if (!marketData) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
              className="mr-2 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Button>
            <Target className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Market Research & Analysis</h1>
              <p className="text-muted-foreground">Discover market opportunities with comprehensive analysis and insights</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <AICopilotToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/business', { state: { initialTab: 'cashflow' } })}
              className="hover:bg-blue-50 hover:border-blue-200"
            >
              <Calculator className="h-4 w-4 mr-1" />
              Switch to Business Case
            </Button>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Start Your Market Research
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Explore ready-made market analyses or import your own research data to get insights on market size, 
              competition, customer segments, and growth opportunities.
            </p>
          </CardHeader>
          <CardContent>
            <DataManagementModule 
              marketData={marketData}
              onDataLoad={handleDataUpdate}
              validation={validation}
              showUploadOnly={true}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main analysis interface with tabs
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 overflow-auto container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header - Responsive layout */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        {/* Left side: Back button, icon, and title */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">Market Research & Analysis</h1>
            <p className="text-sm text-muted-foreground">
              {marketData?.meta?.title || 'Untitled Market Analysis'}
            </p>
          </div>
        </div>
        
        {/* Right side: Action buttons - wrap on mobile */}
        <div className="flex items-center gap-2 flex-wrap">
          <ThemeToggle />
          <AICopilotToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/business', { state: { initialTab: 'cashflow' } })}
            className="hover:bg-blue-50 hover:border-blue-200"
          >
            <Calculator className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Switch to Business Case</span>
            <span className="sm:hidden">Business</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
          >
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          
          {/* Reset Button with Confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="hover:bg-red-50 hover:border-red-200">
                <RefreshCw className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Reset Data</span>
                <span className="sm:hidden">Reset</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset All Market Analysis Data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all market analysis data including market sizing, competitive analysis, 
                  customer segments, and strategic planning. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetAllData} className="bg-red-600 hover:bg-red-700">
                  Reset All Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Tabs Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          {moduleConfig.map((module) => {
            const IconComponent = module.icon;
            return (
              <TabsTrigger 
                key={module.id} 
                value={module.id}
                className="flex items-center gap-2 text-xs"
              >
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{module.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {marketData && suiteMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Total Addressable Market</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {suiteMetrics.tam.toLocaleString('en-US', {
                      style: 'currency',
                      currency: marketData.meta?.currency || 'EUR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Market Growth</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {((marketData.market_sizing?.total_addressable_market?.growth_rate?.value || 0)).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Annual</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Customer Segments</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {marketData.customer_analysis?.market_segments?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Defined</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Competitors</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {marketData.competitive_landscape?.competitors?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Identified</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Analysis Scope</h4>
                    <p className="text-sm text-muted-foreground">
                      {marketData?.meta?.description || 'No description available'}
                    </p>
                  </div>
                  
                  {marketData?.market_sizing && (
                    <div>
                      <h4 className="font-medium mb-2">Market Opportunity</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Market (TAM):</span>
                          <span className="font-medium">
                            {(marketData.market_sizing.total_addressable_market?.base_value?.value || 0).toLocaleString('en-US', {
                              style: 'currency',
                              currency: marketData.meta?.currency || 'EUR',
                              minimumFractionDigits: 0
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Serviceable Market (SAM):</span>
                          <span className="font-medium">
                            {suiteMetrics ? suiteMetrics.sam.toLocaleString('en-US', {
                              style: 'currency',
                              currency: marketData.meta?.currency || 'EUR',
                              minimumFractionDigits: 0
                            }) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Obtainable Market (SOM):</span>
                          <span className="font-medium">
                            {suiteMetrics ? suiteMetrics.som.toLocaleString('en-US', {
                              style: 'currency',
                              currency: marketData.meta?.currency || 'EUR',
                              minimumFractionDigits: 0
                            }) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {validation?.warnings && validation.warnings.length > 0 && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <h5 className="font-medium text-yellow-800 mb-1">Data Quality</h5>
                      <p className="text-sm text-yellow-700">
                        {validation.warnings.length} warning(s) found in market data
                      </p>
                    </div>
                  )}
                  
                  {marketData?.competitive_landscape?.competitors && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <h5 className="font-medium text-red-800 mb-1">Competitive Landscape</h5>
                      <p className="text-sm text-red-700">
                        {marketData.competitive_landscape.competitors.length} competitors identified
                        {marketData.competitive_landscape.competitors.filter(c => c.threat_level === 'high').length > 0 && 
                          `, ${marketData.competitive_landscape.competitors.filter(c => c.threat_level === 'high').length} high-threat`
                        }
                      </p>
                    </div>
                  )}
                  
                  {marketData?.market_share?.target_position && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h5 className="font-medium text-green-800 mb-1">Market Entry Strategy</h5>
                      <p className="text-sm text-green-700">
                        Target {((marketData.market_share.target_position.target_share?.value || 0)).toFixed(1)}% market share
                        using {marketData.market_share.target_position.penetration_strategy} strategy
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sizing" className="space-y-6">
          <MarketSizingModule
            marketData={marketData}
            onDataUpdate={handleDataUpdate}
            metrics={suiteMetrics}
          />
        </TabsContent>

        <TabsContent value="competitive" className="space-y-6">
          <CompetitiveIntelligenceModule
            marketData={marketData}
            onDataUpdate={handleDataUpdate}
            metrics={suiteMetrics}
          />
        </TabsContent>

        <TabsContent value="ci-matrix" className="space-y-6">
          <CompetitorMatrixGenerator
            marketData={marketData}
            onDataUpdate={handleDataUpdate}
          />
        </TabsContent>

        <TabsContent value="customer" className="space-y-6">
          <CustomerAnalysisModule
            marketData={marketData}
            onDataUpdate={handleDataUpdate}
            metrics={suiteMetrics}
          />
        </TabsContent>

        <TabsContent value="strategic" className="space-y-6">
          <StrategicPlanningModule
            marketData={marketData}
            onDataUpdate={handleDataUpdate}
            metrics={suiteMetrics}
          />
        </TabsContent>

        <TabsContent value="assumptions" className="space-y-6">
          <MarketAssumptionsTab />
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <DataManagementModule
            marketData={marketData}
            onDataLoad={(data) => {
              updateMarketData(data);
              setShouldAutoSwitch(true); // Signal that we should auto-switch after data load
              toast({
                title: "Data Loaded Successfully",
                description: "Market analysis data has been loaded and visualizations are ready.",
                variant: "default",
              });
            }}
            onDataUpdate={handleDataUpdate}
            validation={validation}
          />
        </TabsContent>
      </Tabs>
      </div>
      <AICopilotSidebar showMarketContext />
    </div>
  );
}
