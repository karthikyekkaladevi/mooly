import { describe, it, expect } from 'vitest';
import { StubAudioCapture, StubScreenCapture } from './index';

describe('StubAudioCapture', () => {
  it('returns no transcript before start() is called', () => {
    const capture = new StubAudioCapture();
    expect(capture.pullTranscript()).toEqual([]);
  });

  it('returns one canned chunk per pull after start(), cycling through lines', () => {
    const capture = new StubAudioCapture();
    capture.start();
    const first = capture.pullTranscript();
    const second = capture.pullTranscript();
    expect(first.length).toBe(1);
    expect(second.length).toBe(1);
    expect(first[0].text).not.toBe('');
    expect(first[0].source).toBe('stub');
    expect(second[0].text).not.toBe(first[0].text);
  });

  it('returns no transcript after stop()', () => {
    const capture = new StubAudioCapture();
    capture.start();
    capture.pullTranscript();
    capture.stop();
    expect(capture.pullTranscript()).toEqual([]);
  });
});

describe('StubScreenCapture', () => {
  it('returns a snapshot with a non-empty summary and numeric timestamp', async () => {
    const capture = new StubScreenCapture();
    const snapshot = await capture.captureSnapshot();
    expect(typeof snapshot.summary).toBe('string');
    expect(snapshot.summary.length).toBeGreaterThan(0);
    expect(typeof snapshot.timestamp).toBe('number');
  });
});
