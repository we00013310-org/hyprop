/*
  # HyProp MVP Database Schema
  
  1. New Tables
    - `users` - User accounts with email/wallet authentication
      - `id` (uuid, primary key)
      - `email` (text, optional for wallet-only users)
      - `wallet_address` (text, primary connected wallet)
      - `kyc_status` (text, KYC state: none/pending/approved)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `pairs` - Trading pair metadata from Hyperliquid
      - `symbol` (text, primary key, e.g., BTC-PERP)
      - `display_name` (text, human-readable name)
      - `leverage_cap` (numeric, max leverage from Hyperliquid)
      - `tick_size` (numeric, smallest price increment)
      - `lot_size` (numeric, minimum trade size)
      - `fee_rate_maker` (numeric, maker fee rate)
      - `fee_rate_taker` (numeric, taker fee rate)
      - `status` (text, market availability)
      - `last_refreshed_at` (timestamptz, metadata refresh time)
    
    - `test_accounts` - Simulated trading evaluation accounts
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `account_size` (numeric, virtual test size)
      - `account_mode` (text, 1-step or 2-step)
      - `fee_paid` (numeric, evaluation fee in USDC)
      - `virtual_balance` (numeric, current simulated balance)
      - `dd_max` (numeric, max total drawdown)
      - `dd_daily` (numeric, max daily loss)
      - `profit_target` (numeric, profit goal to pass)
      - `high_water_mark` (numeric, highest virtual equity reached)
      - `last_withdrawal_ts` (timestamptz, last simulated withdrawal time)
      - `status` (text, active/passed/failed/expired)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `funded_accounts` - Live trading accounts with HyProp capital
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `test_account_id` (uuid, foreign key to test_accounts)
      - `primary_symbol` (text, foreign key to pairs.symbol)
      - `pair_mode` (text, single/multi)
      - `l_user` (numeric, trader leverage)
      - `n_max` (numeric, max notional allowed)
      - `l_effective` (numeric, backend effective leverage ratio)
      - `im_required` (numeric, initial margin in USDC)
      - `maintenance_margin` (numeric, maintenance margin in USDC)
      - `balance_actual` (numeric, real funded balance allocated)
      - `dd_max` (numeric, max total drawdown)
      - `dd_daily` (numeric, max daily drawdown)
      - `e_start` (numeric, equity at funding start)
      - `e_day_start` (numeric, equity at UTC 00:00)
      - `high_water_mark` (numeric, highest equity reached)
      - `last_withdrawal_ts` (timestamptz, last real withdrawal)
      - `status` (text, active/paused/failed/closed)
      - `hl_subaccount_id` (text, Hyperliquid subaccount reference)
      - `hl_builder_code` (text, Builder code used)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `positions` - Current open positions for funded accounts
      - `id` (uuid, primary key)
      - `account_id` (uuid, foreign key to funded_accounts)
      - `symbol` (text, market)
      - `side` (text, long/short)
      - `size` (numeric, quantity open)
      - `avg_entry` (numeric, average entry price)
      - `upnl` (numeric, unrealized PnL)
      - `rpnl` (numeric, realized PnL)
      - `fees_accrued` (numeric, trading fees accrued)
      - `funding_accrued` (numeric, funding payments accrued)
      - `last_update_ts` (timestamptz, latest sync timestamp)
    
    - `equity_snapshots` - Historical equity tracking for drawdown monitoring
      - `id` (uuid, primary key)
      - `account_id` (uuid, foreign key to funded_accounts)
      - `ts` (timestamptz, snapshot timestamp)
      - `equity` (numeric, current equity)
      - `peak_equity_cached` (numeric, cached high water mark)
      - `upnl` (numeric, unrealized PnL at snapshot)
      - `rpnl` (numeric, realized PnL at snapshot)
      - `fees_accrued` (numeric, fees at moment)
      - `funding_accrued` (numeric, funding at moment)
      - `mark_seq` (bigint, Hyperliquid sequence id)
      - `daily_drawdown_flag` (boolean, if daily DD breached at ts)
      - `max_drawdown_flag` (boolean, if total DD breached at ts)
    
    - `events` - System event log for auditing and debugging
      - `id` (uuid, primary key)
      - `ts` (timestamptz, event time)
      - `account_id` (uuid, nullable foreign key to funded_accounts)
      - `user_id` (uuid, nullable foreign key to users)
      - `type` (text, event type)
      - `payload` (jsonb, extra event details)
    
    - `treasury_transfers` - On-chain USDC transfers for funding and payouts
      - `id` (uuid, primary key)
      - `account_id` (uuid, foreign key to funded_accounts)
      - `tx_hash` (text, on-chain transaction hash)
      - `direction` (text, deposit/withdraw/topup)
      - `amount` (numeric, amount moved in USDC)
      - `network` (text, Base/HyperEVM)
      - `status` (text, pending/confirmed/failed)
      - `created_at` (timestamptz)
      - `confirmed_at` (timestamptz)
    
    - `payouts` - Profit distribution records
      - `id` (uuid, primary key)
      - `account_id` (uuid, foreign key to funded_accounts)
      - `period_start` (date, start period)
      - `period_end` (date, end period)
      - `gross_profit` (numeric, total realized profit)
      - `profit_split_trader` (numeric, trader split fraction)
      - `profit_split_hyprop` (numeric, HyProp split fraction)
      - `trader_amount` (numeric, amount to trader)
      - `hyprop_amount` (numeric, amount to HyProp)
      - `network` (text, payment network)
      - `tx_hash_trader` (text, tx hash to trader)
      - `tx_hash_hyprop` (text, tx hash to HyProp)
      - `status` (text, pending/paid/failed/completed)
      - `created_at` (timestamptz)
    
    - `config` - System configuration key-value store
      - `key` (text, primary key)
      - `value` (jsonb, value blob)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated user access
    - Restrict admin operations appropriately
    
  3. Indexes
    - Add indexes for frequently queried columns
    - Optimize for real-time equity monitoring queries
    
  4. Important Notes
    - All monetary values stored as numeric for precision
    - Timestamps use timestamptz for proper timezone handling
    - Foreign keys enforce referential integrity
    - Default values prevent null-related errors
*/

-- Users table (using gen_random_uuid() which is built into PostgreSQL)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  wallet_address text,
  kyc_status text DEFAULT 'none' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT users_email_or_wallet_check CHECK (
    email IS NOT NULL OR wallet_address IS NOT NULL
  )
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Pairs table
CREATE TABLE IF NOT EXISTS pairs (
  symbol text PRIMARY KEY,
  display_name text NOT NULL,
  leverage_cap numeric NOT NULL DEFAULT 1,
  tick_size numeric NOT NULL DEFAULT 0.01,
  lot_size numeric NOT NULL DEFAULT 0.001,
  fee_rate_maker numeric NOT NULL DEFAULT 0.0001,
  fee_rate_taker numeric NOT NULL DEFAULT 0.0003,
  status text DEFAULT 'active' NOT NULL,
  last_refreshed_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pairs"
  ON pairs FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Test accounts table
CREATE TABLE IF NOT EXISTS test_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  account_size numeric NOT NULL,
  account_mode text NOT NULL,
  fee_paid numeric NOT NULL,
  virtual_balance numeric NOT NULL,
  dd_max numeric NOT NULL,
  dd_daily numeric NOT NULL,
  profit_target numeric NOT NULL,
  high_water_mark numeric NOT NULL,
  last_withdrawal_ts timestamptz,
  status text DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT test_accounts_mode_check CHECK (
    account_mode IN ('1-step', '2-step')
  ),
  CONSTRAINT test_accounts_status_check CHECK (
    status IN ('active', 'passed', 'failed', 'expired')
  )
);

ALTER TABLE test_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own test accounts"
  ON test_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own test accounts"
  ON test_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test accounts"
  ON test_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Funded accounts table
CREATE TABLE IF NOT EXISTS funded_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  test_account_id uuid REFERENCES test_accounts(id) ON DELETE SET NULL,
  primary_symbol text REFERENCES pairs(symbol) NOT NULL,
  pair_mode text DEFAULT 'single' NOT NULL,
  l_user numeric NOT NULL,
  n_max numeric NOT NULL,
  l_effective numeric NOT NULL,
  im_required numeric NOT NULL,
  maintenance_margin numeric NOT NULL,
  balance_actual numeric NOT NULL,
  dd_max numeric NOT NULL,
  dd_daily numeric NOT NULL,
  e_start numeric NOT NULL,
  e_day_start numeric,
  high_water_mark numeric NOT NULL,
  last_withdrawal_ts timestamptz,
  status text DEFAULT 'active' NOT NULL,
  hl_subaccount_id text,
  hl_builder_code text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT funded_accounts_pair_mode_check CHECK (
    pair_mode IN ('single', 'multi')
  ),
  CONSTRAINT funded_accounts_status_check CHECK (
    status IN ('active', 'paused', 'failed', 'closed')
  )
);

ALTER TABLE funded_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own funded accounts"
  ON funded_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own funded accounts"
  ON funded_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES funded_accounts(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  side text NOT NULL,
  size numeric NOT NULL DEFAULT 0,
  avg_entry numeric NOT NULL DEFAULT 0,
  upnl numeric NOT NULL DEFAULT 0,
  rpnl numeric NOT NULL DEFAULT 0,
  fees_accrued numeric NOT NULL DEFAULT 0,
  funding_accrued numeric NOT NULL DEFAULT 0,
  last_update_ts timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT positions_side_check CHECK (
    side IN ('long', 'short')
  ),
  UNIQUE(account_id, symbol)
);

ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view positions for own funded accounts"
  ON positions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM funded_accounts
      WHERE funded_accounts.id = positions.account_id
      AND funded_accounts.user_id = auth.uid()
    )
  );

-- Equity snapshots table
CREATE TABLE IF NOT EXISTS equity_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES funded_accounts(id) ON DELETE CASCADE NOT NULL,
  ts timestamptz DEFAULT now() NOT NULL,
  equity numeric NOT NULL,
  peak_equity_cached numeric NOT NULL,
  upnl numeric NOT NULL DEFAULT 0,
  rpnl numeric NOT NULL DEFAULT 0,
  fees_accrued numeric NOT NULL DEFAULT 0,
  funding_accrued numeric NOT NULL DEFAULT 0,
  mark_seq bigint,
  daily_drawdown_flag boolean DEFAULT false NOT NULL,
  max_drawdown_flag boolean DEFAULT false NOT NULL
);

ALTER TABLE equity_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view equity snapshots for own funded accounts"
  ON equity_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM funded_accounts
      WHERE funded_accounts.id = equity_snapshots.account_id
      AND funded_accounts.user_id = auth.uid()
    )
  );

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz DEFAULT now() NOT NULL,
  account_id uuid REFERENCES funded_accounts(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb NOT NULL
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events for own accounts"
  ON events FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM funded_accounts
      WHERE funded_accounts.id = events.account_id
      AND funded_accounts.user_id = auth.uid()
    )
  );

-- Treasury transfers table
CREATE TABLE IF NOT EXISTS treasury_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES funded_accounts(id) ON DELETE CASCADE NOT NULL,
  tx_hash text,
  direction text NOT NULL,
  amount numeric NOT NULL,
  network text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  confirmed_at timestamptz,
  CONSTRAINT treasury_transfers_direction_check CHECK (
    direction IN ('deposit', 'withdraw', 'topup')
  ),
  CONSTRAINT treasury_transfers_network_check CHECK (
    network IN ('Base', 'HyperEVM')
  ),
  CONSTRAINT treasury_transfers_status_check CHECK (
    status IN ('pending', 'confirmed', 'failed')
  )
);

ALTER TABLE treasury_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view treasury transfers for own funded accounts"
  ON treasury_transfers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM funded_accounts
      WHERE funded_accounts.id = treasury_transfers.account_id
      AND funded_accounts.user_id = auth.uid()
    )
  );

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES funded_accounts(id) ON DELETE CASCADE NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_profit numeric NOT NULL,
  profit_split_trader numeric NOT NULL DEFAULT 0.8,
  profit_split_hyprop numeric NOT NULL DEFAULT 0.2,
  trader_amount numeric NOT NULL,
  hyprop_amount numeric NOT NULL,
  network text NOT NULL,
  tx_hash_trader text,
  tx_hash_hyprop text,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT payouts_network_check CHECK (
    network IN ('Base', 'HyperEVM')
  ),
  CONSTRAINT payouts_status_check CHECK (
    status IN ('pending', 'paid', 'failed', 'completed')
  )
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payouts for own funded accounts"
  ON payouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM funded_accounts
      WHERE funded_accounts.id = payouts.account_id
      AND funded_accounts.user_id = auth.uid()
    )
  );

-- Config table
CREATE TABLE IF NOT EXISTS config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view config"
  ON config FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_accounts_user_id ON test_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_accounts_status ON test_accounts(status);
CREATE INDEX IF NOT EXISTS idx_funded_accounts_user_id ON funded_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_funded_accounts_status ON funded_accounts(status);
CREATE INDEX IF NOT EXISTS idx_positions_account_id ON positions(account_id);
CREATE INDEX IF NOT EXISTS idx_equity_snapshots_account_id ON equity_snapshots(account_id);
CREATE INDEX IF NOT EXISTS idx_equity_snapshots_ts ON equity_snapshots(ts);
CREATE INDEX IF NOT EXISTS idx_events_account_id ON events(account_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_treasury_transfers_account_id ON treasury_transfers(account_id);
CREATE INDEX IF NOT EXISTS idx_payouts_account_id ON payouts(account_id);

-- Insert initial pair data (BTC-PERP for MVP)
INSERT INTO pairs (symbol, display_name, leverage_cap, tick_size, lot_size, fee_rate_maker, fee_rate_taker, status)
VALUES ('BTC-PERP', 'BTC Perpetual', 50, 0.1, 0.001, 0.0001, 0.0003, 'active')
ON CONFLICT (symbol) DO NOTHING;

-- Insert initial config values
INSERT INTO config (key, value)
VALUES 
  ('margin_watchdog_interval_ms', '{"interval": 5000}'::jsonb),
  ('equity_snapshot_interval_ms', '{"interval": 1000}'::jsonb),
  ('equity_verifier_interval_ms', '{"interval": 3000}'::jsonb)
ON CONFLICT (key) DO NOTHING;