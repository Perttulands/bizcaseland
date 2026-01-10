/**
 * Business Case Module
 * 
 * This module provides all components and functionality for creating,
 * analyzing, and managing business cases.
 */

// Core components
export { BusinessCaseAnalyzer } from './components/BusinessCaseAnalyzer';
export { AssumptionsTab } from './components/AssumptionsTab';
export { CashFlowStatement } from './components/CashFlowStatement';
export { FinancialAnalysis } from './components/FinancialAnalysis';
export { SensitivityAnalysis } from './components/SensitivityAnalysis';
export { VolumeAnalysisTab } from './components/VolumeAnalysisTab';

// UI components
export { EditableValueCell } from './components/EditableValueCell';
export { EditableRationaleCell } from './components/EditableRationaleCell';
export { SensitivityDriverBadge } from './components/SensitivityDriverBadge';

// Templates and examples
export { JSONTemplateComponent } from './components/JSONTemplateComponent';
export { getJSONTemplate } from './components/JSONTemplate';
export { ExampleBusinessCases } from './components/ExampleBusinessCases';
export { BUSINESS_CASE_SAMPLE_DATA as sampleBusinessData } from './components/SampleData';
