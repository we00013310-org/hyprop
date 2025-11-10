/*
  # Fix Users Table RLS for Web3 Wallet Authentication
  
  1. Changes
    - Drop existing RLS policies on users table
    - Add new policy to allow anyone to insert new users (for wallet registration)
    - Add policy to allow users to view and update their own records by wallet_address
    
  2. Security Notes
    - Users can self-register with wallet addresses (required for Web3 auth)
    - Users can only view/update their own records
    - No authentication required for initial insert (wallet connection creates the record)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Allow anyone to insert new user records (for wallet registration)
CREATE POLICY "Anyone can register with wallet"
  ON users FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own records by wallet address
CREATE POLICY "Users can view own profile by wallet"
  ON users FOR SELECT
  USING (wallet_address = current_setting('request.headers', true)::json->>'x-wallet-address'
    OR id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Allow users to update their own records by wallet address
CREATE POLICY "Users can update own profile by wallet"
  ON users FOR UPDATE
  USING (wallet_address = current_setting('request.headers', true)::json->>'x-wallet-address'
    OR id::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (wallet_address = current_setting('request.headers', true)::json->>'x-wallet-address'
    OR id::text = current_setting('request.jwt.claims', true)::json->>'sub');