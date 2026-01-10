/**
 * Market Path Utilities
 * Utilities for generating and working with paths to market data fields
 */

import { MarketData, ValueWithMeta } from './market-calculations';

export interface MarketAssumptionRow {
  key: string;
  label: string;
  path: string;
  valuePath: string;
  unitPath: string;
  rationalePath: string;
  value: number;
  unit: string;
  rationale: string;
  category: string;
  subcategory?: string;
}

/**
 * Extract all editable assumptions from market data
 */
export function extractMarketAssumptions(marketData: MarketData): MarketAssumptionRow[] {
  const rows: MarketAssumptionRow[] = [];

  if (!marketData) return rows;

  // Market Sizing - TAM
  if (marketData.market_sizing?.total_addressable_market) {
    const tam = marketData.market_sizing.total_addressable_market;
    
    if (tam.base_value) {
      rows.push(createRow(
        'tam_base_value',
        'TAM Base Value',
        'market_sizing.total_addressable_market.base_value',
        tam.base_value,
        'Market Sizing',
        'Total Addressable Market'
      ));
    }
    
    if (tam.growth_rate) {
      rows.push(createRow(
        'tam_growth_rate',
        'TAM Growth Rate',
        'market_sizing.total_addressable_market.growth_rate',
        tam.growth_rate,
        'Market Sizing',
        'Total Addressable Market'
      ));
    }
  }

  // Market Sizing - SAM
  if (marketData.market_sizing?.serviceable_addressable_market) {
    const sam = marketData.market_sizing.serviceable_addressable_market;
    
    if (sam.percentage_of_tam) {
      rows.push(createRow(
        'sam_percentage',
        'SAM % of TAM',
        'market_sizing.serviceable_addressable_market.percentage_of_tam',
        sam.percentage_of_tam,
        'Market Sizing',
        'Serviceable Addressable Market'
      ));
    }
  }

  // Market Sizing - SOM
  if (marketData.market_sizing?.serviceable_obtainable_market) {
    const som = marketData.market_sizing.serviceable_obtainable_market;
    
    if (som.percentage_of_sam) {
      rows.push(createRow(
        'som_percentage',
        'SOM % of SAM',
        'market_sizing.serviceable_obtainable_market.percentage_of_sam',
        som.percentage_of_sam,
        'Market Sizing',
        'Serviceable Obtainable Market'
      ));
    }
  }

  // Market Share - Current Position
  if (marketData.market_share?.current_position) {
    const current = marketData.market_share.current_position;
    
    if (current.current_share) {
      rows.push(createRow(
        'current_share',
        'Current Market Share',
        'market_share.current_position.current_share',
        current.current_share,
        'Market Share',
        'Current Position'
      ));
    }
    
    if (current.current_revenue) {
      rows.push(createRow(
        'current_revenue',
        'Current Revenue',
        'market_share.current_position.current_revenue',
        current.current_revenue,
        'Market Share',
        'Current Position'
      ));
    }
  }

  // Market Share - Target Position
  if (marketData.market_share?.target_position) {
    const target = marketData.market_share.target_position;
    
    if (target.target_share) {
      rows.push(createRow(
        'target_share',
        'Target Market Share',
        'market_share.target_position.target_share',
        target.target_share,
        'Market Share',
        'Target Position'
      ));
    }
    
    if (target.target_timeframe) {
      rows.push(createRow(
        'target_timeframe',
        'Target Timeframe',
        'market_share.target_position.target_timeframe',
        target.target_timeframe,
        'Market Share',
        'Target Position'
      ));
    }
  }

  // Competitive Landscape - Competitors
  if (marketData.competitive_landscape?.competitors) {
    marketData.competitive_landscape.competitors.forEach((competitor, index) => {
      if (competitor.market_share) {
        rows.push(createRow(
          `competitor_${index}_share`,
          `${competitor.name} Market Share`,
          `competitive_landscape.competitors[${index}].market_share`,
          competitor.market_share,
          'Competitive Intelligence',
          'Competitor Analysis'
        ));
      }
    });
  }

  // Customer Analysis - Market Segments
  if (marketData.customer_analysis?.market_segments) {
    marketData.customer_analysis.market_segments.forEach((segment, index) => {
      if (segment.size_percentage) {
        rows.push(createRow(
          `segment_${index}_size_pct`,
          `${segment.name} Size %`,
          `customer_analysis.market_segments[${index}].size_percentage`,
          segment.size_percentage,
          'Customer Analysis',
          segment.name
        ));
      }
      
      if (segment.size_value) {
        rows.push(createRow(
          `segment_${index}_size_value`,
          `${segment.name} Size Value`,
          `customer_analysis.market_segments[${index}].size_value`,
          segment.size_value,
          'Customer Analysis',
          segment.name
        ));
      }
      
      if (segment.growth_rate) {
        rows.push(createRow(
          `segment_${index}_growth`,
          `${segment.name} Growth Rate`,
          `customer_analysis.market_segments[${index}].growth_rate`,
          segment.growth_rate,
          'Customer Analysis',
          segment.name
        ));
      }
    });
  }

  return rows;
}

/**
 * Create a standardized assumption row from ValueWithMeta
 */
function createRow(
  key: string,
  label: string,
  basePath: string,
  valueWithMeta: ValueWithMeta,
  category: string,
  subcategory?: string
): MarketAssumptionRow {
  return {
    key,
    label,
    path: basePath,
    valuePath: `${basePath}.value`,
    unitPath: `${basePath}.unit`,
    rationalePath: `${basePath}.rationale`,
    value: valueWithMeta.value,
    unit: valueWithMeta.unit,
    rationale: valueWithMeta.rationale || '',
    category,
    subcategory
  };
}

/**
 * Group assumptions by category for display
 */
export function groupAssumptionsByCategory(rows: MarketAssumptionRow[]): Map<string, MarketAssumptionRow[]> {
  const grouped = new Map<string, MarketAssumptionRow[]>();
  
  rows.forEach(row => {
    const category = row.category;
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(row);
  });
  
  return grouped;
}

/**
 * Get category display order
 */
export function getCategoryOrder(): string[] {
  return [
    'Market Sizing',
    'Market Share',
    'Competitive Intelligence',
    'Customer Analysis'
  ];
}

/**
 * Validate if a path exists in market data
 */
export function isValidMarketPath(marketData: MarketData, path: string): boolean {
  try {
    const pathParts = path.split('.');
    let current: any = marketData;
    
    for (const part of pathParts) {
      if (part.includes('[') && part.includes(']')) {
        const match = part.match(/^(.+)\[(\d+)\]$/);
        if (!match) return false;
        
        const [, arrayName, indexStr] = match;
        const index = parseInt(indexStr, 10);
        
        if (!current[arrayName] || !Array.isArray(current[arrayName])) return false;
        if (index < 0 || index >= current[arrayName].length) return false;
        
        current = current[arrayName][index];
      } else {
        if (!current || typeof current !== 'object' || !(part in current)) return false;
        current = current[part];
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get a human-readable label from a path
 */
export function getPathLabel(path: string): string {
  const lastPart = path.split('.').pop() || '';
  
  // Convert snake_case to Title Case
  return lastPart
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
