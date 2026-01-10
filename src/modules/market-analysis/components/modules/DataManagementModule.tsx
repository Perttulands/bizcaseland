import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { copyTextToClipboard } from '@/core/engine';
import {
  Upload,
  Download,
  RefreshCw,
  FileText,
  CheckCircle,
  AlertTriangle,
  Copy,
  Sparkles,
  Brain
} from 'lucide-react';

import { MarketData } from '@/core/types';
import { MarketAnalysisTemplate, generateModularTemplate } from '../MarketAnalysisTemplate';
import { ExampleMarketAnalyses } from '../ExampleMarketAnalyses';

interface DataManagementModuleProps {
  marketData?: MarketData | null;
  onDataLoad: (data: MarketData) => void;
  onDataUpdate?: (data: MarketData) => void;
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null;
  showUploadOnly?: boolean;
}

export function DataManagementModule({ 
  marketData, 
  onDataLoad, 
  onDataUpdate, 
  validation,
  showUploadOnly = false 
}: DataManagementModuleProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('examples');
  const [selectedModules, setSelectedModules] = useState<string[]>(['market_sizing']); // Market Sizing checked by default
  const { toast } = useToast();

  const handleLoadExample = async (caseId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/sample-data/market-analysis/${caseId}.json`);
      if (!response.ok) {
        throw new Error('Failed to load example');
      }
      const exampleData = await response.json();
      onDataLoad(exampleData as MarketData);
      toast({
        title: "Example loaded successfully!",
        description: "Market analysis data ready for exploration.",
      });
    } catch (err) {
      setError('Failed to load example. Please try again.');
      toast({
        title: "Failed to load example",
        description: "Please try again or load data manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJsonImport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const parsedData = JSON.parse(jsonInput);
      
      // Check if this is a partial import (has some but not all modules)
      const hasMarketSizing = !!parsedData.market_sizing;
      const hasCompetitive = !!parsedData.competitive_landscape;
      const hasCustomer = !!parsedData.customer_analysis;
      const hasStrategic = !!parsedData.strategic_planning;
      const moduleCount = [hasMarketSizing, hasCompetitive, hasCustomer, hasStrategic].filter(Boolean).length;
      
      // If existing data and partial import, merge; otherwise replace
      if (marketData && moduleCount > 0 && moduleCount < 4) {
        const mergedData: any = {
          ...marketData,
          schema_version: parsedData.schema_version || marketData.schema_version,
          meta: parsedData.meta || marketData.meta
        };
        
        // Merge only present modules
        if (parsedData.market_sizing) mergedData.market_sizing = parsedData.market_sizing;
        if (parsedData.market_share) mergedData.market_share = parsedData.market_share;
        if (parsedData.competitive_landscape) mergedData.competitive_landscape = parsedData.competitive_landscape;
        if (parsedData.customer_analysis) mergedData.customer_analysis = parsedData.customer_analysis;
        if (parsedData.strategic_planning) mergedData.strategic_planning = parsedData.strategic_planning;
        
        onDataLoad(mergedData as MarketData);
        toast({
          title: "Partial Data Merged",
          description: `Updated ${moduleCount} module(s) while preserving other data.`,
        });
      } else {
        // Full import - replace all data
        onDataLoad(parsedData as MarketData);
        toast({
          title: "Data Imported",
          description: "Market analysis data loaded successfully.",
        });
      }
      
      setJsonInput('');
    } catch (err) {
      setError('Invalid JSON format. Please check your input and try again.');
      toast({
        title: "Import Failed",
        description: "Invalid JSON format. Please check your input.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJsonExport = () => {
    if (!marketData) return;
    
    const jsonString = JSON.stringify(marketData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleModularExport = () => {
    if (!marketData || selectedModules.length === 0) {
      toast({
        title: "No Modules Selected",
        description: "Please select at least one module to export.",
        variant: "destructive",
      });
      return;
    }

    // Create export object with only selected modules
    const exportData: any = {
      schema_version: marketData.schema_version || "1.0",
      meta: {
        ...marketData.meta,
        title: `${marketData.meta?.title || 'Market Analysis'} (Partial Export)`,
        description: `Exported modules: ${selectedModules.join(', ')}`
      }
    };

    // Add only selected modules
    if (selectedModules.includes('market_sizing')) {
      exportData.market_sizing = marketData.market_sizing;
      if (marketData.market_share) {
        exportData.market_share = marketData.market_share;
      }
    }
    if (selectedModules.includes('competitive_intelligence') && marketData.competitive_landscape) {
      exportData.competitive_landscape = marketData.competitive_landscape;
    }
    if (selectedModules.includes('customer_analysis') && marketData.customer_analysis) {
      exportData.customer_analysis = marketData.customer_analysis;
    }
    if (selectedModules.includes('strategic_planning') && marketData.strategic_planning) {
      exportData.strategic_planning = marketData.strategic_planning;
    }

    // Download the partial export
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-analysis-partial-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Partial Export Successful",
      description: `Exported ${selectedModules.length} module(s) successfully.`,
    });
  };

  const handleTemplateLoad = () => {
    // Generate template based on selected modules
    const template = selectedModules.length > 0 
      ? generateModularTemplate(selectedModules)
      : MarketAnalysisTemplate;
    setJsonInput(template);
    setActiveTab('import');
  };

  const handleTemplateCopy = async () => {
    try {
      console.log('Copy template clicked. Selected modules:', selectedModules);
      
      // Generate template based on selected modules with error handling
      let template: string;
      try {
        template = selectedModules.length > 0 
          ? generateModularTemplate(selectedModules)
          : MarketAnalysisTemplate;
        console.log('Template generated successfully, length:', template.length);
      } catch (genError) {
        console.error('Template generation failed, using full template:', genError);
        // Fallback to full template if module selection fails
        template = MarketAnalysisTemplate;
      }
      
      const result = await copyTextToClipboard(template);
      
      console.log('Copy result:', result);
      
      if (result.success) {
        toast({
          title: "🎉 Template Copied Successfully!",
          description: "Market analysis template is ready for your AI assistant. Now you can create amazing market research!",
          variant: "default",
          duration: 4000,
        });
      } else {
        // Handle manual fallback case
        toast({
          title: "Manual Copy Required",
          description: result.error || "Please manually select and copy the text below.",
          variant: "default",
          duration: 6000,
        });
      }
    } catch (err) {
      console.error('Failed to copy template - full error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast({
        title: "Copy Failed",
        description: `Error: ${errorMessage}. Please try again or manually copy the template.`,
        variant: "destructive",
      });
    }
  };

  if (showUploadOnly) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold">Import Market Research Data</h3>
            <p className="text-sm text-muted-foreground">
              Start with examples or import your own market analysis data
            </p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="examples">Example Markets</TabsTrigger>
            <TabsTrigger value="import">Import Data</TabsTrigger>
          </TabsList>

          <TabsContent value="examples" className="mt-6">
            <ExampleMarketAnalyses 
              onLoadExample={handleLoadExample}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="import" className="mt-6">
            <div className="space-y-4">
              {/* Module Selection */}
              <Card className="border-2 border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Select Modules to Include
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose which analysis modules you want to include in your template. 
                      This generates a smaller, focused template based on your needs.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { id: 'market_sizing', label: 'Market Sizing', description: 'TAM/SAM/SOM analysis' },
                        { id: 'competitive_intelligence', label: 'Competitive Intelligence', description: 'Competitor analysis' },
                        { id: 'customer_analysis', label: 'Customer Analysis', description: 'Segment scoring' },
                        { id: 'strategic_planning', label: 'Strategic Planning', description: 'Market entry strategies' }
                      ].map((module) => (
                        <div key={module.id} className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                          <Checkbox
                            id={module.id}
                            checked={selectedModules.includes(module.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedModules([...selectedModules, module.id]);
                              } else {
                                setSelectedModules(selectedModules.filter(m => m !== module.id));
                              }
                            }}
                          />
                          <div className="grid gap-1 leading-none">
                            <Label
                              htmlFor={module.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {module.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {module.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedModules.length === 0 && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Please select at least one module to generate a template.
                        </AlertDescription>
                      </Alert>
                    )}
                    {selectedModules.length > 0 && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <strong>Selected:</strong> {selectedModules.length} module{selectedModules.length !== 1 ? 's' : ''} 
                          <span className="text-muted-foreground ml-2">
                            (≈{selectedModules.length * 60} lines of JSON)
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tip:</strong> Use AI tools like ChatGPT or Claude to research your market and populate the template with real data.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button 
                  onClick={handleTemplateLoad} 
                  variant="outline" 
                  className="flex items-center gap-2"
                  disabled={selectedModules.length === 0}
                >
                  <FileText className="h-4 w-4" />
                  Load Template
                </Button>
                <Button 
                  onClick={handleTemplateCopy} 
                  variant="outline" 
                  className="flex items-center gap-2"
                  disabled={selectedModules.length === 0}
                >
                  <Copy className="h-4 w-4" />
                  Copy Template
                </Button>
              </div>

              <div className="space-y-3">
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste your market analysis data here..."
                  className="min-h-[200px] font-mono text-sm"
                />
                
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  onClick={handleJsonImport}
                  disabled={!jsonInput.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? 'Processing...' : 'Import Market Data'}
                </Button>
              </div>

              {/* GenAI Workflow */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    GenAI Workflow for Market Research
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 text-sm text-blue-800">
                    <div>
                      <strong>1. Copy Template:</strong> Use the "Copy Template" button above
                    </div>
                    <div>
                      <strong>2. Research with AI:</strong> Ask ChatGPT/Claude: "Research the [your market] and fill out this market analysis template with real data: [paste template]"
                    </div>
                    <div>
                      <strong>3. Import Results:</strong> Paste the completed template and click "Import Market Data"
                    </div>
                    <div className="text-blue-600 text-xs mt-2">
                      💡 <strong>Pro tip:</strong> Be specific about geographic regions, time frames, and market segments for better AI research
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-gray-600" />
          <h2 className="text-2xl font-bold">Data Management</h2>
      </div>

      {/* Validation status */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validation.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              Data Validation Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validation.isValid ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All data validation checks passed. Your market analysis data is complete and ready for analysis.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {validation.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-semibold">Errors found:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {validation.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                {validation.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-semibold">Warnings:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {validation.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Results</TabsTrigger>
          <TabsTrigger value="template">Template & Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="examples">
          <Card>
            <CardHeader>
              <CardTitle>Example Market Analyses</CardTitle>
            </CardHeader>
            <CardContent>
              <ExampleMarketAnalyses 
                onLoadExample={handleLoadExample}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Market Research Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tip:</strong> Use AI tools like ChatGPT or Claude to research your market and populate the template with real data.
                </AlertDescription>
              </Alert>

              {/* Module Selection */}
              <Card className="border-2 border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Select Modules to Include
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose which analysis modules you want to include in your template. 
                      This generates a smaller, focused template based on your needs.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { id: 'market_sizing', label: 'Market Sizing', description: 'TAM/SAM/SOM analysis' },
                        { id: 'competitive_intelligence', label: 'Competitive Intelligence', description: 'Competitor analysis' },
                        { id: 'customer_analysis', label: 'Customer Analysis', description: 'Segment scoring' },
                        { id: 'strategic_planning', label: 'Strategic Planning', description: 'Market entry strategies' }
                      ].map((module) => (
                        <div key={module.id} className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                          <Checkbox
                            id={`import-${module.id}`}
                            checked={selectedModules.includes(module.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedModules([...selectedModules, module.id]);
                              } else {
                                setSelectedModules(selectedModules.filter(m => m !== module.id));
                              }
                            }}
                          />
                          <div className="grid gap-1 leading-none">
                            <Label
                              htmlFor={`import-${module.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {module.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {module.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedModules.length === 0 && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Please select at least one module to generate a template.
                        </AlertDescription>
                      </Alert>
                    )}
                    {selectedModules.length > 0 && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <strong>Selected:</strong> {selectedModules.length} module{selectedModules.length !== 1 ? 's' : ''} 
                          <span className="text-muted-foreground ml-2">
                            (≈{selectedModules.length * 60} lines of JSON)
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button 
                  onClick={handleTemplateCopy} 
                  variant="outline" 
                  className="flex items-center gap-2"
                  disabled={selectedModules.length === 0}
                >
                  <Copy className="h-4 w-4" />
                  Copy Template
                </Button>
                <Button 
                  onClick={handleTemplateLoad} 
                  variant="outline" 
                  className="flex items-center gap-2"
                  disabled={selectedModules.length === 0}
                >
                  <FileText className="h-4 w-4" />
                  Load Template
                </Button>
              </div>

              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your market analysis data here..."
                className="min-h-[300px] font-mono text-sm"
              />
              
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={handleJsonImport}
                disabled={!jsonInput.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isLoading ? 'Processing...' : 'Import Market Data'}
              </Button>

              {/* GenAI Workflow */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    GenAI Workflow for Market Research
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 text-sm text-blue-800">
                    <div>
                      <strong>1. Copy Template:</strong> Use the "Copy Template" button above
                    </div>
                    <div>
                      <strong>2. Research with AI:</strong> Ask ChatGPT/Claude: "Research the [your market] and fill out this market analysis template with real data: [paste template]"
                    </div>
                    <div>
                      <strong>3. Import Results:</strong> Paste the completed template and click "Import Market Data"
                    </div>
                    <div className="text-blue-600 text-xs mt-2">
                      💡 <strong>Pro tip:</strong> Be specific about geographic regions, time frames, and market segments for better AI research
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Analysis Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  Export your market analysis data and results for backup, sharing, or integration with business case analysis.
                </AlertDescription>
              </Alert>

              {/* Module Selection for Modular Export */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-900">Select Modules to Export</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedModules.includes('market_sizing')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedModules([...selectedModules, 'market_sizing']);
                          } else {
                            setSelectedModules(selectedModules.filter(m => m !== 'market_sizing'));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="font-medium">Market Sizing</span>
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedModules.includes('competitive_intelligence')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedModules([...selectedModules, 'competitive_intelligence']);
                          } else {
                            setSelectedModules(selectedModules.filter(m => m !== 'competitive_intelligence'));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="font-medium">Competitive Intelligence</span>
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedModules.includes('customer_analysis')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedModules([...selectedModules, 'customer_analysis']);
                          } else {
                            setSelectedModules(selectedModules.filter(m => m !== 'customer_analysis'));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="font-medium">Customer Analysis</span>
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedModules.includes('strategic_planning')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedModules([...selectedModules, 'strategic_planning']);
                          } else {
                            setSelectedModules(selectedModules.filter(m => m !== 'strategic_planning'));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="font-medium">Strategic Planning</span>
                    </label>
                  </div>
                  <p className="text-xs text-blue-600 mt-3">
                    💡 Use modular export to work on individual sections with AI, then import to merge updates.
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Full Export</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Export the complete market analysis dataset as JSON for backup or modification.
                    </p>
                    <Button 
                      onClick={handleJsonExport}
                      disabled={!marketData}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export All Modules
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Modular Export</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Export only specific modules for AI research or partial updates.
                    </p>
                    <Button 
                      onClick={handleModularExport}
                      disabled={!marketData || selectedModules.length === 0}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected ({selectedModules.length})
                    </Button>
                  </CardContent>
                </Card>

              </div>

              {marketData && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <h4 className="font-semibold text-green-800">Data Ready for Export</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      Your market analysis contains data for: {marketData.meta?.title || 'Untitled Analysis'}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Last modified: {new Date().toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>JSON Template & Usage Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Use our JSON template to structure your market research data. This template can be populated manually or with AI assistance.
                </AlertDescription>
              </Alert>

              {/* Module Selection */}
              <Card className="border-2 border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Select Modules to Include
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose which analysis modules you want to include in your template. 
                      This generates a smaller, focused template based on your needs.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { id: 'market_sizing', label: 'Market Sizing', description: 'TAM/SAM/SOM analysis' },
                        { id: 'competitive_intelligence', label: 'Competitive Intelligence', description: 'Competitor analysis' },
                        { id: 'customer_analysis', label: 'Customer Analysis', description: 'Segment scoring' },
                        { id: 'strategic_planning', label: 'Strategic Planning', description: 'Market entry strategies' }
                      ].map((module) => (
                        <div key={module.id} className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                          <Checkbox
                            id={`template-${module.id}`}
                            checked={selectedModules.includes(module.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedModules([...selectedModules, module.id]);
                              } else {
                                setSelectedModules(selectedModules.filter(m => m !== module.id));
                              }
                            }}
                          />
                          <div className="grid gap-1 leading-none">
                            <Label
                              htmlFor={`template-${module.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {module.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {module.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedModules.length === 0 && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Please select at least one module to generate a template.
                        </AlertDescription>
                      </Alert>
                    )}
                    {selectedModules.length > 0 && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <strong>Selected:</strong> {selectedModules.length} module{selectedModules.length !== 1 ? 's' : ''} 
                          <span className="text-muted-foreground ml-2">
                            (≈{selectedModules.length * 60} lines of JSON)
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">AI-Powered Workflow</h4>
                  <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                    <li>Select which modules you need above</li>
                    <li>Copy the JSON template below</li>
                    <li>Provide it to an AI assistant with your market research context</li>
                    <li>Ask the AI to populate the template with your specific market data</li>
                    <li>Import the completed JSON into the Market Analysis tool</li>
                    <li>Review and refine the analysis with our interactive tools</li>
                  </ol>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleTemplateCopy} 
                    variant="outline" 
                    className="flex items-center gap-2"
                    disabled={selectedModules.length === 0}
                  >
                    <Copy className="h-4 w-4" />
                    Copy Template
                  </Button>
                  <Button 
                    onClick={handleTemplateLoad} 
                    variant="outline" 
                    className="flex items-center gap-2"
                    disabled={selectedModules.length === 0}
                  >
                    <Upload className="h-4 w-4" />
                    Load into Editor
                  </Button>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h5 className="font-medium mb-2">Template Structure</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <strong>Market Sizing:</strong> TAM, SAM, SOM definitions and constraints</li>
                    <li>• <strong>Competitive Landscape:</strong> Competitor analysis and market structure</li>
                    <li>• <strong>Customer Analysis:</strong> Segment breakdown and customer economics</li>
                    <li>• <strong>Market Share:</strong> Current position and penetration strategy</li>
                    <li>• <strong>Market Dynamics:</strong> Growth drivers, risks, and technology trends</li>
                  </ul>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Data Format:</strong> All numeric values should follow the format: 
                    <code className="ml-1 px-1 bg-gray-200 rounded">{"{ value: number, unit: string, rationale: string }"}</code>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
