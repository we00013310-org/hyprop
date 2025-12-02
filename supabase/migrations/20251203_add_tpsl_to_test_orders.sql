-- Add tp_price and sl_price columns to test_orders table
ALTER TABLE test_orders
ADD COLUMN IF NOT EXISTS tp_price numeric,
ADD COLUMN IF NOT EXISTS sl_price numeric;
