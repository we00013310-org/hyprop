/*
  # Add Hyperliquid builder code to test accounts

  1. Changes
    - Add `hl_builder_code` column to test_accounts table
    - Allows test accounts to specify a builder code for fee collection
  
  2. Security
    - RLS policies already exist on test_accounts table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_accounts' AND column_name = 'hl_builder_code'
  ) THEN
    ALTER TABLE test_accounts ADD COLUMN hl_builder_code text;
  END IF;
END $$;