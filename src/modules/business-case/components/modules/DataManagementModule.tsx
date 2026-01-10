import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  Download,
  RefreshCw,
  FileText,
  AlertTriangle,
  Users,
  Copy,
  Info,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

import { BusinessData } from '@/core/types';
import { safeJSONParse, validateBusinessData } from '@/core/services';
import { copyTextToClipboard } from '@/core/engine';
import { JSONTemplateComponent, downloadTemplate } from '../JSONTemplateComponent';
import { SegmentTemplate, downloadSegmentTemplate } from '../SegmentTemplate';
import { ExampleBusinessCases } from '../ExampleBusinessCases';
import { BUSINESS_CASE_SAMPLE_DATA } from '../SampleData';

interface DataManagementModuleProps {
  businessData?: BusinessData | null;
  onDataLoad: (data: BusinessData) => void;
  onDataUpdate?: (data: BusinessData) => void;
  showUploadOnly?: boolean;
  onNavigateToVolume?: () => void;
}

export function DataManagementModule({ 
  businessData, 
  onDataLoad, 
  onDataUpdate,
  showUploadOnly = false,
  onNavigateToVolume
}: DataManagementModuleProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [segmentInput, setSegmentInput] = useState('');
  const [isValidJson, setIsValidJson] = useState<boolean | null>(null);
  const [isValidSegment, setIsValidSegment] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segmentError, setSegmentError] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const { toast } = useToast();

  const handleJsonPaste = (value: string) => {
    setJsonInput(value);
    validateJson(value);
  };

  const validateJson = (value: string) => {
    if (!value.trim()) {
      setIsValidJson(null);
      setError(null);
      return;
    }

    const parseResult = safeJSONParse(value);
    
    if (!parseResult.success) {
      setIsValidJson(false);
      setError(parseResult.error || "Invalid JSON");
      return;
    }

    const businessDataValidation = validateBusinessData(parseResult.data);
    
    if (!businessDataValidation.success) {
      setIsValidJson(false);
      setError(businessDataValidation.error || "Invalid business data format");
      return;
    }

    setIsValidJson(true);
    setError(null);
    
    if (businessDataValidation.warnings && businessDataValidation.warnings.length > 0) {
      console.warn('Business data validation warnings:', businessDataValidation.warnings);
    }
  };

  const validateSegmentData = (value: string) => {
    if (!value.trim()) {
      setIsValidSegment(null);
      setSegmentError(null);
      return;
    }

    const parseResult = safeJSONParse(value);
    
    if (!parseResult.success) {
      setIsValidSegment(false);
      setSegmentError(parseResult.error || "Invalid JSON");
      return;
    }

    // Strip instructions if present (they're just guidance for AI)
    const data = parseResult.data;
    if (data?.instructions) {
      delete data.instructions;
    }

    // Check if it has the segment structure
    if (!data?.assumptions?.customers?.segments) {
      setIsValidSegment(false);
      setSegmentError("Invalid segment data structure. Must contain assumptions.customers.segments");
      return;
    }

    setIsValidSegment(true);
    setSegmentError(null);
  };

  const handleJsonImport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const parseResult = safeJSONParse(jsonInput);
      
      if (!parseResult.success) {
        throw new Error(parseResult.error || "Failed to parse JSON");
      }

      const businessDataValidation = validateBusinessData(parseResult.data);
      
      if (!businessDataValidation.success) {
        throw new Error(businessDataValidation.error || "Invalid business data");
      }

      onDataLoad(parseResult.data as BusinessData);
      
      toast({
        title: "Data Imported",
        description: "Business case data loaded successfully.",
      });
      
      setJsonInput('');
      setIsValidJson(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import data';
      setError(errorMessage);
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSegmentImport = async () => {
    setIsLoading(true);
    setSegmentError(null);
    
    try {
      const parseResult = safeJSONParse(segmentInput);
      
      if (!parseResult.success) {
        throw new Error(parseResult.error || "Failed to parse JSON");
      }

      // Strip instructions if present (they're just guidance for AI)
      const data = parseResult.data;
      if (data?.instructions) {
        delete data.instructions;
      }

      // Check structure
      if (!data?.assumptions?.customers?.segments) {
        throw new Error("Invalid segment data structure");
      }

      // If we have existing data, merge the segments
      if (businessData) {
        const newSegments = data.assumptions.customers.segments;
        const existingSegments = businessData.assumptions?.customers?.segments || [];
        
        // Merge logic: if segment ID exists, update it; otherwise add it
        const mergedSegments = [...existingSegments];
        newSegments.forEach((newSeg: any) => {
          const existingIndex = mergedSegments.findIndex((s: any) => s.id === newSeg.id);
          if (existingIndex >= 0) {
            mergedSegments[existingIndex] = newSeg;
          } else {
            mergedSegments.push(newSeg);
          }
        });

        const updatedData = {
          ...businessData,
          assumptions: {
            ...businessData.assumptions,
            customers: {
              ...businessData.assumptions.customers,
              segments: mergedSegments
            }
          }
        };

        onDataLoad(updatedData as BusinessData);
      } else {
        // No existing data - this shouldn't happen but handle it
        throw new Error("No existing business case data. Please load a complete business case first.");
      }
      
      toast({
        title: "Segment Added",
        description: "New customer segment added successfully.",
      });
      
      setSegmentInput('');
      setIsValidSegment(null);

      // Navigate to volume tab if callback provided
      if (onNavigateToVolume) {
        setTimeout(() => onNavigateToVolume(), 500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import segment';
      setSegmentError(errorMessage);
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJsonExport = () => {
    if (!businessData) {
      toast({
        title: "No Data",
        description: "No data available to export.",
        variant: "destructive",
      });
      return;
    }

    const jsonString = JSON.stringify(businessData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-case-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Business case data exported successfully.",
      variant: "default",
    });
  };

  const loadExampleBusinessCase = async (fileName: string, title: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/sample-data/business-cases/${fileName}`);
      if (!response.ok) throw new Error('Failed to load example');
      
      const exampleData = await response.json();
      onDataLoad(exampleData as BusinessData);
      
      toast({
        title: "Example Loaded",
        description: `${title} has been loaded successfully.`,
        variant: "default",
      });
    } catch (err) {
      setError('Failed to load example. Please try again.');
      toast({
        title: "Failed to Load Example",
        description: "Please try again or load data manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleData = () => {
    const jsonString = JSON.stringify(BUSINESS_CASE_SAMPLE_DATA, null, 2);
    setJsonInput(jsonString);
    validateJson(jsonString);
    
    toast({
      title: "Sample Data Loaded",
      description: "Sample business case data loaded. Click 'Import Data' to apply it.",
      variant: "default",
    });
  };

  const copySegmentTemplate = async () => {
    try {
      const result = await copyTextToClipboard(SegmentTemplate);
      
      if (result.success) {
        setCopiedTemplate(true);
        setTimeout(() => setCopiedTemplate(false), 3000);
        
        toast({
          title: "🚀 Segment Template Copied!",
          description: "Fill in the segment data and paste it in the import field.",
          variant: "default",
          duration: 4000,
        });
      } else {
        toast({
          title: "Manual Copy Required",
          description: result.error || "Please manually copy the template.",
          variant: "default",
          duration: 6000,
        });
      }
    } catch (err) {
      console.error('Failed to copy template:', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const ValidationBadge = ({ isValid }: { isValid: boolean | null }) => {
    if (isValid === null) return null;
    return (
      <Badge variant={isValid ? "default" : "destructive"} className="ml-2">
        {isValid ? "Valid" : "Invalid"}
      </Badge>
    );
  };

  if (showUploadOnly) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold">Import Business Case Data</h3>
            <p className="text-sm text-muted-foreground">
              Start with examples or import your own business case data
            </p>
          </div>
        </div>

        {/* Examples Section */}
        <div className="mb-8">
          <ExampleBusinessCases onLoadExample={loadExampleBusinessCase} />
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or import your own data
            </span>
          </div>
        </div>

        {/* Import Section */}
        <div className="space-y-4">
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              <strong>Tip:</strong> Use AI tools like ChatGPT or Claude to populate the template with real data for your business case.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <JSONTemplateComponent />
            <Button 
              variant="outline" 
              size="sm"
              onClick={downloadTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          <div className="space-y-2">
            <Textarea
              value={jsonInput}
              onChange={(e) => handleJsonPaste(e.target.value)}
              placeholder="Paste your business case data here..."
              className="min-h-[200px] font-mono text-sm"
            />
            <ValidationBadge isValid={isValidJson} />
            
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <Button 
            onClick={handleJsonImport}
            disabled={!isValidJson || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Processing...' : 'Import Business Case Data'}
          </Button>
        </div>
      </div>
    );
  }

  // Main data management interface with sub-tabs
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-gray-600" />
        <h2 className="text-2xl font-bold">Data Management</h2>
      </div>

      <Tabs defaultValue="copy-template" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="copy-template" className="flex items-center gap-2 text-xs">
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">Copy Template</span>
          </TabsTrigger>
          <TabsTrigger value="modify-segment" className="flex items-center gap-2 text-xs">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Modify Segment</span>
          </TabsTrigger>
          <TabsTrigger value="load-sample" className="flex items-center gap-2 text-xs">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Load Sample</span>
          </TabsTrigger>
          <TabsTrigger value="export-json" className="flex items-center gap-2 text-xs">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export JSON</span>
          </TabsTrigger>
        </TabsList>

        {/* Copy Template Tab */}
        <TabsContent value="copy-template" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Complete Business Case Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Use this template to create a complete business case from scratch with all sections.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <JSONTemplateComponent />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={downloadTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="space-y-2">
                <Textarea
                  value={jsonInput}
                  onChange={(e) => handleJsonPaste(e.target.value)}
                  placeholder="Paste your business case data here..."
                  className="min-h-[300px] font-mono text-sm"
                />
                <ValidationBadge isValid={isValidJson} />
                
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              <Button 
                onClick={handleJsonImport}
                disabled={!isValidJson || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isLoading ? 'Importing...' : 'Import Data'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modify Segment Tab */}
        <TabsContent value="modify-segment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add or Update Customer Segment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!businessData ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please load a complete business case first before adding segments.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      Add new customer segments without affecting existing data. See instructions in SegmentTemplateInstructions.md
                    </AlertDescription>
                  </Alert>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copySegmentTemplate}
                    className={`flex items-center gap-2 transition-all duration-300 ${
                      copiedTemplate 
                        ? 'bg-green-50 border-green-300 text-green-700 shadow-md scale-105' 
                        : 'hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    {copiedTemplate ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600 animate-pulse" />
                        🎉 Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Segment Template
                      </>
                    )}
                  </Button>

                  <div className="space-y-2">
                    <Textarea
                      value={segmentInput}
                      onChange={(e) => {
                        setSegmentInput(e.target.value);
                        validateSegmentData(e.target.value);
                      }}
                      placeholder="Paste filled segment data here..."
                      className="min-h-[300px] font-mono text-sm"
                    />
                    <ValidationBadge isValid={isValidSegment} />
                    
                    {segmentError && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{segmentError}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <Button 
                    onClick={handleSegmentImport}
                    disabled={!isValidSegment || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {isLoading ? 'Importing...' : 'Import Segment'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Load Sample Data Tab */}
        <TabsContent value="load-sample" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Example Business Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <ExampleBusinessCases onLoadExample={loadExampleBusinessCase} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export JSON Tab */}
        <TabsContent value="export-json" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export as JSON</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!businessData ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No data available to export. Please load or create a business case first.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Download your business case data as JSON for backup or sharing.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={handleJsonExport}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download JSON
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
