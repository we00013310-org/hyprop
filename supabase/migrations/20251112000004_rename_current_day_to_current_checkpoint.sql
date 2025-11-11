-- Rename current_day to current_checkpoint for consistency with checkpoint terminology

ALTER TABLE test_accounts
  RENAME COLUMN current_day TO current_checkpoint;

-- Update comment
COMMENT ON COLUMN test_accounts.current_checkpoint IS 'Current checkpoint number in the evaluation (1, 2, 3, ...)';
