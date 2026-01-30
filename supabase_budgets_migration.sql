-- Create budget_category_monthly table
CREATE TABLE IF NOT EXISTS budget_category_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  ledger_type TEXT NOT NULL CHECK (ledger_type IN ('PF', 'PJ')),
  month_key TEXT NOT NULL, -- Format YYYY-MM
  category_id UUID NOT NULL, -- Logical link to categories, but referencing ID string
  budget_amount NUMERIC NOT NULL DEFAULT 0,
  is_alerts_paused BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_budget_monthly_lookup ON budget_category_monthly (owner_id, ledger_type, month_key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_monthly_unique ON budget_category_monthly (owner_id, ledger_type, month_key, category_id);

-- Enable RLS
ALTER TABLE budget_category_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own monthly budgets" ON budget_category_monthly
  FOR ALL USING (auth.uid() = owner_id);

-- Create budget_pf_settings table
CREATE TABLE IF NOT EXISTS budget_pf_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  ledger_type TEXT NOT NULL DEFAULT 'PF' CHECK (ledger_type = 'PF'),
  alert_threshold_percent INTEGER DEFAULT 80,
  alert_on_over BOOLEAN DEFAULT TRUE,
  detect_anomaly BOOLEAN DEFAULT TRUE,
  ignore_category_ids JSONB DEFAULT '[]'::jsonb,
  calc_basis TEXT DEFAULT 'TRANSACTION_DATE' CHECK (calc_basis IN ('TRANSACTION_DATE', 'DUE_DATE')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_settings_unique ON budget_pf_settings (owner_id, ledger_type);

-- Enable RLS
ALTER TABLE budget_pf_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own budget settings" ON budget_pf_settings
  FOR ALL USING (auth.uid() = owner_id);
