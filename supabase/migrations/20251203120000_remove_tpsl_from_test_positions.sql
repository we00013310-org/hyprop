-- Drop tp_price and sl_price columns from test_positions table
ALTER TABLE test_positions
DROP COLUMN tp_price,
DROP COLUMN sl_price;
