import { describe, it, expect } from 'vitest';
import type {
  TranscriptChunk,
  TranscriptEntry,
  ScreenSnapshot,
  StyleProfile,
  CompactPrompt,
  Suggestion,
  Session,
  ProviderConfig,
  AppSettings
} from './index';

describe('shared-types shapes', () => {
  it('accepts a well-formed TranscriptEntry built from a TranscriptChunk', () => {
    const chunk: TranscriptChunk = { timestamp: 1, text: 'hello', source: 'stub' };
    const entry: TranscriptEntry = { ...chunk, sessionId: 1 };
    expect(entry.sessionId).toBe(1);
    expect(entry.text).toBe('hello');
  });

  it('accepts well-formed values for every exported type', () => {
    const screen: ScreenSnapshot = { timestamp: 1, summary: 'x' };
    const profile: StyleProfile = { avgSentenceLength: 10, topPhrases: ['a'], formality: 'neutral' };
    const prompt: CompactPrompt = { transcriptExcerpt: 'x', screenSummary: 'y', styleNotes: 'z' };
    const suggestion: Suggestion = { sessionId: 1, timestamp: 1, text: 'x' };
    const session: Session = { startedAt: 1 };
    const providerConfig: ProviderConfig = { providerId: 'stub' };
    const settings: AppSettings = {
      overlayOpacity: 1,
      overlayX: 0,
      overlayY: 0,
      activeProvider: 'stub',
      apiKeys: {}
    };

    expect(screen.summary).toBe('x');
    expect(profile.formality).toBe('neutral');
    expect(prompt.transcriptExcerpt).toBe('x');
    expect(suggestion.text).toBe('x');
    expect(session.startedAt).toBe(1);
    expect(providerConfig.providerId).toBe('stub');
    expect(settings.activeProvider).toBe('stub');
  });
});
