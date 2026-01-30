-- ==============================================================================
-- ALERTS SYSTEM MIGRATION
-- ==============================================================================

-- Create Enums (if not exists, handling idempotent)
DO $$ BEGIN
    CREATE TYPE alert_status AS ENUM ('OPEN', 'ACKED', 'SNOOZED', 'RESOLVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_type AS ENUM ('BUDGET_OVER', 'BUDGET_NEAR', 'SPEND_ANOMALY', 'DUE_TODAY', 'DUE_SOON', 'OVERDUE', 'LOW_BALANCE_7D', 'MONTH_NEGATIVE_RISK', 'UNCATEGORIZED', 'DUPLICATE_SUSPECT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users NOT NULL,
  ledger_type text NOT NULL CHECK (ledger_type IN ('PF', 'PJ')),
  type alert_type NOT NULL,
  severity alert_severity NOT NULL,
  status alert_status NOT NULL DEFAULT 'OPEN',
  title text NOT NULL,
  message text,
  reason_payload jsonb,
  source_refs jsonb,
  fingerprint text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  snoozed_until timestamptz,
  resolved_at timestamptz
);

-- Indices
CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_fingerprint_active ON alerts (owner_id, fingerprint) WHERE status IN ('OPEN', 'ACKED', 'SNOOZED');
CREATE INDEX IF NOT EXISTS idx_alerts_lookup ON alerts (owner_id, ledger_type, status);

-- RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see own alerts" ON alerts;
CREATE POLICY "Users can see own alerts" ON alerts FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own alerts" ON alerts;
CREATE POLICY "Users can update own alerts" ON alerts FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own alerts" ON alerts;
CREATE POLICY "Users can insert own alerts" ON alerts FOR INSERT WITH CHECK (auth.uid() = owner_id);
