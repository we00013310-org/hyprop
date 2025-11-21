-- Rename fake_wallets table to wallets and restructure columns
-- 1. Rename table
-- 2. Add id column as UUID primary key
-- 3. Rename address to account_address and make it unique
-- 4. Rename private_key to key_pk
-- 5. Rename public_key to key_address
-- 6. Add invalid_at column with dynamic expiration (default 179 days from created_at)

-- Add wallet validity duration to config table (180 days default)
INSERT INTO config (key, value)
VALUES ('wallet_validity_days', '180')
ON CONFLICT (key) DO NOTHING;

-- Rename the table
ALTER TABLE fake_wallets RENAME TO wallets;

-- Add new id column as UUID and make it primary key
ALTER TABLE wallets ADD COLUMN id UUID DEFAULT gen_random_uuid();

-- Update id column to be NOT NULL
UPDATE wallets SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE wallets ALTER COLUMN id SET NOT NULL;

-- Keep address as unique (it was the old primary key)
-- We'll add a new id column as primary key
ALTER TABLE wallets DROP CONSTRAINT IF EXISTS fake_wallets_pkey;

-- Rename columns first
ALTER TABLE wallets RENAME COLUMN address TO account_address;
ALTER TABLE wallets RENAME COLUMN private_key TO key_pk;
ALTER TABLE wallets RENAME COLUMN public_key TO key_address;

-- Add new primary key constraint on id
ALTER TABLE wallets ADD PRIMARY KEY (id);

-- Add unique constraint to account_address (was the old primary key)
ALTER TABLE wallets ADD CONSTRAINT wallets_account_address_unique UNIQUE (account_address);

-- Add invalid_at column with default value
-- Default: created_at + (wallet_validity_days - 1) days
-- We use 179 days so that on day 180, the wallet becomes invalid
ALTER TABLE wallets ADD COLUMN invalid_at TIMESTAMPTZ;

-- Set invalid_at for existing records
-- Get the configured validity days from config (default 180)
DO $$
DECLARE
  validity_days INTEGER;
BEGIN
  -- Get wallet validity days from config
  SELECT COALESCE((value::INTEGER), 180) INTO validity_days
  FROM config
  WHERE key = 'wallet_validity_days';

  -- Update invalid_at for all existing records
  UPDATE wallets
  SET invalid_at = created_at + ((validity_days - 1) * INTERVAL '1 day');
END $$;

-- Make invalid_at NOT NULL after setting values
ALTER TABLE wallets ALTER COLUMN invalid_at SET NOT NULL;

-- Add default for future inserts using a trigger function
-- This allows the expiration to be dynamic based on config
CREATE OR REPLACE FUNCTION set_wallet_invalid_at()
RETURNS TRIGGER AS $$
DECLARE
  validity_days INTEGER;
BEGIN
  -- Get wallet validity days from config (default 180)
  SELECT COALESCE((value::INTEGER), 180) INTO validity_days
  FROM config
  WHERE key = 'wallet_validity_days';

  -- Set invalid_at to created_at + (validity_days - 1) days
  NEW.invalid_at := NEW.created_at + ((validity_days - 1) * INTERVAL '1 day');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set invalid_at on insert
DROP TRIGGER IF EXISTS set_wallet_invalid_at_trigger ON wallets;
CREATE TRIGGER set_wallet_invalid_at_trigger
  BEFORE INSERT ON wallets
  FOR EACH ROW
  WHEN (NEW.invalid_at IS NULL)
  EXECUTE FUNCTION set_wallet_invalid_at();

-- Update indexes to use new column names and add new ones
DROP INDEX IF EXISTS idx_fake_wallets_status;
CREATE INDEX idx_wallets_status ON wallets(status);
CREATE INDEX idx_wallets_account_address ON wallets(account_address);
CREATE INDEX idx_wallets_invalid_at ON wallets(invalid_at);

-- Add comment to table
COMMENT ON TABLE wallets IS 'Stores wallet accounts with configurable expiration period';
COMMENT ON COLUMN wallets.id IS 'Primary key UUID';
COMMENT ON COLUMN wallets.account_address IS 'Unique wallet address';
COMMENT ON COLUMN wallets.key_pk IS 'Private key for the wallet';
COMMENT ON COLUMN wallets.key_address IS 'Public key/address for the wallet';
COMMENT ON COLUMN wallets.invalid_at IS 'Timestamp when wallet becomes invalid (created_at + validity_days - 1)';
