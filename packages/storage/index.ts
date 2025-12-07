import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

export type StoredMessage = { role: 'user' | 'assistant'; content: string; ts: number; pinned?: boolean }
export type StoredSession = { id: string; name?: string; createdAt: number; pinned?: boolean; messages: StoredMessage[] }

export class Storage {
  private db: Database.Database
  constructor() {
    const dir = app.getPath('userData')
    const file = join(dir, 'history.db')
    this.db = new Database(file)
    this.bootstrap()
  }
  private bootstrap() {
    this.db.exec(`
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT,
        created_at INTEGER,
        pinned INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        role TEXT,
        content TEXT,
        ts INTEGER,
        pinned INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_messages_session_ts ON messages(session_id, ts);
      CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(content, session_id, ts, role);
    `)
  }
  listSessions(): StoredSession[] {
    const rows = this.db.prepare('SELECT id,name,created_at,pinned FROM sessions').all()
    return rows.map((r: any) => ({ id: r.id, name: r.name, createdAt: r.created_at || 0, pinned: !!r.pinned, messages: this.listMessages(r.id) }))
  }
  listMessages(sessionId: string): StoredMessage[] {
    const rows = this.db.prepare('SELECT role,content,ts,pinned FROM messages WHERE session_id = ? ORDER BY ts ASC').all(sessionId)
    return rows.map((r: any) => ({ role: r.role, content: r.content, ts: r.ts, pinned: !!r.pinned }))
  }
  saveSession(sessionId: string, messages: StoredMessage[], name?: string) {
    const now = Date.now()
    const tx = this.db.transaction(() => {
      const exists = this.db.prepare('SELECT 1 FROM sessions WHERE id = ?').get(sessionId)
      if (!exists) this.db.prepare('INSERT INTO sessions(id,name,created_at,pinned) VALUES(?,?,?,0)').run(sessionId, name || null, now)
      if (name) this.db.prepare('UPDATE sessions SET name = ? WHERE id = ?').run(name, sessionId)
      this.db.prepare('DELETE FROM messages WHERE session_id = ?').run(sessionId)
      const ins = this.db.prepare('INSERT INTO messages(session_id,role,content,ts,pinned) VALUES(?,?,?,?,?)')
      const insFts = this.db.prepare('INSERT INTO messages_fts(content, session_id, ts, role) VALUES(?,?,?,?)')
      messages.forEach(m => ins.run(sessionId, m.role, m.content, m.ts, m.pinned ? 1 : 0))
      messages.forEach(m => insFts.run(m.content, sessionId, m.ts, m.role))
    })
    tx()
  }
  deleteSession(sessionId: string) {
    const tx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM messages WHERE session_id = ?').run(sessionId)
      this.db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
    })
    tx()
  }
  renameSession(sessionId: string, name: string) {
    this.db.prepare('UPDATE sessions SET name = ? WHERE id = ?').run(name, sessionId)
  }
  setPinned(sessionId: string, pinned: boolean) {
    this.db.prepare('UPDATE sessions SET pinned = ? WHERE id = ?').run(pinned ? 1 : 0, sessionId)
  }
  searchMessages(q: string, limit = 20): StoredMessage[] & any {
    const rows = this.db.prepare('SELECT session_id as sessionId, ts, role, content FROM messages_fts WHERE messages_fts MATCH ? ORDER BY ts DESC LIMIT ?').all(q, limit)
    return rows
  }
}

