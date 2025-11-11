-- Make checkpoint system configurable
-- Add fields to control evaluation duration and checkpoint frequency

ALTER TABLE test_accounts
  ADD COLUMN IF NOT EXISTS evaluation_days INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS checkpoint_interval_hours INTEGER DEFAULT 24,
  ADD COLUMN IF NOT EXISTS checkpoint_profit_target_percent NUMERIC(5, 2) DEFAULT 8.0;

-- Add comments
COMMENT ON COLUMN test_accounts.evaluation_days IS 'Total number of days (checkpoints) for the evaluation period';
COMMENT ON COLUMN test_accounts.checkpoint_interval_hours IS 'Hours between each checkpoint evaluation';
COMMENT ON COLUMN test_accounts.checkpoint_profit_target_percent IS 'Required profit percentage at each checkpoint (e.g., 8.0 for 8%)';

-- Create a table to store checkpoint history for dynamic checkpoints
CREATE TABLE IF NOT EXISTS test_account_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_account_id UUID NOT NULL REFERENCES test_accounts(id) ON DELETE CASCADE,
  checkpoint_number INTEGER NOT NULL,
  checkpoint_balance NUMERIC(20, 8),
  checkpoint_passed BOOLEAN,
  checkpoint_ts TIMESTAMPTZ,
  required_balance NUMERIC(20, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_checkpoint_per_account UNIQUE(test_account_id, checkpoint_number)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_test_account_checkpoints_account_id
  ON test_account_checkpoints(test_account_id);

-- RLS policies for test_account_checkpoints
ALTER TABLE test_account_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view checkpoints for their test accounts"
  ON test_account_checkpoints FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM test_accounts ta
      JOIN users u ON u.id = ta.user_id
      WHERE ta.id = test_account_checkpoints.test_account_id
    )
  );

CREATE POLICY "Service role can manage all checkpoints"
  ON test_account_checkpoints FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE test_account_checkpoints IS 'Stores checkpoint history for test accounts with dynamic evaluation periods';
