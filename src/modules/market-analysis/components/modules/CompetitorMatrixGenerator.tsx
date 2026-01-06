/**
 * CompetitorMatrixGenerator - Auto-generate competitor analysis from web research
 * Discovers competitors, pricing, features, and positioning with source citations
 */

import React, { useState, useCallback } from 'react';
import {
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Globe,
  Building2,
  DollarSign,
  Users,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

import { webSearchService, type SearchResult } from '@/core/services/web-search-service';
import type { MarketData, Competitor, CompetitorFeature } from '@/core/types';

// ============================================================================
// Types
// ============================================================================

interface CompetitorDraft {
  id: string;
  name: string;
  website: string;
  positioning: string;
  marketShare: string;
  marketShareRationale: string;
  marketShareSource: string;
  pricingModel: string;
  priceLow: string;
  priceHigh: string;
  pricingRationale: string;
  pricingSource: string;
  features: { name: string; hasFeature: boolean; notes: string }[];
  strengths: string[];
  weaknesses: string[];
  threatLevel: 'high' | 'medium' | 'low';
  dataSources: string[];
  xPosition: number;
  yPosition: number;
}

interface CompetitorMatrixGeneratorProps {
  marketData: MarketData;
  onDataUpdate: (data: MarketData) => void;
}

// ============================================================================
// Feature Templates
// ============================================================================

const DEFAULT_FEATURES = [
  'API Access',
  'Mobile App',
  'Enterprise SSO',
  'Custom Integrations',
  'Analytics Dashboard',
  'White-label Option',
  '24/7 Support',
  'Free Trial',
];

const INDUSTRY_FEATURE_PRESETS: Record<string, string[]> = {
  saas: ['API Access', 'SSO/SAML', 'Custom Integrations', 'Analytics', 'Mobile App', 'White-label', 'SOC2 Compliance', 'Webhooks'],
  fintech: ['Bank Integration', 'PCI Compliance', 'Real-time Processing', 'Multi-currency', 'Fraud Detection', 'API Access', 'Audit Trail', 'Regulatory Reporting'],
  ecommerce: ['Multi-channel', 'Inventory Sync', 'Payment Gateway', 'Shipping Integration', 'Returns Management', 'Analytics', 'Mobile-optimized', 'SEO Tools'],
  healthcare: ['HIPAA Compliant', 'EHR Integration', 'Patient Portal', 'Telehealth', 'Scheduling', 'Billing Integration', 'Mobile App', 'Secure Messaging'],
};

// ============================================================================
// Helper Functions
// ============================================================================

function createEmptyCompetitor(): CompetitorDraft {
  return {
    id: crypto.randomUUID(),
    name: '',
    website: '',
    positioning: '',
    marketShare: '',
    marketShareRationale: '',
    marketShareSource: '',
    pricingModel: 'subscription',
    priceLow: '',
    priceHigh: '',
    pricingRationale: '',
    pricingSource: '',
    features: DEFAULT_FEATURES.map(f => ({ name: f, hasFeature: false, notes: '' })),
    strengths: [],
    weaknesses: [],
    threatLevel: 'medium',
    dataSources: [],
    xPosition: 50,
    yPosition: 50,
  };
}

function draftToCompetitor(draft: CompetitorDraft): Competitor {
  return {
    name: draft.name,
    website: draft.website || undefined,
    market_share: {
      value: parseFloat(draft.marketShare) || 0,
      unit: 'percentage',
      rationale: draft.marketShareRationale,
      link: draft.marketShareSource || undefined,
    },
    positioning: draft.positioning,
    pricing: {
      pricing_model: draft.pricingModel,
      pricing_tier_low: draft.priceLow ? {
        value: parseFloat(draft.priceLow),
        unit: 'EUR/month',
        rationale: draft.pricingRationale,
        link: draft.pricingSource || undefined,
      } : undefined,
      pricing_tier_high: draft.priceHigh ? {
        value: parseFloat(draft.priceHigh),
        unit: 'EUR/month',
        rationale: draft.pricingRationale,
        link: draft.pricingSource || undefined,
      } : undefined,
    },
    features: draft.features
      .filter(f => f.name.trim())
      .map(f => ({
        name: f.name,
        has_feature: f.hasFeature,
        notes: f.notes || undefined,
      })),
    strengths: draft.strengths.filter(s => s.trim()),
    weaknesses: draft.weaknesses.filter(w => w.trim()),
    threat_level: draft.threatLevel,
    competitive_response: 'Monitoring recommended',
    x_position: draft.xPosition,
    y_position: draft.yPosition,
    data_sources: draft.dataSources.filter(s => s.trim()),
  };
}

// ============================================================================
// Sub-components
// ============================================================================

interface SearchResultsPanelProps {
  results: SearchResult[];
  onAddSource: (url: string) => void;
  addedSources: Set<string>;
}

function SearchResultsPanel({ results, onAddSource, addedSources }: SearchResultsPanelProps) {
  if (results.length === 0) return null;

  return (
    <ScrollArea className="h-48 border rounded-md">
      <div className="p-2 space-y-2">
        {results.map((result, idx) => (
          <div
            key={result.url}
            className="p-2 border rounded hover:bg-muted/50 flex items-start gap-2"
          >
            <span className="text-xs text-muted-foreground font-mono">[{idx + 1}]</span>
            <div className="flex-1 min-w-0">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                <span className="truncate">{result.title}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{result.domain}</span>
                {result.isTrusted && (
                  <Badge variant="secondary" className="h-4 text-[10px] text-green-600">
                    <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
                    Trusted
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {result.description}
              </p>
            </div>
            <Button
              variant={addedSources.has(result.url) ? "secondary" : "outline"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onAddSource(result.url)}
              disabled={addedSources.has(result.url)}
            >
              {addedSources.has(result.url) ? 'Added' : 'Add'}
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

interface CompetitorEditorProps {
  competitor: CompetitorDraft;
  features: string[];
  onUpdate: (updated: CompetitorDraft) => void;
  onDelete: () => void;
  onSearch: (query: string) => Promise<SearchResult[]>;
}

function CompetitorEditor({ competitor, features, onUpdate, onDelete, onSearch }: CompetitorEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const addedSources = new Set(competitor.dataSources);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await onSearch(searchQuery);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, onSearch]);

  const handleAddSource = useCallback((url: string) => {
    if (!competitor.dataSources.includes(url)) {
      onUpdate({
        ...competitor,
        dataSources: [...competitor.dataSources, url],
      });
    }
  }, [competitor, onUpdate]);

  const updateField = <K extends keyof CompetitorDraft>(field: K, value: CompetitorDraft[K]) => {
    onUpdate({ ...competitor, [field]: value });
  };

  const updateFeature = (index: number, updates: Partial<{ name: string; hasFeature: boolean; notes: string }>) => {
    const newFeatures = [...competitor.features];
    newFeatures[index] = { ...newFeatures[index], ...updates };
    onUpdate({ ...competitor, features: newFeatures });
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <CardTitle className="text-lg">
                  {competitor.name || 'New Competitor'}
                </CardTitle>
                {competitor.website && (
                  <Badge variant="outline" className="text-xs">
                    <Globe className="h-3 w-3 mr-1" />
                    {new URL(competitor.website).hostname}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    competitor.threatLevel === 'high' ? 'destructive' :
                    competitor.threatLevel === 'medium' ? 'default' : 'secondary'
                  }
                >
                  {competitor.threatLevel} threat
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`name-${competitor.id}`}>Company Name</Label>
                <Input
                  id={`name-${competitor.id}`}
                  value={competitor.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`website-${competitor.id}`}>Website</Label>
                <Input
                  id={`website-${competitor.id}`}
                  value={competitor.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`positioning-${competitor.id}`}>Market Positioning</Label>
              <Textarea
                id={`positioning-${competitor.id}`}
                value={competitor.positioning}
                onChange={(e) => updateField('positioning', e.target.value)}
                placeholder="How do they position themselves in the market?"
                rows={2}
              />
            </div>

            {/* Market Share */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Market Share
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Share (%)</Label>
                  <Input
                    type="number"
                    value={competitor.marketShare}
                    onChange={(e) => updateField('marketShare', e.target.value)}
                    placeholder="e.g., 15"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Rationale</Label>
                  <Input
                    value={competitor.marketShareRationale}
                    onChange={(e) => updateField('marketShareRationale', e.target.value)}
                    placeholder="Source/reasoning for this estimate"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Source URL</Label>
                <Input
                  value={competitor.marketShareSource}
                  onChange={(e) => updateField('marketShareSource', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing
              </h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Model</Label>
                  <Select
                    value={competitor.pricingModel}
                    onValueChange={(v) => updateField('pricingModel', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="per-unit">Per Unit</SelectItem>
                      <SelectItem value="freemium">Freemium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="one-time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Low Tier (EUR/mo)</Label>
                  <Input
                    type="number"
                    value={competitor.priceLow}
                    onChange={(e) => updateField('priceLow', e.target.value)}
                    placeholder="e.g., 29"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">High Tier (EUR/mo)</Label>
                  <Input
                    type="number"
                    value={competitor.priceHigh}
                    onChange={(e) => updateField('priceHigh', e.target.value)}
                    placeholder="e.g., 299"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Source URL</Label>
                  <Input
                    value={competitor.pricingSource}
                    onChange={(e) => updateField('pricingSource', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pricing Notes</Label>
                <Input
                  value={competitor.pricingRationale}
                  onChange={(e) => updateField('pricingRationale', e.target.value)}
                  placeholder="Additional context about pricing"
                />
              </div>
            </div>

            {/* Features Matrix */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <h4 className="font-medium">Features</h4>
              <div className="grid grid-cols-2 gap-2">
                {competitor.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-background rounded border">
                    <Checkbox
                      checked={feature.hasFeature}
                      onCheckedChange={(checked) =>
                        updateFeature(idx, { hasFeature: checked as boolean })
                      }
                    />
                    <span className="text-sm flex-1">{feature.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Threat Level & Position */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Threat Level</Label>
                <Select
                  value={competitor.threatLevel}
                  onValueChange={(v: 'high' | 'medium' | 'low') => updateField('threatLevel', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>X Position (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={competitor.xPosition}
                  onChange={(e) => updateField('xPosition', parseInt(e.target.value) || 50)}
                />
              </div>
              <div className="space-y-2">
                <Label>Y Position (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={competitor.yPosition}
                  onChange={(e) => updateField('yPosition', parseInt(e.target.value) || 50)}
                />
              </div>
            </div>

            {/* Web Research */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Search className="h-4 w-4" />
                Research Sources
              </h4>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search for ${competitor.name || 'competitor'} pricing, market share...`}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              <SearchResultsPanel
                results={searchResults}
                onAddSource={handleAddSource}
                addedSources={addedSources}
              />

              {competitor.dataSources.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Added Sources ({competitor.dataSources.length})</Label>
                  <div className="flex flex-wrap gap-1">
                    {competitor.dataSources.map((source, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <a href={source} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {new URL(source).hostname}
                        </a>
                        <button
                          className="ml-1 hover:text-destructive"
                          onClick={() => updateField('dataSources', competitor.dataSources.filter((_, i) => i !== idx))}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function CompetitorMatrixGenerator({ marketData, onDataUpdate }: CompetitorMatrixGeneratorProps) {
  const [competitors, setCompetitors] = useState<CompetitorDraft[]>(() => {
    // Initialize from existing market data
    const existing = marketData?.competitive_landscape?.competitors || [];
    if (existing.length > 0) {
      return existing.map((c) => ({
        id: crypto.randomUUID(),
        name: c.name,
        website: c.website || '',
        positioning: c.positioning,
        marketShare: c.market_share?.value?.toString() || '',
        marketShareRationale: c.market_share?.rationale || '',
        marketShareSource: c.market_share?.link || '',
        pricingModel: c.pricing?.pricing_model || 'subscription',
        priceLow: c.pricing?.pricing_tier_low?.value?.toString() || '',
        priceHigh: c.pricing?.pricing_tier_high?.value?.toString() || '',
        pricingRationale: c.pricing?.pricing_tier_low?.rationale || '',
        pricingSource: c.pricing?.pricing_tier_low?.link || '',
        features: c.features?.map(f => ({
          name: f.name,
          hasFeature: f.has_feature,
          notes: f.notes || '',
        })) || DEFAULT_FEATURES.map(f => ({ name: f, hasFeature: false, notes: '' })),
        strengths: [...c.strengths],
        weaknesses: [...c.weaknesses],
        threatLevel: c.threat_level,
        dataSources: c.data_sources ? [...c.data_sources] : [],
        xPosition: c.x_position || 50,
        yPosition: c.y_position || 50,
      }));
    }
    return [];
  });

  const [industry, setIndustry] = useState('');
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<SearchResult[]>([]);
  const [featurePreset, setFeaturePreset] = useState<string>('');

  const isSearchEnabled = webSearchService.isSearchEnabled();

  // Handle web search for individual competitor research
  const handleSearch = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!isSearchEnabled) return [];
    try {
      const response = await webSearchService.search(query, { count: 8, freshness: 'year' });
      return response.results;
    } catch {
      return [];
    }
  }, [isSearchEnabled]);

  // Handle competitor discovery search
  const handleDiscovery = useCallback(async () => {
    if (!discoveryQuery.trim() || !isSearchEnabled) return;
    setIsDiscovering(true);
    try {
      const response = await webSearchService.searchCompetitors(discoveryQuery, industry || undefined);
      setDiscoveryResults(response.results);
    } catch {
      setDiscoveryResults([]);
    } finally {
      setIsDiscovering(false);
    }
  }, [discoveryQuery, industry, isSearchEnabled]);

  // Add new competitor
  const addCompetitor = useCallback((name?: string, website?: string) => {
    const newComp = createEmptyCompetitor();
    if (name) newComp.name = name;
    if (website) newComp.website = website;

    // Apply feature preset if selected
    if (featurePreset && INDUSTRY_FEATURE_PRESETS[featurePreset]) {
      newComp.features = INDUSTRY_FEATURE_PRESETS[featurePreset].map(f => ({
        name: f,
        hasFeature: false,
        notes: '',
      }));
    }

    setCompetitors(prev => [...prev, newComp]);
  }, [featurePreset]);

  // Update competitor
  const updateCompetitor = useCallback((id: string, updated: CompetitorDraft) => {
    setCompetitors(prev => prev.map(c => c.id === id ? updated : c));
  }, []);

  // Delete competitor
  const deleteCompetitor = useCallback((id: string) => {
    setCompetitors(prev => prev.filter(c => c.id !== id));
  }, []);

  // Save to market data
  const handleSave = useCallback(() => {
    const validCompetitors = competitors
      .filter(c => c.name.trim())
      .map(draftToCompetitor);

    const updatedData: MarketData = {
      ...marketData,
      competitive_landscape: {
        ...marketData?.competitive_landscape,
        competitors: validCompetitors,
      },
    };

    onDataUpdate(updatedData);
  }, [competitors, marketData, onDataUpdate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Competitive Intelligence Matrix</h2>
            <p className="text-sm text-muted-foreground">
              Auto-generate competitor analysis from web research with sourced data
            </p>
          </div>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Save to Market Analysis
        </Button>
      </div>

      {/* Discovery Panel */}
      {isSearchEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Discover Competitors
            </CardTitle>
            <CardDescription>
              Search the web to find competitors you might not know about
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Your Product/Company</Label>
                <Input
                  value={discoveryQuery}
                  onChange={(e) => setDiscoveryQuery(e.target.value)}
                  placeholder="e.g., project management software"
                  onKeyDown={(e) => e.key === 'Enter' && handleDiscovery()}
                />
              </div>
              <div className="space-y-2">
                <Label>Industry (optional)</Label>
                <Input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g., SaaS, fintech"
                />
              </div>
              <div className="space-y-2">
                <Label>Feature Preset</Label>
                <Select value={featurePreset} onValueChange={setFeaturePreset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="fintech">Fintech</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleDiscovery} disabled={isDiscovering || !discoveryQuery.trim()}>
              {isDiscovering ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Find Competitors
                </>
              )}
            </Button>

            {discoveryResults.length > 0 && (
              <div className="space-y-2">
                <Label>Search Results - Click to add as competitor</Label>
                <ScrollArea className="h-48 border rounded-md">
                  <div className="p-2 space-y-2">
                    {discoveryResults.map((result, idx) => (
                      <div
                        key={result.url}
                        className="p-3 border rounded hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          // Extract company name from title (heuristic)
                          const name = result.title.split(/[-|:]/)[0].trim();
                          addCompetitor(name, result.url);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{result.title}</p>
                            <p className="text-xs text-muted-foreground">{result.domain}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {result.description}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Competitor Button */}
      <Button variant="outline" onClick={() => addCompetitor()} className="w-full gap-2">
        <Plus className="h-4 w-4" />
        Add Competitor Manually
      </Button>

      {/* Competitor List */}
      <div className="space-y-4">
        {competitors.map((competitor) => (
          <CompetitorEditor
            key={competitor.id}
            competitor={competitor}
            features={featurePreset && INDUSTRY_FEATURE_PRESETS[featurePreset]
              ? INDUSTRY_FEATURE_PRESETS[featurePreset]
              : DEFAULT_FEATURES}
            onUpdate={(updated) => updateCompetitor(competitor.id, updated)}
            onDelete={() => deleteCompetitor(competitor.id)}
            onSearch={handleSearch}
          />
        ))}
      </div>

      {/* Comparison Grid Preview */}
      {competitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comparison Matrix Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Competitor</TableHead>
                    <TableHead>Market Share</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Threat</TableHead>
                    <TableHead>Sources</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitors.filter(c => c.name.trim()).map((comp) => (
                    <TableRow key={comp.id}>
                      <TableCell className="font-medium">
                        {comp.website ? (
                          <a
                            href={comp.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:underline text-primary"
                          >
                            {comp.name}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          comp.name
                        )}
                      </TableCell>
                      <TableCell>
                        {comp.marketShare ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="underline decoration-dotted cursor-help">
                                  {comp.marketShare}%
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{comp.marketShareRationale || 'No rationale provided'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {comp.priceLow || comp.priceHigh ? (
                          <span className="text-sm">
                            {comp.pricingModel}: {comp.priceLow && `€${comp.priceLow}`}
                            {comp.priceLow && comp.priceHigh && ' - '}
                            {comp.priceHigh && `€${comp.priceHigh}`}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            comp.threatLevel === 'high' ? 'destructive' :
                            comp.threatLevel === 'medium' ? 'default' : 'secondary'
                          }
                        >
                          {comp.threatLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {comp.dataSources.length} sources
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {competitors.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Competitors Added</h3>
            <p className="text-muted-foreground mb-4">
              {isSearchEnabled
                ? 'Use the discovery search above to find competitors, or add them manually.'
                : 'Add competitors manually to build your competitive intelligence matrix.'}
            </p>
            <Button variant="outline" onClick={() => addCompetitor()}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Competitor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CompetitorMatrixGenerator;
