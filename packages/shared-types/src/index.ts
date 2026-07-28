export interface TranscriptChunk {
  timestamp: number;
  text: string;
  source: 'mic' | 'system' | 'stub';
}

export interface TranscriptEntry extends TranscriptChunk {
  id?: number;
  sessionId: number;
}

export interface ScreenSnapshot {
  timestamp: number;
  summary: string;
}

export interface StyleProfile {
  avgSentenceLength: number;
  topPhrases: string[];
  formality: 'casual' | 'neutral' | 'formal';
}

export interface CompactPrompt {
  transcriptExcerpt: string;
  screenSummary: string;
  styleNotes: string;
}

export interface Suggestion {
  id?: number;
  sessionId: number;
  timestamp: number;
  text: string;
}

export interface Session {
  id?: number;
  startedAt: number;
  endedAt?: number;
}

export interface ProviderConfig {
  providerId: string;
  model?: string;
  apiKey?: string;
}

export interface AppSettings {
  overlayOpacity: number;
  overlayX: number;
  overlayY: number;
  activeProvider: string;
  apiKeys: Record<string, string>;
}
