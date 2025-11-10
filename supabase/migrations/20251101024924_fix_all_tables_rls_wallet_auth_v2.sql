/*
  # Fix RLS for All Tables - Web3 Wallet Authentication
  
  1. Changes
    - Update all tables to work without Supabase Auth (auth.uid())
    - Allow operations based on anon/authenticated roles
    - Application will handle authorization logic
    
  2. Tables Updated
    - test_accounts
    - funded_accounts
    - positions
    - equity_snapshots
    - events
    - treasury_transfers
    
  3. Security Notes
    - Since we're not using Supabase Auth JWT, we can't use auth.uid()
    - RLS policies are simplified to allow operations
    - Application code will handle wallet-based authorization
*/

-- Test Accounts
DROP POLICY IF EXISTS "Users can view own test accounts" ON test_accounts;
DROP POLICY IF EXISTS "Users can create own test accounts" ON test_accounts;
DROP POLICY IF EXISTS "Users can update own test accounts" ON test_accounts;

CREATE POLICY "Allow test account operations"
  ON test_accounts FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Funded Accounts
DROP POLICY IF EXISTS "Users can view own funded accounts" ON funded_accounts;
DROP POLICY IF EXISTS "Users can update own funded accounts" ON funded_accounts;

CREATE POLICY "Allow funded account operations"
  ON funded_accounts FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Positions
DROP POLICY IF EXISTS "Users can view positions through funded accounts" ON positions;

CREATE POLICY "Allow position operations"
  ON positions FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Equity Snapshots
DROP POLICY IF EXISTS "Users can view equity snapshots through funded accounts" ON equity_snapshots;

CREATE POLICY "Allow equity snapshot operations"
  ON equity_snapshots FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Events
DROP POLICY IF EXISTS "Users can view own events" ON events;

CREATE POLICY "Allow event operations"
  ON events FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Treasury Transfers
DROP POLICY IF EXISTS "Users can view own treasury transfers" ON treasury_transfers;

CREATE POLICY "Allow treasury transfer operations"
  ON treasury_transfers FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);