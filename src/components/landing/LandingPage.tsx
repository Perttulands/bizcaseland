import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/features/ThemeToggle';
import { useData, useDataStatus } from '@/core/contexts';
import { useToast } from '@/hooks/use-toast';
import { 
  Calculator, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Trophy,
  ArrowRight,
  FileText,
  PieChart,
  Lightbulb,
  RotateCcw
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const { clearAllData } = useData();
  const { hasBusinessData, hasMarketData } = useDataStatus();
  const { toast } = useToast();
  
  const switchToBusinessMode = () => {
    navigate('/business');
  };
  
  const switchToMarketMode = () => {
    navigate('/market', { state: { initialTab: 'overview' } });
  };

  const handleResetAllData = () => {
    clearAllData();
    toast({
      title: "All Data Reset",
      description: "All business case and market analysis data has been cleared successfully.",
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-16">
          {/* Responsive header: stacks on mobile, horizontal on desktop */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            {/* Title and Logo - centered on mobile, left on desktop */}
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="p-2 sm:p-3 bg-blue-600 rounded-xl">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white">Bizcaseland</h1>
            </div>
            
            {/* Buttons - centered on mobile, right on desktop */}
            <div className="flex items-center justify-center md:justify-end gap-2 flex-wrap">
              <ThemeToggle />
              {(hasBusinessData || hasMarketData) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="hover:bg-red-50 hover:border-red-200 text-red-600 dark:hover:bg-red-900 dark:hover:border-red-700"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Reset All Data</span>
                      <span className="sm:hidden">Reset</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset All Data</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all business case and market analysis data. 
                        This action cannot be undone. Are you sure you want to continue?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleResetAllData}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Reset All Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          
          <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
            Comprehensive business analysis platform combining market research intelligence 
            with financial modeling for data-driven decision making.
          </p>
        </div>

        {/* Main Choice Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Business Case Analysis Card */}
          <Card className="relative overflow-hidden border-2 hover:border-blue-500 dark:border-gray-700 dark:hover:border-blue-400 transition-all duration-300 hover:shadow-xl group cursor-pointer dark:bg-gray-800">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/5 group-hover:from-blue-600/10 group-hover:to-indigo-600/10 dark:from-blue-400/5 dark:to-indigo-400/5 dark:group-hover:from-blue-400/10 dark:group-hover:to-indigo-400/10 transition-all duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                  <Calculator className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                {hasBusinessData && (
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Data Available
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl mb-2 dark:text-white">Business Case Analysis</CardTitle>
              <p className="text-gray-600 dark:text-gray-300">
                Financial modeling tool for evaluating investment opportunities, 
                calculating ROI/NPV, and building defendable business cases with detailed assumptions.
              </p>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm dark:text-gray-300">
                    <TrendingUp className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <span>Financial Modeling</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm dark:text-gray-300">
                    <BarChart3 className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <span>Cash Flow Analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm dark:text-gray-300">
                    <PieChart className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <span>Sensitivity Analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm dark:text-gray-300">
                    <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <span>Scenario Planning</span>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">Perfect for:</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Investment decisions, project evaluation, pricing strategies, 
                    and financial planning with detailed assumptions and drivers.
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={switchToBusinessMode}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white group-hover:shadow-lg transition-all"
                size="lg"
              >
                {hasBusinessData ? 'Continue Business Case' : 'Start Business Case'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Market Analysis Card */}
          <Card className="relative overflow-hidden border-2 hover:border-green-500 dark:border-gray-700 dark:hover:border-green-400 transition-all duration-300 hover:shadow-xl group cursor-pointer dark:bg-gray-800">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-emerald-600/5 group-hover:from-green-600/10 group-hover:to-emerald-600/10 dark:from-green-400/5 dark:to-emerald-400/5 dark:group-hover:from-green-400/10 dark:group-hover:to-emerald-400/10 transition-all duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                  <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                {hasMarketData && (
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Data Available
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl mb-2 dark:text-white">Market Analysis</CardTitle>
              <p className="text-gray-600 dark:text-gray-300">
                Market research tool for sizing opportunities, analyzing competitors, 
                and validating market entry strategies with data-driven insights.
              </p>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm dark:text-gray-300">
                    <Target className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span>TAM/SAM/SOM</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm dark:text-gray-300">
                    <Trophy className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span>Competitive Analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm dark:text-gray-300">
                    <Users className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span>Customer Segmentation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm dark:text-gray-300">
                    <Lightbulb className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span>Strategic Planning</span>
                  </div>
                </div>
                
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <h4 className="font-semibold text-green-900 dark:text-green-200 mb-1">Perfect for:</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Market validation, competitive positioning, customer analysis, 
                    and strategic market entry planning with risk assessment.
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={switchToMarketMode}
                className="w-full bg-green-600 hover:bg-green-700 text-white group-hover:shadow-lg transition-all"
                size="lg"
              >
                {hasMarketData ? 'Continue Market Analysis' : 'Start Market Research'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>


        {/* Integration Message */}
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-200 dark:border-purple-700 dark:bg-gray-800">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-purple-900 dark:text-purple-200 mb-2">Powerful Integration</h3>
            <p className="text-purple-700 dark:text-purple-300 mb-4">
              Start with market analysis to validate opportunities and size markets, 
              then use those insights to build detailed business cases with realistic volume projections.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-purple-600 dark:text-purple-400 mb-4">
              <span>• Switch between tools seamlessly</span>
              <span>• Edit your data</span>
              <span>• Develop strategies</span>
            </div>
            {/*
            <Button 
              onClick={() => navigate('/demo')}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Try Cross-Tool Integration Demo
            </Button>
            */}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {/*
        {(hasBusinessData || hasMarketData) && (
          <div className="mt-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Analysis Progress</h3>
            <div className="flex items-center justify-center gap-8">
              {hasBusinessData && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Calculator className="h-5 w-5" />
                  <span className="font-medium">Business Case Ready</span>
                </div>
              )}
              {hasMarketData && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Target className="h-5 w-5" />
                  <span className="font-medium">Market Analysis Complete</span>
                </div>
              )}
            </div>
          </div>  
        )}
        */}
      </div>
    </div>
  );
}
