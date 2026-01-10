import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cloud, Link, Download } from 'lucide-react';
import { MarketData } from '@/core/types';

export interface MarketAnalysisIntegrationPanelProps {
  marketData?: MarketData | null;
  onDataUpdate?: (data: MarketData) => void;
}

export function MarketAnalysisIntegrationPanel({ marketData, onDataUpdate }: MarketAnalysisIntegrationPanelProps) {
  const handleImportSample = () => {
    // If the project has sample data elsewhere, it could be loaded here.
    // For now we trigger a minimal merge/update with empty object to show callback wiring.
    if (onDataUpdate) onDataUpdate({} as MarketData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Cloud className="h-6 w-6 text-sky-600" />
        <h2 className="text-2xl font-bold">Integrations</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connect Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Integrate external data sources to enrich your market analysis. Supported: CSV, JSON, Google Sheets (via export).</p>

          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => alert('CSV import not implemented in this build')}>
              <Download className="mr-2" /> Import CSV
            </Button>

            <Button variant="outline" onClick={() => alert('Connectors not implemented')}>
              <Link className="mr-2" /> Connect
            </Button>

            <Button onClick={handleImportSample}>
              <Cloud className="mr-2" /> Load Sample Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MarketAnalysisIntegrationPanel;
