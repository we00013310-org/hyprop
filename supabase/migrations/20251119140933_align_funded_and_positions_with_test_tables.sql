/*
  # Align funded_accounts and positions tables with test_accounts and test_positions

  This migration makes funded_accounts match test_accounts structure and
  positions match test_positions structure, with the key difference being:
  - test_accounts/test_positions use test_account_id
  - funded_accounts/positions use account_id (and funded_accounts has required test_account_id)
*/

-- ============================================================================
-- Step 1: Update funded_accounts to match test_accounts structure
-- ============================================================================

-- Drop columns that are specific to funded accounts but not in test_accounts
-- (Keeping the trading-specific fields, removing complex margin calculations)

-- First drop constraints that depend on columns we're removing
ALTER TABLE funded_accounts DROP CONSTRAINT IF EXISTS funded_accounts_pair_mode_check;

ALTER TABLE funded_accounts DROP COLUMN IF EXISTS primary_symbol;
ALTER TABLE funded_accounts DROP COLUMN IF EXISTS pair_mode;
ALTER TABLE funded_accounts DROP COLUMN IF EXISTS l_user;
ALTER TABLE funded_accounts DROP COLUMN IF EXISTS n_max;
ALTER TABLE funded_accounts DROP COLUMN IF EXISTS l_effective;
ALTER TABLE funded_accounts DROP COLUMN IF EXISTS im_required;
ALTER TABLE funded_accounts DROP COLUMN IF EXISTS maintenance_margin;
ALTER TABLE funded_accounts DROP COLUMN IF EXISTS e_start;
ALTER TABLE funded_accounts DROP COLUMN IF EXISTS e_day_start;
ALTER TABLE funded_accounts DROP COLUMN IF EXISTS hl_subaccount_id;
ALTER TABLE funded_accounts DROP COLUMN IF EXISTS hl_builder_code;

-- Rename balance_actual to virtual_balance for consistency
ALTER TABLE funded_accounts RENAME COLUMN balance_actual TO virtual_balance;

-- Add columns from test_accounts that funded_accounts is missing
ALTER TABLE funded_accounts ADD COLUMN IF NOT EXISTS account_size numeric;
ALTER TABLE funded_accounts ADD COLUMN IF NOT EXISTS account_mode text;
ALTER TABLE funded_accounts ADD COLUMN IF NOT EXISTS fee_paid numeric DEFAULT 0;
ALTER TABLE funded_accounts ADD COLUMN IF NOT EXISTS profit_target numeric;

-- Update account_size from virtual_balance for existing records
UPDATE funded_accounts SET account_size = virtual_balance WHERE account_size IS NULL;

-- Make account_size NOT NULL after setting values
ALTER TABLE funded_accounts ALTER COLUMN account_size SET NOT NULL;
ALTER TABLE funded_accounts ALTER COLUMN account_mode SET NOT NULL;
ALTER TABLE funded_accounts ALTER COLUMN fee_paid SET NOT NULL;
ALTER TABLE funded_accounts ALTER COLUMN profit_target SET NOT NULL;

-- Make test_account_id required (NOT NULL)
ALTER TABLE funded_accounts ALTER COLUMN test_account_id SET NOT NULL;

-- Update constraints to match test_accounts
ALTER TABLE funded_accounts DROP CONSTRAINT IF EXISTS funded_accounts_status_check;
ALTER TABLE funded_accounts ADD CONSTRAINT funded_accounts_status_check CHECK (
  status IN ('active', 'passed', 'failed', 'expired')
);

ALTER TABLE funded_accounts ADD CONSTRAINT funded_accounts_mode_check CHECK (
  account_mode IN ('1-step', '2-step')
);

-- ============================================================================
-- Step 2: Update positions to match test_positions structure
-- ============================================================================

-- Add margin_used and created_at columns from test_positions
ALTER TABLE positions ADD COLUMN IF NOT EXISTS margin_used numeric NOT NULL DEFAULT 0;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now() NOT NULL;

-- Remove funding_accrued (test_positions doesn't have this)
ALTER TABLE positions DROP COLUMN IF EXISTS funding_accrued;

-- Reorder is not necessary in PostgreSQL, but we ensure all columns match

-- ============================================================================
-- Step 3: Update indexes
-- ============================================================================

-- Positions already has idx_positions_account_id, add last_update_ts index to match test_positions
CREATE INDEX IF NOT EXISTS idx_positions_last_update_ts ON positions(last_update_ts);

-- ============================================================================
-- Step 4: RLS policies already updated in previous migration
-- ============================================================================
-- The "Allow position operations" policy already exists from migration
-- 20251101024924_fix_all_tables_rls_wallet_auth_v2.sql
-- No changes needed here
