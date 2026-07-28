import type { StyleProfile } from '@mooly/shared-types';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'it', 'to', 'and', 'of', 'in', 'on', 'for',
  'that', 'this', 'i', 'you', 'we', 'here', 'has'
]);

const CASUAL_MARKERS = /\b(gonna|wanna|yeah|lol|hey|kinda|sorta)\b|'(re|ll|ve|d|t)\b/i;
const FORMAL_MARKERS = /\b(furthermore|therefore|regarding|pursuant|shall|committee)\b/i;

export function buildStyleProfile(samples: string[]): StyleProfile {
  const text = samples.join(' ').trim();

  if (text.length === 0) {
    return { avgSentenceLength: 0, topPhrases: [], formality: 'neutral' };
  }

  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const totalWords = sentences.reduce(
    (sum, s) => sum + s.split(/\s+/).filter(Boolean).length,
    0
  );
  const avgSentenceLength = sentences.length > 0 ? totalWords / sentences.length : 0;

  const wordCounts = new Map<string, number>();
  for (const word of text.toLowerCase().match(/[a-z']+/g) ?? []) {
    if (STOPWORDS.has(word) || word.length < 3) continue;
    wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
  }
  const topPhrases = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  let formality: StyleProfile['formality'] = 'neutral';
  if (FORMAL_MARKERS.test(text)) {
    formality = 'formal';
  } else if (CASUAL_MARKERS.test(text)) {
    formality = 'casual';
  }

  return { avgSentenceLength, topPhrases, formality };
}
