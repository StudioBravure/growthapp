-- Function to completely wipe user data (Reset All)
-- Invoked by authenticated user to clear their own data only.

CREATE OR REPLACE FUNCTION delete_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- If no user, do nothing (security check)
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete in order of dependencies (Child -> Parent) to avoid foreign key constraints errors
  -- Transactions usually depend on projects, clients, recurrences.
  
  -- 1. Transactions
  DELETE FROM transactions WHERE owner_id = current_user_id;

  -- 2. Projects (might depend on Clients)
  DELETE FROM projects WHERE owner_id = current_user_id;
  
  -- 3. Recurring Bills
  DELETE FROM recurring_bills WHERE owner_id = current_user_id;
  
  -- 4. Debts
  DELETE FROM debts WHERE owner_id = current_user_id;
  
  -- 5. Goals
  DELETE FROM goals WHERE owner_id = current_user_id;

  -- 6. Clients
  DELETE FROM clients WHERE owner_id = current_user_id;
  
  -- 7. Budgets (if table exists)
  DELETE FROM budgets WHERE owner_id = current_user_id;

  -- 8. Categories (if customized categories exist and have owner_id)
  -- Assuming system categories are shared or have NULL owner_id.
  DELETE FROM categories WHERE owner_id = current_user_id;

  -- 9. Categorization Rules
  DELETE FROM categorization_rules WHERE owner_id = current_user_id;

  -- 10. Integrations
  DELETE FROM integrations WHERE owner_id = current_user_id;
  
  -- 11. Alerts
  DELETE FROM alerts WHERE owner_id = current_user_id;

END;
$$;
