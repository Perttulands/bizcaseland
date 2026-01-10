import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  BarChart3,
  FileText 
} from 'lucide-react';
import { useDataStatus } from '@/core/contexts';
import { syncMarketToBusinessVolume } from '@/core/services/data-sync.service';

export function SharedDataManager() {
  const {
    currentProject,
    projects,
    createProject,
    saveProject,
    exportProject,
    updateBusinessData,
    getMarketInsights,
    validateDataConsistency,
    syncDataBetweenTools
  } = useDataManager();

  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const insights = getMarketInsights();
  const validationResults = validateDataConsistency();

  const handleSyncData = useCallback(async () => {
    if (!currentProject?.marketData) {
      setSyncStatus('error');
      return;
    }

    setSyncStatus('syncing');
    setIsLoading(true);

    try {
      const { businessData, syncResult } = syncMarketToBusinessVolume(
        currentProject.marketData,
        currentProject.businessData
      );

      updateBusinessData(businessData);
      
      if (syncResult.success) {
        setSyncStatus('success');
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [currentProject, updateBusinessData]);

  const handleExport = useCallback(async () => {
    setIsLoading(true);
    try {
      const exportData = await exportProject('json');
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject?.projectName || 'project'}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [exportProject, currentProject]);

  const getAlignmentColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAlignmentLevel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      {/* Project Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Project Data Management
          </CardTitle>
          <CardDescription>
            Unified data management for market analysis and business case tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Current Project</p>
              <p className="text-2xl font-bold">{currentProject?.projectName || 'No project selected'}</p>
              <p className="text-xs text-muted-foreground">
                {currentProject ? `Last modified: ${new Date(currentProject.lastModified).toLocaleDateString()}` : 'Create a new project to get started'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Data Status</p>
              <div className="flex gap-2">
                <Badge variant={currentProject?.businessData ? 'default' : 'secondary'}>
                  Business Case {currentProject?.businessData ? '✓' : '○'}
                </Badge>
                <Badge variant={currentProject?.marketData ? 'default' : 'secondary'}>
                  Market Analysis {currentProject?.marketData ? '✓' : '○'}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Quick Actions</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => createProject('New Project', 'unified')} disabled={isLoading}>
                  New Project
                </Button>
                <Button size="sm" variant="outline" onClick={handleExport} disabled={!currentProject || isLoading}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cross-Tool Insights */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cross-Tool Insights
            </CardTitle>
            <CardDescription>
              Analysis of alignment between market research and business case assumptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="alignment" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="alignment">Volume Alignment</TabsTrigger>
                <TabsTrigger value="revenue">Revenue Consistency</TabsTrigger>
              </TabsList>
              
              <TabsContent value="alignment" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Market-Based Volume</p>
                    <p className="text-2xl font-bold">{insights.volumeAlignment.marketProjectedVolume.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">units/year</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Business Case Volume</p>
                    <p className="text-2xl font-bold">{insights.volumeAlignment.businessAssumedVolume.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">units/year</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Alignment Score</p>
                    <span className={`text-sm font-bold ${getAlignmentColor(insights.volumeAlignment.alignmentScore)}`}>
                      {getAlignmentLevel(insights.volumeAlignment.alignmentScore)}
                    </span>
                  </div>
                  <Progress value={insights.volumeAlignment.alignmentScore * 100} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    {(insights.volumeAlignment.alignmentScore * 100).toFixed(0)}% alignment between market and business projections
                  </p>
                </div>

                {insights.volumeAlignment.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Recommendations</p>
                    {insights.volumeAlignment.recommendations.map((rec, index) => (
                      <Alert key={index}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{rec}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="revenue" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Market Size</p>
                    <p className="text-2xl font-bold">€{insights.revenueConsistency.marketSize.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total addressable market</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Projected Revenue</p>
                    <p className="text-2xl font-bold">€{insights.revenueConsistency.businessProjectedRevenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Business case projection</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Implied Market Share</p>
                    <span className="text-sm font-bold">
                      {(insights.revenueConsistency.marketShareImplied * 100).toFixed(2)}%
                    </span>
                  </div>
                  <Progress value={Math.min(insights.revenueConsistency.marketShareImplied * 100, 100)} className="w-full" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Feasibility Score</p>
                    <span className={`text-sm font-bold ${getAlignmentColor(insights.revenueConsistency.feasibilityScore)}`}>
                      {getAlignmentLevel(insights.revenueConsistency.feasibilityScore)}
                    </span>
                  </div>
                  <Progress value={insights.revenueConsistency.feasibilityScore * 100} className="w-full" />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Data Synchronization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Data Synchronization
          </CardTitle>
          <CardDescription>
            Sync market insights to business case assumptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSyncData}
              disabled={!currentProject?.marketData || isLoading || syncStatus === 'syncing'}
              className="flex items-center gap-2"
            >
              {syncStatus === 'syncing' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync Market to Business
            </Button>

            {syncStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Sync completed successfully</span>
              </div>
            )}

            {syncStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Sync failed</span>
              </div>
            )}
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will update business case volume assumptions based on market analysis. 
              Existing data may be overwritten. Consider backing up your data first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Data Validation
            </CardTitle>
            <CardDescription>
              Issues and warnings found in your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {validationResults.map((result, index) => (
              <Alert key={index} variant={result.type === 'error' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{result.category}:</strong> {result.message}
                  {result.suggestedAction && (
                    <span className="block mt-1 text-xs">
                      Suggested action: {result.suggestedAction}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
