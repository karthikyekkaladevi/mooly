import { describe, it, expect } from 'vitest';
import { StubProvider } from './index';
import type { CompactPrompt } from '@mooly/shared-types';

const prompt: CompactPrompt = {
  transcriptExcerpt: 'test transcript',
  screenSummary: 'test screen',
  styleNotes: 'test style'
};

describe('StubProvider', () => {
  it('has a stable id', () => {
    const provider = new StubProvider();
    expect(provider.id).toBe('stub');
  });

  it('listModels returns a non-empty list', async () => {
    const provider = new StubProvider();
    const models = await provider.listModels();
    expect(models.length).toBeGreaterThan(0);
  });

  it('sendMessage returns the canned response', async () => {
    const provider = new StubProvider({ cannedResponse: 'hello world' });
    const result = await provider.sendMessage(prompt);
    expect(result).toBe('hello world');
  });

  it('streamMessage yields chunks that concatenate to the same response', async () => {
    const provider = new StubProvider({ cannedResponse: 'hello there world', chunkDelayMs: 0 });
    let joined = '';
    for await (const chunk of provider.streamMessage(prompt)) {
      joined += chunk;
    }
    expect(joined.trim()).toBe('hello there world');
  });

  it('streamMessage yields more than one chunk for a multi-word response', async () => {
    const provider = new StubProvider({ cannedResponse: 'a b c d', chunkDelayMs: 0 });
    const chunks: string[] = [];
    for await (const chunk of provider.streamMessage(prompt)) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBe(4);
  });
});
