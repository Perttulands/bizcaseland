/**
 * Market Insights Cart System
 * 
 * This system implements a "shopping cart" paradigm for market analysis insights,
 * allowing users to collect various market data points and transfer them 
 * to business case analysis on demand.
 * 
 * Key Concepts:
 * 1. Market Insights: Extractable data points from market analysis
 * 2. Cart: Temporary storage for collected insights
 * 3. Transfer Operations: Batch operations to move data to business case
 * 4. Data Lineage: Full traceability of data sources
 */

import { MarketData } from '@/core/types';
import { BusinessData } from '@/core/types';

// ===== CORE TYPES =====

/**
 * Types of market insights that can be collected
 */
export type MarketInsightType = 
  | 'volume_projection'
  | 'market_sizing'
  | 'customer_segment'
  | 'pricing_insight'
  | 'competitive_analysis'
  | 'growth_trajectory';

/**
 * Market insight priority levels for transfer recommendations
 */
export type InsightPriority = 'high' | 'medium' | 'low';

/**
 * Status of insights in the cart
 */
export type CartItemStatus = 'active' | 'pending_validation' | 'transfer_ready' | 'transferred';

/**
 * Base interface for all market insights
 */
export interface MarketInsight {
  readonly id: string;
  readonly type: MarketInsightType;
  readonly title: string;
  readonly description: string;
  readonly priority: InsightPriority;
  readonly source: {
    readonly marketDataId: string;
    readonly analysisTitle: string;
    readonly timestamp: string;
    readonly analyst?: string;
  };
  readonly confidence: {
    readonly score: number; // 0-100
    readonly factors: readonly string[];
  };
  readonly metadata: Record<string, unknown>;
}

/**
 * Volume projection insight from market analysis
 */
export interface VolumeProjectionInsight extends MarketInsight {
  readonly type: 'volume_projection';
  readonly data: {
    readonly projectedVolume: number;
    readonly unit: string;
    readonly timeframe: string;
    readonly methodology: string;
    readonly assumedUnitPrice?: number;
    readonly marketValue: number;
    readonly tamBasis: number;
    readonly marketShare: number;
  };
}

/**
 * Market sizing insight (TAM/SAM/SOM)
 */
export interface MarketSizingInsight extends MarketInsight {
  readonly type: 'market_sizing';
  readonly data: {
    readonly tam: number;
    readonly sam: number;
    readonly som: number;
    readonly samPercentage: number;
    readonly somPercentage: number;
    readonly currency: string;
    readonly baseYear: number;
    readonly growthRate: number;
  };
}

/**
 * Customer segment insight
 */
export interface CustomerSegmentInsight extends MarketInsight {
  readonly type: 'customer_segment';
  readonly data: {
    readonly segmentId: string;
    readonly segmentName: string;
    readonly sizePercentage: number;
    readonly growthRate: number;
    readonly targetShare: number;
    readonly valueDrivers: readonly string[];
    readonly customerProfile: string;
  };
}

/**
 * Pricing insight from market analysis
 */
export interface PricingInsight extends MarketInsight {
  readonly type: 'pricing_insight';
  readonly data: {
    readonly recommendedPrice: number;
    readonly priceRange: {
      readonly min: number;
      readonly max: number;
    };
    readonly currency: string;
    readonly pricingStrategy: string;
    readonly competitiveBenchmarks: readonly {
      readonly competitor: string;
      readonly price: number;
    }[];
  };
}

/**
 * Union type for all insight types
 */
export type AnyMarketInsight = 
  | VolumeProjectionInsight 
  | MarketSizingInsight 
  | CustomerSegmentInsight 
  | PricingInsight;

// ===== CART SYSTEM =====

/**
 * Cart item wrapping an insight with cart-specific metadata
 */
export interface CartItem {
  readonly insight: AnyMarketInsight;
  readonly addedAt: string;
  readonly status: CartItemStatus;
  readonly transferTarget?: {
    readonly businessCaseId: string;
    readonly targetPath: string; // Where in business case this should go
  };
  readonly userNotes?: string;
  readonly validationErrors?: readonly string[];
}

/**
 * Transfer operation configuration
 */
export interface TransferOperation {
  readonly id: string;
  readonly items: readonly CartItem[];
  readonly targetBusinessCaseId: string;
  readonly transferType: 'bulk' | 'selective';
  readonly options: {
    readonly preserveExistingData: boolean;
    readonly mergeStrategy: 'replace' | 'append' | 'smart_merge';
    readonly validateBeforeTransfer: boolean;
  };
  readonly metadata: {
    readonly title?: string;
    readonly description?: string;
    readonly analyst?: string;
  };
}

/**
 * Cart state interface
 */
export interface CartState {
  readonly items: readonly CartItem[];
  readonly totalItems: number;
  readonly itemsByType: Record<MarketInsightType, readonly CartItem[]>;
  readonly pendingTransfers: readonly TransferOperation[];
  readonly lastUpdated: string;
}

/**
 * Cart validation result
 */
export interface CartValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly itemValidations: Record<string, {
    readonly isValid: boolean;
    readonly errors: readonly string[];
  }>;
}

/**
 * Transfer result
 */
export interface TransferResult {
  readonly success: boolean;
  readonly transferId: string;
  readonly itemsTransferred: number;
  readonly itemsFailed: number;
  readonly message: string;
  readonly details: readonly {
    readonly itemId: string;
    readonly success: boolean;
    readonly message: string;
  }[];
}

// ===== EXTRACTION RULES =====

/**
 * Rules for extracting insights from market data
 */
export interface InsightExtractionRules {
  readonly volumeProjection: {
    readonly requiredFields: readonly string[];
    readonly qualityThresholds: {
      readonly minTamValue: number;
      readonly minMarketShare: number;
      readonly minConfidence: number;
    };
  };
  readonly marketSizing: {
    readonly requiredSamPercentage: number;
    readonly requiredSomPercentage: number;
  };
  readonly customerSegments: {
    readonly minSegmentSize: number;
    readonly maxSegments: number;
  };
}

// ===== SERVICE INTERFACE =====

/**
 * Configuration for the market insights cart service
 */
export interface CartServiceConfig {
  readonly maxCartItems: number;
  readonly autoValidation: boolean;
  readonly persistenceEnabled: boolean;
  readonly extractionRules: InsightExtractionRules;
}

/**
 * Market insights cart service interface
 */
export interface IMarketInsightsCartService {
  // Cart Management
  addInsight(insight: AnyMarketInsight, userNotes?: string): Promise<boolean>;
  removeInsight(insightId: string): Promise<boolean>;
  clearCart(): Promise<void>;
  getCartState(): CartState;
  
  // Insight Extraction
  extractInsightsFromMarket(marketData: MarketData): Promise<readonly AnyMarketInsight[]>;
  extractVolumeProjection(marketData: MarketData): Promise<VolumeProjectionInsight | null>;
  extractMarketSizing(marketData: MarketData): Promise<MarketSizingInsight | null>;
  extractCustomerSegments(marketData: MarketData): Promise<readonly CustomerSegmentInsight[]>;
  
  // Validation
  validateCart(): Promise<CartValidationResult>;
  validateInsight(insight: AnyMarketInsight): Promise<boolean>;
  
  // Transfer Operations
  createTransferOperation(items: readonly CartItem[], config: Partial<TransferOperation>): TransferOperation;
  executeTransfer(operation: TransferOperation, businessData: BusinessData): Promise<TransferResult>;
  
  // Recommendations
  getTransferRecommendations(businessData?: BusinessData): Promise<readonly {
    readonly item: CartItem;
    readonly reason: string;
    readonly priority: InsightPriority;
  }[]>;
  
  // Persistence
  saveCart(): Promise<void>;
  loadCart(): Promise<void>;
}

// ===== DEFAULT CONFIGURATION =====

export const DEFAULT_CART_CONFIG: CartServiceConfig = {
  maxCartItems: 50,
  autoValidation: true,
  persistenceEnabled: true,
  extractionRules: {
    volumeProjection: {
      requiredFields: ['tam', 'sam', 'target_share'],
      qualityThresholds: {
        minTamValue: 10000, // Minimum TAM of €10K
        minMarketShare: 0.1, // Minimum 0.1% market share
        minConfidence: 30 // Minimum 30% confidence
      }
    },
    marketSizing: {
      requiredSamPercentage: 1, // Minimum 1% SAM
      requiredSomPercentage: 1  // Minimum 1% SOM
    },
    customerSegments: {
      minSegmentSize: 0.5, // Minimum 0.5% of market
      maxSegments: 10      // Maximum 10 segments
    }
  }
};

// ===== UTILITY FUNCTIONS =====

/**
 * Generate unique insight ID
 */
export function generateInsightId(type: MarketInsightType, sourceId: string): string {
  const timestamp = Date.now();
  return `insight_${type}_${sourceId}_${timestamp}`;
}

/**
 * Calculate insight confidence score based on data completeness
 */
export function calculateInsightConfidence(
  insight: Partial<AnyMarketInsight>, 
  marketData: MarketData
): number {
  // Implementation will vary by insight type
  // Base calculation on data completeness, source quality, etc.
  return 75; // Placeholder
}

/**
 * Validate market data for insight extraction
 */
export function validateMarketDataForExtraction(marketData: MarketData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!marketData.market_sizing?.total_addressable_market?.base_value?.value) {
    errors.push('Total Addressable Market value is required');
  }
  
  if (!marketData.market_share?.target_position?.target_share?.value) {
    errors.push('Target market share is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
