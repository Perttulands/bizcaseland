/**
 * Shared Feature Components
 * 
 * Components that are used across multiple modules but are feature-specific
 * (not generic enough for the common component library).
 */

export { ErrorBoundary } from './ErrorBoundary';
export { DataVisualization } from './DataVisualization';
export { DatapointsViewer } from './JSONDataViewer';
export { CustomerSegments } from './CustomerSegments';
export { VolumeComparison } from './VolumeComparison';
export { SharedDataManager } from './SharedDataManager';
export { ThemeToggle } from './ThemeToggle';
export { ResearchDocPanel, ResearchBadge, useResearchDocuments } from './ResearchDocPanel';
export { AICopilotSidebar, AICopilotToggle, ChatMessage, ChatMessageList, ChatInput } from './AIChatSidebar';

// Evidence Trail Visualization (bi-72e)
export {
  EvidenceTrailTree,
  EvidenceTrailPanel,
  EvidenceTrailCell,
  EvidenceTrailButton,
  useEvidenceTrail,
} from './EvidenceTrail';

// What-If Playground (bi-md5)
export {
  WhatIfPlayground,
  WhatIfSlider,
  PRESET_SCENARIOS,
} from './WhatIfPlayground';
