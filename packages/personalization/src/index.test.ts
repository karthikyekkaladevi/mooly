import { describe, it, expect } from 'vitest';
import { buildStyleProfile } from './index';

describe('buildStyleProfile', () => {
  it('computes average sentence length in words', () => {
    const profile = buildStyleProfile([
      'This is four words. This one has five words here.'
    ]);
    // sentence 1: "This is four words" -> 4 words
    // sentence 2: "This one has five words here" -> 6 words
    expect(profile.avgSentenceLength).toBeCloseTo(5, 5);
  });

  it('extracts top phrases, excluding short/stop words', () => {
    const profile = buildStyleProfile([
      'roadmap roadmap roadmap onboarding onboarding the a to is'
    ]);
    expect(profile.topPhrases[0]).toBe('roadmap');
    expect(profile.topPhrases).toContain('onboarding');
    expect(profile.topPhrases).not.toContain('the');
    expect(profile.topPhrases).not.toContain('is');
  });

  it('classifies casual tone from casual markers', () => {
    const profile = buildStyleProfile(["Hey, we're gonna wanna revisit this, yeah?"]);
    expect(profile.formality).toBe('casual');
  });

  it('classifies formal tone from formal markers', () => {
    const profile = buildStyleProfile(['Furthermore, the committee shall proceed regarding this matter.']);
    expect(profile.formality).toBe('formal');
  });

  it('classifies neutral tone when no markers are present', () => {
    const profile = buildStyleProfile(['The meeting starts at three.']);
    expect(profile.formality).toBe('neutral');
  });

  it('returns zero average length for empty input', () => {
    const profile = buildStyleProfile([]);
    expect(profile.avgSentenceLength).toBe(0);
    expect(profile.topPhrases).toEqual([]);
  });
});
