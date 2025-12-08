/*
  # Add TP/SL to test_positions

  Add take profit (tp_price) and stop loss (sl_price) columns to test_positions table.
  These allow traders to set automatic exit prices for risk management.
*/

-- Add TP/SL price columns to test_positions
ALTER TABLE test_positions
ADD COLUMN IF NOT EXISTS tp_price numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sl_price numeric DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN test_positions.tp_price IS 'Take profit trigger price (position auto-closes when market price reaches this level)';
COMMENT ON COLUMN test_positions.sl_price IS 'Stop loss trigger price (position auto-closes when market price reaches this level)';
