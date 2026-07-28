import type { TranscriptChunk, ScreenSnapshot, StyleProfile, CompactPrompt } from '@mooly/shared-types';

export interface AssembleContextOptions {
  maxTranscriptChars?: number;
}

export function assembleContext(
  transcript: TranscriptChunk[],
  screen: ScreenSnapshot,
  profile: StyleProfile,
  opts: AssembleContextOptions = {}
): CompactPrompt {
  const maxChars = opts.maxTranscriptChars ?? 500;
  const fullExcerpt = transcript.map((entry) => entry.text).join(' ');
  const transcriptExcerpt =
    fullExcerpt.length > maxChars ? fullExcerpt.slice(fullExcerpt.length - maxChars) : fullExcerpt;

  const styleNotes = `Write in a ${profile.formality} tone, averaging about ${Math.round(
    profile.avgSentenceLength
  )} words per sentence. Favor phrasing like: ${profile.topPhrases.join(', ')}.`;

  return {
    transcriptExcerpt,
    screenSummary: screen.summary,
    styleNotes
  };
}
