export const SCHEMA_V4 = `
CREATE TABLE IF NOT EXISTS exercise_shares (
  slug        TEXT    PRIMARY KEY,
  owner_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id TEXT    NOT NULL,
  message     TEXT,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_exercise_shares_owner ON exercise_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_exercise_shares_exercise ON exercise_shares(owner_id, exercise_id);
`;
