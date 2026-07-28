import { describe, it, expect } from 'vitest';
import { assembleContext } from './index';
import type { TranscriptChunk, ScreenSnapshot, StyleProfile } from '@mooly/shared-types';

const screen: ScreenSnapshot = { timestamp: 1, summary: 'Zoom call: Q3 Planning' };
const profile: StyleProfile = {
  avgSentenceLength: 8,
  topPhrases: ['roadmap', 'onboarding'],
  formality: 'neutral'
};

describe('assembleContext', () => {
  it('joins transcript chunks in order into the excerpt', () => {
    const transcript: TranscriptChunk[] = [
      { timestamp: 1, text: 'First line.', source: 'stub' },
      { timestamp: 2, text: 'Second line.', source: 'stub' }
    ];
    const prompt = assembleContext(transcript, screen, profile);
    expect(prompt.transcriptExcerpt).toBe('First line. Second line.');
    expect(prompt.screenSummary).toBe('Zoom call: Q3 Planning');
  });

  it('includes formality and top phrases in styleNotes', () => {
    const prompt = assembleContext([], screen, profile);
    expect(prompt.styleNotes).toContain('neutral');
    expect(prompt.styleNotes).toContain('roadmap');
    expect(prompt.styleNotes).toContain('onboarding');
  });

  it('truncates the transcript excerpt to maxTranscriptChars, keeping the most recent text', () => {
    const transcript: TranscriptChunk[] = [
      { timestamp: 1, text: 'A'.repeat(20), source: 'stub' },
      { timestamp: 2, text: 'B'.repeat(20), source: 'stub' }
    ];
    const prompt = assembleContext(transcript, screen, profile, { maxTranscriptChars: 15 });
    expect(prompt.transcriptExcerpt.length).toBeLessThanOrEqual(15);
    expect(prompt.transcriptExcerpt).toBe('B'.repeat(15));
  });

  it('returns an empty excerpt for an empty transcript', () => {
    const prompt = assembleContext([], screen, profile);
    expect(prompt.transcriptExcerpt).toBe('');
  });
});
