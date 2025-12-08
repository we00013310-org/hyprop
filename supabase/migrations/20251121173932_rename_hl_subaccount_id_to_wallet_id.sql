-- Rename hl_subaccount_id (or account_id) to wallet_id in funded_accounts table
-- And add UNIQUE constraint to wallet_id

-- Check if column is named hl_subaccount_id or account_id and rename to wallet_id
DO $$
BEGIN
    -- If column is named hl_subaccount_id, rename to wallet_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'funded_accounts'
        AND column_name = 'hl_subaccount_id'
    ) THEN
        ALTER TABLE funded_accounts RENAME COLUMN hl_subaccount_id TO wallet_id;
    END IF;

    -- If column is named account_id, rename to wallet_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'funded_accounts'
        AND column_name = 'account_id'
    ) THEN
        ALTER TABLE funded_accounts RENAME COLUMN account_id TO wallet_id;
    END IF;
END $$;

-- Drop old constraint if it exists
ALTER TABLE funded_accounts DROP CONSTRAINT IF EXISTS funded_accounts_account_id_unique;

-- Drop old index if it exists
DROP INDEX IF EXISTS idx_funded_accounts_account_id;

-- Add UNIQUE constraint to wallet_id
ALTER TABLE funded_accounts ADD CONSTRAINT funded_accounts_wallet_id_unique UNIQUE (wallet_id);

-- Create index for faster lookups
CREATE INDEX idx_funded_accounts_wallet_id ON funded_accounts(wallet_id);

-- Add comment
COMMENT ON COLUMN funded_accounts.wallet_id IS 'Unique wallet address associated with this funded account';
