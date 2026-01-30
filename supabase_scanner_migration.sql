-- Migration for Scanner de Extratos

-- 1. Create import_file table
CREATE TABLE IF NOT EXISTS import_file (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  ledger_type TEXT NOT NULL CHECK (ledger_type IN ('PF', 'PJ')),
  storage_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT,
  size BIGINT,
  sha256_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create import_batch table
CREATE TABLE IF NOT EXISTS import_batch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  ledger_type TEXT NOT NULL CHECK (ledger_type IN ('PF', 'PJ')),
  source_type TEXT CHECK (source_type IN ('CSV', 'PDF', 'OCR', 'OFX')),
  file_id UUID REFERENCES import_file(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING', 'READY_TO_REVIEW', 'IMPORTED', 'ROLLED_BACK', 'FAILED')),
  date_start DATE,
  date_end DATE,
  totals_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create import_row table
CREATE TABLE IF NOT EXISTS import_row (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES import_batch(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  ledger_type TEXT NOT NULL CHECK (ledger_type IN ('PF', 'PJ')),
  row_index INTEGER,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  direction TEXT CHECK (direction IN ('IN', 'OUT')),
  description_raw TEXT,
  description_norm TEXT,
  merchant TEXT,
  suggested_category_id TEXT, -- Logical ID (text) matching categories table
  final_category_id TEXT, -- User selected or confirmed ID
  confidence TEXT CHECK (confidence IN ('LOW', 'MEDIUM', 'HIGH')),
  status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'DUPLICATE_SUSPECT', 'NEEDS_REVIEW', 'READY', 'IMPORTED', 'SKIPPED')),
  duplicate_of_transaction_id UUID, -- If matched with existing transaction
  created_transaction_id UUID, -- If imported, which transaction was created
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create category_mapping_rule table
CREATE TABLE IF NOT EXISTS category_mapping_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  ledger_type TEXT NOT NULL CHECK (ledger_type IN ('PF', 'PJ')),
  match_type TEXT NOT NULL CHECK (match_type IN ('CONTAINS', 'REGEX', 'STARTS_WITH', 'EXACT')),
  pattern TEXT NOT NULL,
  category_id TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_import_batch_lookup ON import_batch (owner_id, ledger_type, created_at);
CREATE INDEX IF NOT EXISTS idx_import_row_batch ON import_row (batch_id, status);
CREATE INDEX IF NOT EXISTS idx_mapping_rule_lookup ON category_mapping_rule (owner_id, ledger_type, priority DESC);

-- RLS
ALTER TABLE import_file ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batch ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_row ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_mapping_rule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own import files" ON import_file FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Users can manage their own import batches" ON import_batch FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Users can manage their own import rows" ON import_row FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Users can manage their own mapping rules" ON category_mapping_rule FOR ALL USING (auth.uid() = owner_id);
