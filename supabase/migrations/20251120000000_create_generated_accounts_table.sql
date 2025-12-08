-- Create fake_wallets table for storing wallet addresses and keys
CREATE TABLE public.fake_wallets (
    address TEXT PRIMARY KEY,
    private_key TEXT NOT NULL,
    public_key TEXT NOT NULL,
    status INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for quick filtering by status
CREATE INDEX idx_fake_wallets_status ON public.fake_wallets(status);

ALTER TABLE funded_accounts ADD COLUMN IF NOT EXISTS hl_subaccount_id text;
