/**
 * Market Insights Cart Service Implementation
 * 
 * This service implements the shopping cart paradigm for market analysis insights.
 * It provides comprehensive functionality for collecting, validating, and transferring
 * market data to business case analysis.
 */

import { 
  IMarketInsightsCartService,
  CartServiceConfig,
  CartState,
  CartItem,
  AnyMarketInsight,
  MarketInsight,
  VolumeProjectionInsight,
  MarketSizingInsight,
  CustomerSegmentInsight,
  TransferOperation,
  TransferResult,
  CartValidationResult,
  InsightPriority,
  generateInsightId,
  calculateInsightConfidence,
  validateMarketDataForExtraction,
  DEFAULT_CART_CONFIG
} from './market-insights-cart';
import { MarketData } from '@/core/types';
import { BusinessData } from '@/core/types';

/**
 * Market Insights Cart Service
 * 
 * Manages a collection of market insights with shopping cart functionality
 */
export class MarketInsightsCartService implements IMarketInsightsCartService {
  private items: CartItem[] = [];
  private config: CartServiceConfig;

  constructor(config: Partial<CartServiceConfig> = {}) {
    this.config = { ...DEFAULT_CART_CONFIG, ...config };
    this.loadCart();
  }

  // ===== CART MANAGEMENT =====

  async addInsight(insight: AnyMarketInsight, userNotes?: string): Promise<boolean> {
    try {
      // Check cart capacity
      if (this.items.length >= this.config.maxCartItems) {
        throw new Error(`Cart is full. Maximum ${this.config.maxCartItems} items allowed.`);
      }

      // Check for duplicates
      const existingItem = this.items.find(item => item.insight.id === insight.id);
      if (existingItem) {
        throw new Error(`Insight ${insight.id} is already in cart`);
      }

      // Validate insight if auto-validation is enabled
      if (this.config.autoValidation) {
        const isValid = await this.validateInsight(insight);
        if (!isValid) {
          throw new Error(`Insight ${insight.id} failed validation`);
        }
      }

      // Create cart item
      const cartItem: CartItem = {
        insight,
        addedAt: new Date().toISOString(),
        status: 'active',
        userNotes
      };

      this.items.push(cartItem);
      
      if (this.config.persistenceEnabled) {
        await this.saveCart();
      }

      return true;
    } catch (error) {
      console.error('Failed to add insight to cart:', error);
      return false;
    }
  }

  async removeInsight(insightId: string): Promise<boolean> {
    try {
      const initialLength = this.items.length;
      this.items = this.items.filter(item => item.insight.id !== insightId);
      
      const removed = this.items.length < initialLength;
      
      if (removed && this.config.persistenceEnabled) {
        await this.saveCart();
      }

      return removed;
    } catch (error) {
      console.error('Failed to remove insight from cart:', error);
      return false;
    }
  }

  async clearCart(): Promise<void> {
    try {
      this.items = [];
      
      if (this.config.persistenceEnabled) {
        await this.saveCart();
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  }

  getCartState(): CartState {
    const itemsByType = this.items.reduce((acc, item) => {
      const type = item.insight.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);

    return {
      items: [...this.items],
      totalItems: this.items.length,
      itemsByType: itemsByType as any,
      pendingTransfers: [], // TODO: Implement pending transfers tracking
      lastUpdated: new Date().toISOString()
    };
  }

  // ===== INSIGHT EXTRACTION =====

  async extractInsightsFromMarket(marketData: MarketData): Promise<readonly AnyMarketInsight[]> {
    const insights: AnyMarketInsight[] = [];

    try {
      // Validate market data first
      const validation = validateMarketDataForExtraction(marketData);
      if (!validation.isValid) {
        console.warn('Market data validation failed:', validation.errors);
        return insights;
      }

      // Extract volume projection
      const volumeProjection = await this.extractVolumeProjection(marketData);
      if (volumeProjection) {
        insights.push(volumeProjection);
      }

      // Extract market sizing
      const marketSizing = await this.extractMarketSizing(marketData);
      if (marketSizing) {
        insights.push(marketSizing);
      }

      // Extract customer segments
      const customerSegments = await this.extractCustomerSegments(marketData);
      insights.push(...customerSegments);

      return insights;
    } catch (error) {
      console.error('Failed to extract insights from market data:', error);
      return insights;
    }
  }

  async extractVolumeProjection(marketData: MarketData): Promise<VolumeProjectionInsight | null> {
    try {
      const tam = marketData.market_sizing?.total_addressable_market?.base_value?.value || 0;
      const samPct = marketData.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.value || 0;
      const somPct = marketData.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.value || 0;
      const targetShare = marketData.market_share?.target_position?.target_share?.value || 0;

      // Check quality thresholds
      const rules = this.config.extractionRules.volumeProjection;
      if (tam < rules.qualityThresholds.minTamValue || 
          targetShare < rules.qualityThresholds.minMarketShare) {
        return null;
      }

      const marketValue = tam * (samPct / 100) * (somPct / 100) * (targetShare / 100);
      const assumedUnitPrice = 100; // Default for calculation
      const projectedVolume = marketValue / assumedUnitPrice;

      const insight: VolumeProjectionInsight = {
        id: generateInsightId('volume_projection', marketData.meta?.title || 'market_analysis'),
        type: 'volume_projection',
        title: 'Market-Based Volume Projection',
        description: `Projected volume based on TAM analysis and market share targets`,
        priority: 'high',
        source: {
          marketDataId: marketData.meta?.title || 'unknown',
          analysisTitle: marketData.meta?.title || 'Market Analysis',
          timestamp: new Date().toISOString(),
          analyst: marketData.meta?.analyst
        },
        confidence: {
          score: this.calculateVolumeProjectionConfidence(marketData),
          factors: [
            'TAM data quality',
            'Market share assumptions',
            'Competitive analysis depth'
          ]
        },
        metadata: {
          extractedAt: new Date().toISOString(),
          method: 'tam_sam_som_calculation'
        },
        data: {
          projectedVolume: Math.round(projectedVolume),
          unit: 'units_per_year',
          timeframe: 'annual',
          methodology: 'TAM × SAM% × SOM% × Target Share% ÷ Unit Price',
          assumedUnitPrice,
          marketValue: Math.round(marketValue),
          tamBasis: tam,
          marketShare: targetShare
        }
      };

      return insight;
    } catch (error) {
      console.error('Failed to extract volume projection:', error);
      return null;
    }
  }

  async extractMarketSizing(marketData: MarketData): Promise<MarketSizingInsight | null> {
    try {
      const tam = marketData.market_sizing?.total_addressable_market?.base_value?.value || 0;
      const samPct = marketData.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.value || 0;
      const somPct = marketData.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.value || 0;
      const growthRate = marketData.market_sizing?.total_addressable_market?.growth_rate?.value || 0;

      // Check minimum thresholds
      const rules = this.config.extractionRules.marketSizing;
      if (samPct < rules.requiredSamPercentage || somPct < rules.requiredSomPercentage) {
        return null;
      }

      const sam = tam * (samPct / 100);
      const som = sam * (somPct / 100);

      const insight: MarketSizingInsight = {
        id: generateInsightId('market_sizing', marketData.meta?.title || 'market_analysis'),
        type: 'market_sizing',
        title: 'Market Sizing Analysis',
        description: `TAM/SAM/SOM breakdown with growth projections`,
        priority: 'high',
        source: {
          marketDataId: marketData.meta?.title || 'unknown',
          analysisTitle: marketData.meta?.title || 'Market Analysis',
          timestamp: new Date().toISOString(),
          analyst: marketData.meta?.analyst
        },
        confidence: {
          score: this.calculateMarketSizingConfidence(marketData),
          factors: [
            'Data source quality',
            'Market definition clarity',
            'Growth assumptions'
          ]
        },
        metadata: {
          extractedAt: new Date().toISOString(),
          method: 'tam_sam_som_analysis'
        },
        data: {
          tam,
          sam: Math.round(sam),
          som: Math.round(som),
          samPercentage: samPct,
          somPercentage: somPct,
          currency: marketData.meta?.currency || 'EUR',
          baseYear: marketData.meta?.base_year || 2024,
          growthRate
        }
      };

      return insight;
    } catch (error) {
      console.error('Failed to extract market sizing:', error);
      return null;
    }
  }

  async extractCustomerSegments(marketData: MarketData): Promise<readonly CustomerSegmentInsight[]> {
    try {
      const segments = marketData.customer_analysis?.market_segments || [];
      const insights: CustomerSegmentInsight[] = [];

      for (const segment of segments) {
        const sizePercentage = segment.size_percentage?.value || 0;
        
        // Check minimum segment size
        if (sizePercentage < this.config.extractionRules.customerSegments.minSegmentSize) {
          continue;
        }

        const insight: CustomerSegmentInsight = {
          id: generateInsightId('customer_segment', segment.id),
          type: 'customer_segment',
          title: `Customer Segment: ${segment.name}`,
          description: `Market segment analysis for ${segment.name}`,
          priority: sizePercentage > 10 ? 'high' : sizePercentage > 5 ? 'medium' : 'low',
          source: {
            marketDataId: marketData.meta?.title || 'unknown',
            analysisTitle: marketData.meta?.title || 'Market Analysis',
            timestamp: new Date().toISOString(),
            analyst: marketData.meta?.analyst
          },
          confidence: {
            score: this.calculateSegmentConfidence(segment),
            factors: [
              'Segment definition clarity',
              'Size estimation accuracy',
              'Growth projection reliability'
            ]
          },
          metadata: {
            extractedAt: new Date().toISOString(),
            originalSegmentId: segment.id
          },
          data: {
            segmentId: segment.id,
            segmentName: segment.name,
            sizePercentage,
            growthRate: segment.growth_rate?.value || 0,
            targetShare: segment.target_share?.value || 0,
            valueDrivers: segment.value_drivers || [],
            customerProfile: segment.customer_profile || ''
          }
        };

        insights.push(insight);

        // Respect maximum segments limit
        if (insights.length >= this.config.extractionRules.customerSegments.maxSegments) {
          break;
        }
      }

      return insights;
    } catch (error) {
      console.error('Failed to extract customer segments:', error);
      return [];
    }
  }

  // ===== VALIDATION =====

  async validateCart(): Promise<CartValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const itemValidations: Record<string, { isValid: boolean; errors: string[] }> = {};

    // Validate individual items
    for (const item of this.items) {
      const itemResult = await this.validateInsight(item.insight);
      itemValidations[item.insight.id] = {
        isValid: itemResult,
        errors: itemResult ? [] : ['Failed validation']
      };

      if (!itemResult) {
        errors.push(`Item ${item.insight.title} failed validation`);
      }
    }

    // Check cart constraints
    if (this.items.length === 0) {
      warnings.push('Cart is empty');
    }

    if (this.items.length > this.config.maxCartItems * 0.8) {
      warnings.push(`Cart is near capacity (${this.items.length}/${this.config.maxCartItems})`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      itemValidations
    };
  }

  async validateInsight(insight: AnyMarketInsight): Promise<boolean> {
    try {
      // Basic validation
      if (!insight.id || !insight.title || !insight.type) {
        return false;
      }

      // Type-specific validation
      switch (insight.type) {
        case 'volume_projection':
          return this.validateVolumeProjection(insight as VolumeProjectionInsight);
        case 'market_sizing':
          return this.validateMarketSizing(insight as MarketSizingInsight);
        case 'customer_segment':
          return this.validateCustomerSegment(insight as CustomerSegmentInsight);
        default:
          return true;
      }
    } catch (error) {
      console.error('Insight validation failed:', error);
      return false;
    }
  }

  // ===== TRANSFER OPERATIONS =====

  createTransferOperation(items: readonly CartItem[], config: Partial<TransferOperation>): TransferOperation {
    return {
      id: `transfer_${Date.now()}`,
      items: [...items],
      targetBusinessCaseId: config.targetBusinessCaseId || '',
      transferType: config.transferType || 'selective',
      options: {
        preserveExistingData: true,
        mergeStrategy: 'smart_merge',
        validateBeforeTransfer: true,
        ...config.options
      },
      metadata: {
        title: config.metadata?.title || 'Market Insights Transfer',
        description: config.metadata?.description || `Transfer of ${items.length} market insights`,
        analyst: config.metadata?.analyst,
        ...config.metadata
      }
    };
  }

  async executeTransfer(operation: TransferOperation, businessData: BusinessData): Promise<TransferResult> {
    const details: Array<{ itemId: string; success: boolean; message: string }> = [];
    let itemsTransferred = 0;
    let itemsFailed = 0;

    try {
      for (const item of operation.items) {
        try {
          const success = await this.transferSingleItem(item, businessData, operation.options);
          
          if (success) {
            itemsTransferred++;
            details.push({
              itemId: item.insight.id,
              success: true,
              message: 'Successfully transferred'
            });
          } else {
            itemsFailed++;
            details.push({
              itemId: item.insight.id,
              success: false,
              message: 'Transfer failed - validation error'
            });
          }
        } catch (error) {
          itemsFailed++;
          details.push({
            itemId: item.insight.id,
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return {
        success: itemsTransferred > 0,
        transferId: operation.id,
        itemsTransferred,
        itemsFailed,
        message: `Transfer completed: ${itemsTransferred} successful, ${itemsFailed} failed`,
        details
      };
    } catch (error) {
      return {
        success: false,
        transferId: operation.id,
        itemsTransferred: 0,
        itemsFailed: operation.items.length,
        message: error instanceof Error ? error.message : 'Transfer operation failed',
        details: []
      };
    }
  }

  // ===== RECOMMENDATIONS =====

  async getTransferRecommendations(businessData?: BusinessData): Promise<readonly {
    readonly item: CartItem;
    readonly reason: string;
    readonly priority: InsightPriority;
  }[]> {
    const recommendations: Array<{
      item: CartItem;
      reason: string;
      priority: InsightPriority;
    }> = [];

    for (const item of this.items) {
      if (item.status === 'transfer_ready' || item.status === 'active') {
        let reason = '';
        let priority = item.insight.priority;

        switch (item.insight.type) {
          case 'volume_projection':
            reason = 'High-confidence volume projection ready for business case integration';
            priority = 'high';
            break;
          case 'market_sizing':
            reason = 'Market sizing data can inform business case assumptions';
            priority = 'medium';
            break;
          case 'customer_segment':
            reason = 'Customer segment insights can enhance targeting strategy';
            priority = item.insight.priority;
            break;
          default:
            reason = 'Market insight available for transfer';
        }

        recommendations.push({ item, reason, priority });
      }
    }

    // Sort by priority (high first)
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // ===== PERSISTENCE =====

  async saveCart(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cartData = {
          items: this.items,
          config: this.config,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('market-insights-cart', JSON.stringify(cartData));
      }
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  }

  async loadCart(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('market-insights-cart');
        if (saved) {
          const cartData = JSON.parse(saved);
          this.items = cartData.items || [];
          // Don't override config - use constructor config
        }
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      this.items = [];
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private calculateVolumeProjectionConfidence(marketData: MarketData): number {
    let score = 50; // Base score

    // Boost score based on data completeness
    if (marketData.market_sizing?.total_addressable_market?.base_value?.value) score += 20;
    if (marketData.market_sizing?.serviceable_addressable_market) score += 15;
    if (marketData.market_share?.target_position?.target_share?.value) score += 15;

    return Math.min(100, score);
  }

  private calculateMarketSizingConfidence(marketData: MarketData): number {
    let score = 60; // Base score for market sizing

    if (marketData.market_sizing?.total_addressable_market?.data_sources?.length) score += 15;
    if (marketData.market_sizing?.total_addressable_market?.growth_rate?.value) score += 10;
    if (marketData.competitive_landscape?.competitors?.length) score += 15;

    return Math.min(100, score);
  }

  private calculateSegmentConfidence(segment: any): number {
    let score = 40; // Base score

    if (segment.size_percentage?.value > 0) score += 20;
    if (segment.growth_rate?.value > 0) score += 15;
    if (segment.value_drivers?.length > 0) score += 15;
    if (segment.customer_profile) score += 10;

    return Math.min(100, score);
  }

  private validateVolumeProjection(insight: VolumeProjectionInsight): boolean {
    return insight.data.projectedVolume > 0 && 
           insight.data.marketValue > 0 && 
           insight.data.tamBasis > 0;
  }

  private validateMarketSizing(insight: MarketSizingInsight): boolean {
    return insight.data.tam > 0 && 
           insight.data.sam > 0 && 
           insight.data.som > 0;
  }

  private validateCustomerSegment(insight: CustomerSegmentInsight): boolean {
    return insight.data.sizePercentage > 0 && 
           insight.data.segmentName.length > 0;
  }

  private async transferSingleItem(
    item: CartItem, 
    businessData: BusinessData, 
    options: TransferOperation['options']
  ): Promise<boolean> {
    // This is a placeholder - actual implementation would depend on
    // the specific business case structure and transfer requirements
    console.log('Transferring item:', item.insight.title);
    console.log('To business case:', businessData.meta?.title);
    console.log('Options:', options);
    
    // For now, just return true to indicate successful transfer
    // Real implementation would update the business case data structure
    return true;
  }
}

// Export singleton instance
export const marketInsightsCart = new MarketInsightsCartService();
