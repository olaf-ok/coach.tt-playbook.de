export const SCHEMA_V3 = `
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
`;
