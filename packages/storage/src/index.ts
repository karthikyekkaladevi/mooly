import Database from 'better-sqlite3';
import type { Session, TranscriptEntry, Suggestion } from '@mooly/shared-types';
import { SCHEMA_SQL } from './schema';

export function openDatabase(path: string): Database.Database {
  return new Database(path);
}

export function initSchema(db: Database.Database): void {
  db.exec(SCHEMA_SQL);
}

export function createSession(db: Database.Database, startedAt: number): number {
  const result = db.prepare('INSERT INTO sessions (started_at) VALUES (?)').run(startedAt);
  return Number(result.lastInsertRowid);
}

export function endSession(db: Database.Database, sessionId: number, endedAt: number): void {
  db.prepare('UPDATE sessions SET ended_at = ? WHERE id = ?').run(endedAt, sessionId);
}

export function insertTranscriptEntry(
  db: Database.Database,
  entry: Omit<TranscriptEntry, 'id'>
): number {
  const result = db
    .prepare(
      'INSERT INTO transcript_entries (session_id, timestamp, text, source) VALUES (?, ?, ?, ?)'
    )
    .run(entry.sessionId, entry.timestamp, entry.text, entry.source);
  return Number(result.lastInsertRowid);
}

export function insertSuggestion(db: Database.Database, s: Omit<Suggestion, 'id'>): number {
  const result = db
    .prepare('INSERT INTO suggestions (session_id, timestamp, text) VALUES (?, ?, ?)')
    .run(s.sessionId, s.timestamp, s.text);
  return Number(result.lastInsertRowid);
}

export function getSessions(db: Database.Database): Session[] {
  const rows = db
    .prepare('SELECT id, started_at as startedAt, ended_at as endedAt FROM sessions ORDER BY id')
    .all() as Array<{ id: number; startedAt: number; endedAt: number | null }>;
  return rows.map((row) => ({
    id: row.id,
    startedAt: row.startedAt,
    endedAt: row.endedAt ?? undefined
  }));
}

export function getTranscriptForSession(db: Database.Database, sessionId: number): TranscriptEntry[] {
  const rows = db
    .prepare(
      'SELECT id, session_id as sessionId, timestamp, text, source FROM transcript_entries WHERE session_id = ? ORDER BY id'
    )
    .all(sessionId) as TranscriptEntry[];
  return rows;
}

export function getSuggestionsForSession(db: Database.Database, sessionId: number): Suggestion[] {
  const rows = db
    .prepare(
      'SELECT id, session_id as sessionId, timestamp, text FROM suggestions WHERE session_id = ? ORDER BY id'
    )
    .all(sessionId) as Suggestion[];
  return rows;
}

export function getSetting(db: Database.Database, key: string): string | undefined {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value;
}

export function setSetting(db: Database.Database, key: string, value: string): void {
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, value);
}

export function clearAll(db: Database.Database): void {
  db.exec(
    'DELETE FROM suggestions; DELETE FROM transcript_entries; DELETE FROM sessions; DELETE FROM settings;'
  );
}
