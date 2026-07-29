PRAGMA foreign_keys = ON;

CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  edit_token_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  theme TEXT NOT NULL CHECK (theme IN ('apricot', 'lake', 'leaf', 'lilac')),
  content_json TEXT NOT NULL CHECK (length(content_json) <= 32768),
  revision INTEGER NOT NULL DEFAULT 1,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX profiles_expiry_idx ON profiles (expires_at);

CREATE TABLE product_events (
  session_hash TEXT NOT NULL,
  profile_id TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL CHECK (
    name IN (
      'visited', 'created', 'edited', 'shared', 'link_opened',
      'mark_copied', 'exported', 'profile_viewed', 'viewer_created', 'returned'
    )
  ),
  occurred_on TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (session_hash, profile_id, name, occurred_on)
);

CREATE INDEX product_events_date_idx ON product_events (occurred_on);
