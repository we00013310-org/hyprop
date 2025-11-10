-- Add policies to allow anon users (wallet auth) to manage demo config
-- This is needed because we use wallet-based auth with anon key

-- Allow anon users to insert/update demo_btc_price_offset
CREATE POLICY "Anon users can upsert demo config"
  ON config FOR INSERT
  TO anon
  WITH CHECK (key = 'demo_btc_price_offset');

CREATE POLICY "Anon users can update demo config"
  ON config FOR UPDATE
  TO anon
  USING (key = 'demo_btc_price_offset')
  WITH CHECK (key = 'demo_btc_price_offset');

-- Allow anon users to delete demo_btc_price_offset
CREATE POLICY "Anon users can delete demo config"
  ON config FOR DELETE
  TO anon
  USING (key = 'demo_btc_price_offset');

-- Allow anon users to read all config (not just demo)
CREATE POLICY "Anon users can view config"
  ON config FOR SELECT
  TO anon
  USING (true);
