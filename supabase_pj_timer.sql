-- Migration: PJ Time Tracker & Comments

-- 1. Table: time_sessions
CREATE TABLE IF NOT EXISTS time_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_email TEXT NOT NULL,
    ledger_type TEXT NOT NULL DEFAULT 'PJ' CHECK (ledger_type = 'PJ'),
    client_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'PAUSED', 'FINISHED')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    last_resumed_at TIMESTAMPTZ DEFAULT NOW(),
    total_seconds INTEGER NOT NULL DEFAULT 0,
    billable BOOLEAN DEFAULT TRUE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_sessions_owner ON time_sessions(owner_email, ledger_type, project_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_running_session ON time_sessions(owner_email) WHERE status = 'RUNNING';

-- 2. Table: time_session_events
CREATE TABLE IF NOT EXISTS time_session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_email TEXT NOT NULL,
    ledger_type TEXT NOT NULL DEFAULT 'PJ' CHECK (ledger_type = 'PJ'),
    session_id UUID NOT NULL REFERENCES time_sessions(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('START', 'PAUSE', 'RESUME', 'FINISH', 'EDIT')),
    at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delta_seconds INTEGER,
    meta_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_session_events_session ON time_session_events(session_id);

-- 3. Table: project_comments
CREATE TABLE IF NOT EXISTS project_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_email TEXT NOT NULL,
    ledger_type TEXT NOT NULL DEFAULT 'PJ' CHECK (ledger_type = 'PJ'),
    client_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    visibility TEXT DEFAULT 'INTERNAL',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_comments_project ON project_comments(project_id, created_at DESC);
