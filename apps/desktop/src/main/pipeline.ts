import type { BrowserWindow } from 'electron';
import type Database from 'better-sqlite3';
import { StubAudioCapture, StubScreenCapture } from '@mooly/capture';
import { assembleContext } from '@mooly/context';
import { StubProvider } from '@mooly/providers';
import { buildStyleProfile } from '@mooly/personalization';
import { insertTranscriptEntry, insertSuggestion } from '@mooly/storage';
import type { TranscriptChunk } from '@mooly/shared-types';

const TICK_INTERVAL_MS = 4000;

const SAMPLE_TONE_TEXT = [
  "Yeah I think we're gonna wanna ship the smaller version first, honestly.",
  "Let's circle back on the roadmap doc after this."
];

export function startPipeline(
  db: Database.Database,
  sessionId: number,
  overlayWindow: BrowserWindow
): () => void {
  const audioCapture = new StubAudioCapture();
  const screenCapture = new StubScreenCapture();
  const provider = new StubProvider();
  const styleProfile = buildStyleProfile(SAMPLE_TONE_TEXT);

  audioCapture.start();
  const transcriptBuffer: TranscriptChunk[] = [];

  const interval = setInterval(async () => {
    try {
      const newChunks = audioCapture.pullTranscript();
      for (const chunk of newChunks) {
        transcriptBuffer.push(chunk);
        insertTranscriptEntry(db, { sessionId, ...chunk });
      }

      const screenSnapshot = await screenCapture.captureSnapshot();
      const prompt = assembleContext(transcriptBuffer, screenSnapshot, styleProfile);

      let fullText = '';
      for await (const textChunk of provider.streamMessage(prompt)) {
        fullText += textChunk;
        if (!overlayWindow.isDestroyed()) {
          overlayWindow.webContents.send('suggestion:chunk', { text: textChunk, done: false });
        }
      }
      if (!overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('suggestion:chunk', { text: '', done: true });
      }

      insertSuggestion(db, { sessionId, timestamp: Date.now(), text: fullText.trim() });
    } catch (error) {
      console.error('[pipeline] tick failed, skipping this cycle', error);
    }
  }, TICK_INTERVAL_MS);

  return () => {
    clearInterval(interval);
    audioCapture.stop();
  };
}
