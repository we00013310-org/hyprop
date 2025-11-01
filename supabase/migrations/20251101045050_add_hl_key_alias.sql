/*
  # Add hl_key alias for test accounts

  1. Changes
    - Add `hl_key` column as an alias to `hl_api_private_key`
    - This allows the edge function to use a consistent column name
  
  2. Security
    - RLS policies already exist on test_accounts table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_accounts' AND column_name = 'hl_key'
  ) THEN
    ALTER TABLE test_accounts ADD COLUMN hl_key text;
  END IF;
END $$;

-- Copy existing data from hl_api_private_key to hl_key
UPDATE test_accounts SET hl_key = hl_api_private_key WHERE hl_api_private_key IS NOT NULL AND hl_key IS NULL;