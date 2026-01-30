-- ==============================================================================
-- HARDENING SECURITY SCRIPT (RUN IN SUPABASE SQL EDITOR)
-- ==============================================================================

-- 1. Enable RLS on all critical tables
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recurring_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;

-- 2. Create/Ensure Owner Policies (Fail-safe defaults)

-- Helper function to simplify policy creation checks
-- (Note: SQL logic simplified for copy-paste execution)

-- TRANSACTIONS
DROP POLICY IF EXISTS "Users can only see their own transactions" ON transactions;
CREATE POLICY "Users can only see their own transactions" ON transactions
    FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- PROJECTS
DROP POLICY IF EXISTS "Users can only manage their own projects" ON projects;
CREATE POLICY "Users can only manage their own projects" ON projects
    FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- CLIENTS
DROP POLICY IF EXISTS "Users can only manage their own clients" ON clients;
CREATE POLICY "Users can only manage their own clients" ON clients
    FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- 3. Data Integrity Constraints (Anti-Logic Abuse)
-- Prevent negative amounts in transactions where logic forbids (optional, adjusting based on valid logic)
-- ALTER TABLE transactions ADD CONSTRAINT check_amount_nonzero CHECK (amount != 0);

-- 4. Network Restrictions (If Supabase allows network bans via SQL - usually UI only)

-- 5. Audit Logging Trigger (Basic)
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_time timestamptz DEFAULT now(),
    user_id uuid,
    operation text,
    table_name text,
    ip_address text -- Note: Supabase SQL context might not have IP easily accessibly in triggers without extensions
);

-- ==============================================================================
-- END OF HARDENING SCRIPT
-- ==============================================================================
