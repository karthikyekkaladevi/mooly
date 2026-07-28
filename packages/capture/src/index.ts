import type { TranscriptChunk, ScreenSnapshot } from '@mooly/shared-types';

export interface AudioCapture {
  start(): void;
  stop(): void;
  pullTranscript(): TranscriptChunk[];
}

export interface ScreenCapture {
  captureSnapshot(): Promise<ScreenSnapshot>;
}

const CANNED_LINES = [
  "Let's walk through the Q3 roadmap.",
  'I think we should prioritize the onboarding flow first.',
  'Can you share the doc after this call?',
  "Sounds good, let's follow up on Thursday."
];

export class StubAudioCapture implements AudioCapture {
  private started = false;
  private index = 0;

  start(): void {
    this.started = true;
  }

  stop(): void {
    this.started = false;
  }

  pullTranscript(): TranscriptChunk[] {
    if (!this.started) return [];
    const text = CANNED_LINES[this.index % CANNED_LINES.length];
    this.index += 1;
    return [{ timestamp: Date.now(), text, source: 'stub' }];
  }
}

export class StubScreenCapture implements ScreenCapture {
  async captureSnapshot(): Promise<ScreenSnapshot> {
    return {
      timestamp: Date.now(),
      summary:
        'Active window: Zoom meeting "Q3 Planning" with a shared slide titled "Roadmap Overview".'
    };
  }
}
