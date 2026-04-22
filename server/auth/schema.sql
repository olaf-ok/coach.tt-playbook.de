CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash   TEXT NOT NULL,
  email_verified  INTEGER NOT NULL DEFAULT 0,
  pro_until       INTEGER,
  trainer_name    TEXT,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash    TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL,
  user_agent    TEXT,
  ip            TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS verification_tokens (
  token_hash   TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reset_tokens (
  token_hash   TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at   INTEGER NOT NULL,
  used_at      INTEGER
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key         TEXT PRIMARY KEY,
  count       INTEGER NOT NULL,
  window_end  INTEGER NOT NULL
);

ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_status TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stripe_customer_id
  ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS stripe_events (
  event_id    TEXT PRIMARY KEY,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_exercises (
  user_id      TEXT    NOT NULL,
  id           TEXT    NOT NULL,
  updated_at   INTEGER NOT NULL,
  deleted_at   INTEGER,
  data         TEXT    NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_sync_ex_updated ON sync_exercises(user_id, updated_at);

CREATE TABLE IF NOT EXISTS sync_playlists (
  user_id      TEXT    NOT NULL,
  id           TEXT    NOT NULL,
  updated_at   INTEGER NOT NULL,
  deleted_at   INTEGER,
  data         TEXT    NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_sync_pl_updated ON sync_playlists(user_id, updated_at);

CREATE TABLE IF NOT EXISTS sync_settings (
  user_id      TEXT    PRIMARY KEY,
  updated_at   INTEGER NOT NULL,
  data         TEXT    NOT NULL
);
