/*
  # Add TP/SL support to test_orders

  Adds fields to distinguish Take Profit and Stop Loss orders from regular limit orders,
  and implements activation mechanism to prevent TP/SL from executing before entry order fills.

  ## Changes

  1. New Columns
    - `order_subtype` (text) - Distinguishes between 'regular', 'take_profit', 'stop_loss' orders
    - `parent_order_id` (uuid) - Links TP/SL orders to their entry order
    - `is_active` (boolean) - Controls whether TP/SL orders can be matched/executed

  2. Constraints
    - Check constraint for valid order_subtype values
    - Foreign key constraint for parent_order_id with CASCADE delete

  3. Indexes
    - Index on parent_order_id for efficient child order lookups
    - Index on order_subtype for filtering by order type

  ## Migration Strategy

  - Existing orders default to 'regular' subtype with is_active = true
  - New TP/SL orders will be created with is_active = false
  - TP/SL orders activate when their parent entry order fills
*/

-- Add order_subtype to distinguish TP/SL from regular orders
ALTER TABLE test_orders
ADD COLUMN IF NOT EXISTS order_subtype text DEFAULT 'regular';

-- Add parent_order_id to link TP/SL to their entry order
ALTER TABLE test_orders
ADD COLUMN IF NOT EXISTS parent_order_id uuid REFERENCES test_orders(id) ON DELETE CASCADE;

-- Add is_active flag to control when TP/SL can execute
ALTER TABLE test_orders
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add constraint for valid subtypes
ALTER TABLE test_orders
ADD CONSTRAINT valid_order_subtype
CHECK (order_subtype IN ('regular', 'take_profit', 'stop_loss'));

-- Add comment for documentation
COMMENT ON COLUMN test_orders.order_subtype IS 'Order subtype: regular (standard limit/market), take_profit (TP), stop_loss (SL)';
COMMENT ON COLUMN test_orders.parent_order_id IS 'For TP/SL orders: references the entry order that created this TP/SL';
COMMENT ON COLUMN test_orders.is_active IS 'Controls whether order can be matched. TP/SL start inactive until parent fills.';

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_test_orders_parent_order_id ON test_orders(parent_order_id);
CREATE INDEX IF NOT EXISTS idx_test_orders_subtype ON test_orders(order_subtype);

-- Composite index for common TP/SL queries
CREATE INDEX IF NOT EXISTS idx_test_orders_parent_active ON test_orders(parent_order_id, is_active, status);
