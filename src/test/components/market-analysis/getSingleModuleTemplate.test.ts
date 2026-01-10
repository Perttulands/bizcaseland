/**
 * Tests for getSingleModuleTemplate function
 * Verifies that single module templates are correctly composed
 */

import { describe, it, expect } from 'vitest';
import { getSingleModuleTemplate, getFullTemplate } from '@/modules/market-analysis/components/MarketAnalysisTemplate';

describe('getSingleModuleTemplate', () => {
  describe('Module extraction', () => {
    it('should generate template with only market_sizing module', () => {
      const template = getSingleModuleTemplate('market_sizing');
      const parsed = JSON.parse(template);

      // Should have base structure
      expect(parsed).toHaveProperty('schema_version', '2.0');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.meta).toHaveProperty('title');
      expect(parsed.meta).toHaveProperty('currency');

      // Should have instructions
      expect(parsed).toHaveProperty('instructions');
      expect(parsed.instructions).toHaveProperty('purpose');
      expect(parsed.instructions).toHaveProperty('ai_workflow_protocol');
      expect(parsed.instructions).toHaveProperty('json_formatting_rules');
      expect(parsed.instructions.selected_modules).toContain('Market opportunity');

      // Should have ONLY market_sizing module
      expect(parsed).toHaveProperty('market_sizing');
      expect(parsed).toHaveProperty('market_share');
      
      // Should NOT have other modules
      expect(parsed).not.toHaveProperty('competitive_landscape');
      expect(parsed).not.toHaveProperty('customer_analysis');
      expect(parsed).not.toHaveProperty('strategic_planning');
    });

    it('should generate template with only competitive_intelligence module', () => {
      const template = getSingleModuleTemplate('competitive_intelligence');
      const parsed = JSON.parse(template);

      expect(parsed).toHaveProperty('schema_version', '2.0');
      expect(parsed).toHaveProperty('instructions');
      expect(parsed.instructions.selected_modules).toContain('Positioning matrix');

      // Should have competitive_intelligence module
      expect(parsed).toHaveProperty('competitive_landscape');
      expect(parsed.competitive_landscape).toHaveProperty('positioning_axes');
      
      // Should NOT have other modules
      expect(parsed).not.toHaveProperty('market_sizing');
      expect(parsed).not.toHaveProperty('customer_analysis');
      expect(parsed).not.toHaveProperty('strategic_planning');
    });

    it('should generate template with only customer_analysis module', () => {
      const template = getSingleModuleTemplate('customer_analysis');
      const parsed = JSON.parse(template);

      expect(parsed).toHaveProperty('schema_version', '2.0');
      expect(parsed).toHaveProperty('instructions');
      expect(parsed.instructions.selected_modules).toContain('Customer segments');

      // Should have customer_analysis module
      expect(parsed).toHaveProperty('customer_analysis');
      expect(parsed.customer_analysis).toHaveProperty('market_segments');
      
      // Should NOT have other modules
      expect(parsed).not.toHaveProperty('market_sizing');
      expect(parsed).not.toHaveProperty('competitive_landscape');
      expect(parsed).not.toHaveProperty('strategic_planning');
    });

    it('should generate template with only strategic_planning module', () => {
      
      const template = getSingleModuleTemplate('strategic_planning');
      const parsed = JSON.parse(template);

      expect(parsed).toHaveProperty('schema_version', '2.0');
      expect(parsed).toHaveProperty('instructions');
      expect(parsed.instructions.selected_modules).toContain('Market entry strategies');

      // Should have strategic_planning module
      expect(parsed).toHaveProperty('strategic_planning');
      expect(parsed.strategic_planning).toHaveProperty('market_entry_strategies');
      
      // Should NOT have other modules
      expect(parsed).not.toHaveProperty('market_sizing');
      expect(parsed).not.toHaveProperty('competitive_landscape');
      expect(parsed).not.toHaveProperty('customer_segments');
    });
  });

  describe('JSON validity', () => {
    it('should produce valid JSON for all modules', () => {
      const modules = ['market_sizing', 'competitive_intelligence', 'customer_analysis', 'strategic_planning'] as const;
      
      modules.forEach(moduleId => {
        const template = getSingleModuleTemplate(moduleId);
        
        // Should not throw when parsing
        expect(() => JSON.parse(template)).not.toThrow();
        
        const parsed = JSON.parse(template);
        
        // Should be valid JSON object
        expect(typeof parsed).toBe('object');
        expect(parsed).not.toBeNull();
      });
    });

    it('should have proper JSON formatting rules in instructions', () => {
      const template = getSingleModuleTemplate('market_sizing');
      const parsed = JSON.parse(template);

      expect(parsed.instructions.json_formatting_rules).toBeDefined();
      expect(parsed.instructions.json_formatting_rules.critical).toBeDefined();
      expect(Array.isArray(parsed.instructions.json_formatting_rules.critical)).toBe(true);
      expect(parsed.instructions.json_formatting_rules.critical.length).toBeGreaterThan(0);
      
      // Check for trailing comma warning
      const criticalRules = parsed.instructions.json_formatting_rules.critical.join(' ');
      expect(criticalRules).toContain('trailing comma');
    });
  });

  describe('Template structure', () => {
    it('should include all required metadata fields', () => {
      const template = getSingleModuleTemplate('market_sizing');
      const parsed = JSON.parse(template);

      expect(parsed.meta).toHaveProperty('title');
      expect(parsed.meta).toHaveProperty('description');
      expect(parsed.meta).toHaveProperty('currency');
      expect(parsed.meta).toHaveProperty('base_year');
      expect(parsed.meta).toHaveProperty('analysis_horizon_years');
      expect(parsed.meta).toHaveProperty('created_date');
      expect(parsed.meta).toHaveProperty('analyst');
    });

    it('should include AI workflow protocol', () => {
      const template = getSingleModuleTemplate('strategic_planning');
      const parsed = JSON.parse(template);

      expect(parsed.instructions.ai_workflow_protocol).toBeDefined();
      expect(parsed.instructions.ai_workflow_protocol.initial_prompt).toBeDefined();
      expect(parsed.instructions.ai_workflow_protocol.collaborative_mode).toBeDefined();
      expect(parsed.instructions.ai_workflow_protocol.autonomous_mode).toBeDefined();
    });

    it('should include rationale requirements', () => {
      const template = getSingleModuleTemplate('customer_analysis');
      const parsed = JSON.parse(template);

      expect(parsed.instructions.rationale_requirements).toBeDefined();
      expect(parsed.instructions.rationale_requirements.mandatory).toBeDefined();
      expect(parsed.instructions.rationale_requirements.quality).toBeDefined();
    });
  });

  describe('Template size', () => {
    it('should be smaller than full template', () => {
      const singleTemplate = getSingleModuleTemplate('market_sizing');
      const fullTemplate = getFullTemplate();

      expect(singleTemplate.length).toBeLessThan(fullTemplate.length);
      expect(singleTemplate.length).toBeGreaterThan(500); // Should still be substantial
    });

    it('should be under 5000 characters for easy AI consumption', () => {
      const modules = ['market_sizing', 'competitive_intelligence', 'customer_analysis', 'strategic_planning'] as const;
      
      modules.forEach(moduleId => {
        const template = getSingleModuleTemplate(moduleId);
        // Single modules should be compact
        expect(template.length).toBeLessThan(5000);
      });
    });
  });

  describe('Module descriptions', () => {
    it('should include correct module description in selected_modules', () => {
      const testCases = [
        { id: 'market_sizing' as const, desc: 'Market opportunity' },
        { id: 'competitive_intelligence' as const, desc: 'Positioning matrix' },
        { id: 'customer_analysis' as const, desc: 'Customer segments' },
        { id: 'strategic_planning' as const, desc: 'Market entry strategies' }
      ];

      testCases.forEach(({ id, desc }) => {
        const template = getSingleModuleTemplate(id);
        const parsed = JSON.parse(template);
        
        expect(parsed.instructions.selected_modules).toContain(desc);
      });
    });
  });
});
