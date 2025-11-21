-- Rename hl_subaccount_id to account_id in funded_accounts table
-- And add UNIQUE constraint to account_id

-- Rename the column
ALTER TABLE funded_accounts RENAME COLUMN hl_subaccount_id TO account_id;

-- Add UNIQUE constraint to account_id
ALTER TABLE funded_accounts ADD CONSTRAINT funded_accounts_account_id_unique UNIQUE (account_id);

-- Create index for faster lookups
CREATE INDEX idx_funded_accounts_account_id ON funded_accounts(account_id);

-- Add comment
COMMENT ON COLUMN funded_accounts.account_id IS 'Unique account identifier (formerly hl_subaccount_id for Hyperliquid subaccount)';
