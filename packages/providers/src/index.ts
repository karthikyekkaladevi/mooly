import type { CompactPrompt } from '@mooly/shared-types';

export interface Provider {
  id: string;
  listModels(): Promise<string[]>;
  sendMessage(prompt: CompactPrompt): Promise<string>;
  streamMessage(prompt: CompactPrompt): AsyncGenerator<string, void, unknown>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface StubProviderOptions {
  cannedResponse?: string;
  chunkDelayMs?: number;
}

export class StubProvider implements Provider {
  id = 'stub';
  private cannedResponse: string;
  private chunkDelayMs: number;

  constructor(opts: StubProviderOptions = {}) {
    this.cannedResponse =
      opts.cannedResponse ??
      "Here's a thought: try summarizing the last point before moving to the next agenda item.";
    this.chunkDelayMs = opts.chunkDelayMs ?? 120;
  }

  async listModels(): Promise<string[]> {
    return ['stub-v1'];
  }

  async sendMessage(_prompt: CompactPrompt): Promise<string> {
    return this.cannedResponse;
  }

  async *streamMessage(_prompt: CompactPrompt): AsyncGenerator<string, void, unknown> {
    const words = this.cannedResponse.split(' ');
    for (const word of words) {
      if (this.chunkDelayMs > 0) {
        await delay(this.chunkDelayMs);
      }
      yield word + ' ';
    }
  }
}
