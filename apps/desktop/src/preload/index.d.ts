import type { AppSettings } from '@mooly/shared-types';

export interface SuggestionChunkPayload {
  text: string;
  done: boolean;
}

export {};

declare global {
  interface Window {
    mooly: {
      reportOverlayHover: (hovering: boolean) => void;
      getSettings: () => Promise<AppSettings>;
      setSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>;
      onSuggestionChunk: (callback: (payload: SuggestionChunkPayload) => void) => () => void;
    };
  }
}
