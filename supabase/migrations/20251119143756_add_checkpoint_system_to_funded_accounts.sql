-- Add checkpoint system to funded_accounts (matching test_accounts)
-- Add fields to control evaluation duration and checkpoint frequency

-- Add checkpoint configuration fields to funded_accounts
ALTER TABLE funded_accounts
  ADD COLUMN IF NOT EXISTS num_checkpoints INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS checkpoint_interval_hours INTEGER DEFAULT 24,
  ADD COLUMN IF NOT EXISTS checkpoint_profit_target_percent NUMERIC(5, 2) DEFAULT 8.0,
  ADD COLUMN IF NOT EXISTS current_checkpoint INTEGER DEFAULT 1;

-- Add comments for clarity
COMMENT ON COLUMN funded_accounts.num_checkpoints IS 'Total number of checkpoints for the evaluation period';
COMMENT ON COLUMN funded_accounts.checkpoint_interval_hours IS 'Hours between each checkpoint evaluation';
COMMENT ON COLUMN funded_accounts.checkpoint_profit_target_percent IS 'Required profit percentage at each checkpoint (e.g., 8.0 for 8%)';
COMMENT ON COLUMN funded_accounts.current_checkpoint IS 'Current checkpoint number (1-indexed)';

-- Create funded_account_checkpoints table (matching test_account_checkpoints)
CREATE TABLE IF NOT EXISTS funded_account_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funded_account_id UUID NOT NULL REFERENCES funded_accounts(id) ON DELETE CASCADE,
  checkpoint_number INTEGER NOT NULL,
  checkpoint_balance NUMERIC(20, 8),
  checkpoint_passed BOOLEAN,
  checkpoint_ts TIMESTAMPTZ,
  required_balance NUMERIC(20, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_checkpoint_per_funded_account UNIQUE(funded_account_id, checkpoint_number)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_funded_account_checkpoints_account_id
  ON funded_account_checkpoints(funded_account_id);

-- RLS policies for funded_account_checkpoints
ALTER TABLE funded_account_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view checkpoints for their funded accounts"
  ON funded_account_checkpoints FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM funded_accounts fa
      JOIN users u ON u.id = fa.user_id
      WHERE fa.id = funded_account_checkpoints.funded_account_id
    )
  );

CREATE POLICY "Service role can manage all funded checkpoints"
  ON funded_account_checkpoints FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE funded_account_checkpoints IS 'Stores checkpoint history for funded accounts with dynamic evaluation periods';
