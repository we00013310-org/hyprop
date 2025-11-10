-- Add policies to allow authenticated users to update demo config
-- This is needed for the demo price offset feature

-- Allow authenticated users to insert/update demo_btc_price_offset
CREATE POLICY "Authenticated users can upsert demo config"
  ON config FOR INSERT
  TO authenticated
  WITH CHECK (key = 'demo_btc_price_offset');

CREATE POLICY "Authenticated users can update demo config"
  ON config FOR UPDATE
  TO authenticated
  USING (key = 'demo_btc_price_offset')
  WITH CHECK (key = 'demo_btc_price_offset');

-- Allow authenticated users to delete demo_btc_price_offset
CREATE POLICY "Authenticated users can delete demo config"
  ON config FOR DELETE
  TO authenticated
  USING (key = 'demo_btc_price_offset');
