/*
  # Create test_orders table for simulated limit order trading
  
  This table stores limit orders for test_accounts (not real Hyperliquid orders).
  Orders are simulated and can be used to track pending orders before execution.
  
  1. New Table
    - `test_orders` - Simulated limit orders for test accounts
      - `id` (uuid, primary key)
      - `test_account_id` (uuid, foreign key to test_accounts)
      - `symbol` (text, trading pair e.g., BTC)
      - `side` (text, buy/sell)
      - `size` (numeric, order quantity)
      - `price` (numeric, limit price)
      - `order_type` (text, limit/market/pro)
      - `reduce_only` (boolean, whether order is reduce-only)
      - `status` (text, open/filled/cancelled/expired)
      - `filled_size` (numeric, amount filled)
      - `filled_price` (numeric, average fill price)
      - `filled_at` (timestamptz, when order was filled)
      - `cancelled_at` (timestamptz, when order was cancelled)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS with permissive policies for application-level auth
  
  3. Indexes
    - Index on test_account_id for efficient querying
    - Index on status for filtering open orders
    - Index on created_at for pagination
*/

-- Test orders table for test accounts
CREATE TABLE IF NOT EXISTS test_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_account_id uuid REFERENCES test_accounts(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  side text NOT NULL,
  size numeric NOT NULL,
  price numeric NOT NULL,
  order_type text NOT NULL DEFAULT 'limit',
  reduce_only boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'open',
  filled_size numeric NOT NULL DEFAULT 0,
  filled_price numeric,
  filled_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT test_orders_side_check CHECK (
    side IN ('buy', 'sell')
  ),
  CONSTRAINT test_orders_order_type_check CHECK (
    order_type IN ('limit', 'market', 'pro')
  ),
  CONSTRAINT test_orders_status_check CHECK (
    status IN ('open', 'filled', 'partially_filled', 'cancelled', 'expired')
  ),
  CONSTRAINT test_orders_size_positive CHECK (size > 0),
  CONSTRAINT test_orders_price_positive CHECK (price > 0)
);

ALTER TABLE test_orders ENABLE ROW LEVEL SECURITY;

-- Use same RLS pattern as other tables (application handles authorization)
CREATE POLICY "Allow test order operations"
  ON test_orders FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_orders_test_account_id ON test_orders(test_account_id);
CREATE INDEX IF NOT EXISTS idx_test_orders_status ON test_orders(status);
CREATE INDEX IF NOT EXISTS idx_test_orders_created_at ON test_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_orders_symbol ON test_orders(symbol);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_test_orders_account_status ON test_orders(test_account_id, status);
CREATE INDEX IF NOT EXISTS idx_test_orders_account_created ON test_orders(test_account_id, created_at DESC);
