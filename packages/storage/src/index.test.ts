import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import {
  openDatabase,
  initSchema,
  createSession,
  endSession,
  insertTranscriptEntry,
  insertSuggestion,
  getSessions,
  getTranscriptForSession,
  getSuggestionsForSession,
  getSetting,
  setSetting,
  clearAll
} from './index';

let db: Database.Database;

beforeEach(() => {
  db = openDatabase(':memory:');
  initSchema(db);
});

describe('storage', () => {
  it('creates and retrieves a session', () => {
    const id = createSession(db, 1000);
    const sessions = getSessions(db);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe(id);
    expect(sessions[0].startedAt).toBe(1000);
    expect(sessions[0].endedAt).toBeUndefined();
  });

  it('ends a session', () => {
    const id = createSession(db, 1000);
    endSession(db, id, 2000);
    const sessions = getSessions(db);
    expect(sessions[0].endedAt).toBe(2000);
  });

  it('inserts and retrieves transcript entries for a session', () => {
    const sessionId = createSession(db, 1000);
    insertTranscriptEntry(db, { sessionId, timestamp: 1001, text: 'hello', source: 'stub' });
    insertTranscriptEntry(db, { sessionId, timestamp: 1002, text: 'world', source: 'stub' });
    const entries = getTranscriptForSession(db, sessionId);
    expect(entries).toHaveLength(2);
    expect(entries[0].text).toBe('hello');
    expect(entries[1].text).toBe('world');
  });

  it('inserts and retrieves suggestions for a session', () => {
    const sessionId = createSession(db, 1000);
    insertSuggestion(db, { sessionId, timestamp: 1005, text: 'try this' });
    const suggestions = getSuggestionsForSession(db, sessionId);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].text).toBe('try this');
  });

  it('round-trips settings key/value pairs', () => {
    expect(getSetting(db, 'apiKey')).toBeUndefined();
    setSetting(db, 'apiKey', 'abc123');
    expect(getSetting(db, 'apiKey')).toBe('abc123');
    setSetting(db, 'apiKey', 'xyz789');
    expect(getSetting(db, 'apiKey')).toBe('xyz789');
  });

  it('clearAll removes all session, transcript, suggestion, and setting rows', () => {
    const sessionId = createSession(db, 1000);
    insertTranscriptEntry(db, { sessionId, timestamp: 1001, text: 'hi', source: 'stub' });
    insertSuggestion(db, { sessionId, timestamp: 1002, text: 'sugg' });
    setSetting(db, 'k', 'v');

    clearAll(db);

    expect(getSessions(db)).toHaveLength(0);
    expect(getTranscriptForSession(db, sessionId)).toHaveLength(0);
    expect(getSuggestionsForSession(db, sessionId)).toHaveLength(0);
    expect(getSetting(db, 'k')).toBeUndefined();
  });
});
