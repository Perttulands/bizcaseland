import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Zap, Smartphone, TrendingUp } from 'lucide-react';

interface ExampleBusinessCase {
  id: string;
  title: string;
  description: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  fileName: string;
  metrics: {
    timeframe: string;
    investment: string;
    model: string;
  };
}

const EXAMPLE_CASES: ExampleBusinessCase[] = [
  {
    id: 'saas-platform',
    title: 'SaaS Platform Launch',
    description: 'New software platform targeting small businesses with subscription pricing and customer growth projections',
    type: 'Revenue Growth',
    icon: TrendingUp,
    color: 'bg-blue-500',
    fileName: 'saas-platform-revenue-growth.json',
    metrics: {
      timeframe: '5 years',
      investment: '€315K initial',
      model: 'Recurring revenue'
    }
  },
  {
    id: 'cost-savings',
    title: 'Payroll Automation',
    description: 'Process automation project to reduce manual work and administrative costs',
    type: 'Cost Savings',
    icon: Zap,
    color: 'bg-green-500',
    fileName: 'payroll-automation-cost-savings.json',
    metrics: {
      timeframe: '5 years',
      investment: '€30K automation',
      model: 'Cost reduction'
    }
  },
  {
    id: 'iot-product',
    title: 'Smart Home Device',
    description: 'IoT product launch with hardware sales and service revenue streams',
    type: 'Product Launch',
    icon: Smartphone,
    color: 'bg-purple-500',
    fileName: 'iot-product-launch.json',
    metrics: {
      timeframe: '4 years',
      investment: '€150K development',
      model: 'Product sales'
    }
  },
  {
    id: 'fintech-entry',
    title: 'European Market Entry',
    description: 'Fintech platform expansion into new European markets with localization',
    type: 'Market Entry',
    icon: Building2,
    color: 'bg-orange-500',
    fileName: 'fintech-market-entry.json',
    metrics: {
      timeframe: '5 years',
      investment: '€200K expansion',
      model: 'Transaction fees'
    }
  }
];

interface ExampleBusinessCasesProps {
  onLoadExample: (fileName: string, title: string) => void;
}

export function ExampleBusinessCases({ onLoadExample }: ExampleBusinessCasesProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Ready-to-Use Business Case Examples</h3>
        <p className="text-sm text-muted-foreground">
          Click any example below to instantly load a complete business case analysis
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXAMPLE_CASES.map((example) => {
          const IconComponent = example.icon;
          return (
            <Card key={example.id} className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${example.color} text-white p-2 rounded-lg`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">{example.title}</CardTitle>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {example.type}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  {example.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Timeframe:</span>
                    <span className="font-medium">{example.metrics.timeframe}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Investment:</span>
                    <span className="font-medium">{example.metrics.investment}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Model:</span>
                    <span className="font-medium">{example.metrics.model}</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => onLoadExample(example.fileName, example.title)}
                >
                  Use This Example
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="text-center text-xs text-muted-foreground">
        <p>These examples show different business models and analysis approaches you can adapt for your own projects.</p>
      </div>
    </div>
  );
}