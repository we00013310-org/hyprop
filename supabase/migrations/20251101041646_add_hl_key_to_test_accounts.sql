/*
  # Add Hyperliquid API key to test accounts

  1. Changes
    - Add `hl_api_private_key` column to test_accounts table
    - This allows each test account to have its own Hyperliquid trading key
    - Traders can use real Hyperliquid testnet funds for evaluation
  
  2. Security
    - RLS policies already exist on test_accounts table
    - Only the account owner can read their private key
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_accounts' AND column_name = 'hl_api_private_key'
  ) THEN
    ALTER TABLE test_accounts ADD COLUMN hl_api_private_key text;
  END IF;
END $$;