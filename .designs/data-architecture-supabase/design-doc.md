# Design: Data Architecture - Supabase Schema & Business Case Modeling

> Generated: 2026-01-06
> Status: Ready for Review
> Issue: bi-srb

## Executive Summary

Design the Supabase (Postgres) data model for Bizcaseland 2.0 - a business case agent tool that collects market research data points and builds business cases with full provenance chains.

**Key Design Decisions:**
- **Core Pattern**: Provenance chain from cell values through assumptions to research to sources
- **Time-Series First**: Business cases are period-indexed (monthly/quarterly) as the primary dimension
- **Versioning**: Cell-level change history + periodic business case snapshots
- **Collaboration**: Project-based access with RLS policies

## Problem Statement

Current Bizcaseland stores business cases as JSON blobs in localStorage. This prevents:
1. **Collaboration** - Multiple users cannot work on the same business case
2. **Provenance tracking** - No audit trail from values to supporting evidence
3. **AI research storage** - Research sessions and findings are ephemeral
4. **Version history** - No ability to see how projections evolved

**Stakeholder Requirements:**
> "Each cell value can have cumulative supporting evidence - not just a comment, but an entire market study. Revenue in month 14 depends on assumptions that depend on research that depends on sources - all traceable."

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BIZCASELAND DATA MODEL                                │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │    users     │
                              │──────────────│
                              │ id           │
                              │ email        │
                              │ name         │
                              │ avatar_url   │
                              └──────┬───────┘
                                     │
                                     │ owns/collaborates
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                                 WORKSPACE LAYER                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────┐         ┌─────────────────────┐                         │
│  │    projects    │◄────────│  project_members    │                         │
│  │────────────────│         │─────────────────────│                         │
│  │ id             │         │ project_id          │                         │
│  │ name           │         │ user_id             │                         │
│  │ description    │         │ role (owner/editor/ │                         │
│  │ owner_id   ────┼────────►│      viewer)        │                         │
│  │ created_at     │         │ invited_at          │                         │
│  │ settings (json)│         └─────────────────────┘                         │
│  └───────┬────────┘                                                          │
│          │                                                                   │
└──────────┼───────────────────────────────────────────────────────────────────┘
           │
           │ contains
           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              BUSINESS CASE LAYER                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐                                                     │
│  │   business_cases    │                                                     │
│  │─────────────────────│                                                     │
│  │ id                  │                                                     │
│  │ project_id      ────┼───► FK to projects                                  │
│  │ name                │                                                     │
│  │ description         │                                                     │
│  │ business_model      │◄── 'recurring' | 'unit_sales' | 'cost_savings'      │
│  │ currency            │◄── 'EUR' | 'USD' | ...                              │
│  │ period_count        │◄── e.g., 24 (months)                                │
│  │ period_type         │◄── 'monthly' | 'quarterly' | 'annually'             │
│  │ start_date          │                                                     │
│  │ status              │◄── 'draft' | 'active' | 'archived'                  │
│  │ created_at          │                                                     │
│  │ updated_at          │                                                     │
│  │ version             │◄── Incremented on significant changes               │
│  └──────────┬──────────┘                                                     │
│             │                                                                │
│             │ has many                                                       │
│             ▼                                                                │
│  ┌─────────────────────┐      ┌─────────────────────┐                       │
│  │   case_periods      │      │   case_snapshots    │                       │
│  │─────────────────────│      │─────────────────────│                       │
│  │ id                  │      │ id                  │                       │
│  │ business_case_id    │      │ business_case_id    │                       │
│  │ period_index        │      │ snapshot_name       │                       │
│  │ period_date         │      │ snapshot_data (json)│◄── Full point-in-time │
│  │ label               │      │ created_at          │                       │
│  └──────────┬──────────┘      │ created_by          │                       │
│             │                  │ notes               │                       │
│             │                  └─────────────────────┘                       │
└─────────────┼────────────────────────────────────────────────────────────────┘
              │
              │ contains
              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                               CELL VALUE LAYER                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                            cell_values                                   ││
│  │─────────────────────────────────────────────────────────────────────────││
│  │ id                  UUID PRIMARY KEY                                     ││
│  │ business_case_id    FK → business_cases                                  ││
│  │ period_id           FK → case_periods (nullable for non-time values)     ││
│  │ row_key             TEXT (e.g., 'revenue', 'cogs', 'ebitda')             ││
│  │ value               DECIMAL                                              ││
│  │ display_value       TEXT (formatted for display)                         ││
│  │ cell_type           'input' | 'calculated' | 'ai_estimated' | 'hybrid'   ││
│  │ formula             TEXT (e.g., 'users * price')                         ││
│  │ unit                TEXT (e.g., 'EUR', 'units', 'percentage')            ││
│  │ rationale           TEXT (brief explanation)                             ││
│  │ ai_generated        BOOLEAN                                              ││
│  │ ai_confidence       DECIMAL (0-1)                                        ││
│  │ ai_model            TEXT (which model generated)                         ││
│  │ user_modified       BOOLEAN (true if user overrode AI)                   ││
│  │ original_ai_value   DECIMAL (AI value before override)                   ││
│  │ valid_range         DECIMAL[] (min, max for validation)                  ││
│  │ created_at          TIMESTAMPTZ                                          ││
│  │ updated_at          TIMESTAMPTZ                                          ││
│  │ updated_by          FK → users                                           ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  UNIQUE CONSTRAINT: (business_case_id, period_id, row_key)                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
              │
              │ linked to
              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              PROVENANCE LAYER                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐         ┌─────────────────────┐                    │
│  │    assumptions      │◄────────│ cell_assumptions    │                    │
│  │─────────────────────│         │─────────────────────│                    │
│  │ id                  │  join   │ cell_value_id       │                    │
│  │ business_case_id    │  table  │ assumption_id       │                    │
│  │ name                │         └─────────────────────┘                    │
│  │ description         │                                                     │
│  │ value               │         Links cells to their underlying             │
│  │ unit                │         assumptions (many-to-many)                  │
│  │ category            │◄── 'pricing' | 'volume' | 'cost' | 'growth'        │
│  │ rationale           │                                                     │
│  │ created_at          │                                                     │
│  └──────────┬──────────┘                                                     │
│             │                                                                │
│             │ derived from                                                   │
│             ▼                                                                │
│  ┌─────────────────────┐         ┌─────────────────────┐                    │
│  │  research_sessions  │◄────────│ session_findings    │                    │
│  │─────────────────────│         │─────────────────────│                    │
│  │ id                  │         │ session_id          │                    │
│  │ business_case_id    │         │ data_point_id       │                    │
│  │ title               │         └─────────────────────┘                    │
│  │ purpose             │                                                     │
│  │ model_used          │◄── 'gpt-4o' | 'claude-3' | ...                     │
│  │ token_count         │                                                     │
│  │ status              │◄── 'in_progress' | 'completed' | 'failed'          │
│  │ started_at          │                                                     │
│  │ completed_at        │                                                     │
│  │ created_by          │                                                     │
│  └──────────┬──────────┘                                                     │
│             │                                                                │
│             │ contains                                                       │
│             ▼                                                                │
│  ┌─────────────────────┐                                                     │
│  │  session_messages   │                                                     │
│  │─────────────────────│                                                     │
│  │ id                  │                                                     │
│  │ session_id          │                                                     │
│  │ role                │◄── 'user' | 'assistant' | 'system'                 │
│  │ content             │                                                     │
│  │ tool_calls (json)   │◄── Structured tool invocations                     │
│  │ created_at          │                                                     │
│  └─────────────────────┘                                                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
              │
              │ extracts
              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              DATA POINT LAYER                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                           data_points                                    ││
│  │─────────────────────────────────────────────────────────────────────────││
│  │ id                  UUID PRIMARY KEY                                     ││
│  │ project_id          FK → projects (shared across business cases)         ││
│  │ session_id          FK → research_sessions (nullable)                    ││
│  │ name                TEXT (e.g., 'Finland PT Market Size')                ││
│  │ value               DECIMAL                                              ││
│  │ unit                TEXT (e.g., 'EUR', 'users', 'percentage')            ││
│  │ value_type          'number' | 'currency' | 'percentage' | 'count'       ││
│  │ confidence          DECIMAL (0-1, how reliable is this data)             ││
│  │ rationale           TEXT                                                 ││
│  │ extraction_method   'ai_research' | 'web_search' | 'user_input' | 'calc' ││
│  │ raw_text            TEXT (original text from source)                     ││
│  │ context             TEXT (surrounding context)                           ││
│  │ verified            BOOLEAN                                              ││
│  │ verified_by         FK → users                                           ││
│  │ verified_at         TIMESTAMPTZ                                          ││
│  │ created_at          TIMESTAMPTZ                                          ││
│  │ created_by          FK → users                                           ││
│  │ tags                TEXT[] (for categorization)                          ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        data_point_sources                                ││
│  │─────────────────────────────────────────────────────────────────────────││
│  │ id                  UUID PRIMARY KEY                                     ││
│  │ data_point_id       FK → data_points                                     ││
│  │ source_id           FK → sources                                         ││
│  │ relevance           DECIMAL (0-1, how relevant is this source)           ││
│  │ quote               TEXT (specific quote supporting the data point)      ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
              │
              │ comes from
              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                               SOURCE LAYER                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                             sources                                      ││
│  │─────────────────────────────────────────────────────────────────────────││
│  │ id                  UUID PRIMARY KEY                                     ││
│  │ project_id          FK → projects                                        ││
│  │ source_type         'web_page' | 'pdf' | 'api' | 'manual' | 'ai_synth'   ││
│  │ title               TEXT                                                 ││
│  │ url                 TEXT                                                 ││
│  │ domain              TEXT (extracted from URL)                            ││
│  │ content_hash        TEXT (for deduplication)                             ││
│  │ fetched_at          TIMESTAMPTZ                                          ││
│  │ content_summary     TEXT (AI-generated summary)                          ││
│  │ content_full        TEXT (full scraped content, if stored)               ││
│  │ reliability_score   DECIMAL (0-1, domain authority)                      ││
│  │ citation_format     TEXT (formatted citation)                            ││
│  │ metadata (json)     JSONB (author, publish_date, etc.)                   ││
│  │ created_at          TIMESTAMPTZ                                          ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  INDEX: (project_id, domain) for finding sources by domain                   │
│  INDEX: (content_hash) for deduplication                                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                              HISTORY LAYER                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         cell_value_history                               ││
│  │─────────────────────────────────────────────────────────────────────────││
│  │ id                  UUID PRIMARY KEY                                     ││
│  │ cell_value_id       FK → cell_values                                     ││
│  │ previous_value      DECIMAL                                              ││
│  │ new_value           DECIMAL                                              ││
│  │ change_type         'user_edit' | 'ai_update' | 'formula_recalc'         ││
│  │ change_reason       TEXT                                                 ││
│  │ changed_by          FK → users                                           ││
│  │ changed_at          TIMESTAMPTZ                                          ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Trigger: Automatically log changes to cell_values                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Supabase Table Schemas

### Core Tables

```sql
-- ============================================================================
-- WORKSPACE LAYER
-- ============================================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE project_role AS ENUM ('owner', 'editor', 'viewer');

CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role project_role NOT NULL DEFAULT 'viewer',
  invited_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- ============================================================================
-- BUSINESS CASE LAYER
-- ============================================================================

CREATE TYPE business_model_type AS ENUM ('recurring', 'unit_sales', 'cost_savings');
CREATE TYPE period_type AS ENUM ('monthly', 'quarterly', 'annually');
CREATE TYPE case_status AS ENUM ('draft', 'active', 'archived');

CREATE TABLE business_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  business_model business_model_type NOT NULL DEFAULT 'recurring',
  currency TEXT NOT NULL DEFAULT 'EUR',
  period_count INTEGER NOT NULL DEFAULT 24,
  period_type period_type NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status case_status NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE case_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_case_id UUID NOT NULL REFERENCES business_cases(id) ON DELETE CASCADE,
  period_index INTEGER NOT NULL, -- 0-indexed
  period_date DATE NOT NULL,
  label TEXT NOT NULL, -- 'M1', 'Q1 2025', etc.
  UNIQUE (business_case_id, period_index)
);

CREATE TABLE case_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_case_id UUID NOT NULL REFERENCES business_cases(id) ON DELETE CASCADE,
  snapshot_name TEXT NOT NULL,
  snapshot_data JSONB NOT NULL, -- Full business case state
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- CELL VALUE LAYER
-- ============================================================================

CREATE TYPE cell_type AS ENUM ('input', 'calculated', 'ai_estimated', 'hybrid');

CREATE TABLE cell_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_case_id UUID NOT NULL REFERENCES business_cases(id) ON DELETE CASCADE,
  period_id UUID REFERENCES case_periods(id) ON DELETE CASCADE, -- NULL for meta/summary values
  row_key TEXT NOT NULL, -- 'revenue', 'cogs', 'ebitda', etc.
  value DECIMAL,
  display_value TEXT,
  cell_type cell_type NOT NULL DEFAULT 'input',
  formula TEXT,
  unit TEXT NOT NULL DEFAULT 'EUR',
  rationale TEXT,
  ai_generated BOOLEAN DEFAULT false,
  ai_confidence DECIMAL CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  ai_model TEXT,
  user_modified BOOLEAN DEFAULT false,
  original_ai_value DECIMAL,
  valid_range DECIMAL[2],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE (business_case_id, period_id, row_key)
);

CREATE INDEX idx_cell_values_case ON cell_values(business_case_id);
CREATE INDEX idx_cell_values_period ON cell_values(period_id);
CREATE INDEX idx_cell_values_row ON cell_values(row_key);

-- ============================================================================
-- PROVENANCE LAYER
-- ============================================================================

CREATE TYPE assumption_category AS ENUM ('pricing', 'volume', 'cost', 'growth', 'market', 'other');

CREATE TABLE assumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_case_id UUID NOT NULL REFERENCES business_cases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  value DECIMAL,
  unit TEXT,
  category assumption_category NOT NULL DEFAULT 'other',
  rationale TEXT,
  data_path TEXT, -- JSON path: 'assumptions.pricing.avg_unit_price'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Many-to-many: cells depend on assumptions
CREATE TABLE cell_assumptions (
  cell_value_id UUID NOT NULL REFERENCES cell_values(id) ON DELETE CASCADE,
  assumption_id UUID NOT NULL REFERENCES assumptions(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'direct', -- 'direct', 'indirect', 'derived'
  PRIMARY KEY (cell_value_id, assumption_id)
);

CREATE TYPE session_status AS ENUM ('in_progress', 'completed', 'failed');

CREATE TABLE research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_case_id UUID NOT NULL REFERENCES business_cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  purpose TEXT, -- What was the research trying to find?
  model_used TEXT,
  token_count INTEGER DEFAULT 0,
  status session_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

CREATE TABLE session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  tool_calls JSONB, -- Structured tool invocations
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_session_messages_session ON session_messages(session_id);

-- ============================================================================
-- DATA POINT LAYER
-- ============================================================================

CREATE TYPE extraction_method AS ENUM ('ai_research', 'web_search', 'user_input', 'calculation', 'import');
CREATE TYPE value_type AS ENUM ('number', 'currency', 'percentage', 'count', 'text');

CREATE TABLE data_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id UUID REFERENCES research_sessions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  value DECIMAL,
  unit TEXT,
  value_type value_type NOT NULL DEFAULT 'number',
  confidence DECIMAL CHECK (confidence >= 0 AND confidence <= 1),
  rationale TEXT,
  extraction_method extraction_method NOT NULL DEFAULT 'user_input',
  raw_text TEXT, -- Original text from source
  context TEXT, -- Surrounding context
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  tags TEXT[]
);

CREATE INDEX idx_data_points_project ON data_points(project_id);
CREATE INDEX idx_data_points_tags ON data_points USING GIN(tags);

-- Many-to-many: assumptions depend on data points
CREATE TABLE assumption_data_points (
  assumption_id UUID NOT NULL REFERENCES assumptions(id) ON DELETE CASCADE,
  data_point_id UUID NOT NULL REFERENCES data_points(id) ON DELETE CASCADE,
  weight DECIMAL DEFAULT 1.0, -- How much this data point contributes
  PRIMARY KEY (assumption_id, data_point_id)
);

-- ============================================================================
-- SOURCE LAYER
-- ============================================================================

CREATE TYPE source_type AS ENUM ('web_page', 'pdf', 'api', 'manual', 'ai_synthesis');

CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_type source_type NOT NULL DEFAULT 'web_page',
  title TEXT NOT NULL,
  url TEXT,
  domain TEXT, -- Extracted from URL
  content_hash TEXT, -- For deduplication
  fetched_at TIMESTAMPTZ,
  content_summary TEXT,
  content_full TEXT,
  reliability_score DECIMAL CHECK (reliability_score >= 0 AND reliability_score <= 1),
  citation_format TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sources_project ON sources(project_id);
CREATE INDEX idx_sources_domain ON sources(domain);
CREATE INDEX idx_sources_hash ON sources(content_hash);

-- Many-to-many: data points cite sources
CREATE TABLE data_point_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_point_id UUID NOT NULL REFERENCES data_points(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  relevance DECIMAL CHECK (relevance >= 0 AND relevance <= 1),
  quote TEXT, -- Specific quote supporting the data point
  UNIQUE (data_point_id, source_id)
);

-- ============================================================================
-- HISTORY LAYER
-- ============================================================================

CREATE TYPE change_type AS ENUM ('user_edit', 'ai_update', 'formula_recalc', 'import');

CREATE TABLE cell_value_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_value_id UUID NOT NULL REFERENCES cell_values(id) ON DELETE CASCADE,
  previous_value DECIMAL,
  new_value DECIMAL,
  change_type change_type NOT NULL,
  change_reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cell_history_cell ON cell_value_history(cell_value_id);
CREATE INDEX idx_cell_history_time ON cell_value_history(changed_at);

-- Trigger function to log cell value changes
CREATE OR REPLACE FUNCTION log_cell_value_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.value IS DISTINCT FROM NEW.value THEN
    INSERT INTO cell_value_history (
      cell_value_id, previous_value, new_value, change_type, changed_by, changed_at
    ) VALUES (
      NEW.id, OLD.value, NEW.value,
      CASE
        WHEN NEW.ai_generated AND NOT OLD.ai_generated THEN 'ai_update'
        WHEN NEW.user_modified THEN 'user_edit'
        ELSE 'formula_recalc'
      END,
      NEW.updated_by, now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cell_value_change
AFTER UPDATE ON cell_values
FOR EACH ROW EXECUTE FUNCTION log_cell_value_change();
```

## Row-Level Security (RLS) Strategy

```sql
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_value_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROJECT ACCESS POLICIES
-- ============================================================================

-- Helper function: Check if user has access to project
CREATE OR REPLACE FUNCTION user_has_project_access(project_uuid UUID, required_role project_role DEFAULT 'viewer')
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = project_uuid
    AND user_id = auth.uid()
    AND (
      role = 'owner' OR
      (required_role = 'editor' AND role IN ('owner', 'editor')) OR
      (required_role = 'viewer')
    )
  ) OR EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_uuid
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Projects: Users see projects they own or are members of
CREATE POLICY projects_select ON projects
  FOR SELECT USING (user_has_project_access(id));

CREATE POLICY projects_insert ON projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY projects_update ON projects
  FOR UPDATE USING (user_has_project_access(id, 'editor'));

CREATE POLICY projects_delete ON projects
  FOR DELETE USING (owner_id = auth.uid());

-- Project Members: Only owners can manage members
CREATE POLICY project_members_select ON project_members
  FOR SELECT USING (user_has_project_access(project_id));

CREATE POLICY project_members_insert ON project_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
  );

CREATE POLICY project_members_delete ON project_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
    OR user_id = auth.uid() -- Users can remove themselves
  );

-- ============================================================================
-- BUSINESS CASE POLICIES (inherit from project)
-- ============================================================================

CREATE POLICY business_cases_select ON business_cases
  FOR SELECT USING (user_has_project_access(project_id));

CREATE POLICY business_cases_insert ON business_cases
  FOR INSERT WITH CHECK (user_has_project_access(project_id, 'editor'));

CREATE POLICY business_cases_update ON business_cases
  FOR UPDATE USING (user_has_project_access(project_id, 'editor'));

CREATE POLICY business_cases_delete ON business_cases
  FOR DELETE USING (user_has_project_access(project_id, 'editor'));

-- Apply same pattern to all child tables...
-- (case_periods, cell_values, assumptions, research_sessions, etc.)

-- ============================================================================
-- CELL VALUES POLICIES
-- ============================================================================

CREATE POLICY cell_values_select ON cell_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM business_cases bc
      WHERE bc.id = cell_values.business_case_id
      AND user_has_project_access(bc.project_id)
    )
  );

CREATE POLICY cell_values_insert ON cell_values
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_cases bc
      WHERE bc.id = cell_values.business_case_id
      AND user_has_project_access(bc.project_id, 'editor')
    )
  );

CREATE POLICY cell_values_update ON cell_values
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM business_cases bc
      WHERE bc.id = cell_values.business_case_id
      AND user_has_project_access(bc.project_id, 'editor')
    )
  );

-- Similar policies for all other tables...
```

## Migration Strategy

### Phase 1: Core Infrastructure
```sql
-- Migration 001: Core tables
-- projects, project_members, business_cases, case_periods
```

### Phase 2: Cell Values
```sql
-- Migration 002: Cell value system
-- cell_values, cell_value_history, trigger
```

### Phase 3: Provenance Chain
```sql
-- Migration 003: Provenance
-- assumptions, cell_assumptions, research_sessions, session_messages
```

### Phase 4: Data Points & Sources
```sql
-- Migration 004: Data layer
-- data_points, sources, data_point_sources, assumption_data_points
```

### Phase 5: RLS & Policies
```sql
-- Migration 005: Security
-- All RLS policies and helper functions
```

### Data Import from JSON

```typescript
// Example: Import existing BusinessData JSON to new schema
async function importBusinessCase(
  supabase: SupabaseClient,
  projectId: string,
  jsonData: BusinessData
): Promise<string> {
  // 1. Create business case
  const { data: businessCase } = await supabase
    .from('business_cases')
    .insert({
      project_id: projectId,
      name: jsonData.meta.title,
      description: jsonData.meta.description,
      business_model: jsonData.meta.business_model,
      currency: jsonData.meta.currency,
      period_count: jsonData.meta.periods,
      period_type: jsonData.meta.frequency,
    })
    .select()
    .single();

  // 2. Create periods
  const periods = Array.from({ length: jsonData.meta.periods }, (_, i) => ({
    business_case_id: businessCase.id,
    period_index: i,
    period_date: addMonths(new Date(), i),
    label: `M${i + 1}`,
  }));

  const { data: createdPeriods } = await supabase
    .from('case_periods')
    .insert(periods)
    .select();

  // 3. Import cell values from calculated monthly data
  // ... (map MonthlyData to cell_values)

  return businessCase.id;
}
```

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Provenance depth | 4 levels (cell → assumption → data_point → source) | Matches stakeholder requirement for "entire market study" backing |
| Cell storage | Normalized table vs JSON | Enables efficient queries, history tracking, and collaboration |
| Versioning | Cell-level history + case snapshots | Granular changes + point-in-time recovery |
| Data points | Project-scoped (shared across cases) | Same research can back multiple business cases |
| Formula storage | Text field with expression | Simple, parseable, allows future calculation engine |

## Trade-offs

| Trade-off | Choice | What We Gave Up |
|-----------|--------|-----------------|
| Normalization vs query speed | Normalized | More joins needed, but data integrity preserved |
| Full content storage vs references | Hybrid (summary + optional full) | Storage cost, but enables offline/search |
| Per-cell RLS vs per-project | Per-project via helper | Simpler policies, less granular control |

## Future Considerations

1. **Formula Engine**: Store formulas as text, evaluate client-side or via Postgres functions
2. **Real-time Collaboration**: Supabase Realtime for live cell updates
3. **Search**: pg_trgm + ts_vector for full-text search across data points and sources
4. **AI Caching**: Store AI responses for similar queries to reduce costs
5. **Export/Import**: JSON schema versioning for data portability

## References

- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- Existing types: `src/core/types/business.ts`, `src/core/types/common.ts`
