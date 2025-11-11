-- Add daily checkpoint tracking for 3-day test evaluation
-- Each checkpoint requires 8% profit from the previous checkpoint balance

ALTER TABLE test_accounts
  ADD COLUMN IF NOT EXISTS current_day INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS day1_checkpoint_balance NUMERIC(20, 8),
  ADD COLUMN IF NOT EXISTS day1_checkpoint_passed BOOLEAN,
  ADD COLUMN IF NOT EXISTS day1_checkpoint_ts TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS day2_checkpoint_balance NUMERIC(20, 8),
  ADD COLUMN IF NOT EXISTS day2_checkpoint_passed BOOLEAN,
  ADD COLUMN IF NOT EXISTS day2_checkpoint_ts TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS day3_checkpoint_balance NUMERIC(20, 8),
  ADD COLUMN IF NOT EXISTS day3_checkpoint_passed BOOLEAN,
  ADD COLUMN IF NOT EXISTS day3_checkpoint_ts TIMESTAMPTZ;

-- Add comment to explain the checkpoint system
COMMENT ON COLUMN test_accounts.current_day IS 'Current day of the 3-day evaluation (1, 2, or 3)';
COMMENT ON COLUMN test_accounts.day1_checkpoint_balance IS 'Balance at the end of day 1 (24h mark)';
COMMENT ON COLUMN test_accounts.day1_checkpoint_passed IS 'Whether the account met the 8% profit requirement from starting balance to day 1';
COMMENT ON COLUMN test_accounts.day1_checkpoint_ts IS 'Timestamp when day 1 checkpoint was evaluated';
COMMENT ON COLUMN test_accounts.day2_checkpoint_balance IS 'Balance at the end of day 2 (48h mark)';
COMMENT ON COLUMN test_accounts.day2_checkpoint_passed IS 'Whether the account met the 8% profit requirement from day 1 balance to day 2';
COMMENT ON COLUMN test_accounts.day2_checkpoint_ts IS 'Timestamp when day 2 checkpoint was evaluated';
COMMENT ON COLUMN test_accounts.day3_checkpoint_balance IS 'Balance at the end of day 3 (72h mark)';
COMMENT ON COLUMN test_accounts.day3_checkpoint_passed IS 'Whether the account met the 8% profit requirement from day 2 balance to day 3';
COMMENT ON COLUMN test_accounts.day3_checkpoint_ts IS 'Timestamp when day 3 checkpoint was evaluated';
