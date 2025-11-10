-- Run this SQL in your Supabase Dashboard SQL Editor
-- Go to: https://supabase.com/dashboard/project/[your-project]/sql/new

-- Create test_positions table for Phase 1 simulated trading
CREATE TABLE IF NOT EXISTS test_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_account_id uuid REFERENCES test_accounts(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  side text NOT NULL,
  size numeric NOT NULL DEFAULT 0,
  avg_entry numeric NOT NULL DEFAULT 0,
  margin_used numeric NOT NULL DEFAULT 0,
  upnl numeric NOT NULL DEFAULT 0,
  rpnl numeric NOT NULL DEFAULT 0,
  fees_accrued numeric NOT NULL DEFAULT 0,
  last_update_ts timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT test_positions_side_check CHECK (
    side IN ('long', 'short')
  ),
  UNIQUE(test_account_id, symbol)
);

ALTER TABLE test_positions ENABLE ROW LEVEL SECURITY;

-- Use same RLS pattern as other tables (application handles authorization)
DROP POLICY IF EXISTS "Allow test position operations" ON test_positions;

CREATE POLICY "Allow test position operations"
  ON test_positions FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_positions_test_account_id ON test_positions(test_account_id);
CREATE INDEX IF NOT EXISTS idx_test_positions_last_update_ts ON test_positions(last_update_ts);




