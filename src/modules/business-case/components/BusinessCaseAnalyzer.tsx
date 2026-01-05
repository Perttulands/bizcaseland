import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
import { 
  Calculator,
  TrendingUp, 
  Target,
  ArrowLeft,
  FileText,
  DollarSign,
  Activity,
  RotateCcw,
  FileDown,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { FinancialAnalysis } from './FinancialAnalysis';
import { AssumptionsTab } from './AssumptionsTab';
import { CashFlowStatement } from './CashFlowStatement';
import { VolumeAnalysisTab } from './VolumeAnalysisTab';
import { useBusinessData, useNavigation } from '@/core/contexts';
import { BusinessData } from '@/core/types';
import { ThemeToggle } from '@/components/features/ThemeToggle';
import { AICopilotSidebar, AICopilotToggle } from '@/components/features/AIChatSidebar';
import { exportBusinessCaseToPDF } from '@/core/services';
import { calculateBusinessMetrics } from '@/core/engine';
import { DataManagementModule } from './modules/DataManagementModule';

export function BusinessCaseAnalyzer() {
  const { data: jsonData, updateData, clearData } = useBusinessData();
  const { syncFromStorage } = useNavigation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize activeTab - check for navigation state first, then default based on data
  const getInitialTab = () => {
    // Check if navigated from market analysis with specific tab request
    if (location.state?.initialTab) {
      return location.state.initialTab;
    }
    // Default behavior: show data tab if no data, cashflow if data exists
    return jsonData && Object.keys(jsonData).length > 0 ? 'cashflow' : 'data';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [shouldAutoSwitch, setShouldAutoSwitch] = useState(false);

  // Sync data from localStorage when component mounts
  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  // Handle navigation state changes (e.g., from market analysis switch button)
  useEffect(() => {
    if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab);
      // Clear the state immediately to prevent it from affecting future navigations
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.initialTab, navigate]);

  // Set initial tab based on data availability (runs after data is loaded)
  useEffect(() => {
    if (jsonData && Object.keys(jsonData).length > 0 && shouldAutoSwitch) {
      // Only auto-switch if currently on data tab
      if (activeTab === 'data') {
        setActiveTab('cashflow');
      }
      setShouldAutoSwitch(false);
    }
  }, [jsonData, shouldAutoSwitch, activeTab]);

  const moduleConfig = [
    {
      id: 'cashflow',
      title: 'Cash Flow',
      icon: TrendingUp,
      description: 'Cash flow projections and analysis',
      color: 'bg-purple-500'
    },
    {
      id: 'financial',
      title: 'Financial Analysis',
      icon: DollarSign,
      description: 'Revenue models and profitability',
      color: 'bg-green-500'
    },
    {
      id: 'volume',
      title: 'Volume Analysis',
      icon: BarChart3,
      description: 'Customer segment volumes and trends',
      color: 'bg-blue-500'
    },
    {
      id: 'assumptions',
      title: 'Assumptions',
      icon: Activity,
      description: 'Business assumptions and drivers',
      color: 'bg-orange-500'
    },
    {
      id: 'data',
      title: 'Data Management',
      icon: FileText,
      description: 'Import, export, and template tools',
      color: 'bg-gray-500'
    }
  ];

  const handleResetAllData = () => {
    clearData();
    updateData(null);
    toast({
      title: "All Data Reset",
      description: "All business case and market analysis data has been cleared successfully.",
      variant: "default",
    });
  };

  const refreshData = (data: BusinessData) => {
    updateData(data);
    setShouldAutoSwitch(true); // Signal that we should auto-switch after data load
    syncFromStorage(); // Sync with DataContext
  };

  const exportDataAsPDF = async () => {
    if (!jsonData) {
      toast({
        title: "No Data",
        description: "No data available to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Generating PDF Report...",
        description: "Creating your comprehensive business case analysis.",
      });

      const calculations = calculateBusinessMetrics(jsonData);
      await exportBusinessCaseToPDF(jsonData, calculations);

      toast({
        title: "PDF Export Successful ✓",
        description: "Your professional business case report has been downloaded.",
        variant: "default",
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show data input screen if no data
  if (!jsonData) {
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
            <Calculator className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Business Case Analyzer</h1>
              <p className="text-muted-foreground">Build compelling financial projections and ROI calculations for any business project</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <AICopilotToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/market', { state: { initialTab: 'overview' } })}
              className="hover:bg-green-50 hover:border-green-200"
            >
              <Target className="h-4 w-4 mr-1" />
              Switch to Market Analysis
            </Button>
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Whether you're launching a new product, evaluating cost savings, or planning market expansion - 
            create professional financial projections that help you make confident investment decisions.
          </p>
        </div>

        {/* Use DataManagementModule with showUploadOnly prop */}
        <DataManagementModule 
          onDataLoad={refreshData}
          showUploadOnly={true}
        />
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
          <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">Business Case Analyzer</h1>
            <p className="text-sm text-muted-foreground">
              {jsonData?.meta?.title || 'Untitled Business Case'}
            </p>
          </div>
        </div>
        
        {/* Right side: Action buttons - wrap on mobile */}
        <div className="flex items-center gap-2 flex-wrap">
          <ThemeToggle />
          <AICopilotToggle />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="hover:bg-red-50 hover:border-red-200 text-red-600 dark:hover:bg-red-900 dark:hover:border-red-700"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Reset Data</span>
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/market', { state: { initialTab: 'overview' } })}
            className="hover:bg-green-50 hover:border-green-200"
          >
            <Target className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Switch to Market Analysis</span>
            <span className="sm:hidden">Market</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportDataAsPDF}
          >
            <FileDown className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </div>

      {/* Main Tabs Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
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

        <TabsContent value="cashflow" className="space-y-6">
          <CashFlowStatement />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <FinancialAnalysis />
        </TabsContent>

        <TabsContent value="volume" className="space-y-6">
          <VolumeAnalysisTab />
        </TabsContent>

        <TabsContent value="assumptions" className="space-y-6">
          <AssumptionsTab />
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <DataManagementModule 
            businessData={jsonData}
            onDataLoad={refreshData}
            onDataUpdate={refreshData}
            onNavigateToVolume={() => setActiveTab('volume')}
          />
        </TabsContent>
      </Tabs>
      </div>
      <AICopilotSidebar />
    </div>
  );
}
