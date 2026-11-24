-- Notes asked to be pinned. Email-only notes are never stored: they go straight to the inbox.
-- The sender's email address is never stored either.
CREATE TABLE IF NOT EXISTS notes (
  id         TEXT PRIMARY KEY,
  token      TEXT NOT NULL,                     -- secret in the approval link
  status     TEXT NOT NULL DEFAULT 'pending',   -- pending | pinned | private
  name       TEXT NOT NULL DEFAULT '',
  text       TEXT NOT NULL,
  sheet      TEXT NOT NULL,                     -- JSON {cols, lines}: every strike, for drawing the note
  created_at TEXT NOT NULL,
  pinned_at  TEXT
);
CREATE INDEX IF NOT EXISTS notes_board ON notes (status, pinned_at);

-- Rate limiting: one row per note received, kept for a day. `who` is a keyed hash of the IP, never the IP itself.
CREATE TABLE IF NOT EXISTS hits (
  who TEXT NOT NULL,
  at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS hits_at ON hits (at);
CREATE INDEX IF NOT EXISTS hits_who ON hits (who, at);
