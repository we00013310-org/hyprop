-- Rename evaluation_days to num_checkpoints for clarity
-- Since checkpoints aren't necessarily daily (could be 12h, 6h, etc.)

ALTER TABLE test_accounts
  RENAME COLUMN evaluation_days TO num_checkpoints;

-- Update comment
COMMENT ON COLUMN test_accounts.num_checkpoints IS 'Total number of checkpoints for the evaluation period (not necessarily daily)';
