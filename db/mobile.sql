CREATE TABLE IF NOT EXISTS mobile_pairings (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  redeemed_at timestamptz
);
CREATE INDEX IF NOT EXISTS mobile_pairings_expiry_idx ON mobile_pairings(expires_at);
