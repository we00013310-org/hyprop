-- Remove hardcoded day1/day2/day3 columns since we now use the dynamic test_account_checkpoints table
-- Keep current_day as it's still used to track which checkpoint we're on

ALTER TABLE test_accounts
  DROP COLUMN IF EXISTS day1_checkpoint_balance,
  DROP COLUMN IF EXISTS day1_checkpoint_passed,
  DROP COLUMN IF EXISTS day1_checkpoint_ts,
  DROP COLUMN IF EXISTS day2_checkpoint_balance,
  DROP COLUMN IF EXISTS day2_checkpoint_passed,
  DROP COLUMN IF EXISTS day2_checkpoint_ts,
  DROP COLUMN IF EXISTS day3_checkpoint_balance,
  DROP COLUMN IF EXISTS day3_checkpoint_passed,
  DROP COLUMN IF EXISTS day3_checkpoint_ts;

-- Note: current_day is kept as it tracks the current checkpoint number (1, 2, 3, etc.)
-- All checkpoint history is now stored in the test_account_checkpoints table
