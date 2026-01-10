import { describe, it, expect } from 'vitest';
import { generateModularTemplate } from '@/modules/market-analysis/components/MarketAnalysisTemplate';

describe('Modular Template Generation', () => {
  it('should generate template with only market_sizing module', () => {
    const template = generateModularTemplate(['market_sizing']);
    const parsed = JSON.parse(template);
    
    // Should have base sections
    expect(parsed.schema_version).toBeDefined();
    expect(parsed.meta).toBeDefined();
    expect(parsed.instructions).toBeDefined();
    
    // Should have market_sizing data sections
    expect(parsed.market_sizing).toBeDefined();
    expect(parsed.market_share).toBeDefined();
    
    // Should NOT have other module data sections
    expect(parsed.competitive_landscape).toBeUndefined();
    expect(parsed.customer_analysis).toBeUndefined();
    expect(parsed.strategic_planning).toBeUndefined();
    
    // Instructions should indicate selected modules
    expect(parsed.instructions.selected_modules).toBeDefined();
    expect(parsed.instructions.selected_modules).toContain('Market opportunity');
    expect(parsed.instructions.purpose).toBeDefined();
    expect(parsed.instructions.ai_workflow_protocol).toBeDefined();
  });
  
  it('should generate template with market_sizing and competitive_intelligence', () => {
    const template = generateModularTemplate(['market_sizing', 'competitive_intelligence']);
    const parsed = JSON.parse(template);
    
    // Should have selected module data sections
    expect(parsed.market_sizing).toBeDefined();
    expect(parsed.market_share).toBeDefined();
    expect(parsed.competitive_landscape).toBeDefined();
    
    // Should NOT have unselected module data sections
    expect(parsed.customer_analysis).toBeUndefined();
    expect(parsed.strategic_planning).toBeUndefined();
    
    // Instructions should indicate selected modules
    expect(parsed.instructions.selected_modules).toContain('Market opportunity');
    expect(parsed.instructions.selected_modules).toContain('Positioning matrix');
    
    // Should have instructions structure
    expect(parsed.instructions.ai_workflow_protocol).toBeDefined();
    expect(parsed.instructions.ai_workflow_protocol.collaborative_mode).toBeDefined();
  });
  
  it('should generate full template with all modules', () => {
    const template = generateModularTemplate([
      'market_sizing',
      'competitive_intelligence',
      'customer_analysis',
      'strategic_planning'
    ]);
    const parsed = JSON.parse(template);
    
    // Should have all module data sections
    expect(parsed.market_sizing).toBeDefined();
    expect(parsed.market_share).toBeDefined();
    expect(parsed.competitive_landscape).toBeDefined();
    expect(parsed.customer_analysis).toBeDefined();
    expect(parsed.strategic_planning).toBeDefined();
    
    // Instructions should indicate all modules
    expect(parsed.instructions.selected_modules).toBe('All modules included');
  });
  
  it('should generate smaller templates for fewer modules', () => {
    const template1 = generateModularTemplate(['market_sizing']);
    const template4 = generateModularTemplate([
      'market_sizing',
      'competitive_intelligence',
      'customer_analysis',
      'strategic_planning'
    ]);
    
    // Single module template should be significantly smaller
    expect(template1.length).toBeLessThan(template4.length);
    
    // Should be at least 30% smaller
    const reductionPercent = (1 - template1.length / template4.length) * 100;
    expect(reductionPercent).toBeGreaterThan(30);
  });
  
  it('should update instructions note to reflect selected modules', () => {
    const template1 = generateModularTemplate(['market_sizing']);
    const parsed1 = JSON.parse(template1);
    expect(parsed1.instructions.selected_modules).toContain('Market opportunity');
    
    const template2 = generateModularTemplate(['market_sizing', 'customer_analysis']);
    const parsed2 = JSON.parse(template2);
    expect(parsed2.instructions.selected_modules).toContain('Market opportunity');
    expect(parsed2.instructions.selected_modules).toContain('Customer segments');
  });
  
  it('should update instructions to focus on selected modules', () => {
    const template = generateModularTemplate(['competitive_intelligence']);
    const parsed = JSON.parse(template);
    
    // Instructions should contain information about the selected module
    expect(parsed.instructions.selected_modules).toContain('Positioning matrix');
    expect(parsed.instructions.purpose).toBeDefined();
    expect(parsed.instructions.ai_workflow_protocol).toBeDefined();
  });
});
