PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  name TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  role TEXT,
  content TEXT,
  ts INTEGER,
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_session_ts ON messages(session_id, ts);

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  url TEXT,
  title TEXT,
  content TEXT,
  checksum TEXT,
  ts INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_checksum ON pages(checksum);

CREATE TABLE IF NOT EXISTS embeddings (
  id TEXT PRIMARY KEY,
  page_id TEXT,
  vector BLOB,
  dim INTEGER,
  model TEXT,
  FOREIGN KEY(page_id) REFERENCES pages(id)
);

CREATE TABLE IF NOT EXISTS downloads (
  id TEXT PRIMARY KEY,
  url TEXT,
  path TEXT,
  status TEXT,
  progress INTEGER,
  ts INTEGER
);

CREATE TABLE IF NOT EXISTS histories (
  id TEXT PRIMARY KEY,
  url TEXT,
  title TEXT,
  ts INTEGER,
  duration INTEGER
);

CREATE TABLE IF NOT EXISTS scripts (
  id TEXT PRIMARY KEY,
  name TEXT,
  json TEXT,
  created_at INTEGER
);

