import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Heart, 
  TrendingUp, 
  Users, 
  Target,
  Download
} from 'lucide-react';

interface ExampleMarketAnalysisCase {
  id: string;
  title: string;
  description: string;
  industry: string;
  icon: React.ReactNode;
  metrics: {
    label: string;
    value: string;
  }[];
  highlights: string[];
}

const EXAMPLE_MARKET_CASES: ExampleMarketAnalysisCase[] = [
  {
    id: 'ev-charging-market',
    title: 'EV Charging Infrastructure',
    description: 'European electric vehicle charging market analysis with competitive landscape and market sizing',
    industry: 'CleanTech',
    icon: <Car className="h-6 w-6" />,
    metrics: [
      { label: 'Total Market', value: '€8.5B' },
      { label: 'Target Market', value: '€2.1B' },
      { label: 'Reachable Share', value: '€170M' },
      { label: 'Top Competitor', value: 'Ionity (35%)' }
    ],
    highlights: [
      'Fast-growing European market',
      'Government infrastructure support',
      'Commercial charging focus',
      '5-year strategic timeline'
    ]
  },
  {
    id: 'healthcare-ai-analytics',
    title: 'Healthcare AI Analytics',
    description: 'AI-powered healthcare analytics platform market opportunity in European healthcare sector',
    industry: 'HealthTech',
    icon: <Heart className="h-6 w-6" />,
    metrics: [
      { label: 'Total Market', value: '€12B' },
      { label: 'Target Market', value: '€1.8B' },
      { label: 'Reachable Share', value: '€90M' },
      { label: 'Top Competitor', value: 'IBM Watson (25%)' }
    ],
    highlights: [
      'Predictive analytics focus',
      'Clinical decision support',
      'European healthcare providers',
      '7-year market penetration'
    ]
  }
];

interface ExampleMarketAnalysesProps {
  onLoadExample: (caseId: string) => Promise<void>;
  isLoading?: boolean;
}

export function ExampleMarketAnalyses({ onLoadExample, isLoading }: ExampleMarketAnalysesProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-5 w-5 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold">Example Market Analyses</h3>
          <p className="text-sm text-muted-foreground">
            Ready-to-explore market research examples. Click any example to load it instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {EXAMPLE_MARKET_CASES.map((example) => (
          <Card key={example.id} className="group hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                    {example.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{example.title}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {example.industry}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {example.description}
              </p>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {example.metrics.map((metric, index) => (
                  <div key={index} className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-600">{metric.value}</div>
                    <div className="text-xs text-muted-foreground">{metric.label}</div>
                  </div>
                ))}
              </div>

              {/* Highlights */}
              <div className="space-y-2 mb-4">
                <h5 className="text-sm font-medium text-gray-900">Key Insights:</h5>
                <div className="grid grid-cols-1 gap-1">
                  {example.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                      {highlight}
                    </div>
                  ))}
                </div>
              </div>

              {/* Load Button */}
              <Button 
                onClick={() => onLoadExample(example.id)}
                disabled={isLoading}
                className="w-full group-hover:bg-blue-600 transition-colors"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? 'Loading...' : 'Explore This Market'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">What you'll see:</h4>
            <p className="text-sm text-blue-700 mt-1">
              Each example includes complete market sizing (TAM/SAM/SOM), competitive analysis, 
              customer segments, growth projections, and strategic recommendations - all ready to explore and adapt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
