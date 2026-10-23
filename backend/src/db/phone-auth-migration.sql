-- Apply once to the WasteCHAiN PostgreSQL database before enabling mobile OTP login.
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS requested_role varchar(20);

-- Phone numbers are the mobile identity. NULL is allowed for existing web accounts.
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique_idx ON users (phone);

CREATE TABLE IF NOT EXISTS mobile_refresh_sessions (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id varchar(36) NOT NULL,
  token_hash varchar(64) NOT NULL UNIQUE,
  expires_at timestamp NOT NULL,
  revoked_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mobile_refresh_sessions_family_idx ON mobile_refresh_sessions (family_id);
CREATE INDEX IF NOT EXISTS mobile_refresh_sessions_user_idx ON mobile_refresh_sessions (user_id);

CREATE TABLE IF NOT EXISTS mobile_otp_send_limits (
  phone varchar(16) PRIMARY KEY,
  last_sent_at timestamp NOT NULL,
  window_started_at timestamp NOT NULL,
  send_count integer NOT NULL DEFAULT 1
);

-- Referral codes are attached to the inviter; each new citizen can be referred once.
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code varchar(12);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_user_id integer REFERENCES users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_unique_idx ON users (referral_code) WHERE referral_code IS NOT NULL;

-- A unique referral_id makes the inviter bonus one-time even if reports arrive concurrently.
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS referral_id integer REFERENCES users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS transactions_referral_id_unique_idx ON transactions (referral_id);
