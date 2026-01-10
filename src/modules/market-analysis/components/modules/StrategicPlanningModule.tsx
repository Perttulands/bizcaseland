import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Target, Rocket, Users, TrendingUp } from 'lucide-react';
import { MarketData } from '@/core/types';
import { MarketSuiteMetrics } from '@/core/engine/calculators/market-suite-calculations';
import { ModuleImportCard } from '@/modules/market-analysis/components/shared/ModuleImportCard';
import { mergeMarketData } from '@/core/engine/utils/market-data-utils';

interface StrategicPlanningModuleProps {
  marketData: MarketData | null;
  onDataUpdate?: (data: MarketData) => void;
  metrics?: MarketSuiteMetrics | null;
}

// Simple component to render data source with clickable link
const DataSourceLink = ({ source }: { source: string }) => {
  const urlMatch = source.match(/(https?:\/\/[^\s]+)/);
  
  if (!urlMatch) {
    return <span>{source}</span>;
  }
  
  const url = urlMatch[0];
  const text = source.replace(url, '').trim();
  
  return (
    <>
      {text && <span>{text} - </span>}
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {url}
      </a>
    </>
  );
};

// Icon mapping for different strategy types
const STRATEGY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'partnership': Users,
  'direct': Target,
  'platform': Rocket,
  'gradual': TrendingUp,
  'default': Lightbulb,
};

// Color mapping for strategy cards
const STRATEGY_COLORS: Record<string, string> = {
  'partnership': 'border-blue-500',
  'direct': 'border-green-500',
  'platform': 'border-purple-500',
  'gradual': 'border-orange-500',
  'default': 'border-gray-500',
};

export function StrategicPlanningModule({ marketData, onDataUpdate, metrics }: StrategicPlanningModuleProps) {
  const strategies = marketData?.strategic_planning?.market_entry_strategies || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Lightbulb className="h-6 w-6 text-orange-600" />
        <h2 className="text-2xl font-bold">Strategic Planning</h2>
      </div>

      {/* Market Entry Strategies */}
      {strategies.length > 0 ? (
        <div className="space-y-4">
          {strategies.map((strategy, index) => {
            const strategyType = strategy.type?.toLowerCase() || 'default';
            const Icon = STRATEGY_ICONS[strategyType] || STRATEGY_ICONS['default'];
            const colorClass = STRATEGY_COLORS[strategyType] || STRATEGY_COLORS['default'];

            return (
              <Card key={index} className={`border-l-4 ${colorClass}`}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <CardTitle className="text-lg">{strategy.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Strategy Essence */}
                  <div>
                    <h4 className="font-semibold mb-2">Strategy Essence</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      {strategy.essence.split('\n\n').map((paragraph, pIndex) => (
                        <p key={pIndex}>{paragraph}</p>
                      ))}
                    </div>
                  </div>

                  {/* Strategy Rationale */}
                  <div>
                    <h4 className="font-semibold mb-2">Rationale</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      {strategy.rationale.split('\n\n').map((paragraph, pIndex) => (
                        <p key={pIndex}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <ModuleImportCard
          moduleId="strategic_planning"
          moduleName="Strategic Planning"
          icon="Target"
          description="Define market entry strategies with detailed feasibility analysis and go-to-market roadmap"
          onDataUpload={(newData) => {
            if (onDataUpdate && marketData) {
              const merged = mergeMarketData(marketData, newData);
              onDataUpdate(merged as MarketData);
            } else if (onDataUpdate) {
              onDataUpdate(newData as MarketData);
            }
          }}
        />
      )}

      {/* Data Sources */}
      {marketData?.strategic_planning?.data_sources && marketData.strategic_planning.data_sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              {marketData.strategic_planning.data_sources.map((source, index) => (
                <li key={index}>• <DataSourceLink source={source} /></li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
