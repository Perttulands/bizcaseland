# Design: Data Architecture - Supabase Schema & Business Case Modeling

> Generated: 2026-01-06
> Status: Ready for Review
> Author: polecat/toast

## Executive Summary

Design for persisting Bizcaseland data in Supabase with full provenance tracking. The schema supports the core requirement: **every cell value can be traced back through assumptions to research sessions to data points to sources**.

**Key Decisions:**
- **Hybrid storage**: JSON blobs for complex nested structures + normalized tables for provenance
- **Cell-level provenance**: `data_points` table links any value to research backing
- **Versioning**: Append-only `business_case_versions` for full history
- **Collaboration**: Project-based access with RLS for team editing
- **Time-series native**: Monthly projections stored as JSONB arrays for performance

## Problem Statement

Current state:
- Pure client-side with localStorage
- No collaboration (single user)
- No versioning (lose history on edit)
- No AI research persistence (research docs lost on page refresh)
- No provenance chain (can't trace where a number came from)

Target state:
- Multi-user collaboration on business cases
- Full version history with branching
- Persistent AI research with traceable provenance
- Every value traceable: value -> assumptions -> research sessions -> data points -> sources

## Entity-Relationship Model

```
                                    ┌─────────────────┐
                                    │     users       │
                                    │─────────────────│
                                    │ id (auth.users) │
                                    │ display_name    │
                                    │ avatar_url      │
                                    └────────┬────────┘
                                             │
                         ┌───────────────────┼───────────────────┐
                         │                   │                   │
                         ▼                   ▼                   ▼
              ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
              │    projects     │  │  team_members   │  │ research_sessions│
              │─────────────────│  │─────────────────│  │─────────────────│
              │ id              │◄─┤ project_id (FK) │  │ id              │
              │ owner_id (FK)   │  │ user_id (FK)    │  │ project_id (FK) │
              │ name            │  │ role            │  │ user_id (FK)    │
              │ description     │  │ invited_at      │  │ query           │
              │ created_at      │  └─────────────────┘  │ model_id        │
              └────────┬────────┘                       │ messages (JSONB)│
                       │                                │ created_at      │
         ┌─────────────┼─────────────┐                  └────────┬────────┘
         │             │             │                           │
         ▼             ▼             ▼                           │
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐      │
│ business_cases  │ │ market_analyses │ │   data_points   │◄─────┘
│─────────────────│ │─────────────────│ │─────────────────│
│ id              │ │ id              │ │ id              │
│ project_id (FK) │ │ project_id (FK) │ │ project_id (FK) │
│ current_version │ │ current_version │ │ session_id (FK) │
│ created_at      │ │ created_at      │ │ target_path     │
│ updated_at      │ │ updated_at      │ │ value           │
└────────┬────────┘ └────────┬────────┘ │ unit            │
         │                   │          │ confidence      │
         ▼                   ▼          │ sources (JSONB) │
┌─────────────────┐ ┌─────────────────┐ │ ai_rationale    │
│business_case_   │ │market_analysis_ │ │ created_at      │
│  versions       │ │  versions       │ └────────┬────────┘
│─────────────────│ │─────────────────│          │
│ id              │ │ id              │          │
│ business_case_id│ │ market_analysis │          │
│ version_number  │ │ version_number  │          ▼
│ data (JSONB)    │ │ data (JSONB)    │ ┌─────────────────┐
│ change_summary  │ │ change_summary  │ │  cell_backing   │
│ created_by (FK) │ │ created_by (FK) │ │─────────────────│
│ created_at      │ │ created_at      │ │ id              │
│ parent_version  │ │ parent_version  │ │ business_case_id│
└─────────────────┘ └─────────────────┘ │ OR market_id    │
                                        │ cell_path       │
                                        │ data_point_id   │
                                        │ version_added   │
                                        └─────────────────┘
```

## Supabase Table Schemas

### Core Tables

```sql
-- ============================================================================
-- Users (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Projects (container for business cases + market analyses)
-- ============================================================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT DEFAULT 'USD' CHECK (currency IN ('EUR','USD','GBP','JPY','CAD','AUD','CHF','SEK','NOK','DKK')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_owner ON public.projects(owner_id);

-- ============================================================================
-- Team Members (collaboration)
-- ============================================================================
CREATE TYPE team_role AS ENUM ('owner', 'editor', 'viewer');

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'viewer',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_team_members_project ON public.team_members(project_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
```

### Business Case Tables

```sql
-- ============================================================================
-- Business Cases (main entity)
-- ============================================================================
CREATE TABLE public.business_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  current_version_id UUID, -- Set after first version created
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id) -- One business case per project
);

CREATE INDEX idx_business_cases_project ON public.business_cases(project_id);

-- ============================================================================
-- Business Case Versions (append-only history)
-- ============================================================================
CREATE TABLE public.business_case_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_case_id UUID NOT NULL REFERENCES public.business_cases(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  parent_version_id UUID REFERENCES public.business_case_versions(id),

  -- The full BusinessData structure as JSONB
  -- Matches TypeScript: BusinessData { meta, assumptions, drivers, scenarios, structure }
  data JSONB NOT NULL,

  change_summary TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_case_id, version_number)
);

CREATE INDEX idx_bc_versions_case ON public.business_case_versions(business_case_id);
CREATE INDEX idx_bc_versions_created ON public.business_case_versions(created_at DESC);

-- Add FK constraint after table exists
ALTER TABLE public.business_cases
  ADD CONSTRAINT fk_current_version
  FOREIGN KEY (current_version_id)
  REFERENCES public.business_case_versions(id);
```

### Market Analysis Tables

```sql
-- ============================================================================
-- Market Analyses (parallel structure to business cases)
-- ============================================================================
CREATE TABLE public.market_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  current_version_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id)
);

CREATE INDEX idx_market_analyses_project ON public.market_analyses(project_id);

-- ============================================================================
-- Market Analysis Versions
-- ============================================================================
CREATE TABLE public.market_analysis_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_analysis_id UUID NOT NULL REFERENCES public.market_analyses(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  parent_version_id UUID REFERENCES public.market_analysis_versions(id),

  -- The full MarketData structure as JSONB
  data JSONB NOT NULL,

  change_summary TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(market_analysis_id, version_number)
);

CREATE INDEX idx_ma_versions_analysis ON public.market_analysis_versions(market_analysis_id);

ALTER TABLE public.market_analyses
  ADD CONSTRAINT fk_ma_current_version
  FOREIGN KEY (current_version_id)
  REFERENCES public.market_analysis_versions(id);
```

### Research & Provenance Tables

```sql
-- ============================================================================
-- Research Sessions (AI chat sessions with context)
-- ============================================================================
CREATE TABLE public.research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Session metadata
  title TEXT, -- Optional user-provided title
  query TEXT, -- Initial query that started the session
  model_id TEXT, -- Which AI model was used

  -- Chat messages as JSONB array
  -- Matches: ChatMessage[] from ai.ts
  messages JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Token usage tracking
  total_tokens INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_research_sessions_project ON public.research_sessions(project_id);
CREATE INDEX idx_research_sessions_user ON public.research_sessions(user_id);
CREATE INDEX idx_research_sessions_created ON public.research_sessions(created_at DESC);

-- ============================================================================
-- Data Points (research findings that can back cell values)
-- ============================================================================
CREATE TABLE public.data_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.research_sessions(id) ON DELETE SET NULL,

  -- What this data point is about
  target_path TEXT, -- JSON path like 'assumptions.pricing.avg_unit_price'

  -- The data point itself
  value NUMERIC,
  unit TEXT,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),

  -- Sources backing this data point (ResearchSource[] from ai.ts)
  sources JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- AI reasoning
  ai_rationale TEXT,
  ai_model_id TEXT,
  ai_generated BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_points_project ON public.data_points(project_id);
CREATE INDEX idx_data_points_session ON public.data_points(session_id);
CREATE INDEX idx_data_points_path ON public.data_points(target_path);

-- ============================================================================
-- Cell Backing (links specific cells to their provenance)
-- ============================================================================
-- This is the key table for provenance tracking
-- A cell in a business case can be backed by multiple data points
CREATE TABLE public.cell_backing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which document (exactly one must be set)
  business_case_id UUID REFERENCES public.business_cases(id) ON DELETE CASCADE,
  market_analysis_id UUID REFERENCES public.market_analyses(id) ON DELETE CASCADE,

  -- Which cell in the document
  cell_path TEXT NOT NULL, -- e.g., 'assumptions.pricing.avg_unit_price.value'

  -- Which data point backs this cell
  data_point_id UUID NOT NULL REFERENCES public.data_points(id) ON DELETE CASCADE,

  -- When was this backing added (for version tracking)
  version_added INTEGER NOT NULL, -- Version number when this backing was added
  version_removed INTEGER, -- Version number when this backing was removed (null = still active)

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure either business_case_id OR market_analysis_id is set, not both
  CONSTRAINT check_single_parent CHECK (
    (business_case_id IS NOT NULL AND market_analysis_id IS NULL) OR
    (business_case_id IS NULL AND market_analysis_id IS NOT NULL)
  )
);

CREATE INDEX idx_cell_backing_bc ON public.cell_backing(business_case_id) WHERE business_case_id IS NOT NULL;
CREATE INDEX idx_cell_backing_ma ON public.cell_backing(market_analysis_id) WHERE market_analysis_id IS NOT NULL;
CREATE INDEX idx_cell_backing_path ON public.cell_backing(cell_path);
CREATE INDEX idx_cell_backing_dp ON public.cell_backing(data_point_id);
```

### Calculated Results Cache

```sql
-- ============================================================================
-- Calculation Cache (optional, for performance)
-- ============================================================================
-- Pre-computed monthly projections for fast dashboard rendering
CREATE TABLE public.calculation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_case_version_id UUID NOT NULL REFERENCES public.business_case_versions(id) ON DELETE CASCADE,

  -- Matches CalculatedMetrics from business.ts
  metrics JSONB NOT NULL,

  -- Matches MonthlyData[] from business.ts
  monthly_data JSONB NOT NULL,

  computed_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_case_version_id)
);
```

## Row-Level Security (RLS) Strategy

### Principles
1. **Project-based access**: All data access flows through project membership
2. **Role hierarchy**: owner > editor > viewer
3. **Owner can't be removed**: Project owner always has full access

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_case_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_analysis_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_backing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculation_cache ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper function: Check project access
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_project_access(
  _project_id UUID,
  _min_role team_role DEFAULT 'viewer'
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = _project_id AND p.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.project_id = _project_id
      AND tm.user_id = auth.uid()
      AND (
        _min_role = 'viewer' OR
        (_min_role = 'editor' AND tm.role IN ('editor', 'owner')) OR
        (_min_role = 'owner' AND tm.role = 'owner')
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Profiles: Users can read all, update own
-- ============================================================================
CREATE POLICY "Profiles: read all" ON public.profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "Profiles: update own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Profiles: insert own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================================================
-- Projects: Access based on ownership or membership
-- ============================================================================
CREATE POLICY "Projects: select if member" ON public.projects
  FOR SELECT USING (has_project_access(id));

CREATE POLICY "Projects: insert as owner" ON public.projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Projects: update if editor" ON public.projects
  FOR UPDATE USING (has_project_access(id, 'editor'));

CREATE POLICY "Projects: delete if owner" ON public.projects
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================================================
-- Team Members: Project access required
-- ============================================================================
CREATE POLICY "Team: select if member" ON public.team_members
  FOR SELECT USING (has_project_access(project_id));

CREATE POLICY "Team: insert if owner" ON public.team_members
  FOR INSERT WITH CHECK (has_project_access(project_id, 'owner'));

CREATE POLICY "Team: update if owner" ON public.team_members
  FOR UPDATE USING (has_project_access(project_id, 'owner'));

CREATE POLICY "Team: delete if owner" ON public.team_members
  FOR DELETE USING (has_project_access(project_id, 'owner'));

-- ============================================================================
-- Business Cases: Project access required
-- ============================================================================
CREATE POLICY "BC: select if member" ON public.business_cases
  FOR SELECT USING (has_project_access(project_id));

CREATE POLICY "BC: insert if editor" ON public.business_cases
  FOR INSERT WITH CHECK (has_project_access(project_id, 'editor'));

CREATE POLICY "BC: update if editor" ON public.business_cases
  FOR UPDATE USING (has_project_access(project_id, 'editor'));

CREATE POLICY "BC: delete if owner" ON public.business_cases
  FOR DELETE USING (has_project_access(project_id, 'owner'));

-- ============================================================================
-- Business Case Versions: Project access required
-- ============================================================================
CREATE POLICY "BC Versions: select if member" ON public.business_case_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_cases bc
      WHERE bc.id = business_case_id AND has_project_access(bc.project_id)
    )
  );

CREATE POLICY "BC Versions: insert if editor" ON public.business_case_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_cases bc
      WHERE bc.id = business_case_id AND has_project_access(bc.project_id, 'editor')
    )
  );

-- Versions are append-only: no update or delete
-- (Historical integrity)

-- ============================================================================
-- Market Analyses: Same pattern as Business Cases
-- ============================================================================
CREATE POLICY "MA: select if member" ON public.market_analyses
  FOR SELECT USING (has_project_access(project_id));

CREATE POLICY "MA: insert if editor" ON public.market_analyses
  FOR INSERT WITH CHECK (has_project_access(project_id, 'editor'));

CREATE POLICY "MA: update if editor" ON public.market_analyses
  FOR UPDATE USING (has_project_access(project_id, 'editor'));

CREATE POLICY "MA: delete if owner" ON public.market_analyses
  FOR DELETE USING (has_project_access(project_id, 'owner'));

CREATE POLICY "MA Versions: select if member" ON public.market_analysis_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.market_analyses ma
      WHERE ma.id = market_analysis_id AND has_project_access(ma.project_id)
    )
  );

CREATE POLICY "MA Versions: insert if editor" ON public.market_analysis_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.market_analyses ma
      WHERE ma.id = market_analysis_id AND has_project_access(ma.project_id, 'editor')
    )
  );

-- ============================================================================
-- Research Sessions: Project access + own sessions
-- ============================================================================
CREATE POLICY "Sessions: select if member" ON public.research_sessions
  FOR SELECT USING (has_project_access(project_id));

CREATE POLICY "Sessions: insert own" ON public.research_sessions
  FOR INSERT WITH CHECK (
    has_project_access(project_id) AND user_id = auth.uid()
  );

CREATE POLICY "Sessions: update own" ON public.research_sessions
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- Data Points: Project access required
-- ============================================================================
CREATE POLICY "Data Points: select if member" ON public.data_points
  FOR SELECT USING (has_project_access(project_id));

CREATE POLICY "Data Points: insert if editor" ON public.data_points
  FOR INSERT WITH CHECK (has_project_access(project_id, 'editor'));

-- ============================================================================
-- Cell Backing: Via parent document access
-- ============================================================================
CREATE POLICY "Cell Backing: select" ON public.cell_backing
  FOR SELECT USING (
    (business_case_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.business_cases bc
      WHERE bc.id = business_case_id AND has_project_access(bc.project_id)
    )) OR
    (market_analysis_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.market_analyses ma
      WHERE ma.id = market_analysis_id AND has_project_access(ma.project_id)
    ))
  );

CREATE POLICY "Cell Backing: insert if editor" ON public.cell_backing
  FOR INSERT WITH CHECK (
    (business_case_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.business_cases bc
      WHERE bc.id = business_case_id AND has_project_access(bc.project_id, 'editor')
    )) OR
    (market_analysis_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.market_analyses ma
      WHERE ma.id = market_analysis_id AND has_project_access(ma.project_id, 'editor')
    ))
  );

-- ============================================================================
-- Calculation Cache: Via parent version access
-- ============================================================================
CREATE POLICY "Cache: select" ON public.calculation_cache
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_case_versions bcv
      JOIN public.business_cases bc ON bc.id = bcv.business_case_id
      WHERE bcv.id = business_case_version_id AND has_project_access(bc.project_id)
    )
  );

CREATE POLICY "Cache: insert if editor" ON public.calculation_cache
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_case_versions bcv
      JOIN public.business_cases bc ON bc.id = bcv.business_case_id
      WHERE bcv.id = business_case_version_id AND has_project_access(bc.project_id, 'editor')
    )
  );
```

## Migration Strategy

### Phase 1: Schema Deployment
1. Run DDL scripts in Supabase SQL editor (or via migration tool)
2. Verify RLS policies work correctly
3. Test with manual data insertion

### Phase 2: Client Updates
1. Add Supabase client to React app
2. Create data access hooks (`useBusinessCase`, `useMarketAnalysis`)
3. Add sync service for offline-first behavior
4. Maintain localStorage as fallback/cache

### Phase 3: Data Migration
1. Users can export from localStorage (existing JSON export)
2. Import endpoint creates project + version from JSON
3. Gradual migration - new projects in Supabase, old projects can be imported

### Migration Script (Client-side)

```typescript
// services/migration.service.ts
import { supabase } from '../lib/supabase';
import type { BusinessData, MarketData } from '../core/types';

interface MigrationResult {
  success: boolean;
  projectId?: string;
  error?: string;
}

export async function migrateFromLocalStorage(): Promise<MigrationResult> {
  try {
    // Get existing data from localStorage
    const businessData = localStorage.getItem('businessCaseData');
    const marketData = localStorage.getItem('bizcaseland_market_data');

    if (!businessData && !marketData) {
      return { success: true }; // Nothing to migrate
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: 'Imported from Local Storage',
        description: 'Auto-migrated project'
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Create business case if exists
    if (businessData) {
      const parsed: BusinessData = JSON.parse(businessData);

      const { data: bc, error: bcError } = await supabase
        .from('business_cases')
        .insert({ project_id: project.id })
        .select()
        .single();

      if (bcError) throw bcError;

      const { data: version, error: versionError } = await supabase
        .from('business_case_versions')
        .insert({
          business_case_id: bc.id,
          version_number: 1,
          data: parsed,
          change_summary: 'Initial import from localStorage'
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // Update current_version_id
      await supabase
        .from('business_cases')
        .update({ current_version_id: version.id })
        .eq('id', bc.id);
    }

    // Similar for market analysis...

    return { success: true, projectId: project.id };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

## Key Design Decisions & Tradeoffs

### Decision 1: Hybrid JSONB + Normalized

**Choice**: Store `BusinessData`/`MarketData` as JSONB blobs, normalize provenance

**Tradeoffs**:
| Pro | Con |
|-----|-----|
| Matches existing TypeScript types exactly | Can't query individual assumptions efficiently |
| Easy to load entire document | JSONB updates require rewriting whole blob |
| Schema-flexible for future changes | Harder to enforce constraints on nested data |

**Rationale**: Business cases are loaded/saved as units, not queried by field. Provenance tracking (which IS queried) is normalized.

### Decision 2: Append-Only Versioning

**Choice**: New version = new row, no updates to version data

**Tradeoffs**:
| Pro | Con |
|-----|-----|
| Full audit trail | Storage grows with each edit |
| Can restore any point | Can't do optimistic locking on versions |
| Compare versions easily | No "soft delete" - all history kept |

**Rationale**: Business cases change infrequently (not real-time collaboration), and history is valuable for compliance/audit.

### Decision 3: Cell Backing Table

**Choice**: Separate table linking cells to data points, versioned

**Tradeoffs**:
| Pro | Con |
|-----|-----|
| Query "what backs this cell?" efficiently | Extra join for full provenance |
| Track when backing was added/removed | Complexity in maintaining version_added/removed |
| Multiple data points per cell | More rows as research accumulates |

**Rationale**: Core requirement - every cell should be traceable. Without this table, we'd need to scan research sessions.

### Decision 4: Project-Based Access (not Document-Based)

**Choice**: RLS at project level, not individual document level

**Tradeoffs**:
| Pro | Con |
|-----|-----|
| Simpler mental model | Can't share single document |
| Business + Market always accessible together | All-or-nothing team access |
| Fewer RLS policies | Must create project for any collaboration |

**Rationale**: Business case and market analysis are deeply linked; sharing one without the other rarely makes sense.

### Decision 5: No Real-Time Collaboration (Yet)

**Choice**: Version-based concurrency, not OT/CRDT

**Tradeoffs**:
| Pro | Con |
|-----|-----|
| Simple implementation | Last-write-wins on conflicts |
| Works offline | Can't see others editing live |
| Predictable behavior | Manual conflict resolution needed |

**Rationale**: Complexity of real-time collab is high. Start with simple versioning, add real-time later if needed.

## Appendix: JSONB Schema Validation

For runtime validation of JSONB data:

```sql
-- Validate BusinessData structure on insert
CREATE OR REPLACE FUNCTION validate_business_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure meta exists and has required fields
  IF NEW.data->'meta' IS NULL OR
     NEW.data->'meta'->>'title' IS NULL OR
     NEW.data->'meta'->>'business_model' IS NULL THEN
    RAISE EXCEPTION 'BusinessData must have meta.title and meta.business_model';
  END IF;

  -- Ensure assumptions exists
  IF NEW.data->'assumptions' IS NULL THEN
    RAISE EXCEPTION 'BusinessData must have assumptions object';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_business_data
  BEFORE INSERT ON public.business_case_versions
  FOR EACH ROW EXECUTE FUNCTION validate_business_data();
```

## Appendix: Example Queries

### Get business case with full provenance for a cell

```sql
-- Get all data points backing 'assumptions.pricing.avg_unit_price'
SELECT
  dp.value,
  dp.unit,
  dp.confidence,
  dp.ai_rationale,
  dp.sources,
  rs.query as research_query,
  rs.messages as research_chat
FROM cell_backing cb
JOIN data_points dp ON dp.id = cb.data_point_id
LEFT JOIN research_sessions rs ON rs.id = dp.session_id
WHERE cb.business_case_id = $1
  AND cb.cell_path = 'assumptions.pricing.avg_unit_price.value'
  AND cb.version_removed IS NULL -- Active backing only
ORDER BY dp.created_at DESC;
```

### Get version history with change summaries

```sql
SELECT
  version_number,
  change_summary,
  p.display_name as changed_by,
  bcv.created_at
FROM business_case_versions bcv
JOIN profiles p ON p.id = bcv.created_by
WHERE business_case_id = $1
ORDER BY version_number DESC;
```

### Compare two versions

```sql
WITH v1 AS (
  SELECT data FROM business_case_versions WHERE id = $1
),
v2 AS (
  SELECT data FROM business_case_versions WHERE id = $2
)
SELECT
  v1.data as before,
  v2.data as after
FROM v1, v2;
-- Client-side diff using deep comparison
```
